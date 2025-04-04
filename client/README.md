# Telegram Notifier Client

Application client pour la gestion des notifications Telegram et des réunions Zoom.

## Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn
- Un serveur backend fonctionnel

## Installation

1. Cloner le dépôt :
```bash
git clone https://github.com/votre-username/telegram-notifier.git
cd telegram-notifier/client
```

2. Installer les dépendances :
```bash
npm install
# ou
yarn install
```

3. Configurer les variables d'environnement :
Créer un fichier `.env` à la racine du projet avec les variables suivantes :
```env
VITE_API_URL=http://localhost:5000
VITE_ZOOM_CLIENT_ID=votre_client_id
VITE_ZOOM_CLIENT_SECRET=votre_client_secret
VITE_TELEGRAM_BOT_TOKEN=votre_bot_token
```

## Développement

Pour démarrer le serveur de développement :
```bash
npm run dev
# ou
yarn dev
```

## Tests

Pour exécuter les tests :
```bash
npm run test
# ou
yarn test
```

## Construction

Pour construire l'application pour la production :
```bash
npm run build
# ou
yarn build
```

## Configuration des Tokens

### Zoom
1. Créer une application dans le [Zoom Marketplace](https://marketplace.zoom.us/)
2. Obtenir le Client ID et Client Secret
3. Configurer les URLs de redirection
4. Ajouter les tokens dans le fichier `.env`

### Telegram
1. Créer un bot via [@BotFather](https://t.me/BotFather) sur Telegram
2. Obtenir le token du bot
3. Ajouter le token dans le fichier `.env`

## Structure du Projet

```
src/
  ├── components/     # Composants React
  ├── services/      # Services d'API
  ├── hooks/         # Hooks personnalisés
  ├── types/         # Types TypeScript
  ├── utils/         # Fonctions utilitaires
  └── App.tsx        # Point d'entrée
```

## API

### Zoom
- `createMeeting`: Créer une réunion Zoom
- `getUpcomingMeetings`: Obtenir les réunions à venir
- `getMeeting`: Obtenir une réunion spécifique
- `deleteMeeting`: Supprimer une réunion

### Telegram
- `sendMessage`: Envoyer un message
- `getMessageHistory`: Obtenir l'historique des messages
- `getMessageStatus`: Obtenir le statut d'un message
- `scheduleMessage`: Programmer un message

## Contribution

1. Forker le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commiter les changements (`git commit -m 'Add some AmazingFeature'`)
4. Pousser vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 