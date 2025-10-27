# SwimLanes Deployment Guide

**Version:** 1.0
**Last Updated:** 2025-01-25
**Target Environment:** Self-hosted OpenBSD on Vultr

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [OpenBSD Server Setup](#openbsd-server-setup)
4. [Web Server Configuration](#web-server-configuration)
5. [SSL/TLS Setup](#ssltls-setup)
6. [Deployment Process](#deployment-process)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

### Architecture

```
┌─────────────────┐
│  Developer PC   │
│   git push      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Repo    │
│  (main branch)  │
└────────┬────────┘
         │ triggers
         ▼
┌─────────────────┐
│ GitHub Actions  │
│  - Build both   │
│  - Run tests    │
│  - Deploy       │
└────────┬────────┘
         │ SSH/SCP
         ▼
┌─────────────────┐
│  Vultr OpenBSD  │
│  /var/www/      │
│  swimlanes/     │
└────────┬────────┘
         │ served by
         ▼
┌─────────────────┐
│  httpd server   │
│  :80, :443      │
└────────┬────────┘
         │
         ▼
   Users access:
swimlanes.jafner.com
```

### Build Outputs

**Two distinct builds:**

1. **Hosted Version** (dist/)
   - Optimized SPA with code splitting
   - Deployed to `/var/www/swimlanes/`
   - Served at `swimlanes.jafner.com`

2. **Single-File Version** (dist-single/)
   - Everything inlined into one HTML file
   - Deployed to `/var/www/swimlanes/download/`
   - Downloadable at `swimlanes.jafner.com/download/swimlanes.html`

---

## GitHub Actions Workflows

### File Structure

```
.github/
└── workflows/
    ├── deploy.yml          # Main deployment workflow
    ├── test.yml           # Run tests on PR
    └── release.yml        # Create GitHub releases
```

### Workflow 1: Test on Pull Request

**File:** `.github/workflows/test.yml`

```yaml
name: Test

on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

      - name: Build (smoke test)
        run: npm run build:all
```

### Workflow 2: Deploy to Production

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch: # Allow manual trigger

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build hosted version
        run: npm run build

      - name: Build single-file version
        run: npm run build:single

      - name: Prepare SSH key
        env:
          SSH_PRIVATE_KEY: ${{ secrets.VULTR_SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ secrets.VULTR_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy hosted version
        env:
          VULTR_USER: ${{ secrets.VULTR_USER }}
          VULTR_HOST: ${{ secrets.VULTR_HOST }}
        run: |
          rsync -avz --delete \
            -e "ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no" \
            dist/ $VULTR_USER@$VULTR_HOST:/var/www/swimlanes/

      - name: Deploy single-file version
        env:
          VULTR_USER: ${{ secrets.VULTR_USER }}
          VULTR_HOST: ${{ secrets.VULTR_HOST }}
        run: |
          rsync -avz \
            -e "ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no" \
            dist-single/index.html \
            $VULTR_USER@$VULTR_HOST:/var/www/swimlanes/download/swimlanes.html

      - name: Run post-deployment script
        env:
          VULTR_USER: ${{ secrets.VULTR_USER }}
          VULTR_HOST: ${{ secrets.VULTR_HOST }}
        run: |
          ssh -i ~/.ssh/deploy_key \
            $VULTR_USER@$VULTR_HOST \
            'doas /usr/local/bin/deploy-swimlanes.sh'

      - name: Cleanup
        if: always()
        run: rm -f ~/.ssh/deploy_key

      - name: Notify on success
        if: success()
        run: |
          echo "Deployment successful! 🚀"
          echo "Live at: https://swimlanes.jafner.com"

      - name: Notify on failure
        if: failure()
        run: |
          echo "Deployment failed! ❌"
          echo "Check logs above for details."
```

### Workflow 3: Create GitHub Release

**File:** `.github/workflows/release.yml`

```yaml
name: Create Release

on:
  push:
    tags:
      - 'v*.*.*' # Trigger on version tags (e.g., v1.0.0)

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build single-file version
        run: npm run build:single

      - name: Rename for release
        run: |
          cp dist-single/index.html swimlanes-${{ github.ref_name }}.html

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            swimlanes-${{ github.ref_name }}.html
            sample-data.csv
          body: |
            ## SwimLanes ${{ github.ref_name }}

            ### Downloads
            - `swimlanes-${{ github.ref_name }}.html` - Standalone HTML file (just download and open!)
            - `sample-data.csv` - Example dataset

            ### Changes
            See commit history for full changelog.

            ### Installation
            1. Download `swimlanes-${{ github.ref_name }}.html`
            2. Open in any modern browser (Chrome, Firefox, Safari, Edge)
            3. No installation required!

            Or visit the hosted version: https://swimlanes.jafner.com
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Secrets Required

Add these secrets in GitHub repo settings (`Settings > Secrets and variables > Actions`):

```
VULTR_SSH_KEY     = <private SSH key for deployment user>
VULTR_USER        = <SSH username, e.g., "deploy">
VULTR_HOST        = <server IP or hostname>
```

**Generate SSH key:**

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/swimlanes-deploy

# Copy private key to GitHub Secrets
cat ~/.ssh/swimlanes-deploy  # Paste entire output as VULTR_SSH_KEY

# Copy public key to server
ssh-copy-id -i ~/.ssh/swimlanes-deploy.pub user@vultr-server
```

---

## OpenBSD Server Setup

### User Setup

**Create deployment user:**

```bash
# SSH into Vultr server as root
ssh root@vultr-server

# Create deploy user
useradd -m -s /bin/ksh deploy
passwd deploy  # Set strong password

# Add to www group (for file permissions)
usermod -G www deploy

# Configure doas (OpenBSD sudo)
echo "permit nopass deploy as root cmd /usr/local/bin/deploy-swimlanes.sh" >> /etc/doas.conf
```

### Directory Structure

```bash
# Create web root
mkdir -p /var/www/swimlanes
mkdir -p /var/www/swimlanes/download
mkdir -p /var/www/swimlanes-backups

# Set permissions
chown -R deploy:www /var/www/swimlanes
chmod -R 755 /var/www/swimlanes

# Create log directory
mkdir -p /var/log/swimlanes
chown deploy:www /var/log/swimlanes
```

### Post-Deployment Script

**File:** `/usr/local/bin/deploy-swimlanes.sh`

```bash
#!/bin/ksh
# Post-deployment tasks for SwimLanes

set -e

DEPLOY_DIR="/var/www/swimlanes"
BACKUP_DIR="/var/www/swimlanes-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="/var/log/swimlanes/deploy.log"

echo "[$TIMESTAMP] Deployment started" >> $LOG_FILE

# Backup current version (if exists)
if [ -d "$DEPLOY_DIR" ]; then
    echo "Backing up current version..." >> $LOG_FILE
    tar -czf "$BACKUP_DIR/swimlanes-$TIMESTAMP.tar.gz" -C "$DEPLOY_DIR" .
fi

# Set correct ownership
chown -R www:www "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"

# Clean old backups (keep last 10)
cd "$BACKUP_DIR"
ls -t swimlanes-*.tar.gz | tail -n +11 | xargs rm -f 2>/dev/null || true

# Reload httpd (if needed)
# rcctl reload httpd

echo "[$TIMESTAMP] Deployment complete" >> $LOG_FILE
echo "Deployment successful: $TIMESTAMP"

exit 0
```

**Make executable:**

```bash
chmod +x /usr/local/bin/deploy-swimlanes.sh
```

---

## Web Server Configuration

### httpd Configuration

**File:** `/etc/httpd.conf`

```
# SwimLanes - Production Site

server "swimlanes.jafner.com" {
    listen on * port 80

    # Redirect HTTP to HTTPS
    block return 301 "https://$SERVER_NAME$REQUEST_URI"
}

server "swimlanes.jafner.com" {
    listen on * tls port 443

    root "/var/www/swimlanes"

    # TLS certificate (acme-client / Let's Encrypt)
    tls {
        certificate "/etc/ssl/swimlanes.jafner.com.crt"
        key "/etc/ssl/private/swimlanes.jafner.com.key"
    }

    # Security headers
    header always set "X-Frame-Options" "DENY"
    header always set "X-Content-Type-Options" "nosniff"
    header always set "Referrer-Policy" "strict-origin-when-cross-origin"
    header always set "X-XSS-Protection" "1; mode=block"
    header always set "Strict-Transport-Security" "max-age=31536000; includeSubDomains"

    # Content Security Policy
    header always set "Content-Security-Policy" \
        "default-src 'self'; \
         script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; \
         style-src 'self' 'unsafe-inline'; \
         img-src 'self' data:; \
         font-src 'self' data:; \
         connect-src 'self'; \
         object-src 'none'; \
         base-uri 'self'; \
         form-action 'self'"

    # Cache static assets (CSS, JS, images)
    location "/assets/*" {
        header always set "Cache-Control" "public, max-age=31536000, immutable"
        pass
    }

    # Serve single-file download
    location "/download/*" {
        header always set "Content-Disposition" "attachment; filename=swimlanes.html"
        pass
    }

    # SPA routing - all other routes go to index.html
    location "*" {
        request rewrite "/index.html"
    }

    # Logging
    log access "/var/log/swimlanes-access.log"
    log error "/var/log/swimlanes-error.log"
}
```

**Enable and start httpd:**

```bash
rcctl enable httpd
rcctl start httpd

# Reload after config changes
rcctl reload httpd
```

### DNS Configuration

Point DNS A record to Vultr server IP:

```
Type: A
Name: swimlanes
Value: <Vultr IP address>
TTL: 3600
```

**Verify DNS:**

```bash
dig swimlanes.jafner.com +short
# Should return Vultr IP
```

---

## SSL/TLS Setup

### Using Let's Encrypt (acme-client)

**OpenBSD includes acme-client by default.**

**File:** `/etc/acme-client.conf`

```
authority letsencrypt {
    api url "https://acme-v02.api.letsencrypt.org/directory"
    account key "/etc/acme/letsencrypt-privkey.pem"
}

domain swimlanes.jafner.com {
    alternative names { www.swimlanes.jafner.com }
    domain key "/etc/ssl/private/swimlanes.jafner.com.key"
    domain certificate "/etc/ssl/swimlanes.jafner.com.crt"
    domain full chain certificate "/etc/ssl/swimlanes.jafner.com.fullchain.pem"
    sign with letsencrypt
}
```

**Initial certificate request:**

```bash
# Create acme directory
mkdir -p /etc/acme

# Request certificate
acme-client -v swimlanes.jafner.com

# Reload httpd to use new certificate
rcctl reload httpd
```

**Auto-renewal (cron):**

```bash
# Add to root's crontab
crontab -e

# Add line (runs daily at 3am):
0 3 * * * acme-client swimlanes.jafner.com && rcctl reload httpd
```

---

## Deployment Process

### Manual Deployment (if needed)

**From local machine:**

```bash
# Build both versions
npm run build:all

# Deploy hosted version
rsync -avz --delete -e "ssh -i ~/.ssh/deploy_key" \
  dist/ deploy@vultr-server:/var/www/swimlanes/

# Deploy single-file version
rsync -avz -e "ssh -i ~/.ssh/deploy_key" \
  dist-single/index.html \
  deploy@vultr-server:/var/www/swimlanes/download/swimlanes.html

# Run post-deployment script
ssh -i ~/.ssh/deploy_key deploy@vultr-server \
  'doas /usr/local/bin/deploy-swimlanes.sh'
```

### Deployment via GitHub Actions

**Automatic (on push to main):**

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
# GitHub Actions automatically builds and deploys
```

**Manual trigger:**

1. Go to GitHub repo → Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow" → Select branch → "Run workflow"

### Creating a Release

```bash
# Tag a version
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Actions creates release with downloadable HTML
```

---

## Monitoring & Maintenance

### Log Files

**Access logs:**

```bash
tail -f /var/log/swimlanes-access.log
```

**Error logs:**

```bash
tail -f /var/log/swimlanes-error.log
```

**Deployment logs:**

```bash
tail -f /var/log/swimlanes/deploy.log
```

### Monitoring Commands

**Check httpd status:**

```bash
rcctl check httpd
rcctl status httpd
```

**Check disk space:**

```bash
df -h /var/www
```

**Check backup size:**

```bash
du -sh /var/www/swimlanes-backups
```

**Check process:**

```bash
ps aux | grep httpd
```

### Logrotate (Optional)

**File:** `/etc/newsyslog.conf`

```
# Rotate swimlanes logs
/var/log/swimlanes-access.log  www:www  644  7  *  $W0  Z
/var/log/swimlanes-error.log   www:www  644  7  *  $W0  Z
/var/log/swimlanes/deploy.log  www:www  644  7  *  $W0  Z
```

---

## Rollback Procedures

### Rollback to Previous Version

**Automatic backups exist at:** `/var/www/swimlanes-backups/`

**Restore from backup:**

```bash
# SSH to server
ssh deploy@vultr-server

# List available backups
ls -lth /var/www/swimlanes-backups/

# Restore (example: backup from 2025-01-25 at 14:30)
cd /var/www/swimlanes
doas rm -rf *
doas tar -xzf /var/www/swimlanes-backups/swimlanes-20250125-143000.tar.gz -C /var/www/swimlanes/
doas chown -R www:www /var/www/swimlanes
doas rcctl reload httpd
```

### Rollback via Git

**If GitHub Actions deployment failed:**

```bash
# Revert commit locally
git revert HEAD
git push origin main

# GitHub Actions redeploys previous version
```

**Or force-push previous commit:**

```bash
git reset --hard HEAD~1
git push --force origin main
# WARNING: Only do this if no one else is working on the repo
```

---

## Troubleshooting

### Common Issues

**Issue: httpd won't start**

```bash
# Check config syntax
httpd -n

# Check logs
tail -f /var/log/daemon

# Verify permissions
ls -la /etc/ssl/swimlanes.jafner.com.*
```

**Issue: Site returns 404**

```bash
# Check files exist
ls -la /var/www/swimlanes/

# Check httpd is running
rcctl check httpd

# Check root directory in httpd.conf
grep "root" /etc/httpd.conf
```

**Issue: GitHub Actions deployment fails**

```bash
# Check GitHub Actions logs
# Verify SSH key is correct
# Test SSH connection:
ssh -i ~/.ssh/deploy_key deploy@vultr-server 'ls -la /var/www/swimlanes'
```

**Issue: SSL certificate expired**

```bash
# Check expiration
openssl x509 -in /etc/ssl/swimlanes.jafner.com.crt -noout -dates

# Manually renew
acme-client -v swimlanes.jafner.com
rcctl reload httpd
```

**Issue: Permission denied during deployment**

```bash
# Fix ownership
doas chown -R deploy:www /var/www/swimlanes
doas chmod -R 755 /var/www/swimlanes

# Check doas configuration
cat /etc/doas.conf
```

### Testing Deployment

**After deployment, verify:**

1. **Site loads:** https://swimlanes.jafner.com
2. **Single-file download works:** https://swimlanes.jafner.com/download/swimlanes.html
3. **HTTPS redirect works:** http://swimlanes.jafner.com → https://
4. **Assets load:** Check browser dev tools Network tab
5. **No console errors:** Check browser dev tools Console tab

**Test from command line:**

```bash
# Check HTTP → HTTPS redirect
curl -I http://swimlanes.jafner.com
# Should return 301 redirect to https://

# Check HTTPS response
curl -I https://swimlanes.jafner.com
# Should return 200 OK

# Check security headers
curl -I https://swimlanes.jafner.com | grep -E "(X-Frame|X-Content|Strict-Transport)"
```

---

## Performance Optimization

### Enable gzip Compression

**OpenBSD httpd doesn't have built-in gzip, but files are already compressed during build.**

Vite automatically gzips during production build. Verify:

```bash
ls -lh dist/assets/*.js.gz
```

### CDN (Optional Future Enhancement)

If traffic grows, consider:
- Cloudflare (free tier, CDN + DDoS protection)
- Serve static assets from CDN
- Keep dynamic API calls (if added) on origin

---

## Backup Strategy

### Automated Backups

**Pre-deployment backups:**
- Created automatically by `deploy-swimlanes.sh`
- Stored in `/var/www/swimlanes-backups/`
- Keep last 10 versions
- Compressed with gzip

**Server-level backups:**
- Vultr provides snapshots (manual or scheduled)
- Take snapshot before major updates
- Cost: ~$1/mo for 10 GB snapshot

**Git backups:**
- Source code in GitHub (always recoverable)
- Tagged releases contain single-file builds

---

## Disaster Recovery

**If server is completely lost:**

1. **Spin up new Vultr instance**
2. **Run server setup** (from this doc)
3. **Configure DNS** to point to new IP
4. **Push to GitHub main** (triggers deployment)
5. **Verify site is live**

**Total recovery time:** ~30 minutes

**Data loss:** None (all code is in Git, users have local data)

---

## Maintenance Schedule

**Daily:**
- GitHub Actions checks every push
- SSL cert auto-renewal check (via cron)

**Weekly:**
- Review error logs
- Check disk space

**Monthly:**
- Review old backups (auto-cleaned, verify)
- Update dependencies (`npm outdated`)
- Security updates (`pkg_add -u`)

**Quarterly:**
- Full server OS update
- Review and update documentation
- Load testing (if usage grows)

---

## Future Enhancements

**CI/CD Improvements:**
- [ ] Add deployment to staging environment
- [ ] Automated smoke tests post-deployment
- [ ] Slack/Discord notifications on deploy
- [ ] Deploy preview for PRs

**Monitoring:**
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Plausible, self-hosted)
- [ ] Performance monitoring (Lighthouse CI)

**Infrastructure:**
- [ ] Cloudflare for CDN + DDoS protection
- [ ] Multiple deployment regions (if needed)
- [ ] Database backups to S3-compatible storage
- [ ] Automated security scanning

---

**Document Version:** 1.0
**Maintained By:** SwimLanes Team
**Next Review:** After first production deployment
