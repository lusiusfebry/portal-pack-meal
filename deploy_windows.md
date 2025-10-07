# Tutorial Deployment Bebang Pack Meal Portal - Windows Environment

Tutorial ini disusun khusus untuk deployment aplikasi Bebang Pack Meal Portal pada environment Windows 10/11 (development/testing) dan Windows Server (production). Tutorial ini mencakup instalasi, konfigurasi, troubleshooting, dan maintenance khusus untuk ekosistem Windows.

## Daftar Isi

1. [Windows 10/11 Development/Testing Environment](#windows-1011-developmenttesting-environment)
2. [Windows Server Production Environment](#windows-server-production-environment)
3. [Windows-Specific Configurations](#windows-specific-configurations)
4. [Advanced Windows Features](#advanced-windows-features)
5. [Troubleshooting Windows Issues](#troubleshooting-windows-issues)

---

## Windows 10/11 Development/Testing Environment

### 1. Instalasi Prerequisites

#### 1.1 Node.js

**Metode 1: Download Installer (Direkomendasikan)**
1. Kunjungi [Node.js Official Website](https://nodejs.org/)
2. Download versi LTS (Long Term Support) terbaru (v20.x atau lebih)
3. Jalankan installer dengan hak akses administrator
4. Ikuti wizard instalasi dengan opsi default:
   - ✅ Add to PATH
   - ✅ Install Chocolatey (opsional)
   - ✅ Install native tools (untuk kompilasi native modules)

**Metode 2: Menggunakan Chocolatey**
```powershell
# Install Chocolatey (jika belum terinstall)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js LTS
choco install nodejs-lts -y
```

**Verifikasi Instalasi:**
```powershell
node --version
npm --version
```

#### 1.2 PostgreSQL

**Metode 1: Download Installer (Direkomendasikan)**
1. Kunjungi [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)
2. Download installer untuk Windows
3. Jalankan installer dengan hak akses administrator
4. Ikuti wizard instalasi:
   - Password: `postgres123` (atau password yang Anda inginkan)
   - Port: `5432` (default)
   - ✅ Install pgAdmin 4
   - ✅ Stack Builder (opsional)

**Metode 2: Menggunakan Chocolatey**
```powershell
# Install PostgreSQL
choco install postgresql -y
```

**Konfigurasi PostgreSQL di Windows:**
1. Buka pgAdmin 4
2. Klik kanan pada server → Connect
3. Buat database baru:
   - Klik kanan pada Databases → Create → Database
   - Database name: `bebang_pack_meal`
   - Owner: `postgres`

#### 1.3 Git

**Metode 1: Download Installer (Direkomendasikan)**
1. Kunjungi [Git Official Website](https://git-scm.com/download/win)
2. Download installer untuk Windows
3. Jalankan installer dengan opsi default:
   - ✅ Git from the command line and also from 3rd-party software
   - ✅ Use the native Windows Secure Channel library
   - ✅ Checkout Windows-style, commit Unix-style line endings

**Metode 2: Menggunakan Chocolatey**
```powershell
# Install Git
choco install git -y
```

**Verifikasi Instalasi:**
```powershell
git --version
```

### 2. Setup Development Environment

#### 2.1 Clone Repository

```powershell
# Clone repository menggunakan HTTPS
git clone https://github.com/username/portal-pack-meal.git
cd portal-pack-meal

# Atau menggunakan SSH (jika sudah setup SSH key)
git clone git@github.com:username/portal-pack-meal.git
cd portal-pack-meal
```

#### 2.2 Install Dependencies

```powershell
# Install semua dependencies untuk backend dan frontend
npm run install:all

# Atau install secara manual
cd backend
npm install

cd ../frontend
npm install
```

#### 2.3 Setup Environment Variables

**Backend Environment (.env):**
```powershell
# Buat file .env dari template
Copy-Item .env.example .env

# Edit file .env menggunakan notepad atau VS Code
notepad .env
```

Isi dengan konfigurasi berikut:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/bebang_pack_meal?schema=public
JWT_SECRET=supersecretjwt
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=supersecretrefresh
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
WS_PORT=3001
```

**Frontend Environment (.env):**
```powershell
# Buat file .env dari template
Copy-Item frontend\.env.example frontend\.env

# Edit file .env
notepad frontend\.env
```

Isi dengan konfigurasi berikut:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3001
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```

#### 2.4 Database Setup

```powershell
# Generate Prisma client
cd backend
npx prisma generate

# Jalankan migration
npx prisma migrate dev --name init

# Seed data
npx prisma db seed
```

### 3. Running Aplikasi untuk Testing Lokal

#### 3.1 Development Mode

```powershell
# Dari root directory, jalankan kedua server
npm run dev

# Atau jalankan secara terpisah di terminal berbeda
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### 3.2 Production Mode (Testing)

```powershell
# Build aplikasi
npm run build

# Jalankan di production mode
npm run start:prod

# Atau jalankan secara terpisah
# Terminal 1 - Backend
cd backend
npm run start:prod

# Terminal 2 - Frontend
cd frontend
npm run preview
```

### 4. Troubleshooting Windows-Specific Issues

#### 4.1 Port Conflict

**Masalah:** Port 3000 atau 5173 sudah digunakan.

**Solusi:**
```powershell
# Cari proses yang menggunakan port
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Kill proses menggunakan PID
taskkill /PID <PID> /F

# Atau ubah port di .env
PORT=3001
```

#### 4.2 Node.js Module Build Errors

**Masalah:** Error saat kompilasi native modules.

**Solusi:**
```powershell
# Install Windows Build Tools
npm install -g windows-build-tools

# Atau install menggunakan Chocolatey
choco install visualstudio2019buildtools -y
choco install python -y
```

#### 4.3 PostgreSQL Connection Issues

**Masalah:** Tidak dapat terhubung ke PostgreSQL.

**Solusi:**
```powershell
# Verifikasi service PostgreSQL berjalan
Get-Service postgresql*

# Start service PostgreSQL
Start-Service postgresql-x64-14

# Verifikasi connection
psql -U postgres -h localhost -p 5432 -d postgres
```

#### 4.4 Path Length Issues

**Masalah:** Path terlalu panjang di Windows.

**Solusi:**
```powershell
# Enable long path support di Windows 10/11
# Buka Group Policy Editor (gpedit.msc)
# Navigate to: Local Computer Policy > Computer Configuration > Administrative Templates > System > Filesystem
# Enable: Enable Win32 long paths

# Atau menggunakan PowerShell dengan admin rights
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1
```

---

## Windows Server Production Environment

### 1. Server Preparation dan Security Hardening

#### 1.1 System Requirements

**Minimum Requirements:**
- Windows Server 2019 atau 2022
- 4 CPU cores
- 8 GB RAM
- 50 GB SSD storage
- Network connection

**Recommended Requirements:**
- Windows Server 2022
- 8 CPU cores
- 16 GB RAM
- 100 GB SSD storage
- Redundant network connection

#### 1.2 Initial Server Setup

**1. Update Windows Server:**
```powershell
# Run Windows Update
Install-Module -Name PSWindowsUpdate
Get-WindowsUpdate
Install-WindowsUpdate -AcceptAll -AutoReboot
```

**2. Configure Windows Firewall:**
```powershell
# Enable Firewall
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

# Allow Node.js ports
New-NetFirewallRule -DisplayName "Node.js Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Node.js Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "WebSocket" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Allow PostgreSQL
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
```

**3. Disable Unused Services:**
```powershell
# Disable unnecessary services
Set-Service -Name "PrintNotify" -StartupType Disabled
Set-Service -Name "Fax" -StartupType Disabled
Set-Service -Name "Telnet" -StartupType Disabled
```

#### 1.3 User and Security Setup

**1. Create Service Account:**
```powershell
# Create user untuk service
New-LocalUser -Name "bebangservice" -PasswordNeverExpires -Description "Bebang Pack Meal Service Account" -Password (ConvertTo-SecureString "StrongPassword123!" -AsPlainText -Force)

# Add user to appropriate groups
Add-LocalGroupMember -Group "Users" -Member "bebangservice"
```

**2. Configure Folder Permissions:**
```powershell
# Create application directory
New-Item -Path "C:\BebangApp" -ItemType Directory -Force

# Set permissions
$acl = Get-Acl "C:\BebangApp"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("bebangservice","FullControl","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($accessRule)
Set-Acl "C:\BebangApp" $acl
```

### 2. Instalasi Services sebagai Windows Services

#### 2.1 Install PM2 (Process Manager)

```powershell
# Install PM2 globally
npm install -g pm2
npm install -g pm2-windows-service
```

#### 2.2 Configure PM2 as Windows Service

**1. Install PM2 as Service:**
```powershell
# Install PM2 as Windows Service
pm2-service-install -n PM2

# Set service to start automatically
Set-Service -Name "PM2" -StartupType Automatic
Start-Service -Name "PM2"
```

**2. Configure PM2 for Application:**
```powershell
# Create PM2 ecosystem file
New-Item -Path "C:\BebangApp\ecosystem.config.js" -ItemType File -Force
```

Isi file `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'bebang-backend',
      script: './backend/dist/main.js',
      cwd: 'C:\\BebangApp',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'bebang-frontend',
      script: 'serve',
      args: '-s frontend/dist -l 5173',
      cwd: 'C:\\BebangApp',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

#### 2.3 Deploy Application Files

**1. Copy Application Files:**
```powershell
# Copy dari development machine atau clone repository
git clone https://github.com/username/portal-pack-meal.git C:\BebangApp

# Atau copy dari development machine
# robocopy \\dev-machine\shared\portal-pack-meal C:\BebangApp /E
```

**2. Build Application:**
```powershell
cd C:\BebangApp

# Install dependencies
npm run install:all

# Build application
npm run build
```

**3. Setup Production Environment:**
```powershell
# Copy production environment files
Copy-Item backend\.env.production.example backend\.env
Copy-Item frontend\.env.production.example frontend\.env

# Edit environment files
notepad backend\.env
notepad frontend\.env
```

Isi dengan konfigurasi production:
```env
# backend\.env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:StrongPassword123!@localhost:5432/bebang_pack_meal?schema=public
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://your-domain.com
WS_PORT=3001
```

```env
# frontend\.env
VITE_API_BASE_URL=http://your-domain.com/api
VITE_WS_URL=http://your-domain.com:3001
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
```

#### 2.4 Start Application with PM2

```powershell
# Start application dengan PM2
cd C:\BebangApp
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 3. IIS sebagai Reverse Proxy

#### 3.1 Install IIS

```powershell
# Install IIS dengan required modules
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-StaticContent, IIS-HttpRedirect, IIS-ApplicationDevelopment, IIS-NetFxExtensibility45, IIS-HealthAndDiagnostics, IIS-HttpCompression, IIS-Security, IIS-RequestFiltering, IIS-Performance, IIS-WebServerManagementTools, IIS-ManagementConsole, IIS-ManagementScriptingTools, IIS-IIS6ManagementCompatibility, IIS-Metabase, IIS-ASPNET45
```

#### 3.2 Install URL Rewrite Module

Download dan install [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)

#### 3.3 Configure IIS Site

**1. Create Website:**
```powershell
# Create website directory
New-Item -Path "C:\inetpub\wwwroot\bebang" -ItemType Directory -Force

# Create IIS site
Import-Module WebAdministration
New-Website -Name "Bebang Pack Meal" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\bebang"
```

**2. Configure web.config:**

Buat file `C:\inetpub\wwwroot\bebang\web.config`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Backend API proxy -->
        <rule name="Backend API" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3000/api/{R:1}" />
        </rule>
        
        <!-- WebSocket proxy -->
        <rule name="WebSocket" stopProcessing="true">
          <match url="^socket.io/(.*)" />
          <action type="Rewrite" url="http://localhost:3001/socket.io/{R:1}" />
        </rule>
        
        <!-- Frontend SPA fallback -->
        <rule name="Frontend SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="http://localhost:5173/{R:0}" />
        </rule>
      </rules>
    </rewrite>
    
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Origin" value="*" />
        <add name="Access-Control-Allow-Methods" value="GET,POST,PUT,DELETE,OPTIONS" />
        <add name="Access-Control-Allow-Headers" value="Content-Type,Authorization" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

### 4. PowerShell Scripts untuk Automation

#### 4.1 Deployment Script

Buat file `deploy.ps1`:
```powershell
param(
    [string]$SourcePath = "C:\temp\portal-pack-meal",
    [string]$DestinationPath = "C:\BebangApp",
    [string]$BackupPath = "C:\BebangApp\Backups"
)

# Create backup
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $BackupPath "backup-$timestamp"
New-Item -Path $backupDir -ItemType Directory -Force
Copy-Item -Path "$DestinationPath\*" -Destination $backupDir -Recurse -Force

# Stop services
pm2 stop all

# Update application files
Remove-Item -Path "$DestinationPath\*" -Recurse -Force -Exclude "Backups"
Copy-Item -Path "$SourcePath\*" -Destination $DestinationPath -Recurse -Force

# Install dependencies and build
Set-Location $DestinationPath
npm run install:all
npm run build

# Start services
pm2 start ecosystem.config.js --env production
pm2 save

Write-Host "Deployment completed successfully!"
```

#### 4.2 Maintenance Script

Buat file `maintenance.ps1`:
```powershell
# Clean old backups (keep last 7 days)
$backupPath = "C:\BebangApp\Backups"
$cutoffDate = (Get-Date).AddDays(-7)
Get-ChildItem -Path $backupPath | Where-Object { $_.CreationTime -lt $cutoffDate } | Remove-Item -Recurse -Force

# Restart PM2 services
pm2 restart all

# Clear logs
pm2 flush

# Check service status
pm2 status

Write-Host "Maintenance completed successfully!"
```

#### 4.3 Health Check Script

Buat file `health-check.ps1`:
```powershell
$backendUrl = "http://localhost:3000/api/health"
$frontendUrl = "http://localhost:5173"

try {
    $backendResponse = Invoke-WebRequest -Uri $backendUrl -UseBasicParsing -TimeoutSec 10
    $frontendResponse = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 10
    
    if ($backendResponse.StatusCode -eq 200 -and $frontendResponse.StatusCode -eq 200) {
        Write-Host "All services are healthy"
        exit 0
    } else {
        Write-Host "Service health check failed"
        exit 1
    }
} catch {
    Write-Host "Health check error: $_"
    exit 1
}
```

### 5. Windows Firewall Configuration

#### 5.1 Advanced Firewall Rules

```powershell
# Create firewall rules for specific IP ranges
New-NetFirewallRule -DisplayName "Bebang App - Internal Network" -Direction Inbound -LocalPort 3000,5173,3001 -Protocol TCP -Action Allow -RemoteAddress 192.168.1.0/24

# Block external access to PostgreSQL
New-NetFirewallRule -DisplayName "Block External PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Block -RemoteAddress Any

# Allow specific admin IPs
New-NetFirewallRule -DisplayName "Admin Access" -Direction Inbound -LocalPort 3000,5173,3001 -Protocol TCP -Action Allow -RemoteAddress 203.0.113.0/24
```

#### 5.2 Monitoring Firewall Logs

```powershell
# Enable firewall logging
Set-NetFirewallProfile -Profile Domain,Public,Private -LogFileName %SystemRoot%\System32\LogFiles\Firewall\pfirewall.log -LogMaxSize 4096 -LogAllowed True -LogBlocked True

# View recent blocked connections
Get-Content $env:SystemRoot\System32\LogFiles\Firewall\pfirewall.log | Select-Object -Last 50
```

### 6. Performance Monitoring dengan Windows Tools

#### 6.1 Performance Monitor Setup

```powershell
# Create performance monitor data collector set
New-PerformanceCounter -ListSet "Processor", "Memory", "Network Interface", "PhysicalDisk"

# Create data collector set
$collectorSet = New-Object -ComObject Pla.DataCollectorSet
$collectorSet.DisplayName = "Bebang App Performance"
$collectorSet.SetXml(@"
<DataCollectorSet>
    <DisplayName>Bebang App Performance</DisplayName>
    <Description>Performance monitoring for Bebang Pack Meal Portal</Description>
    <DataCollectors>
        <DataCollector>
            <DataCollectorType>PerformanceCounter</DataCollectorType>
            <PerformanceCounter>
                <Counter>\Processor(_Total)\% Processor Time</Counter>
                <Counter>\Memory\Available MBytes</Counter>
                <Counter>\Network Interface(*)\Bytes Total/sec</Counter>
                <Counter>\PhysicalDisk(_Total)\Disk Reads/sec</Counter>
                <Counter>\PhysicalDisk(_Total)\Disk Writes/sec</Counter>
            </PerformanceCounter>
            <SampleInterval>60</SampleInterval>
        </DataCollector>
    </DataCollectors>
    <Schedule>
        <Days>1,2,3,4,5,6,7</Days>
        <StartTime>00:00</StartTime>
    </Schedule>
</DataCollectorSet>
"@)
$collectorSet.Commit("Bebang App Performance", 0) | Out-Null
$collectorSet.Start($false)
```

#### 6.2 Resource Monitor

```powershell
# Monitor specific processes
Get-Process -Name "node" | Select-Object ProcessName, Id, CPU, WorkingSet, PagedMemorySize

# Monitor network connections
netstat -ano | findstr :3000
netstat -ano | findstr :5173
netstat -ano | findstr :3001
```

---

## Windows-Specific Configurations

### 1. Environment Variables Setup di Windows

#### 1.1 System Environment Variables

**Menggunakan GUI:**
1. Buka System Properties (Win + R, ketik `sysdm.cpl`)
2. Klik tab "Advanced"
3. Klik "Environment Variables"
4. Tambahkan variabel berikut:

**System Variables:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:StrongPassword123!@localhost:5432/bebang_pack_meal?schema=public
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://your-domain.com
WS_PORT=3001
```

**Menggunakan PowerShell:**
```powershell
# Set system environment variables
[Environment]::SetEnvironmentVariable("NODE_ENV", "production", "Machine")
[Environment]::SetEnvironmentVariable("PORT", "3000", "Machine")
[Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://postgres:StrongPassword123!@localhost:5432/bebang_pack_meal?schema=public", "Machine")
[Environment]::SetEnvironmentVariable("JWT_SECRET", "your-super-secret-jwt-key-here", "Machine")
[Environment]::SetEnvironmentVariable("JWT_EXPIRES_IN", "15m", "Machine")
[Environment]::SetEnvironmentVariable("JWT_REFRESH_SECRET", "your-super-secret-refresh-key-here", "Machine")
[Environment]::SetEnvironmentVariable("JWT_REFRESH_EXPIRES_IN", "7d", "Machine")
[Environment]::SetEnvironmentVariable("CORS_ORIGIN", "http://your-domain.com", "Machine")
[Environment]::SetEnvironmentVariable("WS_PORT", "3001", "Machine")
```

#### 1.2 User Environment Variables

```powershell
# Set user environment variables
[Environment]::SetEnvironmentVariable("VITE_API_BASE_URL", "http://your-domain.com/api", "User")
[Environment]::SetEnvironmentVariable("VITE_WS_URL", "http://your-domain.com:3001", "User")
[Environment]::SetEnvironmentVariable("VITE_APP_NAME", "Bebang Pack Meal Portal", "User")
[Environment]::SetEnvironmentVariable("VITE_APP_VERSION", "1.0.0", "User")
[Environment]::SetEnvironmentVariable("VITE_NODE_ENV", "production", "User")
```

### 2. PowerShell Scripts untuk Deployment

#### 2.1 Automated Deployment Script

Buat file `scripts/deploy-automated.ps1`:
```powershell
<#
.SYNOPSIS
    Automated deployment script for Bebang Pack Meal Portal
.DESCRIPTION
    This script automates the deployment process including backup, update, and service restart
.PARAMETER Environment
    Target environment (development, staging, production)
.PARAMETER SourcePath
    Source path of the application files
.PARAMETER BackupPath
    Backup path for existing files
.EXAMPLE
    .\deploy-automated.ps1 -Environment "production" -SourcePath "C:\temp\portal-pack-meal" -BackupPath "C:\BebangApp\Backups"
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = "C:\BebangApp\Backups"
)

# Import required modules
Import-Module WebAdministration

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if running as administrator
if (-not (Test-Administrator)) {
    Write-ColorOutput "This script must be run as Administrator!" -Color "Red"
    exit 1
}

# Validate source path
if (-not (Test-Path $SourcePath)) {
    Write-ColorOutput "Source path does not exist: $SourcePath" -Color "Red"
    exit 1
}

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupPath)) {
    New-Item -Path $BackupPath -ItemType Directory -Force
}

# Generate timestamp for backup
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $BackupPath "backup-$timestamp-$Environment"

Write-ColorOutput "Starting deployment for $Environment environment..." -Color "Green"
Write-ColorOutput "Creating backup in $backupDir..." -Color "Yellow"

# Create backup
try {
    New-Item -Path $backupDir -ItemType Directory -Force
    Copy-Item -Path "C:\BebangApp\*" -Destination $backupDir -Recurse -Force
    Write-ColorOutput "Backup created successfully!" -Color "Green"
} catch {
    Write-ColorOutput "Failed to create backup: $_" -Color "Red"
    exit 1
}

# Stop PM2 services
Write-ColorOutput "Stopping PM2 services..." -Color "Yellow"
try {
    pm2 stop all
    Write-ColorOutput "PM2 services stopped!" -Color "Green"
} catch {
    Write-ColorOutput "Failed to stop PM2 services: $_" -Color "Red"
    exit 1
}

# Update application files
Write-ColorOutput "Updating application files..." -Color "Yellow"
try {
    Remove-Item -Path "C:\BebangApp\*" -Recurse -Force -Exclude "Backups"
    Copy-Item -Path "$SourcePath\*" -Destination "C:\BebangApp" -Recurse -Force
    Write-ColorOutput "Application files updated!" -Color "Green"
} catch {
    Write-ColorOutput "Failed to update application files: $_" -Color "Red"
    exit 1
}

# Install dependencies and build
Write-ColorOutput "Installing dependencies and building application..." -Color "Yellow"
try {
    Set-Location "C:\BebangApp"
    npm run install:all
    npm run build
    Write-ColorOutput "Application built successfully!" -Color "Green"
} catch {
    Write-ColorOutput "Failed to build application: $_" -Color "Red"
    exit 1
}

# Start PM2 services
Write-ColorOutput "Starting PM2 services..." -Color "Yellow"
try {
    pm2 start ecosystem.config.js --env $Environment
    pm2 save
    Write-ColorOutput "PM2 services started!" -Color "Green"
} catch {
    Write-ColorOutput "Failed to start PM2 services: $_" -Color "Red"
    exit 1
}

# Health check
Write-ColorOutput "Performing health check..." -Color "Yellow"
Start-Sleep -Seconds 10

try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 10
    
    if ($backendResponse.StatusCode -eq 200 -and $frontendResponse.StatusCode -eq 200) {
        Write-ColorOutput "Health check passed! Deployment completed successfully!" -Color "Green"
    } else {
        Write-ColorOutput "Health check failed! Services may not be running correctly." -Color "Red"
        exit 1
    }
} catch {
    Write-ColorOutput "Health check failed: $_" -Color "Red"
    exit 1
}

Write-ColorOutput "Deployment completed successfully for $Environment environment!" -Color "Green"
```

#### 2.2 Database Backup Script

Buat file `scripts/backup-database.ps1`:
```powershell
<#
.SYNOPSIS
    Database backup script for Bebang Pack Meal Portal
.DESCRIPTION
    This script creates automated backups of the PostgreSQL database
.PARAMETER DatabaseName
    Name of the database to backup
.PARAMETER BackupPath
    Path where backup files will be stored
.PARAMETER RetentionDays
    Number of days to keep backup files
.EXAMPLE
    .\backup-database.ps1 -DatabaseName "bebang_pack_meal" -BackupPath "C:\BebangApp\DatabaseBackups" -RetentionDays 7
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "bebang_pack_meal",
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = "C:\BebangApp\DatabaseBackups",
    
    [Parameter(Mandatory=$false)]
    [int]$RetentionDays = 7
)

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupPath)) {
    New-Item -Path $BackupPath -ItemType Directory -Force
}

# Generate timestamp for backup
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $BackupPath "$DatabaseName-backup-$timestamp.sql"

Write-ColorOutput "Starting database backup for $DatabaseName..." -Color "Green"

# Create backup using pg_dump
try {
    $env:PGPASSWORD = "postgres123"
    & "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" -h localhost -U postgres -d $DatabaseName -f $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "Database backup created successfully: $backupFile" -Color "Green"
        
        # Compress backup file
        $compressedFile = "$backupFile.zip"
        Compress-Archive -Path $backupFile -DestinationPath $compressedFile -Force
        Remove-Item $backupFile -Force
        
        Write-ColorOutput "Backup compressed: $compressedFile" -Color "Green"
    } else {
        Write-ColorOutput "Database backup failed!" -Color "Red"
        exit 1
    }
} catch {
    Write-ColorOutput "Database backup error: $_" -Color "Red"
    exit 1
}

# Clean old backups
Write-ColorOutput "Cleaning old backups (older than $RetentionDays days)..." -Color "Yellow"
$cutoffDate = (Get-Date).AddDays(-$RetentionDays)

Get-ChildItem -Path $BackupPath -Filter "*.zip" | Where-Object { $_.CreationTime -lt $cutoffDate } | ForEach-Object {
    Write-ColorOutput "Removing old backup: $($_.Name)" -Color "Yellow"
    Remove-Item $_.FullName -Force
}

Write-ColorOutput "Database backup completed successfully!" -Color "Green"
```

### 3. Windows Services Configuration

#### 3.1 Create Custom Windows Service

Buat file `scripts/install-service.ps1`:
```powershell
<#
.SYNOPSIS
    Install Bebang Pack Meal Portal as Windows Service
.DESCRIPTION
    This script installs the application as a Windows Service using NSSM (Non-Sucking Service Manager)
.PARAMETER ServiceName
    Name of the Windows Service
.PARAMETER ServicePath
    Path to the application executable
.PARAMETER ServiceArgs
    Arguments to pass to the executable
.EXAMPLE
    .\install-service.ps1 -ServiceName "BebangBackend" -ServicePath "C:\BebangApp\backend\dist\main.js" -ServiceArgs ""
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName,
    
    [Parameter(Mandatory=$true)]
    [string]$ServicePath,
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceArgs = ""
)

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-ColorOutput "This script must be run as Administrator!" -Color "Red"
    exit 1
}

# Download and install NSSM if not already installed
$nssmPath = "C:\nssm\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    Write-ColorOutput "Downloading NSSM..." -Color "Yellow"
    New-Item -Path "C:\nssm" -ItemType Directory -Force
    
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile("https://nssm.cc/release/nssm-2.24.zip", "C:\nssm\nssm.zip")
    
    Expand-Archive -Path "C:\nssm\nssm.zip" -DestinationPath "C:\nssm" -Force
    Copy-Item "C:\nssm\nssm-2.24\win64\nssm.exe" -Destination "C:\nssm\nssm.exe" -Force
    
    # Cleanup
    Remove-Item "C:\nssm\nssm.zip" -Force
    Remove-Item "C:\nssm\nssm-2.24" -Recurse -Force
    
    Write-ColorOutput "NSSM installed successfully!" -Color "Green"
}

# Install service
Write-ColorOutput "Installing Windows Service: $ServiceName..." -Color "Yellow"

try {
    & $nssmPath install $ServiceName "node" $ServicePath $ServiceArgs
    
    # Configure service
    & $nssmPath set $ServiceName DisplayName "Bebang Pack Meal - $ServiceName"
    & $nssmPath set $ServiceName Description "Bebang Pack Meal Portal - $ServiceName Service"
    & $nssmPath set $ServiceName Start SERVICE_AUTO_START
    & $nssmPath set $ServiceName AppEnvironmentExtra "NODE_ENV=production"
    & $nssmPath set $ServiceName AppStdout "C:\BebangApp\Logs\$ServiceName.log"
    & $nssmPath set $ServiceName AppStderr "C:\BebangApp\Logs\$ServiceName.error.log"
    & $nssmPath set $ServiceName AppRotateFiles 1
    & $nssmPath set $ServiceName AppRotateOnline 1
    & $nssmPath set $ServiceName AppRotateBytes 1048576
    
    # Create log directory if it doesn't exist
    New-Item -Path "C:\BebangApp\Logs" -ItemType Directory -Force
    
    Write-ColorOutput "Windows Service installed successfully!" -Color "Green"
    
    # Start service
    Start-Service -Name $ServiceName
    Write-ColorOutput "Windows Service started successfully!" -Color "Green"
    
} catch {
    Write-ColorOutput "Failed to install Windows Service: $_" -Color "Red"
    exit 1
}
```

#### 3.2 Service Management Script

Buat file `scripts/manage-service.ps1`:
```powershell
<#
.SYNOPSIS
    Manage Bebang Pack Meal Portal Windows Services
.DESCRIPTION
    This script provides functions to start, stop, restart, and check status of Windows Services
.PARAMETER Action
    Action to perform (start, stop, restart, status)
.PARAMETER ServiceName
    Name of the Windows Service (optional, defaults to all Bebang services)
.EXAMPLE
    .\manage-service.ps1 -Action "status"
    .\manage-service.ps1 -Action "restart" -ServiceName "BebangBackend"
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceName
)

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to get all Bebang services
function Get-BebangServices {
    return Get-Service | Where-Object { $_.DisplayName -like "*Bebang*" }
}

# Function to execute action on service
function Invoke-ServiceAction {
    param(
        [string]$Action,
        [string]$ServiceName
    )
    
    try {
        switch ($Action) {
            "start" {
                Start-Service -Name $ServiceName
                Write-ColorOutput "Service '$ServiceName' started successfully!" -Color "Green"
            }
            "stop" {
                Stop-Service -Name $ServiceName -Force
                Write-ColorOutput "Service '$ServiceName' stopped successfully!" -Color "Green"
            }
            "restart" {
                Restart-Service -Name $ServiceName -Force
                Write-ColorOutput "Service '$ServiceName' restarted successfully!" -Color "Green"
            }
            "status" {
                $service = Get-Service -Name $ServiceName
                $status = $service.Status
                $color = if ($status -eq "Running") { "Green" } elseif ($status -eq "Stopped") { "Red" } else { "Yellow" }
                Write-ColorOutput "Service '$ServiceName' status: $status" -Color $color
            }
        }
    } catch {
        Write-ColorOutput "Failed to $Action service '$ServiceName': $_" -Color "Red"
    }
}

# Main execution
if ($ServiceName) {
    # Execute action on specific service
    Invoke-ServiceAction -Action $Action -ServiceName $ServiceName
} else {
    # Execute action on all Bebang services
    $services = Get-BebangServices
    
    if ($services.Count -eq 0) {
        Write-ColorOutput "No Bebang services found!" -Color "Yellow"
        exit 1
    }
    
    Write-ColorOutput "Found $($services.Count) Bebang services:" -Color "Cyan"
    
    foreach ($service in $services) {
        Write-ColorOutput "- $($service.DisplayName) ($($service.Name))" -Color "Cyan"
        Invoke-ServiceAction -Action $Action -ServiceName $service.Name
    }
}
```

### 4. Backup dan Recovery Procedures

#### 4.1 Automated Backup Script

Buat file `scripts/full-backup.ps1`:
```powershell
<#
.SYNOPSIS
    Full backup script for Bebang Pack Meal Portal
.DESCRIPTION
    This script creates a complete backup of application files, database, and configuration
.PARAMETER BackupPath
    Path where backup files will be stored
.PARAMETER RetentionDays
    Number of days to keep backup files
.EXAMPLE
    .\full-backup.ps1 -BackupPath "C:\BebangApp\FullBackups" -RetentionDays 7
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = "C:\BebangApp\FullBackups",
    
    [Parameter(Mandatory=$false)]
    [int]$RetentionDays = 7
)

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupPath)) {
    New-Item -Path $BackupPath -ItemType Directory -Force
}

# Generate timestamp for backup
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $BackupPath "full-backup-$timestamp"

Write-ColorOutput "Starting full backup process..." -Color "Green"
Write-ColorOutput "Backup directory: $backupDir" -Color "Yellow"

# Create backup directory
New-Item -Path $backupDir -ItemType Directory -Force

# Backup application files
Write-ColorOutput "Backing up application files..." -Color "Yellow"
try {
    Copy-Item -Path "C:\BebangApp\*" -Destination "$backupDir\Application" -Recurse -Force -Exclude "Backups", "FullBackups", "DatabaseBackups", "Logs"
    Write-ColorOutput "Application files backed up successfully!" -Color "Green"
} catch {
    Write-ColorOutput "Failed to backup application files: $_" -Color "Red"
    exit 1
}

# Backup database
Write-ColorOutput "Backing up database..." -Color "Yellow"
try {
    $databaseBackupDir = Join-Path $backupDir "Database"
    New-Item -Path $databaseBackupDir -ItemType Directory -Force
    
    $env:PGPASSWORD = "postgres123"
    & "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" -h localhost -U postgres -d bebang_pack_meal -f "$databaseBackupDir\bebang_pack_meal.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "Database backed up successfully!" -Color "Green"
    } else {
        Write-ColorOutput "Failed to backup database!" -Color "Red"
        exit 1
    }
} catch {
    Write-ColorOutput "Database backup error: $_" -Color "Red"
    exit 1
}

# Backup Windows Registry settings
Write-ColorOutput "Backing up Windows Registry settings..." -Color "Yellow"
try {
    $registryBackupFile = Join-Path $backupDir "registry.reg"
    reg export "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\BebangBackend" $registryBackupFile /y
    reg export "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\BebangFrontend" $registryBackupFile /y
    Write-ColorOutput "Registry settings backed up successfully!" -Color "Green"
} catch {
    Write-ColorOutput "Failed to backup Registry settings: $_" -Color "Red"
    # Continue with backup process
}

# Backup IIS configuration
Write-ColorOutput "Backing up IIS configuration..." -Color "Yellow"
try {
    $iisBackupFile = Join-Path $backupDir "iis-config.xml"
    & C:\Windows\System32\inetsrv\appcmd.exe list config -xml > $iisBackupFile
    Write-ColorOutput "IIS configuration backed up successfully!" -Color "Green"
} catch {
    Write-ColorOutput "Failed to backup IIS configuration: $_" -Color "Red"
    # Continue with backup process
}

# Create backup manifest
Write-ColorOutput "Creating backup manifest..." -Color "Yellow"
$manifestFile = Join-Path $backupDir "manifest.json"
$manifest = @{
    backupDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    backupType = "Full"
    applicationPath = "C:\BebangApp"
    databaseName = "bebang_pack_meal"
    files = @{
        application = "Application"
        database = "Database"
        registry = "registry.reg"
        iisConfig = "iis-config.xml"
    }
} | ConvertTo-Json -Depth 3

Set-Content -Path $manifestFile -Value $manifest
Write-ColorOutput "Backup manifest created!" -Color "Green"

# Compress backup
Write-ColorOutput "Compressing backup..." -Color "Yellow"
$compressedFile = "$backupDir.zip"
Compress-Archive -Path $backupDir -DestinationPath $compressedFile -Force

# Remove uncompressed backup
Remove-Item $backupDir -Recurse -Force

Write-ColorOutput "Full backup completed successfully: $compressedFile" -Color "Green"

# Clean old backups
Write-ColorOutput "Cleaning old backups (older than $RetentionDays days)..." -Color "Yellow"
$cutoffDate = (Get-Date).AddDays(-$RetentionDays)

Get-ChildItem -Path $BackupPath -Filter "*.zip" | Where-Object { $_.CreationTime -lt $cutoffDate } | ForEach-Object {
    Write-ColorOutput "Removing old backup: $($_.Name)" -Color "Yellow"
    Remove-Item $_.FullName -Force
}

Write-ColorOutput "Full backup process completed successfully!" -Color "Green"
```

#### 4.2 Recovery Script

Buat file `scripts/recover.ps1`:
```powershell
<#
.SYNOPSIS
    Recovery script for Bebang Pack Meal Portal
.DESCRIPTION
    This script restores the application from a backup
.PARAMETER BackupFile
    Path to the backup file to restore from
.PARAMETER Force
    Force recovery without confirmation
.EXAMPLE
    .\recover.ps1 -BackupFile "C:\BebangApp\FullBackups\full-backup-20231001-120000.zip" -Force
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-ColorOutput "This script must be run as Administrator!" -Color "Red"
    exit 1
}

# Validate backup file
if (-not (Test-Path $BackupFile)) {
    Write-ColorOutput "Backup file does not exist: $BackupFile" -Color "Red"
    exit 1
}

# Confirmation prompt
if (-not $Force) {
    Write-ColorOutput "WARNING: This will restore the application from backup and overwrite current files!" -Color "Red"
    Write-ColorOutput "Backup file: $BackupFile" -Color "Yellow"
    $confirmation = Read-Host "Are you sure you want to continue? (y/N)"
    
    if ($confirmation -ne "y" -and $confirmation -ne "Y") {
        Write-ColorOutput "Recovery cancelled." -Color "Yellow"
        exit 0
    }
}

# Create temporary directory for extraction
$tempDir = "C:\temp\bebang-recovery-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -Path $tempDir -ItemType Directory -Force

Write-ColorOutput "Starting recovery process..." -Color "Green"
Write-ColorOutput "Extracting backup file..." -Color "Yellow"

try {
    # Extract backup file
    Expand-Archive -Path $BackupFile -DestinationPath $tempDir -Force
    
    # Read backup manifest
    $manifestFile = Join-Path $tempDir "manifest.json"
    if (Test-Path $manifestFile) {
        $manifest = Get-Content $manifestFile | ConvertFrom-Json
        Write-ColorOutput "Backup date: $($manifest.backupDate)" -Color "Cyan"
        Write-ColorOutput "Backup type: $($manifest.backupType)" -Color "Cyan"
    }
    
    # Stop services
    Write-ColorOutput "Stopping services..." -Color "Yellow"
    try {
        pm2 stop all
        Get-Service | Where-Object { $_.DisplayName -like "*Bebang*" } | Stop-Service -Force
        Write-ColorOutput "Services stopped!" -Color "Green"
    } catch {
        Write-ColorOutput "Failed to stop services: $_" -Color "Red"
        # Continue with recovery
    }
    
    # Restore application files
    Write-ColorOutput "Restoring application files..." -Color "Yellow"
    $applicationBackupPath = Join-Path $tempDir "Application"
    if (Test-Path $applicationBackupPath) {
        # Backup current application files
        $currentBackupDir = "C:\BebangApp\Backups\recovery-backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
        New-Item -Path $currentBackupDir -ItemType Directory -Force
        Copy-Item -Path "C:\BebangApp\*" -Destination $currentBackupDir -Recurse -Force -Exclude "Backups", "FullBackups", "DatabaseBackups", "Logs"
        
        # Restore application files
        Remove-Item -Path "C:\BebangApp\*" -Recurse -Force -Exclude "Backups", "FullBackups", "DatabaseBackups", "Logs"
        Copy-Item -Path "$applicationBackupPath\*" -Destination "C:\BebangApp" -Recurse -Force
        Write-ColorOutput "Application files restored!" -Color "Green"
    } else {
        Write-ColorOutput "Application backup not found in backup file!" -Color "Red"
        exit 1
    }
    
    # Restore database
    Write-ColorOutput "Restoring database..." -Color "Yellow"
    $databaseBackupPath = Join-Path $tempDir "Database\bebang_pack_meal.sql"
    if (Test-Path $databaseBackupPath) {
        try {
            $env:PGPASSWORD = "postgres123"
            & "C:\Program Files\PostgreSQL\14\bin\psql.exe" -h localhost -U postgres -d postgres -c "DROP DATABASE IF EXISTS bebang_pack_meal;"
            & "C:\Program Files\PostgreSQL\14\bin\psql.exe" -h localhost -U postgres -d postgres -c "CREATE DATABASE bebang_pack_meal;"
            & "C:\Program Files\PostgreSQL\14\bin\psql.exe" -h localhost -U postgres -d bebang_pack_meal -f $databaseBackupPath
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "Database restored successfully!" -Color "Green"
            } else {
                Write-ColorOutput "Failed to restore database!" -Color "Red"
                exit 1
            }
        } catch {
            Write-ColorOutput "Database restore error: $_" -Color "Red"
            exit 1
        }
    } else {
        Write-ColorOutput "Database backup not found in backup file!" -Color "Red"
        exit 1
    }
    
    # Restore Windows Registry settings
    Write-ColorOutput "Restoring Windows Registry settings..." -Color "Yellow"
    $registryBackupFile = Join-Path $tempDir "registry.reg"
    if (Test-Path $registryBackupFile) {
        try {
            reg import $registryBackupFile
            Write-ColorOutput "Registry settings restored successfully!" -Color "Green"
        } catch {
            Write-ColorOutput "Failed to restore Registry settings: $_" -Color "Red"
            # Continue with recovery
        }
    }
    
    # Restore IIS configuration
    Write-ColorOutput "Restoring IIS configuration..." -Color "Yellow"
    $iisBackupFile = Join-Path $tempDir "iis-config.xml"
    if (Test-Path $iisBackupFile) {
        try {
            # Note: IIS configuration restore might require manual intervention
            Write-ColorOutput "IIS configuration backup found. Manual restoration may be required." -Color "Yellow"
            Write-ColorOutput "Backup file: $iisBackupFile" -Color "Cyan"
        } catch {
            Write-ColorOutput "Failed to restore IIS configuration: $_" -Color "Red"
            # Continue with recovery
        }
    }
    
    # Start services
    Write-ColorOutput "Starting services..." -Color "Yellow"
    try {
        Set-Location "C:\BebangApp"
        pm2 start ecosystem.config.js --env production
        pm2 save
        
        Get-Service | Where-Object { $_.DisplayName -like "*Bebang*" } | Start-Service
        Write-ColorOutput "Services started!" -Color "Green"
    } catch {
        Write-ColorOutput "Failed to start services: $_" -Color "Red"
        exit 1
    }
    
    # Health check
    Write-ColorOutput "Performing health check..." -Color "Yellow"
    Start-Sleep -Seconds 10
    
    try {
        $backendResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 10
        
        if ($backendResponse.StatusCode -eq 200 -and $frontendResponse.StatusCode -eq 200) {
            Write-ColorOutput "Health check passed! Recovery completed successfully!" -Color "Green"
        } else {
            Write-ColorOutput "Health check failed! Services may not be running correctly." -Color "Red"
            exit 1
        }
    } catch {
        Write-ColorOutput "Health check failed: $_" -Color "Red"
        exit 1
    }
    
} catch {
    Write-ColorOutput "Recovery failed: $_" -Color "Red"
    exit 1
} finally {
    # Cleanup temporary directory
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
}

Write-ColorOutput "Recovery completed successfully!" -Color "Green"
```

### 5. Security Best Practices untuk Windows

#### 5.1 Windows Security Configuration

```powershell
# Configure Windows Security Policies
# 1. Password Policy
net accounts /minpwlen:12
net accounts /maxpwage:90
net accounts /minpwage:1
net accounts /uniquepw:5

# 2. Account Lockout Policy
net accounts /lockoutthreshold:5
net accounts /lockoutduration:30
net accounts /lockoutwindow:30

# 3. User Rights Assignment
# Remove unnecessary users from Administrators group
Remove-LocalGroupMember -Group "Administrators" -Member "DefaultAccount"
Remove-LocalGroupMember -Group "Administrators" -Member "Guest"

# 4. Configure Windows Defender
Set-MpPreference -DisableRealtimeMonitoring $false
Set-MpPreference -DisableBehaviorMonitoring $false
Set-MpPreference -DisableBlockAtFirstSeen $false
Set-MpPreference -DisableIOAVProtection $false
Set-MpPreference -DisableScriptScanning $false

# 5. Configure Windows Firewall
# Block all inbound connections by default
Set-NetFirewallProfile -Profile Domain,Public,Private -DefaultInboundAction Block

# Allow specific ports for Bebang application
New-NetFirewallRule -DisplayName "Bebang Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Bebang Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Bebang WebSocket" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# 6. Configure Advanced Audit Policy
auditpol /set /category:"Logon/Logoff" /success:enable /failure:enable
auditpol /set /category:"Account Management" /success:enable /failure:enable
auditpol /set /category:"Object Access" /success:enable /failure:enable
auditpol /set /category:"Privilege Use" /success:enable /failure:enable
auditpol /set /category:"Detailed Tracking" /success:enable /failure:enable
auditpol /set /category:"Policy Change" /success:enable /failure:enable
```

#### 5.2 Application Security Configuration

```powershell
# 1. Configure File Permissions
# Remove unnecessary permissions
$acl = Get-Acl "C:\BebangApp"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Users","Write","ContainerInherit,ObjectInherit","None","Deny")
$acl.SetAccessRule($accessRule)
Set-Acl "C:\BebangApp" $acl

# 2. Configure Service Account
# Create dedicated service account with minimal permissions
New-LocalUser -Name "bebangservice" -PasswordNeverExpires -Description "Bebang Pack Meal Service Account" -Password (ConvertTo-SecureString "StrongPassword123!" -AsPlainText -Force)

# Add to appropriate groups
Add-LocalGroupMember -Group "Users" -Member "bebangservice"

# Grant necessary permissions
$acl = Get-Acl "C:\BebangApp"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("bebangservice","ReadAndExecute","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($accessRule)
Set-Acl "C:\BebangApp" $acl

# 3. Configure SSL/TLS
# Install SSL certificate and bind to IIS
# Note: This requires a valid SSL certificate
Import-Module WebAdministration

# Create HTTPS binding
New-WebBinding -Name "Bebang Pack Meal" -Port 443 -Protocol https
$cert = Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*.yourdomain.com" } | Select-Object -First 1
if ($cert) {
    Get-WebBinding -Name "Bebang Pack Meal" -Port 443 -Protocol https | Set-Item -Value $cert
}

# 4. Configure Application Pool Identity
# Create dedicated application pool
New-WebAppPool -Name "BebangAppPool" -Force
Set-ItemProperty -Path "IIS:\AppPools\BebangAppPool" -Name "processModel.identityType" -Value 3
Set-ItemProperty -Path "IIS:\AppPools\BebangAppPool" -Name "processModel.userName" -Value "bebangservice"
Set-ItemProperty -Path "IIS:\AppPools\BebangAppPool" -Name "processModel.password" -Value "StrongPassword123!"

# Assign application pool to website
Set-ItemProperty -Path "IIS:\Sites\Bebang Pack Meal" -Name "applicationPool" -Value "BebangAppPool"
```

#### 5.3 Monitoring and Logging

```powershell
# 1. Configure Event Log Forwarding
# Create custom event log for Bebang application
New-EventLog -LogName "Bebang Pack Meal" -Source "BebangBackend", "BebangFrontend" -ErrorAction SilentlyContinue

# Configure log retention
Limit-EventLog -LogName "Bebang Pack Meal" -MaximumSize 10MB -OverflowAction OverwriteOlder

# 2. Configure Performance Monitoring
# Create performance counter data collector set
$collectorSet = New-Object -ComObject Pla.DataCollectorSet
$collectorSet.DisplayName = "Bebang App Performance"
$collectorSet.SetXml(@"
<DataCollectorSet>
    <DisplayName>Bebang App Performance</DisplayName>
    <Description>Performance monitoring for Bebang Pack Meal Portal</Description>
    <DataCollectors>
        <DataCollector>
            <DataCollectorType>PerformanceCounter</DataCollectorType>
            <PerformanceCounter>
                <Counter>\Processor(_Total)\% Processor Time</Counter>
                <Counter>\Memory\Available MBytes</Counter>
                <Counter>\Network Interface(*)\Bytes Total/sec</Counter>
                <Counter>\PhysicalDisk(_Total)\Disk Reads/sec</Counter>
                <Counter>\PhysicalDisk(_Total)\Disk Writes/sec</Counter>
                <Counter>\Process(node)\% Processor Time</Counter>
                <Counter>\Process(node)\Working Set</Counter>
            </PerformanceCounter>
            <SampleInterval>60</SampleInterval>
        </DataCollector>
    </DataCollectors>
    <Schedule>
        <Days>1,2,3,4,5,6,7</Days>
        <StartTime>00:00</StartTime>
    </Schedule>
</DataCollectorSet>
"@)
$collectorSet.Commit("Bebang App Performance", 0) | Out-Null
$collectorSet.Start($false)

# 3. Configure Log Monitoring Script
# Create log monitoring script
$logMonitorScript = @"
# Log monitoring script for Bebang Pack Meal Portal
# This script monitors application logs and sends alerts for critical errors

`$logPath = "C:\BebangApp\Logs"
`$errorKeywords = @("FATAL", "ERROR", "CRITICAL", "Exception")
`$alertEmail = "admin@yourdomain.com"

function Send-Alert {
    param(
        [string]`$Message,
        [string]`$Subject
    )
    
    # Send email alert
    Send-MailMessage -From `"alerts@yourdomain.com`" -To `$alertEmail -Subject `$Subject -Body `$Message -SmtpServer "smtp.yourdomain.com"
}

function Monitor-Logs {
    while (`$true) {
        Get-ChildItem -Path `$logPath -Filter "*.log" | ForEach-Object {
            `$content = Get-Content -Path `$_.FullName -Tail 10
            foreach (`$line in `$content) {
                foreach (`$keyword in `$errorKeywords) {
                    if (`$line -match `$keyword) {
                        `$message = "Error detected in `$(`$_.Name): `$line"
                        `$subject = "Bebang Pack Meal Alert: Error Detected"
                        Send-Alert -Message `$message -Subject `$subject
                        Write-EventLog -LogName "Bebang Pack Meal" -Source "LogMonitor" -EventId 1001 -EntryType Error -Message `$message
                    }
                }
            }
        }
        
        Start-Sleep -Seconds 60
    }
}

# Start monitoring
Monitor-Logs
"@

# Save log monitoring script
$logMonitorScript | Out-File -FilePath "C:\BebangApp\Scripts\log-monitor.ps1" -Encoding utf8

# Create Windows Task Scheduler job to run log monitor
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\BebangApp\Scripts\log-monitor.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
Register-ScheduledTask -TaskName "Bebang Log Monitor" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest
```

---

## Advanced Windows Features

### 1. Windows Subsystem for Linux (WSL2) Option

#### 1.1 Install WSL2

```powershell
# Enable WSL feature
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart computer
Restart-Computer -Force

# Set WSL 2 as default
wsl --set-default-version 2

# Install Linux distribution (Ubuntu)
wsl --install -d Ubuntu
```

#### 1.2 Setup Development Environment in WSL2

```bash
# Update Linux system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE USER bebang WITH PASSWORD 'bebang123';"
sudo -u postgres psql -c "CREATE DATABASE bebang_pack_meal OWNER bebang;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal TO bebang;"

# Clone repository
git clone https://github.com/username/portal-pack-meal.git
cd portal-pack-meal

# Install dependencies
npm run install:all

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment files
nano backend/.env
nano frontend/.env
```

#### 1.3 WSL2 Network Configuration

```powershell
# Configure port forwarding from Windows to WSL2
# Get WSL2 IP address
wsl hostname -I

# Create port forwarding rules (run as Administrator)
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=<WSL2_IP>
netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=<WSL2_IP>
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=<WSL2_IP>

# Add Windows Firewall rules
New-NetFirewallRule -DisplayName "WSL2 Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "WSL2 Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "WSL2 WebSocket" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### 2. Hyper-V Containerization

#### 2.1 Enable Hyper-V

```powershell
# Enable Hyper-V feature
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All

# Restart computer
Restart-Computer -Force
```

#### 2.2 Create Docker Environment

```powershell
# Install Docker Desktop for Windows
# Download from https://www.docker.com/products/docker-desktop

# Switch to Windows containers
& "C:\Program Files\Docker\Docker\DockerCli.exe" -SwitchWindowsEngine

# Create Dockerfile for backend
New-Item -Path "C:\BebangApp\Dockerfile.backend" -ItemType File -Force
```

Isi file `Dockerfile.backend`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY backend/prisma ./prisma/
COPY backend/dist ./dist/

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main.js"]
```

```powershell
# Create Dockerfile for frontend
New-Item -Path "C:\BebangApp\Dockerfile.frontend" -ItemType File -Force
```

Isi file `Dockerfile.frontend`:
```dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm ci

# Copy source code and build
COPY frontend/ ./
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### 2.3 Docker Compose Configuration

```powershell
# Create docker-compose.yml
New-Item -Path "C:\BebangApp\docker-compose.yml" -ItemType File -Force
```

Isi file `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: bebang_pack_meal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - bebang-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/bebang_pack_meal?schema=public
      JWT_SECRET: your-super-secret-jwt-key-here
      JWT_EXPIRES_IN: 15m
      JWT_REFRESH_SECRET: your-super-secret-refresh-key-here
      JWT_REFRESH_EXPIRES_IN: 7d
      CORS_ORIGIN: http://localhost
      WS_PORT: 3001
    ports:
      - "3000:3000"
      - "3001:3001"
    depends_on:
      - postgres
    networks:
      - bebang-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - bebang-network

volumes:
  postgres_data:

networks:
  bebang-network:
    driver: nat
```

#### 2.4 Deploy with Docker

```powershell
# Build and start containers
cd C:\BebangApp
docker-compose up -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed

# Check container status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Task Scheduler untuk Maintenance

#### 3.1 Create Maintenance Tasks

```powershell
# 1. Database Backup Task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\BebangApp\Scripts\backup-database.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
Register-ScheduledTask -TaskName "Bebang Database Backup" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -User "NT AUTHORITY\SYSTEM"

# 2. Full Backup Task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\BebangApp\Scripts\full-backup.ps1"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
Register-ScheduledTask -TaskName "Bebang Full Backup" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -User "NT AUTHORITY\SYSTEM"

# 3. Maintenance Task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\BebangApp\Scripts\maintenance.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 4am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
Register-ScheduledTask -TaskName "Bebang Maintenance" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -User "NT AUTHORITY\SYSTEM"

# 4. Health Check Task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\BebangApp\Scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At "*/15" * * * *  # Every 15 minutes
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
Register-ScheduledTask -TaskName "Bebang Health Check" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -User "NT AUTHORITY\SYSTEM"

# 5. Log Cleanup Task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -Command 'Get-ChildItem -Path C:\BebangApp\Logs -Filter *.log | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-7) } | Remove-Item -Force'"
$trigger = New-ScheduledTaskTrigger -Daily -At 5am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
Register-ScheduledTask -TaskName "Bebang Log Cleanup" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -User "NT AUTHORITY\SYSTEM"
```

#### 3.2 Monitor Scheduled Tasks

```powershell
# Get all Bebang tasks
Get-ScheduledTask | Where-Object { $_.TaskName -like "*Bebang*" } | Select-Object TaskName, State, LastRunTime, NextRunTime

# Get task history
Get-ScheduledTaskInfo -TaskName "Bebang Database Backup" | Select-Object LastRunTime, LastTaskResult, NumberOfMissedRuns

# Run task manually
Start-ScheduledTask -TaskName "Bebang Health Check"

# Disable task
Disable-ScheduledTask -TaskName "Bebang Full Backup"

# Enable task
Enable-ScheduledTask -TaskName "Bebang Full Backup"
```

### 4. Event Viewer untuk Monitoring

#### 4.1 Configure Custom Event Logs

```powershell
# Create custom event log for Bebang application
New-EventLog -LogName "Bebang Pack Meal" -Source "BebangBackend", "BebangFrontend", "BebangMaintenance" -ErrorAction SilentlyContinue

# Configure log retention
Limit-EventLog -LogName "Bebang Pack Meal" -MaximumSize 10MB -OverflowAction OverwriteOlder

# Grant permissions to service account
$acl = Get-Acl "HKLM:\SYSTEM\CurrentControlSet\Services\EventLog\Bebang Pack Meal"
$accessRule = New-Object System.Security.AccessControl.RegistryAccessRule("bebangservice", "FullControl", "ContainerInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl "HKLM:\SYSTEM\CurrentControlSet\Services\EventLog\Bebang Pack Meal" $acl
```

#### 4.2 Log Events from Application

```powershell
# Create logging function
function Write-BebangLog {
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet("BebangBackend", "BebangFrontend", "BebangMaintenance")]
        [string]$Source,
        
        [Parameter(Mandatory=$true)]
        [ValidateSet("Information", "Warning", "Error", "SuccessAudit", "FailureAudit")]
        [string]$EntryType,
        
        [Parameter(Mandatory=$true)]
        [int]$EventId,
        
        [Parameter(Mandatory=$true)]
        [string]$Message
    )
    
    try {
        Write-EventLog -LogName "Bebang Pack Meal" -Source $Source -EntryType $EntryType -EventId $EventId -Message $Message
    } catch {
        Write-Host "Failed to write to event log: $_" -ForegroundColor Red
    }
}

# Example usage
Write-BebangLog -Source "BebangBackend" -EntryType "Information" -EventId 1001 -Message "Application started successfully"
Write-BebangLog -Source "BebangFrontend" -EntryType "Warning" -EventId 2001 -Message "High memory usage detected"
Write-BebangLog -Source "BebangMaintenance" -EntryType "Error" -EventId 3001 -Message "Database backup failed"
```

#### 4.3 Monitor Event Logs

```powershell
# Get recent events from Bebang application log
Get-EventLog -LogName "Bebang Pack Meal" -Newest 50 | Select-Object TimeGenerated, Source, EntryType, EventId, Message

# Filter by event type
Get-EventLog -LogName "Bebang Pack Meal" -EntryType Error -Newest 20 | Select-Object TimeGenerated, Source, EventId, Message

# Filter by source
Get-EventLog -LogName "Bebang Pack Meal" -Source "BebangBackend" -Newest 20 | Select-Object TimeGenerated, EntryType, EventId, Message

# Create event log monitoring script
$eventMonitorScript = @"
# Event log monitoring script for Bebang Pack Meal Portal
# This script monitors event logs and sends alerts for critical events

`$criticalEvents = @{
    "BebangBackend" = @(3001, 3002, 3003)
    "BebangFrontend" = @(4001, 4002, 4003)
    "BebangMaintenance" = @(5001, 5002, 5003)
}

`$alertEmail = "admin@yourdomain.com"

function Send-Alert {
    param(
        [string]`$Message,
        [string]`$Subject
    )
    
    # Send email alert
    Send-MailMessage -From `"alerts@yourdomain.com`" -To `$alertEmail -Subject `$Subject -Body `$Message -SmtpServer "smtp.yourdomain.com"
}

function Monitor-EventLogs {
    while (`$true) {
        foreach (`$source in `$criticalEvents.Keys) {
            foreach (`$eventId in `$criticalEvents[`$source]) {
                `$events = Get-EventLog -LogName "Bebang Pack Meal" -Source `$source -InstanceId `$eventId -Newest 1
                
                if (`$events -and `$events.TimeGenerated -gt (Get-Date).AddMinutes(-5)) {
                    `$message = "Critical event detected: Source=`$source, EventId=`$eventId, Message=`$(`$events.Message)"
                    `$subject = "Bebang Pack Meal Alert: Critical Event"
                    Send-Alert -Message `$message -Subject `$subject
                    Write-Host `$message -ForegroundColor Red
                }
            }
        }
        
        Start-Sleep -Seconds 60
    }
}

# Start monitoring
Monitor-EventLogs
"@

# Save event monitoring script
$eventMonitorScript | Out-File -FilePath "C:\BebangApp\Scripts\event-monitor.ps1" -Encoding utf8

# Create Windows Task Scheduler job to run event monitor
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\BebangApp\Scripts\event-monitor.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
Register-ScheduledTask -TaskName "Bebang Event Monitor" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest
```

---

## Troubleshooting Windows Issues

### 1. Common Windows Deployment Issues

#### 1.1 Port Already in Use

**Problem:** Port 3000, 5173, or 3001 already in use.

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Kill process using PID
taskkill /PID <PID> /F

# Or change port in configuration
# Edit backend\.env
PORT=3001

# Edit frontend\.env
VITE_API_BASE_URL=http://localhost:3001/api
```

#### 1.2 Service Won't Start

**Problem:** Windows Service fails to start.

**Solution:**
```powershell
# Check service status
Get-Service | Where-Object { $_.DisplayName -like "*Bebang*" }

# Check service event log
Get-EventLog -LogName System -Source "Service Control Manager" -Newest 20 | Where-Object { $_.Message -like "*Bebang*" }

# Check service configuration
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\BebangBackend"

# Try to start service manually
Start-Service -Name "BebangBackend" -ErrorAction SilentlyContinue

# Check service logs
Get-Content "C:\BebangApp\Logs\BebangBackend.log" -Tail 50
```

#### 1.3 Database Connection Issues

**Problem:** Cannot connect to PostgreSQL database.

**Solution:**
```powershell
# Check PostgreSQL service
Get-Service | Where-Object { $_.Name -like "*postgresql*" }

# Start PostgreSQL service
Start-Service -Name "postgresql-x64-14"

# Test connection
$env:PGPASSWORD = "postgres123"
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -h localhost -U postgres -d postgres -c "SELECT version();"

# Check PostgreSQL logs
Get-Content "C:\Program Files\PostgreSQL\14\data\pg_log\postgresql-*.log" -Tail 50

# Reset PostgreSQL password
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -h localhost -U postgres -d postgres -c "ALTER USER postgres PASSWORD 'postgres123';"
```

#### 1.4 Permission Issues

**Problem:** Access denied errors when running application.

**Solution:**
```powershell
# Check file permissions
Get-Acl "C:\BebangApp" | Format-List

# Grant necessary permissions
$acl = Get-Acl "C:\BebangApp"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("bebangservice","FullControl","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($accessRule)
Set-Acl "C:\BebangApp" $acl

# Check service account permissions
Get-LocalUser | Where-Object { $_.Name -like "*bebang*" }

# Reset service account password
Set-LocalUser -Name "bebangservice" -PasswordNeverExpires $true
$securePassword = ConvertTo-SecureString "NewStrongPassword123!" -AsPlainText -Force
Set-LocalUser -Name "bebangservice" -Password $securePassword
```

#### 1.5 Memory Issues

**Problem:** Application runs out of memory.

**Solution:**
```powershell
# Check memory usage
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Select-Object ProcessName, Id, CPU, WorkingSet, PagedMemorySize | Sort-Object WorkingSet -Descending

# Increase Node.js memory limit
# Edit PM2 ecosystem file
# Add: "node_args": "--max-old-space-size=4096"

# Restart services
pm2 restart all

# Configure Windows to use more memory for applications
# Edit system properties
# Advanced system settings > Performance > Advanced > Virtual memory > Change
# Set custom size: Initial size = 4096MB, Maximum size = 8192MB
```

### 2. Performance Issues

#### 2.1 Slow Response Times

**Problem:** Application responds slowly.

**Solution:**
```powershell
# Check CPU usage
Get-Counter -Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 10

# Check memory usage
Get-Counter -Counter "\Memory\Available MBytes" -SampleInterval 1 -MaxSamples 10

# Check disk usage
Get-Counter -Counter "\PhysicalDisk(_Total)\Disk Reads/sec", "\PhysicalDisk(_Total)\Disk Writes/sec" -SampleInterval 1 -MaxSamples 10

# Check network usage
Get-Counter -Counter "\Network Interface(*)\Bytes Total/sec" -SampleInterval 1 -MaxSamples 10

# Optimize database
# Reindex database
$env:PGPASSWORD = "postgres123"
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -h localhost -U postgres -d bebang_pack_meal -c "REINDEX DATABASE bebang_pack_meal;"

# Update statistics
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -h localhost -U postgres -d bebang_pack_meal -c "ANALYZE;"
```

#### 2.2 High CPU Usage

**Problem:** Node.js processes consume high CPU.

**Solution:**
```powershell
# Identify high CPU processes
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Select-Object ProcessName, Id, CPU | Sort-Object CPU -Descending

# Profile Node.js process
# Install clinic.js
npm install -g clinic

# Profile application
cd C:\BebangApp\backend
clinic doctor -- node dist/main.js

# Generate flame graph
clinic flame -- node dist/main.js

# Optimize code based on profiling results
```

### 3. Security Issues

#### 3.1 Unauthorized Access

**Problem:** Unauthorized users accessing the application.

**Solution:**
```powershell
# Check Windows Firewall rules
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*Bebang*" }

# Block unauthorized IP addresses
New-NetFirewallRule -DisplayName "Block Unauthorized IP" -Direction Inbound -RemoteAddress 192.168.1.100 -Action Block

# Enable Windows Firewall logging
Set-NetFirewallProfile -Profile Domain,Public,Private -LogFileName "%SystemRoot%\System32\LogFiles\Firewall\pfirewall.log" -LogMaxSize 4096 -LogAllowed True -LogBlocked True

# Review firewall logs
Get-Content $env:SystemRoot\System32\LogFiles\Firewall\pfirewall.log | Select-Object -Last 50
```

#### 3.2 SSL/TLS Issues

**Problem:** SSL certificate errors.

**Solution:**
```powershell
# Check SSL certificate
Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*.yourdomain.com" }

# Check certificate expiration
Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*.yourdomain.com" } | Select-Object Subject, NotAfter

# Renew SSL certificate
# Use your certificate provider's renewal process

# Bind new certificate to IIS
$cert = Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*.yourdomain.com" } | Select-Object -First 1
Get-WebBinding -Name "Bebang Pack Meal" -Port 443 -Protocol https | Set-Item -Value $cert
```

### 4. Backup and Recovery Issues

#### 4.1 Backup Fails

**Problem:** Automated backup fails.

**Solution:**
```powershell
# Check backup logs
Get-Content "C:\BebangApp\Logs\backup.log" -Tail 50

# Check disk space
Get-PSDrive -Name C | Select-Object Name, @{Name="Used (GB)"; Expression={[math]::Round($_.Used / 1GB, 2)}}, @{Name="Free (GB)"; Expression={[math]::Round($_.Free / 1GB, 2)}}

# Test database connection
$env:PGPASSWORD = "postgres123"
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -h localhost -U postgres -d bebang_pack_meal -c "SELECT 1;"

# Run backup manually
C:\BebangApp\Scripts\backup-database.ps1
```

#### 4.2 Recovery Fails

**Problem:** Recovery from backup fails.

**Solution:**
```powershell
# Check backup file integrity
$backupFile = "C:\BebangApp\FullBackups\full-backup-20231001-120000.zip"
if (Test-Path $backupFile) {
    Write-Host "Backup file exists"
} else {
    Write-Host "Backup file not found"
}

# Test backup file extraction
$tempDir = "C:\temp\test-extract"
New-Item -Path $tempDir -ItemType Directory -Force
try {
    Expand-Archive -Path $backupFile -DestinationPath $tempDir -Force
    Write-Host "Backup file extracted successfully"
} catch {
    Write-Host "Backup file extraction failed: $_"
} finally {
    Remove-Item $tempDir -Recurse -Force
}

# Check database backup
$databaseBackup = "C:\temp\test-extract\Database\bebang_pack_meal.sql"
if (Test-Path $databaseBackup) {
    Write-Host "Database backup exists"
} else {
    Write-Host "Database backup not found"
}

# Run recovery manually
C:\BebangApp\Scripts\recover.ps1 -BackupFile $backupFile -Force
```

---

## Kesimpulan

Tutorial ini telah membahas secara komprehensif proses deployment aplikasi Bebang Pack Meal Portal pada environment Windows, mulai dari setup development di Windows 10/11 hingga konfigurasi production di Windows Server. Beberapa poin penting yang perlu diingat:

1. **Prerequisites**: Pastikan semua software yang diperlukan (Node.js, PostgreSQL, Git) terinstall dengan versi yang kompatibel.

2. **Environment Variables**: Konfigurasi environment variables dengan benar untuk development dan production.

3. **Windows Services**: Gunakan PM2 atau Windows Services untuk menjalankan aplikasi sebagai layanan background.

4. **IIS Reverse Proxy**: Konfigurasi IIS sebagai reverse proxy untuk production environment.

5. **Security**: Implementasikan security best practices termasuk firewall, permissions, dan SSL/TLS.

6. **Monitoring**: Gunakan Windows Event Viewer, Performance Monitor, dan Task Scheduler untuk monitoring dan maintenance otomatis.

7. **Backup and Recovery**: Implementasikan strategi backup dan recovery yang robust.

8. **Troubleshooting: Siapkan pengetahuan tentang troubleshooting Windows-specific issues.

Dengan mengikuti tutorial ini, Anda seharusnya dapat meng-deploy aplikasi Bebang Pack Meal Portal pada environment Windows dengan aman dan efisien.