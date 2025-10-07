# Tutorial Deployment Bebang Pack Meal Portal di Windows Server (IP: 192.168.3.1)

## Prerequisites

- Windows Server 2019/2022 atau Windows 10/11 Pro
- Akses Administrator pada server
- Koneksi internet untuk download dependencies
- Minimal 8GB RAM dan 50GB storage

---

## 1. Server Setup dengan IP 192.168.3.1

### 1.1 Konfigurasi Network Adapter

1. Buka **Control Panel** → **Network and Sharing Center**
2. Klik **Change adapter settings**
3. Klik kanan pada adapter yang digunakan → **Properties**
4. Pilih **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**
5. Konfigurasi sebagai berikut:

```
IP address: 192.168.3.1
Subnet mask: 255.255.255.0
Default gateway: 192.168.3.254
Preferred DNS server: 192.168.3.1
Alternate DNS server: 8.8.8.8
```

### 1.2 Validasi Konfigurasi Network

Buka Command Prompt sebagai Administrator dan jalankan:

```cmd
# Verifikasi IP configuration
ipconfig /all

# Test connectivity ke gateway
ping 192.168.3.254

# Test DNS resolution
ping google.com

# Test local connectivity
ping 192.168.3.1
```

### 1.3 Windows Firewall Configuration

Buka **Windows Defender Firewall with Advanced Security**:

```cmd
# Buka via Command Prompt
wf.msc
```

#### 1.3.1 Create Inbound Rules untuk Port yang Dibutuhkan

**Port 80 (HTTP):**
```cmd
netsh advfirewall firewall add rule name="Bebang Portal HTTP" dir=in action=allow protocol=TCP localport=80
```

**Port 3000 (Backend API):**
```cmd
netsh advfirewall firewall add rule name="Bebang Portal Backend" dir=in action=allow protocol=TCP localport=3000
```

**Port 3001 (WebSocket):**
```cmd
netsh advfirewall firewall add rule name="Bebang Portal WebSocket" dir=in action=allow protocol=TCP localport=3001
```

**Port 5432 (PostgreSQL - jika perlu remote access):**
```cmd
netsh advfirewall firewall add rule name="PostgreSQL" dir=in action=allow protocol=TCP localport=5432
```

#### 1.3.2 Enable Network Discovery

```cmd
netsh firewall set opmode disable
netsh advfirewall firewall set rule group="Network Discovery" new enable=Yes
```

---

## 2. Production Environment Setup

### 2.1 Install Node.js

1. Download Node.js LTS versi terbaru dari https://nodejs.org
2. Install dengan opsi default
3. Verifikasi instalasi:

```cmd
node --version
npm --version
```

### 2.2 Install PostgreSQL

1. Download PostgreSQL dari https://www.postgresql.org/download/windows/
2. Install dengan password: `P@ssw0rd123456`
3. Pastikan PostgreSQL service berjalan:

```cmd
sc query postgresql-x64-15
```

### 2.3 Install PM2 (Process Manager)

```cmd
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

### 2.4 Install Git

1. Download Git dari https://git-scm.com/download/win
2. Install dengan opsi default
3. Verifikasi:

```cmd
git --version
```

### 2.5 Install IIS (Internet Information Services)

Buka **Server Manager** → **Add Roles and Features**:
- Centang **Web Server (IIS)**
- Pilih **Management Tools** → **IIS Management Console**
- Install dengan opsi default

---

## 3. Application Deployment

### 3.1 Clone Repository

```cmd
cd C:\
git clone https://github.com/your-org/portal-pack-meal.git
cd portal-pack-meal
```

### 3.2 Backend Setup

#### 3.2.1 Install Dependencies

```cmd
cd backend
npm install --production
```

#### 3.2.2 Create Production Environment File

Buat file `.env.production`:

```env
NODE_ENV=production
PORT=3000
HOST=192.168.3.1

# Database Configuration
DATABASE_URL=postgresql://postgres:P@ssw0rd123456@localhost:5432/bebang_pack_meal_prod

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://192.168.3.1

# WebSocket Configuration
WS_PORT=3001
WS_HOST=192.168.3.1
```

#### 3.2.3 Build Backend

```cmd
npm run build
```

#### 3.2.4 Database Setup

```cmd
# Generate Prisma Client
npx prisma generate

# Run Migrations
npx prisma migrate deploy

