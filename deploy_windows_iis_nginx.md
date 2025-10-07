# Tutorial Deployment Windows 10 - IIS & Nginx

Tutorial lengkap untuk men-deploy aplikasi Bebang Pack Meal Portal di Windows 10 menggunakan Windows IIS atau Nginx sebagai reverse proxy.

## Network Configuration untuk IP 192.168.3.235/23

### Informasi Network Khusus
Deployment ini dikonfigurasi khusus untuk server dengan IP address **192.168.3.235/23**:

- **IP Address**: 192.168.3.235
- **Subnet Mask**: 255.255.254.0 (/23)
- **Network Range**: 192.168.2.0 - 192.168.3.255 (512 alamat IP)
- **Gateway**: Biasanya 192.168.2.1 atau 192.168.3.1 (sesuaikan dengan konfigurasi network)
- **DNS**: Gunakan DNS yang sesuai dengan infrastruktur jaringan Anda

### Verifikasi Network Configuration
```cmd
# Cek IP configuration detail
ipconfig /all

# Test connectivity ke gateway
ping 192.168.3.1
ping 192.168.2.1

# Test connectivity ke internet
ping 8.8.8.8
ping google.com

# Cek routing table
route print

# Test konektivitas dalam network range
ping 192.168.2.1
ping 192.168.3.254
```

### Persiapan Network untuk Deployment
```powershell
# Set static IP jika belum dikonfigurasi
# Ganti "Ethernet" dengan nama adapter yang sesuai
$adapterName = "Ethernet"
New-NetIPAddress -InterfaceAlias $adapterName -IPAddress "192.168.3.235" -PrefixLength 23 -DefaultGateway "192.168.3.1"
Set-DnsClientServerAddress -InterfaceAlias $adapterName -ServerAddresses "8.8.8.8", "8.8.4.4"

# Verifikasi konfigurasi
Get-NetIPConfiguration -InterfaceAlias $adapterName
```

## Daftar Isi

