import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ScenariosTutorial } from "@/components/tutorials";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Clock, Calendar, Bell, Play, Edit, Trash2, Plus, Info, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Types
interface Scenario {
  id: number;
  name: string;
  description: string;
  type: string;
  status: "active" | "inactive";
  schedule: {
    time: string;
    days: string[];
    frequency: "daily" | "weekly" | "monthly";
  };
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ScenariosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editScenario, setEditScenario] = useState<Scenario | null>(null);
  const [deleteScenarioId, setDeleteScenarioId] = useState<number | null>(null);
  const [runAllConfirmOpen, setRunAllConfirmOpen] = useState(false);
  const [runningScenarios, setRunningScenarios] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "notification",
    status: "active",
    schedule: {
      time: "08:00",
      days: ["Monday", "Wednesday", "Friday"],
      frequency: "weekly"
    }
  });

  // Fetch scenarios
  const { data: scenarios, isLoading } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
    enabled: isAuthenticated,
  });

  // Create scenario mutation
  const createScenarioMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/scenarios", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Scénario créé",
        description: "Le scénario a été créé avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du scénario.",
        variant: "destructive",
      });
    },
  });

  // Update scenario mutation
  const updateScenarioMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest(`/api/scenarios/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      setEditScenario(null);
      resetForm();
      toast({
        title: "Scénario mis à jour",
        description: "Le scénario a été mis à jour avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour du scénario.",
        variant: "destructive",
      });
    },
  });

  // Delete scenario mutation
  const deleteScenarioMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/scenarios/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      setDeleteScenarioId(null);
      toast({
        title: "Scénario supprimé",
        description: "Le scénario a été supprimé avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression du scénario.",
        variant: "destructive",
      });
    },
  });

  // Run scenario mutation
  const runScenarioMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/scenarios/${id}/run`, "POST"),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      setRunningScenarios(prev => prev.filter(scenarioId => scenarioId !== id));
      toast({
        title: "Scénario exécuté",
        description: "Le scénario a été exécuté avec succès.",
        variant: "success",
      });
    },
    onError: (error: any, id) => {
      setRunningScenarios(prev => prev.filter(scenarioId => scenarioId !== id));
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'exécution du scénario.",
        variant: "destructive",
      });
    },
  });

  // Run all scenarios mutation
  const runAllScenariosMutation = useMutation({
    mutationFn: () => apiRequest("/api/scenarios/run-all", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      setRunAllConfirmOpen(false);
      toast({
        title: "Tous les scénarios exécutés",
        description: "Tous les scénarios ont été exécutés avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      setRunAllConfirmOpen(false);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'exécution des scénarios.",
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "notification",
      status: "active",
      schedule: {
        time: "08:00",
        days: ["Monday", "Wednesday", "Friday"],
        frequency: "weekly"
      }
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editScenario) {
      updateScenarioMutation.mutate({ id: editScenario.id, data: formData });
    } else {
      createScenarioMutation.mutate(formData);
    }
  };

  // Handle edit scenario
  const handleEditScenario = (scenario: Scenario) => {
    setEditScenario(scenario);
    setFormData({
      name: scenario.name,
      description: scenario.description,
      type: scenario.type,
      status: scenario.status,
      schedule: {
        time: scenario.schedule.time,
        days: scenario.schedule.days,
        frequency: scenario.schedule.frequency
      }
    });
  };

  // Handle delete scenario
  const handleDeleteScenario = (id: number) => {
    setDeleteScenarioId(id);
  };

  // Handle run scenario
  const handleRunScenario = (id: number) => {
    setRunningScenarios(prev => [...prev, id]);
    runScenarioMutation.mutate(id);
  };

  // Handle run all scenarios
  const handleRunAllScenarios = () => {
    setRunAllConfirmOpen(true);
  };

  // Confirm run all scenarios
  const confirmRunAllScenarios = () => {
    runAllScenariosMutation.mutate();
  };

  // Filter scenarios based on active tab
  const filteredScenarios = scenarios?.filter(scenario => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return scenario.status === "active";
    if (activeTab === "inactive") return scenario.status === "inactive";
    return true;
  });

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  // Translate day names to French
  const translateDay = (day: string) => {
    const translations: Record<string, string> = {
      "Monday": "Lundi",
      "Tuesday": "Mardi",
      "Wednesday": "Mercredi",
      "Thursday": "Jeudi",
      "Friday": "Vendredi",
      "Saturday": "Samedi",
      "Sunday": "Dimanche"
    };
    return translations[day] || day;
  };

  // Format schedule for display
  const formatSchedule = (schedule: { time: string; days: string[]; frequency: string }) => {
    if (!schedule) return "Non planifié";

    const { time, days, frequency } = schedule;
    const translatedDays = days && Array.isArray(days) ? days.map(translateDay).join(", ") : "";

    let frequencyText = "";
    if (frequency === "daily") frequencyText = "Quotidien";
    if (frequency === "weekly") frequencyText = "Hebdomadaire";
    if (frequency === "monthly") frequencyText = "Mensuel";

    return `${time || "--:--"} - ${frequencyText || "Non défini"} ${translatedDays ? `(${translatedDays})` : ""}`;
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
          title="Gestion des Scénarios"
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Scénarios</CardTitle>
                <CardDescription>
                  Gérez les scénarios de notification et d'automatisation
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        onClick={handleRunAllScenarios}
                        disabled={runAllScenariosMutation.isPending}
                      >
                        {runAllScenariosMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Exécuter tous
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Exécuter tous les scénarios actifs immédiatement</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un scénario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="active">Actifs</TabsTrigger>
                  <TabsTrigger value="inactive">Inactifs</TabsTrigger>
                </TabsList>

                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : filteredScenarios && filteredScenarios.length > 0 ? (
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
                          <TableHead className="font-semibold">Statut</TableHead>
                          <TableHead className="font-semibold">Planification</TableHead>
                          <TableHead className="font-semibold">Dernière exécution</TableHead>
                          <TableHead className="font-semibold">Prochaine exécution</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredScenarios.map((scenario) => (
                          <TableRow key={scenario.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{scenario.name}</span>
                                <span className="text-xs text-gray-500">{scenario.description}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={scenario.type === "notification" ? "default" : "secondary"}>
                                {scenario.type === "notification" ? "Notification" : "Automatisation"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={scenario.status === "active" ? "success" : "outline"}>
                                {scenario.status === "active" ? "Actif" : "Inactif"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                <span>{formatSchedule(scenario.schedule)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(scenario.lastRun)}</TableCell>
                            <TableCell>{formatDate(scenario.nextRun)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRunScenario(scenario.id)}
                                  disabled={runningScenarios.includes(scenario.id) || scenario.status === "inactive"}
                                >
                                  {runningScenarios.includes(scenario.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditScenario(scenario)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteScenario(scenario.id)}
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
                      <Calendar className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun scénario trouvé</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Commencez par créer un nouveau scénario pour automatiser vos notifications.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un scénario
                    </Button>
                  </div>
                )}
              </Tabs>

              <div className="mt-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Astuce</AlertTitle>
                  <AlertDescription>
                    Les scénarios vous permettent d'automatiser l'envoi de notifications et d'autres tâches.
                    Vous pouvez les planifier pour qu'ils s'exécutent à des moments précis ou les exécuter manuellement.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || editScenario !== null} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditScenario(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editScenario ? "Modifier le scénario" : "Créer un nouveau scénario"}
            </DialogTitle>
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
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="automation">Automatisation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Statut
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="status"
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? "active" : "inactive" })}
                  />
                  <Label htmlFor="status">
                    {formData.status === "active" ? "Actif" : "Inactif"}
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Heure
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.schedule.time}
                  onChange={(e) => setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, time: e.target.value }
                  })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">
                  Fréquence
                </Label>
                <Select
                  value={formData.schedule.frequency}
                  onValueChange={(value: "daily" | "weekly" | "monthly") => setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, frequency: value }
                  })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner une fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Jours
                </Label>
                <div className="flex flex-wrap gap-2 col-span-3">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <Badge
                      key={day}
                      variant={formData.schedule.days.includes(day) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newDays = formData.schedule.days.includes(day)
                          ? formData.schedule.days.filter((d) => d !== day)
                          : [...formData.schedule.days, day];
                        setFormData({
                          ...formData,
                          schedule: { ...formData.schedule, days: newDays }
                        });
                      }}
                    >
                      {translateDay(day)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditScenario(null);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createScenarioMutation.isPending || updateScenarioMutation.isPending}
              >
                {(createScenarioMutation.isPending || updateScenarioMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editScenario ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteScenarioId !== null} onOpenChange={(open) => {
        if (!open) setDeleteScenarioId(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir supprimer ce scénario ? Cette action est irréversible.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteScenarioId(null)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteScenarioId && deleteScenarioMutation.mutate(deleteScenarioId)}
              disabled={deleteScenarioMutation.isPending}
            >
              {deleteScenarioMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run All Confirmation Dialog */}
      <Dialog open={runAllConfirmOpen} onOpenChange={(open) => {
        if (!open) setRunAllConfirmOpen(false);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exécuter tous les scénarios</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir exécuter tous les scénarios actifs maintenant ?</p>
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attention</AlertTitle>
              <AlertDescription>
                Cette action déclenchera l'envoi de toutes les notifications configurées dans les scénarios actifs.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRunAllConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onClick={confirmRunAllScenarios}
              disabled={runAllScenariosMutation.isPending}
            >
              {runAllScenariosMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Exécuter tous
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScenariosTutorial />
    </div>
  );
}
