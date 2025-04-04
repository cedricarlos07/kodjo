import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NotificationSimulatorTutorial } from "@/components/tutorials";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, MessageSquare, Send, Info, CheckCircle, AlertCircle, RefreshCw, Clock, Calendar, User, Video, Key, Bot, Activity, Settings2, AlertTriangle, BookOpen, FileText, Bell, PartyPopper, Wrench, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_ENDPOINTS } from "@/lib/config";

// Types
interface NotificationTemplate {
  id: number;
  name: string;
  description: string;
  content: string;
  variables: string[];
  category: string;
  emoji: string;
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

interface SimulationLog {
  id: number;
  timestamp: string;
  status: "success" | "error" | "info";
  message: string;
  details: string;
}

interface BotStatus {
  botInfo: {
    id: number;
    first_name: string;
    username: string;
    is_bot: boolean;
    status: string;
  };
  simulationMode: boolean;
  settings: {
    telegramToken: string;
    telegramChatId: string | null;
    simulationMode: boolean;
  };
  timestamp: string;
}

export default function NotificationSimulatorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [useTestGroup, setUseTestGroup] = useState(true);
  const [simulationLogs, setSimulationLogs] = useState<SimulationLog[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState("configuration");
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { toast } = useToast();

  // Form state for variables
  const [variableValues, setVariableValues] = useState<Record<string, string>>({
    courseName: "Anglais - Niveau Intermédiaire",
    instructor: "John Doe",
    date: "01/01/2023",
    time: "14:00",
    zoomLink: "https://zoom.us/j/123456789",
    zoomId: "123 456 789",
    zoomPassword: "123456"
  });

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery<NotificationTemplate[]>({
    queryKey: [API_ENDPOINTS.NOTIFICATIONS.TEMPLATES],
    enabled: isAuthenticated,
  });

  // Fetch telegram groups
  const { data: telegramGroups, isLoading: groupsLoading } = useQuery<TelegramGroup[]>({
    queryKey: ['/api/telegram-groups'],
    enabled: isAuthenticated,
  });

  // Fetch bot status
  const { data: botStatus, isLoading: botStatusLoading, refetch: refetchBotStatus } = useQuery<BotStatus>({
    queryKey: ['/api/bot/status'],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch app settings
  const { data: appSettings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery<{
    id: number;
    simulationMode: boolean;
    testGroup: string | null;
    telegramToken: string;
    telegramChatId: string;
    zoomApiKey: string;
    zoomApiSecret: string;
  }>({
    queryKey: ['/api/settings'],
    enabled: isAuthenticated && isAdmin,
  });

  // Get selected template
  const getSelectedTemplate = () => {
    if (!selectedTemplate || !templates) return null;
    return templates.find(template => template.id === selectedTemplate);
  };

  // Get selected group
  const getSelectedGroup = () => {
    if (!selectedGroup || !telegramGroups) return null;
    return telegramGroups.find(group => group.chatId === selectedGroup);
  };

  // Simulate notification mutation
  const simulateNotificationMutation = useMutation({
    mutationFn: (data: any) => apiRequest(API_ENDPOINTS.SIMULATOR.SEND, "POST", data),
    onSuccess: (response) => {
      setIsSimulating(false);

      // Add success log
      const newLog: SimulationLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: "success",
        message: "Notification simulée avec succès",
        details: `La notification a été envoyée au ${useTestGroup ? "groupe de test" : `groupe "${getSelectedGroup()?.name}"`}.`
      };

      setSimulationLogs(prev => [newLog, ...prev]);

      // Refresh bot status
      refetchBotStatus();

      toast({
        title: "Simulation réussie",
        description: "La notification a été simulée avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      setIsSimulating(false);

      // Add error log
      const newLog: SimulationLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: "error",
        message: "Erreur lors de la simulation",
        details: error.message || "Une erreur est survenue lors de la simulation de la notification."
      };

      setSimulationLogs(prev => [newLog, ...prev]);

      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la simulation de la notification.",
        variant: "destructive",
      });
    },
  });

  // Handle simulate notification
  const handleSimulateNotification = () => {
    const template = getSelectedTemplate();
    const group = getSelectedGroup();

    if (!template) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un modèle de notification.",
        variant: "destructive",
      });
      return;
    }

