import { getGeminiClient, GEMINI_CHAT_MODEL } from '@/lib/gemini';
import { queryPineconeNamespace } from '@/lib/pinecone';
import { getAstraLinksCollection } from '@/lib/astra/client';
import { generateEmbedding } from './embeddings';
import { QUERY_ROUTING_SYSTEM_PROMPT } from './prompts';
import { CitationItem, QueryRouteAnalysis, RAGRetrievalResult, ReraNamespace } from '@/types/rera';

// Curated comprehensive K-RERA knowledge items for grounding & resilient fallback
interface KnowledgeDocument {
  id: string;
  namespace: ReraNamespace;
  title: string;
  section: string;
  citationRef?: string;
  keywords: string[];
  content: string;
}

const KRERA_KNOWLEDGE_BASE: KnowledgeDocument[] = [
  // --- rera-legal ---
  {
    id: 'rera-legal-sec18',
    namespace: 'rera-legal',
    title: 'Section 18: Return of Amount and Compensation for Delay in Possession',
    section: 'Section 18(1), RERA Act 2016',
    citationRef: 'RERA Act 2016, Act No. 16 of 2016',
    keywords: ['delay', 'possession', 'refund', 'interest', 'compensation', 'completion date', 'handover', 'sec 18'],
    content: 'Section 18(1) mandates that if the promoter fails to complete or is unable to give possession of an apartment, plot or building in accordance with the terms of the agreement for sale or duly completed by the date specified therein, the promoter shall be liable on demand to the allottees: (a) in case the allottee wishes to withdraw from the project, to return the full amount received with interest at such rate as prescribed (SBI MCLR + 2% under Karnataka Rule 18) including compensation; (b) where the allottee does not intend to withdraw, the promoter shall pay interest for every month of delay until the handing over of possession.'
  },
  {
    id: 'rera-legal-sec14',
    namespace: 'rera-legal',
    title: 'Section 14: Adherence to Sanctioned Plans and 5-Year Structural Defect Liability',
    section: 'Section 14(2) & 14(3), RERA Act 2016',
    citationRef: 'RERA Act 2016',
    keywords: ['structural defect', 'defect liability', '5 years', 'alteration', 'sanctioned plan', 'workmanship', 'sec 14'],
    content: 'Under Section 14(2), no major additions or alterations in the sanctioned plans, layout plans and specifications shall be made by the promoter without the previous written consent of at least two-thirds of the allottees. Under Section 14(3), in case any structural defect or any defect in workmanship, quality or provision of services is brought to the notice of the promoter within a period of 5 (five) years from the date of handing over possession, the promoter is duty-bound to rectify such defects without further charge within 30 days.'
  },
  {
    id: 'rera-legal-sec4',
    namespace: 'rera-legal',
    title: 'Section 4(2)(l)(D): 70% Realized Amount in Separate Escrow Bank Account',
    section: 'Section 4(2)(l)(D), RERA Act 2016',
    citationRef: 'RERA Act 2016 & Karnataka Rule 5',
    keywords: ['escrow', '70 percent', 'separate bank account', 'funds', 'construction cost', 'architect certificate', 'engineer certificate', 'chartered accountant'],
    content: 'Promoter must deposit 70% of the amounts realized for the real estate project from the allottees, from time to time, in a separate bank account in a scheduled bank to cover the cost of construction and the land cost and shall be used only for that purpose. Withdrawals are permitted only in proportion to the percentage of completion of the project, certified by an engineer, an architect and a chartered accountant in practice.'
  },
  {
    id: 'rera-legal-sec13',
    namespace: 'rera-legal',
    title: 'Section 13: 10% Maximum Advance Payment Without Registered Agreement for Sale',
    section: 'Section 13(1), RERA Act 2016',
    citationRef: 'RERA Act 2016',
    keywords: ['advance payment', 'booking amount', '10 percent', 'agreement for sale', 'registration', 'sec 13'],
    content: 'A promoter shall not accept a sum more than 10% (ten percent) of the cost of the apartment, plot, or building as an advance payment or an application fee from a person without first entering into a written agreement for sale with such person and registering the said agreement for sale under the law for the time being in force.'
  },
  {
    id: 'rera-legal-sec3',
    namespace: 'rera-legal',
    title: 'Section 3: Mandatory Prior Registration of Real Estate Projects with K-RERA',
    section: 'Section 3(1) & 3(2), RERA Act 2016',
    citationRef: 'RERA Act 2016',
    keywords: ['registration', 'mandatory', 'exemptions', '500 sq meters', '8 apartments', 'advertisement', 'prm number'],
    content: 'No promoter shall advertise, market, book, sell or offer for sale any plot, apartment or building in any real estate project without registering the project with K-RERA. Projects exempt: where land area does not exceed 500 square meters or the number of apartments does not exceed 8 (eight) inclusive of all phases, or where the promoter has received completion certificate prior to commencement of the Act.'
  },
  {
    id: 'rera-legal-rule18',
    namespace: 'rera-legal',
    title: 'Karnataka RERA Rules 2017: Rule 18 - Rate of Interest Payable by Promoter and Allottee',
    section: 'Rule 18, Karnataka RERA Rules 2017',
    citationRef: 'Karnataka Real Estate Rules 2017',
    keywords: ['rate of interest', 'rule 18', 'sbi mclr', 'mclr plus 2', 'delay interest', 'karnataka rules'],
    content: 'The rate of interest payable by the promoter to the allottee or by the allottee to the promoter shall be the State Bank of India (SBI) highest Marginal Cost of Lending Rate (MCLR) plus 2% (two percent) per annum. The interest becomes payable from the first day of default until the actual realization or handing over of possession with valid Occupancy Certificate.'
  },

  // --- rera-litigation ---
  {
    id: 'rera-lit-newtech',
    namespace: 'rera-litigation',
    title: 'Supreme Court: M/s Newtech Promoters & Developers Pvt. Ltd. v. State of UP & Ors.',
    section: 'Precedent: Retroactive Applicability & Form M vs Form N jurisdiction',
    citationRef: '2021 SCC OnLine SC 1044 / (2021) 13 SCC',
    keywords: ['newtech promoters', 'retroactive', 'ongoing projects', 'authority jurisdiction', 'adjudicating officer', 'supreme court', 'refund'],
    content: 'The Hon\'ble Supreme Court affirmed that: (1) RERA Act applies retroactively to all "ongoing projects" where completion certificate was not issued prior to May 1, 2017; (2) The Regulatory Authority (Form M) has sole jurisdiction to direct refund of the principal amount along with prescribed interest under Section 18; (3) The Adjudicating Officer (Form N) has jurisdiction exclusively to adjudicate claims for compensation and damages under Sections 12, 14, 18 and 19.'
  },
  {
    id: 'rera-lit-pioneer',
    namespace: 'rera-litigation',
    title: 'Supreme Court: Pioneer Urban Land and Infrastructure Ltd. v. Govindan Raghavan',
    section: 'Precedent: Unfair One-Sided Clauses in Builder-Buyer Agreements',
    citationRef: '(2019) 5 SCC 725',
    keywords: ['pioneer urban', 'one sided contract', 'unfair terms', 'delay penalty disparity', 'builder buyer agreement'],
    content: 'Supreme Court held that terms of a contract between a builder and homebuyer are unfair, unreasonable, and one-sided when the builder imposes heavy interest penalties (e.g. 18%) on delayed buyer payments while offering paltry nominal sums (e.g. Rs 5/sq ft) for its own delay in handover. Such clauses constitute unfair trade practice and allottees are not bound by them, remaining entitled to full statutory relief under RERA.'
  },
  {
    id: 'rera-lit-fortune',
    namespace: 'rera-litigation',
    title: 'Supreme Court: Fortune Infrastructure & Anr. v. Trevor D\'Lima & Ors.',
    section: 'Precedent: Indefinite Delay in Project Completion',
    citationRef: '(2018) 5 SCC 442',
    keywords: ['fortune infrastructure', 'indefinite wait', 'allottee cannot be made to wait indefinitely', 'full refund with interest'],
    content: 'The Supreme Court ruled that an allottee cannot be made to wait indefinitely for possession of the allotted flat. Where the builder fails to deliver within the promised time or a reasonable period (typically 2-3 years past timeline), the buyer is fully entitled to seek a total refund of money deposited along with interest and compensation.'
  },
  {
    id: 'rera-lit-imperia',
    namespace: 'rera-litigation',
    title: 'Supreme Court: Imperia Structures Ltd. v. Anil Patni & Anr.',
    section: 'Precedent: Concurrent Remedies under RERA and Consumer Protection Act',
    citationRef: '(2020) 10 SCC 783',
    keywords: ['imperia structures', 'consumer protection act', 'remedies concurrent', 'ncdrc', 'rera section 79', 'section 88'],
    content: 'Section 88 of RERA Act clarifies that the provisions of RERA are in addition to, and not in derogation of, any other law for the time being in force. Therefore, an aggrieved homebuyer has the right to approach the Consumer Forum (NCDRC/State Commission) or K-RERA concurrently, provided simultaneous parallel reliefs are not claimed duplicatively.'
  },

  // --- rera-complaints ---
  {
    id: 'rera-comp-filing',
    namespace: 'rera-complaints',
    title: 'Filing Procedure: Form M (Regulatory Authority) vs Form N (Adjudicating Officer)',
    section: 'Section 31 & Section 71, Karnataka RERA Rules 2017 Rule 28 & 29',
    citationRef: 'K-RERA Complaint Portal Guidelines',
    keywords: ['form m', 'form n', 'complaint filing', 'fee', 'adjudicating officer', 'authority', 'online complaint', 'rera.karnataka.gov.in'],
    content: 'Procedure for filing online complaints via K-RERA web portal: (1) Form M is filed under Section 31 before the Karnataka Real Estate Regulatory Authority for directions, handover of possession, execution of sale deed, project inspection, or refund of money with delay interest under Section 18 (Fee: Rs. 1,000 online); (2) Form N is filed under Section 71 before the Adjudicating Officer exclusively for determination and award of compensation, damages, and mental agony (Fee: Rs. 1,000 online). Requires submission of Agreement for Sale, payment receipts, communication trail, and delay computation sheet.'
  },
  {
    id: 'rera-comp-execution',
    namespace: 'rera-complaints',
    title: 'Section 40: Execution of Orders and Recovery of Arrears via Revenue Recovery Warrants',
    section: 'Section 40(1) & 40(2), RERA Act 2016 & Karnataka Rule 25',
    citationRef: 'RERA Act 2016',
    keywords: ['recovery warrant', 'section 40', 'execution of order', 'district collector', 'land revenue arrears', 'non compliance penalty'],
    content: 'Under Section 40(1), if a promoter fails to pay any principal, interest or penalty imposed by the Authority or Adjudicating Officer, the same shall be recoverable as arrears of land revenue through a Recovery Certificate (RC) issued to the Deputy Commissioner / District Magistrate. Under Section 40(2), any order passed by the Authority is enforceable as if it were a decree of a Civil Court.'
  },
  {
    id: 'rera-comp-interestcalc',
    namespace: 'rera-complaints',
    title: 'Standard Delay Compensation & Interest Formula in K-RERA Adjudications',
    section: 'Adjudication Guideline on Delayed Handover Claims',
    citationRef: 'K-RERA Standing Orders 2022',
    keywords: ['interest calculation', 'sbi mclr', 'formula', 'monthly interest', 'compounding', 'possession delay'],
    content: 'Interest calculation standard: Formula = (Total Amount Paid by Allottee) x (SBI Highest MCLR + 2.00%) / 100 x (Days of Delay / 365). Default date commences from the agreed contractual possession date (plus grace period if specifically stipulated and justified) until the actual date of issuance of a valid Occupancy Certificate (OC) by the local planning authority (BBMP/BDA/BMRDA) and valid offer of possession.'
  },

  // --- rera-projects ---
  {
    id: 'rera-proj-reg-rules',
    namespace: 'rera-projects',
    title: 'K-RERA Project Registration Verification & PRM Number System',
    section: 'Section 4, K-RERA Portal Standards',
    citationRef: 'rera.karnataka.gov.in / PRM Reference Standards',
    keywords: ['prm number', 'project verification', 'quarterly updates', 'qpr', 'oc', 'cc', 'karnataka rera portal', 'prestige', 'sobha', 'brigade', 'godrej'],
    content: 'Every approved project in Karnataka is issued a unique PRM number (Format: PRM/KA/RERA/1251/XXX/PR/YYMMDD/XXXXXX). Promoters are legally required to upload quarterly project updates (QPR) including: number of units sold, construction stage photo proof, financial certificate on escrow account, and approvals obtained. Buyers must verify if the specific tower/phase is included in the PRM approval scope.'
  },
  {
    id: 'rera-proj-alterations',
    namespace: 'rera-projects',
    title: 'Promoter Obligations: Transfer of Title and Common Area Conveyance (Section 17)',
    section: 'Section 17(1) & 17(2), RERA Act 2016',
    citationRef: 'RERA Act 2016',
    keywords: ['section 17', 'conveyance deed', 'association of allottees', 'common areas', 'khata transfer', 'title transfer'],
    content: 'Section 17 mandates that the promoter shall execute a registered conveyance deed in favour of the allottee for the apartment and in favour of the Association of Allottees (AoA) for the common areas within 3 months from the date of issue of the Occupancy Certificate. The promoter must also hand over all physical documents, insurance, plans, and title documents to the association.'
  }
];

