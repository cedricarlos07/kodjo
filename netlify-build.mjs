import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel (équivalent à __dirname en CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour créer un répertoire s'il n'existe pas
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

try {
  console.log('Starting custom build process for Netlify...');

  // Afficher les versions de Node.js et Python
  console.log('Environment information:');
  try {
    console.log('Node version:', execSync('node --version').toString().trim());
    console.log('NPM version:', execSync('npm --version').toString().trim());
    console.log('Python version:', execSync('python --version').toString().trim());
  } catch (e) {
    console.log('Could not determine all environment versions:', e.message);
  }

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
