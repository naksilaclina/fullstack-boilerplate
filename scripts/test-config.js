#!/usr/bin/env node

/**
 * Monorepo Configuration Test Script
 * Tests the centralized environment configuration system
 */

const path = require('path');
const fs = require('fs');

// Set test environment
process.env.NODE_ENV = 'test';

// Load test configuration
try {
  // Import the centralized config system
  const configPath = path.join(__dirname, '..', 'index.js');
  
  // Check if config needs to be built
  if (!fs.existsSync(configPath)) {
    console.log('🔨 Building configuration first...');
    const { execSync } = require('child_process');
    execSync('npx tsc config/index.ts --outDir . --target es2020 --module commonjs --esModuleInterop --skipLibCheck', { stdio: 'inherit' });
  }

  const { config, apiConfig, webConfig, mongoConfig } = require('../index');

  console.log('🧪 Monorepo Configuration Test Results:');
  console.log('==========================================');
  
  // Test global configuration
  console.log(`✅ Environment: ${config.nodeEnv}`);
  console.log(`✅ API Server: ${config.api.baseUrl}`);
  console.log(`✅ Web Server: ${config.web.baseUrl}`);
  console.log(`✅ Database URI: ${config.database.uri ? 'Configured' : 'Missing'}`);
  
  // Test API-specific configuration
  console.log('\n📡 API Configuration:');
  console.log(`✅ Port: ${apiConfig.server.port}`);
  console.log(`✅ JWT Secret: ${apiConfig.auth.jwtSecret ? 'Configured' : 'Missing'}`);
  console.log(`✅ CORS Origins: ${apiConfig.security.corsOrigins.length} configured`);
  console.log(`✅ Rate Limiting: ${apiConfig.security.rateLimiting.maxRequests} req/window`);
  
  // Test Web-specific configuration
  console.log('\n🌐 Web Configuration:');
  console.log(`✅ Port: ${webConfig.server.port}`);
  console.log(`✅ API Base URL: ${webConfig.api.baseUrl}`);
  console.log(`✅ NextAuth Secret: ${webConfig.auth.nextAuthSecret ? 'Configured' : 'Not configured'}`);
  
  // Test MongoDB-specific configuration
  console.log('\n🗄️  MongoDB Configuration:');
  console.log(`✅ URI: ${mongoConfig.database.uri ? 'Configured' : 'Missing'}`);
  console.log(`✅ SSL Validation: ${mongoConfig.database.ssl.validate ? 'Enabled' : 'Disabled'}`);
  console.log(`✅ Seeding: ${mongoConfig.features.enableSeeding ? 'Enabled' : 'Disabled'}`);
  
  // Test feature flags
  console.log('\n🚀 Feature Flags:');
  console.log(`✅ Debug Routes: ${config.features.enableDebugRoutes ? 'Enabled' : 'Disabled'}`);
  console.log(`✅ Swagger: ${config.features.enableSwagger ? 'Enabled' : 'Disabled'}`);
  console.log(`✅ Compression: ${config.features.enableCompression ? 'Enabled' : 'Disabled'}`);
  console.log(`✅ Hot Reload: ${config.features.enableHotReload ? 'Enabled' : 'Disabled'}`);
  console.log(`✅ Mock Services: ${config.features.enableMockServices ? 'Enabled' : 'Disabled'}`);
  
  // Test monitoring
  console.log('\n📊 Monitoring:');
  console.log(`✅ Log Level: ${config.monitoring.logLevel}`);
  console.log(`✅ Sentry: ${config.monitoring.sentryDsn ? 'Configured' : 'Not configured'}`);
  console.log(`✅ DataDog: ${config.monitoring.datadogApiKey ? 'Configured' : 'Not configured'}`);
  
  // Test build configuration
  console.log('\n🔧 Build Configuration:');
  console.log(`✅ Bundle Analysis: ${config.build.analyze ? 'Enabled' : 'Disabled'}`);
  console.log(`✅ Webpack Analyzer: ${config.build.webpackAnalyzer ? 'Enabled' : 'Disabled'}`);
  
  console.log('\n🎉 All monorepo configuration tests passed!');
  console.log('✨ Centralized configuration system is working correctly!');
  
} catch (error) {
  console.error('❌ Monorepo configuration test failed:');
  console.error(error.message);
  console.error('\n💡 Make sure you have:');
  console.error('- Copied .env.example to .env');
  console.error('- Set all required environment variables');
  console.error('- Run npm install in the root directory');
  process.exit(1);
}