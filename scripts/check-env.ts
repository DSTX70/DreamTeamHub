#!/usr/bin/env tsx

/**
 * Environment Health Check Script
 * 
 * Validates that required environment variables are set.
 * Used by CI/CD pipeline to catch configuration issues early.
 * 
 * Required variables:
 * - DATABASE_URL: PostgreSQL connection string
 * - AWS_S3_BUCKET: S3 bucket name for image storage
 * - OPS_API_TOKEN: API token for ops authentication
 * 
 * Optional variables (warns if missing):
 * - AWS_REGION: AWS region (defaults to us-east-1)
 */

type EnvCheckResult = {
  name: string;
  required: boolean;
  present: boolean;
  value?: string;
};

const REQUIRED_VARS = [
  'DATABASE_URL',
  'AWS_S3_BUCKET',
  'OPS_API_TOKEN',
];

const OPTIONAL_VARS = [
  { name: 'AWS_REGION', defaultValue: 'us-east-1' },
];

function checkEnvironment(): { results: EnvCheckResult[]; hasErrors: boolean } {
  const results: EnvCheckResult[] = [];
  let hasErrors = false;

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    const present = Boolean(value);
    
    results.push({
      name: varName,
      required: true,
      present,
      value: present ? maskValue(value!) : undefined,
    });

    if (!present) {
      hasErrors = true;
    }
  }

  // Check optional variables
  for (const { name, defaultValue } of OPTIONAL_VARS) {
    const value = process.env[name];
    const present = Boolean(value);
    
    results.push({
      name,
      required: false,
      present,
      value: present ? maskValue(value!) : `(will default to ${defaultValue})`,
    });
  }

  return { results, hasErrors };
}

function maskValue(value: string): string {
  if (value.length <= 8) {
    return '***';
  }
  return value.substring(0, 4) + '...' + value.substring(value.length - 4);
}

function printResults(results: EnvCheckResult[]): void {
  console.log('\n🔍 Environment Health Check\n');
  console.log('─'.repeat(60));
  
  for (const result of results) {
    const status = result.present ? '✅' : (result.required ? '❌' : '⚠️');
    const label = result.required ? '[REQUIRED]' : '[OPTIONAL]';
    const valueStr = result.value ? ` = ${result.value}` : '';
    
    console.log(`${status} ${label} ${result.name}${valueStr}`);
  }
  
  console.log('─'.repeat(60));
}

function main(): void {
  const { results, hasErrors } = checkEnvironment();
  
  printResults(results);
  
  if (hasErrors) {
    console.error('\n❌ Environment check FAILED - required variables missing\n');
    process.exit(1);
  } else {
    console.log('\n✅ Environment check PASSED - all required variables present\n');
    process.exit(0);
  }
}

main();