1. [Persiapan Sistem](#persiapan-sistem)
2. [Setup Database PostgreSQL](#setup-database-postgresql)
3. [Deployment dengan Windows IIS](#deployment-dengan-windows-iis)
4. [Deployment dengan Nginx](#deployment-dengan-nginx)
5. [Konfigurasi Backend (Node.js)](#konfigurasi-backend-nodejs)
6. [Konfigurasi Frontend (React SPA)](#konfigurasi-frontend-react-spa)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Service Management](#service-management)
9. [Monitoring & Logging](#monitoring--logging)
10. [Troubleshooting](#troubleshooting)

## Persiapan Sistem

### Spesifikasi Minimum
- **OS**: Windows 10 Pro/Enterprise (Version 1909 atau lebih baru)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 100GB free space
- **CPU**: Intel Core i5 atau setara
- **Network**: Akses internet untuk download dependencies

### Software Prerequisites

#### 1. Node.js Installation
```powershell
# Download dan install Node.js 18 LTS
# Dari https://nodejs.org/en/download/

# Verifikasi installation
node --version  # Should be v18.x.x atau lebih baru
npm --version   # Should be 9.x.x atau lebih baru
```

#### 2. Git Installation
```powershell
# Download dari https://git-scm.com/download/win
# Atau gunakan winget
winget install Git.Git

# Verifikasi installation
git --version
```

#### 3. Visual C++ Redistributable
```powershell
# Download dan install Visual C++ Redistributable
# Diperlukan untuk beberapa npm packages native
# https://docs.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist
```

#### 4. PowerShell 7 (Recommended)
```powershell
# Install PowerShell 7
winget install Microsoft.PowerShell

# Atau download dari GitHub releases
# https://github.com/PowerShell/PowerShell/releases
```

## Setup Database PostgreSQL

### 1. Install PostgreSQL
```powershell
# Download PostgreSQL 14+ dari https://www.postgresql.org/download/windows/
# Atau gunakan chocolatey
choco install postgresql --params '/Password:YourStrongPassword123'

# Atau gunaan winget
winget install PostgreSQL.PostgreSQL
```

### 2. Konfigurasi Database
```powershell
# Buka Command Prompt sebagai Administrator
# Navigate ke PostgreSQL bin directory
cd "C:\Program Files\PostgreSQL\14\bin"

# Login sebagai postgres user
psql -U postgres

# Create database dan user
CREATE DATABASE bebang_pack_meal;
CREATE USER bebang_user WITH ENCRYPTED PASSWORD 'bebang_password_123';
GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal TO bebang_user;

# Exit psql
\q
```

### 3. Configure PostgreSQL Service
```powershell
# Set PostgreSQL service untuk auto start
sc config postgresql-x64-14 start= auto

# Start service
net start postgresql-x64-14

# Verify service status
sc query postgresql-x64-14
```

### 4. Firewall Configuration
```powershell
# Allow PostgreSQL through Windows Firewall
netsh advfirewall firewall add rule name="PostgreSQL" dir=in action=allow protocol=TCP localport=5432
```

## Deployment dengan Windows IIS

### 1. Enable IIS Features

#### Via PowerShell (Administrator)
```powershell
# Enable IIS and required features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerManagementTools
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole

# Restart computer jika diperlukan
Restart-Computer
```

#### Via Control Panel
1. Buka "Turn Windows features on or off"
2. Expand "Internet Information Services"
3. Check semua features berikut:
   - Web Management Tools → IIS Management Console
   - World Wide Web Services → Common HTTP Features (semua)
   - World Wide Web Services → Security → Request Filtering
   - World Wide Web Services → Performance → Static Content Compression

### 2. Install URL Rewrite Module
```powershell
# Download URL Rewrite Module 2.1
# https://www.iis.net/downloads/microsoft/url-rewrite

# Install via PowerShell
$url = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
$output = "$env:TEMP\rewrite_amd64_en-US.msi"
Invoke-WebRequest -Uri $url -OutFile $output
Start-Process msiexec.exe -Wait -ArgumentList "/i $output /quiet"
```

### 3. Install IISNode
```powershell
# Download IISNode
# https://github.com/Azure/iisnode/releases

# Install IISNode untuk Node.js integration
$url = "https://github.com/Azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-x64.msi"
$output = "$env:TEMP\iisnode-full-v0.2.26-x64.msi"
Invoke-WebRequest -Uri $url -OutFile $output
Start-Process msiexec.exe -Wait -ArgumentList "/i $output /quiet"
```

### 4. Setup Application Directory
```powershell
# Create application directory
$appPath = "C:\inetpub\wwwroot\bebang-pack-meal"
New-Item -ItemType Directory -Force -Path $appPath

# Set permissions
icacls $appPath /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls $appPath /grant "IUSR:(OI)(CI)F" /T
```

### 5. Deploy Application Files
```powershell
# Clone repository
cd C:\inetpub\wwwroot
git clone https://github.com/username/bebang-pack-meal-portal.git bebang-pack-meal
cd bebang-pack-meal

# Install dependencies
npm install

# Generate Prisma client (PENTING: harus dilakukan sebelum build backend)
# Prisma client diperlukan oleh backend untuk akses database
npm run -w backend prisma generate

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend

# Copy production files
Copy-Item -Path "frontend\dist\*" -Destination "C:\inetpub\wwwroot\bebang-pack-meal\public" -Recurse -Force
```

**Catatan Penting**: Langkah `prisma generate` sangat penting karena:
- Backend menggunakan Prisma client untuk akses database
- Prisma client harus di-generate berdasarkan schema.prisma sebelum kompilasi TypeScript
- Tanpa generate client, build backend akan gagal karena import Prisma tidak ditemukan

### 6. Configure IIS Site dengan IP Binding Spesifik

#### Create new site via IIS Manager untuk IP 192.168.3.235
1. Buka IIS Manager
2. Klik kanan "Sites" → "Add Website"
3. Isi konfigurasi:
   ```
   Site name: BebangPackMeal
   Physical path: C:\inetpub\wwwroot\bebang-pack-meal
   Binding: HTTP, Port 80, IP Address: 192.168.3.235
   Host name: (kosongkan atau isi sesuai kebutuhan)
   ```

#### Configure via PowerShell dengan IP Spesifik
```powershell
# Import WebAdministration module
Import-Module WebAdministration

# Create new site dengan IP binding spesifik untuk 192.168.3.235
New-Website -Name "BebangPackMeal" -Port 80 -IPAddress "192.168.3.235" -PhysicalPath "C:\inetpub\wwwroot\bebang-pack-meal"

# Tambahkan binding alternatif untuk localhost (development/testing)
New-WebBinding -Name "BebangPackMeal" -Protocol http -Port 8080 -IPAddress "127.0.0.1"

# Tambahkan binding untuk akses dari network range
New-WebBinding -Name "BebangPackMeal" -Protocol http -Port 80 -IPAddress "*"

# Create application pool dengan konfigurasi optimal untuk production
New-WebAppPool -Name "BebangPackMealPool"
Set-ItemProperty -Path "IIS:\AppPools\BebangPackMealPool" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\BebangPackMealPool" -Name enable32BitAppOnWin64 -Value $false
Set-ItemProperty -Path "IIS:\AppPools\BebangPackMealPool" -Name recycling.periodicRestart.time -Value "00:00:00"
Set-ItemProperty -Path "IIS:\AppPools\BebangPackMealPool" -Name processModel.idleTimeout -Value "00:00:00"

# Assign application pool to site
Set-ItemProperty -Path "IIS:\Sites\BebangPackMeal" -Name applicationPool -Value "BebangPackMealPool"

# Verifikasi binding untuk IP spesifik
Get-WebBinding -Name "BebangPackMeal" | Format-Table
```

#### Konfigurasi Manual Binding IP Spesifik
1. Buka IIS Manager
2. Expand server node di panel kiri
3. Expand "Sites"
4. Klik kanan pada "BebangPackMeal" → "Edit Bindings..."
5. Klik "Add..." untuk menambah binding baru
6. Konfigurasi sebagai berikut:
   - **Type**: http
   - **IP address**: 192.168.3.235
   - **Port**: 80
   - **Host name**: (kosongkan untuk wildcard)
7. Klik "OK" untuk menyimpan
8. Untuk HTTPS (opsional):
   - **Type**: https
   - **IP address**: 192.168.3.235
   - **Port**: 443
   - **SSL certificate**: (pilih certificate yang sesuai)

### 7. Configure web.config for Backend
```xml
<!-- C:\inetpub\wwwroot\bebang-pack-meal\backend\web.config -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <webSocket enabled="false" />
    <handlers>
      <add name="iisnode" path="dist/main.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="StaticFiles" stopProcessing="true">
          <match url="^(?!api/).*" />
          <action type="Rewrite" url="public/{R:0}" />
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <match url="^api/(.*)" />
          <action type="Rewrite" url="backend/dist/main.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="1073741824" />
      </requestFiltering>
    </security>
    <iisnode 
      node_env="production"
      nodeProcessCommandLine="&quot;%ProgramFiles%\nodejs\node.exe&quot;"
      interceptor="&quot;%ProgramFiles%\iisnode\interceptor.js&quot;" />
  </system.webServer>
</configuration>
```

### 8. Configure web.config for Frontend
```xml
<!-- C:\inetpub\wwwroot\bebang-pack-meal\public\web.config -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
    <httpCompression>
      <scheme name="gzip" dll="%Windir%\system32\inetsrv\gzip.dll" />
      <dynamicTypes>
        <add mimeType="text/*" enabled="true" />
        <add mimeType="message/*" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
        <add mimeType="*/*" enabled="false" />
      </dynamicTypes>
      <staticTypes>
        <add mimeType="text/*" enabled="true" />
        <add mimeType="message/*" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
        <add mimeType="*/*" enabled="false" />
      </staticTypes>
    </httpCompression>
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />
  </system.webServer>
</configuration>
```

## Deployment dengan Nginx

### 1. Install Nginx for Windows
```powershell
# Download Nginx for Windows
# http://nginx.org/en/download.html

# Create nginx directory
New-Item -ItemType Directory -Force -Path "C:\nginx"

# Download dan extract nginx
$nginxUrl = "http://nginx.org/download/nginx-1.24.0.zip"
$nginxZip = "$env:TEMP\nginx-1.24.0.zip"
Invoke-WebRequest -Uri $nginxUrl -OutFile $nginxZip
Expand-Archive -Path $nginxZip -DestinationPath "C:\" -Force

# Rename directory
Rename-Item -Path "C:\nginx-1.24.0" -NewName "nginx"
```

### 2. Configure Nginx
```nginx
# C:\nginx\conf\nginx.conf

worker_processes auto;
error_log logs/error.log;
pid logs/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log logs/access.log main;
    
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Upstream for Node.js backend dengan IP spesifik
    upstream backend {
        server 192.168.3.235:3000;
        keepalive 32;
    }
    
    # Upstream for WebSocket dengan IP spesifik
    upstream websocket {
        server 192.168.3.235:3001;
    }

    # HTTP Server untuk IP spesifik 192.168.3.235
    server {
        listen 192.168.3.235:80;
        server_name 192.168.3.235 bebang-pack-meal.local;
        root C:/inetpub/wwwroot/bebang-pack-meal/frontend/dist;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # WebSocket routes
        location /socket.io/ {
            proxy_pass http://websocket;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files with caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }

        # Handle client-side routing (React Router)
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security - Hide nginx version
        server_tokens off;

        # Error pages
        error_page 404 /index.html;
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root html;
        }
    }
}
```

### 3. Install Nginx as Windows Service
```powershell
# Download NSSM (Non-Sucking Service Manager)
$nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
$nssmZip = "$env:TEMP\nssm-2.24.zip"
Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip
Expand-Archive -Path $nssmZip -DestinationPath "$env:TEMP" -Force

# Copy nssm.exe to system path
Copy-Item -Path "$env:TEMP\nssm-2.24\win64\nssm.exe" -Destination "C:\Windows\System32"

# Install nginx as service
nssm install nginx "C:\nginx\nginx.exe"
nssm set nginx AppDirectory "C:\nginx"
nssm set nginx Description "Nginx HTTP Server"
nssm set nginx Start SERVICE_AUTO_START

# Start nginx service
nssm start nginx

# Verify service status
sc query nginx
```

### 4. Nginx Management Scripts
```powershell
# Create management scripts
$scriptsPath = "C:\nginx\scripts"
New-Item -ItemType Directory -Force -Path $scriptsPath

# Start script
@"
@echo off
echo Starting Nginx...
nssm start nginx
if %errorlevel% == 0 (
    echo Nginx started successfully.
) else (
    echo Failed to start Nginx.
)
pause
"@ | Out-File -FilePath "$scriptsPath\start-nginx.bat" -Encoding ASCII

# Stop script
@"
@echo off
echo Stopping Nginx...
nssm stop nginx
if %errorlevel% == 0 (
    echo Nginx stopped successfully.
) else (
    echo Failed to stop Nginx.
)
pause
"@ | Out-File -FilePath "$scriptsPath\stop-nginx.bat" -Encoding ASCII

# Restart script
@"
@echo off
echo Restarting Nginx...
nssm restart nginx
if %errorlevel% == 0 (
    echo Nginx restarted successfully.
) else (
    echo Failed to restart Nginx.
)
pause
"@ | Out-File -FilePath "$scriptsPath\restart-nginx.bat" -Encoding ASCII

# Reload config script
@"
@echo off
echo Reloading Nginx configuration...
C:\nginx\nginx.exe -s reload
if %errorlevel% == 0 (
    echo Configuration reloaded successfully.
) else (
    echo Failed to reload configuration.
)
pause
"@ | Out-File -FilePath "$scriptsPath\reload-nginx.bat" -Encoding ASCII
```

## Konfigurasi Backend (Node.js)

### 1. Production Environment Variables
```powershell
# Create production environment file dengan konfigurasi IP spesifik
$envContent = @"
NODE_ENV=production
PORT=3000
WS_PORT=3001

# Network Configuration untuk IP 192.168.3.235/23
BIND_IP=192.168.3.235
SERVER_IP=192.168.3.235

# Database dengan IP spesifik (jika database di server yang sama)
DATABASE_URL=postgresql://bebang_user:bebang_password_123@192.168.3.235:5432/bebang_pack_meal?schema=public

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration untuk IP spesifik dan network range
CORS_ORIGIN=http://192.168.3.235,http://192.168.3.235:80,http://192.168.3.235:8080,http://bebang-pack-meal.local,http://localhost:5173

# Application Settings
API_PREFIX=api
LOG_LEVEL=info

# Network Security
ALLOWED_ORIGINS=http://192.168.3.235,http://192.168.3.235:80,http://192.168.3.235:8080
ALLOWED_IPS=192.168.2.0/23,127.0.0.1
TRUST_PROXY=true
"@

$envContent | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\backend\.env" -Encoding UTF8
```

### 2. Database Migration dan Seeding
```powershell
# Navigate to backend directory
cd "C:\inetpub\wwwroot\bebang-pack-meal\backend"

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed initial data
npm run prisma:seed

# Verify database setup
npm run prisma:studio
```

## Prisma Migration & Environment Configuration Detail

### 1. Prisma Migration Comprehensive Guide

#### Migration Commands Reference
```powershell
# Navigate to backend directory
cd "C:\inetpub\wwwroot\bebang-pack-meal\backend"

# Verify Prisma installation
npx prisma --version

# Validate database schema
npx prisma validate

# Check current migration status
npx prisma migrate status

# Apply pending migrations (production)
npx prisma migrate deploy

# Create new migration (development)
npx prisma migrate dev --name "descriptive_migration_name"

# Reset database (DANGEROUS - deletes all data!)
# npx prisma migrate reset --force

# Generate SQL preview of changes
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script

# Pull current database schema to Prisma
npx prisma db pull

# Push schema changes without migration (dev only)
# npx prisma db push
```

#### Data Seeding Enhancement
```powershell
# Check if seed script exists
if (Test-Path "prisma\seed.ts") {
    Write-Host "✓ Seed script found" -ForegroundColor Green
    
    # Run seeding
    npx prisma db seed
} else {
    Write-Host "Creating comprehensive seed script..." -ForegroundColor Yellow
    
    # Create comprehensive seed script
    $seedScript = @"
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Create Departments
  const departments = [
    { nama: 'IT', deskripsi: 'Information Technology' },
    { nama: 'HR', deskripsi: 'Human Resources' },
    { nama: 'Finance', deskripsi: 'Finance & Accounting' },
    { nama: 'Operations', deskripsi: 'Operations Management' }
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { nama: dept.nama },
      update: {},
      create: dept
    })
  }

  // Create Jabatan
  const jabatan = [
    { nama: 'Manager', deskripsi: 'Department Manager' },
    { nama: 'Staff', deskripsi: 'Regular Staff' },
    { nama: 'Supervisor', deskripsi: 'Team Supervisor' },
    { nama: 'Admin', deskripsi: 'Administrator' }
  ]

  for (const job of jabatan) {
    await prisma.jabatan.upsert({
      where: { nama: job.nama },
      update: {},
      create: job
    })
  }

  // Create Shifts
  const shifts = [
    { nama: 'Pagi', jamMulai: '08:00', jamSelesai: '16:00' },
    { nama: 'Siang', jamMulai: '16:00', jamSelesai: '00:00' },
    { nama: 'Malam', jamMulai: '00:00', jamSelesai: '08:00' }
  ]

  for (const shift of shifts) {
    await prisma.shift.upsert({
      where: { nama: shift.nama },
      update: {},
      create: shift
    })
  }

  // Create default users with different roles
  const users = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'administrator'
    },
    {
      username: 'kitchen01',
      password: 'kitchen123',
      role: 'dapur'
    },
    {
      username: 'delivery01',
      password: 'delivery123',
      role: 'delivery'
    }
  ]

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10)
    
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        passwordHash: hashedPassword,
        role: user.role
      }
    })
  }

  console.log('Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
"@
    
    $seedScript | Out-File -FilePath "prisma\seed.ts" -Encoding UTF8
    
    # Update package.json for seeding if not exists
    $packageJsonPath = "package.json"
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    
    if (-not $packageJson.prisma) {
        $packageJson | Add-Member -NotePropertyName "prisma" -NotePropertyValue @{}
    }
    
    $packageJson.prisma.seed = "tsx prisma/seed.ts"
    $packageJson | ConvertTo-Json -Depth 10 | Out-File $packageJsonPath -Encoding UTF8
    
    Write-Host "✓ Comprehensive seed script created" -ForegroundColor Green
    
    # Run the new seed script
    npx prisma db seed
}
```

### 2. Enhanced Backend Environment Configuration

#### Comprehensive .env Configuration
```powershell
# Create detailed production environment file
$envContent = @"
# ===================================================================
# BEBANG PACK MEAL PORTAL - BACKEND PRODUCTION CONFIGURATION
# ===================================================================

# Application Environment
NODE_ENV=production
PORT=3000
WS_PORT=3001

# ===================================================================
# DATABASE CONFIGURATION
# ===================================================================
# Main database connection
DATABASE_URL=postgresql://bebang_user:bebang_password_123@localhost:5432/bebang_pack_meal?schema=public

# Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_TIMEOUT=30000

# ===================================================================
# JWT AUTHENTICATION CONFIGURATION
# ===================================================================
# CRITICAL: Replace with secure secrets for production!
JWT_SECRET=generate-secure-64-char-secret-key-for-production-deployment
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=generate-secure-64-char-refresh-secret-key-for-production
JWT_REFRESH_EXPIRES_IN=7d

# ===================================================================
# CORS CONFIGURATION
# ===================================================================
CORS_ORIGIN=http://localhost,http://localhost:80,https://localhost:443,http://bebang-pack-meal.local
CORS_CREDENTIALS=true

# ===================================================================
# APPLICATION SETTINGS
# ===================================================================
API_PREFIX=api
LOG_LEVEL=info
LOG_FILE=logs/backend.log

# ===================================================================
# SECURITY CONFIGURATION
# ===================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
HELMET_ENABLED=true
CSP_ENABLED=true

# ===================================================================
# FILE UPLOAD CONFIGURATION
# ===================================================================
MAX_FILE_SIZE=104857600
UPLOAD_DIR=uploads

# ===================================================================
# EMAIL CONFIGURATION (Optional)
# ===================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
EMAIL_FROM=Bebang Pack Meal Portal <no-reply@bebang-pack-meal.local>

# ===================================================================
# MONITORING & HEALTH CHECKS
# ===================================================================
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_ENDPOINT=/health
METRICS_ENABLED=true

# ===================================================================
# BACKUP CONFIGURATION
# ===================================================================
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# ===================================================================
# WEBSOCKET CONFIGURATION
# ===================================================================
WS_CORS_ORIGIN=http://localhost:5173,http://localhost,https://localhost
WS_TRANSPORTS=websocket,polling

# ===================================================================
# PRISMA CONFIGURATION
# ===================================================================
PRISMA_QUERY_ENGINE_LIBRARY=query_engine
PRISMA_CLI_QUERY_ENGINE_TYPE=library
"@

$envContent | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\backend\.env" -Encoding UTF8
Write-Host "✓ Comprehensive backend environment file created" -ForegroundColor Green
```

#### JWT Secret Generation
```powershell
# Generate cryptographically secure JWT secrets
Write-Host "Generating secure JWT secrets..." -ForegroundColor Cyan

$jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
$jwtRefreshSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

Write-Host "Generated JWT secrets:" -ForegroundColor Green
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Gray
Write-Host "JWT_REFRESH_SECRET=$jwtRefreshSecret" -ForegroundColor Gray

# Update .env file with generated secrets
$envFile = "C:\inetpub\wwwroot\bebang-pack-meal\backend\.env"
(Get-Content $envFile) | ForEach-Object {
    $_ -replace "JWT_SECRET=generate-secure-64-char-secret-key-for-production-deployment", "JWT_SECRET=$jwtSecret" `
       -replace "JWT_REFRESH_SECRET=generate-secure-64-char-refresh-secret-key-for-production", "JWT_REFRESH_SECRET=$jwtRefreshSecret"
} | Set-Content $envFile

Write-Host "✓ Environment file updated with secure secrets" -ForegroundColor Green
```

### 3. Enhanced Frontend Environment Configuration

#### Comprehensive Frontend .env.production
```powershell
# Navigate to frontend directory
cd "C:\inetpub\wwwroot\bebang-pack-meal\frontend"

# Create comprehensive frontend environment
$frontendEnv = @"
# ===================================================================
# BEBANG PACK MEAL PORTAL - FRONTEND PRODUCTION CONFIGURATION
# ===================================================================

# Application Environment
VITE_NODE_ENV=production

# ===================================================================
# API CONFIGURATION
# ===================================================================
VITE_API_BASE_URL=http://localhost/api
VITE_WS_URL=ws://localhost:3001
VITE_API_TIMEOUT=30000

# ===================================================================
# APPLICATION METADATA
# ===================================================================
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_SHORT_NAME=BPM Portal
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Portal untuk mengelola alur pack meal end-to-end
VITE_COMPANY_NAME=Bebang Corporation

# ===================================================================
# THEME CONFIGURATION
# ===================================================================
VITE_DEFAULT_THEME=light
VITE_THEME_STORAGE_KEY=bebang-theme
VITE_PRIMARY_COLOR=#10B981
VITE_SECONDARY_COLOR=#FBBF24

# ===================================================================
# FEATURE FLAGS
# ===================================================================
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=false

# ===================================================================
# PWA CONFIGURATION
# ===================================================================
VITE_PWA_ENABLED=true
VITE_PWA_UPDATE_STRATEGY=prompt
VITE_PWA_CACHE_STRATEGY=networkFirst

# ===================================================================
# SECURITY CONFIGURATION
# ===================================================================
VITE_CSP_ENABLED=true
VITE_SECURE_HEADERS=true

# ===================================================================
# PERFORMANCE CONFIGURATION
# ===================================================================
VITE_ENABLE_LAZY_LOADING=true
VITE_ENABLE_IMAGE_OPTIMIZATION=true
VITE_ENABLE_TREE_SHAKING=true

# ===================================================================
# AUTHENTICATION CONFIGURATION
# ===================================================================
VITE_TOKEN_STORAGE_TYPE=localStorage
VITE_TOKEN_REFRESH_THRESHOLD=300000
VITE_SESSION_TIMEOUT=3600000

# ===================================================================
# LOGGING CONFIGURATION
# ===================================================================
VITE_LOG_LEVEL=error
VITE_ENABLE_CONSOLE_LOGS=false
VITE_ENABLE_ERROR_REPORTING=true

# ===================================================================
# CACHE CONFIGURATION
# ===================================================================
VITE_CACHE_VERSION=v1.0.0
VITE_CACHE_MAX_AGE=86400000
VITE_STATIC_CACHE_ENABLED=true
"@

$frontendEnv | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Host "✓ Comprehensive frontend environment file created" -ForegroundColor Green
```

### 4. Environment Validation & Security

#### Backend Environment Validation
```powershell
# Create environment validation script
$validationScript = @"
# Environment Validation Script
param([string]`$EnvFile = "C:\inetpub\wwwroot\bebang-pack-meal\backend\.env")

function Test-EnvVariable {
    param(`$Name, `$Value, `$Required = `$true, `$MinLength = 0)
    
    if (`$Required -and [string]::IsNullOrEmpty(`$Value)) {
        Write-Host "✗ `$Name is required but not set" -ForegroundColor Red
        return `$false
    }
    
    if (`$MinLength -gt 0 -and `$Value.Length -lt `$MinLength) {
        Write-Host "✗ `$Name must be at least `$MinLength characters" -ForegroundColor Red
        return `$false
    }
    
    Write-Host "✓ `$Name is valid" -ForegroundColor Green
    return `$true
}

Write-Host "Validating backend environment..." -ForegroundColor Cyan

if (-not (Test-Path `$EnvFile)) {
    Write-Host "✗ Environment file not found: `$EnvFile" -ForegroundColor Red
    exit 1
}

# Parse environment variables
`$envVars = @{}
Get-Content `$EnvFile | ForEach-Object {
    if (`$_ -match '^([^#][^=]+)=(.*)$') {
        `$envVars[`$matches[1].Trim()] = `$matches[2].Trim()
    }
}

# Validate critical variables
`$valid = `$true
`$valid = (Test-EnvVariable "NODE_ENV" `$envVars["NODE_ENV"] `$true 3) -and `$valid
`$valid = (Test-EnvVariable "DATABASE_URL" `$envVars["DATABASE_URL"] `$true 20) -and `$valid
`$valid = (Test-EnvVariable "JWT_SECRET" `$envVars["JWT_SECRET"] `$true 32) -and `$valid
`$valid = (Test-EnvVariable "JWT_REFRESH_SECRET" `$envVars["JWT_REFRESH_SECRET"] `$true 32) -and `$valid

# Check for insecure defaults
if (`$envVars["JWT_SECRET"] -like "*generate-secure*") {
    Write-Host "✗ JWT_SECRET contains default placeholder" -ForegroundColor Red
    `$valid = `$false
}

if (`$envVars["DATABASE_URL"] -like "*password123*") {
    Write-Host "⚠️  Database password appears to be default/weak" -ForegroundColor Yellow
}

if (`$valid) {
    Write-Host "✓ Environment validation passed" -ForegroundColor Green
} else {
    Write-Host "✗ Environment validation failed" -ForegroundColor Red
    exit 1
}
"@

$validationScript | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\scripts\validate-env.ps1" -Encoding UTF8

# Run validation
PowerShell -File "C:\inetpub\wwwroot\bebang-pack-meal\scripts\validate-env.ps1"
```

### 5. Migration Troubleshooting

#### Common Migration Issues & Solutions
```powershell
# Comprehensive migration troubleshooting
Write-Host "Prisma Migration Troubleshooting Guide" -ForegroundColor Cyan

# Check Prisma installation
Write-Host "1. Checking Prisma installation..." -ForegroundColor Yellow
npx prisma --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing Prisma..." -ForegroundColor Yellow
    npm install prisma @prisma/client
}

# Validate schema
Write-Host "2. Validating Prisma schema..." -ForegroundColor Yellow
npx prisma validate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Schema validation failed. Check prisma/schema.prisma" -ForegroundColor Red
    exit 1
}

# Check database connection
Write-Host "3. Testing database connection..." -ForegroundColor Yellow
npx prisma db execute --stdin <<< "SELECT 1 as test;"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database connection successful" -ForegroundColor Green
} else {
    Write-Host "✗ Database connection failed" -ForegroundColor Red
    Write-Host "Check DATABASE_URL in .env file" -ForegroundColor Yellow
}

# Check migration status
Write-Host "4. Checking migration status..." -ForegroundColor Yellow
npx prisma migrate status
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database is up to date" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migrations needed. Running migrate deploy..." -ForegroundColor Yellow
    npx prisma migrate deploy
}

# Generate Prisma client
Write-Host "5. Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma client generated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Client generation failed" -ForegroundColor Red
}

# Test client connection
Write-Host "6. Testing Prisma client..." -ForegroundColor Yellow
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✓ Prisma client connected successfully');
    return prisma.\$disconnect();
  })
  .catch(err => {
    console.log('✗ Prisma client connection failed:', err.message);
    process.exit(1);
  });
"

Write-Host "Migration troubleshooting completed!" -ForegroundColor Green
```


### 3. Install PM2 untuk Process Management
```powershell
# Install PM2 globally
npm install -g pm2
npm install -g pm2-windows-service

# Install PM2 as Windows service
pm2-service-install -n PM2

# Create PM2 configuration
$pm2Config = @"
{
  "apps": [
    {
      "name": "bebang-backend",
      "script": "dist/main.js",
      "cwd": "C:/inetpub/wwwroot/bebang-pack-meal/backend",
      "instances": 2,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": "3000",
        "WS_PORT": "3001"
      },
      "log_file": "C:/inetpub/wwwroot/bebang-pack-meal/logs/backend.log",
      "error_file": "C:/inetpub/wwwroot/bebang-pack-meal/logs/backend-error.log",
      "out_file": "C:/inetpub/wwwroot/bebang-pack-meal/logs/backend-out.log",
      "max_memory_restart": "1G",
      "node_args": "--max-old-space-size=1024"
    }
  ]
}
"@

# Save PM2 configuration
$pm2Config | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\ecosystem.config.json" -Encoding UTF8

# Start applications with PM2
cd "C:\inetpub\wwwroot\bebang-pack-meal"
pm2 start ecosystem.config.json

# Save PM2 configuration
pm2 save

# Generate PM2 startup script
pm2 startup
```

### 4. Backend Service Management Script
```powershell
# Create backend management script
$backendScript = @"
@echo off
set /p action="Enter action (start/stop/restart/status/logs): "

if "%action%"=="start" (
    echo Starting backend services...
    pm2 start ecosystem.config.json
    goto end
)

if "%action%"=="stop" (
    echo Stopping backend services...
    pm2 stop bebang-backend
    goto end
)

if "%action%"=="restart" (
    echo Restarting backend services...
    pm2 restart bebang-backend
    goto end
)

if "%action%"=="status" (
    echo Backend service status:
    pm2 status
    goto end
)

if "%action%"=="logs" (
    echo Showing backend logs:
    pm2 logs bebang-backend
    goto end
)

echo Invalid action. Use: start, stop, restart, status, or logs

:end
pause
"@

$backendScript | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\manage-backend.bat" -Encoding ASCII
```

## Konfigurasi Frontend (React SPA)

### 1. Production Build Configuration
```powershell
# Navigate to frontend directory
cd "C:\inetpub\wwwroot\bebang-pack-meal\frontend"

# Create production environment file dengan konfigurasi IP spesifik
$frontendEnv = @"
VITE_NODE_ENV=production

# API Configuration untuk IP spesifik
VITE_API_BASE_URL=http://192.168.3.235/api
VITE_WS_URL=ws://192.168.3.235:3001
VITE_API_TIMEOUT=30000

# Application Info
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0

# Network Configuration
VITE_SERVER_IP=192.168.3.235
VITE_SERVER_PORT=80
VITE_WS_PORT=3001

# Feature Flags untuk production
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_DEBUG_MODE=false

# Security Configuration
VITE_CSP_ENABLED=true
VITE_SECURE_HEADERS=true
"@

$frontendEnv | Out-File -FilePath ".env.production" -Encoding UTF8

### 2. Update Axios Configuration untuk IP Spesifik

Update file `frontend/src/lib/axios.ts` untuk menggunakan IP spesifik:

```typescript
// Konfigurasi base URL dari environment variable dengan fallback IP spesifik
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.3.235/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Konfigurasi untuk network dengan latensi yang mungkin lebih tinggi
  validateStatus: (status) => status < 500,
  withCredentials: true,
});

// Add request interceptor untuk logging di development
axiosInstance.interceptors.request.use(
  (config) => {
    if (import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor untuk error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'NETWORK_ERROR') {
      console.error('Network Error - Check connection to 192.168.3.235');
    }
    return Promise.reject(error);
  }
);
```

### 3. Update WebSocket Configuration untuk IP Spesifik

```typescript
// Di file socket manager
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://192.168.3.235:3001';

const socket = io(WS_URL, {
  transports: ['websocket'],
  upgrade: true,
  rememberUpgrade: true,
  // Konfigurasi untuk network dengan latensi tinggi
  timeout: 20000,
  retries: 3,
  // Reconnection configuration
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  // Force WebSocket transport untuk stabilitas
  forceNew: false,
});
```

# Build for production
npm run build

# Verify build output
Get-ChildItem "dist" -Recurse
```

### 2. Static File Optimization
```powershell
# Install serve untuk static file serving (alternative)
npm install -g serve

# Create optimized static file structure
$distPath = "C:\inetpub\wwwroot\bebang-pack-meal\frontend\dist"
$publicPath = "C:\inetpub\wwwroot\bebang-pack-meal\public"

# Copy dist files to public directory
if (Test-Path $publicPath) {
    Remove-Item -Path $publicPath -Recurse -Force
}
Copy-Item -Path $distPath -Destination $publicPath -Recurse -Force

# Set proper permissions for static files
icacls $publicPath /grant "IIS_IUSRS:(OI)(CI)R" /T
icacls $publicPath /grant "IUSR:(OI)(CI)R" /T
```

### 3. PWA Configuration
```powershell
# Verify PWA files are present
$pwaFiles = @(
    "manifest.webmanifest",
    "sw.js",
    "icons/icon-192.png",
    "icons/icon-512.png"
)

foreach ($file in $pwaFiles) {
    $filePath = Join-Path $publicPath $file
    if (Test-Path $filePath) {
        Write-Host "✓ PWA file found: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ PWA file missing: $file" -ForegroundColor Red
    }
}

# Configure PWA MIME types in IIS (if using IIS)
if (Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole | Where-Object {$_.State -eq "Enabled"}) {
    Import-Module WebAdministration
    
    # Add PWA MIME types
    Add-WebConfigurationProperty -Filter "system.webServer/staticContent" -Name "." -Value @{fileExtension='.webmanifest'; mimeType='application/manifest+json'}
    Add-WebConfigurationProperty -Filter "system.webServer/staticContent" -Name "." -Value @{fileExtension='.webp'; mimeType='image/webp'}
}
```

## SSL/TLS Configuration

### 1. Self-Signed Certificate untuk Development
```powershell
# Create self-signed certificate
$cert = New-SelfSignedCertificate -DnsName "bebang-pack-meal.local", "localhost" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(2)

# Export certificate untuk web server
$certPath = "C:\nginx\ssl"
New-Item -ItemType Directory -Force -Path $certPath

$certPassword = ConvertTo-SecureString -String "certificate123" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "$certPath\bebang-pack-meal.pfx" -Password $certPassword

# Export untuk Nginx format
$certThumbprint = $cert.Thumbprint
$certBase64 = [Convert]::ToBase64String((Get-ChildItem "cert:\LocalMachine\My\$certThumbprint").RawData)
$certPem = "-----BEGIN CERTIFICATE-----`n$certBase64`n-----END CERTIFICATE-----"
$certPem | Out-File -FilePath "$certPath\bebang-pack-meal.crt" -Encoding ASCII

# Export private key (requires OpenSSL or alternative)
Write-Host "Manual step required: Export private key to $certPath\bebang-pack-meal.key"
Write-Host "Certificate thumbprint: $certThumbprint"
```

### 2. Configure SSL untuk IIS
```powershell
# Bind SSL certificate to IIS site
Import-Module WebAdministration

# Add HTTPS binding
New-WebBinding -Name "BebangPackMeal" -Protocol https -Port 443 -HostHeader "bebang-pack-meal.local"

# Bind certificate
$cert = Get-ChildItem -Path "cert:\LocalMachine\My" | Where-Object {$_.Subject -like "*bebang-pack-meal*"}
(Get-WebBinding -Name "BebangPackMeal" -Protocol https).AddSslCertificate($cert.Thumbprint, "my")
```

### 3. Configure SSL untuk Nginx
```nginx
# Add to nginx.conf inside http block

server {
    listen 443 ssl http2;
    server_name localhost bebang-pack-meal.local;
    
    # SSL Configuration
    ssl_certificate C:/nginx/ssl/bebang-pack-meal.crt;
    ssl_certificate_key C:/nginx/ssl/bebang-pack-meal.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Same location blocks as HTTP server
    # ... (copy from HTTP configuration)
    
    # Redirect HTTP to HTTPS
}

server {
    listen 80;
    server_name bebang-pack-meal.local;
    return 301 https://$server_name$request_uri;
}
```

## Service Management

### 1. Windows Service Scripts
```powershell
# Create comprehensive service management script
$serviceManagementScript = @"
@echo off
title Bebang Pack Meal - Service Management

:menu
cls
echo ============================================
echo    Bebang Pack Meal - Service Management
echo ============================================
echo.
echo 1. Start All Services
echo 2. Stop All Services  
echo 3. Restart All Services
echo 4. Service Status
echo 5. Database Service
echo 6. Web Server Service
echo 7. Backend Service
echo 8. View Logs
echo 9. Exit
echo.
set /p choice="Select option (1-9): "

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto stop_all
if "%choice%"=="3" goto restart_all
if "%choice%"=="4" goto status_all
if "%choice%"=="5" goto database_menu
if "%choice%"=="6" goto webserver_menu
if "%choice%"=="7" goto backend_menu
if "%choice%"=="8" goto logs_menu
if "%choice%"=="9" goto exit

goto menu

:start_all
echo Starting all services...
net start postgresql-x64-14
net start nginx
pm2 start ecosystem.config.json
echo All services started.
pause
goto menu

:stop_all
echo Stopping all services...
pm2 stop all
net stop nginx
net stop postgresql-x64-14
echo All services stopped.
pause
goto menu

:restart_all
echo Restarting all services...
call :stop_all
timeout /t 5 /nobreak
call :start_all
echo All services restarted.
pause
goto menu

:status_all
echo Service Status:
echo ==================
sc query postgresql-x64-14 | findstr STATE
sc query nginx | findstr STATE
pm2 status
pause
goto menu

:database_menu
cls
echo Database Service Management
echo 1. Start PostgreSQL
echo 2. Stop PostgreSQL
echo 3. Restart PostgreSQL
echo 4. Back to main menu
set /p db_choice="Select option: "
if "%db_choice%"=="1" net start postgresql-x64-14
if "%db_choice%"=="2" net stop postgresql-x64-14
if "%db_choice%"=="3" (net stop postgresql-x64-14 && timeout /t 3 /nobreak && net start postgresql-x64-14)
if "%db_choice%"=="4" goto menu
pause
goto database_menu

:webserver_menu
cls
echo Web Server Management
echo 1. Start Nginx
echo 2. Stop Nginx
echo 3. Restart Nginx
echo 4. Reload Config
echo 5. Back to main menu
set /p web_choice="Select option: "
if "%web_choice%"=="1" net start nginx
if "%web_choice%"=="2" net stop nginx
if "%web_choice%"=="3" (net stop nginx && timeout /t 3 /nobreak && net start nginx)
if "%web_choice%"=="4" C:\nginx\nginx.exe -s reload
if "%web_choice%"=="5" goto menu
pause
goto webserver_menu

:backend_menu
cls
echo Backend Service Management
echo 1. Start Backend
echo 2. Stop Backend
echo 3. Restart Backend
echo 4. View Status
echo 5. Back to main menu
set /p backend_choice="Select option: "
if "%backend_choice%"=="1" pm2 start ecosystem.config.json
if "%backend_choice%"=="2" pm2 stop bebang-backend
if "%backend_choice%"=="3" pm2 restart bebang-backend
if "%backend_choice%"=="4" pm2 status
if "%backend_choice%"=="5" goto menu
pause
goto backend_menu

:logs_menu
cls
echo Log Management
echo 1. View Backend Logs
echo 2. View Nginx Error Logs
echo 3. View Nginx Access Logs
echo 4. View PostgreSQL Logs
echo 5. Clear All Logs
echo 6. Back to main menu
set /p log_choice="Select option: "
if "%log_choice%"=="1" pm2 logs bebang-backend
if "%log_choice%"=="2" type C:\nginx\logs\error.log
if "%log_choice%"=="3" type C:\nginx\logs\access.log
if "%log_choice%"=="4" type "C:\Program Files\PostgreSQL\14\data\log\*.log"
if "%log_choice%"=="5" call :clear_logs
if "%log_choice%"=="6" goto menu
pause
goto logs_menu

:clear_logs
echo Clearing logs...
pm2 flush
del /q C:\nginx\logs\*.log 2>nul
echo Logs cleared.
goto logs_menu

:exit
echo Goodbye!
exit

"@

$serviceManagementScript | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\service-manager.bat" -Encoding ASCII
```

### 2. Startup Scripts
```powershell
# Create startup script untuk auto-start semua services
$startupScript = @"
@echo off
echo Starting Bebang Pack Meal Services...

echo Starting PostgreSQL...
net start postgresql-x64-14

echo Starting Nginx...
net start nginx

echo Starting Backend...
cd C:\inetpub\wwwroot\bebang-pack-meal
pm2 start ecosystem.config.json

echo All services started successfully!
"@

$startupScript | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\startup.bat" -Encoding ASCII

# Add to Windows startup (optional)
$startupFolder = [Environment]::GetFolderPath("Startup")
Copy-Item -Path "C:\inetpub\wwwroot\bebang-pack-meal\startup.bat" -Destination $startupFolder
```

## Monitoring & Logging

### 1. Log Directory Setup
```powershell
# Create log directories
$logPaths = @(
    "C:\inetpub\wwwroot\bebang-pack-meal\logs",
    "C:\inetpub\wwwroot\bebang-pack-meal\logs\backend",
    "C:\inetpub\wwwroot\bebang-pack-meal\logs\nginx",
    "C:\inetpub\wwwroot\bebang-pack-meal\logs\database"
)

foreach ($path in $logPaths) {
    New-Item -ItemType Directory -Force -Path $path
    icacls $path /grant "Everyone:(OI)(CI)F" /T
}
```

### 2. Log Rotation Script
```powershell
# Create log rotation script
$logRotationScript = @"
# PowerShell Log Rotation Script
param(
    [string]`$LogDirectory = "C:\inetpub\wwwroot\bebang-pack-meal\logs",
    [int]`$RetentionDays = 30,
    [long]`$MaxFileSizeMB = 100
)

function Rotate-Logs {
    param(`$Directory, `$RetentionDays, `$MaxFileSizeMB)
    
    `$MaxFileSize = `$MaxFileSizeMB * 1MB
    `$CutoffDate = (Get-Date).AddDays(-`$RetentionDays)
    
    Get-ChildItem -Path `$Directory -Recurse -File -Include "*.log" | ForEach-Object {
        # Remove old logs
        if (`$_.LastWriteTime -lt `$CutoffDate) {
            Write-Host "Removing old log: `$(`$_.FullName)"
            Remove-Item `$_.FullName -Force
        }
        
        # Rotate large logs
        if (`$_.Length -gt `$MaxFileSize) {
            `$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            `$newName = "`$(`$_.BaseName)_`$timestamp`$(`$_.Extension)"
            `$newPath = Join-Path `$_.Directory `$newName
            
            Write-Host "Rotating large log: `$(`$_.FullName) -> `$newPath"
            Move-Item `$_.FullName `$newPath
        }
    }
}

Rotate-Logs -Directory `$LogDirectory -RetentionDays `$RetentionDays -MaxFileSizeMB `$MaxFileSizeMB
Write-Host "Log rotation completed."
"@

$logRotationScript | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\scripts\log-rotation.ps1" -Encoding UTF8

# Schedule log rotation
schtasks /create /tn "BebangPackMeal-LogRotation" /tr "powershell.exe -File C:\inetpub\wwwroot\bebang-pack-meal\scripts\log-rotation.ps1" /sc daily /st 02:00 /ru SYSTEM
```

### 3. Health Check Script
```powershell
# Create health check script
$healthCheckScript = @"
# PowerShell Health Check Script
param(
    [string]`$BaseUrl = "http://localhost",
    [string]`$ApiUrl = "http://localhost/api/health",
    [string]`$LogPath = "C:\inetpub\wwwroot\bebang-pack-meal\logs\health-check.log"
)

function Write-Log {
    param(`$Message)
    `$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    `$logEntry = "[`$timestamp] `$Message"
    Write-Host `$logEntry
    Add-Content -Path `$LogPath -Value `$logEntry
}

function Test-Service {
    param(`$ServiceName)
    try {
        `$service = Get-Service -Name `$ServiceName -ErrorAction Stop
        return `$service.Status -eq "Running"
    } catch {
        return `$false
    }
}

function Test-Url {
    param(`$Url, `$TimeoutSeconds = 30)
    try {
        `$response = Invoke-WebRequest -Uri `$Url -TimeoutSec `$TimeoutSeconds -UseBasicParsing
        return `$response.StatusCode -eq 200
    } catch {
        return `$false
    }
}

function Test-Port {
    param(`$Host, `$Port, `$TimeoutSeconds = 5)
    try {
        `$tcpClient = New-Object System.Net.Sockets.TcpClient
        `$result = `$tcpClient.BeginConnect(`$Host, `$Port, `$null, `$null)
        `$success = `$result.AsyncWaitHandle.WaitOne(`$TimeoutSeconds * 1000)
        `$tcpClient.Close()
        return `$success
    } catch {
        return `$false
    }
}

Write-Log "Starting health check..."

# Check services
`$services = @{
    "postgresql-x64-14" = "PostgreSQL Database"
    "nginx" = "Nginx Web Server"
}

foreach (`$service in `$services.GetEnumerator()) {
    if (Test-Service `$service.Key) {
        Write-Log "✓ `$(`$service.Value) is running"
    } else {
        Write-Log "✗ `$(`$service.Value) is not running"
    }
}

# Check backend via PM2
try {
    `$pm2Status = pm2 jlist | ConvertFrom-Json
    `$backendStatus = `$pm2Status | Where-Object { `$_.name -eq "bebang-backend" }
    if (`$backendStatus -and `$backendStatus.pm2_env.status -eq "online") {
        Write-Log "✓ Backend service is running"
    } else {
        Write-Log "✗ Backend service is not running"
    }
} catch {
    Write-Log "✗ PM2 not available or backend not configured"
}

# Check ports
`$ports = @{
    80 = "HTTP Port"
    443 = "HTTPS Port"
    3000 = "Backend API Port"
    3001 = "WebSocket Port"
    5432 = "PostgreSQL Port"
}

foreach (`$port in `$ports.GetEnumerator()) {
    if (Test-Port "localhost" `$port.Key) {
        Write-Log "✓ `$(`$port.Value) (`$(`$port.Key)) is accessible"
    } else {
        Write-Log "✗ `$(`$port.Value) (`$(`$port.Key)) is not accessible"
    }
}

# Check URLs
if (Test-Url `$BaseUrl) {
    Write-Log "✓ Frontend is accessible"
} else {
    Write-Log "✗ Frontend is not accessible"
}

if (Test-Url `$ApiUrl) {
    Write-Log "✓ Backend API health endpoint is accessible"
} else {
    Write-Log "✗ Backend API health endpoint is not accessible"
}

Write-Log "Health check completed."
"@

$healthCheckScript | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\scripts\health-check.ps1" -Encoding UTF8

# Schedule health checks
schtasks /create /tn "BebangPackMeal-HealthCheck" /tr "powershell.exe -File C:\inetpub\wwwroot\bebang-pack-meal\scripts\health-check.ps1" /sc minute /mo 15 /ru SYSTEM
```

## Troubleshooting

### 1. Common Issues dan Solutions

#### PostgreSQL Connection Issues
```powershell
# Check PostgreSQL service
sc query postgresql-x64-14

# Check PostgreSQL logs
Get-Content "C:\Program Files\PostgreSQL\14\data\log\*.log" -Tail 50

# Test connection
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U bebang_user -d bebang_pack_meal -h localhost -p 5432

# Reset PostgreSQL password
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -c "ALTER USER bebang_user PASSWORD 'new_password';"
```

#### Nginx Issues
```powershell
# Test nginx configuration
C:\nginx\nginx.exe -t

# Check nginx error logs
Get-Content "C:\nginx\logs\error.log" -Tail 50

# Check if ports are in use
netstat -an | findstr ":80"
netstat -an | findstr ":443"

# Kill process using port 80
$process = Get-Process | Where-Object {$_.ProcessName -eq "nginx"}
if ($process) { Stop-Process -Id $process.Id -Force }
```

#### Backend (Node.js) Issues
```powershell
# Check PM2 process status
pm2 logs bebang-backend --lines 50

# Check if Node.js process is running
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Test backend manually
cd "C:\inetpub\wwwroot\bebang-pack-meal\backend"

# Verify environment variables
Write-Host "Checking environment variables..." -ForegroundColor Cyan
Get-Content .env | Select-String -Pattern "^[^#]" | ForEach-Object {
    $key = $_.Line.Split('=')[0]
    if ($key -in @('JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL')) {
        Write-Host "$key=***HIDDEN***" -ForegroundColor Gray
    } else {
        Write-Host $_.Line -ForegroundColor Gray
    }
}

# Test database connection
Write-Host "Testing database connection..." -ForegroundColor Cyan
npx prisma db execute --stdin <<< "SELECT 1 as test;"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database connection successful" -ForegroundColor Green
} else {
    Write-Host "✗ Database connection failed" -ForegroundColor Red
}

# Test Prisma client
Write-Host "Testing Prisma client..." -ForegroundColor Cyan
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✓ Prisma client connected successfully');
    return prisma.\$disconnect();
  })
  .catch(err => {
    console.log('✗ Prisma client connection failed:', err.message);
    process.exit(1);
  });
