import { ReraNamespace } from '@/types/rera';

/**
 * REAA Statutory Real Estate Multilingual Lexicon & Intent Normalizer
 *
 * Implements strict legal vernacular matching:
 * - The official language of the Karnataka Gazette
 * - Karnataka Real Estate Regulatory Authority (K-RERA) Notifications & Circulars
 * - The Real Estate (Regulation and Development) Act, 2016 (Central Act 16 of 2016)
 * - The Karnataka Real Estate (Regulation and Development) Rules, 2017
 * - The Karnataka Land Revenue Act, 1964
 */

export interface StatutoryTerm {
  canonicalEnglish: string;
  kannada: string;
  kannadaParenthetical: string;
  hindi: string;
  hindiParenthetical: string;
  statutoryReference?: string;
  context: string;
  misinterpretationForbidden: string[];
}

export const STATUTORY_REAL_ESTATE_LEXICON: StatutoryTerm[] = [
  {
    canonicalEnglish: 'Promoter',
    kannada: 'ಪ್ರವರ್ತಕ',
    kannadaParenthetical: 'ಪ್ರವರ್ತಕ (Promoter)',
    hindi: 'प्रवर्तक',
    hindiParenthetical: 'प्रवर्तक (Promoter)',
    statutoryReference: 'Section 2(zk), RERA Act 2016',
    context: 'Real estate developer, builder, or development authority constructing or converting buildings/land.',
    misinterpretationForbidden: ['event promoter', 'marketing agent', 'sponsor', 'ಪ್ರಚಾರಕ', 'ಕಾರ್ಯಕ್ರಮ ಪ್ರವರ್ತಕ', 'प्रचारक'],
  },
  {
    canonicalEnglish: 'Allottee',
    kannada: 'ಹಂಚಿಕೆದಾರ',
    kannadaParenthetical: 'ಹಂಚಿಕೆದಾರ (Allottee)',
    hindi: 'आवंटी',
    hindiParenthetical: 'आवंटी (Allottee)',
    statutoryReference: 'Section 2(d), RERA Act 2016',
    context: 'Person to whom a plot, apartment, or building has been allotted, sold, or transferred.',
    misinterpretationForbidden: ['attendee', 'subscriber', 'ಭಾಗವಹಿಸುವವರು', 'ಗ್ರಾಹಕರು ಮಾತ್ರ', 'उपस्थित व्यक्ति'],
  },
  {
    canonicalEnglish: 'Occupancy Certificate (OC)',
    kannada: 'ಸ್ವಾಧೀನಾನುಭವ ಪ್ರಮಾಣಪತ್ರ',
    kannadaParenthetical: 'ಸ್ವಾಧೀನಾನುಭವ ಪ್ರಮಾಣಪತ್ರ (Occupancy Certificate - OC)',
    hindi: 'अधिभोग प्रमाण पत्र',
    hindiParenthetical: 'अधिभोग प्रमाण पत्र (Occupancy Certificate - OC)',
    statutoryReference: 'Section 2(zf), RERA Act 2016 & BBMP/BDA Byelaws',
    context: 'Statutory certificate issued by competent civic authority permitting occupation of building.',
    misinterpretationForbidden: ['possession letter', 'receipt', 'ತಾತ್ಕಾಲಿಕ ಪತ್ರ', 'कब्ज़ा पत्र'],
  },
  {
    canonicalEnglish: 'Completion Certificate (CC)',
    kannada: 'ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಪ್ರಮಾಣಪತ್ರ',
    kannadaParenthetical: 'ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಪ್ರಮಾಣಪತ್ರ (Completion Certificate - CC)',
    hindi: 'पूर्णता प्रमाण पत्र',
    hindiParenthetical: 'पूर्णता प्रमाण पत्र (Completion Certificate - CC)',
    statutoryReference: 'Section 2(q), RERA Act 2016',
    context: 'Statutory certificate certifying that the real estate project has been developed according to sanctioned plan.',
    misinterpretationForbidden: ['course completion', 'finishing letter', 'ಪ್ರಮಾಣ ಪತ್ರ ಸಾಮಾನ್ಯ', 'पाठ्यक्रम पूर्णता'],
  },
  {
    canonicalEnglish: 'Encumbrance Certificate (EC)',
    kannada: 'ಋಣಭಾರ ಪ್ರಮಾಣಪತ್ರ',
    kannadaParenthetical: 'ಋಣಭಾರ ಪ್ರಮಾಣಪತ್ರ (Encumbrance Certificate - EC)',
    hindi: 'भार प्रमाणपत्र',
    hindiParenthetical: 'भार प्रमाणपत्र (Encumbrance Certificate - EC)',
    statutoryReference: 'Registration Act 1908, Form 15/16 Sub-Registrar Office Karnataka',
    context: 'Document evidencing registered financial or legal liabilities, charges, or liens on property.',
    misinterpretationForbidden: ['debt slip', 'tax receipt', 'ಸಾಲದ ರಸೀದಿ', 'ऋण पर्ची'],
  },
  {
    canonicalEnglish: 'Original Suit (Title Dispute)',
    kannada: 'ಮೂಲ ದಾವೆ',
    kannadaParenthetical: 'ಮೂಲ ದಾವೆ (Original Suit - O.S.)',
    hindi: 'मूल वाद',
    hindiParenthetical: 'मूल वाद (Original Suit - O.S.)',
    statutoryReference: 'Code of Civil Procedure (CPC) 1908, Order VII',
    context: 'Formal civil court litigation instituted to determine title, ownership, partition, or declaration on real property.',
    misinterpretationForbidden: ['clothing suit', 'garment', 'coat-pant', 'ಉಡುಪು', 'ಬಟ್ಟೆ', 'ಸೂಟು', 'पोशाक', 'वस्त्र'],
  },
  {
    canonicalEnglish: 'Ad-interim Injunction',
    kannada: 'ಮಧ್ಯಂತರ ತಡೆಯಾಜ್ಞೆ',
    kannadaParenthetical: 'ಮಧ್ಯಂತರ ತಡೆಯಾಜ್ಞೆ (Temporary Injunction)',
    hindi: 'अंतरिम व्यादेश',
    hindiParenthetical: 'अंतरिम व्यादेश / स्थगन आदेश (Interim Injunction)',
    statutoryReference: 'CPC 1908 Order XXXIX Rules 1 & 2',
    context: 'Judicial restrain order restraining alienation, construction, or dispossession on disputed property.',
    misinterpretationForbidden: ['ban', 'halt', 'break', 'ವಿರಾಮ', 'ಸ್ಥಗಿತ ಕೇವಲ', 'रोक सामान्य'],
  },
  {
    canonicalEnglish: 'Conveyance Deed / Sale Deed',
    kannada: 'ಕ್ರಯಪತ್ರ',
    kannadaParenthetical: 'ಕ್ರಯಪತ್ರ (Sale Deed / Conveyance Deed)',
    hindi: 'विक्रय विलेख / हस्तांतरण विलेख',
    hindiParenthetical: 'विक्रय विलेख (Sale Deed / Conveyance Deed)',
    statutoryReference: 'Section 17, RERA Act 2016 & Transfer of Property Act 1882',
    context: 'Registered legal instrument transferring complete legal title of property or common areas.',
    misinterpretationForbidden: ['contract paper', 'deal slip', 'ಕರಾರು ಪತ್ರ ಮಾತ್ರ', 'सौदा पर्ची'],
  },
  {
    canonicalEnglish: 'Delay Interest / Compensation',
    kannada: 'ವಿಳಂಬ ಪರಿಹಾರ ಮತ್ತು ಬಡ್ಡಿ',
    kannadaParenthetical: 'ವಿಳಂಬ ಪರಿಹಾರ ಮತ್ತು ಬಡ್ಡಿ (Section 18 Delay Compensation)',
    hindi: 'विलंब मुआवजा और ब्याज',
    hindiParenthetical: 'विलंब मुआवजा और ब्याज (Section 18 Delay Compensation)',
    statutoryReference: 'Section 18(1), RERA Act 2016 read with Karnataka RERA Rule 18',
    context: 'Statutory monthly interest payable by promoter for delayed possession at SBI MCLR + 2.00%.',
    misinterpretationForbidden: ['fine', 'late fee', 'ದಂಡ ಶುಲ್ಕ', 'लेट फीस'],
  },
  {
    canonicalEnglish: 'Adjudicating Officer',
    kannada: 'ತೀರ್ಪುಗಾರ ಅಧಿಕಾರಿ',
    kannadaParenthetical: 'ತೀರ್ಪುಗಾರ ಅಧಿಕಾರಿ (Adjudicating Officer - Form N)',
    hindi: 'न्यायनिर्णायक अधिकारी',
    hindiParenthetical: 'न्यायनिर्णायक अधिकारी (Adjudicating Officer - Form N)',
    statutoryReference: 'Section 71 & 72, RERA Act 2016',
    context: 'Judicial officer appointed under RERA to adjudicate compensation and interest claims under Form N.',
    misinterpretationForbidden: ['judge generic', 'arbitrator', 'ಮಧ್ಯಸ್ಥಿಕೆದಾರ', 'पंच'],
  },
  {
    canonicalEnglish: 'Real Estate Regulatory Authority',
    kannada: 'ಕರ್ನಾಟಕ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ನಿಯಂತ್ರಣ ಪ್ರಾಧಿಕಾರ',
    kannadaParenthetical: 'ಕರ್ನಾಟಕ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ನಿಯಂತ್ರಣ ಪ್ರಾಧಿಕಾರ (K-RERA Authority)',
    hindi: 'कर्नाटक रियल एस्टेट विनियामक प्राधिकरण',
    hindiParenthetical: 'कर्नाटक रियल एस्टेट विनियामक प्राधिकरण (K-RERA Authority)',
    statutoryReference: 'Section 20 & 31, RERA Act 2016',
    context: 'Statutory authority regulating registered projects and hearing Form M complaints.',
    misinterpretationForbidden: ['rera board', 'housing board generic', 'ಗೃಹ ಮಂಡಳಿ', 'आवास बोर्ड'],
  },
  {
    canonicalEnglish: 'Real Estate Appellate Tribunal (REAT)',
    kannada: 'ಕರ್ನಾಟಕ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಮೇಲ್ಮನವಿ ನ್ಯಾಯಾಧಿಕರಣ',
    kannadaParenthetical: 'ಕರ್ನಾಟಕ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಮೇಲ್ಮನವಿ ನ್ಯಾಯಾಧಿಕರಣ (REAT)',
    hindi: 'कर्नाटक रियल एस्टेट अपीलीय अधिकरण',
    hindiParenthetical: 'कर्नाटक रियल एस्टेट अपीलीय अधिकरण (REAT)',
    statutoryReference: 'Section 43 & 44, RERA Act 2016',
    context: 'Statutory appellate tribunal hearing appeals against K-RERA Authority and Adjudicating Officer orders.',
    misinterpretationForbidden: ['court of appeals generic', 'ಮೇಲಿನ ಕೋರ್ಟ್', 'अपील कोर्ट'],
  },
  {
    canonicalEnglish: 'Separate Escrow Bank Account',
    kannada: 'ಪ್ರತ್ಯೇಕ ಎಸ್ಕ್ರೋ ಬ್ಯಾಂಕ್ ಖಾತೆ',
    kannadaParenthetical: 'ಪ್ರತ್ಯೇಕ ಎಸ್ಕ್ರೋ ಬ್ಯಾಂಕ್ ಖಾತೆ (70% Escrow Account - Section 4(2)(l)(D))',
    hindi: 'अलग एस्क्रो बैंक खाता',
    hindiParenthetical: 'अलग एस्क्रो बैंक खाता (70% Escrow Account - Section 4(2)(l)(D))',
    statutoryReference: 'Section 4(2)(l)(D), RERA Act 2016',
    context: 'Mandatory separate bank account where 70% of collections must be deposited for construction and land costs.',
    misinterpretationForbidden: ['savings account', 'promoter account', 'ಉಳಿತಾಯ ಖಾತೆ', 'बचत खाता'],
  },
  {
    canonicalEnglish: '5-Year Structural Defect Liability',
    kannada: '೫ ವರ್ಷಗಳ ರಚನಾತ್ಮಕ ದೋಷ ಹೊಣೆಗಾರಿಕೆ',
    kannadaParenthetical: '೫ ವರ್ಷಗಳ ರಚನಾತ್ಮಕ ದೋಷ ಹೊಣೆಗಾರಿಕೆ (Section 14(3) 5-Year Defect Liability)',
    hindi: '५ वर्ष का संरचनात्मक दोष दायित्व',
    hindiParenthetical: '५ वर्ष का संरचनात्मक दोष दायित्व (Section 14(3) 5-Year Defect Liability)',
    statutoryReference: 'Section 14(3), RERA Act 2016',
    context: 'Statutory obligation on promoter to rectify structural defects within 30 days without charge for 5 years.',
    misinterpretationForbidden: ['product warranty', 'guarantee card', 'ಖಾತರಿ ಕಾರ್ಡ್', 'वारंटी कार्ड'],
  },
  {
    canonicalEnglish: 'Vacant Plot / Revenue Land',
    kannada: 'ಖಾಲಿ ನಿವೇಶನ / ಕಂದಾಯ ಭೂಮಿ',
    kannadaParenthetical: 'ಖಾಲಿ ನಿವೇಶನ / ಕಂದಾಯ ಭೂಮಿ (Vacant Plot / Revenue Land)',
    hindi: 'खाली भूखंड / राजस्व भूमि',
    hindiParenthetical: 'खाली भूखंड / राजस्व भूमि (Vacant Plot / Revenue Land)',
    statutoryReference: 'Karnataka Land Revenue Act 1964 & Section 2(e) RERA Act 2016',
    context: 'Plotted development or agricultural land awaiting or undergoing Section 95 conversion.',
    misinterpretationForbidden: ['empty space', 'conspiracy', 'ಸಂಚು', 'ಖಾಲಿ ಜಾಗ ಸಾಮಾನ್ಯ', 'षड्यंत्र'],
  },
  {
    canonicalEnglish: 'Physical Possession / Handover',
    kannada: 'ಭೌತಿಕ ಸ್ವಾಧೀನ',
    kannadaParenthetical: 'ಭೌತಿಕ ಸ್ವಾಧೀನ (Physical Possession / Handover)',
    hindi: 'भौतिक कब्ज़ा / आधिपत्य',
    hindiParenthetical: 'भौतिक कब्ज़ा (Physical Possession / Handover)',
    statutoryReference: 'Section 18 & 19, RERA Act 2016',
    context: 'Actual physical delivery of possession of the apartment, plot, or building along with Occupancy Certificate.',
    misinterpretationForbidden: ['demonic possession', 'ghost possession', 'ದೆವ್ವ ಹಿಡಿಯುವುದು', 'ಭೂತಾವೇಶ', 'भूत-प्रेत', 'आत्मा का साया'],
  },
  {
    canonicalEnglish: 'Stay Order / Injunction',
    kannada: 'ತಡೆಯಾಜ್ಞೆ',
    kannadaParenthetical: 'ತಡೆಯಾಜ್ಞೆ (Stay Order / Temporary Injunction)',
    hindi: 'स्थगन आदेश',
    hindiParenthetical: 'स्थगन आदेश (Stay Order / Interim Injunction)',
    statutoryReference: 'CPC 1908 Order XXXIX',
    context: 'Judicial restrain order restraining alienation, construction, or dispossession on disputed property.',
    misinterpretationForbidden: ['hotel stay', 'lodging', 'residence', 'ವಾಸ್ತವ್ಯ', 'ಉಳಿದುಕೊಳ್ಳುವುದು', 'ठहरना'],
  },
];

