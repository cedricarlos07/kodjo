import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NotificationTemplatesTutorial } from "@/components/tutorials";
import { notificationTemplates } from "@/data/notification-templates";
import { NotificationTemplateExamples } from "@/components/notifications/template-examples";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, MessageSquare, Edit, Trash2, Plus, Info, Send, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Types
interface NotificationTemplate {
  id: number;
  name: string;
  description: string;
  type: "telegram" | "email" | "sms";
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

interface TelegramGroup {
  id: number;
  name: string;
  chatId: string;
  description: string;
  courseLevel: string | null;
  courseSchedule: string | null;
  instructor: string | null;
}

export default function NotificationTemplatesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<NotificationTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [previewGroup, setPreviewGroup] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedPredefinedTemplate, setSelectedPredefinedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "telegram",
    content: "",
    variables: [] as string[]
  });

  // Preview state
  const [previewData, setPreviewData] = useState({
    courseName: "Anglais - Niveau Intermédiaire",
    instructor: "John Doe",
    date: "01/01/2023",
    time: "14:00",
    zoomLink: "https://zoom.us/j/123456789",
    zoomId: "123 456 789",
    zoomPassword: "123456"
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/notification-templates"],
    enabled: isAuthenticated,
  });

  // Fetch telegram groups
  const { data: telegramGroups } = useQuery<TelegramGroup[]>({
    queryKey: ["/api/telegram-groups"],
    enabled: isAuthenticated,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/notification-templates", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Modèle créé",
        description: "Le modèle de notification a été créé avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du modèle.",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest(`/api/notification-templates/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      setEditTemplate(null);
      resetForm();
      toast({
        title: "Modèle mis à jour",
        description: "Le modèle de notification a été mis à jour avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour du modèle.",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notification-templates/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      setDeleteTemplateId(null);
      toast({
        title: "Modèle supprimé",
        description: "Le modèle de notification a été supprimé avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression du modèle.",
        variant: "destructive",
      });
    },
  });

  // Send test notification mutation
  const sendTestNotificationMutation = useMutation({
    mutationFn: ({ templateId, groupId, data }: { templateId: number; groupId: string; data: any }) =>
      apiRequest(`/api/notification-templates/${templateId}/test`, "POST", { groupId, data }),
    onSuccess: () => {
      setPreviewDialogOpen(false);
      setPreviewTemplate(null);
      setPreviewGroup(null);
      toast({
        title: "Notification envoyée",
        description: "La notification de test a été envoyée avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de la notification de test.",
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "telegram",
      content: "",
      variables: []
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Extract variables from content
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = formData.content.match(variableRegex) || [];
    const variables = matches.map(match => match.replace(/\{\{|\}\}/g, '').trim());

    const data = {
      ...formData,
      variables
    };

    if (editTemplate) {
      updateTemplateMutation.mutate({ id: editTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  // Handle edit template
  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      content: template.content,
      variables: template.variables
    });
  };

  // Handle delete template
  const handleDeleteTemplate = (id: number) => {
    setDeleteTemplateId(id);
  };

  // Handle preview template
  const handlePreviewTemplate = (template: NotificationTemplate) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  // Handle send test notification
  const handleSendTestNotification = () => {
    if (!previewTemplate || !previewGroup) return;

    sendTestNotificationMutation.mutate({
      templateId: previewTemplate.id,
      groupId: previewGroup,
      data: previewData
    });
  };

  // Handle use predefined template
  const handleUsePredefinedTemplate = () => {
    if (!selectedPredefinedTemplate) return;

    const template = notificationTemplates.find(t => t.id === selectedPredefinedTemplate);
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        type: template.type,
        content: template.content,
        variables: template.variables
      });
      setTemplateDialogOpen(false);
    }
  };

  // Filter templates based on active tab
  const filteredTemplates = templates?.filter(template => {
    if (activeTab === "all") return true;
    return template.type === activeTab;
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  // Preview content with variables replaced
  const getPreviewContent = (content: string) => {
    let previewContent = content;

    Object.entries(previewData).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
    });

    return previewContent;
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:w-64`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Modèles de Notifications"
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Modèles de Notifications</CardTitle>
                <CardDescription>
                  Gérez les modèles de notifications pour différents canaux
                </CardDescription>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un modèle
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="telegram">Telegram</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="sms">SMS</TabsTrigger>
                </TabsList>

                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : filteredTemplates && filteredTemplates.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Table className="border rounded-md">
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">Nom</TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="font-semibold">Variables</TableHead>
                          <TableHead className="font-semibold">Dernière modification</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTemplates.map((template) => (
                          <TableRow key={template.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{template.name}</span>
                                <span className="text-xs text-gray-500">{template.description}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                template.type === "telegram" ? "default" :
                                template.type === "email" ? "secondary" :
                                "outline"
                              }>
                                {template.type === "telegram" ? "Telegram" :
                                 template.type === "email" ? "Email" : "SMS"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {template.variables.map((variable) => (
                                  <Badge key={variable} variant="outline" className="text-xs">
                                    {variable}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(template.updatedAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreviewTemplate(template)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTemplate(template)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteTemplate(template.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                      <MessageSquare className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun modèle trouvé</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Commencez par créer un nouveau modèle de notification.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un modèle
                    </Button>
                  </div>
                )}
              </Tabs>

              <div className="mt-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Utilisation des variables</AlertTitle>
                  <AlertDescription>
                    Utilisez des variables dans vos modèles en les entourant de doubles accolades, par exemple :
                    <code className="mx-1 px-1 py-0.5 bg-gray-100 rounded text-sm">{'{{courseName}}'}</code>,
                    <code className="mx-1 px-1 py-0.5 bg-gray-100 rounded text-sm">{'{{instructor}}'}</code>,
                    <code className="mx-1 px-1 py-0.5 bg-gray-100 rounded text-sm">{'{{date}}'}</code>,
                    <code className="mx-1 px-1 py-0.5 bg-gray-100 rounded text-sm">{'{{time}}'}</code>,
                    <code className="mx-1 px-1 py-0.5 bg-gray-100 rounded text-sm">{'{{zoomLink}}'}</code>, etc.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="mt-6">
                <NotificationTemplateExamples
                  onSaveTemplate={(template) => {
                    setFormData({
                      name: template.name,
                      description: template.description,
                      type: template.type,
                      content: template.content,
                      variables: []
                    });
                    setCreateDialogOpen(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || editTemplate !== null} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editTemplate ? "Modifier le modèle" : "Créer un nouveau modèle"}
            </DialogTitle>
            {!editTemplate && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplateDialogOpen(true)}
                  className="mr-2"
                >
                  Utiliser un modèle prédéfini
                </Button>
              </div>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "telegram" | "email" | "sms") => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="content" className="text-right pt-2">
                  Contenu
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="col-span-3 min-h-[200px]"
                  placeholder="Entrez le contenu du modèle ici. Utilisez {{variable}} pour les variables."
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <div className="text-right pt-2">
                  <Label>Variables</Label>
                  <p className="text-xs text-gray-500 mt-1">Détectées automatiquement</p>
                </div>
                <div className="col-span-3">
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const variableRegex = /\{\{([^}]+)\}\}/g;
                      const matches = formData.content.match(variableRegex) || [];
                      const variables = matches.map(match => match.replace(/\{\{|\}\}/g, '').trim());

                      return variables.length > 0 ? (
                        variables.map((variable) => (
                          <Badge key={variable} variant="secondary">
                            {variable}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Aucune variable détectée</p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditTemplate(null);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              >
                {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editTemplate ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTemplateId !== null} onOpenChange={(open) => {
        if (!open) setDeleteTemplateId(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTemplateId(null)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTemplateId && deleteTemplateMutation.mutate(deleteTemplateId)}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setPreviewDialogOpen(false);
          setPreviewTemplate(null);
          setPreviewGroup(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Aperçu et Test</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="previewGroup" className="text-right">
                Groupe Telegram
              </Label>
              <Select
                value={previewGroup || ""}
                onValueChange={setPreviewGroup}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un groupe pour le test" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Groupe de Test</SelectItem>
                  {telegramGroups?.map((group) => (
                    <SelectItem key={group.id} value={group.chatId}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Variables de test
              </Label>
              <div className="col-span-3 space-y-2">
                {Object.entries(previewData).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-2">
                    <Label htmlFor={`preview-${key}`} className="text-sm pt-2">
                      {key}
                    </Label>
                    <Input
                      id={`preview-${key}`}
                      value={value}
                      onChange={(e) => setPreviewData({ ...previewData, [key]: e.target.value })}
                      className="col-span-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Aperçu
              </Label>
              <div className="col-span-3">
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4 whitespace-pre-wrap">
                  {previewTemplate && getPreviewContent(previewTemplate.content)}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPreviewDialogOpen(false);
                setPreviewTemplate(null);
                setPreviewGroup(null);
              }}
            >
              Fermer
            </Button>
            <Button
              type="button"
              onClick={handleSendTestNotification}
              disabled={!previewGroup || sendTestNotificationMutation.isPending}
            >
              {sendTestNotificationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Send className="mr-2 h-4 w-4" />
              Envoyer un test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Predefined Templates Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setTemplateDialogOpen(false);
          setSelectedPredefinedTemplate(null);
        }
      }}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Modèles prédéfinis</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Tabs defaultValue="telegram" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="telegram">Telegram</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="sms">SMS</TabsTrigger>
              </TabsList>

              <TabsContent value="telegram" className="space-y-4">
                {notificationTemplates
                  .filter(template => template.type === 'telegram')
                  .map(template => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedPredefinedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                      onClick={() => setSelectedPredefinedTemplate(template.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">{template.name}</h3>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                      <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {template.content}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                }
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                {notificationTemplates
                  .filter(template => template.type === 'email')
                  .map(template => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedPredefinedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                      onClick={() => setSelectedPredefinedTemplate(template.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">{template.name}</h3>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                      <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {template.content}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                }
              </TabsContent>

              <TabsContent value="sms" className="space-y-4">
                {notificationTemplates
                  .filter(template => template.type === 'sms')
                  .map(template => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedPredefinedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                      onClick={() => setSelectedPredefinedTemplate(template.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">{template.name}</h3>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                      <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {template.content}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                }
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTemplateDialogOpen(false);
                setSelectedPredefinedTemplate(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleUsePredefinedTemplate}
              disabled={!selectedPredefinedTemplate}
            >
              Utiliser ce modèle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationTemplatesTutorial />
    </div>
  );
}
