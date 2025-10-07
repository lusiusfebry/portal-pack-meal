# Tutorial Deployment Jaringan LAN - Bebang Pack Meal Portal

Tutorial ini berisi panduan lengkap untuk deployment aplikasi Bebang Pack Meal Portal di jaringan LAN (Local Area Network) dengan fokus pada setup server dan konfigurasi networking.

## Daftar Isi

1. [Arsitektur Jaringan LAN](#1-arsitektur-jaringan-lan)
2. [Setup Server Windows 10/11 untuk LAN](#2-setup-server-windows-1011-untuk-lan)
3. [Setup Windows Server untuk LAN](#3-setup-windows-server-untuk-lan)
4. [Konfigurasi Aplikasi untuk Network Access](#4-konfigurasi-aplikasi-untuk-network-access)
5. [Network Security Configuration](#5-network-security-configuration)
6. [Client Configuration](#6-client-configuration)
7. [Performance Optimization for LAN](#7-performance-optimization-for-lan)
8. [Monitoring & Management](#8-monitoring--management)
9. [Troubleshooting Network Issues](#9-troubleshooting-network-issues)

---

## 1. Arsitektur Jaringan LAN

### Network Topology untuk Aplikasi Multi-User

```
Internet
    |
[Router/Gateway] - 192.168.1.1
    |
[Switch] - 192.168.1.0/24 Network
    |
    ├── [Server Bebang] - 192.168.1.100
    │   ├── Backend API (Port 3000)
    │   ├── Frontend (Port 5173)
    │   ├── WebSocket (Port 3001)
    │   └── PostgreSQL (Port 5432)
    │
    ├── [Admin PC] - 192.168.1.10
    ├── [Dapur PC] - 192.168.1.20
    ├── [Delivery Tablet] - 192.168.1.30
    └── [Employee PCs] - 192.168.1.50-99
```

### Server Requirements dan Planning

#### Minimum Server Specifications
- **OS**: Windows 10 Pro/11 Pro atau Windows Server 2019/2022
- **CPU**: Intel Core i5 atau AMD Ryzen 5 (4+ core)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: SSD 256GB minimum, 512GB recommended
- **Network**: Gigabit Ethernet (1Gbps)

#### Recommended Server Specifications
- **OS**: Windows Server 2022 Standard
- **CPU**: Intel Core i7 atau AMD Ryzen 7 (8+ core)
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: SSD 512GB + HDD 2TB untuk backup
- **Network**: Gigabit Ethernet dengan Redundant NIC

### IP Addressing dan DNS Considerations

#### Static IP Configuration
```ini
# Server Configuration
IP Address: 192.168.1.100
Subnet Mask: 255.255.255.0
Default Gateway: 192.168.1.1
DNS Server: 192.168.1.1 (atau DNS internal)

# Database Port
PostgreSQL: 5432
```

#### DNS Local Configuration
Tambahkan entry di `C:\Windows\System32\drivers\etc\hosts` pada setiap client:
```ini
192.168.1.100    bebang.local
192.168.1.100    api.bebang.local
192.168.1.100    db.bebang.local
```

### Bandwidth dan Performance Planning

#### Bandwidth Requirements per User
- **Basic Usage**: 100 Kbps per user
- **Active Usage**: 500 Kbps per user
- **Peak Usage**: 1 Mbps per user

#### Total Bandwidth Calculation
```
10 Users × 500 Kbps = 5 Mbps (Recommended minimum)
20 Users × 500 Kbps = 10 Mbps (Recommended for medium teams)
50 Users × 500 Kbps = 25 Mbps (Recommended for large teams)
```

---

## 2. Setup Server Windows 10/11 untuk LAN

### Konfigurasi Network Adapter dan IP Static

1. Buka **Network & Internet Settings**
2. Klik **Change adapter options**
3. Klik kanan pada adapter Ethernet → **Properties**
4. Pilih **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**
5. Konfigurasi seperti berikut:

```ini
IP address: 192.168.1.100
Subnet mask: 255.255.255.0
Default gateway: 192.168.1.1
Preferred DNS server: 192.168.1.1
Alternate DNS server: 8.8.8.8
```

### Windows Firewall Rules untuk LAN Access

#### Buka Port untuk Aplikasi (Command Prompt as Administrator)
```cmd
# Backend API Port (3000)
netsh advfirewall firewall add rule name="Bebang Backend API" dir=in action=allow protocol=TCP localport=3000

# Frontend Port (5173)
netsh advfirewall firewall add rule name="Bebang Frontend" dir=in action=allow protocol=TCP localport=5173

# WebSocket Port (3001)
netsh advfirewall firewall add rule name="Bebang WebSocket" dir=in action=allow protocol=TCP localport=3001

# PostgreSQL Port (5432) - Hanya untuk internal LAN
netsh advfirewall firewall add rule name="Bebang PostgreSQL" dir=in action=allow protocol=TCP localport=5432 remoteip=192.168.1.0/24

# Node.js Development (opsional)
netsh advfirewall firewall add rule name="Node.js Development" dir=in action=allow protocol=TCP localport=9229
```

#### Windows Firewall - GUI Method
1. Buka **Windows Defender Firewall with Advanced Security**
2. Klik **Inbound Rules** → **New Rule**
3. Pilih **Port** → **TCP**
4. Masukkan port spesifik (3000, 5173, 3001, 5432)
5. Pilih **Allow the connection**
6. Pilih **Domain**, **Private**, dan **Public**
7. Beri nama rule yang deskriptif

### Sharing dan Network Discovery Settings

1. Buka **Network and Sharing Center**
2. Klik **Change advanced sharing settings**
3. Expand **Private** network profile:
   - Turn on **network discovery**
   - Turn on **file and printer sharing**
   - Turn off **password protected sharing** (opsional, untuk kemudahan akses)

### User Account dan Permissions untuk Remote Access

#### Buat User Khusus untuk Aplikasi
```cmd
# Buat user baru
net user bebangapp StrongPassword123! /add

# Tambahkan ke grup Administrators (jika diperlukan)
net localgroup Administrators bebangapp /add

# Buat user dengan password tidak pernah expired
net user bebangapp StrongPassword123! /expires:never /passwordreq:yes
```

#### Remote Desktop Configuration
1. Buka **System Properties** → **Remote**
2. Pilih **Allow remote connections to this computer**
3. Pilih **Allow connections only from computers running Remote Desktop**
4. Tambahkan user yang diizinkan

---

## 3. Setup Windows Server untuk LAN

### Domain Controller Setup (Optional)

#### Install Active Directory Domain Services
1. Buka **Server Manager** → **Add Roles and Features**
2. Pilih **Active Directory Domain Services**
3. Klik **Promote this server to a domain controller**
4. Konfigurasi domain:
   - **Root domain name**: `bebang.local`
   - **NetBIOS name**: `BEBANG`
   - **Forest functional level**: Windows Server 2016 atau lebih tinggi

#### PowerShell Commands untuk Domain Setup
```powershell
# Install AD DS
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools

# Promote to Domain Controller
Install-ADDSForest -DomainName "bebang.local" -InstallDns:$true -CreateDnsDelegation:$false -DatabasePath "C:\Windows\NTDS" -LogPath "C:\Windows\NTDS" -SysvolPath "C:\Windows\SYSVOL" -Force:$true
```

### Active Directory Integration

#### Buat OU Structure untuk Aplikasi
```powershell
# Create Organizational Units
New-ADOrganizationalUnit -Name "Bebang Applications" -Path "DC=bebang,DC=local"
New-ADOrganizationalUnit -Name "Bebang Users" -Path "DC=bebang,DC=local"
New-ADOrganizationalUnit -Name "Bebang Groups" -Path "DC=bebang,DC=local"
```

#### Buat Groups untuk Role-Based Access
```powershell
# Create Groups
New-ADGroup -Name "Bebang Admins" -GroupCategory Security -GroupScope Global -Path "OU=Bebang Groups,DC=bebang,DC=local"
New-ADGroup -Name "Bebang Dapur" -GroupCategory Security -GroupScope Global -Path "OU=Bebang Groups,DC=bebang,DC=local"
New-ADGroup -Name "Bebang Delivery" -GroupCategory Security -GroupScope Global -Path "OU=Bebang Groups,DC=bebang,DC=local"
New-ADGroup -Name "Bebang Employees" -GroupCategory Security -GroupScope Global -Path "OU=Bebang Groups,DC=bebang,DC=local"
```

### Group Policy untuk Security

#### Buat GPO untuk Firewall Rules
1. Buka **Group Policy Management**
2. Klik kanan **Group Policy Objects** → **New**
3. Beri nama "Bebang Firewall Policy"
4. Edit GPO:
   - Navigate ke: `Computer Configuration → Policies → Windows Settings → Security Settings → Windows Defender Firewall with Advanced Security`
   - Buat inbound rules untuk port 3000, 5173, 3001, 5432

#### PowerShell GPO Commands
```powershell
# Create GPO
New-GPO -Name "Bebang Firewall Policy"

# Link GPO to Domain
New-GPLink -Name "Bebang Firewall Policy" -Target "DC=bebang,DC=local"
```

### Network Load Balancing (Optional)

#### Install NLB Feature
```powershell
Install-WindowsFeature NLB -IncludeManagementTools
```

#### Configure NLB Cluster
```powershell
# Import NLB module
Import-Module NetworkLoadBalancingClusters

# Create NLB cluster
New-NlbCluster -ClusterName "BebangCluster" -ClusterPrimaryIP 192.168.1.100 -InterfaceName "Ethernet"
```

---

## 4. Konfigurasi Aplikasi untuk Network Access

### Backend Configuration untuk Bind ke Network Interface

#### Update Backend .env.production
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:123456789@192.168.1.100:5432/bebang_pack_meal?schema=public

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0  # Bind ke semua network interfaces

# JWT Configuration
JWT_SECRET=supersecretjwt-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=supersecretrefresh-production
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration - Allow LAN access
CORS_ORIGIN=http://192.168.1.100:5173,http://bebang.local:5173

# WebSocket Configuration
WS_PORT=3001
WS_HOST=0.0.0.0  # Bind ke semua network interfaces
```

#### Update Backend main.ts untuk Network Binding
```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsAdapter } from '@nestjs/platform-ws';
import { createAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Bind ke semua interfaces untuk LAN access
  const host = configService.get<string>('HOST', '0.0.0.0');
  const port = configService.get<number>('PORT', 3000);

  // CORS Configuration
  const rawCors = configService.get<string>('CORS_ORIGIN');
  const corsOrigin = rawCors
    ? rawCors.split(',').map((s) => s.trim()).filter(Boolean)
    : ['*'];

  app.enableCors({
    origin: corsOrigin.includes('*') ? true : corsOrigin,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API Prefix
  app.setGlobalPrefix('api');

  // WebSocket Configuration
  const wsPort = configService.get<number>('WS_PORT', 3001);
  const wsHost = configService.get<string>('WS_HOST', '0.0.0.0');

  // Start HTTP server
  await app.listen(port, host);
  console.log(`Application is running on http://${host}:${port}`);

  // WebSocket Configuration
  app.useWebSocketAdapter(new WsAdapter(app));
  console.log(`WebSocket server is running on ws://${wsHost}:${wsPort}`);
}

bootstrap();
```

### Frontend Configuration untuk Network Deployment

#### Update Frontend .env.production
```env
# API Configuration
VITE_API_BASE_URL=http://192.168.1.100:3000/api
VITE_WS_URL=http://192.168.1.100:3001

# App Configuration
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production

# Network Configuration
VITE_NETWORK_MODE=lan
VITE_SERVER_IP=192.168.1.100
VITE_SERVER_HOST=bebang.local
```

#### Update Vite Config untuk Network Deployment
```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/192\.168\.1\.100:3000\/api/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Bebang Pack Meal Portal',
        short_name: 'Bebang Portal',
        description: 'Portal Pack Meal untuk Operasional Internal',
        theme_color: '#10B981',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.1.100:3000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://192.168.1.100:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
        },
      },
    },
  },
});
```

### Database Configuration untuk Remote Connections

#### Update PostgreSQL Configuration (postgresql.conf)
```ini
# postgresql.conf
listen_addresses = '*'          # Listen pada semua interfaces
port = 5432
max_connections = 100

# Memory Configuration
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Logging Configuration
log_destination = 'stderr'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'all'
log_min_duration_statement = 1000
```

#### Update PostgreSQL Access Control (pg_hba.conf)
```
# pg_hba.conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
# LAN connections:
host    all             all             192.168.1.0/24          md5
# Specific server IP:
host    all             all             192.168.1.100/32        md5
```

### Environment Variables untuk Network Setup

#### Backend Production Environment File
```env
# backend/.env.production
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:123456789@192.168.1.100:5432/bebang_pack_meal?schema=public

# JWT
JWT_SECRET=supersecretjwt-production-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=supersecretrefresh-production-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://192.168.1.100:5173,http://bebang.local:5173

# WebSocket
WS_PORT=3001
WS_HOST=0.0.0.0

# Network
NETWORK_MODE=lan
SERVER_IP=192.168.1.100
SERVER_HOST=bebang.local
```

#### Frontend Production Environment File
```env
# frontend/.env.production
VITE_API_BASE_URL=http://192.168.1.100:3000/api
VITE_WS_URL=http://192.168.1.100:3001
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
VITE_NETWORK_MODE=lan
VITE_SERVER_IP=192.168.1.100
VITE_SERVER_HOST=bebang.local
```

---

## 5. Network Security Configuration

### Windows Firewall Inbound/Outbound Rules

#### Advanced Firewall Rules (PowerShell)
```powershell
# Create Firewall Rules for Bebang Application
New-NetFirewallRule -DisplayName "Bebang Backend API" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -RemoteAddress 192.168.1.0/24
New-NetFirewallRule -DisplayName "Bebang Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -RemoteAddress 192.168.1.0/24
New-NetFirewallRule -DisplayName "Bebang WebSocket" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -RemoteAddress 192.168.1.0/24
New-NetFirewallRule -DisplayName "Bebang PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow -RemoteAddress 192.168.1.0/24

# Outbound Rules (jika diperlukan)
New-NetFirewallRule -DisplayName "Bebang Outbound API" -Direction Outbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "Bebang Outbound DB" -Direction Outbound -Protocol TCP -LocalPort 5432 -Action Allow
```

#### Restricted Access Rules
```powershell
# Allow only specific IP ranges for database access
New-NetFirewallRule -DisplayName "Bebang DB Restricted" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow -RemoteAddress 192.168.1.100,192.168.1.10

# Block external access to database
New-NetFirewallRule -DisplayName "Block External DB Access" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Block -RemoteAddress Any
```

### Port Forwarding dan NAT Configuration

#### Router Port Forwarding (jika perlu external access)
```
# External Port 3000 → Internal IP 192.168.1.100:3000 (Backend API)
# External Port 5173 → Internal IP 192.168.1.100:5173 (Frontend)
# External Port 3001 → Internal IP 192.168.1.100:3001 (WebSocket)
# External Port 5432 → Internal IP 192.168.1.100:5432 (PostgreSQL - NOT RECOMMENDED)
```

#### Windows NAT Configuration (jika menggunakan Windows Server sebagai router)
```powershell
# Install NAT feature
Install-WindowsFeature RemoteAccess -IncludeManagementTools

# Configure NAT
Install-RemoteAccess -VPNType Vpn
cmd.exe /c "netsh routing ip nat install"
cmd.exe /c "netsh routing ip nat add interface name=""Internal"" private"
cmd.exe /c "netsh routing ip nat add interface name=""External"" public"
```

### SSL/TLS Setup untuk LAN

#### Generate Self-Signed Certificate untuk LAN
```powershell
# Install Chocolatey (jika belum ada)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install mkcert
choco install mkcert

# Create local CA
mkcert -install

# Generate certificate for LAN
mkcert -key-file bebang.key -cert-file bebang.crt 192.168.1.100 bebang.local localhost 127.0.0.1 ::1
```

#### Configure Backend untuk HTTPS
```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // HTTPS Configuration
  const httpsOptions = {
    key: readFileSync('./certs/bebang.key'),
    cert: readFileSync('./certs/bebang.crt'),
  };

  // Create HTTPS server
  const httpsServer = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  // Configuration
  const host = configService.get<string>('HOST', '0.0.0.0');
  const port = configService.get<number>('PORT', 3000);

  await httpsServer.listen(port, host);
  console.log(`HTTPS Application is running on https://${host}:${port}`);
}

bootstrap();
```

### Access Control dan Authentication

#### Network Level Authentication
```powershell
# Create Network Policy for Bebang Application
New-NetFirewallRule -DisplayName "Bebang Authenticated Users" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -RemoteAddress 192.168.1.0/24 -Authentication Required

# Configure IPsec for additional security
New-NetIPsecRule -DisplayName "Bebang IPsec" -InboundSecurity Require -OutboundSecurity Request -QuickModeCryptoSet Default
```

#### Application Level Authentication
```typescript
// backend/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(nik: string, password: string): Promise<any> {
    // Add IP validation for additional security
    const user = await this.prisma.user.findUnique({
      where: { username: nik },
      include: { karyawan: true },
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      // Log successful login with IP
      console.log(`User ${nik} logged in from IP: ${clientIP}`);
      return user;
    }
    return null;
  }
}
```

---

## 6. Client Configuration

### Browser Setup di Client Machines

#### Chrome/Edge Configuration
1. Buka browser
2. Akses `http://192.168.1.100:5173` atau `http://bebang.local:5173`
3. Tambahkan bookmark untuk akses cepat
4. Enable notifications untuk real-time updates

#### Firefox Configuration
1. Buka Firefox
2. Akses `http://192.168.1.100:5173`
3. Tambahkan exception untuk self-signed certificate (jika menggunakan HTTPS)
4. Enable desktop notifications

### Network Drive Mapping (Optional)

#### Map Network Drive untuk Backup/Logs
```cmd
# Map network drive untuk backup
net use Z: \\192.168.1.100\bebang-backup /persistent:yes

# Map network drive untuk logs
net use Y: \\192.168.1.100\bebang-logs /persistent:yes
```

#### PowerShell Script untuk Auto-Map
```powershell
# Create PowerShell script for auto-mapping
$scriptPath = "C:\Scripts\MapBebangDrives.ps1"
$scriptContent = @"
# Map Bebang Network Drives
net use Z: \\192.168.1.100\bebang-backup /persistent:yes
net use Y: \\192.168.1.100\bebang-logs /persistent:yes

# Create desktop shortcuts
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Bebang Portal.lnk")
$Shortcut.TargetPath = "http://192.168.1.100:5173"
$Shortcut.Save()
"@

# Create script directory
New-Item -ItemType Directory -Force -Path "C:\Scripts"
Set-Content -Path $scriptPath -Value $scriptContent

# Add to startup
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "MapBebangDrives" -Value "powershell.exe -ExecutionPolicy Bypass -File `$scriptPath"
```

### Shortcuts dan Bookmarks Setup

#### Create Desktop Shortcut Script
```powershell
# Create desktop shortcut for all users
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\Users\Public\Desktop\Bebang Portal.lnk")
$Shortcut.TargetPath = "http://192.168.1.100:5173"
$Shortcut.IconLocation = "C:\Program Files\Internet Explorer\iexplore.exe, 0"
$Shortcut.Description = "Bebang Pack Meal Portal"
$Shortcut.Save()
```

#### Browser Bookmark Deployment
```html
<!-- Bookmark file for import -->
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3>Bebang Portal</H3>
    <DL><p>
        <DT><A HREF="http://192.168.1.100:5173" ADD_DATE="1634567890" ICON_URI="http://192.168.1.100:5173/favicon.ico">Bebang Pack Meal Portal</A>
        <DT><A HREF="http://192.168.1.100:5173/admin" ADD_DATE="1634567890">Admin Dashboard</A>
        <DT><A HREF="http://192.168.1.100:5173/dapur" ADD_DATE="1634567890">Dapur Dashboard</A>
        <DT><A HREF="http://192.168.1.100:5173/delivery" ADD_DATE="1634567890">Delivery Dashboard</A>
    </DL><p>
</DL><p>
```

### Troubleshooting Network Connectivity

#### Basic Network Testing Script
```powershell
# Network connectivity test script
function Test-BebangConnectivity {
    param(
        [string]$ServerIP = "192.168.1.100",
        [string]$ServerHost = "bebang.local"
    )
    
    Write-Host "Testing Bebang Portal Connectivity..." -ForegroundColor Green
    
    # Test basic connectivity
    Write-Host "Testing basic connectivity to $ServerIP..." -ForegroundColor Yellow
    $pingResult = Test-Connection -ComputerName $ServerIP -Count 4 -Quiet
    if ($pingResult) {
        Write-Host "✓ Ping successful" -ForegroundColor Green
    } else {
        Write-Host "✗ Ping failed" -ForegroundColor Red
        return
    }
    
    # Test port connectivity
    $ports = @(3000, 5173, 3001, 5432)
    foreach ($port in $ports) {
        Write-Host "Testing port $port..." -ForegroundColor Yellow
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        try {
            $tcpClient.Connect($ServerIP, $port)
            Write-Host "✓ Port $port is open" -ForegroundColor Green
            $tcpClient.Close()
        } catch {
            Write-Host "✗ Port $port is closed or filtered" -ForegroundColor Red
        }
    }
    
    # Test DNS resolution
    Write-Host "Testing DNS resolution for $ServerHost..." -ForegroundColor Yellow
    try {
        $dnsResult = Resolve-DnsName -Name $ServerHost -ErrorAction Stop
        Write-Host "✓ DNS resolution successful: $($dnsResult.IPAddress)" -ForegroundColor Green
    } catch {
        Write-Host "✗ DNS resolution failed" -ForegroundColor Red
    }
    
    # Test HTTP connectivity
    Write-Host "Testing HTTP connectivity..." -ForegroundColor Yellow
    try {
        $httpResponse = Invoke-WebRequest -Uri "http://$ServerIP`:5173" -TimeoutSec 10
        Write-Host "✓ HTTP connectivity successful (Status: $($httpResponse.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "✗ HTTP connectivity failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Run the test
Test-BebangConnectivity
```

---

## 7. Performance Optimization for LAN

### Network Bandwidth Optimization

#### TCP/IP Optimization (Windows Registry)
```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters]
"TcpWindowSize"=dword:0000FFFF
"Tcp1323Opts"=dword:00000003
"DefaultTTL"=dword:00000040
"EnablePMTUDiscovery"=dword:00000001
"SackOpts"=dword:00000001
"TcpMaxDupAcks"=dword:00000002
"TcpNumConnections"=dword:00000640
```

#### Network Adapter Optimization
```powershell
# Optimize network adapter settings
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | ForEach-Object {
    # Disable power saving
    Set-NetAdapterPowerManagement -Name $_.Name -WakeOnMagicPacket $false -WakeOnPattern $false
    
    # Set Jumbo frames (if supported by network)
    # Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName "Jumbo Packet" -DisplayValue "9014 Bytes"
    
    # Set speed and duplex to auto-negotiate
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName "Speed & Duplex" -DisplayValue "Auto Negotiation"
}
```

### Caching Strategies untuk LAN

#### Application-Level Caching
```typescript
// backend/src/common/interceptors/cache.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = `${request.method}-${request.url}`;
    
    // Check cache first
    const cachedResponse = await this.cacheManager.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Execute and cache response
    const response = next.handle();
    response.subscribe(async (data) => {
      await this.cacheManager.set(cacheKey, data, 300); // 5 minutes cache
    });
    
    return response;
  }
}
```

#### Database Query Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_pesanan_status_pesanan ON pesanan(status_pesanan);
CREATE INDEX CONCURRENTLY idx_pesanan_tanggal_pesanan ON pesanan(tanggal_pesanan);
CREATE INDEX CONCURRENTLY idx_karyawan_department_id ON karyawan(department_id);

-- Create materialized views for complex reports
CREATE MATERIALIZED VIEW mv_daily_consumption AS
SELECT 
    DATE(tanggal_pesanan) as tanggal,
    department_id,
    COUNT(*) as total_pesanan,
    SUM(jumlah) as total_pack_meal
FROM pesanan p
JOIN karyawan k ON p.karyawan_id = k.id
GROUP BY DATE(tanggal_pesanan), department_id;

-- Refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_daily_consumption()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_consumption;
END;
$$ LANGUAGE plpgsql;
```

### Load Balancing untuk Multiple Users

#### Simple Load Balancer Configuration
```typescript
// load-balancer.js
const http = require('http');
const httpProxy = require('http-proxy');

const servers = [
    { host: '192.168.1.100', port: 3000 },
    { host: '192.168.1.101', port: 3000 }, // Additional server
    { host: '192.168.1.102', port: 3000 }, // Additional server
];

let currentServer = 0;

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
    const target = servers[currentServer];
    currentServer = (currentServer + 1) % servers.length;
    
    proxy.web(req, res, { target: `http://${target.host}:${target.port}` });
});

