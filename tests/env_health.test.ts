/**
 * Environment Health Test
 * 
 * Validates that the env check script properly detects missing environment variables
 * and exits with non-zero status code.
 */

import { execSync } from 'child_process';

describe('Environment Health Check', () => {
  test('should exit with non-zero code when required env vars are missing', () => {
    try {
      // Run the script with no environment variables
      execSync('npx tsx scripts/check-env.ts', {
        env: {
          // Intentionally empty - no required vars set
          PATH: process.env.PATH, // Keep PATH for tsx to work
        },
        stdio: 'pipe',
      });
      
      // If we get here, the script didn't fail - that's wrong
      expect(true).toBe(false); // Force failure
    } catch (error: any) {
      // Script should exit with code 1 when vars are missing
      expect(error.status).toBe(1);
    }
  });

  test('should exit with zero code when all required env vars are present', () => {
    try {
      // Run the script with all required variables set
      execSync('npx tsx scripts/check-env.ts', {
        env: {
          PATH: process.env.PATH,
          DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
          AWS_S3_BUCKET: 'test-bucket',
          OPS_API_TOKEN: 'test-token-12345',
        },
        stdio: 'pipe',
      });
      
      // If we get here, script passed - that's correct
      expect(true).toBe(true);
    } catch (error: any) {
      // Script should not fail when all vars are present
      expect(error.status).toBe(0);
    }
  });

  test('should warn about missing optional vars but still pass', () => {
    try {
      const output = execSync('npx tsx scripts/check-env.ts', {
        env: {
          PATH: process.env.PATH,
          DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
          AWS_S3_BUCKET: 'test-bucket',
          OPS_API_TOKEN: 'test-token-12345',
          // AWS_REGION intentionally missing (optional)
        },
        stdio: 'pipe',
        encoding: 'utf-8',
      });
      
      // Should still pass even without optional var
      expect(output).toContain('Environment check PASSED');
      expect(output).toContain('AWS_REGION');
    } catch (error: any) {
      // Should not fail
      expect(error.status).toBe(0);
    }
  });
});
