# Tutorial Deployment di Windows 10 - Bebang Pack Meal Portal

Panduan langkah demi langkah untuk mendeploy aplikasi Bebang Pack Meal Portal di server Windows 10.

## Prasyarat (Requirements)

**Kebutuhan Server:**
- Windows 10 Pro/Enterprise (64-bit)
- Node.js versi 18.x atau lebih baru
- PostgreSQL versi 14.x atau lebih baru
- Nginx untuk Windows (sebagai reverse proxy)
- PM2 (process manager untuk Node.js)
- Minimum RAM: 2GB
- Minimum CPU: 2 core
- Ruang disk: 20GB

**Domain & SSL:**
- Nama domain yang sudah diarahkan ke IP server
- SSL certificate (bisa menggunakan Let's Encrypt - gratis)

---

## Langkah 1: Instalasi Software yang Diperlukan

### 1.1 Instalasi Node.js
1. Download Node.js 18.x dari [website resmi](https://nodejs.org/)
2. Jalankan installer dan ikuti wizard instalasi
3. Buka Command Prompt sebagai Administrator, verifikasi instalasi:
```powershell
node --version
npm --version
```

### 1.2 Instalasi PostgreSQL
1. Download PostgreSQL 14.x dari [website resmi](https://www.postgresql.org/download/windows/)
2. Jalankan installer
3. Catat password untuk user 'postgres'
4. Pilih port default (5432)
5. Setelah instalasi, verifikasi service PostgreSQL berjalan:
```powershell
net start postgresql-x64-14
```

### 1.3 Instalasi Nginx
1. Download Nginx untuk Windows dari [website resmi](http://nginx.org/en/download.html)
2. Extract file zip ke `C:\nginx`
3. Buka Command Prompt sebagai Administrator:
```powershell
cd C:\nginx
start nginx
```

### 1.4 Instalasi PM2
```powershell
npm install -g pm2
pm2 --version
```

## Langkah 2: Konfigurasi Project

### 2.1 Clone Repository
```powershell
# Buat direktori untuk project
mkdir C:\bebang-portal
cd C:\bebang-portal

# Clone repository
git clone [URL_REPOSITORY] .
```

### 2.2 Setup Backend
```powershell
cd backend
npm install

# Setup environment variables
copy .env.example .env

# Edit .env sesuai konfigurasi database dan network
# DATABASE_URL="postgresql://postgres:password@localhost:5432/bebang_portal"
# JWT_SECRET="your-secret-key"
# PORT=3000
# HOST=10.10.30.1  # Tambahkan ini agar API bisa diakses dari jaringan

# Generate Prisma client
npx prisma generate

# Migrate database
npx prisma migrate deploy

# Jika menggunakan PostgreSQL di jaringan, edit pg_hba.conf untuk mengizinkan koneksi:
# Lokasi: C:\Program Files\PostgreSQL\14\data\pg_hba.conf
# Tambahkan baris:
# host    all             all             10.10.30.0/24          md5
# Lalu restart PostgreSQL:
net stop postgresql-x64-14
net start postgresql-x64-14
```

### 2.3 Setup Frontend
```powershell
cd ..\frontend
npm install

# Setup environment variables
copy .env.example .env

# Edit .env dan sesuaikan - ganti dengan IP address server
# VITE_API_URL=http://10.10.30.1:3000
```

### 2.4 Konfigurasi Jaringan
1. Buka Windows Defender Firewall dengan Advanced Security
2. Tambahkan Inbound Rules untuk port berikut:
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3000 (Backend API)
   
```powershell
# Atau gunakan PowerShell untuk menambahkan rules
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Allow Backend API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

3. Verifikasi IP address bisa diakses:
```powershell
# Test koneksi ke port
Test-NetConnection -ComputerName 10.10.30.1 -Port 80
Test-NetConnection -ComputerName 10.10.30.1 -Port 3000
```

## Langkah 3: Konfigurasi Nginx

### 3.1 Edit file nginx.conf
Lokasi: `C:\nginx\conf\nginx.conf`

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;
    
    # Tambahan untuk handling network timeouts
    keepalive_timeout 65;
    client_max_body_size 50M;
    
    # CORS settings untuk akses dari jaringan
    map $http_origin $cors_origin {
        default "";
        "~^http://10\.10\.30\." "$http_origin";
        "~^https://10\.10\.30\." "$http_origin";
    }

    server {
        listen 80;
        # Bisa menggunakan IP address jika tidak ada domain
        server_name yourdomain.com 10.10.30.1;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;

        # Frontend
        location / {
            root C:/bebang-portal/frontend/dist;
            try_files $uri $uri/ /index.html;
            
            # Handle CORS preflight
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' $cors_origin;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain charset=UTF-8';
                add_header 'Content-Length' 0;
                return 204;
            }
        }

        # Backend API
        location /api {
            proxy_pass http://10.10.30.1:3000;  # Gunakan IP address
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # Timeouts untuk koneksi jaringan
            proxy_connect_timeout 60;
            proxy_send_timeout 60;
            proxy_read_timeout 60;
        }
    }
}
```

### 3.2 Test dan reload Nginx
```powershell
cd C:\nginx
nginx -t
nginx -s reload
```

## Langkah 4: Build dan Deploy

### 4.1 Build Frontend
```powershell
cd C:\bebang-portal\frontend
npm run build
```

### 4.2 Deploy Backend dengan PM2
```powershell
cd C:\bebang-portal\backend
pm2 start ecosystem.config.js
```

### 4.3 Verifikasi Deployment
1. Backend API seharusnya berjalan di `http://10.10.30.1:3000`
2. Frontend seharusnya bisa diakses di `http://10.10.30.1`
3. Periksa logs PM2:
```powershell
pm2 logs
```

### 4.4 Testing Akses Jaringan
1. Dari komputer lain dalam jaringan:
   - Buka browser dan akses `http://10.10.30.1`
   - Test API dengan mengakses `http://10.10.30.1/api/health` (jika endpoint tersedia)
   
2. Jika terjadi masalah koneksi:
   - Periksa Windows Firewall settings
   - Pastikan antivirus tidak memblokir koneksi
   - Verifikasi komputer client berada dalam jaringan yang sama
   - Test koneksi dengan ping:
   ```powershell
   ping 10.10.30.1
   ```
   
3. Monitoring koneksi aktif:
```powershell
netstat -an | findstr :80
netstat -an | findstr :3000
```

## Langkah 5: Setup SSL (HTTPS)

### 5.1 Instalasi Certbot
1. Download Certbot-Win dari [https://github.com/certbot/certbot](https://github.com/certbot/certbot)
2. Ikuti instruksi instalasi Certbot untuk Windows
3. Generate dan pasang SSL certificate:
```powershell
certbot --nginx -d yourdomain.com
```

## Langkah 6: Maintenance

### 6.1 Backup Database
```powershell
cd C:\Program Files\PostgreSQL\14\bin
pg_dump -U postgres bebang_portal > C:\backups\backup-%date:~10,4%%date:~4,2%%date:~7,2%.sql
```

### 6.2 Update Aplikasi
```powershell
cd C:\bebang-portal

# Pull perubahan terbaru
git pull

# Update dependencies dan rebuild
cd frontend
npm install
npm run build

cd ..\backend
npm install
pm2 restart all
```

### 6.3 Monitoring
- Periksa status PM2: `pm2 status`
- Periksa logs PM2: `pm2 logs`
- Periksa status Nginx: `cd C:\nginx && nginx -t`

## 14. Troubleshooting Guide dan Common Issues

### 14.1 Common Installation Issues

#### Masalah yang Umum Terjadi
- **Node.js Version Mismatch**: Aplikasi memerlukan Node.js 18+ namun versi yang terinstall tidak kompatibel
- **PostgreSQL Service Error**: Database service gagal start atau tidak dapat diakses
- **Permission Denied**: Hak akses tidak mencukupi untuk instalasi atau konfigurasi
- **Missing Dependencies**: Package npm atau sistem dependency yang hilang
- **Path Environment Issues**: Node.js atau npm tidak terdaftar di PATH system

#### Gejala dan Error Messages
```
Error: Cannot find module 'node:crypto'
ENOENT: no such file or directory, open 'package.json'
Error: connect ECONNREFUSED 127.0.0.1:5432
Access is denied. (os error 5)
'node' is not recognized as an internal or external command
```

#### Langkah Diagnosis dengan PowerShell
```powershell
# Cek versi Node.js dan npm
node --version
npm --version

# Cek service PostgreSQL
Get-Service -Name postgresql*
Test-NetConnection -ComputerName localhost -Port 5432

# Cek permission directory
Get-Acl "C:\bebang-portal" | Format-List

# Cek environment PATH
$env:PATH -split ';' | Where-Object { $_ -like "*node*" }

# Cek dependency issues
cd "C:\bebang-portal\backend"
npm doctor
npm audit
```

#### Solusi Step-by-Step
```powershell
# 1. Reinstall Node.js dengan versi yang benar
# Download dari https://nodejs.org (versi 18 LTS atau lebih tinggi)
# Restart PowerShell setelah instalasi

# 2. Fix permission issues
$acl = Get-Acl "C:\bebang-portal"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Users","FullControl","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($accessRule)
Set-Acl "C:\bebang-portal" $acl

# 3. Reinstall PostgreSQL service
Stop-Service postgresql*
# Reinstall PostgreSQL atau repair existing installation

# 4. Clean install dependencies
cd "C:\bebang-portal"
Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
npm cache clean --force
npm install
```

#### Prevention Tips
- Selalu gunakan Node.js LTS version terbaru
- Install Node.js sebagai Administrator
- Backup konfigurasi sebelum upgrade
- Gunakan npm ci untuk production installs
- Verifikasi permission sebelum deployment

### 14.2 Database Connection Issues

#### Masalah yang Umum Terjadi
- **Connection Timeout**: Database tidak merespons dalam waktu yang ditentukan
- **Authentication Failed**: Username/password atau connection string salah
- **Max Connections Reached**: Pool connection database penuh
- **Database Locked**: Concurrent access issues atau deadlock
- **Migration Failures**: Database schema tidak sync dengan aplikasi

#### Gejala dan Error Messages
```
Error: connect ETIMEDOUT
Error: password authentication failed for user "postgres"
Error: sorry, too many clients already
Error: relation "user" does not exist
Error: column "updated_at" does not exist
```

#### Langkah Diagnosis dengan PowerShell
```powershell
# Test database connectivity
Test-NetConnection -ComputerName localhost -Port 5432

# Check PostgreSQL service status
Get-Service -Name postgresql*
Get-Process -Name postgres -ErrorAction SilentlyContinue

# Test database connection dengan psql
psql -h localhost -p 5432 -U postgres -d bebang_pack_meal -c "\l"

# Check current connections
psql -h localhost -p 5432 -U postgres -d bebang_pack_meal -c "SELECT * FROM pg_stat_activity WHERE datname = 'bebang_pack_meal';"

# Verify schema dengan Prisma
cd "C:\bebang-portal\backend"
npx prisma db pull
npx prisma generate
```

#### Solusi Step-by-Step
```powershell
# 1. Fix PostgreSQL service issues
Stop-Service postgresql*
Start-Service postgresql*

# 2. Reset connection pool
cd "C:\bebang-portal\backend"
pm2 stop bebang-backend

# Clear connection pool
psql -h localhost -p 5432 -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'bebang_pack_meal' AND pid <> pg_backend_pid();"

# Restart backend
pm2 start bebang-backend

# 3. Fix migration issues
npx prisma migrate reset --force
npx prisma migrate deploy
npx prisma db seed

# 4. Configure PostgreSQL untuk akses network (jika diperlukan)
# Edit postgresql.conf untuk IP 10.10.30.207
$pgConfig = "C:\Program Files\PostgreSQL\14\data\postgresql.conf"
(Get-Content $pgConfig) -replace '#listen_addresses = ''localhost''', 'listen_addresses = ''*''' | Set-Content $pgConfig
(Get-Content $pgConfig) -replace '#max_connections = 100', 'max_connections = 200' | Set-Content $pgConfig

# Edit pg_hba.conf untuk jaringan 10.10.30.x
$pgHba = "C:\Program Files\PostgreSQL\14\data\pg_hba.conf"
Add-Content $pgHba "host    all             all             10.10.30.0/24          md5"

# Restart PostgreSQL
Restart-Service postgresql*
```

### 14.3 Network and Firewall Problems

#### Masalah yang Umum Terjadi
- **Port Blocking**: Windows Firewall atau network firewall memblokir port aplikasi
- **IP Access Issues**: Server 10.10.30.207 tidak dapat diakses dari client lain
- **Network Timeout**: Connection timeout karena network latency
- **Proxy Configuration**: Corporate proxy interfering dengan connections

#### Langkah Diagnosis dengan PowerShell
```powershell
# Test network connectivity ke server 10.10.30.207
Test-NetConnection -ComputerName 10.10.30.207 -Port 80
Test-NetConnection -ComputerName 10.10.30.207 -Port 443
Test-NetConnection -ComputerName 10.10.30.207 -Port 3000

# Check Windows Firewall rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*bebang*"}
Get-NetFirewallPortFilter | Where-Object {$_.LocalPort -eq 3000 -or $_.LocalPort -eq 80}

# Check network adapter configuration
Get-NetIPConfiguration
Get-NetIPAddress | Where-Object {$_.IPAddress -like "10.10.30.*"}
```

#### Solusi Step-by-Step
```powershell
# 1. Configure Windows Firewall untuk server 10.10.30.207
New-NetFirewallRule -DisplayName "Bebang Backend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "Bebang HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Bebang HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# 2. Test all network endpoints
$endpoints = @(
    "http://10.10.30.207",
    "http://10.10.30.207/api/health",
    "http://10.10.30.207:3000"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 10
        Write-Host "✓ $endpoint - Status: $($response.StatusCode)"
    } catch {
        Write-Host "✗ $endpoint - Error: $($_.Exception.Message)"
    }
}
```

### 14.4 Authentication and Authorization Issues

#### Masalah yang Umum Terjadi
- **Login Failures**: User tidak dapat login dengan credentials yang benar
- **Session Expiry**: JWT tokens expire terlalu cepat atau tidak di-refresh
- **Permission Denied**: User tidak memiliki akses ke fitur tertentu
- **CORS Authentication**: Authentication headers blocked oleh CORS policy

#### Langkah Diagnosis dengan PowerShell
```powershell
# Test login endpoint di server 10.10.30.207
$loginData = @{
    nik = "ADM001"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://10.10.30.207/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$response

# Check user in database
psql -h localhost -p 5432 -U postgres -d bebang_pack_meal -c "SELECT u.id, u.username, u.role, k.nik, k.nama FROM users u JOIN karyawan k ON u.karyawan_id = k.id WHERE k.nik = 'ADM001';"
```

#### Solusi Step-by-Step
```powershell
# 1. Fix CORS untuk authentication headers
cd "C:\bebang-portal\backend"
# Update .env dengan proper CORS untuk IP 10.10.30.207
$envContent = Get-Content ".env"
$envContent = $envContent -replace "CORS_ORIGIN=.*", "CORS_ORIGIN=http://10.10.30.207,https://10.10.30.207"
$envContent | Set-Content ".env"

# 2. Test authentication end-to-end
$testScript = @"
const axios = require('axios');

async function testAuth() {
  try {
    const loginResponse = await axios.post('http://10.10.30.207/api/auth/login', {
      nik: 'ADM001',
      password: 'admin123'
    });
    
    console.log('Login successful:', loginResponse.data.user);
    
  } catch (error) {
    console.error('Auth test failed:', error.response?.data || error.message);
  }
}

testAuth();
"@
$testScript | Out-File -FilePath "test-auth.js" -Encoding UTF8
node test-auth.js

pm2 restart bebang-backend
```

### 14.5 Performance Issues

#### Masalah yang Umum Terjadi
- **Slow Page Load Times**: Frontend membutuhkan waktu lama untuk load
- **High CPU Usage**: Server overloaded dengan high CPU utilization
- **Database Query Performance**: Slow queries menyebabkan timeout
- **Memory Usage Spikes**: Memory consumption naik drastis

#### Langkah Diagnosis dengan PowerShell
```powershell
# Monitor system performance
Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 5 -MaxSamples 12
Get-Counter "\Memory\Available MBytes" -SampleInterval 5 -MaxSamples 12

# Check process performance
Get-Process -Name node | Measure-Object WorkingSet -Average -Maximum
pm2 monit

# Monitor network performance ke IP 10.10.30.207
Test-NetConnection -ComputerName 10.10.30.207 -Port 3000 -InformationLevel Detailed
```

#### Solusi Step-by-Step
```powershell
# 1. Optimize database performance
psql -h localhost -p 5432 -U postgres -d bebang_pack_meal -c "
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pesanan_status ON pesanan(status_pesanan);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pesanan_created_at ON pesanan(created_at);
ANALYZE;
"

# 2. Optimize Node.js processes
pm2 stop all
# Update PM2 configuration
$pm2Config = @"
module.exports = {
  apps: [
    {
      name: 'bebang-backend',
      script: './dist/main.js',
      instances: 1,
      max_memory_restart: '400M',
      node_args: '--max-old-space-size=400',
      env_production: {
        NODE_ENV: 'production',
        HOST: '10.10.30.207'
      }
    }
  ]
};
"@
$pm2Config | Out-File -FilePath "C:\bebang-portal\backend\ecosystem.config.js" -Encoding UTF8
pm2 start ecosystem.config.js
```

### 14.6 Environment Variable Issues

#### Masalah yang Umum Terjadi
- **Missing Variables**: Required environment variables tidak ter-set
- **Incorrect IP Configuration**: Environment variables tidak sesuai dengan IP 10.10.30.207
- **Loading Issues**: Environment files tidak ter-load dengan benar

#### Langkah Diagnosis dengan PowerShell
```powershell
# Check backend environment variables
cd "C:\bebang-portal\backend"
Get-Content ".env" | Where-Object {$_ -and $_ -notlike "#*"}

# Verify required variables untuk server 10.10.30.207
$requiredVars = @(
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "JWT_SECRET",
    "CORS_ORIGIN",
    "HOST"
)

foreach ($var in $requiredVars) {
    $value = (Get-Content ".env" | Where-Object {$_ -like "$var=*"}) -replace "$var=", ""
    if ($value) {
        Write-Host "✓ $var = $value"
    } else {
        Write-Host "✗ $var = NOT SET" -ForegroundColor Red
    }
}
```

#### Solusi Step-by-Step
```powershell
# 1. Create proper backend environment file untuk IP 10.10.30.207
cd "C:\bebang-portal\backend"
$backendEnv = @"
NODE_ENV=production
PORT=3000
HOST=10.10.30.207
DATABASE_URL=postgresql://postgres:password@localhost:5432/bebang_pack_meal?schema=public
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://10.10.30.207,https://10.10.30.207
WS_PORT=3001
"@
$backendEnv | Out-File -FilePath ".env" -Encoding UTF8

# 2. Create proper frontend environment file
cd "C:\bebang-portal\frontend"
$frontendEnv = @"
VITE_API_BASE_URL=http://10.10.30.207/api
VITE_WS_URL=http://10.10.30.207:3001
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
"@
$frontendEnv | Out-File -FilePath ".env" -Encoding UTF8

# 3. Rebuild frontend dengan environment baru
npm run build

# Restart aplikasi
pm2 restart all
```

### 14.7 System Resource Problems

#### Masalah yang Umum Terjadi
- **High Memory Usage**: Aplikasi menggunakan memory berlebihan di server 10.10.30.207
- **Disk Space Issues**: Storage penuh atau hampir penuh
- **CPU Overload**: Processor usage terlalu tinggi

#### Langkah Diagnosis dengan PowerShell
```powershell
# Monitor system resources di server 10.10.30.207
Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 5 -MaxSamples 5
Get-Counter "\Memory\Available MBytes" -SampleInterval 5 -MaxSamples 5

# Check disk space
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace, @{Name="FreePercent";Expression={[math]::Round(($_.FreeSpace/$_.Size)*100,2)}}

# Monitor memory usage per process
Get-Process -Name node | Select-Object Name, Id, WorkingSet, VirtualMemorySize | Sort-Object WorkingSet -Descending

# Check PM2 processes
pm2 status
pm2 monit
```

#### Solusi Step-by-Step
```powershell
# 1. Free up disk space
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue

# Clean PM2 logs
pm2 flush

# 2. Setup automatic cleanup tasks
$cleanupScript = @"
# Cleanup script untuk Bebang Pack Meal Portal - Server 10.10.30.207
Write-Host "Starting cleanup at $(Get-Date)"

# Clean temp files
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cleaned temp files"

# Restart PM2 untuk clear memory leaks
pm2 restart all
Write-Host "Restarted PM2 processes"

# Test API accessibility
try {
    $response = Invoke-WebRequest -Uri "http://10.10.30.207/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ API health check passed"
} catch {
    Write-Warning "✗ API health check failed"
}

Write-Host "Cleanup completed at $(Get-Date)"
"@
$cleanupScript | Out-File -FilePath "C:\bebang-portal\cleanup.ps1" -Encoding UTF8

# Create scheduled task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\bebang-portal\cleanup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At "2:00AM"
Register-ScheduledTask -TaskName "BebangCleanup" -Action $action -Trigger $trigger
```

### Quick Reference Commands untuk Server 10.10.30.207

```powershell
# Health check semua services
Get-Service postgresql*; pm2 status; Test-NetConnection -ComputerName 10.10.30.207 -Port 80

# Restart semua components
Restart-Service postgresql*; pm2 restart all

# Monitor real-time
pm2 monit; Get-Counter "\Processor(_Total)\% Processor Time" -Continuous

# Emergency log collection
pm2 logs --lines 100 > logs.txt; Get-EventLog -LogName Application -Newest 50 >> logs.txt

# Test API endpoints
Invoke-WebRequest -Uri "http://10.10.30.207/api/health" -UseBasicParsing
Invoke-WebRequest -Uri "http://10.10.30.207" -UseBasicParsing

# Network connectivity test
Test-NetConnection -ComputerName 10.10.30.207 -Port 3000 -InformationLevel Detailed
```

## Catatan Penting
- Pastikan Windows Firewall mengizinkan port 80, 443, 3000, dan 3001
- Backup database secara berkala menggunakan pg_dump
- Monitor penggunaan resource server 10.10.30.207 secara regular
- Update Windows dan semua software secara berkala
- Simpan semua kredensial dengan aman
- Test konektivitas dari client machines secara periodic
- Dokumentasikan semua perubahan konfigurasi

---

Untuk bantuan lebih lanjut, silakan hubungi tim support atau buka issue di repository GitHub.

## 15. Backup dan Recovery Procedures

### Overview
Implementasi strategi backup dan recovery yang komprehensif untuk memastikan business continuity dan data protection pada Bebang Pack Meal Portal di server 10.10.30.207.

**Recovery Objectives:**
- **RTO (Recovery Time Objective)**: < 30 menit untuk critical systems
- **RPO (Recovery Point Objective)**: < 15 menit untuk database
- **Service Level**: 99.9% availability target

### 15.1 Database Backup Strategies

#### 15.1.1 PostgreSQL Backup Configuration
```powershell
# Setup environment variables
$env:PGPASSWORD = "YourDatabasePassword"
$BACKUP_DIR = "C:\Backups\Database"
$DB_HOST = "10.10.30.207"
$DB_NAME = "bebang_pack_meal"
$DB_USER = "postgres"

# Create backup directory
New-Item -ItemType Directory -Force -Path $BACKUP_DIR

# Daily full backup script
function Backup-Database {
    param(
        [string]$BackupType = "daily"
    )
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "$BACKUP_DIR\${DB_NAME}_${BackupType}_${timestamp}.sql"
    
    Write-Host "Starting $BackupType backup: $backupFile"
    
    # Create compressed backup
    & pg_dump.exe -h $DB_HOST -U $DB_USER -d $DB_NAME -f $backupFile --verbose --clean --if-exists
    
    if ($LASTEXITCODE -eq 0) {
        # Compress backup
        Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip" -CompressionLevel Optimal
        Remove-Item $backupFile
        
        Write-Host "Backup completed successfully: $backupFile.zip"
        return $true
    } else {
        Write-Error "Backup failed with exit code: $LASTEXITCODE"
        return $false
    }
}
```

#### 15.1.2 Automated Backup Scheduling
```powershell
# Create scheduled task for daily backup
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\daily-backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At "02:00AM"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "BPM_Daily_Backup" -Action $action -Trigger $trigger -Settings $settings -User "SYSTEM"

# Weekly full backup
$weeklyTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "01:00AM"
$weeklyAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\weekly-backup.ps1"

Register-ScheduledTask -TaskName "BPM_Weekly_Backup" -Action $weeklyAction -Trigger $weeklyTrigger -Settings $settings -User "SYSTEM"
```

#### 15.1.3 Point-in-Time Recovery Setup
```powershell
# Enable WAL archiving in postgresql.conf
# wal_level = replica
# archive_mode = on
# archive_command = 'copy "%p" "C:\PostgreSQL\Archives\%f"'

# WAL archive backup script
function Backup-WALFiles {
    $walDir = "C:\PostgreSQL\Data\pg_wal"
    $archiveDir = "C:\Backups\WAL"
    $timestamp = Get-Date -Format "yyyyMMdd"
    
    # Create daily WAL archive
    $dailyArchive = "$archiveDir\wal_$timestamp.zip"
    
    Get-ChildItem -Path $walDir -Filter "*.wal" |
    Compress-Archive -DestinationPath $dailyArchive -Update
    
    Write-Host "WAL files archived to: $dailyArchive"
}
```

### 15.2 Application Code Backup

#### 15.2.1 Application Files Backup
```powershell
# Application backup configuration
$APP_DIR = "C:\bebang-portal"
$BACKUP_ROOT = "C:\Backups\Application"
$CONFIG_DIR = "C:\Config\BPM"

function Backup-Application {
    param(
        [string]$BackupType = "daily"
    )
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$BACKUP_ROOT\$BackupType\app_$timestamp"
    
    # Create backup directory
    New-Item -ItemType Directory -Force -Path $backupPath
    
    # Backup application files
    Write-Host "Backing up application files..."
    Copy-Item -Path "$APP_DIR\*" -Destination "$backupPath\app" -Recurse -Force
    
    # Backup configuration files
    Write-Host "Backing up configuration files..."
    Copy-Item -Path "$CONFIG_DIR\*" -Destination "$backupPath\config" -Recurse -Force -ErrorAction SilentlyContinue
    
    # Backup environment files
    Copy-Item -Path "$APP_DIR\backend\.env" -Destination "$backupPath\config\backend.env" -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "$APP_DIR\frontend\.env" -Destination "$backupPath\config\frontend.env" -Force -ErrorAction SilentlyContinue
    
    # Create backup manifest
    $manifest = @{
        BackupType = $BackupType
        Timestamp = $timestamp
        ServerIP = "10.10.30.207"
        BackupPath = $backupPath
        Files = @{
            Application = (Get-ChildItem -Path "$backupPath\app" -Recurse | Measure-Object).Count
            Configuration = (Get-ChildItem -Path "$backupPath\config" -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
        }
    }
    
    $manifest | ConvertTo-Json | Out-File "$backupPath\manifest.json" -Encoding UTF8
    
    # Compress backup
    Compress-Archive -Path $backupPath -DestinationPath "$backupPath.zip" -CompressionLevel Optimal
    Remove-Item -Path $backupPath -Recurse -Force
    
    Write-Host "Application backup completed: $backupPath.zip"
    return "$backupPath.zip"
}
```

#### 15.2.2 Version Control Integration
```powershell
# Git repository backup
function Backup-SourceCode {
    $repoPath = "$APP_DIR"
    $backupPath = "$BACKUP_ROOT\source"
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    
    # Create bundle backup
    Set-Location $repoPath
    & git bundle create "$backupPath\repo_$timestamp.bundle" --all
    
    # Create source archive
    & git archive --format=zip --output="$backupPath\source_$timestamp.zip" HEAD
    
    Write-Host "Source code backup completed"
}
```

### 15.3 System Configuration Backup

#### 15.3.1 Windows System Configuration
```powershell
# System configuration backup
function Backup-SystemConfiguration {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $sysBackupPath = "$BACKUP_ROOT\System\sys_config_$timestamp"
    
    New-Item -ItemType Directory -Force -Path $sysBackupPath
    
    # Export registry keys
    $regKeys = @(
        "HKLM\SOFTWARE\PostgreSQL",
        "HKLM\SYSTEM\CurrentControlSet\Services\postgresql-x64-14"
    )
    
    foreach ($key in $regKeys) {
        $fileName = $key.Replace("\", "_").Replace(":", "") + ".reg"
        & reg export $key "$sysBackupPath\$fileName" /y 2>$null
    }
    
    # Export environment variables
    Get-ChildItem Env: | Out-File "$sysBackupPath\environment_variables.txt" -Encoding UTF8
    
    # Export Windows features
    Get-WindowsOptionalFeature -Online | Where-Object State -eq "Enabled" |
    Export-Csv "$sysBackupPath\windows_features.csv" -NoTypeInformation
    
    # Export firewall rules
    Get-NetFirewallRule | Export-Csv "$sysBackupPath\firewall_rules.csv" -NoTypeInformation
    
    # Backup SSL certificates
    Get-ChildItem -Path "Cert:\LocalMachine\My" | Where-Object { $_.Subject -like "*bebang*" } |
    ForEach-Object { Export-Certificate -Cert $_ -FilePath "$sysBackupPath\ssl_cert_$($_.Thumbprint).cer" -Type CERT }
    
    Write-Host "System configuration backup completed: $sysBackupPath"
}
```

#### 15.3.2 Nginx Configuration Backup
```powershell
# Nginx configuration backup
function Backup-NginxConfiguration {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $nginxBackupPath = "$BACKUP_ROOT\Nginx\nginx_config_$timestamp"
    
    New-Item -ItemType Directory -Force -Path $nginxBackupPath
    
    # Backup nginx configuration
    Copy-Item -Path "C:\nginx\conf\*" -Destination $nginxBackupPath -Recurse -Force
    
    # Backup custom configurations
    if (Test-Path "C:\nginx\conf.d") {
        Copy-Item -Path "C:\nginx\conf.d\*" -Destination "$nginxBackupPath\conf.d" -Recurse -Force
    }
    
    Write-Host "Nginx configuration backup completed: $nginxBackupPath"
}
```

### 15.4 Automated Backup Scripts

#### 15.4.1 Master Backup Script
```powershell
# Master backup orchestration script
# File: C:\Scripts\master-backup.ps1

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("daily", "weekly", "monthly")]
    [string]$BackupType = "daily",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipDatabase,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipApplication,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSystem
)

# Configuration
$SCRIPT_DIR = "C:\Scripts"
$LOG_DIR = "C:\Logs\Backup"
$BACKUP_ROOT = "C:\Backups"

# Logging setup
$logFile = "$LOG_DIR\backup_$(Get-Date -Format 'yyyyMMdd').log"
New-Item -ItemType Directory -Force -Path $LOG_DIR

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

try {
    Write-Log "Starting $BackupType backup process for server 10.10.30.207" "INFO"
    
    # Pre-backup validation
    Write-Log "Validating system prerequisites..." "INFO"
    
    # Check disk space (minimum 10GB)
    $freeSpace = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace / 1GB
    if ($freeSpace -lt 10) {
        throw "Insufficient disk space: ${freeSpace}GB available, minimum 10GB required"
    }
    
    # Check services
    $services = @("postgresql-x64-14")
    foreach ($service in $services) {
        $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
        if (-not $svc -or $svc.Status -ne "Running") {
            Write-Log "Warning: Service $service is not running" "WARN"
        }
    }
    
    $backupResults = @()
    
    # Database backup
    if (-not $SkipDatabase) {
        Write-Log "Starting database backup..." "INFO"
        $dbResult = Backup-Database -BackupType $BackupType
        $backupResults += @{ Type = "Database"; Success = $dbResult }
    }
    
    # Application backup
    if (-not $SkipApplication) {
        Write-Log "Starting application backup..." "INFO"
        $appResult = Backup-Application -BackupType $BackupType
        $backupResults += @{ Type = "Application"; Success = ($null -ne $appResult) }
    }
    
    # System configuration backup
    if (-not $SkipSystem) {
        Write-Log "Starting system configuration backup..." "INFO"
        Backup-SystemConfiguration
        Backup-NginxConfiguration
        $backupResults += @{ Type = "System"; Success = $true }
    }
    
    # Cleanup old backups (retention policy)
    Write-Log "Applying retention policy..." "INFO"
    Remove-OldBackups -BackupType $BackupType
    
    # Generate backup report
    $report = @{
        BackupType = $BackupType
        Timestamp = Get-Date
        Server = "10.10.30.207"
        Results = $backupResults
        DiskUsage = @{
            Before = $freeSpace
            After = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace / 1GB
        }
    }
    
    $report | ConvertTo-Json -Depth 3 | Out-File "$LOG_DIR\backup_report_$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    
    Write-Log "Backup process completed successfully" "INFO"
    
} catch {
    Write-Log "Backup process failed: $($_.Exception.Message)" "ERROR"
    throw
}
```

#### 15.4.2 Retention Policy Script
```powershell
# Backup retention and cleanup script
# File: C:\Scripts\backup-cleanup.ps1

function Remove-OldBackups {
    param(
        [string]$BackupType = "daily"
    )
    
    $retentionPolicies = @{
        daily = @{ Days = 30; Path = "$BACKUP_ROOT\Daily" }
        weekly = @{ Days = 90; Path = "$BACKUP_ROOT\Weekly" }
        monthly = @{ Days = 365; Path = "$BACKUP_ROOT\Monthly" }
    }
    
    $policy = $retentionPolicies[$BackupType]
    $cutoffDate = (Get-Date).AddDays(-$policy.Days)
    
    Write-Log "Cleaning up $BackupType backups older than $($policy.Days) days"
    
    if (Test-Path $policy.Path) {
        Get-ChildItem -Path $policy.Path -Recurse -File |
        Where-Object { $_.LastWriteTime -lt $cutoffDate } |
        ForEach-Object {
            Write-Log "Removing old backup: $($_.FullName)"
            Remove-Item $_.FullName -Force
        }
        
        # Remove empty directories
        Get-ChildItem -Path $policy.Path -Recurse -Directory |
        Where-Object { (Get-ChildItem $_.FullName -ErrorAction SilentlyContinue).Count -eq 0 } |
        Remove-Item -Force
    }
}
```

### 15.5 Backup Storage Management

#### 15.5.1 Local Storage Configuration
```powershell
# Local backup storage setup
$BACKUP_STRUCTURE = @{
    Root = "C:\Backups"
    Database = "C:\Backups\Database"
    Application = "C:\Backups\Application"
    System = "C:\Backups\System"
    Archives = "C:\Backups\Archives"
    Offsite = "C:\Backups\Offsite"
}

# Create backup directory structure
foreach ($path in $BACKUP_STRUCTURE.Values) {
    New-Item -ItemType Directory -Force -Path $path
}

# Configure NTFS permissions
foreach ($path in $BACKUP_STRUCTURE.Values) {
    $acl = Get-Acl $path
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.SetAccessRule($accessRule)
    Set-Acl -Path $path -AclObject $acl
}
```

#### 15.5.2 Off-site Backup Synchronization
```powershell
# Off-site backup synchronization
function Sync-OffsiteBackup {
    param(
        [string]$RemotePath = "\\backup-server\BPM-Backups\10.10.30.207",
        [string]$LocalPath = "C:\Backups"
    )
    
    # Test remote path availability
    if (-not (Test-Path $RemotePath)) {
        Write-Log "Remote backup path not available: $RemotePath" "ERROR"
        return $false
    }
    
    try {
        # Sync daily backups
        robocopy "$LocalPath\Database" "$RemotePath\Database" /MIR /Z /W:5 /R:3 /LOG:"$LOG_DIR\offsite_sync.log"
        robocopy "$LocalPath\Application" "$RemotePath\Application" /MIR /Z /W:5 /R:3 /LOG+:"$LOG_DIR\offsite_sync.log"
        robocopy "$LocalPath\System" "$RemotePath\System" /MIR /Z /W:5 /R:3 /LOG+:"$LOG_DIR\offsite_sync.log"
        
        Write-Log "Off-site backup synchronization completed"
        return $true
        
    } catch {
        Write-Log "Off-site sync failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}
```

### 15.6 Recovery Procedures

#### 15.6.1 Database Recovery
```powershell
# Database recovery procedures
function Restore-Database {
    param(
        [Parameter(Mandatory=$true)]
        [string]$BackupFile,
        
        [string]$TargetDatabase = "bebang_pack_meal",
        
        [switch]$PointInTime,
        
        [datetime]$RecoveryTime
    )
    
    $env:PGPASSWORD = "YourDatabasePassword"
    
    Write-Log "Starting database recovery from: $BackupFile"
    
    # Stop application services
    pm2 stop all
    
    try {
        # Drop existing connections
        & psql -h 10.10.30.207 -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$TargetDatabase';"
        
        # Drop and recreate database
        & psql -h 10.10.30.207 -U postgres -d postgres -c "DROP DATABASE IF EXISTS $TargetDatabase;"
        & psql -h 10.10.30.207 -U postgres -d postgres -c "CREATE DATABASE $TargetDatabase;"
        
        # Restore from backup
        if ($BackupFile.EndsWith(".zip")) {
            $tempDir = "$env:TEMP\db_restore"
            Expand-Archive -Path $BackupFile -DestinationPath $tempDir -Force
            $sqlFile = Get-ChildItem -Path $tempDir -Filter "*.sql" | Select-Object -First 1
            & psql -h 10.10.30.207 -U postgres -d $TargetDatabase -f $sqlFile.FullName
            Remove-Item -Path $tempDir -Recurse -Force
        } else {
            & psql -h 10.10.30.207 -U postgres -d $TargetDatabase -f $BackupFile
        }
        
        # Verify database integrity
        $result = & psql -h 10.10.30.207 -U postgres -d $TargetDatabase -c "SELECT COUNT(*) FROM pesanan;" 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Database recovery completed successfully"
            return $true
        } else {
            throw "Database recovery failed"
        }
        
    } finally {
        # Restart application services
        pm2 start all
    }
}
```

#### 15.6.2 Application Recovery
```powershell
# Application recovery procedures
function Restore-Application {
    param(
        [Parameter(Mandatory=$true)]
        [string]$BackupFile,
        
        [switch]$PreserveConfig
    )
    
    Write-Log "Starting application recovery from: $BackupFile"
    
    # Stop services
    pm2 stop all
    
    try {
        # Backup current config if preserving
        if ($PreserveConfig) {
            $configBackup = "$env:TEMP\current_config_$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Copy-Item -Path "$APP_DIR\backend\.env" -Destination "$configBackup.backend.env" -ErrorAction SilentlyContinue
            Copy-Item -Path "$APP_DIR\frontend\.env" -Destination "$configBackup.frontend.env" -ErrorAction SilentlyContinue
        }
        
        # Clear application directory (except .git)
        Get-ChildItem -Path $APP_DIR -Exclude .git | Remove-Item -Recurse -Force
        
        # Extract backup
        if ($BackupFile.EndsWith(".zip")) {
            Expand-Archive -Path $BackupFile -DestinationPath $APP_DIR -Force
        } else {
            Copy-Item -Path "$BackupFile\*" -Destination $APP_DIR -Recurse -Force
        }
        
        # Restore preserved config
        if ($PreserveConfig) {
            Copy-Item -Path "$configBackup.backend.env" -Destination "$APP_DIR\backend\.env" -Force -ErrorAction SilentlyContinue
            Copy-Item -Path "$configBackup.frontend.env" -Destination "$APP_DIR\frontend\.env" -Force -ErrorAction SilentlyContinue
            Remove-Item -Path "$configBackup.*" -Force
        }
        
        # Rebuild application
        Set-Location "$APP_DIR\frontend"
        npm install
        npm run build
        
        Set-Location "$APP_DIR\backend"
        npm install
        npx prisma generate
        
        Write-Log "Application recovery completed successfully"
        
    } finally {
        # Start services
        pm2 start all
    }
}
```

### 15.7 Disaster Recovery Planning

#### 15.7.1 Disaster Recovery Checklist
```powershell
# Disaster recovery execution checklist
function Start-DisasterRecovery {
    $checklist = @(
        @{ Step = 1; Task = "Assess damage and determine recovery scope"; Status = "Pending"; EstimatedTime = "5-10 min" },
        @{ Step = 2; Task = "Validate backup integrity"; Status = "Pending"; EstimatedTime = "10-15 min" },
        @{ Step = 3; Task = "Prepare recovery environment"; Status = "Pending"; EstimatedTime = "5-10 min" },
        @{ Step = 4; Task = "Restore database"; Status = "Pending"; EstimatedTime = "15-30 min" },
        @{ Step = 5; Task = "Restore application files"; Status = "Pending"; EstimatedTime = "10-20 min" },
        @{ Step = 6; Task = "Restore system configuration"; Status = "Pending"; EstimatedTime = "10-15 min" },
        @{ Step = 7; Task = "Validate system functionality"; Status = "Pending"; EstimatedTime = "15-30 min" },
        @{ Step = 8; Task = "Update network configuration"; Status = "Pending"; EstimatedTime = "5-10 min" },
        @{ Step = 9; Task = "Notify stakeholders"; Status = "Pending"; EstimatedTime = "5 min" },
        @{ Step = 10; Task = "Document recovery process"; Status = "Pending"; EstimatedTime = "10-15 min" }
    )
    
    Write-Host "Disaster Recovery Checklist for Server 10.10.30.207"
    Write-Host "=================================================="
    foreach ($item in $checklist) {
        Write-Host "Step $($item.Step): $($item.Task) - $($item.EstimatedTime)"
    }
    
    return $checklist
}

# Recovery time estimation
function Get-RecoveryTimeEstimate {
    $estimates = @{
        "Database Recovery" = "15-30 minutes"
        "Application Recovery" = "10-20 minutes"
        "System Configuration" = "10-15 minutes"
        "Network Configuration" = "5-10 minutes"
        "Testing and Validation" = "15-30 minutes"
        "Total Estimated RTO" = "55-105 minutes"
    }
    
    return $estimates
}
```

### 15.8 Backup Testing and Validation

#### 15.8.1 Backup Integrity Testing
```powershell
# Backup validation and integrity testing
function Test-BackupIntegrity {
    param(
        [Parameter(Mandatory=$true)]
        [string]$BackupPath,
        
        [ValidateSet("database", "application", "system")]
        [string]$BackupType
    )
    
    Write-Log "Testing backup integrity: $BackupPath"
    
    $results = @{
        BackupPath = $BackupPath
        BackupType = $BackupType
        Tests = @()
        OverallStatus = "Unknown"
    }
    
    # File integrity test
    if (Test-Path $BackupPath) {
        $results.Tests += @{ Test = "File Exists"; Status = "PASS" }
        
        # Size validation
        $fileSize = (Get-Item $BackupPath).Length
        if ($fileSize -gt 1MB) {
            $results.Tests += @{ Test = "File Size"; Status = "PASS"; Size = "$([math]::Round($fileSize/1MB, 2)) MB" }
        } else {
            $results.Tests += @{ Test = "File Size"; Status = "FAIL"; Size = "$([math]::Round($fileSize/1MB, 2)) MB" }
        }
        
        # Archive integrity (for zip files)
        if ($BackupPath.EndsWith(".zip")) {
            try {
                Add-Type -AssemblyName System.IO.Compression.FileSystem
                $archive = [System.IO.Compression.ZipFile]::OpenRead($BackupPath)
                $archive.Dispose()
                $results.Tests += @{ Test = "Archive Integrity"; Status = "PASS" }
            } catch {
                $results.Tests += @{ Test = "Archive Integrity"; Status = "FAIL"; Error = $_.Exception.Message }
            }
        }
        
        # Content validation based on type
        switch ($BackupType) {
            "database" {
                # Test database backup content
                if ($BackupPath.EndsWith(".zip")) {
                    $tempDir = "$env:TEMP\backup_test"
                    Expand-Archive -Path $BackupPath -DestinationPath $tempDir -Force
                    $sqlFile = Get-ChildItem -Path $tempDir -Filter "*.sql" | Select-Object -First 1
                    
                    if ($sqlFile -and (Get-Content $sqlFile.FullName | Select-String "CREATE TABLE" | Measure-Object).Count -gt 0) {
                        $results.Tests += @{ Test = "Database Content"; Status = "PASS" }
                    } else {
                        $results.Tests += @{ Test = "Database Content"; Status = "FAIL" }
                    }
                    
                    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
                }
            }
            "application" {
                # Test application backup content
                try {
                    Add-Type -AssemblyName System.IO.Compression.FileSystem
                    $archive = [System.IO.Compression.ZipFile]::OpenRead($BackupPath)
                    $hasBackendFiles = $archive.Entries | Where-Object { $_.FullName -like "*/backend/*" }
                    $hasFrontendFiles = $archive.Entries | Where-Object { $_.FullName -like "*/frontend/*" }
                    $archive.Dispose()
                    
                    if ($hasBackendFiles -and $hasFrontendFiles) {
                        $results.Tests += @{ Test = "Application Content"; Status = "PASS" }
                    } else {
                        $results.Tests += @{ Test = "Application Content"; Status = "FAIL" }
                    }
                } catch {
                    $results.Tests += @{ Test = "Application Content"; Status = "FAIL"; Error = $_.Exception.Message }
                }
            }
        }
        
    } else {
        $results.Tests += @{ Test = "File Exists"; Status = "FAIL" }
    }
    
    # Determine overall status
    $failedTests = $results.Tests | Where-Object { $_.Status -eq "FAIL" }
    if ($failedTests.Count -eq 0) {
        $results.OverallStatus = "PASS"
        Write-Log "Backup integrity test PASSED: $BackupPath"
    } else {
        $results.OverallStatus = "FAIL"
        Write-Log "Backup integrity test FAILED: $BackupPath" "ERROR"
    }
    
    return $results
}
```

#### 15.8.2 Recovery Testing
```powershell
# Automated recovery testing in isolated environment
function Test-RecoveryProcedure {
    param(
        [string]$TestEnvironmentPath = "C:\Recovery-Test",
        [string]$BackupDate
    )
    
    Write-Log "Starting recovery procedure test"
    
    # Create isolated test environment
    if (Test-Path $TestEnvironmentPath) {
        Remove-Item -Path $TestEnvironmentPath -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $TestEnvironmentPath
    
    try {
        # Test database backup integrity
        Write-Log "Testing database backup integrity..."
        $dbBackup = Get-ChildItem -Path "$BACKUP_ROOT\Database" -Filter "*$BackupDate*.sql.zip" | Select-Object -First 1
        if ($dbBackup) {
            $dbTestResult = Test-BackupIntegrity -BackupPath $dbBackup.FullName -BackupType "database"
        } else {
            $dbTestResult = @{ OverallStatus = "FAIL"; Error = "No database backup found for date: $BackupDate" }
        }
        
        # Test application backup integrity
        Write-Log "Testing application backup integrity..."
        $appBackup = Get-ChildItem -Path "$BACKUP_ROOT\Application" -Filter "*$BackupDate*.zip" | Select-Object -First 1
        if ($appBackup) {
            $appTestResult = Test-BackupIntegrity -BackupPath $appBackup.FullName -BackupType "application"
        } else {
            $appTestResult = @{ OverallStatus = "FAIL"; Error = "No application backup found for date: $BackupDate" }
        }
        
        # Generate test report
        $testReport = @{
            TestDate = Get-Date
            BackupDate = $BackupDate
            Server = "10.10.30.207"
            Results = @{
                Database = $dbTestResult
                Application = $appTestResult
            }
            Recommendations = @()
        }
        
        # Add recommendations based on test results
        if ($dbTestResult.OverallStatus -eq "FAIL") {
            $testReport.Recommendations += "Database backup integrity issues detected - investigate backup process"
        }
        if ($appTestResult.OverallStatus -eq "FAIL") {
            $testReport.Recommendations += "Application backup integrity issues detected - review backup configuration"
        }
        
        # Save test report
        $testReport | ConvertTo-Json -Depth 4 | Out-File "$LOG_DIR\recovery_test_$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        
        Write-Log "Recovery procedure test completed"
        return $testReport
        
    } finally {
        # Cleanup test environment
        Remove-Item -Path $TestEnvironmentPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}
```

### 15.9 Point-in-Time Recovery

#### 15.9.1 WAL-Based Point-in-Time Recovery
```powershell
# Point-in-time recovery implementation
function Restore-PointInTime {
    param(
        [Parameter(Mandatory=$true)]
        [datetime]$RecoveryTime,
        
        [string]$BaseBackupPath,
        [string]$WALPath = "C:\Backups\WAL"
    )
    
    Write-Log "Starting point-in-time recovery to: $RecoveryTime"
    
    # Find appropriate base backup
    if (-not $BaseBackupPath) {
        $BaseBackupPath = Get-ChildItem -Path "$BACKUP_ROOT\Database" -Filter "*.sql.zip" |
                         Where-Object { $_.LastWriteTime -le $RecoveryTime } |
                         Sort-Object LastWriteTime -Descending |
                         Select-Object -First 1 |
                         ForEach-Object { $_.FullName }
    }
    
    if (-not $BaseBackupPath) {
        throw "No suitable base backup found for recovery time: $RecoveryTime"
    }
    
    Write-Log "Using base backup: $BaseBackupPath"
    
    # Stop application services
    pm2 stop all
    
    try {
        # Restore base backup
        Write-Log "Restoring base backup..."
        $tempDB = "bebang_pack_meal_pitr"
        
        # Create temporary database for PITR
        & psql -h 10.10.30.207 -U postgres -d postgres -c "DROP DATABASE IF EXISTS $tempDB;"
        & psql -h 10.10.30.207 -U postgres -d postgres -c "CREATE DATABASE $tempDB;"
        
        # Restore base backup to temporary database
        if ($BaseBackupPath.EndsWith(".zip")) {
            $tempDir = "$env:TEMP\pitr_restore"
            Expand-Archive -Path $BaseBackupPath -DestinationPath $tempDir -Force
            $sqlFile = Get-ChildItem -Path $tempDir -Filter "*.sql" | Select-Object -First 1
            & psql -h 10.10.30.207 -U postgres -d $tempDB -f $sqlFile.FullName
            Remove-Item -Path $tempDir -Recurse -Force
        }
        
        # Apply WAL files up to recovery time (simplified implementation)
        Write-Log "Applying WAL files up to $RecoveryTime..."
        
        # Rename databases (original -> backup, PITR -> original)
        Write-Log "Finalizing point-in-time recovery..."
        $backupDbName = "bebang_pack_meal_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        & psql -h 10.10.30.207 -U postgres -d postgres -c "ALTER DATABASE bebang_pack_meal RENAME TO $backupDbName;"
        & psql -h 10.10.30.207 -U postgres -d postgres -c "ALTER DATABASE $tempDB RENAME TO bebang_pack_meal;"
        
        Write-Log "Point-in-time recovery completed successfully"
        
    } finally {
        # Restart application services
        pm2 start all
    }
}
```

### 15.10 Emergency Recovery Procedures

#### 15.10.1 Critical System Failure Response
```powershell
# Emergency response for critical system failures
function Start-CriticalFailureResponse {
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet("DatabaseDown", "ApplicationDown", "ServerDown", "NetworkDown")]
        [string]$FailureType,
        
        [switch]$AutoRecover = $false
    )
    
    Write-Log "CRITICAL FAILURE DETECTED: $FailureType on server 10.10.30.207" "CRITICAL"
    
    # Immediate assessment
    $failureResponse = @{
        FailureType = $FailureType
        DetectionTime = Get-Date
        Server = "10.10.30.207"
        ResponseActions = @()
        RecoveryTime = $null
        Status = "InProgress"
    }
    
    switch ($FailureType) {
        "DatabaseDown" {
            Write-Log "Responding to database failure..."
            
            # Check database service
            $pgService = Get-Service -Name "postgresql-x64-14" -ErrorAction SilentlyContinue
            if ($pgService.Status -ne "Running") {
                $failureResponse.ResponseActions += "Attempting to restart PostgreSQL service"
                Start-Service -Name "postgresql-x64-14"
                Start-Sleep -Seconds 30
            }
            
            # Test database connectivity
            try {
                & psql -h 10.10.30.207 -U postgres -d bebang_pack_meal -c "SELECT 1;" | Out-Null
                $failureResponse.ResponseActions += "Database connectivity restored"
                $failureResponse.Status = "Resolved"
            } catch {
                if ($AutoRecover) {
                    $failureResponse.ResponseActions += "Initiating emergency database recovery"
                    Start-EmergencyRecovery -RecoveryType "database"
                }
            }
        }
        
        "ApplicationDown" {
            Write-Log "Responding to application failure..."
            
            # Check PM2 processes
            $pm2Status = pm2 list | Out-String
            if ($pm2Status -notlike "*online*") {
                $failureResponse.ResponseActions += "Restarting PM2 processes"
                pm2 restart all
                Start-Sleep -Seconds 15
            }
            
            # Test application endpoints
            try {
                $response = Invoke-WebRequest -Uri "http://10.10.30.207/api/health" -TimeoutSec 10 -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    $failureResponse.ResponseActions += "Application endpoints responding"
                    $failureResponse.Status = "Resolved"
                }
            } catch {
                if ($AutoRecover) {
                    $failureResponse.ResponseActions += "Initiating emergency application recovery"
                    Start-EmergencyRecovery -RecoveryType "application"
                }
            }
        }
        
        "ServerDown" {
            Write-Log "Responding to server failure..."
            $failureResponse.ResponseActions += "Server-level failure requires manual intervention"
            $failureResponse.ResponseActions += "Contact system administrator immediately"
        }
    }
    
    $failureResponse.RecoveryTime = Get-Date
    
    # Log failure response
    $failureResponse | ConvertTo-Json -Depth 3 | Out-File "$LOG_DIR\failure_response_$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    
    return $failureResponse
}
```

#### 15.10.2 Emergency Recovery Function
```powershell
# Emergency quick recovery for critical services
function Start-EmergencyRecovery {
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet("database", "application", "both")]
        [string]$RecoveryType
    )
    
    Write-Log "EMERGENCY RECOVERY INITIATED: $RecoveryType for server 10.10.30.207" "CRITICAL"
    
    # Find latest backups automatically
    $latestDbBackup = Get-ChildItem -Path "$BACKUP_ROOT\Database" -Filter "*.zip" |
                     Sort-Object LastWriteTime -Descending |
                     Select-Object -First 1
    
    $latestAppBackup = Get-ChildItem -Path "$BACKUP_ROOT\Application" -Filter "*.zip" |
                      Sort-Object LastWriteTime -Descending |
                      Select-Object -First 1
    
    try {
        switch ($RecoveryType) {
            "database" {
                Write-Log "Emergency database recovery..."
                if ($latestDbBackup) {
                    Restore-Database -BackupFile $latestDbBackup.FullName
                } else {
                    throw "No database backup available for emergency recovery"
                }
            }
            "application" {
                Write-Log "Emergency application recovery..."
                if ($latestAppBackup) {
                    Restore-Application -BackupFile $latestAppBackup.FullName -PreserveConfig
                } else {
                    throw "No application backup available for emergency recovery"
                }
            }
            "both" {
                Write-Log "Emergency complete recovery..."
                if ($latestDbBackup) {
                    Restore-Database -BackupFile $latestDbBackup.FullName
                }
                if ($latestAppBackup) {
                    Restore-Application -BackupFile $latestAppBackup.FullName -PreserveConfig
                }
            }
        }
        
        # Quick health check
        Test-SystemHealth -Quick
        
        Write-Log "EMERGENCY RECOVERY COMPLETED" "CRITICAL"
        
    } catch {
        Write-Log "EMERGENCY RECOVERY FAILED: $($_.Exception.Message)" "CRITICAL"
        throw
    }
}
```

#### 15.10.3 Health Monitoring and Alerting
```powershell
# System health monitoring for proactive failure detection
function Test-SystemHealth {
    param(
        [switch]$Quick = $false,
        [switch]$SendAlerts = $true
    )
    
    $healthReport = @{
        Timestamp = Get-Date
        Server = "10.10.30.207"
        OverallStatus = "Unknown"
        Components = @()
        Alerts = @()
    }
    
    # Database health check
    try {
        & psql -h 10.10.30.207 -U postgres -d bebang_pack_meal -c "SELECT COUNT(*) FROM pesanan;" | Out-Null
        $healthReport.Components += @{ Component = "Database"; Status = "Healthy"; ResponseTime = "< 1s" }
    } catch {
        $healthReport.Components += @{ Component = "Database"; Status = "Failed"; Error = $_.Exception.Message }
        $healthReport.Alerts += "Database connectivity failed"
    }
    
    # Application health check
    try {
        $response = Invoke-WebRequest -Uri "http://10.10.30.207/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        $healthReport.Components += @{ Component = "Application"; Status = "Healthy"; StatusCode = $response.StatusCode }
    } catch {
        $healthReport.Components += @{ Component = "Application"; Status = "Failed"; Error = $_.Exception.Message }
        $healthReport.Alerts += "Application endpoint failed"
    }
    
    if (-not $Quick) {
        # Disk space check
        $freeSpace = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace / 1GB
        if ($freeSpace -lt 5) {
            $healthReport.Components += @{ Component = "DiskSpace"; Status = "Warning"; FreeSpace = "${freeSpace}GB" }
            $healthReport.Alerts += "Low disk space: ${freeSpace}GB remaining"
        } else {
            $healthReport.Components += @{ Component = "DiskSpace"; Status = "Healthy"; FreeSpace = "${freeSpace}GB" }
        }
        
        # Memory usage check
        $totalRAM = (Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB
        $freeRAM = (Get-WmiObject -Class Win32_OperatingSystem).FreePhysicalMemory / 1MB / 1024
        $usagePercent = [math]::Round((($totalRAM - $freeRAM) / $totalRAM) * 100, 2)
        
        if ($usagePercent -gt 90) {
            $healthReport.Components += @{ Component = "Memory"; Status = "Warning"; Usage = "${usagePercent}%" }
            $healthReport.Alerts += "High memory usage: ${usagePercent}%"
        } else {
            $healthReport.Components += @{ Component = "Memory"; Status = "Healthy"; Usage = "${usagePercent}%" }
        }
    }
    
    # Determine overall status
    $failedComponents = $healthReport.Components | Where-Object { $_.Status -eq "Failed" }
    $warningComponents = $healthReport.Components | Where-Object { $_.Status -eq "Warning" }
    
    if ($failedComponents.Count -gt 0) {
        $healthReport.OverallStatus = "Critical"
    } elseif ($warningComponents.Count -gt 0) {
        $healthReport.OverallStatus = "Warning"
    } else {
        $healthReport.OverallStatus = "Healthy"
    }
    
    # Send alerts if enabled
    if ($SendAlerts -and $healthReport.Alerts.Count -gt 0) {
        Send-HealthAlert -Alerts $healthReport.Alerts -Status $healthReport.OverallStatus
    }
    
    return $healthReport
}

# Health alert notification
function Send-HealthAlert {
    param(
        [string[]]$Alerts,
        [string]$Status
    )
    
    $alertMessage = @"
System Health Alert - Server 10.10.30.207
Status: $Status
Time: $(Get-Date)

Alerts:
$($Alerts | ForEach-Object { "- $_" } | Out-String)

Please investigate immediately.
"@
    
    # Log alert
    Write-Log "HEALTH ALERT: $Status - $($Alerts -join ', ')" "CRITICAL"
    
    # Write to Windows Event Log
    try {
        New-EventLog -LogName Application -Source "BPM-Portal" -ErrorAction SilentlyContinue
        Write-EventLog -LogName Application -Source "BPM-Portal" -EventId 1001 -EntryType Warning -Message $alertMessage
    } catch {
        Write-Log "Failed to write to Event Log: $($_.Exception.Message)" "ERROR"
    }
}
```

### Best Practices dan Recommendations

#### Production Environment Guidelines untuk Server 10.10.30.207

1. **Backup Schedule**:
   - Daily: 02:00 AM (database + application)
   - Weekly: Sunday 01:00 AM (full system)
   - Monthly: First Sunday (complete archive)

2. **Retention Policy**:
   - Daily backups: 30 days
   - Weekly backups: 90 days
   - Monthly backups: 1 year

3. **Storage Requirements**:
   - Minimum 50GB free space untuk backup storage
   - Off-site backup copy dalam 24 jam
   - Regular backup integrity testing

4. **Recovery Testing**:
   - Monthly recovery procedure test
   - Quarterly disaster recovery drill
   - Annual business continuity exercise

5. **Monitoring dan Alerting**:
   - Real-time health monitoring setiap 5 menit
   - Automated failure detection dan response
   - Escalation procedures untuk critical failures

6. **Documentation**:
   - Recovery procedures documentation yang up-to-date
   - Contact information untuk emergency situations
   - Regular updates terhadap recovery plans

#### Quick Reference Commands untuk Server 10.10.30.207

```powershell
# Health check semua services
Get-Service postgresql*; pm2 status; Test-NetConnection -ComputerName 10.10.30.207 -Port 80

# Restart semua components
Restart-Service postgresql*; pm2 restart all

# Monitor real-time performance
pm2 monit; Get-Counter "\Processor(_Total)\% Processor Time" -Continuous

# Emergency backup execution
C:\Scripts\master-backup.ps1 -BackupType daily

# Test backup integrity
Test-BackupIntegrity -BackupPath "C:\Backups\Database\latest.zip" -BackupType database

# Emergency recovery
Start-EmergencyRecovery -RecoveryType both

# System health check
Test-SystemHealth -SendAlerts

# Log collection untuk troubleshooting
pm2 logs --lines 100 > "$env:TEMP\emergency_logs.txt"
Get-EventLog -LogName Application -Source "BPM-Portal" -Newest 50 >> "$env:TEMP\emergency_logs.txt"
```

#### Contact Information dan Escalation

**Emergency Contacts:**
- System Administrator: [Your Contact]
- Database Administrator: [Your Contact]
- Network Administrator: [Your Contact]

**Escalation Matrix:**
- Level 1: Service degradation (< 4 hours)
- Level 2: Service outage (< 2 hours)
- Level 3: Complete failure (< 30 minutes)

---

**Catatan Penting:**
- Pastikan semua backup scripts dijalankan dengan privilege Administrator
- Test recovery procedures secara berkala dalam isolated environment
- Monitor disk space backup storage untuk mencegah backup failures
- Dokumentasikan semua recovery actions untuk audit trail
- Simpan backup credentials dengan aman dan terpisah