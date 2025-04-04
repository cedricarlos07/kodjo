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

  // Afficher les versions de Node.js
  console.log('Environment information:');
  try {
    console.log('Node version:', execSync('node --version').toString().trim());
    console.log('NPM version:', execSync('npm --version').toString().trim());
    // Ne pas essayer d'exécuter Python car il peut ne pas être disponible
    console.log('Python: Skipping Python version check');
  } catch (e) {
    console.log('Could not determine environment versions:', e.message);
  }

  // Installer les dépendances manquantes
  console.log('Installing missing dependencies...');
  execSync('npm install @tanstack/react-table react-countup jspdf jspdf-autotable file-saver --legacy-peer-deps', { stdio: 'inherit' });

  // Mettre à jour les données de browserslist
  console.log('Updating browserslist database...');
  try {
    execSync('npx update-browserslist-db@latest', { stdio: 'inherit' });
    console.log('Browserslist database updated successfully');
  } catch (error) {
    console.warn('Warning: Failed to update browserslist database, but continuing build:', error.message);
  }

  // Exécuter le build du client avec Vite
  console.log('Building client with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Copier le fichier index.html dans le répertoire dist
  console.log('Copying index.html to dist directory...');
  if (fs.existsSync('dist/public/index.html')) {
    ensureDirectoryExists('dist');
    fs.copyFileSync('dist/public/index.html', 'dist/index.html');
    console.log('index.html copied successfully');
  } else {
    console.log('index.html not found in dist/public');
  }

  // Copier le répertoire assets dans le répertoire dist
  console.log('Copying assets to dist directory...');
  if (fs.existsSync('dist/public/assets')) {
    ensureDirectoryExists('dist/assets');
    const assets = fs.readdirSync('dist/public/assets');
    assets.forEach(asset => {
      const sourcePath = `dist/public/assets/${asset}`;
      const destPath = `dist/assets/${asset}`;
      if (fs.statSync(sourcePath).isDirectory()) {
        // Copier récursivement le répertoire
        execSync(`cp -r "${sourcePath}" "${path.dirname(destPath)}"`);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    });
    console.log('Assets copied successfully');
  } else {
    console.log('Assets directory not found in dist/public');
  }

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

  // Créer un fichier _redirects dans le répertoire dist
  console.log('Creating _redirects file in dist directory...');
  ensureDirectoryExists('dist');
  fs.writeFileSync('dist/_redirects', '/*    /index.html   200');
  console.log('_redirects file created successfully');

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