"

# Test backend manually
Write-Host "Testing backend startup..." -ForegroundColor Cyan
node dist/main.js &
$backendPid = $!
Start-Sleep -Seconds 5

# Test health endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend health check passed" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Stop test backend
if ($backendPid) {
    Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
}
```

#### Environment Variables Issues
```powershell
# Environment variables troubleshooting
Write-Host "Troubleshooting environment variables..." -ForegroundColor Cyan

# Check if .env file exists
$envFile = "C:\inetpub\wwwroot\bebang-pack-meal\backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "✗ .env file not found at $envFile" -ForegroundColor Red
    Write-Host "Creating basic .env file..." -ForegroundColor Yellow
    
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    if (-not (Test-Path ".env")) {
        Write-Host "✗ .env.example not found. Creating minimal .env..." -ForegroundColor Red
        @"
NODE_ENV=production
PORT=300
DATABASE_URL=postgresql://bebang_user:bebang_password_123@localhost:5432/bebang_pack_meal
JWT_SECRET=change-this-to-secure-secret
JWT_REFRESH_SECRET=change-this-to-secure-refresh-secret
"@ | Out-File -FilePath ".env" -Encoding UTF8
    }
}

# Validate required environment variables
$envContent = Get-Content $envFile
$requiredVars = @('NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET')