# Seed Initial Data
npx prisma db seed
```

### 3.3 Frontend Setup

#### 3.3.1 Install Dependencies

```cmd
cd ..\frontend
npm install --production
```

#### 3.3.2 Create Production Environment File

Buat file `.env.production`:

```env
VITE_API_BASE_URL=http://192.168.3.1:3000/api
VITE_WS_URL=http://192.168.3.1:3001
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
```

#### 3.3.3 Build Frontend

```cmd
npm run build
```

### 3.4 Setup PM2 Configuration

Buat file `ecosystem.config.js` di root directory:

```javascript
module.exports = {
  apps: [
    {
      name: 'bebang-backend',
      script: 'C:/portal-pack-meal/backend/dist/main.js',
      cwd: 'C:/portal-pack-meal/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '192.168.3.1'
      },
      env_file: 'C:/portal-pack-meal/backend/.env.production'
    }
  ]
};
```

---

## 4. Production Configuration

### 4.1 Backend Service Configuration

#### 4.1.1 Start Backend Service

```cmd
cd C:\portal-pack-meal
pm2 start ecosystem.config.js
pm2 save
```

#### 4.1.2 Verify Backend Service

```cmd
# Test API endpoint
curl http://192.168.3.1:3000/api/health

# Check PM2 status
pm2 status
pm2 logs bebang-backend
```

### 4.2 Frontend Static File Serving

#### 4.2.1 Create IIS Site

1. Buka **Internet Information Services (IIS) Manager**
2. Klik kanan **Sites** → **Add Website**
3. Konfigurasi:

```
Site name: BebangPackMealPortal
Physical path: C:\portal-pack-meal\frontend\dist
Binding: HTTP, IP Address: 192.168.3.1, Port: 80
```

#### 4.2.2 Configure IIS for SPA

Buat file `web.config` di `C:\portal-pack-meal\frontend\dist`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Handle History Mode and Hash White List" stopProcessing="true">
          <match url="([\S]+[.]js|[\S]+[.]css|[\S]+[.]json|[\S]+[.]png|[\S]+[.]jpg|[\S]+[.]jpeg|[\S]+[.]gif|[\S]+[.]svg|[\S]+[.]ico|[\S]+[.]woff|[\S]+[.]woff2|[\S]+[.]ttf|[\S]+[.]eot)$" />
          <action type="None" />
        </rule>
        <rule name="SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
    </staticContent>
    <httpProtocol>
      <customHeaders>
        <add name="Cache-Control" value="no-cache, no-store, must-revalidate" />
        <add name="Pragma" value="no-cache" />
        <add name="Expires" value="0" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

### 4.3 WebSocket Configuration

WebSocket sudah terkonfigurasi di backend untuk berjalan pada port 3001. Verifikasi:

```cmd
# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" http://192.168.3.1:3001/notifications
```

---

## 5. Security & Access Control

### 5.1 Windows Firewall Hardening

```cmd
# Block all incoming connections except specified
netsh advfirewall set allprofiles firewallpolicy blockinbound,allowoutbound

# Allow specific ports
netsh advfirewall firewall add rule name="Allow HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Allow Backend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Allow WebSocket" dir=in action=allow protocol=TCP localport=3001

# Allow local subnet only
netsh advfirewall firewall add rule name="Allow Local Subnet" dir=in action=allow protocol=ANY remoteip=192.168.3.0/24
```

### 5.2 User Account Setup

```cmd
# Create dedicated service account
net user bebangsvc P@ssw0rd123! /add /expires:never
net localgroup "Administrators" bebangsvc /add

# Grant permissions to application directory
icacls C:\portal-pack-meal /grant bebangsvc:(OI)(CI)F /T
```

### 5.3 PostgreSQL Security

Edit `postgresql.conf` (biasanya di `C:\Program Files\PostgreSQL\15\data\`):

```ini
# Listen on specific IP only
listen_addresses = 'localhost,192.168.3.1'
port = 5432

# Connection settings
max_connections = 100
shared_buffers = 256MB
```

Edit `pg_hba.conf`:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             192.168.3.0/24           md5
host    all             all             localhost               md5
```

Restart PostgreSQL:

```cmd
sc stop postgresql-x64-15
sc start postgresql-x64-15
```

---

## 6. Client Access Setup

### 6.1 URL Configuration

Primary URL: `http://192.168.3.1`

### 6.2 Browser Compatibility Testing

Test pada browser:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

### 6.3 Create Desktop Shortcut

Buat file `.url` untuk desktop shortcut:

```
[InternetShortcut]
URL=http://192.168.3.1
IconFile=http://192.168.3.1/favicon.ico
IconIndex=0
```

### 6.4 Network Connectivity Testing

