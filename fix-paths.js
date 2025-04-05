const fs = require('fs');
const path = require('path');

// Fonction pour créer un répertoire s'il n'existe pas
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Créer les répertoires nécessaires
console.log('Creating necessary directories...');
ensureDirectoryExists('attached_assets');
ensureDirectoryExists('scripts/excel');
ensureDirectoryExists('temp');

// Créer des fichiers vides pour éviter les erreurs
console.log('Creating placeholder files...');
fs.writeFileSync('attached_assets/Kodjo English - Classes Schedules (2).xlsx', '');
fs.writeFileSync('scripts/excel/excel_processor.py', '');
fs.writeFileSync('temp_courses.json', '[]');

console.log('Directories and files created successfully!');