server.listen(80, '0.0.0.0', () => {
    console.log('Load balancer running on port 80');
});
```

### Database Connection Pooling

#### PostgreSQL Connection Pool Configuration
```typescript
// backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    
    // Configure connection pool
    await this.$executeRaw`SET connection_limit = 100`;
    await this.$executeRaw`SET shared_preload_libraries = 'pg_stat_statements'`;
    await this.$executeRaw`SET pg_stat_statements.track = 'all'`;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

#### Connection Pool Monitoring
```sql
-- Monitor connection pool usage
SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database 
WHERE datname = 'bebang_pack_meal';
```

---

## 8. Monitoring & Management

### Network Monitoring Tools

#### Windows Performance Monitor Setup
```powershell
# Create performance monitor data collector set
$collectorSet = New-Object -ComObject Pla.DataCollectorSet
$collectorSet.DisplayName = "Bebang Performance Monitor"
$collectorSet.RootPath = "%systemdrive%\BebangPerformanceLogs"

# Add performance counters
$performanceCounter = $collectorSet.DataCollectors.Add()
$performanceCounter.Name = "Performance Counter"
$performanceCounter.DataSource = $collectorSet.DataSources.Add()
$performanceCounter.DataSource.Name = "Bebang Counters"

# Add specific counters
$counters = @(
    "\Processor(_Total)\% Processor Time",
    "\Memory\Available MBytes",
    "\Network Interface(*)\Bytes Total/sec",
    "\TCPv4\Connections Established",
    "\Process(*)\% Processor Time",
    "\Process(*)\Working Set"
)

foreach ($counter in $counters) {
    $performanceCounter.DataSource.PerformanceCounters.Add($counter)
}

# Start the collector set
$collectorSet.Start()
```