Dari client machine, jalankan:

```cmd
# Test basic connectivity
ping 192.168.3.1

# Test HTTP access
curl http://192.168.3.1

# Test API access
curl http://192.168.3.1:3000/api/health
```

---

## 7. Monitoring & Maintenance

### 7.1 Windows Services Monitoring

```cmd
# Check PM2 services
pm2 status
pm2 monit

# Check IIS
iisreset /status

# Check PostgreSQL
sc query postgresql-x64-15
```

### 7.2 Log File Locations

- **Backend Logs**: `C:\portal-pack-meal\logs\`
- **PM2 Logs**: `C:\Users\bebangsvc\.pm2\logs\`
- **IIS Logs**: `C:\inetpub\logs\LogFiles\`
- **PostgreSQL Logs**: `C:\Program Files\PostgreSQL\15\data\log\`

### 7.3 Log Rotation Setup

Buat script `rotate-logs.bat`:

```batch
@echo off
set LOG_DIR=C:\portal-pack-meal\logs
set ARCHIVE_DIR=C:\portal-pack-meal\logs\archive

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"

if not exist "%ARCHIVE_DIR%" mkdir "%ARCHIVE_DIR%"

move "%LOG_DIR%\*.log" "%ARCHIVE_DIR%\%YYYY%%MM%%DD%\"
```

Schedule dengan Task Scheduler untuk running setiap hari.

### 7.4 Performance Monitoring

Buat script `monitor-performance.bat`:

```batch
@echo off
echo === System Performance ===
wmic cpu get loadpercentage /value
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value

echo === Application Status ===
pm2 status
curl -s http://192.168.3.1:3000/api/health
```

### 7.5 Backup Automation

Buat script `backup-database.bat`:

```batch
@echo off
set BACKUP_DIR=C:\portal-pack-meal\backups
set TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

pg_dump -h localhost -U postgres -d bebang_pack_meal_prod > "%BACKUP_DIR%\backup_%TIMESTAMP%.sql"

echo Backup completed: backup_%TIMESTAMP%.sql
```

Schedule dengan Task Scheduler untuk running setiap jam.

### 7.6 Health Check Procedures

Buat script `health-check.bat`:

```batch
@echo off
echo === Bebang Pack Meal Portal Health Check ===
echo.

echo Checking Backend API...
curl -f -s http://192.168.3.1:3000/api/health >nul
if %errorlevel% equ 0 (
    echo [OK] Backend API is responding
) else (
    echo [ERROR] Backend API is not responding
    pm2 restart bebang-backend
)

echo.
echo Checking Frontend...
curl -f -s http://192.168.3.1 >nul
if %errorlevel% equ 0 (
    echo [OK] Frontend is accessible
) else (
    echo [ERROR] Frontend is not accessible
    iisreset
)

echo.
echo Checking Database...
pg_isready -h localhost -p 5432 -U postgres >nul
if %errorlevel% equ 0 (
    echo [OK] Database is responding
) else (
    echo [ERROR] Database is not responding
    sc start postgresql-x64-15
)

echo.
echo Checking WebSocket...
curl -f -s http://192.168.3.1:3001/notifications >nul
if %errorlevel% equ 0 (
    echo [OK] WebSocket is accessible
) else (
    echo [ERROR] WebSocket is not accessible
    pm2 restart bebang-backend
)

echo.
echo Health check completed at %date% %time%
```

---

## 8. Troubleshooting Guide

### 8.1 Common Network Connectivity Issues

#### Problem: Client tidak dapat mengakses http://192.168.3.1

**Solutions:**
```cmd
# 1. Check server IP configuration
ipconfig /all

# 2. Check firewall rules
netsh advfirewall firewall show rule name="Bebang Portal HTTP"

# 3. Test local access
curl http://localhost
curl http://127.0.0.1
curl http://192.168.3.1

# 4. Check IIS status
iisreset /status

# 5. Restart IIS
iisreset
```

#### Problem: API tidak dapat diakses dari client

**Solutions:**
```cmd
# 1. Check backend service
pm2 status
pm2 logs bebang-backend

# 2. Test local API access
curl http://localhost:3000/api/health
curl http://127.0.0.1:3000/api/health
curl http://192.168.3.1:3000/api/health

# 3. Check backend firewall rule
netsh advfirewall firewall show rule name="Bebang Portal Backend"

# 4. Restart backend service
pm2 restart bebang-backend
```

### 8.2 Service Startup Failures

#### Problem: Backend service tidak start

**Solutions:**
```cmd
# 1. Check PM2 logs
pm2 logs bebang-backend --lines 50

