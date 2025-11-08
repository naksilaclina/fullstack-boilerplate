const fs = require('fs');
const path = require('path');

function removeRecursive(dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            if (fs.lstatSync(dirPath).isDirectory()) {
                fs.rmSync(dirPath, { recursive: true, force: true });
                console.log(`✓ Removed directory: ${dirPath}`);
            } else {
                fs.unlinkSync(dirPath);
                console.log(`✓ Removed file: ${dirPath}`);
            }
        }
    } catch (error) {
        console.log(`⚠ Could not remove ${dirPath}: ${error.message}`);
    }
}

function removeGlob(pattern) {
    const dir = path.dirname(pattern);
    const filename = path.basename(pattern);

    try {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const regex = new RegExp(filename.replace(/\*/g, '.*'));

            files.forEach(file => {
                if (regex.test(file)) {
                    const filePath = path.join(dir, file);
                    removeRecursive(filePath);
                }
            });
        }
    } catch (error) {
        console.log(`⚠ Could not process pattern ${pattern}: ${error.message}`);
    }
}

console.log('🧹 Cleaning build artifacts and temporary files...');

// Remove directories
removeRecursive('dist');
removeRecursive('packages/apps/web/.next');
removeRecursive('packages/apps/api/dist');

// Remove generated files in config
removeGlob('config/*.js');
removeGlob('config/*.d.ts');
removeGlob('config/*.d.ts.map');

// Remove log files if any
removeGlob('*.log');
removeGlob('packages/**/*.log');

// Remove temporary files
removeGlob('.tmp');
removeGlob('packages/**/.tmp');

console.log('✅ Clean completed!');