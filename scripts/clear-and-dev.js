const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clear console based on platform
function clearConsole() {
  if (process.platform === 'win32') {
    // Windows
    console.clear();
  } else {
    // Unix/Linux/Mac
    process.stdout.write('\x1Bc');
  }
}

// Delete directory recursively
function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  }
  return false;
}

// Main function
async function clearAndDev() {
  // Clear the console first
  clearConsole();
  
  console.log('🧹 Clearing caches...\n');
  
  // List of directories to clean
  const dirsToClean = [
    '.next',
    'node_modules/.cache',
    '.next-pwa'
  ];
  
  let cleanedCount = 0;
  
  // Clean each directory
  dirsToClean.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (deleteDirectory(fullPath)) {
      console.log(`✅ Cleared: ${dir}`);
      cleanedCount++;
    }
  });
  
  if (cleanedCount === 0) {
    console.log('ℹ️  No caches found to clear');
  }
  
  console.log('\n✨ Cache cleared successfully!\n');
  console.log('🚀 Starting development server...\n');
  console.log('─'.repeat(50) + '\n');
  
  // Run npm run dev
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle process exit
  devProcess.on('close', (code) => {
    process.exit(code);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    devProcess.kill('SIGINT');
    process.exit(0);
  });
  
  // Handle termination
  process.on('SIGTERM', () => {
    devProcess.kill('SIGTERM');
    process.exit(0);
  });
}

// Run the script
clearAndDev().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
}); 