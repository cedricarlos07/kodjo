const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fonction pour créer un répertoire s'il n'existe pas
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

try {
  console.log('Starting custom build process for Netlify...');
  
  // Installer les dépendances manquantes
  console.log('Installing missing dependencies...');
  execSync('npm install @tanstack/react-table react-countup --legacy-peer-deps', { stdio: 'inherit' });
  
  // Exécuter le build du client avec Vite
  console.log('Building client with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Exécuter le build du serveur avec esbuild
  console.log('Building server with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  // Créer le répertoire pour les fonctions Netlify
  console.log('Setting up Netlify functions...');
  ensureDirectoryExists('netlify/functions');
  
  // Copier le fichier api.js dans le répertoire des fonctions Netlify
  if (fs.existsSync('netlify/functions/api.js')) {
    console.log('Copying API function to dist/functions...');
    ensureDirectoryExists('dist/functions');
    fs.copyFileSync('netlify/functions/api.js', 'dist/functions/api.js');
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
