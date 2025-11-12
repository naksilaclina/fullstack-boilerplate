const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 Starting Monorepo Development Environment...');

// Use centralized port configurations from monorepo config
const backendPort = process.env.API_PORT || 5000;
const frontendPort = process.env.WEB_PORT || 3000;

// Start the API server with its own environment variables
const apiProcess = spawn('npm', ['run', 'dev', '--workspace=@naksilaclina/server'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
  cwd: path.join(__dirname, '..', 'packages', 'apps', 'server'),
  env: {
    ...process.env,
    PORT: backendPort
  }
});

// Capture API stdout to detect when server is ready
let apiReady = false;
apiProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output); // Forward output to console
  
  // Check if API server has started
  if (output.includes('Server started on port') && !apiReady) {
    console.log('API server is ready!');
    apiReady = true;
    
    // Only seed if explicitly requested via environment variable
    if (process.env.RUN_SEED === 'true') {
      seedDatabase();
    } else {
      // Start frontend immediately without seeding
      startFrontend();
    }
  }
});

apiProcess.stderr.on('data', (data) => {
  process.stderr.write(data.toString()); // Forward errors to console
});

function seedDatabase() {
  console.log('Seeding database with test users...');
  const seedProcess = spawn('npm', ['run', 'seed', '--workspace=@naksilaclina/mongodb'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..', 'packages', 'modules', 'mongodb')
  });

  seedProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Database seeding completed successfully!');
    } else {
      console.error('Database seeding failed with exit code:', code);
    }
    
    // Start the frontend after seeding attempt
    startFrontend();
  });
}

function startFrontend() {
  console.log('Starting frontend...');
  const webProcess = spawn('npm', ['run', 'dev', '--workspace=@naksilaclina/web'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..', 'packages', 'apps', 'web'),
    env: {
      ...process.env,
      PORT: frontendPort,
      NEXT_PUBLIC_API_BASE_URL: `http://localhost:${backendPort}/api/v1`
    }
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    apiProcess.kill();
    webProcess.kill();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    apiProcess.kill();
    webProcess.kill();
    process.exit(0);
  });
}

// Handle case where API fails to start
apiProcess.on('close', (code) => {
  if (code !== 0 && !apiReady) {
    console.error('API process exited unexpectedly with code:', code);
    process.exit(1);
  }
});