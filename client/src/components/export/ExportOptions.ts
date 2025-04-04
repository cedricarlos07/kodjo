export interface ExportOptions {
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
