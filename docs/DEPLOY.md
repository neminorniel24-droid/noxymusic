# Deploy

## GitHub Pages with Actions
1. Push to `main`.
2. In the repo go to Settings, then Pages, then Build and deployment, and set Source to GitHub Actions.
3. The workflow in `.github/workflows/pages.yml` publishes the site on every push.

## GitHub Pages without Actions
Set Source to Deploy from a branch, branch `main`, folder `/ (root)`.

## Other hosts
Netlify, Vercel and Cloudflare Pages work by pointing them at the repo root. No build command is needed.

## Offline support
The service worker caches the app files so the page opens offline. Hand and face tracking still need internet on first load.

## HTTPS
Camera and microphone access require HTTPS or localhost. All the hosts above provide HTTPS.
