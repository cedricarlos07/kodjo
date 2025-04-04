import { Tutorial } from "@/components/ui/tutorial";

// Tutoriel pour le tableau de bord
export function DashboardTutorial() {
  return (
    <Tutorial
      title="Tutoriel du Tableau de Bord"
      description="Apprenez à utiliser le tableau de bord efficacement"
      steps={[
        {
          title: "Bienvenue sur le Tableau de Bord",
          description: "Le tableau de bord vous donne une vue d'ensemble de votre plateforme. Vous y trouverez des statistiques, des cours à venir, des notifications et plus encore.",
          tip: "Vous pouvez personnaliser votre tableau de bord en fonction de vos besoins."
        },
        {
          title: "Statistiques en temps réel",
          description: "Les cartes en haut du tableau de bord affichent des statistiques en temps réel sur les utilisateurs actifs, les cours, les sessions et les notifications.",
          tip: "Cliquez sur une carte pour accéder à des informations plus détaillées."
        },
        {
          title: "Cours à venir",
          description: "Cette section affiche les prochains cours programmés. Vous pouvez voir les détails du cours, l'instructeur et l'heure.",
          tip: "Cliquez sur 'Rejoindre' pour accéder directement au lien Zoom du cours."
        },
        {
          title: "Notifications récentes",
          description: "Consultez les dernières notifications envoyées aux utilisateurs et aux groupes.",
          tip: "Les notifications non lues sont mises en évidence avec un fond coloré."
        },
        {
          title: "Classement des utilisateurs",
          description: "Visualisez les utilisateurs les plus actifs sur la plateforme, triés par points d'engagement.",
          tip: "Vous pouvez filtrer le classement par période : quotidien, hebdomadaire ou mensuel."
        }
      ]}
    />
  );
}

// Tutoriel pour la gestion des cours
export function CoursesTutorial() {
  return (
    <Tutorial
      title="Tutoriel de Gestion des Cours"
      description="Apprenez à gérer efficacement vos cours"
      steps={[
        {
          title: "Bienvenue dans la Gestion des Cours",
          description: "Cette page vous permet de gérer tous les cours de votre plateforme. Vous pouvez ajouter, modifier, supprimer et filtrer les cours.",
          tip: "Utilisez les filtres pour trouver rapidement les cours qui vous intéressent."
        },
        {
          title: "Filtres dynamiques",
          description: "Les filtres s'adaptent automatiquement à la structure de vos cours. Vous pouvez filtrer par niveau, horaire, jour et heure.",
          tip: "Les filtres affichent le nombre de cours correspondants pour chaque option."
        },
        {
          title: "Ajouter un nouveau cours",
          description: "Cliquez sur le bouton 'Ajouter un cours' pour créer un nouveau cours. Remplissez les informations requises dans le formulaire.",
          tip: "Assurez-vous d'inclure un lien Zoom valide pour permettre aux étudiants de rejoindre le cours."
        },
        {
          title: "Modifier ou supprimer un cours",
          description: "Utilisez les boutons d'action à droite de chaque cours pour le modifier ou le supprimer.",
          tip: "La suppression d'un cours est définitive. Assurez-vous de vouloir vraiment le supprimer."
        },
        {
          title: "Organisation des cours",
          description: "Les cours sont organisés par niveau, horaire et instructeur pour faciliter la gestion.",
          tip: "Vous pouvez cliquer sur l'en-tête d'une colonne pour trier les cours selon ce critère."
        }
      ]}
    />
  );
}

// Tutoriel pour les scénarios
export function ScenariosTutorial() {
  return (
    <Tutorial
      title="Tutoriel des Scénarios"
      description="Apprenez à configurer et gérer les scénarios d'automatisation"
      steps={[
        {
          title: "Bienvenue dans la Gestion des Scénarios",
          description: "Les scénarios vous permettent d'automatiser l'envoi de notifications et d'autres tâches selon un calendrier défini.",
          tip: "Utilisez les scénarios pour envoyer des rappels automatiques avant les cours."
        },
        {
          title: "Créer un nouveau scénario",
          description: "Cliquez sur 'Ajouter un scénario' pour créer un nouveau scénario. Donnez-lui un nom, une description et configurez son type.",
          tip: "Choisissez entre les types 'notification' et 'automatisation' selon vos besoins."
        },
        {
          title: "Configurer la planification",
          description: "Définissez quand le scénario doit s'exécuter en configurant l'heure, les jours et la fréquence.",
          tip: "Pour un rappel de cours, programmez-le 1 heure avant le début du cours."
        },
        {
          title: "Exécuter manuellement un scénario",
          description: "Vous pouvez exécuter un scénario manuellement en cliquant sur le bouton 'Play' à côté du scénario.",
          tip: "Utilisez cette fonction pour tester un scénario avant de l'activer."
        },
        {
          title: "Exécuter tous les scénarios",
          description: "Le bouton 'Exécuter tous' en haut de la page vous permet d'exécuter tous les scénarios actifs en même temps.",
          tip: "Utilisez cette fonction avec précaution, car elle déclenchera toutes les notifications configurées."
        }
      ]}
    />
  );
}

