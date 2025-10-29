const { spawn } = require('child_process');
const path = require('path');

console.log('Starting production environment...');

// Start the API server with its own environment variables
const apiProcess = spawn('npm', ['run', 'start', '--workspace=@naksilaclina/api'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..', 'packages', 'apps', 'api') // Set working directory to API app
});

// Wait a bit for API to start, then start the frontend with its own environment variables
setTimeout(() => {
  console.log('Starting frontend...');
  const webProcess = spawn('npm', ['run', 'start', '--workspace=@naksilaclina/web'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..', 'packages', 'apps', 'web') // Set working directory to web app
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
}, 3000); // Give API some time to start