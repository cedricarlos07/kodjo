import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Bot, Code, Clock, Plus, Play, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { ExcelImporter } from "@/components/tools/excel-importer";

interface Scenario {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  pythonCode: string | null;
  schedule: string | null;
  actions: string | null;
  isCustomCode: boolean;
  active: boolean;
  lastRun: string | null;
  color: string;
  icon: string;
}

const scenarioFormSchema = z.object({
  name: z.string().min(1, "Identifiant technique requis")
    .regex(/^[a-z0-9_]+$/, "L'identifiant doit être en minuscules, sans espaces (utilisez _ pour séparer les mots)"),
  displayName: z.string().min(1, "Nom d'affichage requis"),
  description: z.string().optional(),
  pythonCode: z.string().optional(),
  schedule: z.string().optional(),
  actions: z.string().optional(),
  isCustomCode: z.boolean().default(false),
  active: z.boolean().default(true),
  color: z.string().default("#6366f1"),
  icon: z.string().default("robot"),
});

type ScenarioFormValues = z.infer<typeof scenarioFormSchema>;

export default function Automation() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [editScenario, setEditScenario] = useState<Scenario | null>(null);
  const [deleteScenarioId, setDeleteScenarioId] = useState<number | null>(null);
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: scenarios, isLoading } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
    enabled: isAuthenticated,
  });

  const form = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      pythonCode: "# Add your Python code here\n\n# Example:\n# def run_scenario(context):\n#     print('Hello from automation!')\n#     return True",
      schedule: "0 0 * * *", // Default: At midnight
      actions: "",
      isCustomCode: false,
      active: true,
      color: "#6366f1",
      icon: "robot",
    },
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (data: ScenarioFormValues) => {
      if (editScenario) {
        return await apiRequest("PUT", `/api/scenarios/${editScenario.id}`, data);
      } else {
        return await apiRequest("POST", "/api/scenarios", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editScenario 
          ? "Scenario has been updated successfully." 
          : "Scenario has been created successfully.",
      });
      setScenarioDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save scenario",
        variant: "destructive",
      });
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/scenarios/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scenario has been deleted successfully.",
      });
      setDeleteScenarioId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete scenario",
        variant: "destructive",
      });
    },
  });

  const runScenarioMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/scenarios/${id}/run`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scenario has been run successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run scenario",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScenarioFormValues) => {
    createScenarioMutation.mutate(data);
  };

  const handleEditScenario = (scenario: Scenario) => {
    setEditScenario(scenario);
    form.reset({
      name: scenario.name,
      displayName: scenario.displayName,
      description: scenario.description || "",
      pythonCode: scenario.pythonCode || "",
      schedule: scenario.schedule || "",
      actions: scenario.actions || "",
      isCustomCode: scenario.isCustomCode,
      active: scenario.active,
      color: scenario.color,
      icon: scenario.icon,
    });
    setScenarioDialogOpen(true);
  };

  const handleDeleteScenario = (id: number) => {
    setDeleteScenarioId(id);
  };

  const handleRunScenario = (id: number) => {
    runScenarioMutation.mutate(id);
  };

  const handleAddNewScenario = () => {
    setEditScenario(null);
    form.reset();
    setScenarioDialogOpen(true);
  };

  const getScenarioColorClass = (color: string) => {
    switch (color) {
      case "#6366f1": return "bg-primary-100 text-primary-600";
      case "#10b981": return "bg-green-100 text-green-600";
      case "#f59e0b": return "bg-yellow-100 text-yellow-600";
      case "#ef4444": return "bg-red-100 text-red-600";
      case "#8b5cf6": return "bg-purple-100 text-purple-600";
      case "#3b82f6": return "bg-blue-100 text-blue-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getScenarioIcon = (icon: string) => {
    switch (icon) {
      case "robot": return <Bot className="h-5 w-5" />;
      case "code": return <Code className="h-5 w-5" />;
      case "clock": return <Clock className="h-5 w-5" />;
      default: return <Bot className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:w-64`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Header 
          title="Automation" 
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Excel Importer Card */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <FileSpreadsheet className="h-5 w-5 mr-2" />
                      Importation des cours depuis Excel
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cet outil vous permet d'importer ou de mettre à jour les informations des cours à partir d'un fichier Excel.
                    Utilisez le fichier par défaut ou téléchargez votre propre fichier Excel contenant les horaires et informations des cours.
                  </p>
                  <ExcelImporter onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
                  }} />
                </CardContent>
              </Card>
            )}

            {/* Automation Scenarios Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Automation Scenarios</CardTitle>
                  {isAdmin && (
                    <Button onClick={handleAddNewScenario}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Scenario
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : scenarios && scenarios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scenarios.map((scenario) => (
                    <div 
                      key={scenario.id} 
                      className="bg-white rounded-lg border shadow-sm p-4 transition-shadow hover:shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${getScenarioColorClass(scenario.color)}`}>
                            {getScenarioIcon(scenario.icon)}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{scenario.displayName}</h3>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {scenario.description || "No description"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {scenario.isCustomCode ? "Custom code" : "Predefined actions"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Switch 
                            checked={scenario.active} 
                            disabled={!isAdmin}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAdmin) {
                                createScenarioMutation.mutate({
                                  name: scenario.name,
                                  displayName: scenario.displayName,
                                  description: scenario.description || "",
                                  pythonCode: scenario.pythonCode || "",
                                  schedule: scenario.schedule || "",
                                  actions: scenario.actions || "",
                                  isCustomCode: scenario.isCustomCode,
                                  active: !scenario.active,
                                  color: scenario.color,
                                  icon: scenario.icon,
                                });
                              }
                            }} 
                          />
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 flex items-center mb-3">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{scenario.schedule || "No schedule"}</span>
                      </div>
                      
                      {scenario.lastRun && (
                        <div className="text-xs text-gray-500 mb-3">
                          Last ran: {new Date(scenario.lastRun).toLocaleString()}
                        </div>
                      )}
                      
                      {isAdmin && (
                        <div className="flex justify-between mt-4">
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRunScenario(scenario.id)}
                              disabled={runScenarioMutation.isPending}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Run Now
                            </Button>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditScenario(scenario)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteScenario(scenario.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Bot className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No automation scenarios</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first automation scenario to streamline tasks.
                  </p>
                  {isAdmin && (
                    <Button onClick={handleAddNewScenario}>
                      Create Scenario
                    </Button>
                  )}
                </div>
              )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Create/Edit Scenario Dialog */}
      <Dialog open={scenarioDialogOpen} onOpenChange={setScenarioDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editScenario ? "Edit Scenario" : "Create New Scenario"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identifiant technique</FormLabel>
                      <FormControl>
                        <Input placeholder="my_scenario" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">Identifiant interne, sans espace ni caractères spéciaux</p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'affichage</FormLabel>
                      <FormControl>
                        <Input placeholder="Mon Scénario d'Automatisation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planification (Expression Cron)</FormLabel>
                      <FormControl>
                        <Input placeholder="0 0 * * *" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">Format: minute heure jour-du-mois mois jour-de-semaine</p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isCustomCode"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <FormLabel className="text-base">Code personnalisé</FormLabel>
                        <p className="text-sm text-gray-500">Utiliser du code Python personnalisé</p>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what this scenario does" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Tabs defaultValue="code">
                <TabsList>
                  <TabsTrigger value="code">Code Python</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                  <TabsTrigger value="settings">Configuration visuelle</TabsTrigger>
                </TabsList>
                <TabsContent value="code">
                  <FormField
                    control={form.control}
                    name="pythonCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="# Add your Python code here" 
                            className="font-mono h-60"
                            {...field} 
                            disabled={!form.watch("isCustomCode")}
                          />
                        </FormControl>
                        <FormMessage />
                        {!form.watch("isCustomCode") && (
                          <p className="text-xs text-amber-500 mt-2">
                            Activez l'option "Code personnalisé" pour modifier le code Python directement
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="actions">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border bg-gray-50">
                      <h3 className="text-base font-medium mb-2">Configuration des actions</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Configurez les actions à exécuter dans ce scénario. Les actions seront exécutées dans l'ordre indiqué.
                      </p>
                      <FormField
                        control={form.control}
                        name="actions"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder='{"actions": [{"type": "send_notification", "params": {"channel": "telegram", "message": "Bonjour"}}]}'
                                className="font-mono h-40"
                                {...field} 
                                disabled={form.watch("isCustomCode")}
                              />
                            </FormControl>
                            <FormMessage />
                            {form.watch("isCustomCode") && (
                              <p className="text-xs text-amber-500 mt-2">
                                Désactivez l'option "Code personnalisé" pour configurer les actions
                              </p>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="p-4 rounded-lg border">
                      <h3 className="text-sm font-medium mb-2">Exemple de format JSON pour les actions:</h3>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
{`{
  "actions": [
    {
      "type": "send_notification",
      "params": {
        "channel": "telegram",
        "message": "Cours à venir: {{course.name}} à {{course.time}}"
      }
    },
    {
      "type": "create_zoom_link",
      "params": {
        "course_id": 1,
        "topic": "{{course.name}}"
      }
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="settings">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <div className="flex gap-2">
                            {["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"].map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded-full ${field.value === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => form.setValue('color', color)}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon</FormLabel>
                          <div className="flex gap-2">
                            {[
                              { value: "robot", icon: <Bot className="h-5 w-5" /> },
                              { value: "code", icon: <Code className="h-5 w-5" /> },
                              { value: "clock", icon: <Clock className="h-5 w-5" /> }
                            ].map((iconOption) => (
                              <button
                                key={iconOption.value}
                                type="button"
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  field.value === iconOption.value 
                                    ? "ring-2 ring-offset-2 ring-gray-400 bg-gray-100"
                                    : "bg-gray-50"
                                }`}
                                onClick={() => form.setValue("icon", iconOption.value)}
                              >
                                {iconOption.icon}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between mt-4 p-3 border rounded-lg">
                        <div>
                          <FormLabel className="text-base">Scenario Status</FormLabel>
                          <p className="text-sm text-gray-500">Enable or disable this automation scenario</p>
                        </div>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button type="submit" disabled={createScenarioMutation.isPending}>
                  {createScenarioMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editScenario ? "Update Scenario" : "Create Scenario"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteScenarioId !== null} onOpenChange={(open) => !open && setDeleteScenarioId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this automation scenario. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteScenarioId && deleteScenarioMutation.mutate(deleteScenarioId)}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteScenarioMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}