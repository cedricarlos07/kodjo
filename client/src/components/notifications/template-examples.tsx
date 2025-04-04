import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notificationTemplates } from "@/data/notification-templates";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplateExamplesProps {
  onUseTemplate?: (template: {
    name: string;
    description: string;
    type: "telegram" | "email" | "sms";
    content: string;
  }) => void;
}

export function NotificationTemplateExamples({ onUseTemplate }: TemplateExamplesProps) {
  const [activeTab, setActiveTab] = useState("telegram");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopyTemplate = (templateId: string, templateContent: string) => {
    navigator.clipboard.writeText(templateContent).then(() => {
      setCopiedId(templateId);
      toast({
        title: "Contenu copié !",
        description: "Le modèle a été copié dans le presse-papiers.",
        variant: "success",
      });
      
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }).catch(() => {
      toast({
        title: "Erreur",
        description: "Impossible de copier le contenu.",
        variant: "destructive",
      });
    });
  };
  
  const handleUseTemplate = (template: typeof notificationTemplates[0]) => {
    if (onUseTemplate) {
      onUseTemplate({
        name: template.name,
        description: template.description,
        type: template.type,
        content: template.content
      });
      
      toast({
        title: "Modèle sélectionné",
        description: "Le modèle a été sélectionné pour édition.",
        variant: "success",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemples de modèles de notification</CardTitle>
        <CardDescription>
          Des modèles structurés et attrayants avec emojis pour différents cas d'utilisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="telegram" className="w-full" onValueChange={setActiveTab}>
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
                  className="p-4 border rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">{template.name}</h3>
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                  <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {template.content}
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 5).map(variable => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.variables.length - 5}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="flex items-center gap-1"
                      >
                        Utiliser
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyTemplate(template.id, template.content)}
                        className="flex items-center gap-1"
                      >
                        {copiedId === template.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copier</span>
                          </>
                        )}
                      </Button>
                    </div>
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
                  className="p-4 border rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">{template.name}</h3>
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                  <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {template.content}
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 5).map(variable => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.variables.length - 5}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="flex items-center gap-1"
                      >
                        Utiliser
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyTemplate(template.id, template.content)}
                        className="flex items-center gap-1"
                      >
                        {copiedId === template.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copier</span>
                          </>
                        )}
                      </Button>
                    </div>
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
                  className="p-4 border rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">{template.name}</h3>
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                  <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {template.content}
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 5).map(variable => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.variables.length - 5}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="flex items-center gap-1"
                      >
                        Utiliser
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyTemplate(template.id, template.content)}
                        className="flex items-center gap-1"
                      >
                        {copiedId === template.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copier</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            }
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
