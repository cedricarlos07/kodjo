#!/bin/bash

# Afficher les informations sur l'environnement
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Installer les dépendances
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Installer explicitement vite, esbuild et tailwindcss
echo "Installing vite, esbuild and tailwindcss..."
npm install vite@latest esbuild@latest @vitejs/plugin-react@latest tailwindcss@latest postcss@latest autoprefixer@latest --legacy-peer-deps

# Supprimer les dépendances Replit qui ne sont pas nécessaires
echo "Removing Replit dependencies..."
npm uninstall @replit/vite-plugin-shadcn-theme-json @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal --legacy-peer-deps || true

# Mettre à jour browserslist
echo "Updating browserslist database..."
npx update-browserslist-db@latest

# Copier les fichiers de configuration dans le répertoire client
echo "Copying configuration files to client directory..."
cp postcss.config.js client/
cp tailwind.config.js client/

# Exécuter le script de correction de chemin
echo "Running path fix script..."
node fix-paths.js

# Construire l'application
echo "Building application..."
npm run build

# Vérifier si le build a réussi
if [ -d "dist/public" ]; then
  echo "Build successful! Files in dist/public:"
  ls -la dist/public
else
  echo "Build failed or dist/public directory not found!"
  exit 1
fi

# Créer le fichier _redirects
echo "Creating _redirects file..."
echo "/*    /index.html   200" > dist/public/_redirects

echo "Build process completed successfully!"
