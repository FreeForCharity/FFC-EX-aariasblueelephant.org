# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Free For Charity HTML Static Site.

## Workflow Files

### 1. Test & Visual Regression (`test.yml`)

**Purpose:** Runs functional tests and visual regression checks

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**What it does:**
- Installs dependencies and Playwright browsers
- Runs all Playwright tests including visual regression
- Uploads test reports and screenshots on failure

**Duration:** ~3-5 minutes

---

### 2. CodeQL Advanced (`codeql.yml`)

### 2. CodeQL Advanced (`codeql.yml`)

**Purpose:** Security scanning and code quality analysis

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Scheduled weekly scan (Mondays at 23:17 UTC)

**What it does:**
- Analyzes code for security vulnerabilities
- Scans GitHub Actions workflows
- Scans JavaScript/TypeScript code
- Generates security alerts if issues are found

**Duration:** ~1-2 minutes

---

### 3. Deploy to GitHub Pages (`deploy.yml`)

### 3. Deploy to GitHub Pages (`deploy.yml`)

**Purpose:** Deploys the HTML static site to GitHub Pages

**Triggers:**
- **Automatically** after Test & Visual Regression AND CodeQL Advanced workflows both complete successfully on push to `main`
- **Manually** via workflow_dispatch (bypasses checks)

**What it does:**
1. Waits for both Test and CodeQL workflows to succeed
2. Uploads the `html-site/` directory as a Pages artifact
3. Deploys the artifact to GitHub Pages at https://ffcworkingsite2.org/

**Duration:** ~30 seconds

---

## Workflow Sequence

### On Push to Main Branch

The workflows execute in the following **parallel then sequential** order to protect the main branch:

```
┌─────────────────────────────────────────────┐
│  Developer pushes code to main branch       │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
┌──────────────────┐  ┌──────────────────────┐
│ Test & Visual    │  │ CodeQL Advanced      │
│ Regression       │  │ (Security Scan)      │
│ (3-5 min)        │  │ (1-2 min)            │
└────────┬─────────┘  └──────────┬───────────┘
         │                       │
         └───────┬───────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    [SUCCESS]        [FAILURE]
         │                │
         │                └──> ❌ Deployment BLOCKED
         │                     (Fix tests/security issues)
         ▼
┌─────────────────────────────────────────────┐
│  Deploy to GitHub Pages                     │
│  Only runs if BOTH workflows succeeded      │
│  ├─ Uploads html-site/ directory            │
│  ├─ Deploys to GitHub Pages                 │
│  └─ Site live at ffcworkingsite2.org        │
└─────────────────────────────────────────────┘
           │
           ▼
       ✅ COMPLETE
```

### Manual Deployment

Manual deployments via `workflow_dispatch` **bypass** the CodeQL check and deploy immediately.

**When to use manual deployment:**
- Emergency hotfixes
- CodeQL false positives that need investigation
- Testing deployment process

**How to trigger:**
1. Go to Actions tab in GitHub
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

---

## Key Features

### ✅ Parallel + Sequential Execution
- Tests and CodeQL run **in parallel** for speed (both complete in ~3-5 minutes)
- Deploy waits for **both** to complete successfully
- No deployment if either test or security check fails

### 🔒 Security + Quality Gate
- Deployment is **blocked** if tests or CodeQL find issues
- Forces both functional and security issues to be addressed before going live
- Protects production site from broken UI and vulnerable code

### ⚡ Fast Feedback
- Tests and CodeQL run in parallel (~3-5 minutes combined)
- Deploy completes in ~30 seconds  
- Total time: ~4-6 minutes from push to live site

### 🛠️ Flexibility
- Manual deployment option preserved for emergencies
- Workflows can be re-run individually if needed
- Clear separation of concerns (security vs deployment)

---

## Troubleshooting

### Deployment Not Triggered

**Symptom:** Code pushed to main, but deployment didn't run

**Possible Causes:**
1. CodeQL workflow failed - check CodeQL run for errors
2. CodeQL workflow still running - wait for it to complete
3. Workflow permissions issue - check repository settings

**Solution:**
- View the Actions tab to see CodeQL status
- Fix any CodeQL failures before deployment will proceed
- Use manual deployment if needed (see above)

### CodeQL False Positives

**Symptom:** CodeQL flags code that is actually safe

**Solution:**
1. Review the CodeQL alert details
2. If confirmed false positive, add a suppression comment
3. Or use manual deployment to bypass temporarily
4. Report false positive to GitHub CodeQL team

### Deployment Failed

**Symptom:** CodeQL succeeded but deployment failed

**Solution:**
1. Check deploy workflow logs for errors
2. Common issues:
   - Missing files in html-site/ directory
   - Permissions issue with GitHub Pages
   - Invalid CNAME configuration
3. Re-run the deployment workflow after fixing

---

## Modifying Workflows

### Adding a New Workflow Step

**To add a step to CodeQL:**
1. Edit `.github/workflows/codeql.yml`
2. Add your step to the `analyze` job
3. Test on a branch first
4. No changes needed to deploy.yml

**To add a step to Deploy:**
1. Edit `.github/workflows/deploy.yml`
2. Add your step to the `build` or `deploy` job
3. Test with manual deployment first
4. Ensure step doesn't break sequential execution

### Changing the Workflow Sequence

**⚠️ WARNING:** Changing the workflow sequence can compromise security!

The current sequence ensures:
- Security checks run before deployment
- Vulnerable code cannot be deployed
- Protection for the production site

**If you must change the sequence:**
1. Document why the change is needed
2. Assess security impact
3. Get approval from repository admin
4. Update this documentation

---

## Best Practices

### ✅ DO
- Let workflows run automatically on push
- Review CodeQL alerts before merging
- Use manual deployment sparingly
- Keep workflows up to date with latest action versions

### ❌ DON'T  
- Skip security checks to deploy faster
- Ignore CodeQL alerts
- Remove the workflow dependency
- Deploy without testing locally first

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [workflow_run Trigger](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_run)
