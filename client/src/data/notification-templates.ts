/**
 * Modèles de notifications prédéfinis
 * Ces modèles peuvent être utilisés comme exemples ou comme base pour créer de nouveaux modèles
 */

export interface NotificationTemplateExample {
  id: string;
  name: string;
  description: string;
  type: 'telegram' | 'email' | 'sms';
  content: string;
  variables: string[];
}

export const notificationTemplates: NotificationTemplateExample[] = [
  // Rappels de cours
  {
    id: 'course-reminder-1',
    name: 'Rappel de cours - Standard',
    description: 'Rappel envoyé 1 heure avant le début d\'un cours',
    type: 'telegram',
    content: `🔔 *RAPPEL DE COURS* 🔔

📚 *{{courseName}}*
👨‍🏫 Coach: {{instructor}}
📅 Date: {{date}}
⏰ Heure: {{time}}

🔗 *Lien Zoom:* {{zoomLink}}
🆔 ID: {{zoomId}}
🔑 Mot de passe: {{zoomPassword}}

Nous vous attendons en ligne ! 👋`,
    variables: ['courseName', 'instructor', 'date', 'time', 'zoomLink', 'zoomId', 'zoomPassword']
  },
  {
    id: 'course-reminder-2',
    name: 'Rappel de cours - Détaillé',
    description: 'Rappel détaillé avec programme du cours et conseils de préparation',
    type: 'telegram',
    content: `📣 *VOTRE COURS COMMENCE BIENTÔT* 📣

Bonjour à tous ! 👋

Votre cours *{{courseName}}* avec {{instructor}} commence dans 1 heure.

📋 *DÉTAILS DU COURS:*
📅 Date: {{date}}
⏰ Heure: {{time}}
⏱️ Durée: {{duration}} minutes

🔍 *PROGRAMME DU JOUR:*
{{courseProgram}}

🖥️ *INFORMATIONS DE CONNEXION:*
🔗 Lien: {{zoomLink}}
🆔 ID: {{zoomId}}
🔑 Mot de passe: {{zoomPassword}}

⚠️ *CONSEILS:*
- Connectez-vous 5 minutes avant le début
- Préparez vos questions à l'avance
- Testez votre micro et votre caméra

À très vite ! 🚀`,
    variables: ['courseName', 'instructor', 'date', 'time', 'duration', 'courseProgram', 'zoomLink', 'zoomId', 'zoomPassword']
  },
  
  // Notifications de changement
  {
    id: 'course-change-1',
    name: 'Changement d\'horaire',
    description: 'Notification de changement d\'horaire pour un cours',
    type: 'telegram',
    content: `⚠️ *CHANGEMENT D'HORAIRE* ⚠️

Chers étudiants,

Nous vous informons que l'horaire du cours *{{courseName}}* a été modifié.

📅 *NOUVELLE DATE:* {{newDate}}
⏰ *NOUVEL HORAIRE:* {{newTime}}
👨‍🏫 Coach: {{instructor}}

🔄 Ce changement remplace l'horaire précédent ({{oldDate}} à {{oldTime}}).

En cas d'indisponibilité, veuillez contacter l'administration.

Merci de votre compréhension ! 🙏`,
    variables: ['courseName', 'instructor', 'newDate', 'newTime', 'oldDate', 'oldTime']
  },
  {
    id: 'course-cancel-1',
    name: 'Annulation de cours',
    description: 'Notification d\'annulation d\'un cours',
    type: 'telegram',
    content: `❌ *COURS ANNULÉ* ❌

Chers étudiants,

Nous sommes au regret de vous informer que le cours *{{courseName}}* prévu le {{date}} à {{time}} est **annulé**.

📝 *RAISON:* {{cancellationReason}}

🔄 *REPROGRAMMATION:*
{{reschedulingInfo}}

Nous nous excusons pour ce désagrément et vous remercions pour votre compréhension.

Pour toute question, contactez l'administration. 📞`,
    variables: ['courseName', 'date', 'time', 'cancellationReason', 'reschedulingInfo']
  },
  
  // Notifications de nouveaux cours
  {
    id: 'new-course-1',
    name: 'Nouveau cours disponible',
    description: 'Annonce d\'un nouveau cours disponible',
    type: 'telegram',
    content: `🆕 *NOUVEAU COURS DISPONIBLE* 🆕

🎓 Nous sommes ravis de vous annoncer l'ouverture d'un nouveau cours !

📚 *{{courseName}}*
👨‍🏫 Coach: {{instructor}}
🏆 Niveau: {{level}}
📅 Jours: {{schedule}}
⏰ Heure: {{time}}

📝 *DESCRIPTION DU COURS:*
{{courseDescription}}

📊 *OBJECTIFS D'APPRENTISSAGE:*
{{learningObjectives}}

👥 *PLACES LIMITÉES:* {{availableSeats}} places disponibles

🔗 Pour vous inscrire, cliquez ici: {{registrationLink}}

⏳ Date limite d'inscription: {{registrationDeadline}}

Ne manquez pas cette opportunité ! 🚀`,
    variables: ['courseName', 'instructor', 'level', 'schedule', 'time', 'courseDescription', 'learningObjectives', 'availableSeats', 'registrationLink', 'registrationDeadline']
  },
  
  // Notifications de résultats
  {
    id: 'results-1',
    name: 'Résultats d\'évaluation',
    description: 'Notification des résultats d\'une évaluation',
    type: 'telegram',
    content: `📊 *RÉSULTATS D'ÉVALUATION* 📊

Chers étudiants,

Les résultats de l'évaluation *{{evaluationName}}* pour le cours *{{courseName}}* sont maintenant disponibles !

📈 *STATISTIQUES DE GROUPE:*
Moyenne: {{averageScore}}
Note la plus haute: {{highestScore}}
Taux de réussite: {{successRate}}%

🔍 Pour consulter vos résultats personnels, connectez-vous à votre espace étudiant:
{{resultsLink}}

📝 *COMMENTAIRES DU COACH:*
{{coachFeedback}}

🏆 Félicitations à tous pour vos efforts ! 👏`,
    variables: ['evaluationName', 'courseName', 'averageScore', 'highestScore', 'successRate', 'resultsLink', 'coachFeedback']
  },
  
  // Notifications de devoirs
  {
    id: 'homework-1',
    name: 'Rappel de devoir',
    description: 'Rappel pour un devoir à rendre',
    type: 'telegram',
    content: `📝 *RAPPEL DE DEVOIR* 📝

⚠️ *DATE LIMITE APPROCHE !* ⚠️

Chers étudiants du cours *{{courseName}}*,

N'oubliez pas de rendre votre devoir *{{homeworkName}}* avant le:
📅 {{dueDate}}
⏰ {{dueTime}}

📋 *CONSIGNES:*
{{homeworkInstructions}}

📤 *MÉTHODE DE REMISE:*
{{submissionMethod}}

❓ Pour toute question, contactez votre coach {{instructor}}.

Bon courage ! 💪`,
    variables: ['courseName', 'homeworkName', 'dueDate', 'dueTime', 'homeworkInstructions', 'submissionMethod', 'instructor']
  },
  
  // Notifications de bienvenue
  {
    id: 'welcome-1',
    name: 'Message de bienvenue',
    description: 'Message de bienvenue pour les nouveaux étudiants',
    type: 'telegram',
    content: `👋 *BIENVENUE DANS NOTRE COMMUNAUTÉ !* 👋

Cher/Chère {{studentName}},

Nous sommes ravis de vous accueillir dans le cours *{{courseName}}* !

🎯 *VOTRE PARCOURS D'APPRENTISSAGE:*
Niveau: {{level}}
Coach: {{instructor}}
Horaire: {{schedule}} à {{time}}

📱 *RESTEZ CONNECTÉ(E):*
- Ce groupe Telegram pour les annonces importantes
- Notre plateforme d'apprentissage: {{learningPlatformLink}}
- Email de support: {{supportEmail}}

📅 *PROCHAINES ÉTAPES:*
1. Complétez votre profil
2. Explorez les ressources du cours
3. Participez à la session d'orientation le {{orientationDate}}

🔍 *BESOIN D'AIDE?*
N'hésitez pas à contacter notre équipe de support !

Nous vous souhaitons un excellent apprentissage ! 🚀`,
    variables: ['studentName', 'courseName', 'level', 'instructor', 'schedule', 'time', 'learningPlatformLink', 'supportEmail', 'orientationDate']
  },
  
  // Notifications d'événements
  {
    id: 'event-1',
    name: 'Annonce d\'événement',
    description: 'Notification pour un événement spécial',
    type: 'telegram',
    content: `🎉 *ÉVÉNEMENT SPÉCIAL* 🎉

Nous avons le plaisir de vous inviter à notre événement:

✨ *{{eventName}}* ✨

📅 Date: {{eventDate}}
⏰ Heure: {{eventTime}}
📍 Lieu: {{eventLocation}}
🔗 Lien (si en ligne): {{eventLink}}

📝 *DESCRIPTION:*
{{eventDescription}}

👥 *INTERVENANTS:*
{{speakers}}

🎯 *POURQUOI PARTICIPER:*
{{benefits}}

🎟️ *INSCRIPTION:*
{{registrationInfo}}

📌 N'oubliez pas de marquer cet événement dans votre calendrier !

Au plaisir de vous y voir nombreux ! 🙌`,
    variables: ['eventName', 'eventDate', 'eventTime', 'eventLocation', 'eventLink', 'eventDescription', 'speakers', 'benefits', 'registrationInfo']
  },
  
  // Notifications de réussite
  {
    id: 'achievement-1',
    name: 'Félicitations pour réussite',
    description: 'Message de félicitations pour une réussite',
    type: 'telegram',
    content: `🏆 *FÉLICITATIONS !* 🏆

👏 Cher/Chère {{studentName}},

Nous tenons à vous féliciter chaleureusement pour votre réussite:

🌟 *{{achievementName}}* 🌟

📊 *VOTRE PERFORMANCE:*
{{performanceDetails}}

💬 *COMMENTAIRE DU COACH:*
"{{coachComment}}"

🚀 Cette réalisation témoigne de votre travail acharné et de votre dévouement.

🎁 *RÉCOMPENSE:*
{{rewardDetails}}

Continuez sur cette belle lancée ! 💪

Toute l'équipe est fière de vous ! 🎉`,
    variables: ['studentName', 'achievementName', 'performanceDetails', 'coachComment', 'rewardDetails']
  },
  
  // Notifications par email
  {
    id: 'email-summary-1',
    name: 'Résumé hebdomadaire (Email)',
    description: 'Email récapitulatif hebdomadaire des activités',
    type: 'email',
    content: `<h2>📊 Votre résumé hebdomadaire</h2>

<p>Bonjour {{studentName}},</p>

<p>Voici un récapitulatif de votre semaine d'apprentissage du {{startDate}} au {{endDate}}:</p>

<h3>📚 Cours suivis</h3>
<ul>
{{coursesList}}
</ul>

<h3>⏱️ Temps d'apprentissage</h3>
<p>Vous avez consacré <strong>{{learningHours}} heures</strong> à votre formation cette semaine.</p>

<h3>📝 Devoirs</h3>
<ul>
{{homeworksList}}
</ul>

<h3>🎯 Objectifs pour la semaine prochaine</h3>
<ul>
{{nextWeekGoals}}
</ul>

<h3>📅 Prochains cours</h3>
<ul>
{{upcomingCourses}}
</ul>

<p>Continuez vos efforts ! 💪</p>

<p>Cordialement,<br>
L'équipe pédagogique</p>`,
    variables: ['studentName', 'startDate', 'endDate', 'coursesList', 'learningHours', 'homeworksList', 'nextWeekGoals', 'upcomingCourses']
  },
  
  // Notifications SMS
  {
    id: 'sms-reminder-1',
    name: 'Rappel court (SMS)',
    description: 'Rappel court format SMS',
    type: 'sms',
    content: `📚 Rappel: Votre cours {{courseName}} commence dans 1h ({{time}}). Lien Zoom: {{zoomLink}}. ID: {{zoomId}}`,
    variables: ['courseName', 'time', 'zoomLink', 'zoomId']
  }
];

// Fonction pour obtenir un modèle par son ID
export const getTemplateById = (id: string): NotificationTemplateExample | undefined => {
  return notificationTemplates.find(template => template.id === id);
};

// Fonction pour obtenir tous les modèles d'un type spécifique
export const getTemplatesByType = (type: 'telegram' | 'email' | 'sms'): NotificationTemplateExample[] => {
  return notificationTemplates.filter(template => template.type === type);
};

// Fonction pour obtenir tous les modèles contenant une variable spécifique
export const getTemplatesByVariable = (variable: string): NotificationTemplateExample[] => {
  return notificationTemplates.filter(template => template.variables.includes(variable));
};
