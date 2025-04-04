import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ZoomLinksTutorial } from "@/components/tutorials";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Video, Edit, Trash2, Plus, Info, ExternalLink, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
interface ZoomLink {
  id: number;
  name: string;
  description: string;
  zoomUrl: string;
  zoomId: string;
  zoomPassword: string;
  telegramGroupId: string;
  courseLevel: string | null;
  courseSchedule: string | null;
  instructor: string | null;
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

export default function ZoomLinksPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editZoomLink, setEditZoomLink] = useState<ZoomLink | null>(null);
  const [deleteZoomLinkId, setDeleteZoomLinkId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    zoomUrl: "",
    zoomId: "",
    zoomPassword: "",
    telegramGroupId: "",
    courseLevel: "",
    courseSchedule: "",
    instructor: ""
  });

  // Fetch zoom links
  const { data: zoomLinks, isLoading } = useQuery<ZoomLink[]>({
    queryKey: ["/api/zoom-links"],
    enabled: isAuthenticated,
  });

  // Fetch telegram groups
  const { data: telegramGroups } = useQuery<TelegramGroup[]>({
    queryKey: ["/api/telegram-groups"],
    enabled: isAuthenticated,
  });

  // Create zoom link mutation
  const createZoomLinkMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/zoom-links", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zoom-links"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Lien Zoom créé",
        description: "Le lien Zoom a été créé avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du lien Zoom.",
        variant: "destructive",
      });
    },
  });

  // Update zoom link mutation
  const updateZoomLinkMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest(`/api/zoom-links/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zoom-links"] });
      setEditZoomLink(null);
      resetForm();
      toast({
        title: "Lien Zoom mis à jour",
        description: "Le lien Zoom a été mis à jour avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour du lien Zoom.",
        variant: "destructive",
      });
    },
  });

  // Delete zoom link mutation
  const deleteZoomLinkMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/zoom-links/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zoom-links"] });
      setDeleteZoomLinkId(null);
      toast({
        title: "Lien Zoom supprimé",
        description: "Le lien Zoom a été supprimé avec succès.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression du lien Zoom.",
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      zoomUrl: "",
      zoomId: "",
      zoomPassword: "",
      telegramGroupId: "",
      courseLevel: "",
      courseSchedule: "",
      instructor: ""
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editZoomLink) {
      updateZoomLinkMutation.mutate({ id: editZoomLink.id, data: formData });
    } else {
      createZoomLinkMutation.mutate(formData);
    }
  };

  // Handle edit zoom link
  const handleEditZoomLink = (zoomLink: ZoomLink) => {
    setEditZoomLink(zoomLink);
    setFormData({
      name: zoomLink.name,
      description: zoomLink.description,
      zoomUrl: zoomLink.zoomUrl,
      zoomId: zoomLink.zoomId,
      zoomPassword: zoomLink.zoomPassword,
      telegramGroupId: zoomLink.telegramGroupId,
      courseLevel: zoomLink.courseLevel || "",
      courseSchedule: zoomLink.courseSchedule || "",
      instructor: zoomLink.instructor || ""
    });
  };

  // Handle delete zoom link
  const handleDeleteZoomLink = (id: number) => {
    setDeleteZoomLinkId(id);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copié !",
        description: message,
        variant: "success",
      });
    }).catch(() => {
      toast({
        title: "Erreur",
        description: "Impossible de copier dans le presse-papiers.",
        variant: "destructive",
      });
    });
  };

  // Filter zoom links based on active tab
  const filteredZoomLinks = zoomLinks?.filter(zoomLink => {
    if (activeTab === "all") return true;
    if (activeTab === "level" && zoomLink.courseLevel) return true;
    if (activeTab === "schedule" && zoomLink.courseSchedule) return true;
    if (activeTab === "instructor" && zoomLink.instructor) return true;
    return false;
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

  // Get telegram group name
  const getTelegramGroupName = (chatId: string) => {
    const group = telegramGroups?.find(group => group.chatId === chatId);
    return group ? group.name : chatId;
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
          title="Gestion des Liens Zoom"
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Liens Zoom par Groupe</CardTitle>
                <CardDescription>
                  Gérez les liens Zoom associés aux groupes Telegram
                </CardDescription>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un lien Zoom
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="level">Par niveau</TabsTrigger>
                  <TabsTrigger value="schedule">Par horaire</TabsTrigger>
                  <TabsTrigger value="instructor">Par coach</TabsTrigger>
                </TabsList>

                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : filteredZoomLinks && filteredZoomLinks.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Table className="border rounded-md">
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">Nom</TableHead>
                          <TableHead className="font-semibold">Groupe Telegram</TableHead>
                          <TableHead className="font-semibold">Informations</TableHead>
                          <TableHead className="font-semibold">Lien Zoom</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredZoomLinks.map((zoomLink) => (
                          <TableRow key={zoomLink.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{zoomLink.name}</span>
                                <span className="text-xs text-gray-500">{zoomLink.description}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getTelegramGroupName(zoomLink.telegramGroupId)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col space-y-1">
                                {zoomLink.courseLevel && (
                                  <Badge variant="outline" className="w-fit">
                                    Niveau: {zoomLink.courseLevel}
                                  </Badge>
                                )}
                                {zoomLink.courseSchedule && (
                                  <Badge variant="outline" className="w-fit">
                                    Horaire: {zoomLink.courseSchedule}
                                  </Badge>
                                )}
                                {zoomLink.instructor && (
                                  <Badge variant="outline" className="w-fit">
                                    Coach: {zoomLink.instructor}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                  <a
                                    href={zoomLink.zoomUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    <span className="text-sm">Ouvrir le lien</span>
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={() => copyToClipboard(zoomLink.zoomUrl, "Lien Zoom copié dans le presse-papiers")}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">ID: {zoomLink.zoomId}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5"
                                    onClick={() => copyToClipboard(zoomLink.zoomId, "ID Zoom copié dans le presse-papiers")}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Mot de passe: {zoomLink.zoomPassword}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5"
                                    onClick={() => copyToClipboard(zoomLink.zoomPassword, "Mot de passe Zoom copié dans le presse-papiers")}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditZoomLink(zoomLink)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteZoomLink(zoomLink.id)}
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
                      <Video className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun lien Zoom trouvé</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Commencez par créer un nouveau lien Zoom pour un groupe Telegram.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un lien Zoom
                    </Button>
                  </div>
                )}
              </Tabs>

              <div className="mt-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Gestion des liens Zoom</AlertTitle>
                  <AlertDescription>
                    Associez des liens Zoom à des groupes Telegram spécifiques. Vous pouvez également filtrer les liens par niveau, horaire ou coach pour une meilleure organisation.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || editZoomLink !== null} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditZoomLink(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editZoomLink ? "Modifier le lien Zoom" : "Créer un nouveau lien Zoom"}
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
                <Label htmlFor="telegramGroupId" className="text-right">
                  Groupe Telegram
                </Label>
                <Select
                  value={formData.telegramGroupId}
                  onValueChange={(value) => setFormData({ ...formData, telegramGroupId: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    {telegramGroups?.map((group) => (
                      <SelectItem key={group.id} value={group.chatId}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="zoomUrl" className="text-right">
                  Lien Zoom
                </Label>
                <Input
                  id="zoomUrl"
                  value={formData.zoomUrl}
                  onChange={(e) => setFormData({ ...formData, zoomUrl: e.target.value })}
                  className="col-span-3"
                  placeholder="https://zoom.us/j/123456789"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="zoomId" className="text-right">
                  ID Zoom
                </Label>
                <Input
                  id="zoomId"
                  value={formData.zoomId}
                  onChange={(e) => setFormData({ ...formData, zoomId: e.target.value })}
                  className="col-span-3"
                  placeholder="123 456 789"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="zoomPassword" className="text-right">
                  Mot de passe
                </Label>
                <Input
                  id="zoomPassword"
                  value={formData.zoomPassword}
                  onChange={(e) => setFormData({ ...formData, zoomPassword: e.target.value })}
                  className="col-span-3"
                  placeholder="123456"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="courseLevel" className="text-right">
                  Niveau (optionnel)
                </Label>
                <Input
                  id="courseLevel"
                  value={formData.courseLevel}
                  onChange={(e) => setFormData({ ...formData, courseLevel: e.target.value })}
                  className="col-span-3"
                  placeholder="BBG, ABG, IG, etc."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="courseSchedule" className="text-right">
                  Horaire (optionnel)
                </Label>
                <Input
                  id="courseSchedule"
                  value={formData.courseSchedule}
                  onChange={(e) => setFormData({ ...formData, courseSchedule: e.target.value })}
                  className="col-span-3"
                  placeholder="MW, TT, FS, etc."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="instructor" className="text-right">
                  Coach (optionnel)
                </Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="col-span-3"
                  placeholder="Nom du coach"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditZoomLink(null);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createZoomLinkMutation.isPending || updateZoomLinkMutation.isPending}
              >
                {(createZoomLinkMutation.isPending || updateZoomLinkMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editZoomLink ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteZoomLinkId !== null} onOpenChange={(open) => {
        if (!open) setDeleteZoomLinkId(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir supprimer ce lien Zoom ? Cette action est irréversible.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteZoomLinkId(null)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteZoomLinkId && deleteZoomLinkMutation.mutate(deleteZoomLinkId)}
              disabled={deleteZoomLinkMutation.isPending}
            >
              {deleteZoomLinkMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ZoomLinksTutorial />
    </div>
  );
}
