import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Settings as SettingsIcon, AlertTriangle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";

interface AppSettings {
  id: number;
  simulationMode: boolean;
  testGroup: string | null;
  telegramToken: string;
  telegramChatId: string;
  zoomApiKey: string;
  zoomApiSecret: string;
}

const settingsFormSchema = z.object({
  simulationMode: z.boolean(),
  testGroup: z.string().nullable(),
  telegramToken: z.string(),
  telegramChatId: z.string(),
  zoomApiKey: z.string(),
  zoomApiSecret: z.string(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isAdmin } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect non-admin users
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access settings.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, navigate, toast]);

  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated && isAdmin,
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      simulationMode: true,
      testGroup: "",
      telegramToken: "",
      telegramChatId: "",
      zoomApiKey: "",
      zoomApiSecret: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        simulationMode: settings.simulationMode,
        testGroup: settings.testGroup,
        telegramToken: settings.telegramToken,
        telegramChatId: settings.telegramChatId,
        zoomApiKey: settings.zoomApiKey,
        zoomApiSecret: settings.zoomApiSecret,
      });
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      return await apiRequest("PUT", "/api/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:w-64`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Header
          title="Settings"
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="general">
                  <TabsList className="mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="telegram">Telegram</TabsTrigger>
                    <TabsTrigger value="zoom">Zoom</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general">
                    <Card>
                      <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>
                          Configure general application settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="simulationMode"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <FormLabel className="text-base">Simulation Mode</FormLabel>
                                <FormDescription>
                                  When enabled, external services (Telegram, Zoom) are simulated
                                </FormDescription>
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

                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Simulation Mode {form.watch("simulationMode") ? "Enabled" : "Disabled"}</AlertTitle>
                          <AlertDescription>
                            {form.watch("simulationMode")
                              ? "External services are being simulated. No real messages will be sent or received."
                              : "External services will be called. Make sure API keys and tokens are correctly configured."}
                          </AlertDescription>
                        </Alert>

                        <FormField
                          control={form.control}
                          name="testGroup"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Test Group</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Test Group ID or Name"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                />
                              </FormControl>
                              <FormDescription>
                                Used for testing notifications when in simulation mode
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="telegram">
                    <Card>
                      <CardHeader>
                        <CardTitle>Telegram Integration</CardTitle>
                        <CardDescription>
                          Configure Telegram Bot API settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="telegramToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telegram Bot Token</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123456789:ABCDEF..."
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Get this from @BotFather
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="telegramChatId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Chat ID</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="-100123456789"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="space-y-1">
                                <p>The default chat/group ID for notifications</p>
                                <p className="text-xs text-gray-500">
                                  <strong>Important :</strong> Ce doit être un ID de groupe valide au format <code>-100xxxxxxxxx</code>.
                                </p>
                                <p className="text-xs text-gray-500">
                                  Cet ID sera également utilisé comme groupe de test pour les simulations si aucun autre groupe n'est spécifié.
                                </p>
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Alert className={form.watch("simulationMode") ? "bg-yellow-50" : "bg-green-50"}>
                          <AlertTriangle className={form.watch("simulationMode") ? "text-yellow-600" : "text-green-600"} />
                          <AlertTitle>{form.watch("simulationMode") ? "Simulation Active" : "Live Mode"}</AlertTitle>
                          <AlertDescription>
                            {form.watch("simulationMode")
                              ? "Telegram messaging is being simulated. No real messages will be sent."
                              : "Telegram integration is active. Messages will be sent to real chat groups."}
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="zoom">
                    <Card>
                      <CardHeader>
                        <CardTitle>Zoom Integration</CardTitle>
                        <CardDescription>
                          Configure Zoom API settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="zoomApiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zoom API Key</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="AbCdEfGhIjKlMnOpQrStUvWxYz"
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Get this from the Zoom Developer Portal
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="zoomApiSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zoom API Secret</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123456abcdef..."
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                The secret for your Zoom application
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Alert className={form.watch("simulationMode") ? "bg-yellow-50" : "bg-green-50"}>
                          <AlertTriangle className={form.watch("simulationMode") ? "text-yellow-600" : "text-green-600"} />
                          <AlertTitle>{form.watch("simulationMode") ? "Simulation Active" : "Live Mode"}</AlertTitle>
                          <AlertDescription>
                            {form.watch("simulationMode")
                              ? "Zoom integration is being simulated. No real Zoom meetings will be created."
                              : "Zoom integration is active. Real Zoom meetings will be created."}
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="w-32"
                  >
                    {updateSettingsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </main>
      </div>
    </div>
  );
}
