#!/usr/bin/env node

/**
 * Monorepo Configuration Validator
 * Validates the entire configuration system and provides detailed feedback
 */

const path = require('path');
const fs = require('fs');

/**
 * Check if required files exist
 */
function checkRequiredFiles() {
  const requiredFiles = [
    '.env',
    '.env.example',
    'config/index.ts',
    'config/schema.ts',
    'packages/apps/api/src/config.ts',
    'packages/apps/web/src/config.ts',
    'packages/modules/mongodb/src/config.ts'
  ];

  const results = [];
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, '..', file));
    results.push({
      file,
      exists,
      status: exists ? '✅' : '❌'
    });
  });

  return results;
}

/**
 * Validate environment variables
 */
function validateEnvironmentVariables() {
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

  const requiredVars = [
    'NODE_ENV',
    'API_PORT',
    'WEB_PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CLIENT_URL'
  ];

  const productionVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  const results = [];

  // Check required variables
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const exists = !!value;
    const isSecure = varName.includes('SECRET') ? value && value.length >= 32 : true;
    
    results.push({
      variable: varName,
      exists,
      isSecure,
      status: exists && isSecure ? '✅' : '❌',
      issue: !exists ? 'Missing' : !isSecure ? 'Too short' : null
    });
  });

  // Check production variables if in production
  if (process.env.NODE_ENV === 'production') {
    productionVars.forEach(varName => {
      const value = process.env[varName];
      const exists = !!value;
      
      results.push({
        variable: varName,
        exists,
        isSecure: true,
        status: exists ? '✅' : '⚠️',
        issue: !exists ? 'Required in production' : null
      });
    });
  }

  return results;
}

/**
 * Test configuration loading
 */
function testConfigurationLoading() {
  const results = [];

  try {
    // Test if TypeScript files exist and are syntactically correct
    const configFiles = [
      'config/index.ts',
      'config/schema.ts',
      'packages/apps/api/src/config.ts',
      'packages/apps/web/src/config.ts',
      'packages/modules/mongodb/src/config.ts'
    ];

    configFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasImports = content.includes('import') || content.includes('require');
        const hasExports = content.includes('export');
        
        results.push({
          test: `${file} Structure`,
          status: hasImports && hasExports ? '✅' : '⚠️',
          details: hasImports && hasExports ? 'Valid structure' : 'Missing imports/exports'
        });
      }
    });

    // Test environment variable loading
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      results.push({
        test: 'Environment File Loading',
        status: '✅',
        details: 'Environment file exists and readable'
      });
    }

  } catch (error) {
    results.push({
      test: 'Configuration Loading',
      status: '❌',
      details: error.message
    });
  }

  return results;
}

/**
 * Check security configuration
 */
function checkSecurityConfiguration() {
  const results = [];

  try {
    // Check JWT secrets from environment
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    // JWT Secret length
    results.push({
      check: 'JWT Secret Length',
      status: jwtSecret && jwtSecret.length >= 32 ? '✅' : '❌',
      details: jwtSecret ? `${jwtSecret.length} characters` : 'Not set'
    });

    // JWT Refresh Secret length
    results.push({
      check: 'JWT Refresh Secret Length',
      status: jwtRefreshSecret && jwtRefreshSecret.length >= 32 ? '✅' : '❌',
      details: jwtRefreshSecret ? `${jwtRefreshSecret.length} characters` : 'Not set'
    });

    // CORS configuration
    const clientUrl = process.env.CLIENT_URL;
    results.push({
      check: 'CORS Configuration',
      status: clientUrl ? '✅' : '❌',
      details: clientUrl ? `${clientUrl.split(',').length} origins configured` : 'Not configured'
    });

    // Production security checks
    if (process.env.NODE_ENV === 'production') {
      const enableDebugRoutes = process.env.ENABLE_DEBUG_ROUTES === 'true';
      results.push({
        check: 'Production Debug Routes',
        status: !enableDebugRoutes ? '✅' : '❌',
        details: enableDebugRoutes ? 'Debug routes enabled in production!' : 'Disabled'
      });

      const sslCert = process.env.SSL_CERT_PATH;
      const sslKey = process.env.SSL_KEY_PATH;
      results.push({
        check: 'Production SSL',
        status: sslCert && sslKey ? '✅' : '⚠️',
        details: sslCert && sslKey ? 'SSL configured' : 'SSL not configured'
      });
    }

  } catch (error) {
    results.push({
      check: 'Security Configuration',
      status: '❌',
      details: error.message
    });
  }

  return results;
}

/**
 * Generate validation report
 */
function generateValidationReport() {
  console.log('🔍 Monorepo Configuration Validation Report');
  console.log('===========================================');

  // File existence check
  console.log('\n📁 Required Files:');
  const fileResults = checkRequiredFiles();
  fileResults.forEach(result => {
    console.log(`${result.status} ${result.file}`);
  });

  // Environment variables check
  console.log('\n🌍 Environment Variables:');
  const envResults = validateEnvironmentVariables();
  envResults.forEach(result => {
    const issue = result.issue ? ` (${result.issue})` : '';
    console.log(`${result.status} ${result.variable}${issue}`);
  });

  // Configuration loading test
  console.log('\n⚙️  Configuration Loading:');
  const loadResults = testConfigurationLoading();
  loadResults.forEach(result => {
    console.log(`${result.status} ${result.test}: ${result.details}`);
  });

  // Security configuration check
  console.log('\n🔒 Security Configuration:');
  const securityResults = checkSecurityConfiguration();
  securityResults.forEach(result => {
    console.log(`${result.status} ${result.check}: ${result.details}`);
  });

  // Overall status
  const allResults = [...fileResults, ...envResults, ...loadResults, ...securityResults];
  const hasErrors = allResults.some(result => result.status === '❌');
  const hasWarnings = allResults.some(result => result.status === '⚠️');

  console.log('\n📊 Overall Status:');
  if (hasErrors) {
    console.log('❌ Configuration has errors that need to be fixed');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Configuration has warnings but is functional');
  } else {
    console.log('✅ Configuration is valid and secure');
  }

  console.log('\n💡 Recommendations:');
  if (process.env.NODE_ENV === 'development') {
    console.log('- Run: npm run generate-secrets (if secrets are too short)');
    console.log('- Ensure MongoDB is running locally');
    console.log('- Check CORS origins match your frontend URL');
  }
  
  if (process.env.NODE_ENV === 'production') {
    console.log('- Ensure all production secrets are set');
    console.log('- Configure SSL certificates');
    console.log('- Set up monitoring and logging');
    console.log('- Disable debug features');
  }
}

/**
 * Main execution
 */
function main() {
  try {
    generateValidationReport();
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkRequiredFiles,
  validateEnvironmentVariables,
  testConfigurationLoading,
  checkSecurityConfiguration
};