import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import ExportConfigDialog from './ExportConfigDialog';
import { ExportOptions } from './ExportOptions';
import { exportToCSV, exportToPDF, exportToExcel } from './ExportService';

interface ExportButtonProps {
  data: any[];
  columns: { header: string; dataKey: string; width?: number }[];
  defaultOptions?: Partial<ExportOptions>;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  label?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  columns,
  defaultOptions = {},
  className = '',
  variant = 'default',
  size = 'default',
  showIcon = true,
  label = 'Exporter'
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf' | 'excel', options: ExportOptions) => {
    try {
      setIsExporting(true);
      
      // Exporter les données selon le format choisi
      if (format === 'csv') {
        exportToCSV(data, options);
      } else if (format === 'pdf') {
        exportToPDF(data, options);
      } else if (format === 'excel') {
        exportToExcel(data, options);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsDialogOpen(true)}
        disabled={isExporting || data.length === 0}
      >
        {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {showIcon && <Download className="mr-2 h-4 w-4" />}
        {label}
      </Button>
      
      <ExportConfigDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onExport={handleExport}
        data={data}
        columns={columns}
        defaultOptions={defaultOptions}
        isExporting={isExporting}
      />
    </>
  );
};

export default ExportButton;