foreach ($var in $requiredVars) {
    $found = $envContent | Select-String "^$var="
    if ($found) {
        Write-Host "✓ $var is configured" -ForegroundColor Green
    } else {
        Write-Host "✗ $var is missing" -ForegroundColor Red
    }
}

# Check for insecure default values
$insecurePatterns = @{
    'JWT_SECRET' = @('change-this', 'your-super-secure', 'secret', 'generate-secure')
    'JWT_REFRESH_SECRET' = @('change-this', 'your-super-secure', 'secret', 'generate-secure')
    'DATABASE_URL' = @('password123', 'admin')
}

foreach ($var in $insecurePatterns.Keys) {
    $value = ($envContent | Select-String "^$var=" | ForEach-Object { $_.Line.Split('=')[1] })
    if ($value) {
        foreach ($pattern in $insecurePatterns[$var]) {
            if ($value -like "*$pattern*") {
                Write-Host "⚠️  $var contains potentially insecure value" -ForegroundColor Yellow
            }
        }
    }
}
```

#### Prisma Migration Issues
```powershell
# Prisma troubleshooting
Write-Host "Troubleshooting Prisma issues..." -ForegroundColor Cyan

# Check Prisma installation
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "✗ npx not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check Prisma CLI
npx prisma --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing Prisma CLI..." -ForegroundColor Yellow
    npm install prisma @prisma/client
}

