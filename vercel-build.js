const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Vérifier si les dépendances sont installées
try {
  // Exécuter le build du client avec Vite
  console.log('Building client with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Exécuter le build du serveur avec esbuild
  console.log('Building server with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
