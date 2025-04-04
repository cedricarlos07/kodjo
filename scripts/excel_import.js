/**
 * Script pour l'importation des fichiers Excel dans le système
 * 
 * Ce script exécute le traitement Python pour les fichiers Excel et
 * met à jour les cours dans la base de données
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Exécute le script Python de traitement du fichier Excel
 * @param {string} excelPath Chemin vers le fichier Excel
 * @returns {Promise<string>} Chemin vers le fichier JSON de sortie
 */
function processExcelFile(excelPath) {
  return new Promise((resolve, reject) => {
    console.log(`Traitement du fichier Excel: ${excelPath}`);
    
    const pythonProcess = spawn('python', ['scripts/excel_processor.py', excelPath]);
    
    let outputData = '';
    let errorData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Erreur lors du traitement Python (code ${code}): ${errorData}`);
        reject(new Error(`Erreur Python: ${errorData}`));
        return;
      }
      
      // Extraire le chemin du fichier JSON de la sortie
      const successMatch = outputData.match(/SUCCESS: (.+)/);
      if (successMatch) {
        const jsonPath = successMatch[1].trim();
        console.log(`Traitement Excel réussi, JSON généré: ${jsonPath}`);
        resolve(jsonPath);
      } else {
        console.error(`Sortie Python invalide: ${outputData}`);
        reject(new Error('Sortie Python invalide'));
      }
    });
  });
}

/**
 * Charge les cours depuis un fichier JSON
 * @param {string} jsonPath Chemin vers le fichier JSON
 * @returns {Promise<Array>} Tableau des cours
 */
async function loadCoursesFromJson(jsonPath) {
  return new Promise((resolve, reject) => {
    fs.readFile(jsonPath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Erreur lors de la lecture du fichier JSON: ${err.message}`);
        reject(err);
        return;
      }
      
      try {
        const courses = JSON.parse(data);
        console.log(`${courses.length} cours chargés depuis le JSON`);
        resolve(courses);
      } catch (parseErr) {
        console.error(`Erreur lors du parsing JSON: ${parseErr.message}`);
        reject(parseErr);
      }
    });
  });
}

/**
 * Met à jour les cours dans la base de données
 * @param {Array} courses Tableau des cours à mettre à jour
 * @returns {Promise<Object>} Résultat de la mise à jour
 */
async function updateCoursesInDatabase(courses) {
  return new Promise((resolve, reject) => {
    // Configurez le client HTTP en fonction de l'environnement (dev/prod)
    const client = process.env.NODE_ENV === 'production' ? https : http;
    const port = process.env.PORT || 5000;
    
    // Options de la requête
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/courses/batch-update',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(courses))
      }
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            console.log(`Mise à jour réussie: ${response.created} cours créés, ${response.updated} cours mis à jour`);
            resolve(response);
          } catch (err) {
            console.error(`Erreur lors du parsing de la réponse: ${err.message}`);
            reject(err);
          }
        } else {
          console.error(`Erreur HTTP ${res.statusCode}: ${data}`);
          reject(new Error(`Erreur HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`Erreur de requête: ${err.message}`);
      reject(err);
    });
    
    req.write(JSON.stringify(courses));
    req.end();
  });
}

/**
 * Nettoie les fichiers temporaires
 * @param {string} jsonPath Chemin vers le fichier JSON temporaire
 */
function cleanupTempFiles(jsonPath) {
  try {
    if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
      console.log(`Fichier temporaire supprimé: ${jsonPath}`);
    }
  } catch (err) {
    console.error(`Erreur lors de la suppression du fichier temporaire: ${err.message}`);
  }
}

/**
 * Fonction principale du script
 */
async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node excel_import.js <chemin_fichier_excel>');
    process.exit(1);
  }
  
  const excelPath = process.argv[2];
  let jsonPath = null;
  
  try {
    // Vérifier si le fichier Excel existe
    if (!fs.existsSync(excelPath)) {
      console.error(`Le fichier Excel n'existe pas: ${excelPath}`);
      process.exit(1);
    }
    
    // Traiter le fichier Excel
    jsonPath = await processExcelFile(excelPath);
    
    // Charger les cours depuis le JSON
    const courses = await loadCoursesFromJson(jsonPath);
    
    // Mettre à jour les cours dans la base de données
    const result = await updateCoursesInDatabase(courses);
    
    console.log(`Importation terminée avec succès: ${result.created} créés, ${result.updated} mis à jour, ${result.errors} erreurs`);
    
    // Nettoyer les fichiers temporaires si nécessaire
    // cleanupTempFiles(jsonPath);
    
    return {
      success: true,
      created: result.created,
      updated: result.updated,
      errors: result.errors
    };
    
  } catch (err) {
    console.error(`Erreur lors de l'importation: ${err.message}`);
    return {
      success: false,
      error: err.message
    };
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main().then(result => {
    if (!result.success) {
      process.exit(1);
    }
  }).catch(err => {
    console.error(`Erreur non gérée: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  processExcelFile,
  loadCoursesFromJson,
  updateCoursesInDatabase,
  cleanupTempFiles,
  main
};