#### Network Traffic Monitoring Script
```powershell
# Network traffic monitoring script
function Monitor-NetworkTraffic {
    param(
        [string]$Interface = "Ethernet",
        [int]$Interval = 5
    )
    
    while ($true) {
        $stats = Get-NetAdapterStatistics -Name $Interface
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        [PSCustomObject]@{
            Timestamp = $timestamp
            Interface = $Interface
            ReceivedBytes = $stats.ReceivedBytes
            SentBytes = $stats.SentBytes
            ReceivedPackets = $stats.ReceivedPackets
            SentPackets = $stats.SentPackets
        } | Export-Csv -Path "C:\BebangLogs\network-traffic.csv" -Append -NoTypeInformation
        
        Start-Sleep -Seconds $Interval
    }
}

# Start monitoring in background
Start-Job -ScriptBlock { Monitor-NetworkTraffic }
```

### User Session Management

#### Active User Monitoring
```typescript
// backend/src/common/services/session.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async getActiveUsers() {
    return this.prisma.auditTrail.findMany({
      where: {
        action: 'LOGIN_SUCCESS',
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
      include: {
        user: {
          include: {
            karyawan: true,
          },
        },
      },
      distinct: ['userId'],
    });
  }

  async getUserActivity(userId: string) {
    return this.prisma.auditTrail.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }
}
```

