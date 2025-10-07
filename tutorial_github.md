# Tutorial GitHub - Bebang Pack Meal Portal

Tutorial lengkap untuk mengelola proyek Bebang Pack Meal Portal di GitHub, mulai dari setup repository hingga collaboration workflow untuk tim pengembang.

## Daftar Isi

1. [Persiapan Awal](#persiapan-awal)
2. [Setup Repository Baru](#setup-repository-baru)
3. [Clone dan Setup Lokal](#clone-dan-setup-lokal)
4. [Workflow Development](#workflow-development)
5. [Branch Management](#branch-management)
6. [Commit Best Practices](#commit-best-practices)
7. [Collaboration Workflow](#collaboration-workflow)
8. [CI/CD Integration](#cicd-integration)
9. [Release Management](#release-management)
10. [Troubleshooting](#troubleshooting)

## Persiapan Awal

### Prasyarat
- Git terinstall di sistem (minimal versi 2.30)
- Akun GitHub aktif
- Node.js 18+ terinstall
- PostgreSQL 14+ untuk database
- VS Code atau IDE pilihan

### Konfigurasi Git Global
```bash
# Setup identitas global
git config --global user.name "Nama Anda"
git config --global user.email "email@example.com"

# Setup default branch name
git config --global init.defaultBranch main

# Setup credential helper (Windows)
git config --global credential.helper manager-core

# Setup line ending (Windows)
git config --global core.autocrlf true
```

## Setup Repository Baru

### 1. Membuat Repository di GitHub

1. Login ke GitHub dan klik "New repository"
2. Isi detail repository:
   ```
   Repository name: bebang-pack-meal-portal
   Description: Portal operasional untuk mengelola alur pack meal end-to-end
   Public/Private: Sesuai kebutuhan
   ✓ Add a README file
   ✓ Add .gitignore (Node template)
   License: MIT License (opsional)
   ```

### 2. Setup Repository Lokal

```bash
# Clone repository baru
git clone https://github.com/username/bebang-pack-meal-portal.git
cd bebang-pack-meal-portal

# Atau jika proyek sudah ada lokal, setup remote
git init
git remote add origin https://github.com/username/bebang-pack-meal-portal.git
```

### 3. Initial Project Setup

```bash
# Copy proyek yang sudah ada ke repository
# Struktur direktori:
# bebang-pack-meal-portal/
# ├── backend/
# ├── frontend/
# ├── docs/
# ├── scripts/
# ├── tests/
# ├── package.json
# ├── README.md
# └── .gitignore

# Tambahkan file .gitignore yang komprehensif
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*.tsbuildinfo

# Database
*.sqlite
*.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary files
temp/
tmp/
*.tmp

# Backup files
backups/
*.backup

# PWA files
sw.js
workbox-*.js
EOF
```

## Clone dan Setup Lokal

### 1. Clone Repository

```bash
# Clone dengan HTTPS
git clone https://github.com/username/bebang-pack-meal-portal.git

# Atau dengan SSH (setelah setup SSH key)
git clone git@github.com:username/bebang-pack-meal-portal.git

cd bebang-pack-meal-portal
```

### 2. Setup Environment

```bash
# Install dependencies untuk semua workspace
npm run install:all

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit file .env sesuai konfigurasi lokal
# Backend (.env):
DATABASE_URL="postgresql://username:password@localhost:5432/bebang_pack_meal"
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:5173"

# Frontend (.env):
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_WS_URL="http://localhost:3001"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run -w backend prisma:generate

# Run migrations
npm run -w backend prisma:migrate

# Seed database
npm run -w backend prisma:seed

# Verify setup
npm run dev
```

## Workflow Development

### 1. Branching Strategy (Git Flow)

```bash
# Branch utama
main          # Production-ready code
develop       # Integration branch untuk development
hotfix/*      # Perbaikan urgent untuk production
release/*     # Persiapan release
feature/*     # Pengembangan fitur baru
bugfix/*      # Perbaikan bug pada develop
```

### 2. Setup Branch Develop

```bash
# Buat dan checkout branch develop
git checkout -b develop
git push -u origin develop

# Set develop sebagai default branch untuk development
git branch --set-upstream-to=origin/develop develop
```

### 3. Daily Development Workflow

```bash
# Mulai hari dengan update develop
git checkout develop
git pull origin develop

# Buat feature branch
git checkout -b feature/user-management
git push -u origin feature/user-management

# Development cycle
# ... coding ...
git add .
git commit -m "feat: add user management API endpoints"
git push origin feature/user-management

# Update dari develop secara berkala
git checkout develop
git pull origin develop
git checkout feature/user-management
git merge develop
```

## Branch Management

### 1. Naming Convention

```bash
# Feature branches
feature/order-management
feature/real-time-notifications
feature/admin-dashboard

# Bugfix branches
bugfix/login-validation
bugfix/api-response-format

# Release branches
release/v1.0.0
release/v1.1.0

# Hotfix branches
hotfix/security-vulnerability
hotfix/critical-bug-fix
```

### 2. Branch Commands

```bash
# Lihat semua branch
git branch -a

# Buat dan checkout branch baru
git checkout -b feature/new-feature

# Pindah branch
git checkout develop

# Hapus branch lokal
git branch -d feature/completed-feature

# Hapus branch remote
git push origin --delete feature/completed-feature

# Update list branch remote
git remote prune origin
```

### 3. Merge Strategies

```bash
# Merge dengan commit message
git checkout develop
git merge feature/user-management --no-ff -m "Merge feature: user management"

# Rebase feature branch (untuk clean history)
git checkout feature/user-management
git rebase develop

# Squash commits sebelum merge
git checkout develop
git merge feature/user-management --squash
git commit -m "feat: implement user management system"
```

## Commit Best Practices

### 1. Conventional Commits

```bash
# Format: <type>(<scope>): <description>

# Types:
feat      # New feature
fix       # Bug fix
docs      # Documentation changes
style     # Code style changes (formatting, etc.)
refactor  # Code refactoring
test      # Adding or updating tests
chore     # Maintenance tasks
perf      # Performance improvements
ci        # CI/CD changes
build     # Build system changes

# Examples:
git commit -m "feat(auth): implement JWT authentication"
git commit -m "fix(api): resolve order status update issue"
git commit -m "docs: update API documentation"
git commit -m "test(orders): add unit tests for order service"
git commit -m "chore(deps): update dependencies to latest version"
```

### 2. Commit Guidelines

```bash
# Good commit practices:

# Atomic commits (satu perubahan per commit)
git add backend/src/auth/
git commit -m "feat(auth): add JWT authentication service"

git add frontend/src/components/LoginForm.tsx
git commit -m "feat(ui): add login form component"

# Descriptive commit messages
git commit -m "fix(orders): resolve race condition in order status updates

- Add proper locking mechanism for order updates
- Prevent duplicate status change notifications
- Add unit tests for concurrent order modifications

Fixes #123"
```

### 3. Pre-commit Hooks

```bash
# Setup Husky (sudah dikonfigurasi di proyek)
npm run prepare

# Pre-commit hooks akan menjalankan:
# - ESLint untuk code quality
# - Prettier untuk code formatting
# - TypeScript type checking
# - Unit tests (opsional)

# Manual run pre-commit checks
npm run lint
npm run format
npm run typecheck
npm test
```

## Collaboration Workflow

### 1. Pull Request (PR) Workflow

```bash
# 1. Buat feature branch
git checkout -b feature/reporting-dashboard
git push -u origin feature/reporting-dashboard

# 2. Development dan commits
# ... coding ...
git add .
git commit -m "feat(reports): add consumption report API"
git push origin feature/reporting-dashboard

# 3. Buat Pull Request di GitHub
# - Pilih base branch: develop
# - Tambahkan deskripsi yang jelas
# - Assign reviewers
# - Link related issues
```

### 2. PR Template

```markdown
## Deskripsi Perubahan
Brief description of changes made.

## Jenis Perubahan
- [ ] Bug fix (non-breaking change yang memperbaiki issue)
- [ ] New feature (non-breaking change yang menambah functionality)
- [ ] Breaking change (fix atau feature yang menyebabkan existing functionality berubah)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project coding standards
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements in production code

## Screenshots (jika ada perubahan UI)
Add screenshots here.

## Related Issues
Closes #123
```

### 3. Code Review Guidelines

```bash
# Reviewer checklist:
# ✓ Code quality dan readability
# ✓ Security considerations
# ✓ Performance implications
# ✓ Test coverage
# ✓ Documentation completeness
# ✓ Breaking changes identified

# Review commands:
git checkout feature/reporting-dashboard
git pull origin feature/reporting-dashboard

# Test changes locally
npm run dev
npm test
npm run e2e

# Approve atau request changes
# Merge setelah approval (gunakan "Squash and merge")
```

### 4. Conflict Resolution

```bash
# Ketika ada conflict saat merge
git checkout feature/my-feature
git pull origin develop

# Resolve conflicts manually, kemudian:
git add .
git commit -m "resolve: merge conflicts with develop"
git push origin feature/my-feature

# Atau gunakan rebase untuk cleaner history
git rebase develop
# Resolve conflicts
git rebase --continue
git push --force-with-lease origin feature/my-feature
```

## CI/CD Integration

### 1. GitHub Actions Setup

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: bebang_pack_meal_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint backend
      run: npm run -w backend lint
    
    - name: Lint frontend
      run: npm run -w frontend lint
    
    - name: Type check
      run: npm run typecheck
    
    - name: Test backend
      run: npm run -w backend test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bebang_pack_meal_test
    
    - name: Test frontend
      run: npm run -w frontend test
    
    - name: E2E tests
      run: npm run test:e2e
    
    - name: Build
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: echo "Deploy to production server"
```

### 2. Environment Protection Rules

```bash
# Setup di GitHub repository settings:
# 1. Go to Settings > Environments
# 2. Create environments: development, staging, production
# 3. Add protection rules:
#    - Required reviewers for production
#    - Deployment branches (main untuk production)
#    - Environment secrets untuk masing-masing environment
```

### 3. Automated Testing

```bash
# Package.json scripts untuk CI
{
  "scripts": {
    "test:ci": "npm run -w backend test && npm run -w frontend test",
    "test:e2e:ci": "npm run test:e2e:headed",
    "lint:ci": "npm run -w backend lint && npm run -w frontend lint",
    "build:ci": "npm run build",
    "typecheck:ci": "npm run typecheck"
  }
}
```

## Release Management

### 1. Semantic Versioning

```bash
# Version format: MAJOR.MINOR.PATCH
# 1.0.0 → 1.0.1 (patch: bug fixes)
# 1.0.1 → 1.1.0 (minor: new features, backward compatible)
# 1.1.0 → 2.0.0 (major: breaking changes)

# Update version
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.1 → 1.1.0
npm version major   # 1.1.0 → 2.0.0
```

### 2. Release Workflow

```bash
# 1. Create release branch dari develop
git checkout develop
git pull origin develop
git checkout -b release/v1.1.0

# 2. Update version dan changelog
npm version minor
# Edit CHANGELOG.md

# 3. Commit release preparation
git add .
git commit -m "chore(release): prepare v1.1.0"
git push origin release/v1.1.0

# 4. Create PR ke main
# 5. After merge, create GitHub release
git checkout main
git pull origin main
git tag v1.1.0
git push origin v1.1.0

# 6. Merge back ke develop
git checkout develop
git merge main
git push origin develop
```

### 3. Changelog Management

```markdown
# CHANGELOG.md format

# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2024-01-15

### Added
- Real-time notifications untuk order status changes
- Admin dashboard dengan analytics
- Export laporan ke CSV dan PDF

### Changed
- Improved UI responsiveness untuk mobile devices
- Updated authentication flow dengan refresh tokens

### Fixed
- Fixed order status race condition
- Resolved WebSocket connection issues

### Security
- Updated dependencies untuk security patches

## [1.0.0] - 2024-01-01

### Added
- Initial release dengan basic functionality
- User authentication dan authorization
- Order management system
- Master data management
```

### 4. GitHub Releases

```bash
# Create release di GitHub:
# 1. Go to Releases tab
# 2. Click "Create a new release"
# 3. Tag version: v1.1.0
# 4. Release title: "Bebang Pack Meal Portal v1.1.0"
# 5. Description: Copy dari CHANGELOG.md
# 6. Attach binaries jika ada
# 7. Set as latest release
```

## Troubleshooting

### 1. Common Git Issues

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo specific file changes
git checkout -- filename

# Fix commit message
git commit --amend -m "fix: corrected commit message"

# Stash changes temporarily
git stash
git checkout other-branch
git stash pop

# Resolve "detached HEAD" state
git checkout main
git branch -D temp-branch
```

### 2. Authentication Issues

```bash
# Setup SSH key (recommended)
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add ke GitHub SSH keys

# Test SSH connection
ssh -T git@github.com

# Switch remote dari HTTPS ke SSH
git remote set-url origin git@github.com:username/bebang-pack-meal-portal.git

# Personal Access Token untuk HTTPS
# Generate di GitHub Settings > Developer settings > Personal access tokens
git config --global credential.helper store
```

### 3. Large File Issues

```bash
# Setup Git LFS untuk file besar
git lfs install
git lfs track "*.zip"
git lfs track "*.tar.gz"
git lfs track "*.sql"

# Add .gitattributes
git add .gitattributes
git commit -m "chore: setup Git LFS"

# Remove large files dari history
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/large/file' --prune-empty --tag-name-filter cat -- --all
```

### 4. Merge Conflicts

```bash
# Merge conflict resolution steps:
# 1. Git akan mark conflict files
git status

# 2. Edit files untuk resolve conflicts
# Look for: <<<<<<< HEAD, =======, >>>>>>> branch-name

# 3. Mark as resolved
git add resolved-file.js

# 4. Complete merge
git commit -m "resolve: merge conflicts between feature and develop"

# Prevention strategies:
# - Regular rebase dari develop
# - Communicate dengan tim untuk avoid overlapping changes
# - Use feature flags untuk incomplete features
```

### 5. Performance Optimization

```bash
# Clean up repository
git gc --aggressive --prune=now

# Remove remote tracking branches yang sudah deleted
git remote prune origin

# Shallow clone untuk faster downloads
git clone --depth 1 https://github.com/username/bebang-pack-meal-portal.git

# Sparse checkout untuk large repositories
git config core.sparseCheckout true
echo "backend/*" > .git/info/sparse-checkout
git read-tree -m -u HEAD
```

## Best Practices Summary

### 1. Development Workflow
- ✅ Selalu buat feature branch dari develop
- ✅ Commit message mengikuti conventional commits
- ✅ Regular rebase dari develop
- ✅ PR review mandatory sebelum merge
- ✅ Automated testing di CI/CD
- ✅ Code coverage minimum 80%

### 2. Repository Management
- ✅ Clear branch naming convention
- ✅ Protected main branch
- ✅ Required status checks
- ✅ Automated dependency updates
- ✅ Security scanning enabled
- ✅ Issue templates dan PR templates

### 3. Security
- ✅ Environment variables tidak di-commit
- ✅ API keys di GitHub secrets
- ✅ Dependabot alerts enabled
- ✅ Code scanning enabled
- ✅ Branch protection rules
- ✅ Signed commits (opsional)

### 4. Documentation
- ✅ README.md yang comprehensive
- ✅ API documentation updated
- ✅ Changelog maintenance
- ✅ Contributing guidelines
- ✅ Code comments untuk complex logic
- ✅ Architecture decision records

## Kontak dan Support

Untuk pertanyaan atau bantuan terkait proyek ini:

- **Repository**: https://github.com/username/bebang-pack-meal-portal
- **Issues**: Gunakan GitHub Issues untuk bug reports dan feature requests
- **Discussions**: GitHub Discussions untuk pertanyaan umum
- **Wiki**: Dokumentasi teknis detail di GitHub Wiki

---

**Catatan**: Tutorial ini khusus disesuaikan untuk proyek Bebang Pack Meal Portal. Untuk pertanyaan spesifik, silakan buka issue di repository atau hubungi tim pengembang.