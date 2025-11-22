# GitHub Pages Deployment for Documentation

This guide explains how to deploy the Docsify documentation to GitHub Pages.

## Prerequisites

- A GitHub repository (already set up: `https://github.com/Maestro2903/OPTIZEN`)
- Push access to the repository
- Documentation files in the `docs/` folder (already configured)

## Step 1: Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/Maestro2903/OPTIZEN`
2. Click on **Settings** (top navigation)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select:
   - Branch: `main` (or your default branch)
   - Folder: `/docs`
5. Click **Save**

## Step 2: Verify Deployment

After saving, GitHub Pages will build your documentation site. This usually takes 1-2 minutes.

Your documentation will be available at:
```
https://maestro2903.github.io/OPTIZEN/
```

> **Note**: The URL format is `https://[username].github.io/[repository-name]/`

## Step 3: Update Base Path (Optional)

If you want to use a custom domain or different base path, update the `basePath` in `docs/index.html`:

```javascript
window.$docsify = {
  basePath: '/OPTIZEN/',  // Add this if needed
  // ... rest of config
}
```

## Step 4: Test Locally Before Pushing

Before pushing changes, test your documentation locally:

```bash
# Serve documentation locally
npm run docs

# Or with auto-open
npm run docs:dev
```

Visit `http://localhost:3001` to preview your documentation.

## Troubleshooting

### Documentation Not Loading

1. **Check the branch and folder**: Ensure GitHub Pages is set to the correct branch (`main`) and folder (`/docs`)
2. **Verify `index.html` exists**: The `docs/index.html` file must be present
3. **Check `.nojekyll` file**: The `docs/.nojekyll` file tells GitHub Pages not to use Jekyll (required for Docsify)

### 404 Errors

- Ensure all file paths in `_sidebar.md` are relative to the `docs/` folder
- Check that all referenced markdown files exist
- Verify file paths use forward slashes (`/`) not backslashes (`\`)

### Search Not Working

- Verify the search plugin is included in `index.html`
- Check browser console for JavaScript errors
- Ensure `loadSidebar: true` is set in Docsify configuration

## Updating Documentation

1. Make changes to your markdown files in the `docs/` folder
2. Test locally using `npm run docs`
3. Commit and push changes:
   ```bash
   git add docs/
   git commit -m "docs: update documentation"
   git push origin main
   ```
4. GitHub Pages will automatically rebuild after a few minutes

## Custom Domain (Optional)

If you want to use a custom domain:

1. Add a `CNAME` file to the `docs/` folder with your domain name
2. Configure DNS records as instructed by GitHub
3. Update the domain in GitHub Pages settings

## Features Enabled

- ✅ Sidebar navigation (`_sidebar.md`)
- ✅ Search functionality
- ✅ Code copy buttons
- ✅ Image zoom
- ✅ Pagination between pages
- ✅ GitHub repository link

## Repository Link

The documentation automatically includes a link to the repository at the top right. Configure it in `docs/index.html`:

```javascript
window.$docsify = {
  repo: 'https://github.com/Maestro2903/OPTIZEN',
  // ...
}
```
