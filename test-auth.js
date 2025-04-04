// Script pour tester l'authentification
import fetch from 'node-fetch';

async function testAuth() {
  try {
    console.log('Tentative de connexion...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Réponse de connexion:', loginResponse.status, loginData);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
  }
}

testAuth();