// Vernacular-to-intent mappings for Kannada & Hindi queries
interface VernacularIntentRule {
  patterns: (string | RegExp)[];
  namespace: ReraNamespace;
  targetEnglishTerms: string[];
  conceptName: string;
}

const VERNACULAR_INTENT_RULES: VernacularIntentRule[] = [
  {
    // Original suits, title litigations, civil court disputes, stay orders
    patterns: [
      'ಮೂಲ ದಾವೆ',
      'ದಾವೆ',
      'ತಡೆಯಾಜ್ಞೆ',
      'ನ್ಯಾಯಾಲಯ',
      'ಕೋರ್ಟ್',
      'ಸಿವಿಲ್ ಕೋರ್ಟ್',
      'ಹೈಕೋರ್ಟ್',
      'ಸ್ಥಗಿತ ಆದೇಶ',
      'ಹಕ್ಕು ವಿವಾದ',
      'ಪಾಲು ದಾವೆ',
      'ಖಾಲಿ ಇರುವ ನಿವೇಶನಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ಮೂಲ ದಾವೆ',
      'मूल वाद',
      'वाद',
      'मुकदमा',
      'अंतरिम व्यादेश',
      'स्थगन आदेश',
      'न्यायालय',
      'सिविल कोर्ट',
      'विवाद',
      'शीर्षक विवाद',
    ],
    namespace: 'rera-litigation',
    targetEnglishTerms: ['original suit', 'title dispute', 'injunction', 'stay order', 'civil court litigation', 'partition suit'],
    conceptName: 'Original Suits & Civil Litigations (ಮೂಲ ದಾವೆಗಳು / मूल वाद)',
  },
  {
    // Complaints, Form M, Form N, Adjudicating Officer, refund, delay interest claims
    patterns: [
      'ದೂರು',
      'ನಮೂನೆ ಎಂ',
      'ನಮೂನೆ ಎನ್',
      'ಫಾರ್ಮ್ ಎಂ',
      'ಫಾರ್ಮ್ ಎನ್',
      'ತೀರ್ಪುಗಾರ ಅಧಿಕಾರಿ',
      'ವಿಳಂಬ ಬಡ್ಡಿ',
      'ವಿಳಂಬ',
      'ಸ್ವಾಧೀನ',
      'ಪರಿಹಾರ',
      'ಹಣ ವಾಪಸಾತಿ',
      'ವಸೂಲಾತಿ ವಾರೆಂಟ್',
      'ಸೆಕ್ಷನ್ 18',
      'ಸೆಕ್ಷನ್ 31',
      'ಸೆಕ್ಷನ್ 71',
      'ವಿಭಾಗ 18',
      'ವಿಭಾಗ 31',
      'ವಿಭಾಗ 71',
      'शिकायत',
      'फॉर्म एम',
      'फॉर्म एन',
      'न्यायनिर्णायक अधिकारी',
      'विलंब ब्याज',
      'विलंब',
      'कब्जा',
      'कब्ज़ा',
      'मुआवजा',
      'रिफंड',
      'वसूली वारंट',
      'धारा 18',
      'धारा 31',
      'धारा 71',
    ],
    namespace: 'rera-complaints',
    targetEnglishTerms: ['complaint', 'form m', 'form n', 'adjudicating officer', 'section 18 delay interest', 'section 71 compensation', 'refund'],
    conceptName: 'K-RERA Complaints & Adjudications (ದೂರುಗಳು ಮತ್ತು ಪರಿಹಾರ / शिकायतें)',
  },
  {
    // Statutory act definitions, rules, escrow, defect liability, carpet area
    patterns: [
      'ಕಾಯ್ದೆ',
      'ನಿಯಮ',
      'ನಿಯಮಾವಳಿ',
      'ಎಸ್ಕ್ರೋ',
      '70%',
      'ರಚನಾತ್ಮಕ ದೋಷ',
      'ಕಾರ್ಪೆಟ್ ವಿಸ್ತೀರ್ಣ',
      'ಮುಂಗಡ ಹಣ',
      '10% ಮಿತಿ',
      'ಅಧಿನಿಯಮ',
      'ಅಧಿಸೂಚನೆ',
      'ಸರ್ಕ್ಯುಲರ್',
      'ಕಾನೂನು',
      'अधिनियम',
      'नियम',
      'नियम 18',
      'एस्क्रो खाता',
      '70 प्रतिशत',
      'संरचनात्मक दोष',
      'कारपेट क्षेत्र',
      'अग्रिम भुगतान',
      'अधिसूचना',
      'परिपत्र',
    ],
    namespace: 'rera-legal',
    targetEnglishTerms: ['rera act 2016', 'karnataka rera rules 2017', '70 escrow account', 'defect liability section 14', 'carpet area definition'],
    conceptName: 'Statutory Act & Rules (ಕಾನೂನು ಮತ್ತು ನಿಯಮಾವಳಿ / वैधानिक प्रावधान)',
  },
  {
    // Project details, approval, promoter, completion date, registration
    patterns: [
      'ಯೋಜನೆ',
      'ಪ್ರಾಜೆಕ್ಟ್',
      'ನೋಂದಣಿ',
      'ಅನುಮೋದನೆ',
      'ಪ್ರವರ್ತಕ',
      'ಡೆವಲಪರ್',
      'ಪೂರ್ಣಗೊಳ್ಳುವ ದಿನಾಂಕ',
      'ಫ್ಲಾಟ್',
      'ಟವರ್',
      'ನಿವೇಶನ',
      'ಖಾಲಿ ನಿವೇಶನ',
      'ಯೋಜನೆ ಸ್ಥಿತಿ',
      'ಪ್ರೆಸ್ಟೀಜ್',
      'ಶೋಭಾ',
      'ಬ್ರಿಗೇಡ್',
      'ಗೋದ್flag',
      'परियोजना',
      'प्रोजेक्ट',
      'पंजीकरण',
      'अनुमोदन',
      'प्रवर्तक',
      'डेवलपर',
      'पूर्णता तिथि',
      'फ्लैट',
      'टावर',
      'भूखंड',
      'खाली भूखंड',
      'परियोजना स्थिति',
    ],
    namespace: 'rera-projects',
    targetEnglishTerms: ['project registration', 'promoter developer', 'completion date', 'approval status', 'sanctioned layout'],
    conceptName: 'Project Disclosures & Approvals (ಯೋಜನಾ ವಿವರಗಳು / परियोजना विवरण)',
  },
  {
    // Official links, certificates, downloads, NOCs
    patterns: [
      'ದಾಖಲೆ',
      'ಲಿಂಕ್',
      'ಪಿಡಿಎಫ್',
      'ಡೌನ್‌ಲೋಡ್',
      'ಪ್ರಮಾಣಪತ್ರ',
      'ಸ್ವಾಧೀನಾನುಭವ ಪ್ರಮಾಣಪತ್ರ',
      'ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಪ್ರಮಾಣಪತ್ರ',
      'ಋಣಭಾರ ಪ್ರಮಾಣಪತ್ರ',
      'ಕ್ರಯಪತ್ರ',
      'ದಾಖಲೆಗಳು',
      'दस्तावेज़',
      'लिंक',
      'डाउनलोड',
      'अधिभोग प्रमाण पत्र',
      'पूर्णता प्रमाण पत्र',
      'भार प्रमाणपत्र',
      'विक्रय विलेख',
    ],
    namespace: 'rera-links',
    targetEnglishTerms: ['document links', 'occupancy certificate download', 'completion certificate', 'encumbrance certificate', 'sanctioned plan pdf'],
    conceptName: 'Statutory Document Links & Certificates (ಅಧಿಕೃತ ಪ್ರಮಾಣಪತ್ರಗಳು ಮತ್ತು ಲಿಂಕ್‌ಗಳು / दस्तावेज़)',
  },
];

