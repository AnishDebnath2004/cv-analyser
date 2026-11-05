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

