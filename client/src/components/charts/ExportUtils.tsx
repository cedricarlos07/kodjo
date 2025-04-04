import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

// Type pour les options d'exportation
interface ExportOptions {
  fileName: string;
  title?: string;
  subtitle?: string;
  description?: string;
  columns?: {
    header: string;
    dataKey: string;
    width?: number;
    format?: (value: any) => string;
    includeInExport?: boolean;
  }[];
  includeTimestamp?: boolean;
  orientation?: 'portrait' | 'landscape';
  pageSize?: string;
  logo?: string;
  theme?: {
    primary?: string;
    secondary?: string;
    text?: string;
    background?: string;
    headerBackground?: string;
    headerText?: string;
    alternateRowBackground?: string;
  };
  footer?: string;
  includePageNumbers?: boolean;
  author?: string;
  keywords?: string[];
  password?: string;
  watermark?: string;
  filters?: Record<string, any>;
  groupBy?: string;
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  dateRange?: { startDate: Date; endDate: Date };
}

// Fonction pour exporter des données au format CSV
export const exportToCSV = (data: any[], options: ExportOptions) => {
  const { fileName, columns } = options;

  // Si les colonnes sont spécifiées, utiliser ces colonnes
  // Sinon, utiliser toutes les clés du premier élément
  const headers = columns
    ? columns.map(col => col.header)
    : Object.keys(data[0] || {});

  const dataKeys = columns
    ? columns.map(col => col.dataKey)
    : Object.keys(data[0] || {});

  // Créer le contenu CSV
  let csvContent = headers.join(',') + '\\n';

  // Ajouter les données
  data.forEach(item => {
    const row = dataKeys.map(key => {
      // Échapper les virgules et les guillemets
      const value = item[key] !== undefined && item[key] !== null ? item[key].toString() : '';
      return `"${value.replace(/"/g, '""')}"`;
    });
    csvContent += row.join(',') + '\\n';
  });

  // Créer un blob et télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${fileName}.csv`);
};

// Fonction pour exporter des données au format PDF
export const exportToPDF = (data: any[], options: ExportOptions) => {
  const {
    fileName,
    title = 'Rapport',
    subtitle = '',
    columns,
    includeTimestamp = true,
    orientation = 'portrait',
    pageSize = 'a4',
    logo
  } = options;

  // Créer un nouveau document PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize
  });

  // Ajouter le titre
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Ajouter le sous-titre
  if (subtitle) {
    doc.setFontSize(12);
    doc.text(subtitle, 14, 30);
  }

  // Ajouter la date et l'heure
  if (includeTimestamp) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const timestamp = new Date().toLocaleString();
    doc.text(`Généré le: ${timestamp}`, 14, 38);
    doc.setTextColor(0, 0, 0);
  }

  // Ajouter le logo si fourni
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 170, 10, 25, 25);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
    }
  }

  // Préparer les colonnes et les données pour le tableau
  const tableColumns = columns
    ? columns.map(col => ({ title: col.header, dataKey: col.dataKey }))
    : Object.keys(data[0] || {}).map(key => ({ title: key, dataKey: key }));

  // Ajouter le tableau
  (doc as any).autoTable({
    startY: includeTimestamp ? 45 : 35,
    columns: tableColumns,
    body: data,
    headStyles: {
      fillColor: [79, 70, 229], // Indigo
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { top: 45 }
  });

  // Enregistrer le PDF
  doc.save(`${fileName}.pdf`);
};

// Fonction pour exporter des données au format Excel (XLSX)
export const exportToExcel = (data: any[], options: ExportOptions) => {
  // Pour l'exportation Excel, nous utilisons simplement le CSV
  // Dans une implémentation réelle, vous pourriez utiliser une bibliothèque comme xlsx
  exportToCSV(data, options);
};

// Fonction utilitaire pour formater les données pour l'exportation
export const formatDataForExport = (data: any[], formatters: Record<string, (value: any) => any> = {}) => {
  return data.map(item => {
    const formattedItem: Record<string, any> = {};

    Object.keys(item).forEach(key => {
      if (formatters[key]) {
        formattedItem[key] = formatters[key](item[key]);
      } else {
        formattedItem[key] = item[key];
      }
    });

    return formattedItem;
  });
};

// Composant pour les boutons d'exportation
interface ExportButtonsProps {
  data: any[];
  options: ExportOptions;
  className?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ data, options, className }) => {
  return (
    <div className={`flex space-x-2 ${className || ''}`}>
      <button
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => exportToCSV(data, options)}
      >
        CSV
      </button>
      <button
        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        onClick={() => exportToPDF(data, options)}
      >
        PDF
      </button>
      <button
        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        onClick={() => exportToExcel(data, options)}
      >
        Excel
      </button>
    </div>
  );
};
