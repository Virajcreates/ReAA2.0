export type ReraNamespace =
  | 'rera-litigation'
  | 'rera-projects'
  | 'rera-complaints'
  | 'rera-legal'
  | 'rera-links'
  | 'supabase-sql';

export interface NamespaceInfo {
  id: ReraNamespace;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
}

export const RERA_NAMESPACES: Record<ReraNamespace, NamespaceInfo> = {
  'rera-legal': {
    id: 'rera-legal',
    label: 'Statutory & Rules (RERA Act 2016)',
    shortLabel: 'Statutory Act & Rules',
    description: 'RERA Act 2016 provisions, Karnataka RERA Rules 2017, notifications, and circulars',
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
    borderColor: 'border-blue-500/30 dark:border-blue-500/40',
    iconName: 'Scale',
  },
  'rera-litigation': {
    id: 'rera-litigation',
    label: 'Tribunal & Court Rulings',
    shortLabel: 'Litigation & Rulings',
    description: 'Appellate Tribunal (REAT), High Court & Supreme Court precedents in real estate matters',
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 dark:bg-purple-500/15',
    borderColor: 'border-purple-500/30 dark:border-purple-500/40',
    iconName: 'Gavel',
  },
  'rera-complaints': {
    id: 'rera-complaints',
    label: 'Adjudications & Complaints',
    shortLabel: 'Complaints & Adjudication',
    description: 'Adjudicating officer orders, Form M/N complaints, interest awards, defect liabilities',
    color: 'text-indigo-500 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 dark:border-indigo-500/40',
    iconName: 'FileText',
  },
  'rera-projects': {
    id: 'rera-projects',
    label: 'Project Registrations & Disclosures',
    shortLabel: 'Project Disclosures',
    description: 'Karnataka RERA registered projects, promoter quarterly disclosures, escrow and completion timelines',
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 dark:bg-amber-500/15',
    borderColor: 'border-amber-500/30 dark:border-amber-500/40',
    iconName: 'Building2',
  },
  'rera-links': {
    id: 'rera-links',
    label: 'Statutory Project Documents & Links',
    shortLabel: 'Document Links',
    description: 'Direct K-RERA portal document download links, sanctioned plans, NOCs, approvals, and certificates',
    color: 'text-cyan-500 dark:text-cyan-400',
    bgColor: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    borderColor: 'border-cyan-500/30 dark:border-cyan-500/40',
    iconName: 'Link',
  },
  'supabase-sql': {
    id: 'supabase-sql',
    label: 'Supabase Text-to-SQL Analytics',
    shortLabel: 'Supabase Text-to-SQL',
    description: 'PostgreSQL relational database queries for aggregate, statistical, and quantitative project analytics',
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 dark:border-emerald-500/40',
    iconName: 'Database',
  },
};

export interface CitationItem {
  id: string;
  namespace: ReraNamespace;
  title: string;
  section?: string;
  citationRef?: string;
  score: number;
  snippet: string;
  url?: string;
  date?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface QueryRouteAnalysis {
  targetNamespaces: ReraNamespace[];
  reasoning: string;
  keyLegalConcepts: string[];
  queryFilter?: Record<string, any>;
  extractedId?: string;
  exactIdType?: 'complaint' | 'registration';
}

export interface RAGRetrievalResult {
  citations: CitationItem[];
  combinedContext: string;
  routedNamespaces: ReraNamespace[];
  reasoning: string;
  queryFilter?: Record<string, any>;
  exactIdMatch?: string;
}