export const AGGREGATION_KEYWORDS = [
  'total',
  'sum',
  'count',
  'how many',
  'cost of all',
  'list all',
  'total cost',
  'total estimated',
  'estimated cost',
  'project cost',
  'aggregate',
  'average',
  'highest number',
  'lowest number',
  'top 5',
  'top 10',
  'maximum',
  'minimum',
  'statistics',
  'how much',
  'portfolio cost',
  'overall cost',
  // Statutory Kannada / Vernacular Aggregation
  'ಒಟ್ಟು',
  'ಎಷ್ಟು',
  'ಲೆಕ್ಕ',
  'ಮೊತ್ತ',
  'ಸಂಖ್ಯೆ',
  'ಪಟ್ಟಿ ಮಾಡಿ',
  'ಒಟ್ಟು ವೆಚ್ಚ',
  'ಅಂದಾಜು ವೆಚ್ಚ',
  // Statutory Hindi / Vernacular Aggregation
  'कुल',
  'योग',
  'संख्या',
  'कितने',
  'कितना',
  'लागत',
  'सूची',
  'औसत',
  'कुल लागत',
  'अनुमानित लागत',
];

export interface VernacularNormalizationResult {
  detectedLanguage: 'kn-IN' | 'hi-IN' | 'en-IN';
  isVernacular: boolean;
  hasAggregation: boolean;
  matchedNamespaces: ReraNamespace[];
  extractedLegalTerms: string[];
  keyConcepts: string[];
  normalizedQuery: string;
}