#### Session Cleanup Script
```powershell
# Clean up inactive sessions
function Cleanup-InactiveSessions {
    param(
        [int]$InactiveHours = 8
    )
    
    $inactiveThreshold = (Get-Date).AddHours(-$InactiveHours)
    
    # Get inactive user sessions
    $inactiveSessions = Get-CimInstance -ClassName Win32_LogonSession | Where-Object {
        $_.StartTime -lt $inactiveThreshold
    }
    
    foreach ($session in $inactiveSessions) {
        Write-Host "Cleaning up inactive session: $($session.LogonId)"
        # Log off inactive session
        logoff $session.LogonId
    }
}

# Schedule cleanup every hour
$trigger = New-JobTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
Register-ScheduledJob -Name "CleanupInactiveSessions" -ScriptBlock { Cleanup-InactiveSessions } -Trigger $trigger
```

### Performance Metrics untuk LAN

#### Application Performance Monitoring
```typescript
// backend/src/common/interceptors/metrics.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        
        // Log performance metrics
        console.log({
          method: request.method,
          url: request.url,
          duration: `${duration}ms`,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          timestamp: new Date().toISOString(),
        });
        
        // Alert if response time is too slow
        if (duration > 2000) {
          console.warn(`Slow request detected: ${request.method} ${request.url} took ${duration}ms`);
        }
      }),
    );
  }
}
```

