import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, X, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Types
interface ReminderTemplateFormProps {
  template?: ReminderTemplate;
  courseId?: number;
  courseLevel?: string;
  onSave: (template: ReminderTemplate) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export interface ReminderTemplate {
  id?: number;
  name: string;
  type: string;
  content: string;
  courseId?: number | null;
  courseLevel?: string | null;
  isDefault?: boolean;
  sendEmail?: boolean;
  sendTelegram?: boolean;
  emailSubject?: string;
}

// Liste des variables disponibles pour les modèles
const AVAILABLE_VARIABLES = [
  { name: 'courseName', description: 'Nom du cours' },
  { name: 'courseDay', description: 'Jour du cours' },
  { name: 'courseTime', description: 'Heure du cours' },
  { name: 'courseLevel', description: 'Niveau du cours' },
  { name: 'courseInstructor', description: 'Instructeur du cours' },
  { name: 'zoomLink', description: 'Lien Zoom du cours' },
  { name: 'zoomId', description: 'ID de la réunion Zoom' },
  { name: 'studentName', description: 'Nom de l\'étudiant (si disponible)' },
  { name: 'date', description: 'Date du cours (format: JJ/MM/AAAA)' },
];

// Types de rappels
const REMINDER_TYPES = [
  { value: 'course_reminder', label: 'Rappel de cours' },
  { value: 'course_reminder_1h', label: 'Rappel 1h avant le cours' },
  { value: 'course_reminder_15min', label: 'Rappel 15min avant le cours' },
  { value: 'course_canceled', label: 'Annulation de cours' },
  { value: 'course_rescheduled', label: 'Changement d\'horaire' },
  { value: 'homework_reminder', label: 'Rappel de devoir' },
];

// Modèles par défaut pour chaque type
const DEFAULT_TEMPLATES: Record<string, string> = {
  course_reminder: `📚 **RAPPEL DE COURS** 📚

Bonjour à tous !

Votre cours **{{courseName}}** avec {{courseInstructor}} aura lieu **{{courseDay}}** à **{{courseTime}}**.

🔗 **Lien Zoom** : {{zoomLink}}
🆔 **ID** : {{zoomId}}

Préparez-vous et soyez à l'heure ! 😊

À bientôt !`,

  course_reminder_1h: `⏰ **RAPPEL - COURS DANS 1 HEURE** ⏰

Votre cours **{{courseName}}** avec {{courseInstructor}} commence dans **1 heure** !

🔗 **Lien Zoom** : {{zoomLink}}
🆔 **ID** : {{zoomId}}

Préparez-vous et soyez à l'heure ! 😊`,

  course_reminder_15min: `⏰ **DERNIER RAPPEL - COURS DANS 15 MINUTES** ⏰

Votre cours **{{courseName}}** avec {{courseInstructor}} commence dans **15 minutes** !

🔗 **Lien Zoom** : {{zoomLink}}
🆔 **ID** : {{zoomId}}

Connectez-vous dès maintenant pour être prêt à commencer ! 🚀`,

  course_canceled: `❌ **COURS ANNULÉ** ❌

Nous sommes désolés de vous informer que le cours **{{courseName}}** prévu **{{courseDay}}** à **{{courseTime}}** est annulé.

Nous vous tiendrons informés de la date de reprise.

Merci de votre compréhension.`,

  course_rescheduled: `🔄 **CHANGEMENT D'HORAIRE** 🔄

Le cours **{{courseName}}** initialement prévu **{{courseDay}}** à **{{courseTime}}** a été reprogrammé.

Nouveau jour et heure : **{{newDay}}** à **{{newTime}}**

🔗 **Lien Zoom** : {{zoomLink}}
🆔 **ID** : {{zoomId}}

Merci de prendre note de ce changement.`,

  homework_reminder: `📝 **RAPPEL DE DEVOIR** 📝

N'oubliez pas de terminer votre devoir pour le cours **{{courseName}}** avant la prochaine session.

Date limite : **{{dueDate}}**

Bon travail ! 📚`,
};

const ReminderTemplateForm: React.FC<ReminderTemplateFormProps> = ({
  template,
  courseId,
  courseLevel,
  onSave,
  onCancel,
  isSaving = false
}) => {
  // État initial du formulaire
  const [formData, setFormData] = useState<ReminderTemplate>(
    template || {
      name: '',
      type: 'course_reminder',
      content: DEFAULT_TEMPLATES.course_reminder,
      courseId: courseId || null,
      courseLevel: courseLevel || null,
      isDefault: false,
      sendEmail: true,
      sendTelegram: true,
      emailSubject: 'Rappel de cours'
    }
  );

  const [activeTab, setActiveTab] = useState<string>('edit');
  const { toast } = useToast();

  // Gérer les changements dans le formulaire
  const handleChange = (field: keyof ReminderTemplate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Charger un modèle par défaut
  const loadDefaultTemplate = (type: string) => {
    if (DEFAULT_TEMPLATES[type]) {
      handleChange('content', DEFAULT_TEMPLATES[type]);
      handleChange('type', type);

      // Mettre à jour le sujet de l'email en fonction du type
      const typeLabel = REMINDER_TYPES.find(t => t.value === type)?.label || 'Rappel';
      handleChange('emailSubject', typeLabel);
    }
  };

  // Insérer une variable dans le contenu
  const insertVariable = (variable: string) => {
    const textArea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textArea) {
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const content = formData.content;
      const newContent = content.substring(0, start) + `{{${variable}}}` + content.substring(end);
      handleChange('content', newContent);

      // Remettre le focus et la position du curseur
      setTimeout(() => {
        textArea.focus();
        textArea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    } else {
      handleChange('content', formData.content + `{{${variable}}}`);
    }
  };

  // Prévisualiser le modèle avec des données fictives
  const previewContent = () => {
    let content = formData.content;

    // Remplacer les variables par des valeurs fictives
    const dummyData = {
      courseName: 'Anglais Intermédiaire',
      courseDay: 'Lundi',
      courseTime: '18h00',
      courseLevel: 'B1-B2',
      courseInstructor: 'John Smith',
      zoomLink: 'https://zoom.us/j/123456789',
      zoomId: '123 456 789',
      studentName: 'Marie Dupont',
      date: new Date().toLocaleDateString('fr-FR'),
      newDay: 'Mercredi',
      newTime: '19h00',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
    };

    Object.entries(dummyData).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return content;
  };

  // Soumettre le formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le nom du modèle est requis",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le contenu du modèle est requis",
        variant: "destructive",
      });
      return;
    }

