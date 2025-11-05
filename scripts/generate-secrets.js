const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Function to generate cryptographically secure random string
function generateSecureSecret(length = 64) {
  // Ensure minimum length for security
  if (length < 32) {
    throw new Error('Secret length must be at least 32 characters for security');
  }
  return crypto.randomBytes(length).toString('hex');
}

// Function to update .env file with new secrets
function updateEnvFile(envPath, secrets) {
  let envContent = '';
  
  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add secrets
  for (const [key, value] of Object.entries(secrets)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const secretLine = `${key}=${value}`;
    
    if (envContent.match(regex)) {
      // Replace existing secret
      envContent = envContent.replace(regex, secretLine);
    } else {
      // Add new secret
      envContent += `\n${secretLine}`;
    }
  }
  
  // Write updated content back to .env file
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log(`Updated secrets in ${envPath}`);
}

// Function to update .env.example file
function updateEnvExample(envExamplePath) {
  let envExampleContent = '';
  
  // Read existing .env.example file if it exists
  if (fs.existsSync(envExamplePath)) {
    envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  }
  
  // Define secret keys to ensure they exist in .env.example
  const secretKeys = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  for (const key of secretKeys) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const exampleLine = `${key}=your-${key.toLowerCase().replace(/_/g, '-')}-here`;
    
    if (!envExampleContent.match(regex)) {
      // Add example secret line
      envExampleContent += `\n${exampleLine}`;
    }
  }
  
  // Write updated content back to .env.example file
  fs.writeFileSync(envExamplePath, envExampleContent.trim() + '\n');
  console.log(`Updated .env.example at ${envExamplePath}`);
}

// Generate secure secrets (64 bytes = 128 hex characters for strong security)
const jwtSecret = generateSecureSecret(64);
const refreshTokenSecret = generateSecureSecret(64);

// Validate secrets meet minimum security requirements
if (jwtSecret.length < 64) {
  console.error('❌ Generated JWT_SECRET is too short');
  process.exit(1);
}

if (refreshTokenSecret.length < 64) {
  console.error('❌ Generated JWT_REFRESH_SECRET is too short');
  process.exit(1);
}

const secrets = {
  JWT_SECRET: jwtSecret,
  JWT_REFRESH_SECRET: refreshTokenSecret
};

console.log('Generated secure secrets:');
console.log('JWT_SECRET:', jwtSecret);
console.log('JWT_REFRESH_SECRET:', refreshTokenSecret);

// Update root .env file
const rootEnvPath = path.join(__dirname, '..', '.env');
updateEnvFile(rootEnvPath, secrets);

// Update root .env.example file
const rootEnvExamplePath = path.join(__dirname, '..', '.env.example');
updateEnvExample(rootEnvExamplePath);

console.log('\n✅ Secret generation completed successfully!');
console.log('🔐 Secrets have been updated in the root .env file.');
console.log('⚠️  Remember to add .env files to your .gitignore to prevent exposing secrets!');