#### Database Performance Monitoring
```sql
-- Create performance monitoring view
CREATE OR REPLACE VIEW vw_performance_metrics AS
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_tup_hot_upd,
    n_live_tup,
    n_dead_tup
FROM pg_stat_user_tables;

-- Query performance monitoring
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
```

### Backup over Network

#### Automated Backup Script
```powershell
# Automated backup script for Bebang Portal
function Backup-BebangPortal {
    param(
        [string]$BackupPath = "\\backup-server\BebangBackups",
        [string]$DatabasePath = "C:\BebangData",
        [int]$RetentionDays = 30
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
    $backupFolder = Join-Path $BackupPath $timestamp
    
    # Create backup folder
    New-Item -ItemType Directory -Force -Path $backupFolder
    
    # Backup PostgreSQL database
    $pgDump = "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe"
    $dbBackupFile = Join-Path $backupFolder "bebang_database.sql"
    
    & $pgDump -h localhost -U postgres -d bebang_pack_meal -f $dbBackupFile
    
    # Backup application files
    $appBackupFile = Join-Path $backupFolder "bebang_application.zip"
    Compress-Archive -Path "C:\BebangPortal\*" -DestinationPath $appBackupFile
    
    # Backup configuration files
    $configBackupFile = Join-Path $backupFolder "bebang_config.zip"
    Compress-Archive -Path "C:\BebangPortal\*.env*", "C:\BebangPortal\*.json" -DestinationPath $configBackupFile
    
    # Clean up old backups
    Get-ChildItem $BackupPath | Where-Object {
        $_.CreationTime -lt (Get-Date).AddDays(-$RetentionDays)
    } | Remove-Item -Recurse -Force
    
    Write-Host "Backup completed: $backupFolder"
}

# Schedule daily backup at 2 AM
$trigger = New-JobTrigger -Daily -At 2:00AM
Register-ScheduledJob -Name "BackupBebangPortal" -ScriptBlock { Backup-BebangPortal } -Trigger $trigger
```

#### Backup Verification Script
```powershell
# Verify backup integrity
function Test-BackupIntegrity {
    param(
        [string]$BackupPath = "\\backup-server\BebangBackups"
    )
    
    $latestBackup = Get-ChildItem $BackupPath | Sort-Object CreationTime -Descending | Select-Object -First 1
    
    if (-not $latestBackup) {
        Write-Host "No backups found!" -ForegroundColor Red
        return
    }
    
    Write-Host "Testing backup: $($latestBackup.Name)" -ForegroundColor Yellow
    
    # Test database backup
    $dbBackup = Join-Path $latestBackup.FullName "bebang_database.sql"
    if (Test-Path $dbBackup) {
        $dbSize = (Get-Item $dbBackup).Length / 1MB
        Write-Host "✓ Database backup found ($([math]::Round($dbSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "✗ Database backup missing" -ForegroundColor Red
    }
    
    # Test application backup
    $appBackup = Join-Path $latestBackup.FullName "bebang_application.zip"
    if (Test-Path $appBackup) {
        $appSize = (Get-Item $appBackup).Length / 1MB
        Write-Host "✓ Application backup found ($([math]::Round($appSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "✗ Application backup missing" -ForegroundColor Red
    }
    
    # Test configuration backup
    $configBackup = Join-Path $latestBackup.FullName "bebang_config.zip"
    if (Test-Path $configBackup) {
        $configSize = (Get-Item $configBackup).Length / 1KB
        Write-Host "✓ Configuration backup found ($([math]::Round($configSize, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "✗ Configuration backup missing" -ForegroundColor Red
    }
}

# Run backup verification daily
Register-ScheduledJob -Name "VerifyBackupIntegrity" -ScriptBlock { Test-BackupIntegrity } -Trigger (New-JobTrigger -Daily -At 6:00AM)
```

---

## 9. Troubleshooting Network Issues

### Common Network Connectivity Problems