# Check schema file
if (-not (Test-Path "prisma\schema.prisma")) {
    Write-Host "✗ Prisma schema file not found" -ForegroundColor Red
} else {
    Write-Host "✓ Prisma schema file found" -ForegroundColor Green
}

# Validate schema
Write-Host "Validating Prisma schema..." -ForegroundColor Yellow
npx prisma validate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma schema is valid" -ForegroundColor Green
} else {
    Write-Host "✗ Prisma schema validation failed" -ForegroundColor Red
}

# Check migration status
Write-Host "Checking migration status..." -ForegroundColor Yellow
npx prisma migrate status
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database is up to date" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database migrations needed" -ForegroundColor Yellow
    
    # Apply pending migrations
    Write-Host "Applying pending migrations..." -ForegroundColor Yellow
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migrations applied successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Migration failed" -ForegroundColor Red
    }
}

# Test Prisma client generation
Write-Host "Testing Prisma client generation..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma client generated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Prisma client generation failed" -ForegroundColor Red
}

# Check if seeding is needed
Write-Host "Checking database seeding..." -ForegroundColor Yellow
if (Test-Path "prisma\seed.ts") {
    # Test seeding
    npx prisma db seed --preview-feature 2>&1 | Write-Host
} else {
    Write-Host "⚠️  No seed file found" -ForegroundColor Yellow
}
```

#### IIS Issues
```powershell
# Check IIS service
sc query W3SVC