/**
 * Normalizes vernacular queries in Kannada and Hindi into structured search intents,
 * target namespaces, and expanded search terms for dense vector retrieval.
 */
export function normalizeVernacularQuery(rawQuery: string): VernacularNormalizationResult {
  const query = rawQuery.trim();
  const queryLower = query.toLowerCase();

  // Detect script
  const hasKannada = /[\u0C80-\u0CFF]/.test(query);
  const hasDevanagari = /[\u0900-\u097F]/.test(query);

  let detectedLanguage: 'kn-IN' | 'hi-IN' | 'en-IN' = 'en-IN';
  if (hasKannada) {
    detectedLanguage = 'kn-IN';
  } else if (hasDevanagari) {
    detectedLanguage = 'hi-IN';
  }

  const isVernacular = hasKannada || hasDevanagari;
  const matchedNamespaces = new Set<ReraNamespace>();
  const extractedLegalTerms: string[] = [];
  const keyConcepts: string[] = [];
  const englishConceptTerms: string[] = [];

  // 1. Detect Mathematical / Statistical Aggregation Intent
  const hasAggregation = AGGREGATION_KEYWORDS.some((kw) => {
    if (kw.length <= 3) {
      return new RegExp(`\\b${kw}\\b`, 'i').test(query);
    }
    return queryLower.includes(kw.toLowerCase());
  });

  if (hasAggregation) {
    matchedNamespaces.add('supabase-sql');
    keyConcepts.push('Statistical Aggregation & Quantitative Analytics (Supabase Text-to-SQL)');
    englishConceptTerms.push('aggregate sql query', 'total count', 'total project cost');
  }

  // 2. Match against Statutory Lexicon
  for (const term of STATUTORY_REAL_ESTATE_LEXICON) {
    const kannadaHit = hasKannada && (query.includes(term.kannada) || query.includes(term.kannadaParenthetical));
    const hindiHit = hasDevanagari && (query.includes(term.hindi) || query.includes(term.hindiParenthetical));

    if (kannadaHit || hindiHit) {
      extractedLegalTerms.push(term.canonicalEnglish);
      englishConceptTerms.push(term.canonicalEnglish.toLowerCase());
      if (kannadaHit) keyConcepts.push(`${term.kannada} (${term.canonicalEnglish})`);
      if (hindiHit) keyConcepts.push(`${term.hindi} (${term.canonicalEnglish})`);
    }
  }

  // 3. Match against Vernacular Intent Rules
  for (const rule of VERNACULAR_INTENT_RULES) {
    let ruleMatched = false;
    for (const pattern of rule.patterns) {
      if (typeof pattern === 'string') {
        if (query.includes(pattern) || queryLower.includes(pattern.toLowerCase())) {
          ruleMatched = true;
          break;
        }
      } else if (pattern instanceof RegExp && pattern.test(query)) {
        ruleMatched = true;
        break;
      }
    }

    if (ruleMatched) {
      matchedNamespaces.add(rule.namespace);
      keyConcepts.push(rule.conceptName);
      englishConceptTerms.push(...rule.targetEnglishTerms);
    }
  }

  // Build high-recall expanded query for cross-lingual vector & keyword search
  const uniqueEnglishTerms = Array.from(new Set(englishConceptTerms));
  let normalizedQuery = query;
  if (isVernacular && uniqueEnglishTerms.length > 0) {
    normalizedQuery = `${query} [Legal Concepts: ${uniqueEnglishTerms.join(' ')}]`;
  }

  return {
    detectedLanguage,
    isVernacular,
    hasAggregation,
    matchedNamespaces: Array.from(matchedNamespaces),
    extractedLegalTerms: Array.from(new Set(extractedLegalTerms)),
    keyConcepts: Array.from(new Set(keyConcepts)),
    normalizedQuery,
  };
}

