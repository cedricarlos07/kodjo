import pkg from 'xlsx';
const { readFile, utils } = pkg;
import { writeFileSync } from 'fs';

// Charger le fichier Excel
const workbook = readFile('../attached_assets/Kodjo English - Classes Schedules (2).xlsx');

// Obtenir la feuille "Fix Schedule"
const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('fix') && name.toLowerCase().includes('schedule'));

if (!sheetName) {
  console.error("Feuille 'Fix Schedule' non trouvée");
  process.exit(1);
}

const worksheet = workbook.Sheets[sheetName];
const data = utils.sheet_to_json(worksheet);

// Transformer les données pour correspondre à notre structure de cours
const courses = data.map((row, index) => {
  // Essayer de déduire le jour de la semaine, l'heure, etc.
  let dayOfWeek = '';
  let time = '';
  let name = '';
  let instructor = 'Kodjo';
  let zoomLink = '';
  let telegramGroup = '';
  let professorName = '';
  let level = '';
  let schedule = '';

  // Vérifier les colonnes qui pourraient contenir des informations utiles
  for (const key in row) {
    const value = row[key];
    const lowerKey = key.toLowerCase();
    
    // Jour de la semaine
    if (lowerKey.includes('day') || lowerKey.includes('date')) {
      dayOfWeek = String(value);
    }
    
    // Heure
    else if (lowerKey.includes('time') || lowerKey.includes('hour')) {
      time = String(value);
    }
    
    // Nom du cours
    else if (lowerKey.includes('course') || lowerKey.includes('class') || lowerKey.includes('subject')) {
      name = String(value);
    }
    
    // Lien Zoom
    else if (lowerKey.includes('zoom') || lowerKey.includes('link')) {
      zoomLink = String(value);
    }
    
    // Groupe Telegram
    else if (lowerKey.includes('telegram') || lowerKey.includes('group')) {
      telegramGroup = String(value);
    }
  }

  // Si le nom du cours n'est pas défini, essayons d'utiliser une autre colonne significative
  if (!name) {
    for (const key in row) {
      if (!key.toLowerCase().includes('day') && 
          !key.toLowerCase().includes('time') && 
          !key.toLowerCase().includes('hour')) {
        name = String(row[key]);
        break;
      }
    }
  }

  // Si le nom est toujours vide, utilisons quelque chose de générique
  if (!name) {
    name = `English Class ${index + 1}`;
  }

  // Extraire des informations supplémentaires à partir du nom du cours
  // Format typique: "Mina Lepsanovic - BBG - MW - 7:30pm"
  if (name) {
    const parts = name.split('-').map(part => part.trim());
    
    // Premier élément est généralement le nom du professeur
    if (parts.length > 0) {
      professorName = parts[0];
    }
    
    // Deuxième élément est généralement le niveau
    if (parts.length > 1) {
      level = parts[1];
    }
    
    // Troisième élément est généralement le planning (MW, TT, etc.)
    if (parts.length > 2) {
      schedule = parts[2];
    }
  }

  return {
    id: index + 1,
    name,
    instructor,
    professorName,
    level,
    schedule,
    dayOfWeek: dayOfWeek || 'Monday', // Valeur par défaut
    time: time || '18:00', // Valeur par défaut
    zoomLink: zoomLink || 'https://zoom.us/j/meeting', // Valeur par défaut
    telegramGroup: telegramGroup || `group_${index + 1}` // Valeur par défaut
  };
}).filter(course => {
  // Filtrer les lignes vides ou invalides
  return course.name && course.name !== 'undefined';
});

// Afficher les cours extraits
console.log(JSON.stringify(courses, null, 2));

// Enregistrer dans un fichier
writeFileSync('./scripts/courses.json', JSON.stringify(courses, null, 2));
console.log(`Extracted ${courses.length} courses and saved to scripts/courses.json`);