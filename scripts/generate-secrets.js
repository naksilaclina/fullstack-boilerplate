#!/usr/bin/env node

/**
 * Monorepo Secret Generator
 * Generates secure random secrets for JWT tokens and other sensitive configurations
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate a cryptographically secure random string
 */
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate all required secrets
 */
function generateSecrets() {
  const secrets = {
    JWT_SECRET: generateSecret(32), // 64 hex chars = 32 bytes
    JWT_REFRESH_SECRET: generateSecret(32),
    NEXTAUTH_SECRET: generateSecret(16), // 32 hex chars = 16 bytes
    MONGODB_ENCRYPTION_KEY: generateSecret(32),
  };

  return secrets;
}

/**
 * Update .env file with generated secrets
 */
function updateEnvFile(secrets) {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  let envContent = '';

  // Check if .env exists, if not copy from .env.example
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      console.log('📋 Creating .env from .env.example...');
      envContent = fs.readFileSync(envExamplePath, 'utf8');
    } else {
      console.error('❌ Neither .env nor .env.example found!');
      process.exit(1);
    }
  } else {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Replace placeholder secrets with generated ones
  Object.entries(secrets).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const replacement = `${key}=${value}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, replacement);
      console.log(`✅ Updated ${key}`);
    } else {
      // Add the secret if it doesn't exist
      envContent += `\n${replacement}`;
      console.log(`➕ Added ${key}`);
    }
  });

  // Write updated content back to .env
  fs.writeFileSync(envPath, envContent);
  console.log(`💾 Secrets saved to ${envPath}`);
}

/**
 * Display security recommendations
 */
function showSecurityRecommendations() {
  console.log('\n🔒 Security Recommendations:');
  console.log('================================');
  console.log('1. Never commit .env file to version control');
  console.log('2. Use different secrets for each environment');
  console.log('3. Rotate secrets regularly in production');
  console.log('4. Store production secrets in secure vault');
  console.log('5. Enable SSL/TLS in production');
  console.log('6. Configure proper CORS origins');
  console.log('7. Set up monitoring and alerting');
  console.log('\n📚 Next Steps:');
  console.log('- Review and update MONGODB_URI with your credentials');
  console.log('- Set CLIENT_URL to your actual domain(s)');
  console.log('- Configure SSL certificates for production');
  console.log('- Set up monitoring services (Sentry, DataDog)');
}

/**
 * Main execution
 */
function main() {
  console.log('🔐 Monorepo Secret Generator');
  console.log('============================');
  
  try {
    const secrets = generateSecrets();
    
    console.log('🎲 Generated secure secrets:');
    Object.keys(secrets).forEach(key => {
      console.log(`- ${key}: ${secrets[key].substring(0, 8)}...`);
    });
    
    updateEnvFile(secrets);
    showSecurityRecommendations();
    
    console.log('\n🎉 Secret generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error generating secrets:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSecrets, updateEnvFile };