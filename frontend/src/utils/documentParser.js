import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure pdfjs worker: Vite can bundle pdf.worker.min.mjs directly via URL import
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  // Fallback to unpkg CDN if worker URL resolution fails
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Extract plain text from a PDF ArrayBuffer while accurately preserving
 * lines, headings, paragraphs, and list layouts.
 */
export async function extractTextFromPdf(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true
  });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    let lastY = null;
    let pageText = '';

    for (const item of content.items) {
      if (!item.str && !item.hasEOL) continue;

      const currentY = item.transform ? item.transform[5] : null;

      // Vertical displacement indicates a new line or paragraph break
      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
        if (!pageText.endsWith('\n')) {
          pageText += '\n';
        }
      } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ') && item.str) {
        pageText += ' ';
      }

      if (item.str) {
        pageText += item.str;
      }

      if (item.hasEOL) {
        if (!pageText.endsWith('\n')) {
          pageText += '\n';
        }
      }

      lastY = currentY;
    }

    fullText += pageText.trim() + '\n\n';
  }

  return fullText.trim();
}

/**
 * Extract plain text from a Word DOCX ArrayBuffer
 */
export async function extractTextFromDocx(arrayBuffer) {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || '').trim();
}

/**
 * Universal client-side resume extractor.
 * Converts PDF, DOCX, and TXT files directly to pure plain text in the browser.
 * Reduces 186KB - 5MB documents to 2KB - 8KB text payloads for instant,
 * reliable serverless processing without hanging or cellular timeouts.
 */
export async function extractTextFromFile(file) {
  const name = (file.name || '').toLowerCase();

  // 1. Plain text files
  if (name.endsWith('.txt')) {
    return await file.text();
  }

  const arrayBuffer = await file.arrayBuffer();

  // 2. Check for PDF extension or magic bytes
  const uint8 = new Uint8Array(arrayBuffer.slice(0, 4));
  const isPdf = name.endsWith('.pdf') || (uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46);

  if (isPdf) {
    try {
      const text = await extractTextFromPdf(arrayBuffer);
      if (text && text.length > 20) {
        return text;
      }
    } catch (pdfErr) {
      console.warn('Client-side PDF extraction failed, falling back:', pdfErr);
    }
  }

  // 3. Check for Word DOCX
  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    try {
      const text = await extractTextFromDocx(arrayBuffer);
      if (text && text.length > 20) {
        return text;
      }
    } catch (docxErr) {
      console.warn('Client-side DOCX extraction failed, falling back:', docxErr);
    }
  }

  // 4. Fallback: try raw text reading
  try {
    const raw = await file.text();
    if (raw && raw.length > 20) {
      return raw;
    }
  } catch {}

  throw new Error('Unable to extract readable text from this document. Please ensure the file is a text-based PDF, DOCX, or TXT file.');
}

/**
 * Validate whether the extracted document text represents a genuine resume/CV.
 * Returns { isValid: boolean, reason?: string }
 */