    // Soumettre le modèle
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{template ? 'Modifier le modèle' : 'Nouveau modèle de rappel'}</CardTitle>
          <CardDescription>
            Créez ou modifiez un modèle de rappel pour les cours
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="edit">Édition</TabsTrigger>
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Nom du modèle</Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ex: Rappel standard"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-type">Type de rappel</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => loadDefaultTemplate(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="template-content">Contenu du message</Label>
                  <div className="flex space-x-2">
                    {AVAILABLE_VARIABLES.map((variable) => (
                      <Button
                        key={variable.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(variable.name)}
                        title={variable.description}
                      >
                        {variable.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <Textarea
                  id="template-content"
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="Contenu du message..."
                  rows={12}
                />
                <p className="text-sm text-muted-foreground">
                  <Info className="inline-block w-4 h-4 mr-1" />
                  Utilisez les boutons ci-dessus pour insérer des variables. Les variables seront remplacées par les valeurs réelles lors de l'envoi.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="border rounded-md p-4 bg-muted/20 whitespace-pre-wrap">
                {previewContent()}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="send-telegram">Envoyer par Telegram</Label>
                    <p className="text-sm text-muted-foreground">
                      Envoyer ce rappel via les groupes Telegram
                    </p>
                  </div>
                  <Switch
                    id="send-telegram"
                    checked={formData.sendTelegram}
                    onCheckedChange={(checked) => handleChange('sendTelegram', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="send-email">Envoyer par Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Envoyer ce rappel par email aux étudiants
                    </p>
                  </div>
                  <Switch
                    id="send-email"
                    checked={formData.sendEmail}
                    onCheckedChange={(checked) => handleChange('sendEmail', checked)}
                  />
                </div>

                {formData.sendEmail && (
                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Sujet de l'email</Label>
                    <Input
                      id="email-subject"
                      value={formData.emailSubject || ''}
                      onChange={(e) => handleChange('emailSubject', e.target.value)}
                      placeholder="Ex: Rappel de cours"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is-default">Modèle par défaut</Label>
                    <p className="text-sm text-muted-foreground">
                      Utiliser ce modèle comme modèle par défaut pour ce type de rappel
                    </p>
                  </div>
                  <Switch
                    id="is-default"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => handleChange('isDefault', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-level">Niveau de cours (optionnel)</Label>
                  <Select
                    value={formData.courseLevel || 'all'}
                    onValueChange={(value) => handleChange('courseLevel', value === 'all' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les niveaux</SelectItem>
                      <SelectItem value="A1-A2">Débutant (A1-A2)</SelectItem>
                      <SelectItem value="B1-B2">Intermédiaire (B1-B2)</SelectItem>
                      <SelectItem value="C1-C2">Avancé (C1-C2)</SelectItem>
                      <SelectItem value="Business">Business English</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Si spécifié, ce modèle ne sera utilisé que pour les cours du niveau sélectionné
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ReminderTemplateForm;
