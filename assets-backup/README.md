# React Application Assets Backup

This folder contains all images, SVGs, videos, and icons from the React/Next.js version of the site that was removed.

## Contents

- **public/** - All assets from the `public/` directory of the React application (106 files total)
  - **Images/** - WebP and PNG images used in React components
  - **Svgs/** - SVG icon files used in React components  
  - **videos/** - Video files (mission video and poster)
  - Root icons (favicon, apple-icon, android-chrome icons, etc.)
  - CNAME file
  - site.webmanifest

## Why This Backup Exists

When transitioning from the React/Next.js application to the pure HTML static site, the `public/` directory was removed as part of the cleanup. However, these assets were preserved in this backup folder for:

1. **Historical reference** - In case any assets are needed in the future
2. **Comparison** - To verify that all necessary assets were migrated to `html-site/`
3. **Recovery** - If any assets were missed during migration

## Current Status

The HTML static site in `html-site/` already contains all the assets needed for production deployment:
- Images are in `html-site/images/`
- SVGs are in `html-site/svgs/`
- Videos are in `html-site/videos/`
- Icons and manifest files are in `html-site/` root

## File Comparison

**React `public/` directory**: 106 files (103 media files)
**HTML `html-site/` directory**: Contains all necessary production assets

Most assets were already duplicated between `public/` and `html-site/` directories. The HTML version contains the actively used subset of these assets.

## Notes

- This backup was created from commit `6c70826` (before React code removal)
- Assets in this folder are **NOT** used in production deployment
- Production deployment uses only assets from `html-site/` directory
- This folder can be removed in the future once it's confirmed all necessary assets have been migrated