// Regex patterns to detect exact K-RERA identifiers
const COMPLAINT_ID_REGEX = /(CMP\/\d{6}\/\d{7})/i;
const REGISTRATION_ID_REGEX = /(PRM\/KA\/RERA\/[A-Z0-9\/_]+)/i;

// Keyword sets for Intent-Based Namespace Locking
const LITIGATION_KEYWORDS = [
  'litigation',
  'litigations',
  'court',
  'courts',
  'case',
  'cases',
  'lawsuit',
  'lawsuits',
  'civil suit',
  'civil suits',
  'original suit',
  'original suits',
  'os',
  'stay order',
  'injunction',
  'partition suit',
  'title suit',
  'title dispute',
  'tribunal',
  'reat',
  'high court',
  'supreme court'
];

const COMPLAINT_KEYWORDS = [
  'complaint',
  'complaints',
  'grievance',
  'grievances',
  'dispute',
  'disputes',
  'form m',
  'form n',
  'adjudicating officer',
  'recovery warrant',
  'adjudication'
];

const PROJECT_KEYWORDS = [
  'status',
  'completion date',
  'approved',
  'approval',
  'developer of',
  'promoter of',
  'units',
  'towers',
  'land area',
  'project details',
  'built up area',
  'carpet area',
  'escrow bank',
  'possession date',
  'launch date',
  'registered project'
];