// Tutoriel pour les modèles de notification
export function NotificationTemplatesTutorial() {
  return (
    <Tutorial
      title="Tutoriel des Modèles de Notification"
      description="Apprenez à créer et gérer des modèles de notification"
      steps={[
        {
          title: "Bienvenue dans les Modèles de Notification",
          description: "Les modèles de notification vous permettent de créer des messages standardisés pour différents canaux de communication.",
          tip: "Créez des modèles distincts pour différents types de cours ou d'événements."
        },
        {
          title: "Créer un nouveau modèle",
          description: "Cliquez sur 'Ajouter un modèle' pour créer un nouveau modèle. Donnez-lui un nom, une description et sélectionnez le type de canal.",
          tip: "Vous pouvez créer des modèles pour Telegram, Email ou SMS."
        },
        {
          title: "Utiliser des variables",
          description: "Insérez des variables dans votre modèle en les entourant de doubles accolades, par exemple: {{courseName}}, {{instructor}}, {{date}}.",
          tip: "Les variables seront automatiquement remplacées par les valeurs réelles lors de l'envoi de la notification."
        },
        {
          title: "Prévisualiser et tester",
          description: "Utilisez le bouton 'Œil' pour prévisualiser votre modèle et l'envoyer à un groupe de test.",
          tip: "Testez toujours vos modèles avant de les utiliser en production."
        },
        {
          title: "Modifier ou supprimer un modèle",
          description: "Utilisez les boutons d'action à droite de chaque modèle pour le modifier ou le supprimer.",
          tip: "Si vous modifiez un modèle utilisé par des scénarios actifs, assurez-vous que les variables restent cohérentes."
        }
      ]}
    />
  );
}

// Tutoriel pour les liens Zoom
export function ZoomLinksTutorial() {
  return (
    <Tutorial
      title="Tutoriel des Liens Zoom"
      description="Apprenez à gérer les liens Zoom pour vos groupes"
      steps={[
        {
          title: "Bienvenue dans la Gestion des Liens Zoom",
          description: "Cette page vous permet de gérer les liens Zoom associés à vos groupes Telegram, niveaux de cours et instructeurs.",
          tip: "Organisez vos liens Zoom pour faciliter l'accès aux cours en ligne."
        },
        {
          title: "Ajouter un nouveau lien Zoom",
          description: "Cliquez sur 'Ajouter un lien Zoom' pour créer une nouvelle association. Remplissez les informations requises dans le formulaire.",
          tip: "Incluez l'ID et le mot de passe Zoom pour faciliter l'accès aux participants."
        },
        {
          title: "Associer à un groupe Telegram",
          description: "Sélectionnez le groupe Telegram auquel ce lien Zoom sera associé.",
          tip: "Vous pouvez également spécifier un niveau, un horaire ou un instructeur pour une association plus précise."
        },
        {
          title: "Filtrer les liens",
          description: "Utilisez les onglets en haut pour filtrer les liens par niveau, horaire ou instructeur.",
          tip: "Cela vous permet de trouver rapidement le lien Zoom dont vous avez besoin."
        },
        {
          title: "Copier les informations",
          description: "Utilisez les boutons de copie pour copier rapidement le lien, l'ID ou le mot de passe Zoom dans le presse-papiers.",
          tip: "Pratique pour partager rapidement les informations de connexion avec un participant."
        }
      ]}
    />
  );
}

