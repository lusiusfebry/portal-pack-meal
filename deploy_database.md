# Database Management Tutorial: Staging to Production Migration
**Bebang Pack Meal Portal - PostgreSQL Database Management**

## Table of Contents
1. [Database Management Fundamentals](#database-management-fundamentals)
2. [Staging Environment Backup](#staging-environment-backup)
3. [Production Environment Preparation](#production-environment-preparation)
4. [Database Migration & Restore Process](#database-migration--restore-process)
5. [Automation & Scripts](#automation--scripts)
6. [Troubleshooting & Recovery](#troubleshooting--recovery)
7. [Best Practices & Security](#best-practices--security)

---

## Database Management Fundamentals

### Database Structure Overview

Aplikasi Bebang Pack Meal Portal menggunakan PostgreSQL dengan Prisma ORM. Struktur database utama:

```sql
-- Core Tables
User              -- Authentication & user management
Department        -- Organizational structure
Jabatan           -- Position/role definitions
Shift             -- Work shift configurations
Karyawan          -- Employee profiles
Pesanan           -- Order transactions
AuditTrail        -- Compliance & activity logs

-- Relationships
User 1:1 Karyawan
Karyawan N:1 Department
Karyawan N:1 Jabatan
Karyawan N:1 Shift
Pesanan N:1 Karyawan
AuditTrail N:1 User (actor)
```

### Environment Configurations

#### Staging Environment (.env.staging)
```env
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://staging_user:staging_pass@staging-db.example.com:5432/bebang_staging?schema=public
JWT_SECRET=staging_jwt_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=staging_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://staging.bebang-portal.com
WS_PORT=3001
```

#### Production Environment (.env.production)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod_user:secure_pass@prod-db.example.com:5432/bebang_production?schema=public
JWT_SECRET=super_secure_production_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super_secure_production_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://portal.bebang.com
WS_PORT=3001
```

### Security Considerations

1. **Data Classification**:
   - **Sensitive**: Password hashes, personal employee data
   - **Confidential**: Order history, audit trails
   - **Public**: Department names, shift schedules

2. **Access Control**:
   - Database users with minimal privileges
   - SSL connections required
   - IP whitelisting for database access

3. **Compliance Requirements**:
   - GDPR compliance for personal data
   - Data retention policies
   - Audit trail integrity

---

## Staging Environment Backup

### Pre-Backup Checklist

- [ ] Verify staging database is in consistent state
- [ ] Check for active transactions and locks
- [ ] Validate data integrity with Prisma
- [ ] Ensure sufficient disk space for backup
- [ ] Document current database version and schema
- [ ] Notify stakeholders about backup window

### Backup Methods

#### Method 1: pg_dump (Recommended for Full Backup)

```bash
# Create compressed backup
pg_dump -h staging-db.example.com -U staging_user -d bebang_staging \
  --format=custom --compress=9 --verbose \
  --file=staging_backup_$(date +%Y%m%d_%H%M%S).dump

# Create SQL backup
pg_dump -h staging-db.example.com -U staging_user -d bebang_staging \
  --format=plain --no-owner --no-privileges \
  --file=staging_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Method 2: Prisma Export (For Data-Only Backup)

```bash
# Export data using Prisma
npx prisma db export --schema=./prisma/schema.prisma \
  --output=staging_data_export_$(date +%Y%m%d_%H%M%S).json
```

#### Method 3: Custom Backup Script

```bash
#!/bin/bash
# backup_staging.sh

set -e

# Configuration
DB_HOST="staging-db.example.com"
DB_USER="staging_user"
DB_NAME="bebang_staging"
BACKUP_DIR="/backups/staging"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/staging_backup_$TIMESTAMP.dump"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Start backup
echo "Starting backup at $(date)"

# Create database backup
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  --format=custom --compress=9 --verbose \
  --file="$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
  echo "Backup completed successfully: $BACKUP_FILE"
  echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
  echo "Backup failed!"
  exit 1
fi

# Create checksum
sha256sum "$BACKUP_FILE" > "$BACKUP_FILE.sha256"
echo "Checksum created: $BACKUP_FILE.sha256"

echo "Backup process completed at $(date)"
```

### Data Sanitization for Production

Before transferring to production, sanitize sensitive data:

```sql
-- Sanitization script for production
-- Run this on staging backup before restore

-- Anonymize employee personal data
UPDATE karyawan SET 
  email = CONCAT('user', id, '@example.com'),
  telepon = CONCAT('+628', LPAD(CAST(id AS TEXT), 10, '0')),
  alamat = 'Address sanitized for production';

-- Reset user passwords to default
UPDATE "User" SET 
  passwordHash = '$2b$10$default_hash_for_production',
  updatedAt = NOW();

-- Clear sensitive audit trail entries
DELETE FROM "AuditTrail" 
WHERE action IN ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'PASSWORD_RESET')
AND createdAt < NOW() - INTERVAL '30 days';

-- Reset order statuses to safe defaults
UPDATE Pesanan SET 
  statusPesanan = 'MENUNGGU',
  updatedAt = NOW()
WHERE statusPesanan NOT IN ('MENUNGGU', 'SELESAI');
```

### Backup Verification

```bash
#!/bin/bash
# verify_backup.sh

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "Verifying backup: $BACKUP_FILE"

# Check file exists and is readable
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file does not exist"
  exit 1
fi

# Verify checksum
if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo "Verifying checksum..."
  sha256sum -c "${BACKUP_FILE}.sha256"
  if [ $? -eq 0 ]; then
    echo "Checksum verification passed"
  else
    echo "Error: Checksum verification failed"
    exit 1
  fi
fi

# Test restore to temporary database
TEMP_DB="test_restore_$(date +%s)"
echo "Creating test database: $TEMP_DB"

createdb "$TEMP_DB"
pg_restore --verbose --clean --if-exists --dbname="$TEMP_DB" "$BACKUP_FILE"

# Run basic integrity checks
psql -d "$TEMP_DB" -c "
  SELECT 
    (SELECT COUNT(*) FROM \"User\") as users,
    (SELECT COUNT(*) FROM Karyawan) as karyawan,
    (SELECT COUNT(*) FROM Pesanan) as pesanan,
    (SELECT COUNT(*) FROM \"AuditTrail\") as audit_trail;
"

# Clean up
dropdb "$TEMP_DB"
echo "Backup verification completed successfully"
```

---

## Production Environment Preparation

### Pre-Restore Checklist

- [ ] Schedule maintenance window with stakeholders
- [ ] Notify users about upcoming downtime
- [ ] Verify production database backup is current
- [ ] Test rollback procedures
- [ ] Prepare monitoring and alerting
- [ ] Document rollback plan

### Downtime Planning

```bash
# Maintenance notification script
#!/bin/bash
# notify_maintenance.sh

MAINTENANCE_START=$(date -d "+30 minutes" +%Y-%m-%dT%H:%M:%S)
MAINTENANCE_END=$(date -d "+2 hours" +%Y-%m-%dT%H:%M:%S)

echo "Sending maintenance notification..."

# Send email notification
mail -s "Maintenance Notification: Bebang Portal" ops-team@company.com << EOF
Scheduled maintenance window:
Start: $MAINTENANCE_START
End: $MAINTENANCE_END

Impact: Database migration from staging to production
Users will experience downtime during this period.

Rollback plan: Documented in deploy_database.md
EOF

# Update application status page
curl -X POST "https://status.company.com/api/maintenance" \
  -H "Content-Type: application/json" \
  -d "{
    \"service\": \"Bebang Portal\",
    \"status\": \"maintenance\",
    \"start\": \"$MAINTENANCE_START\",
    \"end\": \"$MAINTENANCE_END\",
    \"message\": \"Database migration in progress\"
  }"
```

### Production Backup (Rollback Strategy)

```bash
#!/bin/bash
# backup_production.sh

set -e

DB_HOST="prod-db.example.com"
DB_USER="prod_user"
DB_NAME="bebang_production"
BACKUP_DIR="/backups/production"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/production_rollback_$TIMESTAMP.dump"

mkdir -p "$BACKUP_DIR"

echo "Creating production backup for rollback: $BACKUP_FILE"

# Create backup
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  --format=custom --compress=9 --verbose \
  --file="$BACKUP_FILE"

# Create checksum
sha256sum "$BACKUP_FILE" > "$BACKUP_FILE.sha256"

echo "Production backup completed: $BACKUP_FILE"
echo "Keep this file for rollback if needed"
```

### Environment Configuration Sync

```bash
#!/bin/bash
# sync_env_configs.sh

STAGING_ENV="./backend/.env.staging"
PROD_ENV="./backend/.env.production"
BACKUP_ENV="./backend/.env.production.backup.$(date +%Y%m%d_%H%M%S)"

# Backup current production config
cp "$PROD_ENV" "$BACKUP_ENV"
echo "Production config backed up to: $BACKUP_ENV"

# Sync non-sensitive configurations
echo "Syncing environment configurations..."

# Extract database URL patterns (without credentials)
grep "DATABASE_URL=" "$STAGING_ENV" | sed 's/=.*/=PRODUCTION_DB_URL/' > temp_db_url
grep -v "DATABASE_URL=" "$PROD_ENV" > temp_prod_env
cat temp_db_url temp_prod_env > "$PROD_ENV"
rm temp_db_url temp_prod_env

echo "Environment configuration synced"
echo "Remember to update DATABASE_URL with production credentials"
```

---

## Database Migration & Restore Process

### Step-by-Step Restore Procedure

#### Step 1: Prepare Production Environment

```bash
#!/bin/bash
# prepare_production.sh

echo "Preparing production environment for restore..."

# Stop application services
systemctl stop bebang-portal-backend
systemctl stop bebang-portal-frontend

# Verify no active connections
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  SELECT pid, state, query 
  FROM pg_stat_activity 
  WHERE datname = 'bebang_production' AND state = 'active';
"

# Drop existing database (with confirmation)
echo "WARNING: This will drop the existing production database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
  dropdb -h prod-db.example.com -U prod_user bebang_production
  echo "Production database dropped"
else
  echo "Restore cancelled"
  exit 1
fi
```

#### Step 2: Create Fresh Database

```bash
#!/bin/bash
# create_fresh_database.sh

echo "Creating fresh production database..."

# Create new database
createdb -h prod-db.example.com -U prod_user bebang_production

# Apply extensions
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
  CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";
"

echo "Fresh database created successfully"
```

#### Step 3: Restore from Backup

```bash
#!/bin/bash
# restore_from_backup.sh

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "Restoring from backup: $BACKUP_FILE"

# Restore database
pg_restore --verbose --clean --if-exists \
  --dbname=postgresql://prod_user@prod-db.example.com:5432/bebang_production \
  "$BACKUP_FILE"

echo "Database restore completed"
```

#### Step 4: Run Prisma Migrations

```bash
#!/bin/bash
# run_migrations.sh

cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
npx prisma validate

echo "Prisma migrations completed successfully"
```

#### Step 5: Data Integrity Checks

```bash
#!/bin/bash
# integrity_checks.sh

echo "Running data integrity checks..."

# Check table counts
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
  FROM pg_stat_user_tables 
  ORDER BY schemaname, tablename;
"

# Check foreign key constraints
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
  FROM information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY';
"

# Verify critical data exists
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  SELECT 
    (SELECT COUNT(*) FROM \"User\") as total_users,
    (SELECT COUNT(*) FROM Karyawan) as total_employees,
    (SELECT COUNT(*) FROM Pesanan) as total_orders,
    (SELECT COUNT(*) FROM Department) as total_departments;
"

echo "Data integrity checks completed"
```

#### Step 6: Performance Optimization

```bash
#!/bin/bash
# optimize_performance.sh

echo "Optimizing database performance..."

# Update table statistics
psql -h prod-db.example.com -U prod_user -d bebang_production -c "ANALYZE;"

# Rebuild indexes
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  REINDEX DATABASE bebang_production;
"

# Vacuum and analyze
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  VACUUM (ANALYZE, VERBOSE);
"

# Check query performance
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
  FROM pg_stat_statements 
  ORDER BY total_time DESC 
  LIMIT 10;
"

echo "Performance optimization completed"
```

#### Step 7: Start Application Services

```bash
#!/bin/bash
# start_services.sh

echo "Starting application services..."

# Start backend
systemctl start bebang-portal-backend
sleep 10

# Start frontend
systemctl start bebang-portal-frontend
sleep 5

# Check service status
systemctl status bebang-portal-backend
systemctl status bebang-portal-frontend

# Verify application health
curl -f http://localhost:3000/api/health || {
  echo "Backend health check failed"
  exit 1
}

echo "Application services started successfully"
```

---

## Automation & Scripts

### PowerShell Scripts for Windows

#### Backup Script (PowerShell)

```powershell
# backup_staging.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupPath
)

# Configuration
$DbHost = "staging-db.example.com"
$DbUser = "staging_user"
$DbName = "bebang_staging"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupPath\staging_backup_$Timestamp.dump"

# Create backup directory
New-Item -ItemType Directory -Force -Path $BackupPath

Write-Host "Starting backup at $(Get-Date)"

# Create database backup
$env:PGPASSWORD = "staging_password"
& pg_dump -h $DbHost -U $DbUser -d $DbName --format=custom --compress=9 --verbose --file=$BackupFile

if (Test-Path $BackupFile) {
    Write-Host "Backup completed successfully: $BackupFile"
    $BackupSize = (Get-Item $BackupFile).Length / 1MB
    Write-Host "Backup size: $([math]::Round($BackupSize, 2)) MB"
    
    # Create checksum
    $Checksum = Get-FileHash -Path $BackupFile -Algorithm SHA256
    $Checksum.Hash | Out-File "$BackupFile.sha256"
    Write-Host "Checksum created: $BackupFile.sha256"
} else {
    Write-Error "Backup failed!"
    exit 1
}

Write-Host "Backup process completed at $(Get-Date)"
```

#### Restore Script (PowerShell)

```powershell
# restore_production.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

# Configuration
$DbHost = "prod-db.example.com"
$DbUser = "prod_user"
$DbName = "bebang_production"

Write-Host "Starting restore from backup: $BackupFile"

# Verify backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file does not exist: $BackupFile"
    exit 1
}

# Stop services
Write-Host "Stopping application services..."
Stop-Service -Name "bebang-portal-backend" -Force
Stop-Service -Name "bebang-portal-frontend" -Force

# Drop existing database
Write-Host "Dropping existing database..."
$env:PGPASSWORD = "prod_password"
& dropdb -h $DbHost -U $DbUser $DbName

# Create new database
Write-Host "Creating fresh database..."
& createdb -h $DbHost -U $DbUser $DbName

# Restore from backup
Write-Host "Restoring database..."
& pg_restore --verbose --clean --if-exists --dbname="postgresql://$DbUser@$DbHost`:5432/$DbName $BackupFile

# Start services
Write-Host "Starting application services..."
Start-Service -Name "bebang-portal-backend"
Start-Sleep -Seconds 10
Start-Service -Name "bebang-portal-frontend"

# Verify health
Write-Host "Verifying application health..."
try {
    $Response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 30
    if ($Response.StatusCode -eq 200) {
        Write-Host "Application is healthy"
    } else {
        Write-Warning "Application health check returned status code: $($Response.StatusCode)"
    }
} catch {
    Write-Error "Application health check failed: $($_.Exception.Message)"
}

Write-Host "Restore process completed at $(Get-Date)"
```

### Bash Scripts for Linux

#### Automated Backup Script

```bash
#!/bin/bash
# automated_backup.sh

# Configuration
BACKUP_DIR="/backups/automated"
RETENTION_DAYS=30
DB_HOST="staging-db.example.com"
DB_USER="staging_user"
DB_NAME="bebang_staging"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/staging_auto_$TIMESTAMP.dump"
LOG_FILE="/var/log/db_backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting automated backup"

# Create backup
export PGPASSWORD="staging_password"
if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  --format=custom --compress=9 --verbose \
  --file="$BACKUP_FILE" 2>> "$LOG_FILE"; then
    
    log "Backup completed successfully: $BACKUP_FILE"
    
    # Create checksum
    sha256sum "$BACKUP_FILE" > "$BACKUP_FILE.sha256"
    log "Checksum created: $BACKUP_FILE.sha256"
    
    # Clean old backups
    find "$BACKUP_DIR" -name "staging_auto_*.dump" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "staging_auto_*.sha256" -mtime +$RETENTION_DAYS -delete
    log "Cleaned backups older than $RETENTION_DAYS days"
    
else
    log "ERROR: Backup failed!"
    exit 1
fi

log "Automated backup completed"
```

#### Backup Scheduling (Cron)

```bash
# Add to crontab with: crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/scripts/automated_backup.sh

# Weekly integrity check on Sundays at 3 AM
0 3 * * 0 /opt/scripts/verify_backup.sh /backups/automated/staging_auto_$(date -d 'yesterday' +%Y%m%d)_*.dump

# Monthly cleanup on 1st at 4 AM
0 4 1 * * /opt/scripts/cleanup_old_backups.sh
```

### Monitoring and Alerting

```bash
#!/bin/bash
# monitor_database.sh

# Configuration
DB_HOST="prod-db.example.com"
DB_USER="prod_user"
DB_NAME="bebang_production"
ALERT_EMAIL="ops-team@company.com"
LOG_FILE="/var/log/db_monitor.log"

# Thresholds
CONNECTION_THRESHOLD=100
DISK_USAGE_THRESHOLD=80
SLOW_QUERY_THRESHOLD=1000

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check database connections
check_connections() {
    local connections=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
    ")
    
    if [ "$connections" -gt "$CONNECTION_THRESHOLD" ]; then
        log "WARNING: High connection count: $connections"
        echo "Database connection count is high: $connections" | mail -s "DB Alert: High Connections" "$ALERT_EMAIL"
    fi
}

# Check disk usage
check_disk_usage() {
    local disk_usage=$(df /var/lib/postgresql | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt "$DISK_USAGE_THRESHOLD" ]; then
        log "WARNING: High disk usage: $disk_usage%"
        echo "Database disk usage is high: $disk_usage%" | mail -s "DB Alert: High Disk Usage" "$ALERT_EMAIL"
    fi
}

# Check slow queries
check_slow_queries() {
    local slow_queries=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) FROM pg_stat_statements WHERE mean_time > $SLOW_QUERY_THRESHOLD;
    ")
    
    if [ "$slow_queries" -gt 0 ]; then
        log "WARNING: Found $slow_queries slow queries"
        echo "Database has $slow_queries slow queries" | mail -s "DB Alert: Slow Queries" "$ALERT_EMAIL"
    fi
}

# Run checks
log "Starting database monitoring"
check_connections
check_disk_usage
check_slow_queries
log "Database monitoring completed"
```

---

## Troubleshooting & Recovery

### Common Issues and Solutions

#### Issue 1: Connection Timeout During Restore

**Symptoms**: Restore process hangs or times out
**Causes**: Network issues, large backup file, insufficient resources

**Solutions**:
```bash
# Increase timeout and use compression
pg_restore --verbose --clean --if-exists \
  --dbname=postgresql://prod_user@prod-db.example.com:5432/bebang_production \
  --no-owner --no-privileges \
  --jobs=4 \
  "$BACKUP_FILE"

# Or restore in parts
pg_restore --list "$BACKUP_FILE" | grep -v "AuditTrail" > restore_list.txt
pg_restore --use-list=restore_list.txt --dbname=bebang_production "$BACKUP_FILE"
```

#### Issue 2: Foreign Key Constraint Violations

**Symptoms**: Restore fails with constraint violation errors
**Causes**: Data inconsistency, wrong restore order

**Solutions**:
```bash
# Disable constraints during restore
pg_restore --verbose --clean --if-exists \
  --dbname=postgresql://prod_user@prod-db.example.com:5432/bebang_production \
  --no-owner --no-privileges \
  --disable-triggers \
  "$BACKUP_FILE"

# Re-enable constraints after restore
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  ALTER TABLE Pesanan ENABLE TRIGGER ALL;
  ALTER TABLE Karyawan ENABLE TRIGGER ALL;
"
```

#### Issue 3: Insufficient Disk Space

**Symptoms**: Restore fails with "No space left on device"
**Causes**: Large backup file, insufficient disk space

**Solutions**:
```bash
# Check available space
df -h

# Clean up before restore
# Remove old backups
find /backups -name "*.dump" -mtime +7 -delete

# Use compressed restore
gunzip -c "$BACKUP_FILE.gz" | pg_restore --verbose --clean --if-exists \
  --dbname=postgresql://prod_user@prod-db.example.com:5432/bebang_production
```

#### Issue 4: Performance Degradation After Restore

**Symptoms**: Slow queries, high CPU usage
**Causes**: Missing indexes, outdated statistics

**Solutions**:
```bash
# Rebuild all indexes
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  REINDEX DATABASE bebang_production;
"

# Update statistics
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  ANALYZE;
"

# Check query performance
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  EXPLAIN ANALYZE SELECT * FROM Pesanan WHERE createdAt > NOW() - INTERVAL '7 days';
"
```

### Rollback Procedures

#### Emergency Rollback Script

```bash
#!/bin/bash
# emergency_rollback.sh

ROLLBACK_FILE="$1"

if [ -z "$ROLLBACK_FILE" ]; then
  echo "Usage: $0 <rollback_backup_file>"
  exit 1
fi

echo "EMERGENCY ROLLBACK INITIATED"
echo "Rollback file: $ROLLBACK_FILE"
echo "Timestamp: $(date)"

# Stop services
systemctl stop bebang-portal-backend
systemctl stop bebang-portal-frontend

# Drop current database
dropdb -h prod-db.example.com -U prod_user bebang_production

# Create fresh database
createdb -h prod-db.example.com -U prod_user bebang_production

# Restore from rollback backup
pg_restore --verbose --clean --if-exists \
  --dbname=postgresql://prod_user@prod-db.example.com:5432/bebang_production \
  "$ROLLBACK_FILE"

# Start services
systemctl start bebang-portal-backend
sleep 10
systemctl start bebang-portal-frontend

# Verify health
if curl -f http://localhost:3000/api/health; then
  echo "EMERGENCY ROLLBACK COMPLETED SUCCESSFULLY"
else
  echo "WARNING: Rollback completed but health check failed"
fi

echo "Rollback completed at: $(date)"
```

### Data Corruption Recovery

#### Identify Corruption

```bash
#!/bin/bash
# check_corruption.sh

echo "Checking for database corruption..."

# Check for invalid indexes
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  SELECT schemaname, tablename, indexname 
  FROM pg_indexes 
  WHERE indexname NOT IN (
    SELECT indexname FROM pg_stat_user_indexes
  );
"

# Check for data corruption
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  SELECT schemaname, tablename, attname, n_distinct, correlation 
  FROM pg_stats 
  WHERE n_distinct < 0;
"

# Verify table integrity
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup
  FROM pg_stat_user_tables
  WHERE n_dead_tup > n_live_tup;
"
```

#### Repair Corruption

```bash
#!/bin/bash
# repair_corruption.sh

echo "Attempting to repair database corruption..."

# Rebuild corrupted tables
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  VACUUM FULL Pesanan;
  VACUUM FULL Karyawan;
  VACUUM FULL \"User\";
"

# Reindex all tables
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  REINDEX DATABASE bebang_production;
"

# Verify repair
psql -h prod-db.example.com -U prod_user -d bebang_production -c "
  SELECT 
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup
  FROM pg_stat_user_tables
  ORDER BY n_dead_tup DESC;
"

echo "Corruption repair completed"
```

---

## Best Practices & Security

### Data Privacy and GDPR Compliance

#### Data Anonymization

```sql
-- GDPR-compliant data anonymization
CREATE OR REPLACE FUNCTION anonymize_employee_data()
RETURNS void AS $$
BEGIN
  -- Anonymize personal identifiers
  UPDATE Karyawan SET
    email = CONCAT('user', id, '@anonymized.com'),
    telepon = CONCAT('+628000000', LPAD(CAST(id AS TEXT), 6, '0')),
    alamat = 'Anonymized address',
    updatedAt = NOW()
  WHERE email NOT LIKE '%@anonymized.com';
  
  -- Clear sensitive audit entries
  UPDATE "AuditTrail" SET
    details = 'Anonymized for privacy',
    updatedAt = NOW()
  WHERE action IN ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'PASSWORD_RESET')
  AND createdAt < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Employee data anonymization completed';
END;
$$ LANGUAGE plpgsql;

-- Schedule regular anonymization
SELECT cron.schedule('anonymize-data', '0 2 * * 0', 'SELECT anonymize_employee_data();');
```

#### Data Retention Policy

```sql
-- Implement data retention
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Archive old orders
  DELETE FROM Pesanan 
  WHERE statusPesanan = 'SELESAI' 
  AND createdAt < NOW() - INTERVAL '2 years';
  
  -- Clean old audit trails
  DELETE FROM "AuditTrail" 
  WHERE createdAt < NOW() - INTERVAL '1 year';
  
  -- Remove inactive users
  DELETE FROM "User" 
  WHERE lastLoginAt < NOW() - INTERVAL '1 year'
  AND id NOT IN (SELECT userId FROM Karyawan WHERE isActive = true);
  
  RAISE NOTICE 'Data cleanup completed';
END;
$$ LANGUAGE plpgsql;
```

### Encryption in Transit and At Rest

#### SSL Configuration

```bash
# Configure PostgreSQL for SSL
# Add to postgresql.conf
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
ssl_ca_file = '/etc/ssl/certs/ca.crt'

# Require SSL connections
# Add to pg_hba.conf
hostssl all all 0.0.0.0/0 md5
```

#### Database Encryption

```sql
-- Enable transparent data encryption (if supported)
-- This requires PostgreSQL 15+ with TDE extension
CREATE EXTENSION IF NOT EXISTS pg_tde;

-- Encrypt sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Example of encrypting sensitive data
CREATE TABLE encrypted_data (
  id SERIAL PRIMARY KEY,
  encrypted_email BYTEA,
  encrypted_phone BYTEA
);

-- Encryption function
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(data, 'encryption_key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Access Control and Auditing

#### Role-Based Access Control

```sql
-- Create specific roles for different access levels
CREATE ROLE db_readonly;
CREATE ROLE db_readwrite;
CREATE ROLE db_admin;

-- Grant permissions to roles
GRANT CONNECT ON DATABASE bebang_production TO db_readonly;
GRANT USAGE ON SCHEMA public TO db_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO db_readonly;

GRANT CONNECT ON DATABASE bebang_production TO db_readwrite;
GRANT USAGE ON SCHEMA public TO db_readwrite;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO db_readwrite;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO db_readwrite;

-- Create application users
CREATE USER app_readonly WITH PASSWORD 'secure_readonly_pass';
CREATE USER app_readwrite WITH PASSWORD 'secure_readwrite_pass';

-- Assign roles to users
GRANT db_readonly TO app_readonly;
GRANT db_readwrite TO app_readwrite;
```

#### Enhanced Auditing

```sql
-- Create comprehensive audit trigger
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "AuditTrail" (
    action,
    tableName,
    recordId,
    oldValues,
    newValues,
    userId,
    createdAt
  ) VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    current_setting('app.current_user_id')::INTEGER,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_karyawan_trigger
  AFTER INSERT OR UPDATE OR DELETE ON Karyawan
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_pesanan_trigger
  AFTER INSERT OR UPDATE OR DELETE ON Pesanan
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Disaster Recovery Planning

#### Recovery Time Objective (RTO) and Recovery Point Objective (RPO)

```yaml
# disaster_recovery_plan.yml
disaster_recovery:
  rto:
    critical: 15 minutes  # Maximum acceptable downtime
    important: 1 hour
    normal: 4 hours
  
  rpo:
    critical: 5 minutes   # Maximum data loss
    important: 15 minutes
    normal: 1 hour
  
  backup_strategy:
    continuous:
      - WAL archiving to S3
      - Real-time replication to standby
    daily:
      - Full backup at 2 AM
      - Verification at 3 AM
    weekly:
      - Full backup to offsite storage
      - Restore testing on staging
  
  escalation:
    level_1:
      - Database administrator
      - DevOps engineer
    level_2:
      - Engineering manager
      - CTO
    level_3:
      - CEO
      - PR team
```

#### Automated Recovery Testing

```bash
#!/bin/bash
# disaster_recovery_test.sh

# Configuration
TEST_DB="bebang_disaster_test"
BACKUP_FILE="/backups/production/latest_backup.dump"
REPORT_FILE="/var/log/disaster_recovery_test.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$REPORT_FILE"
}

log "Starting disaster recovery test"

# Create test database
dropdb "$TEST_DB" 2>/dev/null || true
createdb "$TEST_DB"

# Restore from backup
log "Restoring from backup: $BACKUP_FILE"
if pg_restore --verbose --clean --if-exists --dbname="$TEST_DB" "$BACKUP_FILE" >> "$REPORT_FILE" 2>&1; then
    log "Backup restore successful"
else
    log "ERROR: Backup restore failed"
    exit 1
fi

# Run application tests against restored database
log "Running application tests"
cd /opt/bebang-portal
if npm run test:e2e -- --env=test >> "$REPORT_FILE" 2>&1; then
    log "Application tests passed"
else
    log "WARNING: Some application tests failed"
fi

# Performance tests
log "Running performance tests"
if npm run test:performance >> "$REPORT_FILE" 2>&1; then
    log "Performance tests passed"
else
    log "WARNING: Performance tests failed"
fi

# Cleanup
dropdb "$TEST_DB"

log "Disaster recovery test completed successfully"
```

### Monitoring and Alerting Best Practices

#### Database Health Monitoring

```bash
#!/bin/bash
# comprehensive_db_monitoring.sh

# Configuration
DB_HOST="prod-db.example.com"
DB_USER="prod_user"
DB_NAME="bebang_production"
ALERT_EMAIL="ops-team@company.com"
SLACK_WEBHOOK="https://hooks.slack.com/services/..."

# Metrics collection
collect_metrics() {
    local timestamp=$(date +%s)
    
    # Connection metrics
    local connections=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
    ")
    
    # Database size
    local db_size=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT pg_size_pretty(pg_database_size('$DB_NAME'));
    ")
    
    # Transaction rate
    local tps=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT xact_commit + xact_rollback FROM pg_stat_database WHERE datname = '$DB_NAME';
    ")
    
    # Send to monitoring system
    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-type: application/json' \
      --data "{
        \"text\": \"Database Metrics - $(date)\",
        \"attachments\": [{
          \"color\": \"good\",
          \"fields\": [
            {\"title\": \"Active Connections\", \"value\": \"$connections\", \"short\": true},
            {\"title\": \"Database Size\", \"value\": \"$db_size\", \"short\": true},
            {\"title\": \"Transactions/sec\", \"value\": \"$tps\", \"short\": true}
          ]
        }]
      }"
}

# Health checks
health_check() {
    # Check database connectivity
    if ! psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "Database connectivity failed" | mail -s "CRITICAL: Database Down" "$ALERT_EMAIL"
        return 1
    fi
    
    # Check replication lag (if using replication)
    local replication_lag=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag;
    ")
    
    if [ "$replication_lag" -gt 300 ]; then
        echo "Replication lag: ${replication_lag}s" | mail -s "WARNING: High Replication Lag" "$ALERT_EMAIL"
    fi
    
    return 0
}

# Main execution
collect_metrics
health_check
```

---

## Quick Reference Checklist

### Pre-Migration Checklist

- [ ] Schedule maintenance window
- [ ] Notify all stakeholders
- [ ] Create production backup
- [ ] Verify backup integrity
- [ ] Test restore on staging
- [ ] Prepare rollback plan
- [ ] Document migration steps

### Migration Day Checklist

- [ ] Stop application services
- [ ] Create final production backup
- [ ] Drop existing production database
- [ ] Create fresh database
- [ ] Restore from staging backup
- [ ] Run Prisma migrations
- [ ] Verify data integrity
- [ ] Optimize performance
- [ ] Start application services
- [ ] Verify application health
- [ ] Monitor system performance

### Post-Migration Checklist

- [ ] Monitor for 24 hours
- [ ] Verify all functionality
- [ ] Check performance metrics
- [ ] Review audit logs
- [ ] Document any issues
- [ ] Update documentation
- [ ] Schedule follow-up review

### Emergency Rollback Checklist

- [ ] Identify rollback point
- [ ] Stop application services
- [ ] Drop current database
- [ ] Restore from rollback backup
- [ ] Start application services
- [ ] Verify functionality
- [ ] Notify stakeholders
- [ ] Document rollback reasons

---

## Conclusion

Database migration from staging to production is a critical operation that requires careful planning, execution, and verification. This comprehensive guide provides:

1. **Structured approach** to database management
2. **Automated scripts** for backup and restore operations
3. **Security best practices** for data protection
4. **Troubleshooting procedures** for common issues
5. **Monitoring and alerting** for proactive management

Always test procedures in a non-production environment before applying them to production. Maintain regular backups and document any deviations from standard procedures.

For additional support or questions, refer to the project documentation or contact the database administration team.