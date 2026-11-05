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

  // Negative indicators
  const invoiceMatches = (lower.match(/\b(invoice|inv-\d+|amount\s+due|subtotal|balance\s+due|bill\s+to|ship\s+to|unit\s+price|payment\s+terms|payment\s+method|purchase\s+order|tax\s+rate|remit\s+to|qty\b)\b/g) || []).length;
  const legalMatches = (lower.match(/\b(terms\s+of\s+(?:service|use)|privacy\s+policy|end\s+user\s+license|arbitration\s+clause|governing\s+law|indemnif(?:y|ication)|herein\b|whereas\b|witnesseth)\b/g) || []).length;
  const bankMatches = (lower.match(/\b(statement\s+of\s+account|account\s+statement|opening\s+balance|closing\s+balance|withdrawal\b|interest\s+earned|transaction\s+history|available\s+balance)\b/g) || []).length;
  const recipeMatches = (lower.match(/\b(ingredients\s*:|prep\s+time|cook\s+time|preheat\s+oven|tablespoon|teaspoon|cups?\s+of)\b/g) || []).length;
  const academicMatches = (lower.match(/\b(abstract\s*:\s*|table\s+of\s+contents|literature\s+review|doi\s*:\s*10\.\d+|proceedings\s+of\s+the)\b/g) || []).length;

  // Positive resume section headers
  let sectionHeaders = 0;
  if (/\b(experience|work\s+experience|employment\s+history|work\s+history|professional\s+experience|career\s+history|internships?)\b/.test(lower)) sectionHeaders++;
  if (/\b(education|academic\s+background|qualifications|academics|educational\s+qualifications?)\b/.test(lower)) sectionHeaders++;
  if (/\b(skills|technical\s+skills|core\s+competencies|competencies|tech\s+stack|technologies|tools\s*(&|and)\s*technologies|key\s+skills|areas\s+of\s+expertise)\b/.test(lower)) sectionHeaders++;
  if (/\b(projects|key\s+projects|personal\s+projects|academic\s+projects|portfolio)\b/.test(lower)) sectionHeaders++;
  if (/\b(professional\s+summary|summary|profile|about\s+me|career\s+objective|objective|executive\s+summary)\b/.test(lower)) sectionHeaders++;
  if (/\b(certifications?|licenses?|credentials|awards?|achievements?|publications?)\b/.test(lower)) sectionHeaders++;

  // Contact signals
  let contactSignals = 0;
  if (/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.test(clean)) contactSignals++;
  if (/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/.test(clean)) contactSignals++;
  if (/linkedin\.com|github\.com|gitlab\.com/.test(lower)) contactSignals++;

  // Career indicators
  const hasDateRanges = /\b(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|present|current)\b/.test(lower);
  const hasDegree = /\b(bachelor|master|b\.?tech|m\.?tech|b\.?e\b|m\.?e\b|b\.?s\b|m\.?s\b|bca|mca|ph\.?d|diploma|degree\s+in|university|college|institute|cgpa|gpa)\b/.test(lower);
  const roleMatches = (lower.match(/\b(developer|engineer|manager|analyst|consultant|architect|designer|intern|specialist|lead|administrator|director|coordinator|assistant|officer|programmer)\b/g) || []).length;

  // Check negative overrides
  if (invoiceMatches >= 3 && sectionHeaders < 2) {
    return { isValid: false, reason: 'This document appears to be an invoice or billing receipt, not a resume.' };
  }
  if (legalMatches >= 2 && sectionHeaders < 2) {
    return { isValid: false, reason: 'This document appears to be a legal contract or policy document, not a resume.' };
  }
  if (bankMatches >= 2 && sectionHeaders < 2) {
    return { isValid: false, reason: 'This document appears to be a financial or bank statement, not a resume.' };
  }
  if (recipeMatches >= 2 && sectionHeaders < 2) {
    return { isValid: false, reason: 'This document appears to be a recipe or cooking instructions, not a resume.' };
  }
  if (academicMatches >= 2 && sectionHeaders < 2 && contactSignals === 0) {
    return { isValid: false, reason: 'This document appears to be an academic paper or publication, not a resume.' };
  }

  const careerSignals = (hasDateRanges ? 1 : 0) + (hasDegree ? 1 : 0) + (roleMatches >= 1 ? 1 : 0);

  if (sectionHeaders >= 2) return { isValid: true };
  if (sectionHeaders >= 1 && (careerSignals >= 1 || contactSignals >= 1)) return { isValid: true };
  if (contactSignals >= 2 && careerSignals >= 2) return { isValid: true };

  return {
    isValid: false,
    reason: 'This document does not appear to be a resume. It is missing standard resume sections such as work experience, education, or professional skills.'
  };
}

