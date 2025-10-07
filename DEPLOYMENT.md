# Deployment Guide - Bebang Pack Meal Portal

Panduan deployment aplikasi ke production server **tanpa menggunakan Docker**.

## Prerequisites

**Server Requirements:**
- Ubuntu 20.04 LTS or newer (or similar Linux distribution)
- Node.js >= 18.x
- PostgreSQL >= 14.x
- Nginx (for reverse proxy and static file serving)
- PM2 (for process management)
- Minimum 2GB RAM, 2 CPU cores
- 20GB disk space

**Domain & SSL:**
- Domain name pointing to server IP
- SSL certificate (use Let's Encrypt - free)

---

## Step 1: Server Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should be 18.x or higher
npm --version
```

### 1.3 Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 1.4 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.5 Install PM2 Globally
```bash
sudo npm install -g pm2
```

---

## Step 2: Database Setup

### 2.1 Create Production Database
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE bebang_pack_meal_prod;
CREATE USER bebang_admin WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal_prod TO bebang_admin;
\q
```

### 2.2 Configure PostgreSQL for Remote Access (if needed)
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = 'localhost'  # Or '*' for remote access

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host bebang_pack_meal_prod bebang_admin 127.0.0.1/32 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Step 3: Application Deployment

### 3.1 Clone Repository
```bash
# Create application directory
sudo mkdir -p /var/www/bebang-pack-meal
sudo chown $USER:$USER /var/www/bebang-pack-meal

# Clone repository
cd /var/www/bebang-pack-meal
git clone <your-repo-url> .
# Or upload files via SCP/SFTP
```

### 3.2 Install Dependencies
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
```

### 3.3 Configure Backend Environment
```bash
cd backend

# Copy production environment template
cp .env.production.example .env

# Edit .env with production values
nano .env
# Update:
# - DATABASE_URL with production credentials
# - JWT_SECRET and JWT_REFRESH_SECRET (generate random strings)
# - CORS_ORIGIN with production frontend URL
```

**Generate JWT Secrets:**
```bash
# Generate random secret (run twice for two different secrets)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.4 Run Database Migrations
```bash
cd /var/www/bebang-pack-meal/backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:prod

# Seed database (optional, for initial data)
npm run prisma:seed
```

### 3.5 Build Backend
```bash
cd /var/www/bebang-pack-meal/backend
npm run build

# Verify build
ls -la dist/
```

### 3.6 Configure Frontend Environment
```bash
cd /var/www/bebang-pack-meal/frontend

# Copy production environment template
cp .env.production.example .env.production

# Edit .env.production
nano .env.production
# Update:
# - VITE_API_BASE_URL to production backend URL (e.g., https://api.your-domain.com/api)
# - VITE_WS_URL to production WebSocket URL (e.g., https://api.your-domain.com)
```

### 3.7 Build Frontend
```bash
cd /var/www/bebang-pack-meal/frontend
npm run build

# Verify build
ls -la dist/
# Should contain: index.html, assets/, icons/, manifest.webmanifest, sw.js
```

---

## Step 4: Start Backend with PM2

### 4.1 Create Logs Directory
```bash
cd /var/www/bebang-pack-meal/backend
mkdir -p logs
```

### 4.2 Start Backend
```bash
cd /var/www/bebang-pack-meal/backend
pm2 start ecosystem.config.js --env production

# Verify running
pm2 status
pm2 logs bebang-pack-meal-api
```

### 4.3 Save PM2 Process List
```bash
# Save current process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions printed (run the command it suggests)
```

### 4.4 Test Backend
```bash
# Health check
curl http://localhost:3000/api/health
# Should return: {"status":"ok","message":"Bebang Pack Meal Portal API is running",...}
```

---

## Step 5: Configure Nginx

### 5.1 Copy Nginx Configuration
```bash
# Copy example config
sudo cp /var/www/bebang-pack-meal/nginx.conf.example /etc/nginx/sites-available/bebang-pack-meal

# Edit configuration
sudo nano /etc/nginx/sites-available/bebang-pack-meal
# Update:
# - server_name to your actual domain
# - root path to /var/www/bebang-pack-meal/frontend/dist
# - SSL certificate paths (after obtaining certificates)
```

### 5.2 Obtain SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (interactive)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically update Nginx config with SSL settings
```

### 5.3 Enable Site
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/bebang-pack-meal /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5.4 Configure Firewall
```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Verify
sudo ufw status
```

---

## Step 6: Verify Deployment

### 6.1 Test Frontend
```bash
# Open in browser
https://your-domain.com

# Should see login page
# Try logging in with test credentials
```

### 6.2 Test Backend API
```bash
# Health check via Nginx proxy
curl https://your-domain.com/api/health

# Should return OK response
```

### 6.3 Test WebSocket
```bash
# Use browser DevTools console
const socket = io('https://your-domain.com/notifications', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
socket.on('connected', (data) => console.log('Connected:', data));
```

### 6.4 Test PWA Installation
- Open app in Chrome/Edge
- Look for install icon in address bar
- Click to install
- Verify app opens in standalone mode
- Test offline mode by disabling network in DevTools

---

## Step 7: Monitoring & Maintenance

### 7.1 Monitor Backend
```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs bebang-pack-meal-api --lines 100

# Check status
pm2 status
```

### 7.2 Monitor Nginx
```bash
# Check Nginx status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/bebang-pack-meal-access.log

# View error logs
sudo tail -f /var/log/nginx/bebang-pack-meal-error.log
```

### 7.3 Monitor PostgreSQL
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
sudo -u postgres psql bebang_pack_meal_prod

# Check database size
\l+

# Check table sizes
\dt+
```

### 7.4 Database Backup
```bash
# Create backup script
sudo nano /usr/local/bin/backup-bebang-db.sh
```

**Backup script content:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/bebang-pack-meal"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U bebang_admin bebang_pack_meal_prod | gzip > $BACKUP_DIR/backup_$DATE.sql.gz
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-bebang-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add line: 0 2 * * * /usr/local/bin/backup-bebang-db.sh
```

---

## Step 8: Updates & Rollback

### 8.1 Deploy Updates
```bash
cd /var/www/bebang-pack-meal

# Pull latest code
git pull origin main

# Install new dependencies (if any)
npm run install:all

# Backend updates
cd backend
npm run prisma:generate
npm run prisma:migrate:prod  # Run new migrations
npm run build
pm2 restart bebang-pack-meal-api

# Frontend updates
cd ../frontend
npm run build

# Nginx will serve new build automatically
# Clear browser cache or use Ctrl+Shift+R
```

### 8.2 Rollback (if needed)
```bash
# Rollback database migration
cd /var/www/bebang-pack-meal/backend
npx prisma migrate resolve --rolled-back <migration-name>

# Rollback code
git revert <commit-hash>
# Or restore from backup

# Rebuild and restart
npm run build
pm2 restart bebang-pack-meal-api
```

---

## Step 9: Security Checklist

- [ ] Change all default passwords (database, JWT secrets)
- [ ] Use strong random strings for JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Enable HTTPS (SSL certificate installed)
- [ ] Configure firewall (ufw) to allow only necessary ports
- [ ] Set up database backups (automated)
- [ ] Configure Nginx security headers
- [ ] Disable PostgreSQL remote access (if not needed)
- [ ] Set up monitoring and alerting
- [ ] Review and limit CORS_ORIGIN to production domain only
- [ ] Enable rate limiting in Nginx (optional)
- [ ] Set up log rotation

---

## Troubleshooting

**Backend not starting:**
```bash
pm2 logs bebang-pack-meal-api --err
# Check for database connection errors, missing env vars
```

**Frontend shows blank page:**
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/bebang-pack-meal-error.log

# Verify build exists
ls -la /var/www/bebang-pack-meal/frontend/dist/

# Check Nginx config
sudo nginx -t
```

**WebSocket not connecting:**
- Verify backend WebSocket server is running on port 3001
- Check Nginx WebSocket proxy configuration
- Verify firewall allows WebSocket connections
- Check browser console for connection errors

**Database connection failed:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in backend/.env
- Test connection: `psql -U bebang_admin -d bebang_pack_meal_prod -h localhost`

---

## Performance Optimization

**Backend:**
- Use PM2 cluster mode (already configured in ecosystem.config.js)
- Enable Prisma query logging in development, disable in production
- Set up database connection pooling
- Monitor memory usage: `pm2 monit`

**Frontend:**
- Vite build is already optimized (code splitting, tree shaking, minification)
- Nginx gzip compression enabled
- Static assets cached with long expiration
- Service worker caches API responses

**Database:**
- Create indexes on frequently queried columns (already in Prisma schema)
- Run VACUUM ANALYZE periodically
- Monitor slow queries

---

## Monitoring & Logs

**Backend Logs:**
```bash
# PM2 logs
pm2 logs bebang-pack-meal-api

# Application logs (if using file logging)
tail -f /var/www/bebang-pack-meal/backend/logs/app.log
```

**Nginx Logs:**
```bash
# Access logs
sudo tail -f /var/log/nginx/bebang-pack-meal-access.log

# Error logs
sudo tail -f /var/log/nginx/bebang-pack-meal-error.log
```

**PostgreSQL Logs:**
```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## Scaling Considerations

**Horizontal Scaling:**
- Use PM2 cluster mode (already configured)
- Add more PM2 instances: Edit `ecosystem.config.js` and increase `instances`
- Use Nginx load balancing for multiple backend servers

**Database Scaling:**
- Set up read replicas for reporting queries
- Use connection pooling (PgBouncer)
- Partition large tables (audit_trail) by date

**CDN (Optional):**
- Serve static assets (frontend build) via CDN for faster global access
- Configure Nginx to set proper cache headers

---

## Backup & Disaster Recovery

**Automated Backups:**
- Database: Daily backups via cron (see Step 7.4)
- Application code: Git repository (offsite)
- Environment files: Secure backup of .env files

**Recovery Procedure:**
1. Restore database from backup:
   ```bash
   gunzip < /var/backups/bebang-pack-meal/backup_YYYYMMDD_HHMMSS.sql.gz | psql -U bebang_admin bebang_pack_meal_prod
   ```
2. Restore application code from Git
3. Restore .env files from secure backup
4. Rebuild and restart services

---

## SSL Certificate Renewal

Let's Encrypt certificates expire every 90 days. Certbot sets up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot auto-renewal is configured via systemd timer
sudo systemctl status certbot.timer
```

---

## Contact & Support

For issues or questions:
- Check logs first (PM2, Nginx, PostgreSQL)
- Review this deployment guide
- Check backend/frontend README files
- Review application documentation in `prompt/` directory

---

**Deployment Checklist:**

- [ ] Server setup complete (Node.js, PostgreSQL, Nginx, PM2)
- [ ] Database created with production credentials
- [ ] Backend .env configured with strong secrets
- [ ] Frontend .env.production configured with production URLs
- [ ] Database migrations run successfully
- [ ] Backend built and started with PM2
- [ ] Frontend built successfully
- [ ] Nginx configured and SSL certificate obtained
- [ ] Application accessible via HTTPS
- [ ] Login works with test credentials
- [ ] WebSocket connection works
- [ ] PWA installable
- [ ] Database backups configured
- [ ] PM2 auto-start on reboot configured
- [ ] Monitoring and logging set up
- [ ] Security checklist completed

**Congratulations! Your Bebang Pack Meal Portal is now deployed in production! 🎉**