// Tutoriel pour le simulateur de notifications
export function NotificationSimulatorTutorial() {
  return (
    <Tutorial
      title="Tutoriel du Simulateur de Notifications"
      description="Apprenez à tester vos notifications sans impacter les vrais groupes"
      steps={[
        {
          title: "Bienvenue dans le Simulateur de Notifications",
          description: "Le simulateur vous permet de tester vos notifications avant de les envoyer aux vrais groupes.",
          tip: "Utilisez toujours le simulateur pour vérifier que vos notifications s'affichent correctement."
        },
        {
          title: "Sélectionner un modèle",
          description: "Commencez par sélectionner le modèle de notification que vous souhaitez tester.",
          tip: "Vous pouvez voir les variables disponibles pour ce modèle dans la section Variables."
        },
        {
          title: "Configurer les variables",
          description: "Remplissez les valeurs des variables qui seront utilisées dans votre notification.",
          tip: "Essayez différentes valeurs pour voir comment elles s'affichent dans la notification."
        },
        {
          title: "Choisir le groupe cible",
          description: "Par défaut, les notifications sont envoyées au groupe de test. Vous pouvez désactiver cette option pour sélectionner un vrai groupe.",
          tip: "Même si vous sélectionnez un vrai groupe, en mode simulation, la notification sera toujours envoyée uniquement au groupe de test."
        },
        {
          title: "Consulter les logs",
          description: "Après avoir simulé une notification, consultez les logs pour voir si elle a été envoyée avec succès.",
          tip: "Les logs vous aideront à diagnostiquer les problèmes éventuels avec vos notifications."
        }
      ]}
    />
  );
}

// Tutoriel pour les utilisateurs
export function UsersTutorial() {
  return (
    <Tutorial
      title="Tutoriel de Gestion des Utilisateurs"
      description="Apprenez à gérer les utilisateurs de votre plateforme"
      steps={[
        {
          title: "Bienvenue dans la Gestion des Utilisateurs",
          description: "Cette page vous permet de gérer tous les utilisateurs de votre plateforme.",
          tip: "Utilisez les filtres pour trouver rapidement des utilisateurs spécifiques."
        },
        {
          title: "Ajouter un nouvel utilisateur",
          description: "Cliquez sur 'Ajouter un utilisateur' pour créer un nouveau compte utilisateur.",
          tip: "Assurez-vous de définir les bonnes permissions lors de la création d'un utilisateur."
        },
        {
          title: "Modifier les informations utilisateur",
          description: "Cliquez sur l'icône d'édition pour modifier les informations d'un utilisateur existant.",
          tip: "Vous pouvez mettre à jour le profil, les coordonnées et les préférences de l'utilisateur."
        },
        {
          title: "Gérer les permissions",
          description: "Définissez les rôles et les permissions pour contrôler ce que chaque utilisateur peut faire sur la plateforme.",
          tip: "Limitez les permissions administratives aux utilisateurs de confiance uniquement."
        },
        {
          title: "Désactiver un compte",
          description: "Si nécessaire, vous pouvez désactiver temporairement un compte utilisateur sans le supprimer.",
          tip: "La désactivation est préférable à la suppression si l'utilisateur pourrait revenir plus tard."
        }
      ]}
    />
  );
}

// Tutoriel pour les paramètres
export function SettingsTutorial() {
  return (
    <Tutorial
      title="Tutoriel des Paramètres"
      description="Apprenez à configurer votre plateforme"
      steps={[
        {
          title: "Bienvenue dans les Paramètres",
          description: "Cette page vous permet de configurer les paramètres globaux de votre plateforme.",
          tip: "Prenez le temps de parcourir toutes les options pour personnaliser la plateforme selon vos besoins."
        },
        {
          title: "Paramètres généraux",
          description: "Configurez le nom de la plateforme, le logo, les couleurs et d'autres éléments visuels.",
          tip: "Personnalisez l'apparence pour qu'elle corresponde à votre marque."
        },
        {
          title: "Configuration des notifications",
          description: "Définissez les paramètres par défaut pour les notifications, comme les délais d'envoi et les formats.",
          tip: "Configurez des délais de rappel adaptés aux besoins de vos utilisateurs."
        },
        {
          title: "Intégrations",
          description: "Configurez les intégrations avec Telegram, Zoom et d'autres services externes.",
          tip: "Assurez-vous que les tokens d'API sont à jour pour éviter les interruptions de service."
        },
        {
          title: "Sauvegarder vos paramètres",
          description: "N'oubliez pas de sauvegarder vos modifications avant de quitter la page.",
          tip: "Testez vos paramètres après les avoir modifiés pour vous assurer qu'ils fonctionnent comme prévu."
        }
      ]}
    />
  );
}
