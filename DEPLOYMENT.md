# Deployment Guide

This document explains how the Free For Charity website is deployed to GitHub Pages.

## Table of Contents

1. [Overview](#overview)
2. [Deployment Architecture](#deployment-architecture)
3. [Automated Deployment](#automated-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Domain Configuration](#domain-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)

---

## Overview

The Free For Charity website is deployed to GitHub Pages as a static HTML site. The site is accessible at:

- **GitHub Pages URL**: https://freeforcharity.github.io/FFC-IN-Single_Page_Template_HTML/
- **Custom Domain**: (If configured via CNAME file)

### Technology Stack

- **Production**: Pure HTML, CSS, and vanilla JavaScript
- **Hosting**: GitHub Pages (subpath deployment)
- **CI/CD**: GitHub Actions
- **No Build Process**: Files are served directly from the repository

---

## Deployment Architecture

### Repository Structure

```
html-site/               # Production website
├── index.html          # Main homepage
├── css/                # Stylesheets
│   └── styles.css     # All site styles
├── js/                 # JavaScript files
│   └── main.js        # Site functionality
├── images/             # Image assets
├── svgs/               # SVG icons
├── videos/             # Video files
└── *.html              # Policy pages
```

### Asset Path Handling

The HTML static site uses paths with the basePath prefix (e.g., `/FFC-IN-Single_Page_Template_HTML/favicon.ico`) which ensures assets load correctly when deployed to the GitHub Pages subpath.

All HTML files have been pre-configured with the correct basePath for GitHub Pages deployment.

---

## Automated Deployment

### GitHub Actions Workflow

Deployment is automated through a single GitHub Actions workflow:

**Deploy Workflow** (`.github/workflows/deploy.yml`)

#### Trigger Conditions

The deployment workflow runs automatically when:

1. **Push to main branch**: Automatically when changes are pushed to `main`
2. **Manual trigger**: From the Actions tab (workflow_dispatch)

#### Workflow Steps

1. **Checkout code**: Retrieves the latest code from the repository
2. **Setup Pages**: Configures GitHub Pages settings
3. **Upload artifact**: Packages the `./html-site` directory
4. **Deploy to GitHub Pages**: Publishes the HTML static site

**Key features:**

- No dependencies to install
- No build step required
- Direct upload of pre-built HTML files
- Fast deployment (typically under 1 minute)

### Viewing Deployment Status

1. Go to the **Actions** tab in the GitHub repository
2. Click on the latest workflow run
3. Review the status of each step
4. Check logs if any step fails

---

## Manual Deployment

While automated deployment is recommended, manual deployment is straightforward.

### Prerequisites

- Git installed
- Write access to the repository

### Manual Deployment Steps

1. **Clone the repository** (if not already done):

   ```bash
   git clone https://github.com/FreeForCharity/FFC-IN-Single_Page_Template_HTML.git
   cd FFC-IN-Single_Page_Template_HTML
   ```

2. **Make your changes** to files in the `html-site/` directory:

   ```bash
   cd html-site
   # Edit HTML, CSS, or JS files
   ```

3. **Test locally** (optional but recommended):

   ```bash
   # Using Python (usually pre-installed)
   python3 -m http.server 8000
   # Visit http://localhost:8000

   # Or using PHP
   php -S localhost:8000

   # Or using Node.js (if installed)
   npx http-server -p 8000
   ```

4. **Commit and push** changes:

   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

5. **Verify deployment**: 
   - Check GitHub Actions for workflow status
   - Visit the live site after deployment completes

---

## Domain Configuration

### GitHub Pages Configuration

1. Go to repository **Settings** → **Pages**
2. **Source**: Should show "GitHub Actions" (configured automatically)
3. **Custom domain**: Enter your domain (if applicable)

### Custom Domain Setup

If you want to use a custom domain:

1. **Add CNAME file** to `html-site/` directory:

1. **CNAME Files** - The domain is configured in two locations:
   - `html-site/CNAME` - **Production deployment** (deployed to GitHub Pages)
   - `public/CNAME` - Development reference (for Next.js builds, not deployed)

   Both files should contain:

   ```
   ffcworkingsite2.org
   ```

2. **Configure DNS records** at your domain provider:

   For apex domain (ffcworkingsite2.org):
   - **Type**: A or ALIAS (depending on DNS provider)
   - **Name**: @ (root domain)
   - **Value**: GitHub Pages IP addresses:
- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

   For www subdomain (optional):
   - **Type**: CNAME
   - **Name**: www
   - **Value**: freeforcharity.github.io

3. **GitHub Pages Settings**:
   - Navigate to repository Settings → Pages
   - Custom domain should show: `ffcworkingsite2.org`
   - HTTPS should be automatically enabled

4. **Important Notes**:
   - The `html-site/CNAME` file is critical for deployment
   - Without this file, GitHub Pages loses custom domain configuration on each deployment
   - The deployment workflow deploys `html-site/` directory, not `public/`
   - Custom domain works independently of the basePath configuration

### DNS Propagation

After configuring DNS:

- Changes can take 24-48 hours to propagate
- Use `dig` or online DNS tools to verify propagation
- Clear browser cache when testing

---

## Environment Variables

### Build-Time Variables

   Add an A record or CNAME record pointing to GitHub Pages:

   **For A records** (apex domain like `example.org`):
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   **For CNAME record** (subdomain like `www.example.org`):
   ```
   <username>.github.io
   ```

3. **Enable HTTPS** in GitHub Pages settings (recommended)

4. **Wait for DNS propagation** (can take up to 24-48 hours)

### Verify Custom Domain

```bash
# Check DNS propagation
dig yourdomain.org

# Check if site is accessible
curl -I https://yourdomain.org
```

---

## Troubleshooting

### Common Issues

#### Issue: Images or Assets Not Loading

**Symptoms**: Images show as broken links, CSS not applied

**Cause**: Incorrect asset paths

**Solution**:
1. Verify all asset paths include the basePath: `/FFC-IN-Single_Page_Template_HTML/`
2. Check browser console for 404 errors
3. Ensure files exist in the `html-site/` directory

#### Issue: 404 Page Not Found

**Symptoms**: Page shows 404 error

**Cause**: Incorrect URL or missing file

**Solution**:
1. Verify the file exists in `html-site/`
2. Check that the URL includes the basePath prefix
3. Ensure file names match exactly (case-sensitive)

#### Issue: Changes Not Appearing

**Symptoms**: Deployed site shows old content

**Cause**: Browser cache or deployment delay

**Solution**:
1. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
2. Check GitHub Actions to verify deployment succeeded
3. Clear browser cache
4. Try incognito/private browsing mode

#### Issue: Deployment Failed

**Symptoms**: GitHub Actions workflow shows failure

**Cause**: Various potential issues

**Solution**:
1. Check workflow logs in Actions tab
2. Verify repository has GitHub Pages enabled
3. Check repository permissions
4. Ensure `html-site/` directory exists and contains files

### Deployment Logs

To view detailed deployment logs:

1. Go to **Actions** tab
2. Click on the failed workflow run
3. Click on the "Deploy to GitHub Pages" job
4. Expand each step to see detailed logs
5. Look for error messages or warnings

### Testing Locally

Before pushing to production, test locally:

```bash
cd html-site

# Start local server
python3 -m http.server 8000

# Visit http://localhost:8000 in your browser
# Test all functionality and links
```

---

## Rollback Procedures

### Rolling Back to a Previous Deployment

If a deployment introduces issues, you can roll back:

#### Method 1: Revert the Commit

```bash
# Find the commit to revert
git log --oneline

# Revert the problematic commit
git revert <commit-hash>

# Push the revert
git push origin main
```

#### Method 2: Re-deploy a Previous Version

```bash
# Reset to a previous commit
git reset --hard <previous-commit-hash>

# Force push (use with caution)
git push --force origin main
```

**Warning**: Force push will rewrite history. Only use if necessary.

#### Method 3: Manual Trigger from Actions

1. Go to **Actions** tab
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select the branch/commit to deploy

### Emergency Rollback

If the site is completely broken:

1. Identify the last working commit from git history
2. Create a new branch from that commit
3. Update the deployment to use that branch temporarily
4. Fix the issues on main branch
5. Re-deploy main when fixed

---

## Deployment Checklist

Before deploying to production:

- [ ] Test all changes locally
- [ ] Verify all links work
- [ ] Check that images and assets load correctly
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Verify all policy pages are accessible
- [ ] Check console for JavaScript errors
- [ ] Ensure no broken links
- [ ] Verify forms and interactive elements work
- [ ] Test with and without custom domain (if applicable)

---

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Troubleshooting GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites)