# Reset IIS
iisreset

# Check application pool
Import-Module WebAdministration
Get-WebAppPoolState -Name "BebangPackMealPool"

# Recycle application pool
Restart-WebAppPool -Name "BebangPackMealPool"

# Check IIS logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 50
```

### 2. Performance Optimization

#### Database Optimization
```sql
-- Optimize PostgreSQL for production
-- Connect as postgres user
\c bebang_pack_meal

-- Check database size
SELECT pg_size_pretty(pg_database_size('bebang_pack_meal'));

-- Analyze tables
ANALYZE;

-- Update statistics
VACUUM ANALYZE;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Nginx Optimization
```nginx
# Add to nginx.conf for better performance
worker_processes auto;
worker_connections 2048;

# Enable caching
proxy_cache_path C:/nginx/cache levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;

server {
    # Add caching for API responses
    location /api/ {
        proxy_cache my_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        
        # Original proxy settings...
    }
}
```

#### Backend Optimization
```json
// Update ecosystem.config.json for better performance
{
  "apps": [{
    "name": "bebang-backend",
    "script": "dist/main.js",
    "instances": "max",
    "exec_mode": "cluster",
    "max_memory_restart": "2G",
    "node_args": "--max-old-space-size=2048 --optimize-for-size",
    "env": {
      "NODE_ENV": "production",
      "UV_THREADPOOL_SIZE": "16"
    }
  }]
}
```