export function validateIsResume(text) {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      reason: 'The uploaded file contains no readable text. Please upload a valid PDF, DOCX, or text file.'
    };
  }

  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 25 || clean.length < 120) {
    return {
      isValid: false,
      reason: 'The uploaded document contains too little text to be a resume. Please upload a complete resume or CV.'
    };
  }

  const lower = clean.toLowerCase();
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // =========================================================================
  // 1. SPECIFIC NON-RESUME DOCUMENT DISQUALIFIERS (Checked first)
  // =========================================================================

  // A. Job Descriptions / Vacancy Announcements
  const jdPatterns = [
    /\b(?:job|position|role)\s+description\b/,
    /\b(?:about\s+the|position|role)\s+overview\b/,
    /\bwe\s+are\s+(?:looking\s+for|seeking|hiring)\b/,
    /\bwhat\s+you(?:'ll|\s+will)\s+do\b/,
    /\bwhat\s+we(?:'re|\s+are)?\s+offer(?:ing)?\b/,
    /\bkey\s+responsibilities\s*:/,
    /\b(?:minimum|preferred|basic)\s+qualifications\s*:/,
    /\bresponsibilities\s*:\s*/,
    /\brequirements\s*:\s*/,
    /\bequal\s+opportunity\s+employer\b/,
    /\bhow\s+to\s+apply\b/,
    /\bapply\s+(?:for\s+this\s+job|now\b|at\s+https?:)/,
    /\bsubmit\s+your\s+application\b/,
    /\bsalary\s+range\s*:\s*[$£€₹]?/,
    /\bthe\s+ideal\s+candidate\s+will\b/,
    /\breporting\s+to\s+the\b/,
    /\bcompensation\s+(?:&|and)\s+benefits\b/
  ];
  const jdScore = jdPatterns.reduce((acc, p) => acc + (p.test(lower) ? 1 : 0), 0);
  if ((/\b(?:job\s+description|about\s+the\s+role|equal\s+opportunity\s+employer|how\s+to\s+apply|we\s+are\s+hiring|what\s+you'll\s+do)\b/.test(lower) && jdScore >= 2) || jdScore >= 3) {
    return {
      isValid: false,
      reason: 'This document appears to be a job description or vacancy posting, not a candidate resume.'
    };
  }

  // B. Offer Letters & Employment Agreements
  const offerPatterns = [
    /\boffer\s+of\s+employment\b/,
    /\bwe\s+are\s+pleased\s+to\s+offer\s+you\b/,
    /\bwe\s+are\s+excited\s+to\s+offer\s+you\b/,
    /\bformal\s+offer\b/,
    /\bemployment\s+agreement\b/,
    /\bacceptance\s+of\s+offer\b/,
    /\bterms\s+of\s+employment\b/,
    /\bappointment\s+letter\b/,
    /\bbase\s+salary\s+of\b/,
    /\bannual\s+base\s+salary\b/,
    /\bstarting\s+salary\s+of\b/,
    /\bstart\s+date\s+will\s+be\b/,
    /\bofficial\s+start\s+date\b/,
    /\bplease\s+sign\s+and\s+return\b/,
    /\bcontingent\s+upon\s+(?:a\s+)?background\s+check\b/,
    /\bat-will\s+employment\b/
  ];
  const offerScore = offerPatterns.reduce((acc, p) => acc + (p.test(lower) ? 1 : 0), 0);
  if ((/\b(?:offer\s+of\s+employment|we\s+are\s+pleased\s+to\s+offer|employment\s+agreement|formal\s+offer|appointment\s+letter)\b/.test(lower) && offerScore >= 1) || offerScore >= 2) {
    return {
      isValid: false,
      reason: 'This document appears to be an employment offer letter or contract, not a candidate resume.'
    };
  }

  // C. Letters of Recommendation (LOR) & References
  const lorPatterns = [
    /\bletter\s+of\s+recommendation\b/,
    /\brecommendation\s+letter\b/,
    /\bto\s+whom\s+it\s+may\s+concern\b/,
    /\bi\s+am\s+(?:writing|pleased)\s+to\s+recommend\b/,
    /\bi\s+(?:wholeheartedly|strongly|highly)\s+recommend\b/,
    /\bit\s+is\s+(?:with\s+great\s+pleasure|my\s+pleasure)\s+to\s+recommend\b/,
    /\bletter\s+of\s+reference\b/,
    /\brecommend\s+[a-z\s]+\s+for\s+(?:admission|the\s+position)\b/
  ];
  const lorScore = lorPatterns.reduce((acc, p) => acc + (p.test(lower) ? 1 : 0), 0);
  if (lorScore >= 1 && (/\b(?:to\s+whom\s+it\s+may\s+concern|letter\s+of\s+recommendation|recommendation\s+letter)\b/.test(lower) || lorScore >= 2)) {
    return {
      isValid: false,
      reason: 'This document appears to be a letter of recommendation or reference letter, not a candidate resume.'
    };
  }

  // D. Certificates, Diplomas & Course Credentials
  const certPatterns = [
    /\bcertificate\s+of\s+(?:completion|achievement|participation|appreciation|attendance|excellence)\b/,
    /\bthis\s+is\s+to\s+certify\s+that\b/,
    /\bthis\s+certificate\s+is\s+(?:proudly\s+)?awarded\s+to\b/,
    /\bhereby\s+certifies\s+that\b/,
    /\bhas\s+successfully\s+completed\s+(?:the\s+)?(?:course|program|training|specialization)\b/,
    /\bhas\s+demonstrated\s+proficiency\s+in\b/,
    /\bcertificate\s+id\s*:\s*[a-z0-9_-]+/,
    /\bcredential\s+id\s*:\s*[a-z0-9_-]+/,
    /\bverify\s+at\s*:\s*https?:\/\//
  ];
  const certScore = certPatterns.reduce((acc, p) => acc + (p.test(lower) ? 1 : 0), 0);
  if (certScore >= 1 && (/\b(?:certificate\s+of\s+(?:completion|achievement|participation)|this\s+is\s+to\s+certify\s+that|hereby\s+certifies\s+that|has\s+successfully\s+completed)\b/.test(lower) || certScore >= 2)) {
    return {
      isValid: false,
      reason: 'This document appears to be a course certificate or credential award, not a complete resume.'
    };
  }

  // E. Invoices, Receipts & Financial Documents
  const invoicePatterns = [
    /\b(?:tax\s+)?invoice\s*#?\s*[a-z0-9_-]+/,
    /\b(?:amount|total|balance)\s+due\s*:\s*[$£€₹]?/,
    /\b(?:subtotal|total\s+amount)\s*:\s*[$£€₹]?/,
    /\bbill\s+to\s*:/,
    /\bship\s+to\s*:/,
    /\bpayment\s+(?:terms|due\s+date|method)\s*:/,
    /\bremit\s+(?:payment\s+)?to\b/,
    /\bpurchase\s+order\s*#?\s*[a-z0-9_-]+/,
    /\bstatement\s+of\s+account\b/,
    /\bopening\s+balance\b/
  ];
  const invoiceScore = invoicePatterns.reduce((acc, p) => acc + (p.test(lower) ? 1 : 0), 0);
  if (invoiceScore >= 2) {
    return {
      isValid: false,
      reason: 'This document appears to be an invoice, billing receipt, or financial statement, not a resume.'
    };
  }

  // F. Legal Contracts, Policies & Terms of Service
  const legalPatterns = [
    /\bterms\s+of\s+(?:service|use)\b/,
    /\bprivacy\s+policy\b/,
    /\bend\s+user\s+license\s+agreement\b/,
    /\bnon-disclosure\s+agreement\b/,
    /\barbitration\s+clause\b/,
    /\bgoverning\s+law\b/,
    /\bindemnif(?:y|ification|ities)\b/,
    /\bintellectual\s+property\s+rights\b/,
    /\bin\s+witness\s+whereof\b/
  ];
  const legalScore = legalPatterns.reduce((acc, p) => acc + (p.test(lower) ? 1 : 0), 0);
  if (legalScore >= 2) {
    return {
      isValid: false,
      reason: 'This document appears to be a legal terms, policy, or agreement document, not a resume.'
    };
  }

  // G. Court Judgments, Rulings & Judicial Petitions
  const courtPatterns = [
    /\b(?:in\s+the\s+supreme\s+court|in\s+the\s+high\s+court|in\s+the\s+district\s+court)\b/,
    /\b(?:civil|criminal)\s+appellate\s+jurisdiction\b/,
    /\bspecial\s+leave\s+petition\b/,
    /\b(?:civil|criminal)\s+appeal\s+no\b/,
    /\bwrit\s+petition\s*(?:\([a-z]+\))?\s*no\b/,
    /\b(?:appellant|respondent|petitioner)\s*\(s\)/,
    /\bj\s*u\s*d\s*g\s*m\s*e\s*n\s*t\b/,
    /\bleave\s+granted\b/,
    /\bimpugned\s+(?:judgment|order)\b/,
    /\blearned\s+(?:senior\s+)?(?:advocate|counsel)\b/,
    /\binterlocutory\s+application\b/,
    /\bquashed\s+and\s+set\s+aside\b/
  ];
  const courtScore = courtPatterns.reduce((acc, p) => acc + (p.test(lower) ? 1 : 0), 0);
  if (courtScore >= 2) {
    return {
      isValid: false,
      reason: 'This document appears to be a court judgment, legal ruling, or judicial petition, not a candidate resume.'
    };
  }

  // H. Academic Syllabi, Assignments & Lab Reports
  const academicCoursePatterns = [
    /\bcourse\s+syllabus\b/,
    /\bsyllabus\s+for\b/,
    /\bgrading\s+policy\b/,
    /\boffice\s+hours\s*:\s*/,
    /\bprerequisites\s*:\s*/,
    /\blab\s+report\s*:\s*/,
    /\bassignment\s*#\s*\d+/,
    /\bhomework\s*#\s*\d+/,
    /\bproblem\s+set\s*#?\s*\d+/,
    /\blecture\s+notes\b/,
    /\bteaching\s+assistant\s*:\s*/
  ];
  const academicCourseScore = academicCoursePatterns.reduce((acc, p) => acc + (p.test(lower) ? 1 : 0), 0);
  if (academicCourseScore >= 2) {
    return {
      isValid: false,
      reason: 'This document appears to be an academic course syllabus or assignment, not a candidate resume.'
    };
  }

  // H. Research Papers & Journal Articles
  const researchPaperPatterns = [
    /\babstract\s*:\s*\n/,
    /\bdoi\s*:\s*10\.\d{4,9}\//,
    /\bliterature\s+review\b/,
    /\bproceedings\s+of\s+the\b/,
    /\bconcluding\s+remarks\b/,
    /\bmaterials\s+and\s+methods\b/,
    /\bresults\s+and\s+discussion\b/
  ];
  const researchPaperScore = researchPaperPatterns.reduce((acc, p) => acc + (p.test(lower) ? 1 : 0), 0);
  if (researchPaperScore >= 2) {
    return {
      isValid: false,
      reason: 'This document appears to be an academic research paper or journal publication, not a candidate resume.'
    };
  }

  // =========================================================================
  // 2. POSITIVE RESUME STRUCTURE EVALUATION
  // =========================================================================

  const expPattern = /^(?:(?:\d+[\.\)]\s*)?(?:professional\s+|work\s+|career\s+|relevant\s+|industry\s+)?(?:experience|employment|work\s+history|internships?)|internship\s+experience)\s*[:]?$/i;
  const eduPattern = /^(?:(?:\d+[\.\)]\s*)?(?:academic\s+|educational\s+)?(?:education|qualifications|academic\s+background|academics))\s*[:]?$/i;
  const skillsPattern = /^(?:(?:\d+[\.\)]\s*)?(?:technical\s+|core\s+|professional\s+|key\s+)?(?:skills|competencies|technologies|tech\s+stack|tools\s*(?:&|and)\s*technologies|areas\s+of\s+expertise))\s*[:]?$/i;
  const projsPattern = /^(?:(?:\d+[\.\)]\s*)?(?:key\s+|personal\s+|academic\s+|technical\s+)?(?:projects|portfolio))\s*[:]?$/i;
  const sumPattern = /^(?:(?:\d+[\.\)]\s*)?(?:professional\s+|career\s+|executive\s+)?(?:summary|profile|objective|about\s+me))\s*[:]?$/i;
  const certPattern = /^(?:(?:\d+[\.\)]\s*)?(?:licenses\s*(?:&|and)\s*)?(?:certifications?|credentials|achievements?|awards))\s*[:]?$/i;

  let hasExp = false;
  let hasEdu = false;
  let hasSkills = false;
  let hasProj = false;
  let hasSum = false;
  let hasCert = false;

  for (const line of lines) {
    const cleanedLine = line.replace(/^[#*_\-\s]+|[#*_\-\s]+$/g, '');
    if (!cleanedLine || cleanedLine.length > 55) continue;

    if (expPattern.test(cleanedLine)) hasExp = true;
    else if (eduPattern.test(cleanedLine)) hasEdu = true;
    else if (skillsPattern.test(cleanedLine)) hasSkills = true;
    else if (projsPattern.test(cleanedLine)) hasProj = true;
    else if (sumPattern.test(cleanedLine)) hasSum = true;
    else if (certPattern.test(cleanedLine)) hasCert = true;
  }

  // Also support inline section starts like 'Skills: Python, React...' or 'Education: B.S...'
  for (const line of lines) {
    if (/^(?:technical\s+)?skills\s*:\s*[a-zA-Z]/i.test(line)) hasSkills = true;
    if (/^(?:education|degree)\s*:\s*[a-zA-Z]/i.test(line)) hasEdu = true;
    if (/^(?:experience|work\s+history)\s*:\s*[a-zA-Z]/i.test(line)) hasExp = true;
  }

  const sectionCount = [hasExp, hasEdu, hasSkills, hasProj, hasSum, hasCert].filter(Boolean).length;

  // Candidate contact signals
  const hasEmail = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.test(clean);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/.test(clean);
  const hasProfile = /linkedin\.com\/in\/|github\.com\/|gitlab\.com\//.test(lower);
  const contactCount = [hasEmail, hasPhone, hasProfile].filter(Boolean).length;

  // Career timeline & credentials
  const hasDateRange = /\b(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|present|current)\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}|present|current)\b/.test(lower);
  const hasDegree = /\b(bachelor|master|b\.?tech|m\.?tech|b\.?e\b|m\.?e\b|b\.?s\b|m\.?s\b|bca|mca|ph\.?d|diploma|degree\s+in|university|college|institute|cgpa|gpa)\b/.test(lower);
  const hasRoles = /\b(software\s+engineer|web\s+developer|developer|engineer|full\s*stack|backend|frontend|data\s+scientist|product\s+manager|devops|cloud\s+architect|intern)\b/.test(lower);

  const careerScore = [hasDateRange, hasDegree, hasRoles].filter(Boolean).length;

  // Standard resumes: 2+ standard section headers
  if (sectionCount >= 2) {
    return { isValid: true };
  }

  // Resumes with 1 explicit section header + contact details or career timeline
  if (sectionCount >= 1 && (contactCount >= 1 || careerScore >= 2)) {
    return { isValid: true };
  }

  // Compact / single-column resumes without header styling but clear contact and timeline signals
  if (contactCount >= 2 && careerScore >= 2) {
    return { isValid: true };
  }

  return {
    isValid: false,
    reason: 'This document does not appear to be a resume. It is missing standard resume sections such as work experience, education, or professional skills.'
  };
}

