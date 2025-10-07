# Tutorial Deployment Komprehensif - Bebang Pack Meal Portal

Panduan lengkap deployment aplikasi Bebang Pack Meal Portal ke production server untuk berbagai platform dan environment.

## 📋 Daftar Isi

1. [Arsitektur Aplikasi](#arsitektur-aplikasi)
2. [Prerequisites](#prerequisites)
3. [Setup Environment](#setup-environment)
4. [Konfigurasi Database PostgreSQL](#konfigurasi-database-postgresql)
5. [Setup Backend](#setup-backend)
6. [Setup Frontend](#setup-frontend)
7. [Konfigurasi Reverse Proxy](#konfigurasi-reverse-proxy)
8. [Deployment Production](#deployment-production)
9. [Multi-Platform Deployment](#multi-platform-deployment)
10. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
11. [Security Considerations](#security-considerations)
12. [Backup & Recovery](#backup--recovery)

---

## 🏗️ Arsitektur Aplikasi

Bebang Pack Meal Portal adalah aplikasi monorepo dengan arsitektur berikut:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React SPA)   │◄──►│   (NestJS)      │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ - React 18      │    │ - NestJS 10     │    │ - Prisma ORM    │
│ - Vite 7        │    │ - JWT Auth      │    │ - Migrations    │
│ - Tailwind CSS  │    │ - WebSockets    │    │ - Relations     │
│ - PWA           │    │ - Validation    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Komponen Utama:
- **Backend**: NestJS API server dengan TypeScript
- **Frontend**: React SPA dengan Vite, TypeScript, dan PWA
- **Database**: PostgreSQL dengan Prisma ORM
- **Real-time**: WebSocket untuk notifications
- **Process Manager**: PM2 untuk production
- **Reverse Proxy**: Nginx untuk load balancing dan SSL

---

## 📦 Prerequisites

### Server Requirements (Minimum)
- **OS**: Ubuntu 20.04+ / Debian 10+ / Windows Server 2019+ / CentOS 8+
- **CPU**: 2 cores
- **RAM**: 4GB (2GB minimum)
- **Storage**: 20GB SSD
- **Network**: Stable internet connection

### Software Requirements
- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **PostgreSQL**: >= 14.x
- **Nginx**: >= 1.18
- **PM2**: >= 5.x
- **Git**: >= 2.x

### Domain & SSL
- Domain name pointing to server IP
- SSL certificate (Let's Encrypt recommended)

---

## 🛠️ Setup Environment

### Ubuntu/Debian

#### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Install Node.js 18.x
```bash
# Install NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be 18.x or higher
npm --version
```

#### 3. Install Git
```bash
sudo apt install -y git
```

### Windows Server

#### 1. Install Chocolatey (Package Manager)
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### 2. Install Node.js
```powershell
choco install nodejs --version=18.19.0 -y
```

#### 3. Install Git
```powershell
choco install git -y
```

### CentOS/RHEL

#### 1. Update System
```bash
sudo yum update -y
```

#### 2. Install Node.js 18.x
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

---

## 🗄️ Konfigurasi Database PostgreSQL

### Ubuntu/Debian

#### 1. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 2. Create Production Database
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE bebang_pack_meal_prod;
CREATE USER bebang_admin WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal_prod TO bebang_admin;
ALTER USER bebang_admin CREATEDB;
\q
```

#### 3. Configure PostgreSQL
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Set these values:
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB

# Edit pg_hba.conf for local connections
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add line for local connections:
local   bebang_pack_meal_prod   bebang_admin                     md5
host    bebang_pack_meal_prod   bebang_admin   127.0.0.1/32      md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Windows Server

#### 1. Download and Install PostgreSQL
- Download dari https://www.postgresql.org/download/windows/
- Pilih versi 14+ dan ikuti wizard instalasi
- Set password untuk postgres user
- Install pgAdmin (optional)

#### 2. Create Database via pgAdmin atau Command Line
```cmd
# Using command line
cd "C:\Program Files\PostgreSQL\14\bin"
psql -U postgres

CREATE DATABASE bebang_pack_meal_prod;
CREATE USER bebang_admin WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal_prod TO bebang_admin;
\q
```

### Database Connection Testing
```bash
# Test connection from server
psql -U bebang_admin -d bebang_pack_meal_prod -h localhost -W

# Should connect successfully
```

---

## 🔧 Setup Backend

### 1. Clone Repository
```bash
# Create application directory
sudo mkdir -p /var/www/bebang-pack-meal
sudo chown $USER:$USER /var/www/bebang-pack-meal

# Clone repository
cd /var/www/bebang-pack-meal
git clone <your-repo-url> .
# Atau upload files via SCP/SFTP
```

### 2. Install Dependencies
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
```

### 3. Configure Environment
```bash
cd backend

# Copy production environment template
cp .env.production.example .env

# Edit .env dengan production values
nano .env
```

**Environment Configuration (.env):**
```env
# Application
NODE_ENV=production
PORT=3000

# Database (PostgreSQL) - PRODUCTION
DATABASE_URL=postgresql://bebang_admin:YOUR_STRONG_PASSWORD@localhost:5432/bebang_pack_meal_prod?schema=public

# JWT Authentication - PRODUCTION
# Generate strong random secrets:
JWT_SECRET=GENERATE_64_CHAR_HEX_STRING_HERE
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=GENERATE_DIFFERENT_64_CHAR_HEX_STRING_HERE
JWT_REFRESH_EXPIRES_IN=7d

# CORS - PRODUCTION
CORS_ORIGIN=https://your-domain.com

# WebSocket - PRODUCTION
WS_PORT=3001

# Logging
LOG_LEVEL=info

# Security
HTTPS_ENABLED=true
```

#### Generate JWT Secrets:
```bash
# Generate random secret (run twice untuk dua secrets berbeda)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Database Setup
```bash
cd /var/www/bebang-pack-meal/backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations ke production database
npm run prisma:migrate:prod

# Seed database (optional, untuk initial data)
npm run prisma:seed
```

### 5. Build Backend
```bash
cd /var/www/bebang-pack-meal/backend
npm run build

# Verify build
ls -la dist/
# Should contain main.js dan other compiled files
```

### 6. Setup PM2 Process Manager
```bash
# Create logs directory
mkdir -p logs

# Start backend dengan PM2
pm2 start ecosystem.config.js --env production

# Verify running
pm2 status
pm2 logs bebang-pack-meal-api

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions printed (run the command it suggests)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 7. Test Backend
```bash
# Health check
curl http://localhost:3000/api/health

# Should return:
{"status":"ok","message":"Bebang Pack Meal Portal API is running","timestamp":"..."}
```

---

## 🎨 Setup Frontend

### 1. Configure Environment
```bash
cd /var/www/bebang-pack-meal/frontend

# Copy production environment template
cp .env.production.example .env.production

# Edit .env.production
nano .env.production
```

**Frontend Environment (.env.production):**
```env
# API Configuration - PRODUCTION
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_WS_URL=https://api.your-domain.com

# Application
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=production

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE_MODE=true
```

### 2. Build Frontend
```bash
cd /var/www/bebang-pack-meal/frontend
npm run build

# Verify build
ls -la dist/
# Should contain: index.html, assets/, icons/, manifest.webmanifest, sw.js
```

### 3. Test Frontend Build (Optional)
```bash
# Start preview server untuk testing
npm run preview

# Test dengan curl
curl http://localhost:4173
# Should return HTML content

# Stop preview server (Ctrl+C)
```

---

## 🌐 Konfigurasi Reverse Proxy

### Ubuntu/Debian - Nginx

#### 1. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 2. Copy Nginx Configuration
```bash
# Copy example config
sudo cp /var/www/bebang-pack-meal/nginx.conf.example /etc/nginx/sites-available/bebang-pack-meal

# Edit configuration
sudo nano /etc/nginx/sites-available/bebang-pack-meal
```

**Nginx Configuration:**
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Certificate (use Let's Encrypt certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend (React build)
    root /var/www/bebang-pack-meal/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Cache static assets longer
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker (don't cache)
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # Manifest (don't cache)
    location = /manifest.webmanifest {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # Backend API (reverse proxy to NestJS)
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket (Socket.IO)
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Access logs
    access_log /var/log/nginx/bebang-pack-meal-access.log;
    error_log /var/log/nginx/bebang-pack-meal-error.log;
}
```

#### 3. Obtain SSL Certificate
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (interactive)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot akan otomatis update Nginx config dengan SSL settings
```

#### 4. Enable Site
```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Enable site
sudo ln -s /etc/nginx/sites-available/bebang-pack-meal /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 5. Configure Firewall
```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Verify
sudo ufw status
```

### Windows Server - IIS

#### 1. Install IIS
```powershell
# Enable IIS via PowerShell
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45
```

#### 2. Install URL Rewrite Module
Download dari https://www.iis.net/downloads/microsoft/url-rewrite

#### 3. Install Application Request Routing (ARR)
Download dari https://www.iis.net/downloads/microsoft/application-request-routing

#### 4. Configure IIS
- Buka IIS Manager
- Create new website untuk Bebang Pack Meal Portal
- Point ke `C:\inetpub\bebang-pack-meal\frontend\dist`
- Configure reverse proxy untuk backend API

---

## 🚀 Deployment Production

### 1. Final Verification
```bash
# Test Backend API
curl https://your-domain.com/api/health

# Test Frontend
curl https://your-domain.com
# Should return HTML content

# Test WebSocket
# Buka browser dev tools dan test socket connection
```

### 2. Configure System Services

#### Ubuntu/Debian
```bash
# Ensure PM2 starts on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Ensure Nginx starts on boot
sudo systemctl enable nginx

# Ensure PostgreSQL starts on boot
sudo systemctl enable postgresql
```

#### Windows Server
```powershell
# Install PM2 as Windows service
npm install -g pm2-windows-service
pm2-startup install
```

### 3. Configure Log Rotation

#### Ubuntu/Debian
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/bebang-pack-meal

# Content:
/var/www/bebang-pack-meal/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 4. Configure Monitoring

#### Basic Monitoring Script
```bash
# Create monitoring script
sudo nano /usr/local/bin/monitor-bebang.sh

#!/bin/bash
# Monitoring script untuk Bebang Pack Meal Portal

# Check backend health
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ $BACKEND_STATUS -ne 200 ]; then
    echo "Backend is DOWN! Status: $BACKEND_STATUS"
    # Restart backend
    pm2 restart bebang-pack-meal-api
fi

# Check database connection
if ! pg_isready -U bebang_admin -d bebang_pack_meal_prod; then
    echo "Database is DOWN!"
    # Restart PostgreSQL
    sudo systemctl restart postgresql
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is DOWN!"
    sudo systemctl start nginx
fi

# Make executable
sudo chmod +x /usr/local/bin/monitor-bebang.sh

# Add to crontab (every 5 minutes)
crontab -e
# Add: */5 * * * * /usr/local/bin/monitor-bebang.sh
```

---

## 🖥️ Multi-Platform Deployment

### Docker Deployment (Optional)

#### 1. Create Dockerfile untuk Backend
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
```

#### 2. Create Dockerfile untuk Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Create docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://bebang_admin:password@postgres:5432/bebang_pack_meal_prod
      JWT_SECRET: your-jwt-secret
      JWT_REFRESH_SECRET: your-jwt-refresh-secret
    depends_on:
      - postgres
    ports:
      - "3000:3000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: bebang_pack_meal_prod
      POSTGRES_USER: bebang_admin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### 4. Deploy dengan Docker
```bash
# Build dan start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Kubernetes Deployment (Advanced)

#### 1. Create Kubernetes Manifests
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bebang-pack-meal

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bebang-config
  namespace: bebang-pack-meal
data:
  NODE_ENV: "production"
  PORT: "3000"
  WS_PORT: "3001"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: bebang-secrets
  namespace: bebang-pack-meal
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  JWT_REFRESH_SECRET: <base64-encoded-refresh-secret>

---
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bebang-backend
  namespace: bebang-pack-meal
spec:
  replicas: 2
  selector:
    matchLabels:
      app: bebang-backend
  template:
    metadata:
      labels:
        app: bebang-backend
    spec:
      containers:
      - name: backend
        image: bebang-pack-meal/backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: bebang-config
        - secretRef:
            name: bebang-secrets

---
# k8s/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: bebang-backend-service
  namespace: bebang-pack-meal
spec:
  selector:
    app: bebang-backend
  ports:
  - port: 3000
    targetPort: 3000

---
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bebang-frontend
  namespace: bebang-pack-meal
spec:
  replicas: 2
  selector:
    matchLabels:
      app: bebang-frontend
  template:
    metadata:
      labels:
        app: bebang-frontend
    spec:
      containers:
      - name: frontend
        image: bebang-pack-meal/frontend:latest
        ports:
        - containerPort: 80

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bebang-ingress
  namespace: bebang-pack-meal
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: bebang-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: bebang-backend-service
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bebang-frontend-service
            port:
              number: 80
```

---

## 📊 Monitoring & Troubleshooting

### 1. PM2 Monitoring
```bash
# PM2 monitoring dashboard
pm2 monit

# View logs
pm2 logs bebang-pack-meal-api --lines 100

# Check status
pm2 status

# Restart backend
pm2 restart bebang-pack-meal-api

# Reload tanpa downtime
pm2 reload bebang-pack-meal-api
```

### 2. Nginx Monitoring
```bash
# Check Nginx status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/bebang-pack-meal-access.log

# View error logs
sudo tail -f /var/log/nginx/bebang-pack-meal-error.log

# Test Nginx configuration
sudo nginx -t
```

### 3. PostgreSQL Monitoring
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
sudo -u postgres psql bebang_pack_meal_prod

# Check database size
\l+

# Check table sizes
\dt+

# Check active connections
SELECT count(*) FROM pg_stat_activity;
```

### 4. System Monitoring
```bash
# Check system resources
htop
df -h
free -h

# Check disk usage
du -sh /var/www/bebang-pack-meal

# Check network connections
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
```

### 5. Common Issues & Solutions

#### Backend tidak starting
```bash
# Check PM2 logs
pm2 logs bebang-pack-meal-api --err

# Common issues:
# - Database connection failed → Check DATABASE_URL
# - Port already in use → Check with `lsof -i :3000`
# - Missing environment variables → Check .env file
```

#### Frontend shows blank page
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/bebang-pack-meal-error.log

# Verify build exists
ls -la /var/www/bebang-pack-meal/frontend/dist/

# Check Nginx config
sudo nginx -t
```

#### WebSocket not connecting
```bash
# Check backend WebSocket server
netstat -tulpn | grep :3001

# Check Nginx WebSocket proxy configuration
# Verify firewall allows WebSocket connections

# Test with browser DevTools
const socket = io('https://your-domain.com/notifications', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
socket.on('connected', (data) => console.log('Connected:', data));
```

#### Database connection failed
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U bebang_admin -d bebang_pack_meal_prod -h localhost -W

# Check DATABASE_URL in backend/.env
```

---

## 🔒 Security Considerations

### 1. Environment Security
```bash
# Set proper file permissions
chmod 600 /var/www/bebang-pack-meal/backend/.env
chmod 600 /var/www/bebang-pack-meal/frontend/.env.production

# Restrict access to application directory
chmod 755 /var/www/bebang-pack-meal
chmod -R 755 /var/www/bebang-pack-meal/frontend/dist
```

### 2. Database Security
```bash
# Create database user dengan limited privileges
sudo -u postgres psql

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO bebang_admin;
GRANT CREATE ON SCHEMA public TO bebang_admin;
```

### 3. Firewall Configuration
```bash
# Ubuntu/Debian - UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw deny 3000  # Block direct backend access
sudo ufw deny 3001  # Block direct WebSocket access

# CentOS/RHEL - firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 4. SSL/TLS Security
```bash
# Test SSL configuration
sudo certbot renew --dry-run

# Check SSL certificate expiry
sudo certbot certificates

# Force HTTPS redirect sudah dikonfigurasi di Nginx
```

### 5. Application Security
```bash
# Update dependencies regularly
npm audit
npm audit fix

# Use strong passwords
# Generate random JWT secrets
# Enable rate limiting di Nginx (optional)
```

### 6. Security Headers (sudah dikonfigurasi di Nginx)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: no-referrer-when-downgrade

---

## 💾 Backup & Recovery

### 1. Database Backup

#### Automated Backup Script
```bash
# Create backup script
sudo nano /usr/local/bin/backup-bebang-db.sh

#!/bin/bash
BACKUP_DIR="/var/backups/bebang-pack-meal"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -U bebang_admin bebang_pack_meal_prod | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Log backup
echo "Database backup completed: backup_$DATE.sql.gz" >> $BACKUP_DIR/backup.log

# Make executable
sudo chmod +x /usr/local/bin/backup-bebang-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-bebang-db.sh
```

#### Manual Backup
```bash
# Create backup
pg_dump -U bebang_admin bebang_pack_meal_prod | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore database
gunzip -c backup_YYYYMMDD_HHMMSS.sql.gz | psql -U bebang_admin bebang_pack_meal_prod
```

### 2. Application Backup
```bash
# Create application backup
tar -czf bebang-pack-meal-app_$(date +%Y%m%d_%H%M%S).tar.gz \
  /var/www/bebang-pack-meal/backend/dist \
  /var/www/bebang-pack-meal/frontend/dist \
  /var/www/bebang-pack-meal/backend/.env \
  /var/www/bebang-pack-meal/frontend/.env.production
```

### 3. Configuration Backup
```bash
# Backup Nginx configuration
sudo tar -czf nginx-config_$(date +%Y%m%d_%H%M%S).tar.gz \
  /etc/nginx/sites-available/bebang-pack-meal \
  /etc/letsencrypt/live/your-domain.com

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 pm2-config_$(date +%Y%m%d_%H%M%S).json
```

### 4. Recovery Procedure

#### Complete Recovery
```bash
# 1. Restore database
gunzip -c /var/backups/bebang-pack-meal/backup_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U bebang_admin bebang_pack_meal_prod

# 2. Restore application files
tar -xzf bebang-pack-meal-app_YYYYMMDD_HHMMSS.tar.gz -C /

# 3. Restore configuration
sudo tar -xzf nginx-config_YYYYMMDD_HHMMSS.tar.gz -C /

# 4. Restart services
sudo systemctl reload nginx
pm2 restart bebang-pack-meal-api
```

---

## 📝 Deployment Checklist

### Pre-Deployment Checklist
- [ ] Server requirements terpenuhi (CPU, RAM, Storage)
- [ ] Domain name pointing ke server IP
- [ ] SSL certificate ready (Let's Encrypt)
- [ ] Database credentials generated
- [ ] JWT secrets generated
- [ ] Firewall configured
- [ ] Backup strategy planned

### Deployment Checklist
- [ ] System packages installed (Node.js, PostgreSQL, Nginx, PM2)
- [ ] Database created dan configured
- [ ] Application code cloned
- [ ] Dependencies installed
- [ ] Environment files configured
- [ ] Database migrations run
- [ ] Backend built dan tested
- [ ] Frontend built dan tested
- [ ] PM2 configured dan started
- [ ] Nginx configured dan SSL installed
- [ ] Services enabled on boot
- [ ] Monitoring scripts configured
- [ ] Backup scripts configured

### Post-Deployment Checklist
- [ ] Application accessible via HTTPS
- [ ] Login works dengan test credentials
- [ ] WebSocket connection works
- [ ] PWA installable
- [ ] All features functional
- [ ] Logs monitored untuk errors
- [ ] Performance tested
- [ ] Security scan completed
- [ ] Documentation updated

---

## 🆘 Troubleshooting Quick Reference

### Emergency Commands
```bash
# Restart all services
pm2 restart bebang-pack-meal-api
sudo systemctl restart nginx
sudo systemctl restart postgresql

# Check all services status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# View all logs
pm2 logs bebang-pack-meal-api
sudo tail -f /var/log/nginx/bebang-pack-meal-error.log
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Common Port Issues
```bash
# Check what's running on ports
netstat -tulpn | grep :80    # Nginx
netstat -tulpn | grep :443   # Nginx SSL
netstat -tulpn | grep :3000  # Backend API
netstat -tulpn | grep :3001  # WebSocket
netstat -tulpn | grep :5432  # PostgreSQL

# Kill process on specific port
sudo fuser -k 3000/tcp
```

### Performance Issues
```bash
# Check system resources
htop
df -h
free -h

# Check application performance
pm2 monit
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
1. **Daily**: Monitor logs dan system performance
2. **Weekly**: Check security updates dan backup integrity
3. **Monthly**: Update dependencies dan review security settings
4. **Quarterly**: Performance audit dan capacity planning

### Contact Information
- **Emergency**: System administrator
- **Technical Issues**: Development team
- **Security Issues**: Security team

### Documentation
- Application documentation: `docs/` directory
- API documentation: Backend README
- Deployment logs: `/var/log/`
- Backup location: `/var/backups/bebang-pack-meal/`

---

**🎉 Selamat! Aplikasi Bebang Pack Meal Portal Anda sekarang sudah di-deploy di production!**

Untuk pertanyaan atau masalah, periksa logs terlebih dahulu dan rujuk ke troubleshooting guide di atas.