### 3. Security Hardening

#### Windows Firewall Rules untuk IP Spesifik 192.168.3.235/23
```powershell
# Configure Windows Firewall dengan konfigurasi IP spesifik
# Allow specific ports dengan IP binding

# HTTP/HTTPS untuk IP spesifik
netsh advfirewall firewall add rule name="Bebang HTTP - IP Specific" dir=in action=allow protocol=TCP localport=80 localip=192.168.3.235
netsh advfirewall firewall add rule name="Bebang HTTPS - IP Specific" dir=in action=allow protocol=TCP localport=443 localip=192.168.3.235

# PostgreSQL untuk IP spesifik
netsh advfirewall firewall add rule name="Bebang PostgreSQL - IP Specific" dir=in action=allow protocol=TCP localport=5432 localip=192.168.3.235

# Allow akses dari network range 192.168.2.0/23
netsh advfirewall firewall add rule name="Allow Network Range Access - HTTP" dir=in action=allow protocol=TCP localport=80 remoteip=192.168.2.0/23
netsh advfirewall firewall add rule name="Allow Network Range Access - HTTPS" dir=in action=allow protocol=TCP localport=443 remoteip=192.168.2.0/23

# Development ports (hanya dari localhost)
netsh advfirewall firewall add rule name="Dev Backend Access" dir=in action=allow protocol=TCP localport=3000 remoteip=127.0.0.1
netsh advfirewall firewall add rule name="Dev WebSocket Access" dir=in action=allow protocol=TCP localport=3001 remoteip=127.0.0.1

# Block direct access dari luar network range
netsh advfirewall firewall add rule name="Block External HTTP" dir=in action=block protocol=TCP localport=80 remoteip=0.0.0.0-192.168.1.255,192.168.4.0-255.255.255.255
netsh advfirewall firewall add rule name="Block External HTTPS" dir=in action=block protocol=TCP localport=443 remoteip=0.0.0.0-192.168.1.255,192.168.4.0-255.255.255.255

# Block direct backend/websocket access (kecuali localhost)
netsh advfirewall firewall add rule name="Block Direct Backend External" dir=in action=block protocol=TCP localport=3000 remoteip=0.0.0.0-126.255.255.255,128.0.0.0-255.255.255.255
netsh advfirewall firewall add rule name="Block Direct WebSocket External" dir=in action=block protocol=TCP localport=3001 remoteip=0.0.0.0-126.255.255.255,128.0.0.0-255.255.255.255

# Advanced security rules
netsh advfirewall firewall add rule name="Allow Ping from Network Range" dir=in action=allow protocol=icmpv4:8,any remoteip=192.168.2.0/23
```