#### Diagnostic Script for Network Issues
```powershell
# Comprehensive network diagnostic script
function Test-BebangNetwork {
    param(
        [string]$ServerIP = "192.168.1.100",
        [string]$ServerHost = "bebang.local"
    )
    
    Write-Host "=== Bebang Network Diagnostics ===" -ForegroundColor Cyan
    Write-Host "Server IP: $ServerIP" -ForegroundColor White
    Write-Host "Server Host: $ServerHost" -ForegroundColor White
    Write-Host "Client IP: $((Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet).IPAddress)" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    
    # Step 1: Basic connectivity
    Write-Host "Step 1: Testing Basic Connectivity" -ForegroundColor Yellow
    $pingResult = Test-Connection -ComputerName $ServerIP -Count 4 -Detailed
    if ($pingResult) {
        Write-Host "✓ Ping successful" -ForegroundColor Green
        Write-Host "  Average latency: $($pingResult.ResponseTime.Average)ms" -ForegroundColor Gray
    } else {
        Write-Host "✗ Ping failed" -ForegroundColor Red
        Write-Host "  Troubleshooting:" -ForegroundColor Yellow
        Write-Host "  - Check if server is powered on" -ForegroundColor Gray
        Write-Host "  - Check network cable connection" -ForegroundColor Gray
        Write-Host "  - Verify IP address configuration" -ForegroundColor Gray
        return
    }
    
    # Step 2: Port connectivity
    Write-Host "Step 2: Testing Port Connectivity" -ForegroundColor Yellow
    $ports = @{
        3000 = "Backend API"
        5173 = "Frontend"
        3001 = "WebSocket"
        5432 = "PostgreSQL"
    }
    
    foreach ($port in $ports.GetEnumerator()) {
        Write-Host "Testing $($port.Value) (Port $($port.Key))..." -ForegroundColor Gray
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        try {
            $asyncResult = $tcpClient.BeginConnect($ServerIP, $port.Key, $null, $null)
            $wait = $asyncResult.AsyncWaitHandle.WaitOne(1000, $false)
            
            if ($wait) {
                $tcpClient.EndConnect($asyncResult)
                Write-Host "✓ Port $($port.Key) is open" -ForegroundColor Green
            } else {
                Write-Host "✗ Port $($port.Key) is closed or filtered" -ForegroundColor Red
                Write-Host "  Troubleshooting:" -ForegroundColor Yellow
                Write-Host "  - Check Windows Firewall rules" -ForegroundColor Gray
                Write-Host "  - Verify application is running" -ForegroundColor Gray
                Write-Host "  - Check port conflicts" -ForegroundColor Gray
            }
        } catch {
            Write-Host "✗ Port $($port.Key) connection failed: $($_.Exception.Message)" -ForegroundColor Red
        } finally {
            $tcpClient.Close()
        }
    }
    
    # Step 3: DNS resolution
    Write-Host "Step 3: Testing DNS Resolution" -ForegroundColor Yellow
    try {
        $dnsResult = Resolve-DnsName -Name $ServerHost -ErrorAction Stop
        Write-Host "✓ DNS resolution successful" -ForegroundColor Green
        Write-Host "  Resolved to: $($dnsResult.IPAddress)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ DNS resolution failed" -ForegroundColor Red
        Write-Host "  Troubleshooting:" -ForegroundColor Yellow
        Write-Host "  - Check hosts file entry" -ForegroundColor Gray
        Write-Host "  - Verify DNS server configuration" -ForegroundColor Gray
        Write-Host "  - Try using IP address directly" -ForegroundColor Gray
    }
    
    # Step 4: HTTP/HTTPS connectivity
    Write-Host "Step 4: Testing HTTP Connectivity" -ForegroundColor Yellow
    try {
        $httpResponse = Invoke-WebRequest -Uri "http://$ServerIP`:5173" -TimeoutSec 10
        Write-Host "✓ HTTP connectivity successful" -ForegroundColor Green
        Write-Host "  Status Code: $($httpResponse.StatusCode)" -ForegroundColor Gray
        Write-Host "  Content Type: $($httpResponse.Headers['Content-Type'])" -ForegroundColor Gray
    } catch {
        Write-Host "✗ HTTP connectivity failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Troubleshooting:" -ForegroundColor Yellow
        Write-Host "  - Check if frontend application is running" -ForegroundColor Gray
        Write-Host "  - Verify proxy configuration" -ForegroundColor Gray
        Write-Host "  - Check SSL certificate (if using HTTPS)" -ForegroundColor Gray
    }
    
    # Step 5: Network statistics
    Write-Host "Step 5: Network Statistics" -ForegroundColor Yellow
    $adapter = Get-NetAdapter -Name "Ethernet" -ErrorAction SilentlyContinue
    if ($adapter) {
        $stats = Get-NetAdapterStatistics -Name "Ethernet"
        Write-Host "✓ Network adapter found: $($adapter.Name)" -ForegroundColor Green
        Write-Host "  Status: $($adapter.Status)" -ForegroundColor Gray
        Write-Host "  Link Speed: $($adapter.LinkSpeed)" -ForegroundColor Gray
        Write-Host "  Bytes Received: $($stats.ReceivedBytes)" -ForegroundColor Gray
        Write-Host "  Bytes Sent: $($stats.SentBytes)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Network adapter not found" -ForegroundColor Red
    }
    
    Write-Host "" -ForegroundColor White
    Write-Host "=== Diagnostics Complete ===" -ForegroundColor Cyan
}

