import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Copy, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";
import ReminderTemplateForm, { ReminderTemplate } from "@/components/reminders/ReminderTemplateForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReminderTemplatesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Fetch reminder templates
  const { data: templates, isLoading } = useQuery<ReminderTemplate[]>({
    queryKey: ["/api/reminder-templates"],
    enabled: isAuthenticated,
  });

  // Create reminder template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: ReminderTemplate) => {
      const response = await apiRequest("/api/reminder-templates", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-templates"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Modèle créé",
        description: "Le modèle de rappel a été créé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la création du modèle: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update reminder template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ReminderTemplate }) => {
      const response = await apiRequest(`/api/reminder-templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-templates"] });
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      toast({
        title: "Modèle mis à jour",
        description: "Le modèle de rappel a été mis à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la mise à jour du modèle: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete reminder template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/reminder-templates/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-templates"] });
      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
      toast({
        title: "Modèle supprimé",
        description: "Le modèle de rappel a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression du modèle: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Duplicate reminder template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template: ReminderTemplate) => {
      const newTemplate = {
        ...template,
        name: `${template.name} (copie)`,
        isDefault: false,
      };
      delete newTemplate.id;

      const response = await apiRequest("/api/reminder-templates", {
        method: "POST",
        body: JSON.stringify(newTemplate),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-templates"] });
      toast({
        title: "Modèle dupliqué",
        description: "Le modèle de rappel a été dupliqué avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la duplication du modèle: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = (template: ReminderTemplate) => {
    createTemplateMutation.mutate(template);
  };

  const handleUpdateTemplate = (template: ReminderTemplate) => {
    if (selectedTemplate && selectedTemplate.id) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data: template });
    }
  };

  const handleDeleteTemplate = () => {
    if (selectedTemplate && selectedTemplate.id) {
      deleteTemplateMutation.mutate(selectedTemplate.id);
    }
  };

  const handleDuplicateTemplate = (template: ReminderTemplate) => {
    duplicateTemplateMutation.mutate(template);
  };

  const openEditDialog = (template: ReminderTemplate) => {
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (template: ReminderTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  // Filtrer les modèles
  const filteredTemplates = templates?.filter(template => {
    let matchesType = filterType === "all" || template.type === filterType;
    let matchesLevel = filterLevel === "all" || template.courseLevel === filterLevel || (!template.courseLevel && filterLevel === "none");
    return matchesType && matchesLevel;
  });

  // Types de rappels pour le filtre
  const reminderTypes = [
    { value: "all", label: "Tous les types" },
    { value: "course_reminder", label: "Rappel de cours" },
    { value: "course_reminder_1h", label: "Rappel 1h avant" },
    { value: "course_reminder_15min", label: "Rappel 15min avant" },
    { value: "course_canceled", label: "Annulation" },
    { value: "course_rescheduled", label: "Changement d'horaire" },
    { value: "homework_reminder", label: "Rappel de devoir" },
  ];

  // Niveaux de cours pour le filtre
  const courseLevels = [
    { value: "all", label: "Tous les niveaux" },
    { value: "none", label: "Non spécifié" },
    { value: "A1-A2", label: "Débutant (A1-A2)" },
    { value: "B1-B2", label: "Intermédiaire (B1-B2)" },
    { value: "C1-C2", label: "Avancé (C1-C2)" },
    { value: "Business", label: "Business English" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Modèles de rappels" />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Modèles de rappels</h1>
            {isAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau modèle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <ReminderTemplateForm
                    onSave={handleCreateTemplate}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    isSaving={createTemplateMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Tabs defaultValue="templates">
            <TabsList className="mb-4">
              <TabsTrigger value="templates">Modèles de rappels</TabsTrigger>
              <TabsTrigger value="info">Informations</TabsTrigger>
            </TabsList>
            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle>Modèles de rappels personnalisés</CardTitle>
                  <CardDescription>
                    Gérez les modèles de rappels pour les différents types de notifications
                  </CardDescription>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="w-64">
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrer par type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reminderTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-64">
                      <Select value={filterLevel} onValueChange={setFilterLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrer par niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          {courseLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredTemplates && filteredTemplates.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Niveau</TableHead>
                          <TableHead>Canaux</TableHead>
                          <TableHead>Par défaut</TableHead>
                          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTemplates.map((template) => (
                          <TableRow key={template.id}>
                            <TableCell className="font-medium">{template.name}</TableCell>
                            <TableCell>
                              {reminderTypes.find(t => t.value === template.type)?.label || template.type}
                            </TableCell>
                            <TableCell>
                              {template.courseLevel ? (
                                courseLevels.find(l => l.value === template.courseLevel)?.label || template.courseLevel
                              ) : (
                                <span className="text-muted-foreground">Tous</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                {template.sendTelegram && (
                                  <Badge variant="outline" className="bg-blue-50">Telegram</Badge>
                                )}
                                {template.sendEmail && (
                                  <Badge variant="outline" className="bg-green-50">Email</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {template.isDefault ? (
                                <Badge>Par défaut</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(template)}
                                  title="Modifier"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDuplicateTemplate(template)}
                                  title="Dupliquer"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog(template)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium mb-2">Aucun modèle trouvé</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {filterType !== "all" || filterLevel !== "all"
                          ? "Aucun modèle ne correspond aux filtres sélectionnés."
                          : "Vous n'avez pas encore créé de modèles de rappels."}
                      </p>
                      {isAdmin && (
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Créer un modèle
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>À propos des modèles de rappels</CardTitle>
                  <CardDescription>
                    Comprendre comment fonctionnent les modèles de rappels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <MessageSquare className="h-4 w-4" />
                    <AlertTitle>Qu'est-ce que les modèles de rappels ?</AlertTitle>
                    <AlertDescription>
                      Les modèles de rappels permettent de personnaliser les messages envoyés aux étudiants pour les rappels de cours,
                      les annulations, les changements d'horaire, etc. Vous pouvez créer différents modèles pour différents types de rappels
                      et pour différents niveaux de cours.
                    </AlertDescription>
                  </Alert>

                  <h3 className="text-lg font-semibold mt-4">Variables disponibles</h3>
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez utiliser les variables suivantes dans vos modèles. Elles seront remplacées par les valeurs réelles lors de l'envoi.
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><code>{'{{'+'courseName'+'}}'}</code> - Nom du cours</li>
                    <li><code>{'{{'+'courseDay'+'}}'}</code> - Jour du cours</li>
                    <li><code>{'{{'+'courseTime'+'}}'}</code> - Heure du cours</li>
                    <li><code>{'{{'+'courseLevel'+'}}'}</code> - Niveau du cours</li>
                    <li><code>{'{{'+'courseInstructor'+'}}'}</code> - Instructeur du cours</li>
                    <li><code>{'{{'+'zoomLink'+'}}'}</code> - Lien Zoom du cours</li>
                    <li><code>{'{{'+'zoomId'+'}}'}</code> - ID de la réunion Zoom</li>
                    <li><code>{'{{'+'studentName'+'}}'}</code> - Nom de l'étudiant (si disponible)</li>
                    <li><code>{'{{'+'date'+'}}'}</code> - Date du cours (format: JJ/MM/AAAA)</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4">Types de rappels</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><strong>Rappel de cours</strong> - Envoyé avant le cours (généralement la veille)</li>
                    <li><strong>Rappel 1h avant</strong> - Envoyé une heure avant le début du cours</li>
                    <li><strong>Rappel 15min avant</strong> - Envoyé 15 minutes avant le début du cours</li>
                    <li><strong>Annulation</strong> - Envoyé lorsqu'un cours est annulé</li>
                    <li><strong>Changement d'horaire</strong> - Envoyé lorsque l'horaire d'un cours est modifié</li>
                    <li><strong>Rappel de devoir</strong> - Envoyé pour rappeler aux étudiants de faire leurs devoirs</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4">Canaux de communication</h3>
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez choisir d'envoyer les rappels via Telegram, par email, ou les deux.
                    Pour les emails, vous pouvez personnaliser le sujet du message.
                  </p>

                  <h3 className="text-lg font-semibold mt-4">Modèles par niveau</h3>
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez créer des modèles spécifiques pour différents niveaux de cours.
                    Si un modèle spécifique existe pour un niveau, il sera utilisé en priorité.
                    Sinon, le modèle par défaut pour ce type de rappel sera utilisé.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Dialog */}
          {selectedTemplate && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-4xl">
                <ReminderTemplateForm
                  template={selectedTemplate}
                  onSave={handleUpdateTemplate}
                  onCancel={() => setIsEditDialogOpen(false)}
                  isSaving={updateTemplateMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Dialog */}
          {selectedTemplate && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Confirmer la suppression</DialogTitle>
                  <DialogDescription>
                    Êtes-vous sûr de vouloir supprimer le modèle "{selectedTemplate.name}" ?
                    Cette action est irréversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteTemplate} disabled={deleteTemplateMutation.isPending}>
                    {deleteTemplateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Supprimer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>
    </div>
  );
}
