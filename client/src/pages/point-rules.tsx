import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Save, X, Info, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";

// Types
interface PointRule {
  id: number;
  name: string;
  description: string | null;
  activityType: string;
  pointsAmount: number;
  conditions: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface PointRuleFormData {
  name: string;
  description: string;
  activityType: string;
  pointsAmount: number;
  conditions: string;
  active: boolean;
}

export default function PointRulesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PointRule | null>(null);
  const [formData, setFormData] = useState<PointRuleFormData>({
    name: "",
    description: "",
    activityType: "attendance",
    pointsAmount: 10,
    conditions: "",
    active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Fetch point rules
  const { data: pointRules, isLoading } = useQuery<PointRule[]>({
    queryKey: ["/api/point-rules"],
    enabled: isAuthenticated,
  });

  // Create point rule mutation
  const createPointRuleMutation = useMutation({
    mutationFn: async (data: PointRuleFormData) => {
      const response = await apiRequest("/api/point-rules", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/point-rules"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Règle de points créée",
        description: "La règle de points a été créée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la création de la règle de points: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update point rule mutation
  const updatePointRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PointRuleFormData }) => {
      const response = await apiRequest(`/api/point-rules/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/point-rules"] });
      setIsEditDialogOpen(false);
      setSelectedRule(null);
      toast({
        title: "Règle de points mise à jour",
        description: "La règle de points a été mise à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la mise à jour de la règle de points: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete point rule mutation
  const deletePointRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/point-rules/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/point-rules"] });
      setIsDeleteDialogOpen(false);
      setSelectedRule(null);
      toast({
        title: "Règle de points supprimée",
        description: "La règle de points a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression de la règle de points: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      activityType: "attendance",
      pointsAmount: 10,
      conditions: "",
      active: true
    });
  };

  const handleCreateRule = () => {
    createPointRuleMutation.mutate(formData);
  };

  const handleUpdateRule = () => {
    if (selectedRule) {
      updatePointRuleMutation.mutate({ id: selectedRule.id, data: formData });
    }
  };

  const handleDeleteRule = () => {
    if (selectedRule) {
      deletePointRuleMutation.mutate(selectedRule.id);
    }
  };

  const openEditDialog = (rule: PointRule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      activityType: rule.activityType,
      pointsAmount: rule.pointsAmount,
      conditions: rule.conditions || "",
      active: rule.active
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (rule: PointRule) => {
    setSelectedRule(rule);
    setIsDeleteDialogOpen(true);
  };

  const activityTypeOptions = [
    { value: "attendance", label: "Présence" },
    { value: "message", label: "Message" },
    { value: "participation", label: "Participation" },
    { value: "homework", label: "Devoir" },
    { value: "bonus", label: "Bonus" }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Règles d'attribution de points" />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Règles d'attribution de points</h1>
            {isAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle règle
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle règle de points</DialogTitle>
                    <DialogDescription>
                      Définissez comment les points sont attribués pour différentes activités.
                    </DialogDescription>
                  </DialogHeader>
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
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="activityType" className="text-right">
                        Type d'activité
                      </Label>
                      <Select
                        value={formData.activityType}
                        onValueChange={(value) => setFormData({ ...formData, activityType: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Sélectionnez un type d'activité" />
                        </SelectTrigger>
                        <SelectContent>
                          {activityTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pointsAmount" className="text-right">
                        Nombre de points
                      </Label>
                      <Input
                        id="pointsAmount"
                        type="number"
                        value={formData.pointsAmount}
                        onChange={(e) => setFormData({ ...formData, pointsAmount: parseInt(e.target.value) })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="conditions" className="text-right">
                        Conditions
                      </Label>
                      <Textarea
                        id="conditions"
                        value={formData.conditions}
                        onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                        placeholder={"Ex: {\"minDuration\": 30} pour une durée minimale de 30 minutes"}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="active" className="text-right">
                        Active
                      </Label>
                      <div className="flex items-center space-x-2 col-span-3">
                        <Switch
                          id="active"
                          checked={formData.active}
                          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                        />
                        <Label htmlFor="active">{formData.active ? "Oui" : "Non"}</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateRule} disabled={createPointRuleMutation.isPending}>
                      {createPointRuleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Créer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Tabs defaultValue="rules">
            <TabsList className="mb-4">
              <TabsTrigger value="rules">Règles de points</TabsTrigger>
              <TabsTrigger value="info">Informations</TabsTrigger>
            </TabsList>
            <TabsContent value="rules">
              <Card>
                <CardHeader>
                  <CardTitle>Règles d'attribution de points</CardTitle>
                  <CardDescription>
                    Configurez comment les points sont attribués aux utilisateurs pour différentes activités.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : pointRules && pointRules.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Type d'activité</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Statut</TableHead>
                          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pointRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.name}</TableCell>
                            <TableCell>
                              {activityTypeOptions.find(opt => opt.value === rule.activityType)?.label || rule.activityType}
                            </TableCell>
                            <TableCell>{rule.pointsAmount}</TableCell>
                            <TableCell>
                              <Badge variant={rule.active ? "default" : "secondary"}>
                                {rule.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(rule)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog(rule)}
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
                      Aucune règle de points n'a été définie.
                      {isAdmin && (
                        <div className="mt-4">
                          <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Créer une règle
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>À propos des règles de points</CardTitle>
                  <CardDescription>
                    Comprendre comment fonctionnent les règles d'attribution de points
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Qu'est-ce que les règles de points ?</AlertTitle>
                    <AlertDescription>
                      Les règles de points définissent comment les points sont attribués aux utilisateurs pour différentes activités.
                      Ces points sont utilisés pour calculer les classements quotidiens, hebdomadaires et mensuels.
                    </AlertDescription>
                  </Alert>

                  <h3 className="text-lg font-semibold mt-4">Types d'activités</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Présence</strong> - Points attribués pour la participation à un cours Zoom</li>
                    <li><strong>Message</strong> - Points attribués pour l'envoi de messages dans les groupes Telegram</li>
                    <li><strong>Participation</strong> - Points attribués pour la participation active pendant les cours</li>
                    <li><strong>Devoir</strong> - Points attribués pour la réalisation de devoirs</li>
                    <li><strong>Bonus</strong> - Points bonus attribués manuellement par les administrateurs</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4">Conditions</h3>
                  <p>
                    Les conditions permettent de définir des critères spécifiques pour l'attribution des points.
                    Par exemple, vous pouvez définir une durée minimale de présence pour attribuer des points de présence.
                  </p>
                  <p>
                    Les conditions sont définies au format JSON. Exemple : <code>{`{"minDuration": 30}`}</code> pour une durée minimale de 30 minutes.
                  </p>

                  <Alert variant="warning" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      La modification des règles de points affectera l'attribution des points à partir de maintenant,
                      mais ne modifiera pas les points déjà attribués. Pour recalculer tous les classements,
                      utilisez la fonction "Recalculer les classements" dans la page des classements.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Dialog */}
          {selectedRule && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Modifier la règle de points</DialogTitle>
                  <DialogDescription>
                    Modifiez les paramètres de la règle de points.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-name" className="text-right">
                      Nom
                    </Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-activityType" className="text-right">
                      Type d'activité
                    </Label>
                    <Select
                      value={formData.activityType}
                      onValueChange={(value) => setFormData({ ...formData, activityType: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionnez un type d'activité" />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-pointsAmount" className="text-right">
                      Nombre de points
                    </Label>
                    <Input
                      id="edit-pointsAmount"
                      type="number"
                      value={formData.pointsAmount}
                      onChange={(e) => setFormData({ ...formData, pointsAmount: parseInt(e.target.value) })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-conditions" className="text-right">
                      Conditions
                    </Label>
                    <Textarea
                      id="edit-conditions"
                      value={formData.conditions}
                      onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                      placeholder={"Ex: {\"minDuration\": 30} pour une durée minimale de 30 minutes"}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-active" className="text-right">
                      Active
                    </Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch
                        id="edit-active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                      />
                      <Label htmlFor="edit-active">{formData.active ? "Oui" : "Non"}</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleUpdateRule} disabled={updatePointRuleMutation.isPending}>
                    {updatePointRuleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Dialog */}
          {selectedRule && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Confirmer la suppression</DialogTitle>
                  <DialogDescription>
                    Êtes-vous sûr de vouloir supprimer la règle de points "{selectedRule.name}" ?
                    Cette action est irréversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteRule} disabled={deletePointRuleMutation.isPending}>
                    {deletePointRuleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
