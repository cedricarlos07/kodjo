// Fichier JavaScript simple pour tester le chargement des ressources
console.log('Le fichier index.js a été chargé avec succès!');

// Afficher un message dans la page
document.addEventListener('DOMContentLoaded', function() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1>Test de chargement JavaScript</h1>
        <p>Si vous voyez ce message, cela signifie que le fichier JavaScript a été chargé correctement.</p>
        <p>Cliquez sur le bouton ci-dessous pour tester l'interactivité :</p>
        <button id="test-button" style="padding: 10px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Cliquer ici</button>
        <div id="result" style="margin-top: 20px;"></div>
      </div>
    `;

    // Ajouter un gestionnaire d'événements au bouton
    document.getElementById('test-button').addEventListener('click', function() {
      document.getElementById('result').innerHTML = `
        <div style="padding: 10px; background-color: #f8f8f8; border-radius: 4px;">
          <p style="color: green; font-weight: bold;">L'interactivité fonctionne correctement!</p>
          <p>Heure actuelle : ${new Date().toLocaleTimeString()}</p>
        </div>
      `;
    });
  } else {
    console.error('L\'élément avec l\'ID "root" n\'a pas été trouvé dans la page.');
  }
});
