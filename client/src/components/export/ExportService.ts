import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { ExportOptions } from './ExportOptions';

/**
 * Exporte des données au format CSV
 */
export const exportToCSV = (data: any[], options: ExportOptions) => {
  const { fileName, columns, title, subtitle, description, filters, dateRange, includeTimestamp } = options;
  
  // Filtrer les colonnes à inclure dans l'export
  const exportColumns = columns 
    ? columns.filter(col => col.includeInExport !== false)
    : [];
  
  // Si les colonnes sont spécifiées, utiliser ces colonnes
  // Sinon, utiliser toutes les clés du premier élément
  const headers = exportColumns.length > 0
    ? exportColumns.map(col => col.header) 
    : Object.keys(data[0] || {});
  
  const dataKeys = exportColumns.length > 0
    ? exportColumns.map(col => col.dataKey) 
    : Object.keys(data[0] || {});
  
  // Créer le contenu CSV
  let csvContent = '';
  
  // Ajouter les métadonnées si spécifiées
  if (title) {
    csvContent += `"${title}"\n`;
  }
  
  if (subtitle) {
    csvContent += `"${subtitle}"\n`;
  }
  
  if (description) {
    csvContent += `"${description}"\n`;
  }
  
  // Ajouter la date et l'heure si demandé
  if (includeTimestamp) {
    csvContent += `"Généré le: ${new Date().toLocaleString()}"\n`;
  }
  
  // Ajouter les filtres si spécifiés
  if (filters && Object.keys(filters).length > 0) {
    csvContent += `"Filtres:"\n`;
    Object.entries(filters).forEach(([key, value]) => {
      csvContent += `"${key}: ${value}"\n`;
    });
  }
  
  // Ajouter la plage de dates si spécifiée
  if (dateRange) {
    const startDate = dateRange.startDate.toLocaleDateString();
    const endDate = dateRange.endDate.toLocaleDateString();
    csvContent += `"Période: ${startDate} - ${endDate}"\n`;
  }
  
  // Ajouter une ligne vide avant les données
  if (title || subtitle || description || includeTimestamp || (filters && Object.keys(filters).length > 0) || dateRange) {
    csvContent += '\n';
  }
  
  // Ajouter les en-têtes de colonnes
  csvContent += headers.join(',') + '\n';
  
  // Appliquer le tri si spécifié
  let sortedData = [...data];
  if (options.sortBy) {
    const { field, direction } = options.sortBy;
    sortedData.sort((a, b) => {
      const valueA = a[field];
      const valueB = b[field];
      
      if (valueA === valueB) return 0;
      
      if (direction === 'asc') {
        return valueA < valueB ? -1 : 1;
      } else {
        return valueA > valueB ? -1 : 1;
      }
    });
  }
  
  // Appliquer le regroupement si spécifié
  if (options.groupBy) {
    const groupField = options.groupBy;
    const groups = new Map<string, any[]>();
    
    // Regrouper les données
    sortedData.forEach(item => {
      const groupValue = item[groupField]?.toString() || 'Non spécifié';
      if (!groups.has(groupValue)) {
        groups.set(groupValue, []);
      }
      groups.get(groupValue)!.push(item);
    });
    
    // Ajouter les données groupées
    groups.forEach((groupItems, groupValue) => {
      // Ajouter l'en-tête du groupe
      csvContent += `\n"Groupe: ${groupValue}"\n`;
      
      // Ajouter les données du groupe
      groupItems.forEach(item => {
        const row = dataKeys.map(key => {
          // Appliquer le formattage si spécifié
          const column = exportColumns.find(col => col.dataKey === key);
          let value = item[key];
          
          if (column?.format && value !== undefined && value !== null) {
            value = column.format(value);
          } else {
            value = value !== undefined && value !== null ? value.toString() : '';
          }
          
          // Échapper les virgules et les guillemets
          return `"${value.replace(/"/g, '""')}"`;
        });
        csvContent += row.join(',') + '\n';
      });
    });
  } else {
    // Ajouter les données sans regroupement
    sortedData.forEach(item => {
      const row = dataKeys.map(key => {
        // Appliquer le formattage si spécifié
        const column = exportColumns.find(col => col.dataKey === key);
        let value = item[key];
        
        if (column?.format && value !== undefined && value !== null) {
          value = column.format(value);
        } else {
          value = value !== undefined && value !== null ? value.toString() : '';
        }
        
        // Échapper les virgules et les guillemets
        return `"${value.replace(/"/g, '""')}"`;
      });
      csvContent += row.join(',') + '\n';
    });
  }
  
  // Créer un blob et télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${fileName}.csv`);
};

/**
 * Exporte des données au format PDF
 */
