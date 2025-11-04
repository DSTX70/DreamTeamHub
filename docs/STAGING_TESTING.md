# Quick Test — stagingGuard

1) Start your app with `NODE_ENV=staging` and the sample env vars:
   ```bash
   export NODE_ENV=staging
   export STAGING_USER=staging
   export STAGING_PASSWORD=change_me
   export ALLOWED_IPS=127.0.0.1,::1
   node server.js
   ```

2) In another terminal, test unauthenticated access (should prompt 401):
   ```bash
   curl -i http://localhost:3000/
   ```

3) Test basic auth (should return 200):
   ```bash
   curl -i -u staging:change_me http://localhost:3000/
   ```

4) Health check is open (200 without auth):
   ```bash
   curl -i http://localhost:3000/healthz
   ```
