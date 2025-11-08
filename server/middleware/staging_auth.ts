// server/middleware/staging_auth.ts
// Basic authentication middleware for staging environments
import type { Request, Response, NextFunction } from "express";

const STAGING_USER = process.env.STAGING_AUTH_USER;
const STAGING_PASS = process.env.STAGING_AUTH_PASS;
const NODE_ENV = process.env.NODE_ENV;

/**
 * Basic authentication middleware for staging environment
 * 
 * Activates only when NODE_ENV=staging and credentials are configured.
 * Protects the entire application behind HTTP Basic Auth.
 * 
 * Usage:
 *   import { stagingAuth } from './middleware/staging_auth';
 *   app.use(stagingAuth);
 * 
 * Environment variables:
 *   STAGING_AUTH_USER - Username for basic auth
 *   STAGING_AUTH_PASS - Password for basic auth
 *   NODE_ENV - Must be 'staging' to activate
 */
export function stagingAuth(req: Request, res: Response, next: NextFunction) {
  // Only activate in staging environment
  if (NODE_ENV !== 'staging') {
    return next();
  }

  // Skip if credentials not configured
  if (!STAGING_USER || !STAGING_PASS) {
    console.warn('[StagingAuth] Staging environment detected but STAGING_AUTH_USER/PASS not set');
    return next();
  }

  // Skip health check endpoints (for k8s probes)
  if (req.path === '/api/healthz' || req.path === '/api/healthz/livez') {
    return next();
  }

  // Parse Authorization header
  const auth = req.headers.authorization;
  
  if (!auth || !auth.startsWith('Basic ')) {
    return sendAuthChallenge(res);
  }

  // Decode credentials
  const base64Credentials = auth.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  // Verify credentials
  if (username === STAGING_USER && password === STAGING_PASS) {
    return next();
  }

  // Invalid credentials
  return sendAuthChallenge(res, true);
}

function sendAuthChallenge(res: Response, failed = false) {
  res.setHeader('WWW-Authenticate', 'Basic realm="Dream Team Hub Staging"');
  res.status(401).json({
    error: 'Authentication required',
    message: failed 
      ? 'Invalid credentials. Please contact your administrator.' 
      : 'Please provide valid staging credentials.'
  });
}

/**
 * Middleware to add staging banner to HTML responses
 * Injects a visual indicator that this is a staging environment
 */
export function stagingBanner(req: Request, res: Response, next: NextFunction) {
  if (NODE_ENV !== 'staging') {
    return next();
  }

  // Only inject on HTML responses
  const originalSend = res.send;
  res.send = function(data: any): Response {
    if (typeof data === 'string' && data.includes('</head>')) {
      const banner = `
        <style>
          #staging-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #1f2937;
            padding: 0.5rem;
            text-align: center;
            font-weight: 600;
            font-size: 0.875rem;
            z-index: 9999;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          body {
            padding-top: 2.5rem !important;
          }
        </style>
        <div id="staging-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:0.5rem">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" x2="12" y1="9" y2="13"></line>
            <line x1="12" x2="12.01" y1="17" y2="17"></line>
          </svg>
          STAGING ENVIRONMENT - For Testing Only
        </div>
      `;
      data = data.replace('</head>', `${banner}</head>`);
    }
    return originalSend.call(this, data) as Response;
  };
  
  next();
}