    if (!useTestGroup && !group) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un groupe Telegram.",
        variant: "destructive",
      });
      return;
    }

    setIsSimulating(true);

    // Add info log
    const newLog: SimulationLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: "info",
      message: "Simulation en cours",
      details: `Simulation de la notification "${template.name}" ${useTestGroup ? "vers le groupe de test" : `vers le groupe "${group?.name}"`}.`
    };

    setSimulationLogs(prev => [newLog, ...prev]);

    simulateNotificationMutation.mutate({
      templateId: template.id,
      groupId: useTestGroup ? "test" : group?.chatId,
      useTestGroup,
      variables: variableValues
    });
  };

  // Clear logs
  const clearLogs = () => {
    setSimulationLogs([]);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  };

  // Preview content with variables replaced
  const getPreviewContent = (content: string) => {
    let previewContent = content;

    Object.entries(variableValues).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
    });

    return previewContent;
  };

  // Get log icon
  const getLogIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Get variable icon
  const getVariableIcon = (variable: string) => {
    switch (variable) {
      case "courseName":
        return <BookOpen className="h-4 w-4" />;
      case "instructor":
        return <User className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "time":
        return <Clock className="h-4 w-4" />;
      case "zoomLink":
        return <Video className="h-4 w-4" />;
      case "zoomId":
        return <Key className="h-4 w-4" />;
      case "zoomPassword":
        return <Key className="h-4 w-4" />;
      case "documentTitle":
        return <FileText className="h-4 w-4" />;
      case "documentDescription":
        return <FileText className="h-4 w-4" />;
      case "dueDate":
        return <Calendar className="h-4 w-4" />;
      case "assignmentTitle":
        return <FileText className="h-4 w-4" />;
      case "studentName":
        return <User className="h-4 w-4" />;
      case "examDate":
        return <Calendar className="h-4 w-4" />;
      case "examTime":
        return <Clock className="h-4 w-4" />;
      case "examSubject":
        return <BookOpen className="h-4 w-4" />;
      case "examDuration":
        return <Clock className="h-4 w-4" />;
      case "eventName":
        return <PartyPopper className="h-4 w-4" />;
      case "eventDate":
        return <Calendar className="h-4 w-4" />;
      case "eventTime":
        return <Clock className="h-4 w-4" />;
      case "eventLocation":
        return <MapPin className="h-4 w-4" />;
      case "eventDescription":
        return <FileText className="h-4 w-4" />;
      case "maintenanceDate":
        return <Calendar className="h-4 w-4" />;
      case "startTime":
        return <Clock className="h-4 w-4" />;
      case "endTime":
        return <Clock className="h-4 w-4" />;
      case "newTime":
        return <Clock className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
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
          title="Simulateur de Notifications"
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration de la Simulation</CardTitle>
                <CardDescription>
                  Configurez et testez vos notifications sans impacter les vrais groupes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                    <TabsTrigger value="bot-status">État du Bot</TabsTrigger>
                  </TabsList>
                  <TabsContent value="configuration" className="space-y-6">

                  <div className="space-y-2">
                    <Label htmlFor="template">Modèle de notification</Label>
                    <Select
                      value={selectedTemplate?.toString() || ""}
                      onValueChange={(value) => setSelectedTemplate(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        {templatesLoading ? (
                          <div className="flex justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : templates && templates.length > 0 ? (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{template.emoji}</span>
                                <span>{template.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-sm text-gray-500">
                            Aucun modèle disponible
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor="useTestGroup" className="text-base">Utiliser le groupe de test</Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Envoyer les notifications au groupe de test au lieu d'un groupe spécifique
                        </p>
                      </div>
                      <Switch
                        id="useTestGroup"
                        checked={useTestGroup}
                        onCheckedChange={setUseTestGroup}
                      />
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="simulationMode" className="text-base">Mode simulation</Label>
                          <p className="text-sm text-gray-500 mt-1">
                            {botStatus?.simulationMode
                              ? "Les notifications sont simulées et n'affectent pas les vrais groupes"
                              : "Les notifications sont envoyées aux vrais groupes Telegram"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={botStatus?.simulationMode ? "warning" : "success"}>
                            {botStatus?.simulationMode ? "Activé" : "Désactivé"}
                          </Badge>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (appSettings) {
                                  // Toggle simulation mode
                                  apiRequest("/api/settings", "PUT", {
                                    ...appSettings,
                                    simulationMode: !appSettings.simulationMode
                                  }).then(() => {
                                    refetchBotStatus();
                                    refetchSettings();
                                    toast({
                                      title: "Mode simulation mis à jour",
                                      description: `Le mode simulation est maintenant ${!appSettings.simulationMode ? "activé" : "désactivé"}.`,
                                      variant: "success",
                                    });
                                  }).catch(error => {
                                    toast({
                                      title: "Erreur",
                                      description: "Impossible de mettre à jour le mode simulation.",
                                      variant: "destructive",
                                    });
                                  });
                                }
                              }}
                            >
                              {botStatus?.simulationMode ? "Désactiver" : "Activer"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="p-3 border rounded-lg">
                        <Label htmlFor="testGroup" className="text-base">ID du Groupe de Test Telegram</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            id="testGroup"
                            value={appSettings?.testGroup || ""}
                            onChange={(e) => {
                              if (appSettings) {
                                apiRequest("/api/settings", "PUT", {
                                  ...appSettings,
                                  testGroup: e.target.value || null
                                }).then(() => {
                                  refetchSettings();
                                  toast({
                                    title: "Groupe de test mis à jour",
                                    description: "L'ID du groupe de test a été mis à jour avec succès.",
                                    variant: "success",
                                  });
                                }).catch(error => {
                                  toast({
                                    title: "Erreur",
                                    description: "Impossible de mettre à jour le groupe de test.",
                                    variant: "destructive",
                                  });
                                });
                              }
                            }}
                            placeholder="-100123456789"
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={() => refetchSettings()}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1 mt-2">
                          <p className="text-xs text-gray-500">
                            <strong>Important :</strong> Entrez l'ID du groupe Telegram où les messages simulés seront envoyés.
                          </p>
                          <p className="text-xs text-gray-500">
                            Ce doit être un ID de groupe valide au format <code>-100xxxxxxxxx</code>.
                          </p>
                          <p className="text-xs text-gray-500">
                            Assurez-vous que le bot a été ajouté à ce groupe et a les permissions d'envoi de messages.
                          </p>
                          {appSettings?.telegramChatId && (
                            <p className="text-xs text-gray-500">
                              <strong>Astuce :</strong> Vous pouvez utiliser l'ID de chat par défaut configuré dans les paramètres Telegram : <code>{appSettings.telegramChatId}</code>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!useTestGroup && (
                    <div className="space-y-2">
                      <Label htmlFor="group">Groupe Telegram</Label>
                      <Select
                        value={selectedGroup || ""}
                        onValueChange={setSelectedGroup}
                        disabled={useTestGroup}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un groupe" />
                        </SelectTrigger>
                        <SelectContent>
                          {groupsLoading ? (
                            <div className="flex justify-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : telegramGroups && telegramGroups.length > 0 ? (
                            telegramGroups.map((group) => (
                              <SelectItem key={group.id} value={group.chatId}>
                                {group.name} {group.chatId && <span className="text-gray-500 text-xs ml-1">({group.chatId})</span>}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-2 text-sm text-gray-500">
                              Aucun groupe disponible
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Variables</Label>
                    <div className="space-y-3 border rounded-md p-3">
                      {getSelectedTemplate()?.variables.length ? (
                        getSelectedTemplate()?.variables.map((variable) => (
                          <div key={variable} className="grid grid-cols-4 gap-2 items-center">
                            <Label htmlFor={`var-${variable}`} className="flex items-center col-span-1">
                              {getVariableIcon(variable)}
                              <span className="ml-1.5">{variable}</span>
                            </Label>
                            <Input
                              id={`var-${variable}`}
                              value={variableValues[variable] || ""}
                              onChange={(e) => setVariableValues({ ...variableValues, [variable]: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 py-2">
                          Sélectionnez un modèle pour voir les variables disponibles
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Aperçu</Label>
                    <div className="border rounded-md p-3 bg-gray-50 whitespace-pre-wrap min-h-[100px]">
                      {getSelectedTemplate() ? (
                        getPreviewContent(getSelectedTemplate()!.content)
                      ) : (
                        <div className="text-sm text-gray-500 py-2">
                          Sélectionnez un modèle pour voir l'aperçu
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleSimulateNotification}
                    disabled={isSimulating || !selectedTemplate || (!useTestGroup && !selectedGroup)}
                    className="w-full"
                  >
                    {isSimulating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Simulation en cours...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Simuler la notification
                      </>
                    )}
                  </Button>

                  <Alert variant={botStatus?.simulationMode ? "default" : "destructive"}>
                    {botStatus?.simulationMode ? (
                      <Info className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>Mode simulation {botStatus?.simulationMode ? "activé" : "désactivé"}</AlertTitle>
                    <AlertDescription className="space-y-1">
                      {botStatus?.simulationMode ? (
                        <>
                          <p>Les notifications simulées sont envoyées uniquement au groupe de test configuré.</p>
                          {appSettings?.testGroup ? (
                            <p className="text-sm font-medium">Groupe de test actuel : <code>{appSettings.testGroup}</code></p>
                          ) : (
                            <p className="text-amber-600 font-medium">Aucun groupe de test n'est configuré. Veuillez en configurer un ci-dessus.</p>
                          )}
                        </>
                      ) : (
                        <p className="text-red-600 font-medium">ATTENTION: Le mode simulation est désactivé. Les notifications seront envoyées aux vrais groupes Telegram.</p>
                      )}
                    </AlertDescription>
                  </Alert>
                  </TabsContent>

                  <TabsContent value="bot-status" className="space-y-6">
                    {botStatusLoading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : botStatus ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-medium">Informations du Bot</h3>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-md space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Nom:</span>
                              <span>{botStatus.botInfo.first_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Nom d'utilisateur:</span>
                              <span>@{botStatus.botInfo.username}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">ID:</span>
                              <span>{botStatus.botInfo.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Statut:</span>
                              <Badge variant={botStatus.botInfo.status === "simulation" ? "warning" : "success"}>
                                {botStatus.botInfo.status === "simulation" ? "Simulation" : "Actif"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-medium">Configuration</h3>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-md space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Token Telegram:</span>
                              <Badge variant={botStatus.settings.telegramToken === "[CONFIGURED]" ? "success" : "destructive"}>
                                {botStatus.settings.telegramToken}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Chat ID par défaut:</span>
                              <span>{botStatus.settings.telegramChatId || "Non configuré"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Mode simulation:</span>
                              <Badge variant={botStatus.settings.simulationMode ? "warning" : "success"}>
                                {botStatus.settings.simulationMode ? "Activé" : "Désactivé"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-medium">Statut actuel</h3>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-md space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Mode simulation:</span>
                              <Badge variant={botStatus.simulationMode ? "warning" : "success"}>
                                {botStatus.simulationMode ? "Activé" : "Désactivé"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Dernière vérification:</span>
                              <span>{formatDate(botStatus.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => refetchBotStatus()}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Actualiser le statut
                        </Button>
                      </div>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>
                          Impossible de récupérer l'état du bot. Veuillez réessayer plus tard.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Logs de Simulation</CardTitle>
                  <CardDescription>
                    Historique des simulations et résultats
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={clearLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Effacer les logs
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {simulationLogs.length > 0 ? (
                    <div className="space-y-3">
                      {simulationLogs.map((log) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-md border ${
                            log.status === "success" ? "bg-green-50 border-green-200" :
                            log.status === "error" ? "bg-red-50 border-red-200" :
                            "bg-blue-50 border-blue-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {getLogIcon(log.status)}
                              <span className="ml-2 font-medium">{log.message}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{log.details}</p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun log de simulation</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Les logs de simulation apparaîtront ici après avoir exécuté une simulation.
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </main>
        <NotificationSimulatorTutorial />
      </div>
    </div>
  );
}
