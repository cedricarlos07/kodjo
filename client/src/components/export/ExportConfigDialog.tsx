import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Download, FileText, FileImage, Table as TableIcon, Settings, Columns } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExportOptions } from './ExportOptions';

interface ExportConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'pdf' | 'excel', options: ExportOptions) => void;
  data: any[];
  columns: { header: string; dataKey: string; width?: number }[];
  defaultOptions?: Partial<ExportOptions>;
  isExporting?: boolean;
}

const ExportConfigDialog: React.FC<ExportConfigDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  data,
  columns,
  defaultOptions = {},
  isExporting = false
}) => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [options, setOptions] = useState<ExportOptions>({
    fileName: defaultOptions.fileName || 'export',
    title: defaultOptions.title || '',
    subtitle: defaultOptions.subtitle || '',
    description: defaultOptions.description || '',
    columns: columns.map(col => ({
      ...col,
      includeInExport: true,
      format: undefined
    })),
    includeTimestamp: defaultOptions.includeTimestamp !== undefined ? defaultOptions.includeTimestamp : true,
    orientation: defaultOptions.orientation || 'portrait',
    pageSize: defaultOptions.pageSize || 'a4',
    logo: defaultOptions.logo || '',
    theme: defaultOptions.theme || {
      primary: '#4f46e5',
      secondary: '#0ea5e9',
      text: '#000000',
      background: '#ffffff',
      headerBackground: '#4f46e5',
      headerText: '#ffffff',
      alternateRowBackground: '#f5f7fa'
    },
    footer: defaultOptions.footer || '',
    includePageNumbers: defaultOptions.includePageNumbers !== undefined ? defaultOptions.includePageNumbers : true,
    author: defaultOptions.author || '',
    keywords: defaultOptions.keywords || [],
    password: defaultOptions.password || '',
    watermark: defaultOptions.watermark || '',
    filters: defaultOptions.filters || {},
    groupBy: defaultOptions.groupBy || '',
    sortBy: defaultOptions.sortBy || undefined,
    dateRange: defaultOptions.dateRange || undefined
  });

  const handleColumnToggle = (dataKey: string, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.dataKey === dataKey ? { ...col, includeInExport: checked } : col
      )
    }));
  };

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    onExport(format, options);
  };

  const pageSizes = [
    { value: 'a4', label: 'A4' },
    { value: 'a3', label: 'A3' },
    { value: 'letter', label: 'Letter' },
    { value: 'legal', label: 'Legal' }
  ];

  const orientations = [
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Paysage' }
  ];

  // Prévisualisation des données
  const previewData = data.slice(0, 5);
  const visibleColumns = options.columns.filter(col => col.includeInExport);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Configuration de l'exportation</DialogTitle>
          <DialogDescription>
            Personnalisez les options d'exportation pour vos données
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="general">
                <Settings className="w-4 h-4 mr-2" />
                Général
              </TabsTrigger>
              <TabsTrigger value="columns">
                <Columns className="w-4 h-4 mr-2" />
                Colonnes
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <FileImage className="w-4 h-4 mr-2" />
                Apparence
              </TabsTrigger>
              <TabsTrigger value="preview">
                <TableIcon className="w-4 h-4 mr-2" />
                Aperçu
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="general" className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fileName">Nom du fichier</Label>
                    <Input
                      id="fileName"
                      value={options.fileName}
                      onChange={(e) => setOptions({ ...options, fileName: e.target.value })}
                      placeholder="export"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Auteur</Label>
                    <Input
                      id="author"
                      value={options.author}
                      onChange={(e) => setOptions({ ...options, author: e.target.value })}
                      placeholder="Nom de l'auteur"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={options.title}
                    onChange={(e) => setOptions({ ...options, title: e.target.value })}
                    placeholder="Titre du rapport"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Sous-titre</Label>
                  <Input
                    id="subtitle"
                    value={options.subtitle}
                    onChange={(e) => setOptions({ ...options, subtitle: e.target.value })}
                    placeholder="Sous-titre du rapport"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={options.description}
                    onChange={(e) => setOptions({ ...options, description: e.target.value })}
                    placeholder="Description du rapport"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pageSize">Format de page</Label>
                    <Select
                      value={options.pageSize}
                      onValueChange={(value) => setOptions({ ...options, pageSize: value })}
                    >
                      <SelectTrigger id="pageSize">
                        <SelectValue placeholder="Sélectionner un format" />
                      </SelectTrigger>
                      <SelectContent>
                        {pageSizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orientation">Orientation</Label>
                    <Select
                      value={options.orientation}
                      onValueChange={(value) => setOptions({ ...options, orientation: value as 'portrait' | 'landscape' })}
                    >
                      <SelectTrigger id="orientation">
                        <SelectValue placeholder="Sélectionner une orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        {orientations.map((orientation) => (
                          <SelectItem key={orientation.value} value={orientation.value}>
                            {orientation.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer">Pied de page</Label>
                  <Input
                    id="footer"
                    value={options.footer}
                    onChange={(e) => setOptions({ ...options, footer: e.target.value })}
                    placeholder="Texte du pied de page"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTimestamp"
                    checked={options.includeTimestamp}
                    onCheckedChange={(checked) => setOptions({ ...options, includeTimestamp: checked as boolean })}
                  />
                  <Label htmlFor="includeTimestamp">Inclure la date et l'heure de génération</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePageNumbers"
                    checked={options.includePageNumbers}
                    onCheckedChange={(checked) => setOptions({ ...options, includePageNumbers: checked as boolean })}
                  />
                  <Label htmlFor="includePageNumbers">Inclure les numéros de page (PDF uniquement)</Label>
                </div>
              </TabsContent>

              <TabsContent value="columns" className="space-y-4 p-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Colonnes à inclure dans l'export</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allChecked = options.columns.every(col => col.includeInExport);
                        setOptions(prev => ({
                          ...prev,
                          columns: prev.columns.map(col => ({ ...col, includeInExport: !allChecked }))
                        }));
                      }}
                    >
                      {options.columns.every(col => col.includeInExport) ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </Button>
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Inclure</TableHead>
                            <TableHead>Nom de la colonne</TableHead>
                            <TableHead>Clé de données</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {options.columns.map((column) => (
                            <TableRow key={column.dataKey}>
                              <TableCell>
                                <Checkbox
                                  checked={column.includeInExport}
                                  onCheckedChange={(checked) => handleColumnToggle(column.dataKey, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell>{column.header}</TableCell>
                              <TableCell>{column.dataKey}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupBy">Regrouper par</Label>
                  <Select
                    value={options.groupBy || 'none'}
                    onValueChange={(value) => setOptions({ ...options, groupBy: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger id="groupBy">
                      <SelectValue placeholder="Aucun regroupement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun regroupement</SelectItem>
                      {options.columns.map((column) => (
                        <SelectItem key={column.dataKey} value={column.dataKey}>
                          {column.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tri</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      value={options.sortBy?.field || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setOptions({ ...options, sortBy: undefined });
                        } else {
                          setOptions({
                            ...options,
                            sortBy: {
                              field: value,
                              direction: options.sortBy?.direction || 'asc'
                            }
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Champ de tri" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun tri</SelectItem>
                        {options.columns.map((column) => (
                          <SelectItem key={column.dataKey} value={column.dataKey}>
                            {column.header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {options.sortBy?.field && (
                      <Select
                        value={options.sortBy.direction}
                        onValueChange={(value) => {
                          setOptions({
                            ...options,
                            sortBy: {
                              ...options.sortBy!,
                              direction: value as 'asc' | 'desc'
                            }
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascendant</SelectItem>
                          <SelectItem value="desc">Descendant</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-4 p-1">
                <div className="space-y-2">
                  <Label>Thème de couleurs</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor" className="text-xs">Couleur primaire</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={options.theme?.primary || '#4f46e5'}
                          onChange={(e) => setOptions({
                            ...options,
                            theme: { ...options.theme!, primary: e.target.value }
                          })}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={options.theme?.primary || '#4f46e5'}
                          onChange={(e) => setOptions({
                            ...options,
                            theme: { ...options.theme!, primary: e.target.value }
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor" className="text-xs">Couleur secondaire</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={options.theme?.secondary || '#0ea5e9'}
                          onChange={(e) => setOptions({
                            ...options,
                            theme: { ...options.theme!, secondary: e.target.value }
                          })}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={options.theme?.secondary || '#0ea5e9'}
                          onChange={(e) => setOptions({
                            ...options,
                            theme: { ...options.theme!, secondary: e.target.value }
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Couleurs du tableau</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="headerBg" className="text-xs">Arrière-plan des en-têtes</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="headerBg"
                          type="color"
                          value={options.theme?.headerBackground || '#4f46e5'}
                          onChange={(e) => setOptions({
                            ...options,
                            theme: { ...options.theme!, headerBackground: e.target.value }
                          })}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={options.theme?.headerBackground || '#4f46e5'}
                          onChange={(e) => setOptions({
                            ...options,
                            theme: { ...options.theme!, headerBackground: e.target.value }
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="headerText" className="text-xs">Texte des en-têtes</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="headerText"
                          type="color"
                          value={options.theme?.headerText || '#ffffff'}
                          onChange={(e) => setOptions({
                            ...options,
                            theme: { ...options.theme!, headerText: e.target.value }
                          })}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={options.theme?.headerText || '#ffffff'}
                          onChange={(e) => setOptions({
                            ...options,
                            theme: { ...options.theme!, headerText: e.target.value }
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="watermark">Filigrane (PDF uniquement)</Label>
                  <Input
                    id="watermark"
                    value={options.watermark}
                    onChange={(e) => setOptions({ ...options, watermark: e.target.value })}
                    placeholder="Texte du filigrane"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL (PDF uniquement)</Label>
                  <Input
                    id="logo"
                    value={options.logo}
                    onChange={(e) => setOptions({ ...options, logo: e.target.value })}
                    placeholder="URL du logo"
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="p-1">
                <div className="space-y-4">
                  <div className="border rounded-md p-4 bg-white">
                    {options.title && <h2 className="text-xl font-bold">{options.title}</h2>}
                    {options.subtitle && <h3 className="text-lg text-gray-700">{options.subtitle}</h3>}
                    {options.description && <p className="text-sm text-gray-600 mt-2">{options.description}</p>}
                    {options.includeTimestamp && (
                      <p className="text-xs text-gray-500 mt-2">Généré le: {new Date().toLocaleString()}</p>
                    )}

                    <div className="mt-4 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {visibleColumns.map((column) => (
                              <TableHead key={column.dataKey}>{column.header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.map((item, index) => (
                            <TableRow key={index}>
                              {visibleColumns.map((column) => (
                                <TableCell key={column.dataKey}>
                                  {item[column.dataKey] !== undefined && item[column.dataKey] !== null
                                    ? item[column.dataKey].toString()
                                    : ''}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {options.footer && (
                      <p className="text-xs text-gray-500 mt-4 text-center">{options.footer}</p>
                    )}
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>Aperçu limité aux 5 premières lignes. L'export complet contiendra toutes les données.</p>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        <DialogFooter className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {data.length} lignes, {visibleColumns.length} colonnes sélectionnées
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={isExporting}
            >
              {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportConfigDialog;
