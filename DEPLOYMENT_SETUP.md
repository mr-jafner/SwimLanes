# Deployment Setup Guide

This guide walks through setting up automated deployment from GitHub Actions to your OpenBSD server.

## Overview

The deployment workflow (`.github/workflows/deploy.yml`) will:

1. Run on every push to `main` branch
2. Install dependencies and run quality checks (typecheck, lint, test)
3. Build the production bundle (`npm run build`)
4. Deploy `dist/` to `/var/www/htdocs/swimlanes/` via SSH/rsync
5. Verify the deployment

## Setup Steps

### 1. Generate SSH Key Pair

On your **local machine** (Windows), generate a dedicated SSH key for GitHub Actions:

```powershell
ssh-keygen -t ed25519 -C "github-actions@swimlanes" -f swimlanes-deploy-key
```

This creates two files:

- `swimlanes-deploy-key` (private key - goes to GitHub)
- `swimlanes-deploy-key.pub` (public key - goes to server)

**IMPORTANT:** Don't set a passphrase - GitHub Actions needs passwordless access.

### 2. Add Public Key to Server

Copy the public key to your server:

```powershell
# Display the public key
Get-Content swimlanes-deploy-key.pub
```

Then SSH into your server and add it to authorized_keys:

```bash
ssh jeff@jafner.com

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add the public key (paste the content from swimlanes-deploy-key.pub)
echo "ssh-ed25519 AAAA... github-actions@swimlanes" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Exit
exit
```

### 3. Test SSH Connection

Verify the key works from your local machine:

```powershell
ssh -i swimlanes-deploy-key jeff@jafner.com "echo 'SSH connection successful'"
```

You should see "SSH connection successful" without being prompted for a password.

### 4. Configure GitHub Secrets

Go to your GitHub repository:

**https://github.com/mr-jafner/SwimLanes/settings/secrets/actions**

Click **"New repository secret"** and add these three secrets:

#### Secret 1: SSH_PRIVATE_KEY

- **Name:** `SSH_PRIVATE_KEY`
- **Value:** Entire contents of `swimlanes-deploy-key` file (private key)

```powershell
# Display the private key to copy
Get-Content swimlanes-deploy-key
```

Copy everything including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines.

#### Secret 2: SSH_HOST

- **Name:** `SSH_HOST`
- **Value:** `jafner.com`

#### Secret 3: SSH_USER

- **Name:** `SSH_USER`
- **Value:** `jeff`

### 5. Verify Secrets

After adding all three secrets, you should see:

- `SSH_PRIVATE_KEY`
- `SSH_HOST`
- `SSH_USER`

Listed at: https://github.com/mr-jafner/SwimLanes/settings/secrets/actions

### 6. Set Correct Permissions on Server

Make sure the deployment directory has correct ownership:

```bash
ssh jeff@jafner.com
doas chown -R www:www /var/www/htdocs/swimlanes
doas chmod -R 755 /var/www/htdocs/swimlanes
exit
```

### 7. Trigger First Deployment

Commit and push the workflow file:

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions deployment workflow (#9)

- Automated deployment on push to main
- Runs typecheck, lint, and tests before deploy
- Uses rsync over SSH to deploy to OpenBSD server
- Deploys to /var/www/htdocs/swimlanes/

Closes #9

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

### 8. Monitor Deployment

Watch the deployment progress:

**https://github.com/mr-jafner/SwimLanes/actions**

The workflow should:

- ✅ Install dependencies
- ✅ Run typecheck, lint, tests
- ✅ Build application
- ✅ Deploy to server
- ✅ Verify deployment

### 9. Verify Site

After successful deployment, visit:

**https://swimlanes.jafner.com**

You should see the deployed application!

## Troubleshooting

### "Permission denied (publickey)"

The SSH key isn't configured correctly. Verify:

1. Public key is in `~/.ssh/authorized_keys` on server
2. Private key is in `SSH_PRIVATE_KEY` GitHub secret (entire file)
3. File permissions: `authorized_keys` should be 600, `.ssh` should be 700

### "rsync: failed to set times on..."

File permissions issue. Run on server:

```bash
doas chown -R jeff:jeff /var/www/htdocs/swimlanes
```

Or modify rsync command to use sudo (requires passwordless sudo for jeff user).

### Workflow doesn't trigger

Make sure:

1. Workflow file is at `.github/workflows/deploy.yml`
2. Pushed to `main` branch
3. Check Actions tab for any errors

### Build fails

Check:

- All dependencies are in `package.json`
- TypeScript compiles locally: `npm run typecheck`
- Linter passes: `npm run lint`
- Tests pass: `npm test`

## Security Notes

- **Private key**: Never commit the private key to git
- **Secrets**: GitHub secrets are encrypted and only visible to workflows
- **SSH key scope**: This key only has access to jeff@jafner.com
- **Rotation**: Regenerate keys periodically for security

## Manual Deployment (Backup Method)

If GitHub Actions is down, deploy manually:

```bash
npm run build
rsync -avz --delete -e "ssh -i swimlanes-deploy-key" dist/ jeff@jafner.com:/var/www/htdocs/swimlanes/
```

---

**Last Updated:** 2025-10-31
