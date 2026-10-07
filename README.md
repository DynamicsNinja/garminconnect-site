# garminconnect-site

The product site for [garminconnect-js](https://github.com/DynamicsNinja/garminconnect) at https://garmin.ficdev.xyz: a landing page, the docs, the privacy page and a live demo. See `docs/spec.md` for the design.

## Run it

```bash
npm ci && npm run dev
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`.

## How the docs sync

The docs are read at build time from the pinned `garminconnect-js` and `@dynamicsninja/garminconnect-mcp` packages in `node_modules`. Dependabot opens a PR when either releases a new version, so merging it rebuilds the site with the new docs.

## Deployment

Deployed with Dokploy (Docker, `Dockerfile`) behind a Cloudflare Tunnel.
