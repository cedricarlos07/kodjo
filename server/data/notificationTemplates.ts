export interface NotificationTemplate {
  id: number;
  name: string;
  description: string;
  content: string;
  variables: string[];
  category: string;
  emoji: string;
}

// Modèles de notification prédéfinis
export const notificationTemplates: NotificationTemplate[] = [
  {
    id: 1,
    name: "Rappel de cours",
    description: "Rappel pour un cours à venir",
    content: "📚 **RAPPEL DE COURS**\n\nBonjour à tous !\n\nN'oubliez pas votre cours de {{courseName}} avec {{instructor}} qui aura lieu le {{date}} à {{time}}.\n\nLien Zoom : {{zoomLink}}\nID : {{zoomId}}\n\nBonne journée ! 😊",
    variables: ["courseName", "instructor", "date", "time", "zoomLink", "zoomId"],
    category: "Cours",
    emoji: "📚"
  },
  {
    id: 2,
    name: "Annulation de cours",
    description: "Notification d'annulation d'un cours",
    content: "❌ **ANNULATION DE COURS**\n\nCher(e)s étudiant(e)s,\n\nNous sommes désolés de vous informer que le cours de {{courseName}} prévu le {{date}} à {{time}} est annulé.\n\nNous vous tiendrons informés de la date de rattrapage.\n\nMerci de votre compréhension.",
    variables: ["courseName", "date", "time"],
    category: "Cours",
    emoji: "❌"
  },
  {
    id: 3,
    name: "Changement d'horaire",
    description: "Notification de changement d'horaire d'un cours",
    content: "⏰ **CHANGEMENT D'HORAIRE**\n\nCher(e)s étudiant(e)s,\n\nVeuillez noter que le cours de {{courseName}} avec {{instructor}} initialement prévu le {{date}} à {{time}} a été déplacé à {{newTime}}.\n\nLe lien Zoom reste inchangé : {{zoomLink}}\n\nMerci de votre compréhension.",
    variables: ["courseName", "instructor", "date", "time", "newTime", "zoomLink"],
    category: "Cours",
    emoji: "⏰"
  },
  {
    id: 4,
    name: "Nouveau document",
    description: "Notification de nouveau document disponible",
    content: "📝 **NOUVEAU DOCUMENT**\n\nCher(e)s étudiant(e)s,\n\nUn nouveau document est disponible pour le cours de {{courseName}}.\n\nTitre : {{documentTitle}}\nDescription : {{documentDescription}}\n\nVous pouvez le télécharger dès maintenant sur la plateforme.",
    variables: ["courseName", "documentTitle", "documentDescription"],
    category: "Documents",
    emoji: "📝"
  },
  {
    id: 5,
    name: "Rappel de devoir",
    description: "Rappel pour un devoir à rendre",
    content: "📌 **RAPPEL DE DEVOIR**\n\nCher(e)s étudiant(e)s,\n\nN'oubliez pas de rendre votre devoir pour le cours de {{courseName}} avant le {{dueDate}}.\n\nSujet : {{assignmentTitle}}\n\nBon courage !",
    variables: ["courseName", "dueDate", "assignmentTitle"],
    category: "Devoirs",
    emoji: "📌"
  },
  {
    id: 6,
    name: "Bienvenue",
    description: "Message de bienvenue pour les nouveaux étudiants",
    content: "👋 **BIENVENUE**\n\nCher(e) {{studentName}},\n\nNous sommes ravis de vous accueillir dans le cours de {{courseName}} avec {{instructor}}.\n\nVotre premier cours aura lieu le {{date}} à {{time}}.\n\nLien Zoom : {{zoomLink}}\nID : {{zoomId}}\nMot de passe : {{zoomPassword}}\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nBonne journée ! 😊",
    variables: ["studentName", "courseName", "instructor", "date", "time", "zoomLink", "zoomId", "zoomPassword"],
    category: "Administratif",
    emoji: "👋"
  },
  {
    id: 7,
    name: "Notification d'examen",
    description: "Information sur un examen à venir",
    content: "🔔 **EXAMEN À VENIR**\n\nCher(e)s étudiant(e)s,\n\nNous vous rappelons que l'examen de {{courseName}} aura lieu le {{examDate}} à {{examTime}}.\n\nSujet : {{examSubject}}\nDurée : {{examDuration}}\n\nBonne préparation !",
    variables: ["courseName", "examDate", "examTime", "examSubject", "examDuration"],
    category: "Examens",
    emoji: "🔔"
  },
  {
    id: 8,
    name: "Résultats d'examen",
    description: "Notification de publication des résultats d'examen",
    content: "📊 **RÉSULTATS D'EXAMEN**\n\nCher(e)s étudiant(e)s,\n\nLes résultats de l'examen de {{courseName}} sont maintenant disponibles sur la plateforme.\n\nVous pouvez les consulter dans votre espace personnel.\n\nBonne journée !",
    variables: ["courseName"],
    category: "Examens",
    emoji: "📊"
  },
  {
    id: 9,
    name: "Événement spécial",
    description: "Notification d'un événement spécial",
    content: "🎉 **ÉVÉNEMENT SPÉCIAL**\n\nCher(e)s étudiant(e)s,\n\nNous avons le plaisir de vous inviter à {{eventName}} qui aura lieu le {{eventDate}} à {{eventTime}}.\n\nLieu : {{eventLocation}}\nDescription : {{eventDescription}}\n\nNous espérons vous y voir nombreux !",
    variables: ["eventName", "eventDate", "eventTime", "eventLocation", "eventDescription"],
    category: "Événements",
    emoji: "🎉"
  },
  {
    id: 10,
    name: "Maintenance plateforme",
    description: "Notification de maintenance de la plateforme",
    content: "🔧 **MAINTENANCE PLATEFORME**\n\nCher(e)s utilisateurs/utilisatrices,\n\nNous vous informons qu'une maintenance de la plateforme est prévue le {{maintenanceDate}} de {{startTime}} à {{endTime}}.\n\nPendant cette période, la plateforme sera inaccessible.\n\nNous nous excusons pour la gêne occasionnée et vous remercions de votre compréhension.",
    variables: ["maintenanceDate", "startTime", "endTime"],
    category: "Administratif",
    emoji: "🔧"
  }
];

// Fonction pour récupérer tous les modèles de notification
export function getAllNotificationTemplates(): NotificationTemplate[] {
  return notificationTemplates;
}

// Fonction pour récupérer un modèle de notification par son ID
export function getNotificationTemplate(id: number): NotificationTemplate | undefined {
  return notificationTemplates.find(template => template.id === id);
}

// Fonction pour récupérer les modèles de notification par catégorie
export function getNotificationTemplatesByCategory(category: string): NotificationTemplate[] {
  return notificationTemplates.filter(template => template.category === category);
}
