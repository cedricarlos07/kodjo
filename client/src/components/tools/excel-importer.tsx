import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { FileIcon, Upload as UploadIcon, CheckCircle as CheckCircleIcon, AlertCircle as AlertCircleIcon, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ExcelImporterProps {
  onSuccess?: () => void;
  className?: string;
}

export function ExcelImporter({ onSuccess, className = '' }: ExcelImporterProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: boolean;
    message: string;
    details?: {
      created: number;
      updated: number;
      errors: number;
    };
  } | null>(null);
  const [fileSource, setFileSource] = useState<'upload' | 'default'>('default');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier si le fichier est un Excel
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast({
          title: 'Format incorrect',
          description: 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls)',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
      setImportResults(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const importExcel = async () => {
    setIsUploading(true);
    setProgress(10);
    
    try {
      const formData = new FormData();
      
      // Si le fichier existe, l'ajouter au formData, sinon utiliser le chemin par défaut
      let filePath = 'attached_assets/Kodjo English - Classes Schedules (2).xlsx';
      
      if (fileSource === 'upload' && file) {
        formData.append('file', file);
        filePath = `uploads/${file.name}`;
      }
      
      setProgress(30);
      
      // Appeler l'API d'importation
      const response = await apiRequest('POST', '/api/import/excel', { filePath });
      
      setProgress(90);
      
      const data = await response.json();
      
      setImportResults(data);
      
      if (data.success) {
        toast({
          title: 'Importation réussie',
          description: data.message,
        });
        
        // Invalider les requêtes pour mettre à jour les données
        queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
        
        // Appeler le callback de succès si fourni
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: 'Échec de l\'importation',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'importation du fichier Excel',
        variant: 'destructive',
      });
      
      setImportResults({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsUploading(false);
      setProgress(100);
    }
  };

  return (
    <Card className={`shadow-md ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <FileIcon className="mr-2 h-5 w-5 text-primary" />
          Importation des cours depuis Excel
        </CardTitle>
        <CardDescription>
          Importez les horaires de cours depuis un fichier Excel ou utilisez le fichier par défaut.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fileSource">Source du fichier</Label>
            <Select
              value={fileSource}
              onValueChange={(value: 'upload' | 'default') => {
                setFileSource(value);
                setImportResults(null);
              }}
            >
              <SelectTrigger id="fileSource" className="w-full">
                <SelectValue placeholder="Sélectionner la source du fichier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Utiliser le fichier par défaut</SelectItem>
                <SelectItem value="upload">Télécharger un nouveau fichier</SelectItem>
              </SelectContent>
            </Select>
            
            {fileSource === 'default' && (
              <p className="text-sm text-muted-foreground">
                Le fichier par défaut est situé à: <code className="bg-secondary px-1 py-0.5 rounded text-xs">attached_assets/Kodjo English - Classes Schedules (2).xlsx</code>
              </p>
            )}
          </div>
          
          {fileSource === 'upload' && (
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                className="hidden"
              />
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={triggerFileInput}
                  variant="outline"
                  size="sm"
                  className="mr-2"
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Sélectionner un fichier
                </Button>
                
                {file && (
                  <span className="text-sm">{file.name} ({Math.round(file.size / 1024)} KB)</span>
                )}
                
                {!file && fileSource === 'upload' && (
                  <span className="text-sm text-muted-foreground">Aucun fichier sélectionné</span>
                )}
              </div>
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <Label>Progression</Label>
              <Progress value={progress} className="w-full h-2" />
              <p className="text-sm text-muted-foreground">Traitement en cours, veuillez patienter...</p>
            </div>
          )}
          
          {importResults && (
            <>
              <Separator className="my-4" />
              
              <div className={`p-4 rounded-md ${importResults.success ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'}`}>
                <div className="flex items-start">
                  {importResults.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  ) : (
                    <AlertCircleIcon className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium">
                      {importResults.success ? 'Importation réussie' : 'Échec de l\'importation'}
                    </h3>
                    <p className="mt-1 text-sm">{importResults.message}</p>
                    
                    {importResults.details && (
                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div className="border border-green-200 bg-green-100 rounded p-2 text-center">
                          <span className="font-semibold block">{importResults.details.created}</span>
                          <span>créés</span>
                        </div>
                        <div className="border border-blue-200 bg-blue-100 rounded p-2 text-center">
                          <span className="font-semibold block">{importResults.details.updated}</span>
                          <span>mis à jour</span>
                        </div>
                        <div className="border border-amber-200 bg-amber-100 rounded p-2 text-center">
                          <span className="font-semibold block">{importResults.details.errors}</span>
                          <span>erreurs</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFile(null);
            setImportResults(null);
          }}
          disabled={isUploading || (!file && fileSource === 'upload')}
        >
          Réinitialiser
        </Button>
        
        <Button
          type="button"
          onClick={importExcel}
          disabled={isUploading || (fileSource === 'upload' && !file)}
          className="ml-auto"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importation en cours...
            </>
          ) : (
            <>
              <FileIcon className="mr-2 h-4 w-4" />
              Importer les cours
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}