/**
 * Returns the comprehensive Statutory Real Estate Lexicon Directive for model prompting.
 */
export function getStatutoryLexiconDirective(selectedLang?: string): string {
  if (selectedLang === 'kn-IN' || selectedLang === 'kn') {
    return `
### MANDATORY STATUTORY REAL ESTATE LEXICON DIRECTIVE (KANNADA - K-RERA):
The user has requested the advisory response strictly in **KANNADA (ಕನ್ನಡ)**.
You MUST formulate and synthesize the ENTIRE advisory response in formal, authoritative **statutory legal Kannada** conforming to the official vocabulary of the **Karnataka Gazette**, **Karnataka Real Estate Regulatory Authority (K-RERA) Notifications**, and the **Karnataka Land Revenue Act, 1964**.

#### 1. MANDATORY STATUTORY VERNACULAR TERMINOLOGY:
You must strictly use the following statutory translations:
- **Promoter** -> **ಪ್ರವರ್ತಕ (Promoter)**
- **Allottee / Homebuyer** -> **ಹಂಚಿಕೆದಾರ (Allottee)**
- **Occupancy Certificate (OC)** -> **ಸ್ವಾಧೀನಾನುಭವ ಪ್ರಮಾಣಪತ್ರ (Occupancy Certificate - OC)**
- **Completion Certificate (CC)** -> **ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಪ್ರಮಾಣಪತ್ರ (Completion Certificate - CC)**
- **Encumbrance Certificate (EC)** -> **ಋಣಭಾರ ಪ್ರಮಾಣಪತ್ರ (Encumbrance Certificate - EC)**
- **Original Suit (Title Litigation)** -> **ಮೂಲ ದಾವೆ (Original Suit - O.S.)**
- **Ad-interim Injunction** -> **ಮಧ್ಯಂತರ ತಡೆಯಾಜ್ಞೆ (Temporary Injunction)**
- **Conveyance Deed / Sale Deed** -> **ಕ್ರಯಪತ್ರ (Sale Deed / Conveyance Deed)**
- **Delay Interest / Compensation** -> **ವಿಳಂಬ ಪರಿಹಾರ ಮತ್ತು ಬಡ್ಡಿ (Section 18 Delay Compensation)**
- **Adjudicating Officer** -> **ತೀರ್ಪುಗಾರ ಅಧಿಕಾರಿ (Adjudicating Officer - Form N)**
- **Authority** -> **ಕರ್ನಾಟಕ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ನಿಯಂತ್ರಣ ಪ್ರಾಧಿಕಾರ (K-RERA Authority)**
- **Appellate Tribunal** -> **ಕರ್ನಾಟಕ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಮೇಲ್ಮನವಿ ನ್ಯಾಯಾಧಿಕರಣ (REAT)**
- **70% Escrow Account** -> **ಪ್ರತ್ಯೇಕ ಬ್ಯಾಂಕ್ ಖಾತೆ / ಎಸ್ಕ್ರೋ ಖಾತೆ (Section 4(2)(l)(D))**
- **Physical Possession / Handover** -> **ಭೌತಿಕ ಸ್ವಾಧೀನ (Physical Possession / Handover)**
- **Stay Order / Temporary Injunction** -> **ತಡೆಯಾಜ್ಞೆ (Stay Order / Temporary Injunction)**
- **Vacant Plot / Revenue Land** -> **ಖಾಲಿ ನಿವೇಶನ / ಕಂದಾಯ ಭೂಮಿ (Vacant Plot / Revenue Land)**

#### 2. BILINGUAL PARENTHETICAL ANCHORING (MANDATORY):
Statutory forms, specific sections, and statutory financial rate formulas MUST retain their exact alphanumeric citations in parentheses next to the Kannada translation to eliminate ambiguity for legal filings:
- **Statutory Forms**: ನಮೂನೆ ಎಂ (Form M), ನಮೂನೆ ಎನ್ (Form N), ನಮೂನೆ ಬಿ (Form B), ನಮೂನೆ ಎಫ್ (Form F).
- **Statutory Sections**: ವಿಭಾಗ 18 (Section 18), ವಿಭಾಗ 14(3) (Section 14(3)), ವಿಭಾಗ 4(2)(l)(D) (Section 4(2)(l)(D)), ವಿಭಾಗ 31 (Section 31), ವಿಭಾಗ 71 (Section 71).
- **Statutory Formulas**: ಎಸ್.ಬಿ.ಐ. ಗರಿಷ್ಠ ಎಂ.ಸಿ.ಎಲ್.ಆರ್ + 2.00% (SBI Highest MCLR + 2.00%).
- **Project Identifiers & Precedents**: Keep exact PRM numbers, CMP numbers, and case law titles (e.g., *M/s Newtech Promoters & Developers v. State of UP*) in clear Latin alphanumeric format alongside Kannada text.

#### 3. STRICT ANTI-COLLOQUIAL TRANSLATION RULES (ZERO-TOLERANCE):
Colloquial machine translation errors are strictly forbidden:
- **FORBIDDEN**: Translating "suit" as clothing/garment (ಉಡುಪು, ಬಟ್ಟೆ, ಸೂಟು). Must strictly be **ಮೂಲ ದಾವೆ (Original Suit - O.S.)**.
- **FORBIDDEN**: Translating "promoter" as event organizer/promoter (ಕಾರ್ಯಕ್ರಮ ಪ್ರವರ್ತಕ, ಪ್ರಚಾರಕ). Must strictly be **ಪ್ರವರ್ತಕ (Promoter / Real Estate Developer)**.
- **FORBIDDEN**: Translating "possession" as demonic/paranormal possession (ದೆವ್ವ ಹಿಡಿಯುವುದು, ಭೂತಾವೇಶ). Must strictly be **ಭೌತಿಕ ಸ್ವಾಧೀನ / ಹಸ್ತಾಂತರ (Physical Possession / Handover)**.
- **FORBIDDEN**: Translating "execution" as death penalty/hanging (ಮರಣದಂಡನೆ, ಗಲ್ಲು). In legal execution of orders, it must strictly be **ತೀರ್ಪಿನ ಜಾರಿ / ಆದೇಶದ ಅನುಷ್ಠಾನ (Execution of Decree / Order)**.
- **FORBIDDEN**: Translating "plot" as conspiracy/secret plan (ಸಂಚು, ಷಡ್ಯಂತ್ರ). Must strictly be **ನಿವೇಶನ / ಭೂಮಿ (Plot / Land Parcel)**.
- **FORBIDDEN**: Translating "stay" as lodging/hotel stay (ವಾಸ್ತವ್ಯ). Must strictly be **ನ್ಯಾಯಾಲಯದ ತಡೆಯಾಜ್ಞೆ (Judicial Stay Order)**.

#### 4. ADVISORY STRUCTURE:
Structure your response in fluent Kannada with clear Markdown formatting:
- **ಕಾರ್ಯನಿರ್ವಾಹಕ ಸಾರಾಂಶ (Executive Summary)**
- **ಶಾಸನಬದ್ಧ ಕಾನೂನು ಚೌಕಟ್ಟು (Governing Legal Framework & Sections)**
- **ನ್ಯಾಯಾಂಗ ತೀರ್ಪುಗಳು ಮತ್ತು ಪೂರ್ವನಿದರ್ಶನಗಳು (Judicial Precedents)**
- **ಹಕ್ಕುಗಳು, ಪರಿಹಾರಗಳು ಮತ್ತು ಬಡ್ಡಿ ಲೆಕ್ಕಾಚಾರ (Rights, Remedies & Calculations)**
- **ಕ್ರಮಬದ್ಧ ದೂರು ಸಲ್ಲಿಕೆ ವಿಧಾನ (Step-by-Step Filing Procedure - Form M / Form N)**
- **ಕಾನೂನು ಸಲಹಾ ಸೂಚನೆ (Statutory Advisory Disclaimer)**`;
  }

  if (selectedLang === 'hi-IN' || selectedLang === 'hi') {
    return `
### MANDATORY STATUTORY REAL ESTATE LEXICON DIRECTIVE (HINDI - RERA):
The user has requested the advisory response strictly in **HINDI (हिन्दी)**.
You MUST formulate and synthesize the ENTIRE advisory response in formal, authoritative **statutory legal Hindi (राजभाषा/विधिक शब्दावली)** conforming to the official vocabulary of the **Real Estate (Regulation and Development) Act, 2016** and the **Karnataka Real Estate Rules, 2017**.

#### 1. MANDATORY STATUTORY VERNACULAR TERMINOLOGY:
You must strictly use the following statutory translations:
- **Promoter** -> **प्रवर्तक (Promoter)**
- **Allottee / Homebuyer** -> **आवंटी (Allottee)**
- **Occupancy Certificate (OC)** -> **अधिभोग प्रमाण पत्र (Occupancy Certificate - OC)**
- **Completion Certificate (CC)** -> **पूर्णता प्रमाण पत्र (Completion Certificate - CC)**
- **Encumbrance Certificate (EC)** -> **भार प्रमाणपत्र (Encumbrance Certificate - EC)**
- **Original Suit (Title Litigation)** -> **मूल वाद (Original Suit - O.S.)**
- **Ad-interim Injunction** -> **अंतरिम व्यादेश / स्थगन आदेश (Interim Injunction)**
- **Conveyance Deed / Sale Deed** -> **विक्रय विलेख / हस्तांतरण विलेख (Sale Deed / Conveyance Deed)**
- **Delay Interest / Compensation** -> **विलंब मुआवजा और ब्याज (Section 18 Delay Compensation)**
- **Adjudicating Officer** -> **न्यायनिर्णायक अधिकारी (Adjudicating Officer - Form N)**
- **Authority** -> **रियल एस्टेट विनियामक प्राधिकरण (K-RERA Authority)**
- **Appellate Tribunal** -> **रियल एस्टेट अपीलीय अधिकरण (REAT)**
- **70% Escrow Account** -> **अलग एस्क्रो बैंक खाता (Section 4(2)(l)(D))**
- **Physical Possession / Handover** -> **भौतिक कब्ज़ा / आधिपत्य (Physical Possession / Handover)**
- **Stay Order / Interim Injunction** -> **स्थगन आदेश (Stay Order / Interim Injunction)**
- **Vacant Plot / Revenue Land** -> **खाली भूखंड / राजस्व भूमि (Vacant Plot / Revenue Land)**

#### 2. BILINGUAL PARENTHETICAL ANCHORING (MANDATORY):
Statutory forms, specific sections, and statutory financial rate formulas MUST retain their exact alphanumeric citations in parentheses next to the Hindi translation to eliminate ambiguity for legal filings:
- **Statutory Forms**: फॉर्म एम (Form M), फॉर्म एन (Form N), फॉर्म बी (Form B), फॉर्म एफ (Form F).
- **Statutory Sections**: धारा 18 (Section 18), धारा 14(3) (Section 14(3)), धारा 4(2)(l)(D) (Section 4(2)(l)(D)), धारा 31 (Section 31), धारा 71 (Section 71).
- **Statutory Formulas**: एस.बी.आई. उच्चतम एम.सी.एल.आर + 2.00% (SBI Highest MCLR + 2.00%).
- **Project Identifiers & Precedents**: Keep exact PRM numbers, CMP numbers, and case law titles (e.g., *M/s Newtech Promoters & Developers v. State of UP*) in clear Latin alphanumeric format alongside Hindi text.

#### 3. STRICT ANTI-COLLOQUIAL TRANSLATION RULES (ZERO-TOLERANCE):
Colloquial machine translation errors are strictly forbidden:
- **FORBIDDEN**: Translating "suit" as clothing/garment (पोशाक, वस्त्र, सूट कपड़ा). Must strictly be **मूल वाद (Original Suit - O.S.) / मुकदमा**.
- **FORBIDDEN**: Translating "promoter" as marketing/event promoter (प्रचारक, इवेंट प्रमोटर). Must strictly be **प्रवर्तक (Promoter / Real Estate Developer)**.
- **FORBIDDEN**: Translating "possession" as paranormal possession (भूत-प्रेत का साया). Must strictly be **भौतिक कब्ज़ा / आधिपत्य (Physical Possession / Handover)**.
- **FORBIDDEN**: Translating "execution" as death penalty/hanging (फांसी, मृत्युदंड). In legal execution of orders, it must strictly be **डिक्री का निष्पादन / आदेश का क्रियान्वयन (Execution of Decree / Order)**.
- **FORBIDDEN**: Translating "plot" as conspiracy/scheme (साजिश, षड्यंत्र). Must strictly be **भूखंड / ज़मीन (Plot / Land Parcel)**.
- **FORBIDDEN**: Translating "stay" as lodging/temporary living (ठहरना, निवास). Must strictly be **न्यायिक स्थगन आदेश (Judicial Stay Order)**.

#### 4. ADVISORY STRUCTURE:
Structure your response in fluent Hindi with clear Markdown formatting:
- **कार्यकारी सारांश (Executive Summary)**
- **शासी कानूनी ढांचा (Governing Statutory Framework & Sections)**
- **न्यायिक दृष्टांत एवं मिसालें (Judicial Precedents)**
- **अधिकार, उपचार एवं ब्याज गणना (Rights, Remedies & Calculations)**
- **चरणबद्ध शिकायत निवारण प्रक्रिया (Step-by-Step Filing Procedure - Form M / Form N)**
- **वैधानिक कानूनी अस्वीकरण (Statutory Legal Disclaimer)**`;
  }

  // Default English advisory directive
  return `
### STATUTORY REAL ESTATE LEGAL SYNTHESIS DIRECTIVE:
You are synthesizing an authoritative legal due diligence advisory for Karnataka Real Estate.
Ground all reasoning in the Real Estate (Regulation and Development) Act 2016 and Karnataka Real Estate Rules 2017.
Adhere strictly to standard statutory terminology:
- Distinguish Promoter (Developer) from Allottee (Buyer).
- Distinguish Form M (before the Authority under Section 31 for possession, interest, refund) from Form N (before the Adjudicating Officer under Section 71 for compensation).
- Differentiate between Civil Court Litigations (Original Suits - O.S., Injunctions, Partition Suits) and K-RERA regulatory complaints.
- Ensure all statutory alphanumeric citations (Section 18, Section 14(3), SBI MCLR + 2%, PRM numbers) are rendered verbatim.`;
}
