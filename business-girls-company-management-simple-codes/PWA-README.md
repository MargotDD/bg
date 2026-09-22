# Business Girls PWA

PWA files are available both at the project root and in `public/`:
- `/manifest.json`
- `/sw.js`
- `/icon-192.png`
- `/icon-512.png`

The HTML entry includes the manifest and service-worker registration.

IMPORTANT: PWA installation/service workers require HTTPS (localhost is also allowed).
If your host publishes a subfolder rather than the project root, configure the site
so `manifest.json` and `sw.js` are served from the same origin/root as the app.