export const exportToPDF = (data: any[], options: ExportOptions) => {
  const { 
    fileName, 
    title = 'Rapport', 
    subtitle = '', 
    description = '',
    columns,
    includeTimestamp = true,
    orientation = 'portrait',
    pageSize = 'a4',
    logo,
    theme = {
      primary: '#4f46e5',
      secondary: '#0ea5e9',
      text: '#000000',
      background: '#ffffff',
      headerBackground: '#4f46e5',
      headerText: '#ffffff',
      alternateRowBackground: '#f5f7fa'
    },
    footer = '',
    includePageNumbers = true,
    author = '',
    watermark = '',
    filters,
    dateRange,
    groupBy,
    sortBy
  } = options;
  
  // Filtrer les colonnes à inclure dans l'export
  const exportColumns = columns 
    ? columns.filter(col => col.includeInExport !== false)
    : [];
  
  // Créer un nouveau document PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize
  });
  
  // Ajouter les métadonnées
  doc.setProperties({
    title: title,
    subject: subtitle,
    author: author,
    keywords: options.keywords?.join(', ') || '',
    creator: 'Export Service'
  });
  
  // Protéger le document si un mot de passe est fourni
  if (options.password) {
    try {
      // @ts-ignore - La méthode setEncryption n'est pas dans les types mais existe dans jsPDF
      doc.setEncryption(options.password, options.password, ['print', 'modify', 'copy', 'annot-forms']);
    } catch (error) {
      console.error('Erreur lors de la protection du document:', error);
    }
  }
  
  // Ajouter le filigrane si spécifié
  if (watermark) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setTextColor(200, 200, 200); // Gris clair
    doc.setFontSize(30);
    doc.setFont('helvetica', 'italic');
    
    // Sauvegarder l'état actuel
    doc.saveGraphicsState();
    
    // Rotation du texte
    const angle = -45;
    const radians = angle * Math.PI / 180;
    doc.setGState(new doc.GState({ opacity: 0.3 }));
    
    // Calculer la position pour centrer le filigrane
    const textWidth = doc.getTextWidth(watermark);
    const x = (pageWidth - textWidth) / 2;
    const y = pageHeight / 2;
    
    // Appliquer la rotation
    doc.translate(x, y);
    doc.rotate(angle);
    doc.text(watermark, 0, 0);
    
    // Restaurer l'état
    doc.restoreGraphicsState();
    
    // Réinitialiser les paramètres
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
  }
  
  // Ajouter le titre
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 22);
  
  // Ajouter le sous-titre
  if (subtitle) {
    doc.setFontSize(14);
    doc.text(subtitle, 14, 30);
  }
  
  // Ajouter la description
  if (description) {
    doc.setFontSize(12);
    doc.text(description, 14, subtitle ? 38 : 30);
  }
  
  // Position Y actuelle
  let yPos = description ? (subtitle ? 46 : 38) : (subtitle ? 38 : 30);
  
  // Ajouter la date et l'heure
  if (includeTimestamp) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const timestamp = new Date().toLocaleString();
    doc.text(`Généré le: ${timestamp}`, 14, yPos);
    yPos += 8;
    doc.setTextColor(0, 0, 0);
  }
  
  // Ajouter les filtres si spécifiés
  if (filters && Object.keys(filters).length > 0) {
    doc.setFontSize(10);
    doc.text('Filtres:', 14, yPos);
    yPos += 5;
    
    Object.entries(filters).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 20, yPos);
      yPos += 5;
    });
    
    yPos += 3;
  }
  
  // Ajouter la plage de dates si spécifiée
  if (dateRange) {
    doc.setFontSize(10);
    const startDate = dateRange.startDate.toLocaleDateString();
    const endDate = dateRange.endDate.toLocaleDateString();
    doc.text(`Période: ${startDate} - ${endDate}`, 14, yPos);
    yPos += 8;
  }
  
  // Ajouter le logo si fourni
  if (logo) {
    try {
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(logo, 'PNG', pageWidth - 50, 10, 40, 20);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
    }
  }
  
  // Appliquer le tri si spécifié
  let sortedData = [...data];
  if (sortBy) {
    const { field, direction } = sortBy;
    sortedData.sort((a, b) => {
      const valueA = a[field];
      const valueB = b[field];
      
      if (valueA === valueB) return 0;
      
      if (direction === 'asc') {
        return valueA < valueB ? -1 : 1;
      } else {
        return valueA > valueB ? -1 : 1;
      }
    });
  }
  
  // Préparer les colonnes pour le tableau
  const tableColumns = exportColumns.length > 0
    ? exportColumns.map(col => ({
        title: col.header,
        dataKey: col.dataKey,
        cellWidth: col.width
      }))
    : Object.keys(data[0] || {}).map(key => ({
        title: key,
        dataKey: key
      }));
  
  // Fonction pour formater les données
  const formatData = (item: any, dataKey: string) => {
    const column = exportColumns.find(col => col.dataKey === dataKey);
    let value = item[dataKey];
    
    if (column?.format && value !== undefined && value !== null) {
      return column.format(value);
    }
    
    return value !== undefined && value !== null ? value.toString() : '';
  };
  
  // Appliquer le regroupement si spécifié
  if (groupBy) {
    const groupField = groupBy;
    const groups = new Map<string, any[]>();
    
    // Regrouper les données
    sortedData.forEach(item => {
      const groupValue = item[groupField]?.toString() || 'Non spécifié';
      if (!groups.has(groupValue)) {
        groups.set(groupValue, []);
      }
      groups.get(groupValue)!.push(item);
    });
    
    // Ajouter les données groupées
    let firstGroup = true;
    groups.forEach((groupItems, groupValue) => {
      if (!firstGroup) {
        doc.addPage();
        yPos = 20;
      }
      
      // Ajouter l'en-tête du groupe
      doc.setFontSize(14);
      doc.setTextColor(theme.primary || '#4f46e5');
      doc.text(`Groupe: ${groupValue}`, 14, yPos);
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      
      // Préparer les données pour le tableau
      const tableData = groupItems.map(item => {
        const rowData: Record<string, string> = {};
        tableColumns.forEach(col => {
          rowData[col.dataKey] = formatData(item, col.dataKey);
        });
        return rowData;
      });
      
      // Ajouter le tableau
      (doc as any).autoTable({
        startY: yPos,
        columns: tableColumns,
        body: tableData,
        headStyles: {
          fillColor: [
            parseInt(theme.headerBackground?.substring(1, 3) || '4f', 16),
            parseInt(theme.headerBackground?.substring(3, 5) || '46', 16),
            parseInt(theme.headerBackground?.substring(5, 7) || 'e5', 16)
          ],
          textColor: [
            parseInt(theme.headerText?.substring(1, 3) || 'ff', 16),
            parseInt(theme.headerText?.substring(3, 5) || 'ff', 16),
            parseInt(theme.headerText?.substring(5, 7) || 'ff', 16)
          ],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [
            parseInt(theme.alternateRowBackground?.substring(1, 3) || 'f5', 16),
            parseInt(theme.alternateRowBackground?.substring(3, 5) || 'f7', 16),
            parseInt(theme.alternateRowBackground?.substring(5, 7) || 'fa', 16)
          ]
        },
        margin: { top: yPos }
      });
      
      firstGroup = false;
    });
  } else {
    // Préparer les données pour le tableau sans regroupement
    const tableData = sortedData.map(item => {
      const rowData: Record<string, string> = {};
      tableColumns.forEach(col => {
        rowData[col.dataKey] = formatData(item, col.dataKey);
      });
      return rowData;
    });
    
    // Ajouter le tableau
    (doc as any).autoTable({
      startY: yPos,
      columns: tableColumns,
      body: tableData,
      headStyles: {
        fillColor: [
          parseInt(theme.headerBackground?.substring(1, 3) || '4f', 16),
          parseInt(theme.headerBackground?.substring(3, 5) || '46', 16),
          parseInt(theme.headerBackground?.substring(5, 7) || 'e5', 16)
        ],
        textColor: [
          parseInt(theme.headerText?.substring(1, 3) || 'ff', 16),
          parseInt(theme.headerText?.substring(3, 5) || 'ff', 16),
          parseInt(theme.headerText?.substring(5, 7) || 'ff', 16)
        ],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [
          parseInt(theme.alternateRowBackground?.substring(1, 3) || 'f5', 16),
          parseInt(theme.alternateRowBackground?.substring(3, 5) || 'f7', 16),
          parseInt(theme.alternateRowBackground?.substring(5, 7) || 'fa', 16)
        ]
      },
      margin: { top: yPos }
    });
  }
  
  // Ajouter le pied de page et les numéros de page
  if (footer || includePageNumbers) {
    const totalPages = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Ajouter le pied de page
      if (footer) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const footerWidth = doc.getTextWidth(footer);
        doc.text(footer, (pageWidth - footerWidth) / 2, pageHeight - 10);
      }
      
      // Ajouter les numéros de page
      if (includePageNumbers) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const pageText = `Page ${i} sur ${totalPages}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - pageTextWidth - 10, pageHeight - 10);
      }
    }
  }
  
  // Enregistrer le PDF
  doc.save(`${fileName}.pdf`);
};

/**
 * Exporte des données au format Excel (XLSX)
 * Note: Cette fonction utilise simplement le CSV pour l'instant
 * Dans une implémentation réelle, vous pourriez utiliser une bibliothèque comme xlsx
 */
export const exportToExcel = (data: any[], options: ExportOptions) => {
  // Pour l'exportation Excel, nous utilisons simplement le CSV
  // Dans une implémentation réelle, vous pourriez utiliser une bibliothèque comme xlsx
  exportToCSV(data, options);
};

/**
 * Fonction utilitaire pour formater les données pour l'exportation
 */
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