const LEGAL_KEYWORDS = [
  'act',
  'section',
  'rule',
  'rules',
  'statutory',
  'carpet area definition',
  'advance payment rule',
  '10%',
  '70% escrow',
  'escrow requirement',
  'defect liability',
  '5 year warranty',
  '5 years structural'
];

const DOCUMENT_KEYWORDS = [
  'document',
  'documents',
  'link',
  'links',
  'pdf',
  'download',
  'brochure',
  'noc',
  'sanction plan',
  'layout plan',
  'certificate',
  'certificates',
  'approval',
  'approvals',
  'sanctioned plan',
  'cc certificate',
  'oc certificate'
];

function containsAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => {
    if (kw.length <= 3) {
      return new RegExp(`\\b${kw}\\b`, 'i').test(text);
    }
    return text.includes(kw);
  });
}

export async function analyzeQueryAndRoute(query: string): Promise<QueryRouteAnalysis> {
  const q = query.toLowerCase().trim();

  // 1. Highest Priority: Intercept Exact Identifier Regex Patterns
  const complaintMatch = query.match(COMPLAINT_ID_REGEX);
  if (complaintMatch) {
    const extractedId = complaintMatch[1].toUpperCase();
    return {
      targetNamespaces: ['rera-complaints', 'rera-litigation'],
      reasoning: `Exact Complaint Number [${extractedId}] detected. Applying metadata filter on 'complaint_number' in rera-complaints and rera-litigation.`,
      keyLegalConcepts: ['Exact Complaint Number', extractedId],
      queryFilter: { complaint_number: { $eq: extractedId } },
      extractedId,
      exactIdType: 'complaint',
    };
  }

  const registrationMatch = query.match(REGISTRATION_ID_REGEX);
  if (registrationMatch) {
    const extractedId = registrationMatch[1].toUpperCase();
    return {
      targetNamespaces: ['rera-projects', 'rera-links', 'rera-complaints', 'rera-litigation'],
      reasoning: `Exact Project Registration Number [${extractedId}] detected. Applying metadata filter on 'registration_number' across rera-projects, rera-links, rera-complaints, and rera-litigation.`,
      keyLegalConcepts: ['Exact Registration Number', extractedId],
      queryFilter: { registration_number: { $eq: extractedId } },
      extractedId,
      exactIdType: 'registration',
    };
  }

  // 2. Intent-Based Keyword Namespace Locking (Priority 2)
  const hasLitigation = containsAnyKeyword(q, LITIGATION_KEYWORDS);
  const hasComplaint = containsAnyKeyword(q, COMPLAINT_KEYWORDS);
  const hasProject = containsAnyKeyword(q, PROJECT_KEYWORDS);
  const hasLegal = containsAnyKeyword(q, LEGAL_KEYWORDS);
  const hasDocs = containsAnyKeyword(q, DOCUMENT_KEYWORDS);

  const matchedIntentsCount =
    (hasLitigation ? 1 : 0) +
    (hasComplaint ? 1 : 0) +
    (hasProject ? 1 : 0) +
    (hasLegal ? 1 : 0) +
    (hasDocs ? 1 : 0);

  if (matchedIntentsCount === 1) {
    if (hasLitigation) {
      return {
        targetNamespaces: ['rera-litigation'],
        reasoning: `Litigation intent detected. Strictly locked to [rera-litigation] to prevent cross-namespace data contamination.`,
        keyLegalConcepts: ['Civil Litigations', 'Court Precedents', 'Original Suits'],
      };
    }
    if (hasComplaint) {
      return {
        targetNamespaces: ['rera-complaints'],
        reasoning: `Complaint intent detected. Strictly locked to [rera-complaints] to prevent cross-namespace data contamination.`,
        keyLegalConcepts: ['Consumer Complaints', 'Adjudications', 'Form M / Form N'],
      };
    }
    if (hasDocs) {
      return {
        targetNamespaces: ['rera-links', 'rera-projects'],
        reasoning: `Document downloads and approval links intent detected. Querying [rera-links, rera-projects].`,
        keyLegalConcepts: ['Statutory Document Links', 'Sanctioned Plans', 'NOC Certificates'],
      };
    }
    if (hasProject) {
      return {
        targetNamespaces: ['rera-projects'],
        reasoning: `Project details intent detected. Strictly locked to [rera-projects].`,
        keyLegalConcepts: ['Project Disclosures', 'Approval Status', 'Timelines'],
      };
    }
    if (hasLegal) {
      return {
        targetNamespaces: ['rera-legal'],
        reasoning: `Statutory Act & Rules intent detected. Strictly locked to [rera-legal].`,
        keyLegalConcepts: ['RERA Act 2016', 'Karnataka Rules 2017', 'Statutory Provisions'],
      };
    }
  }

  if (matchedIntentsCount > 1) {
    const multiNamespaces: ReraNamespace[] = [];
    const concepts: string[] = [];
    if (hasLitigation) {
      multiNamespaces.push('rera-litigation');
      concepts.push('Litigation & Court Suits');
    }
    if (hasComplaint) {
      multiNamespaces.push('rera-complaints');
      concepts.push('Consumer Complaints');
    }
    if (hasDocs) {
      multiNamespaces.push('rera-links');
      concepts.push('Statutory Document Links');
    }
    if (hasProject) {
      if (!multiNamespaces.includes('rera-projects')) multiNamespaces.push('rera-projects');
      concepts.push('Project Disclosures');
    }
    if (hasLegal) {
      multiNamespaces.push('rera-legal');
      concepts.push('Statutory Provisions');
    }
    return {
      targetNamespaces: multiNamespaces,
      reasoning: `Multi-intent detected for [${multiNamespaces.join(', ')}].`,
      keyLegalConcepts: concepts,
    };
  }

  // 3. Fallback to Dynamic LLM Routing or Comprehensive Namespaces
  const client = getGeminiClient();

  if (client) {
    try {
      const model = client.getGenerativeModel({
        model: GEMINI_CHAT_MODEL,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const result = await model.generateContent([
        { text: QUERY_ROUTING_SYSTEM_PROMPT },
        { text: `User Query: "${query}"` },
      ]);

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      if (parsed && Array.isArray(parsed.targetNamespaces) && parsed.targetNamespaces.length > 0) {
        const validNamespaces: ReraNamespace[] = parsed.targetNamespaces.filter((ns: string) =>
          ['rera-legal', 'rera-litigation', 'rera-complaints', 'rera-projects', 'rera-links'].includes(ns)
        );

        if (validNamespaces.length > 0) {
          return {
            targetNamespaces: validNamespaces,
            reasoning: parsed.reasoning || 'Automated classification based on legal concepts and question intent.',
            keyLegalConcepts: parsed.keyLegalConcepts || [],
          };
        }
      }
    } catch (err) {
      console.warn('Gemini query routing fallback to heuristic analysis:', err);
    }
  }

  // 4. Default Broad Search if intent is open-ended
  return {
    targetNamespaces: ['rera-projects', 'rera-links', 'rera-complaints', 'rera-litigation', 'rera-legal'],
    reasoning: 'Broad general advisory query. Querying across all K-RERA namespaces.',
    keyLegalConcepts: ['General Real Estate Advisory', 'K-RERA Multi-Database Search'],
  };
}

const getTopKForNamespace = (namespace: string): number => {
  switch (namespace) {
    case 'rera-legal':
      return 12; // Increased context depth for legal circulars and notifications
    case 'rera-links':
      return 8;  // Dedicated depth for project document links and certificates
    case 'rera-complaints':
    case 'rera-litigation':
    case 'rera-projects':
    default:
      return 5;  // Standard depth for structured records
  }
};

/**
 * Query Astra DB collection 'rera_links' for document link chunks
 */
async function queryAstraLinks(
  queryVector: number[],
  topK: number,
  exactFilter?: Record<string, any>
): Promise<any[]> {
  const collection = getAstraLinksCollection();
  if (!collection) {
    console.warn('Astra collection unavailable for rera-links retrieval.');
    return [];
  }

  try {
    let filter: Record<string, any> = {};
    if (exactFilter && exactFilter.registration_number) {
      const regVal = exactFilter.registration_number.$eq || exactFilter.registration_number;
      filter = { registration_number: regVal };
    }

    const options: any = {
      limit: topK,
      includeSimilarity: true,
    };

    if (queryVector && queryVector.length > 0) {
      options.sort = { $vector: queryVector };
    }

    const cursor = collection.find(filter, options);
    const docs = await cursor.toArray();
    return docs;
  } catch (err) {
    console.error('Error querying Astra DB for rera-links:', err);
    return [];
  }
}

export async function executeRAGRetrieval(
  query: string,
  targetNamespacesOverride?: ReraNamespace[]
): Promise<RAGRetrievalResult> {
  // 1. Analyze query intent and check for exact identifier regex
  const routing = await analyzeQueryAndRoute(query);
  const selectedNamespaces = targetNamespacesOverride && targetNamespacesOverride.length > 0
    ? targetNamespacesOverride
    : routing.targetNamespaces;

  const queryFilter = routing.queryFilter;

  // Split target namespaces between Pinecone and Astra DB
  const pineconeNamespaces = selectedNamespaces.filter((ns) => ns !== 'rera-links');
  const queryAstra = selectedNamespaces.includes('rera-links');

  // 2. Generate vector embedding using gemini-embedding-001 (3072 dims)
  let queryVector: number[] = [];
  try {
    queryVector = await generateEmbedding(query);
  } catch (embedError) {
    console.warn('Embedding generation error in RAG retrieval:', embedError);
  }

  const citations: CitationItem[] = [];
  const contextSnippets: string[] = [];
  const seenIds = new Set<string>();

  // 3. If exact ID filter is present, run exact filtered query first
  if (queryFilter && Object.keys(queryFilter).length > 0) {
    const dummyVector = queryVector.length > 0 ? queryVector : new Array(3072).fill(0);

    const filterPromises: Promise<{ source: 'pinecone' | 'astra'; namespace: ReraNamespace; results: any[] }>[] = [];

    // Pinecone exact filter queries
    for (const ns of pineconeNamespaces) {
      filterPromises.push(
        (async () => {
          try {
            const topK = getTopKForNamespace(ns);
            const results = await queryPineconeNamespace(ns, dummyVector, topK, queryFilter);
            return { source: 'pinecone' as const, namespace: ns, results: Array.isArray(results) ? results : [] };
          } catch (err) {
            console.warn(`Exact filter query failed in Pinecone [${ns}]:`, err);
            return { source: 'pinecone' as const, namespace: ns, results: [] };
          }
        })()
      );
    }

    // Astra DB exact filter query
    if (queryAstra) {
      filterPromises.push(
        (async () => {
          try {
            const topK = getTopKForNamespace('rera-links');
            const results = await queryAstraLinks(dummyVector, topK, queryFilter);
            return { source: 'astra' as const, namespace: 'rera-links' as const, results: Array.isArray(results) ? results : [] };
          } catch (err) {
            console.warn('Exact filter query failed in Astra DB [rera-links]:', err);
            return { source: 'astra' as const, namespace: 'rera-links' as const, results: [] };
          }
        })()
      );
    }

    const filterSettled = await Promise.allSettled(filterPromises);

    for (const settled of filterSettled) {
      if (settled.status === 'fulfilled' && settled.value) {
        const { source, namespace, results } = settled.value;

        if (source === 'pinecone') {
          for (const item of results) {
            if (!item || seenIds.has(item.id)) continue;
            seenIds.add(item.id);

            const meta = item.metadata || {};
            const title =
              (meta.complaint_project_name as string) ||
              (meta.canonical_project_name as string) ||
              (meta.project_name as string) ||
              (meta.title as string) ||
              (meta.name as string) ||
              (meta.complaint_number as string) ||
              `K-RERA Record (${item.id})`;

            const section =
              (meta.complaint_number as string) ||
              (meta.registration_number as string) ||
              (meta.case_number as string) ||
              (meta.section as string) ||
              '';

            const snippet =
              (meta.complaint_subject ? `Subject: ${meta.complaint_subject}\nStatus: ${meta.complaint_status || ''}\nPromoter: ${meta.complaint_promoter_name || meta.promoter_name || ''}\nSource: ${meta.Complaint_Source || meta.source || ''}\nOrder By: ${meta.order_by || ''}` : '') ||
              (meta.text as string) ||
              (meta.content as string) ||
              JSON.stringify(meta);

            citations.push({
              id: item.id,
              namespace,
              title,
              section,
              score: 0.99, // Exact metadata match
              snippet,
              citationRef: (meta.citationRef as string) || (meta.project_url as string) || undefined,
              url: (meta.project_url as string) || (meta.url as string) || undefined,
            });

            contextSnippets.push(`[${namespace.toUpperCase()} - EXACT MATCH] ${title} (${section}):\n${snippet}`);
          }
        } else if (source === 'astra') {
          for (const doc of results) {
            if (!doc || seenIds.has(doc._id)) continue;
            seenIds.add(doc._id);

            const title = doc.project_name ? `${doc.project_name} (Document Links)` : `K-RERA Document Links (${doc._id})`;
            const section = doc.registration_number || (doc.chunk_index ? `Chunk ${doc.chunk_index}/${doc.total_chunks || 1}` : '');
            const snippet = doc.text || JSON.stringify(doc);

            citations.push({
              id: doc._id,
              namespace: 'rera-links',
              title,
              section,
              score: 0.99, // Exact metadata match
              snippet,
              metadata: {
                project_name: doc.project_name,
                registration_number: doc.registration_number,
                chunk_index: doc.chunk_index,
                total_chunks: doc.total_chunks,
                document_count: doc.document_count,
              },
            });

            contextSnippets.push(`[RERA-LINKS - EXACT MATCH] ${title} (${section}):\n${snippet}`);
          }
        }
      }
    }
  }

  // 4. Parallel Multi-Namespace Dense Vector Retrieval
  if (queryVector && queryVector.length > 0) {
    const retrievalPromises: Promise<{ source: 'pinecone' | 'astra'; namespace: ReraNamespace; results: any[] }>[] = [];

    // Pinecone vector search
    for (const ns of pineconeNamespaces) {
      retrievalPromises.push(
        (async () => {
          try {
            const topK = getTopKForNamespace(ns);
            const results = await queryPineconeNamespace(ns, queryVector, topK);
            return { source: 'pinecone' as const, namespace: ns, results: Array.isArray(results) ? results : [] };
          } catch (nsErr) {
            console.warn(`Pinecone retrieval failed for ${ns}:`, nsErr);
            return { source: 'pinecone' as const, namespace: ns, results: [] };
          }
        })()
      );
    }

    // Astra DB vector search for rera-links
    if (queryAstra) {
      retrievalPromises.push(
        (async () => {
          try {
            const topK = getTopKForNamespace('rera-links');
            const results = await queryAstraLinks(queryVector, topK);
            return { source: 'astra' as const, namespace: 'rera-links' as const, results: Array.isArray(results) ? results : [] };
          } catch (err) {
            console.warn('Astra DB retrieval failed for rera-links:', err);
            return { source: 'astra' as const, namespace: 'rera-links' as const, results: [] };
          }
        })()
      );
    }

    const settledResults = await Promise.allSettled(retrievalPromises);

    for (const settled of settledResults) {
      if (settled.status === 'fulfilled' && settled.value) {
        const { source, namespace, results } = settled.value;

        if (source === 'pinecone') {
          for (const item of results) {
            if (!item || seenIds.has(item.id)) continue;
            seenIds.add(item.id);

            const meta = item.metadata || {};

            const title =
              (meta.complaint_project_name as string) ||
              (meta.canonical_project_name as string) ||
              (meta.project_name as string) ||
              (meta.title as string) ||
              (meta.name as string) ||
              (meta.KRERA_Registration_Number as string) ||
              `K-RERA Record (${item.id})`;

            const section =
              (meta.complaint_number as string) ||
              (meta.registration_number as string) ||
              (meta.case_number as string) ||
              (meta.KRERA_Registration_Number as string) ||
              (meta.section as string) ||
              (meta.promoter as string) ||
              (meta.Promoter_Name as string) ||
              '';

            const snippet =
              (meta.complaint_subject ? `Subject: ${meta.complaint_subject}\nStatus: ${meta.complaint_status || ''}\nPromoter: ${meta.complaint_promoter_name || meta.promoter_name || ''}\nSource: ${meta.Complaint_Source || meta.source || ''}\nOrder By: ${meta.order_by || ''}` : '') ||
              (meta.text as string) ||
              (meta.content as string) ||
              (meta.snippet as string) ||
              (meta.description as string) ||
              JSON.stringify(meta);

            const score = item.score || 0.85;

            if (snippet && snippet.length > 5) {
              citations.push({
                id: item.id,
                namespace,
                title,
                section,
                score,
                snippet,
                citationRef: (meta.citationRef as string) || (meta.project_url as string) || (meta.Project_URL as string) || undefined,
                url: (meta.project_url as string) || (meta.Project_URL as string) || (meta.url as string) || undefined,
              });

              contextSnippets.push(`[${namespace.toUpperCase()}] ${title} (${section}):\n${snippet}`);
            }
          }
        } else if (source === 'astra') {
          for (const doc of results) {
            if (!doc || seenIds.has(doc._id)) continue;
            seenIds.add(doc._id);

            const title = doc.project_name ? `${doc.project_name} (Document Links)` : `K-RERA Document Links (${doc._id})`;
            const section = doc.registration_number || (doc.chunk_index ? `Chunk ${doc.chunk_index}/${doc.total_chunks || 1}` : '');
            const snippet = doc.text || JSON.stringify(doc);
            const score = doc.$similarity ?? 0.88;

            if (snippet && snippet.length > 5) {
              citations.push({
                id: doc._id,
                namespace: 'rera-links',
                title,
                section,
                score,
                snippet,
                metadata: {
                  project_name: doc.project_name,
                  registration_number: doc.registration_number,
                  chunk_index: doc.chunk_index,
                  total_chunks: doc.total_chunks,
                  document_count: doc.document_count,
                },
              });

              contextSnippets.push(`[RERA-LINKS] ${title} (${section}):\n${snippet}`);
            }
          }
        }
      }
    }
  }

  // 5. Grounding with curated knowledge items to guarantee statutory accuracy
  const relevantCuratedDocs = retrieveFromKnowledgeBase(query, selectedNamespaces, 4);
  for (const doc of relevantCuratedDocs) {
    if (!citations.some((c) => c.title === doc.title || c.id === doc.id)) {
      citations.push({
        id: doc.id,
        namespace: doc.namespace,
        title: doc.title,
        section: doc.section,
        citationRef: doc.citationRef,
        score: doc.score,
        snippet: doc.content,
      });

      contextSnippets.push(`[${doc.namespace.toUpperCase()}] ${doc.title} (${doc.section}):\n${doc.content}`);
    }
  }

  // Sort citations: exact matches (score ~0.99) first, then descending score
  citations.sort((a, b) => b.score - a.score);

  return {
    citations,
    combinedContext: contextSnippets.join('\n\n---\n\n'),
    routedNamespaces: selectedNamespaces,
    reasoning: routing.reasoning,
    queryFilter,
    exactIdMatch: routing.extractedId,
  };
}

function retrieveFromKnowledgeBase(
  query: string,
  namespaces: ReraNamespace[],
  limit = 4
): Array<KnowledgeDocument & { score: number }> {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

  const scoredDocs = KRERA_KNOWLEDGE_BASE
    .filter((doc) => namespaces.includes(doc.namespace))
    .map((doc) => {
      let score = 0.5;

      if (queryLower.includes(doc.title.toLowerCase())) score += 0.4;
      if (doc.section && queryLower.includes(doc.section.toLowerCase())) score += 0.35;

      for (const kw of doc.keywords) {
        if (queryLower.includes(kw.toLowerCase())) {
          score += 0.25;
        }
      }

      for (const word of queryWords) {
        if (doc.content.toLowerCase().includes(word)) {
          score += 0.05;
        }
      }

      score = Math.min(0.98, score);

      return {
        ...doc,
        score: Number(score.toFixed(3)),
      };
    })
    .filter((doc) => doc.score >= 0.55)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scoredDocs;
}