#### Advanced Network Security Configuration
```powershell
# Create advanced firewall configuration script
$firewallScript = @"
# Advanced Firewall Configuration for IP 192.168.3.235/23
param([string]`$Action = "Configure")

function Configure-NetworkSecurity {
    Write-Host "Configuring network security for 192.168.3.235/23..." -ForegroundColor Cyan
    
    # Remove existing rules (if any)
    netsh advfirewall firewall delete rule name="Bebang HTTP - IP Specific" 2>nul
    netsh advfirewall firewall delete rule name="Bebang HTTPS - IP Specific" 2>nul
    
    # Add comprehensive rules
    netsh advfirewall firewall add rule name="Bebang-AllowHTTP-NetworkRange" dir=in action=allow protocol=TCP localport=80 remoteip=192.168.2.0/23 localip=192.168.3.235
    netsh advfirewall firewall add rule name="Bebang-AllowHTTPS-NetworkRange" dir=in action=allow protocol=TCP localport=443 remoteip=192.168.2.0/23 localip=192.168.3.235
    
    # Log dropped packets
    netsh advfirewall set allprofiles logging droppedconnections enable
    netsh advfirewall set allprofiles logging filename "C:\Windows\System32\LogFiles\Firewall\pfirewall.log"
    
    Write-Host "✓ Network security configured successfully" -ForegroundColor Green
}

function Test-NetworkSecurity {
    Write-Host "Testing network security configuration..." -ForegroundColor Cyan
    
    # Test port accessibility
    `$ports = @(80, 443, 3000, 3001, 5432)
    foreach (`$port in `$ports) {
        `$result = Test-NetConnection -ComputerName "192.168.3.235" -Port `$port -WarningAction SilentlyContinue
        if (`$result.TcpTestSucceeded) {
            Write-Host "✓ Port `$port accessible" -ForegroundColor Green
        } else {
            Write-Host "✗ Port `$port not accessible" -ForegroundColor Red
        }
    }
}

switch (`$Action) {
    "Configure" { Configure-NetworkSecurity }
    "Test" { Test-NetworkSecurity }
    "Both" { Configure-NetworkSecurity; Test-NetworkSecurity }
    default { Write-Host "Usage: -Action [Configure|Test|Both]" }
}
"@

$firewallScript | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\scripts\configure-network-security.ps1" -Encoding UTF8

# Run the configuration
PowerShell -File "C:\inetpub\wwwroot\bebang-pack-meal\scripts\configure-network-security.ps1" -Action Both
```

#### File Permissions
```powershell
# Set secure file permissions
$appPath = "C:\inetpub\wwwroot\bebang-pack-meal"

# Remove inherited permissions
icacls $appPath /inheritance:d

# Set specific permissions
icacls $appPath /grant "Administrators:(OI)(CI)F"
icacls $appPath /grant "SYSTEM:(OI)(CI)F"
icacls $appPath /grant "IIS_IUSRS:(OI)(CI)RX"
icacls "$appPath\backend\.env" /grant "IIS_IUSRS:R"
icacls "$appPath\logs" /grant "IIS_IUSRS:(OI)(CI)M"
```

#### Hide Server Information
```nginx
# Add to nginx.conf
http {
    server_tokens off;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

### 4. Backup & Recovery

#### Database Backup Script
```powershell
# Create database backup script
$backupScript = @"
# Database Backup Script
param(
    [string]`$BackupPath = "C:\backups\bebang-pack-meal",
    [int]`$RetentionDays = 7
)

`$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
`$backupFile = Join-Path `$BackupPath "bebang_pack_meal_`$timestamp.sql"

# Create backup directory
New-Item -ItemType Directory -Force -Path `$BackupPath

# Create backup
`$env:PGPASSWORD = "bebang_password_123"
& "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" -U bebang_user -h localhost -d bebang_pack_meal -f `$backupFile

if (`$LASTEXITCODE -eq 0) {
    Write-Host "Backup created successfully: `$backupFile"
    
    # Compress backup
    Compress-Archive -Path `$backupFile -DestinationPath "`$backupFile.zip"
    Remove-Item `$backupFile
    
    # Clean old backups
    Get-ChildItem -Path `$BackupPath -Filter "*.zip" | 
        Where-Object { `$_.LastWriteTime -lt (Get-Date).AddDays(-`$RetentionDays) } |
        Remove-Item -Force
        
    Write-Host "Backup maintenance completed."
} else {
    Write-Error "Backup failed!"
}
"@

$backupScript | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\scripts\backup-database.ps1" -Encoding UTF8

# Schedule daily backup
schtasks /create /tn "BebangPackMeal-Backup" /tr "powershell.exe -File C:\inetpub\wwwroot\bebang-pack-meal\scripts\backup-database.ps1" /sc daily /st 01:00 /ru SYSTEM
```

#### Application Backup Script
```powershell
# Create application backup script
$appBackupScript = @"
# Application Backup Script
param(
    [string]`$SourcePath = "C:\inetpub\wwwroot\bebang-pack-meal",
    [string]`$BackupPath = "C:\backups\bebang-pack-meal-app",
    [int]`$RetentionDays = 14
)

`$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
`$backupDir = Join-Path `$BackupPath "app_backup_`$timestamp"

# Create backup directory
New-Item -ItemType Directory -Force -Path `$BackupDir

# Copy application files (exclude node_modules and logs)
`$excludePatterns = @("node_modules", "logs", "*.log", "dist", "build")
robocopy `$SourcePath `$backupDir /E /XD node_modules logs dist build /XF *.log

if (`$LASTEXITCODE -lt 8) {
    Write-Host "Application backup created: `$backupDir"
    
    # Compress backup
    Compress-Archive -Path `$backupDir -DestinationPath "`$backupDir.zip"
    Remove-Item -Path `$backupDir -Recurse -Force
    
    # Clean old backups
    Get-ChildItem -Path `$BackupPath -Filter "*.zip" | 
        Where-Object { `$_.LastWriteTime -lt (Get-Date).AddDays(-`$RetentionDays) } |
        Remove-Item -Force
        
    Write-Host "Application backup maintenance completed."
} else {
    Write-Error "Application backup failed!"
}
"@

$appBackupScript | Out-File -FilePath "C:\inetpub\wwwroot\bebang-pack-meal\scripts\backup-application.ps1" -Encoding UTF8
```

## Best Practices Summary

### 1. Security
- ✅ Gunakan strong passwords untuk semua services
- ✅ Configure Windows Firewall dengan proper rules
- ✅ Set file permissions yang restrictive
- ✅ Enable HTTPS dengan valid certificates
- ✅ Hide server information headers
- ✅ Regular security updates

### 2. Performance
- ✅ Use PM2 cluster mode untuk backend
- ✅ Enable gzip compression
- ✅ Configure proper caching headers
- ✅ Optimize database queries
- ✅ Monitor resource usage

### 3. Reliability
- ✅ Configure services untuk auto-start
- ✅ Implement health checks
- ✅ Set up log rotation
- ✅ Create automated backups
- ✅ Test disaster recovery procedures

### 4. Maintenance
- ✅ Regular log monitoring
- ✅ Automated backup verification
- ✅ Performance monitoring
- ✅ Security patch management
- ✅ Capacity planning

## Kontak dan Support

Untuk pertanyaan atau bantuan terkait deployment:

- **Repository**: https://github.com/username/bebang-pack-meal-portal
- **Issues**: Gunakan GitHub Issues untuk deployment issues
- **Documentation**: Lihat file README.md dan dokumentasi teknis

---

**Catatan**: Tutorial ini khusus untuk deployment di Windows 10. Pastikan semua prerequisites telah terpenuhi sebelum memulai deployment.