# 2. Check environment variables
cd C:\portal-pack-meal\backend
type .env.production

# 3. Test manual start
node dist/main.js

# 4. Check database connection
npx prisma db pull

# 5. Rebuild application
npm run build
pm2 delete bebang-backend
pm2 start ecosystem.config.js
```

#### Problem: IIS tidak serve frontend dengan benar

**Solutions:**
```cmd
# 1. Check IIS logs
type "C:\inetpub\logs\LogFiles\W3SVC1\*.log"

# 2. Check web.config
type "C:\portal-pack-meal\frontend\dist\web.config"

# 3. Test static file
curl http://192.168.3.1/index.html

# 4. Restart IIS
iisreset

# 5. Recreate IIS site
# Remove existing site and recreate with correct settings
```

### 8.3 Performance Problems

#### Problem: Aplikasi berjalan lambat

**Solutions:**
```cmd
# 1. Check system resources
tasklist /fi "imagename eq node.exe"
wmic process where "name='node.exe'" get ProcessId,PageFileUsage,WorkingSetSize

# 2. Check database performance
# Connect to PostgreSQL and run:
SELECT * FROM pg_stat_activity WHERE state = 'active';

# 3. Check network latency
ping -t 192.168.3.1

# 4. Optimize PM2 configuration
# Edit ecosystem.config.js to increase instances or memory
```

### 8.4 Database Connection Issues

#### Problem: Backend tidak dapat connect ke database

**Solutions:**
```cmd
# 1. Check PostgreSQL service
sc query postgresql-x64-15

# 2. Test database connection
psql -h localhost -U postgres -d bebang_pack_meal_prod

# 3. Check database configuration
type "C:\Program Files\PostgreSQL\15\data\postgresql.conf" | findstr listen_addresses
type "C:\Program Files\PostgreSQL\15\data\pg_hba.conf"

# 4. Reset database password
# Connect as superuser and run:
ALTER USER postgres PASSWORD 'P@ssw0rd123456';

# 5. Restart PostgreSQL
sc stop postgresql-x64-15
sc start postgresql-x64-15
```

### 8.5 Emergency Recovery Procedures

#### Complete System Restart

```batch
@echo off
echo Emergency Restart Procedure
echo.

echo Stopping services...
pm2 stop all
iisreset /stop
sc stop postgresql-x64-15

echo Waiting 10 seconds...
timeout /t 10

echo Starting services...
sc start postgresql-x64-15
iisreset /start
pm2 start all

echo Checking services...
pm2 status
iisreset /status
sc query postgresql-x64-15

echo System restart completed
```

#### Database Recovery

```cmd
# 1. Check database integrity
psql -h localhost -U postgres -d bebang_pack_meal_prod -c "SELECT datname FROM pg_database WHERE datname = 'bebang_pack_meal_prod';"

# 2. Restore from backup if needed
psql -h localhost -U postgres -d bebang_pack_meal_prod < C:\portal-pack-meal\backups\latest_backup.sql

# 3. Run migrations
cd C:\portal-pack-meal\backend
npx prisma migrate deploy

# 4. Reseed data if necessary
npx prisma db seed
```

---

## 9. Maintenance Schedule

### Daily Tasks
- Check application health with `health-check.bat`
- Review error logs
- Verify backup completion

### Weekly Tasks
- Apply Windows updates
- Review performance metrics
- Clean old log files

### Monthly Tasks
- Update Node.js dependencies
- Review and rotate secrets
- Full system backup
- Security audit

---

## 10. Contact Information

For technical support:
- System Administrator: [admin-email@company.com]
- Development Team: [dev-team@company.com]
- Emergency Contact: [emergency-contact@company.com]

---

## Quick Reference Commands

```cmd
# Start all services
pm2 start all
iisreset /start

# Stop all services
pm2 stop all
iisreset /stop

# Check status
pm2 status
iisreset /status
sc query postgresql-x64-15

# View logs
pm2 logs
type "C:\inetpub\logs\LogFiles\W3SVC1\*.log"

# Health check
curl http://192.168.3.1:3000/api/health
curl http://192.168.3.1

# Database operations
psql -h localhost -U postgres -d bebang_pack_meal_prod
pg_dump -h localhost -U postgres -d bebang_pack_meal_prod > backup.sql
```

---

**Deployment completed!** Aplikasi Bebang Pack Meal Portal sekarang seharusnya sudah berjalan pada http://192.168.3.1 dengan semua service yang terkonfigurasi dengan benar.