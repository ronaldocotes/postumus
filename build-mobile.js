const fs = require('fs');
const path = require('path');

// Cria pasta temporária para APIs
const apiDir = path.join(__dirname, 'src', 'app', 'api');
const apiBackupDir = path.join(__dirname, 'src', 'app', 'api-backup');

// Move APIs para backup
if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, apiBackupDir);
  console.log('APIs movidas para backup');
}

// Executa build
const { execSync } = require('child_process');

try {
  execSync('next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build falhou:', error);
} finally {
  // Restaura APIs
  if (fs.existsSync(apiBackupDir)) {
    fs.renameSync(apiBackupDir, apiDir);
    console.log('APIs restauradas');
  }
}