# Run the diagnostic
Test-BebangNetwork
```

### DNS Resolution Issues

#### DNS Configuration Check Script
```powershell
# DNS configuration diagnostic script
function Test-DNSConfiguration {
    param(
        [string]$ServerHost = "bebang.local",
        [string]$ServerIP = "192.168.1.100"
    )
    
    Write-Host "=== DNS Configuration Diagnostics ===" -ForegroundColor Cyan
    
    # Check current DNS configuration
    Write-Host "Current DNS Configuration:" -ForegroundColor Yellow
    $dnsSettings = Get-DnsClientServerAddress -AddressFamily IPv4 -InterfaceAlias Ethernet
    foreach ($dns in $dnsSettings.ServerAddresses) {
        Write-Host "  DNS Server: $dns" -ForegroundColor Gray
    }
    
    # Test DNS resolution
    Write-Host "Testing DNS resolution for $ServerHost..." -ForegroundColor Yellow
    try {
        $dnsResult = Resolve-DnsName -Name $ServerHost -ErrorAction Stop
        Write-Host "✓ DNS resolution successful" -ForegroundColor Green
        Write-Host "  IP Address: $($dnsResult.IPAddress)" -ForegroundColor Gray
        Write-Host "  TTL: $($dnsResult.TTL)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ DNS resolution failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
        
        # Check hosts file
        Write-Host "Checking hosts file..." -ForegroundColor Yellow
        $hostsFile = "C:\Windows\System32\drivers\etc\hosts"
        $hostsContent = Get-Content $hostsFile
        $hostsEntry = $hostsContent | Where-Object { $_ -match $ServerHost }
        
        if ($hostsEntry) {
            Write-Host "✓ Hosts file entry found:" -ForegroundColor Green
            Write-Host "  $hostsEntry" -ForegroundColor Gray
        } else {
            Write-Host "✗ No hosts file entry found" -ForegroundColor Red
            Write-Host "  Consider adding: $ServerIP $ServerHost" -ForegroundColor Yellow
        }
        
        # Test direct IP access
        Write-Host "Testing direct IP access..." -ForegroundColor Yellow
        try {
            $ipTest = Test-Connection -ComputerName $ServerIP -Count 1 -Quiet
            if ($ipTest) {
                Write-Host "✓ Direct IP access successful" -ForegroundColor Green
                Write-Host "  Issue is likely DNS-related" -ForegroundColor Yellow
            } else {
                Write-Host "✗ Direct IP access failed" -ForegroundColor Red
                Write-Host "  Issue is likely network-related" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "✗ Direct IP access failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Flush DNS cache
    Write-Host "Flushing DNS cache..." -ForegroundColor Yellow
    Clear-DnsClientCache
    Write-Host "✓ DNS cache flushed" -ForegroundColor Green
    
    # Re-test DNS resolution
    Write-Host "Re-testing DNS resolution..." -ForegroundColor Yellow
    try {
        $dnsResult = Resolve-DnsName -Name $ServerHost -ErrorAction Stop
        Write-Host "✓ DNS resolution successful after cache flush" -ForegroundColor Green
    } catch {
        Write-Host "✗ DNS resolution still failed" -ForegroundColor Red
        Write-Host "  Consider restarting DNS client service" -ForegroundColor Yellow
    }
}

# Run DNS diagnostics
Test-DNSConfiguration
```

### Firewall Blocking Problems

#### Firewall Diagnostic Script
```powershell
# Firewall diagnostic script
function Test-FirewallConfiguration {
    param(
        [string]$ServerIP = "192.168.1.100",
        [int[]]$Ports = @(3000, 5173, 3001, 5432)
    )
    
    Write-Host "=== Firewall Configuration Diagnostics ===" -ForegroundColor Cyan
    
    # Check firewall status
    Write-Host "Checking firewall status..." -ForegroundColor Yellow
    $firewallProfiles = Get-NetFirewallProfile
    foreach ($profile in $firewallProfiles) {
        Write-Host "$($profile.Name): $($profile.Enabled)" -ForegroundColor Gray
    }
    
    # Check for existing firewall rules
    Write-Host "Checking existing firewall rules..." -ForegroundColor Yellow
    $bebangRules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*Bebang*" }
    
    if ($bebangRules) {
        Write-Host "✓ Found Bebang firewall rules:" -ForegroundColor Green
        foreach ($rule in $bebangRules) {
            Write-Host "  $($rule.DisplayName): $($rule.Enabled)" -ForegroundColor Gray
            Write-Host "    Direction: $($rule.Direction)" -ForegroundColor Gray
            Write-Host "    Protocol: $($rule.Protocol)" -ForegroundColor Gray
            Write-Host "    Local Port: $($rule.LocalPort)" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ No Bebang firewall rules found" -ForegroundColor Red
        Write-Host "  Consider creating firewall rules for required ports" -ForegroundColor Yellow
    }
    
    # Test port connectivity with detailed error reporting
    Write-Host "Testing port connectivity..." -ForegroundColor Yellow
    foreach ($port in $Ports) {
        Write-Host "Testing port $port..." -ForegroundColor Gray
        
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        try {
            $asyncResult = $tcpClient.BeginConnect($ServerIP, $port, $null, $null)
            $wait = $asyncResult.AsyncWaitHandle.WaitOne(1000, $false)
            
            if ($wait) {
                $tcpClient.EndConnect($asyncResult)
                Write-Host "✓ Port $port is accessible" -ForegroundColor Green
            } else {
                Write-Host "✗ Port $port is not accessible" -ForegroundColor Red
                Write-Host "  Possible causes:" -ForegroundColor Yellow
                Write-Host "    - Windows Firewall blocking" -ForegroundColor Gray
                Write-Host "    - Application not running" -ForegroundColor Gray
                Write-Host "    - Port conflict" -ForegroundColor Gray
                Write-Host "    - Network routing issue" -ForegroundColor Gray
                
                # Check if port is listening
                Write-Host "  Checking if port is listening on server..." -ForegroundColor Gray
                $portCheck = Test-NetConnection -ComputerName $ServerIP -Port $port -WarningAction SilentlyContinue
                if ($portCheck.TcpTestSucceeded) {
                    Write-Host "    ✓ Port is listening on server" -ForegroundColor Green
                    Write-Host "    Issue is likely client-side firewall" -ForegroundColor Yellow
                } else {
                    Write-Host "    ✗ Port is not listening on server" -ForegroundColor Red
                    Write-Host "    Issue is likely server-side" -ForegroundColor Yellow
                }
            }
        } catch {
            Write-Host "✗ Port $port test failed: $($_.Exception.Message)" -ForegroundColor Red
        } finally {
            $tcpClient.Close()
        }
    }
    
    # Create missing firewall rules
    Write-Host "Creating missing firewall rules..." -ForegroundColor Yellow
    $portNames = @{
        3000 = "Bebang Backend API"
        5173 = "Bebang Frontend"
        3001 = "Bebang WebSocket"
        5432 = "Bebang PostgreSQL"
    }
    
    foreach ($port in $Ports) {
        $ruleName = $portNames[$port]
        $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        
        if (-not $existingRule) {
            Write-Host "Creating firewall rule for port $port ($ruleName)..." -ForegroundColor Gray
            New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -RemoteAddress 192.168.1.0/24
            Write-Host "✓ Firewall rule created" -ForegroundColor Green
        } else {
            Write-Host "✓ Firewall rule already exists for port $port" -ForegroundColor Green
        }
    }
    
    Write-Host "" -ForegroundColor White
    Write-Host "=== Firewall Diagnostics Complete ===" -ForegroundColor Cyan
}

# Run firewall diagnostics
Test-FirewallConfiguration
```

### Performance Bottlenecks

#### Performance Diagnostic Script
```powershell
# Performance diagnostic script
function Test-PerformanceBottlenecks {
    param(
        [string]$ServerIP = "192.168.1.100"
    )
    
    Write-Host "=== Performance Diagnostics ===" -ForegroundColor Cyan
    
    # Check system performance
    Write-Host "System Performance:" -ForegroundColor Yellow
    $cpuUsage = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
    $memoryUsage = Get-WmiObject -Class Win32_OperatingSystem
    $totalMemory = [math]::Round($memoryUsage.TotalVisibleMemorySize / 1MB, 2)
    $freeMemory = [math]::Round($memoryUsage.FreePhysicalMemory / 1MB, 2)
    $usedMemory = $totalMemory - $freeMemory
    $memoryUsagePercent = [math]::Round(($usedMemory / $totalMemory) * 100, 2)
    
    Write-Host "CPU Usage: $($cpuUsage.Average)%" -ForegroundColor Gray
    Write-Host "Memory Usage: $usedMemory/$totalMemory GB ($memoryUsagePercent%)" -ForegroundColor Gray
    
    # Check network performance
    Write-Host "Network Performance:" -ForegroundColor Yellow
    $adapter = Get-NetAdapter -Name "Ethernet" -ErrorAction SilentlyContinue
    if ($adapter) {
        $stats = Get-NetAdapterStatistics -Name "Ethernet"
        $bandwidth = $adapter.LinkSpeed / 1Mbps
        Write-Host "Link Speed: $bandwidth Mbps" -ForegroundColor Gray
        Write-Host "Bytes Received: $($stats.ReceivedBytes)" -ForegroundColor Gray
        Write-Host "Bytes Sent: $($stats.SentBytes)" -ForegroundColor Gray
    }
    
    # Check application performance
    Write-Host "Application Performance:" -ForegroundColor Yellow
    try {
        $responseTime = Measure-Command {
            $response = Invoke-WebRequest -Uri "http://$ServerIP`:5173" -TimeoutSec 10
        }
        Write-Host "Frontend Response Time: $($responseTime.TotalMilliseconds)ms" -ForegroundColor Gray
        
        if ($responseTime.TotalMilliseconds -gt 5000) {
            Write-Host "✗ Slow frontend response time" -ForegroundColor Red
            Write-Host "  Possible causes:" -ForegroundColor Yellow
            Write-Host "    - High server load" -ForegroundColor Gray
            Write-Host "    - Network congestion" -ForegroundColor Gray
            Write-Host "    - Application performance issues" -ForegroundColor Gray
        } else {
            Write-Host "✓ Frontend response time is acceptable" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ Frontend not accessible" -ForegroundColor Red
    }
    
    # Check database performance
    Write-Host "Database Performance:" -ForegroundColor Yellow
    try {
        $dbResponseTime = Measure-Command {
            $dbTest = Test-NetConnection -ComputerName $ServerIP -Port 5432
        }
        Write-Host "Database Connection Time: $($dbResponseTime.TotalMilliseconds)ms" -ForegroundColor Gray
        
        if ($dbResponseTime.TotalMilliseconds -gt 1000) {
            Write-Host "✗ Slow database connection" -ForegroundColor Red
            Write-Host "  Possible causes:" -ForegroundColor Yellow
            Write-Host "    - Database server load" -ForegroundColor Gray
            Write-Host "    - Network latency" -ForegroundColor Gray
            Write-Host "    - Database configuration issues" -ForegroundColor Gray
        } else {
            Write-Host "✓ Database connection time is acceptable" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ Database not accessible" -ForegroundColor Red
    }
    
    # Performance recommendations
    Write-Host "Performance Recommendations:" -ForegroundColor Yellow
    if ($cpuUsage.Average -gt 80) {
        Write-Host "- Consider upgrading CPU or adding load balancing" -ForegroundColor Gray
    }
    if ($memoryUsagePercent -gt 80) {
        Write-Host "- Consider adding more RAM" -ForegroundColor Gray
    }
    if ($responseTime.TotalMilliseconds -gt 5000) {
        Write-Host "- Optimize application performance" -ForegroundColor Gray
        Write-Host "- Consider implementing caching" -ForegroundColor Gray
    }
    
    Write-Host "" -ForegroundColor White
    Write-Host "=== Performance Diagnostics Complete ===" -ForegroundColor Cyan
}

# Run performance diagnostics
Test-PerformanceBottlenecks
```

---

## Quick Reference Commands

### Essential Commands for LAN Deployment

```powershell
# Network Configuration
ipconfig /all
netstat -an | findstr ":3000\|:5173\|:3001\|:5432"
ping 192.168.1.100
nslookup bebang.local

# Firewall Management
netsh advfirewall firewall show rule name="Bebang Backend API"
netsh advfirewall firewall add rule name="Bebang Test" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall delete rule name="Bebang Test"

# Service Management
Get-Service | Where-Object {$_.Name -like "*postgres*"}
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Performance Monitoring
Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 10
Get-Counter "\Memory\Available MBytes" -SampleInterval 1 -MaxSamples 10

# Log Management
Get-EventLog -LogName Application -Newest 20 | Where-Object {$_.Source -like "*Bebang*"}
Get-Content "C:\BebangLogs\application.log" -Tail 20

# Backup Operations
Backup-BebangPortal -BackupPath "\\backup-server\BebangBackups"
Test-BackupIntegrity -BackupPath "\\backup-server\BebangBackups"
```

---

## Checklist Deployment LAN

### Pre-Deployment Checklist
- [ ] Server hardware meets minimum requirements
- [ ] Network topology designed and documented
- [ ] IP addresses assigned and documented
- [ ] Windows Server/Client OS installed and updated
- [ ] Network drivers installed and configured
- [ ] Static IP configured on server
- [ ] DNS entries created (hosts file or DNS server)
- [ ] Firewall rules created and tested
- [ ] User accounts created with appropriate permissions
- [ ] Application installed and configured
- [ ] Database installed and configured
- [ ] SSL certificates generated and installed (if using HTTPS)
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured
- [ ] Documentation completed

### Post-Deployment Verification
- [ ] All services running correctly
- [ ] Network connectivity verified from client machines
- [ ] Application accessible via IP address
- [ ] Application accessible via hostname
- [ ] All ports open and accessible
- [ ] Database connectivity verified
- [ ] Real-time features working (WebSocket)
- [ ] Performance metrics within acceptable ranges
- [ ] Backup procedures working
- [ ] Monitoring and alerting configured
- [ ] User training completed
- [ ] Documentation updated with actual configuration

---

## Kesimpulan

Tutorial ini telah membahas semua aspek penting dalam deployment aplikasi Bebang Pack Meal Portal di jaringan LAN. Dengan mengikuti panduan ini, Anda dapat:

1. **Mendesain arsitektur jaringan** yang sesuai untuk kebutuhan multi-user
2. **Mengkonfigurasi server** Windows 10/11 atau Windows Server untuk akses LAN
3. **Mengamankan jaringan** dengan firewall rules yang tepat
4. **Mengoptimalkan performa** untuk penggunaan bersama
5. **Memantau dan mengelola** sistem secara efektif
6. **Menyelesaikan masalah** jaringan yang umum terjadi

Penting untuk melakukan testing menyeluruh setelah setup awal dan secara berkala memonitor performa sistem untuk memastikan aplikasi berjalan dengan optimal di lingkungan jaringan LAN.