import type { FileImportInput } from './normalization.js';

// Lab results are commonly delivered as PDFs. We extract text from the PDF at the
// import boundary, then feed it through the same free-text lab parser used for
// pasted results. Extraction uses unpdf (a pure-JS, serverless-friendly pdf.js
// build) so there is no native dependency to install on the host.

export function looksLikePdf(input: Pick<FileImportInput, 'content_type' | 'filename'>, payload: Buffer): boolean {
  const contentType = input.content_type?.toLowerCase() ?? '';
  const filename = input.filename?.toLowerCase() ?? '';
  if (contentType.includes('pdf') || filename.endsWith('.pdf')) return true;
  return payload.length >= 5 && payload.subarray(0, 5).toString('latin1') === '%PDF-';
}

// Bound extraction work so a crafted PDF can't drive expensive parsing beyond
// the request body limit: cap pages and wall-clock time.
const MAX_PDF_PAGES = 100;
const PDF_EXTRACT_TIMEOUT_MS = 15_000;

export async function extractPdfText(payload: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(payload));
  const pageCount = (pdf as { numPages?: number }).numPages;
  if (typeof pageCount === 'number' && pageCount > MAX_PDF_PAGES) {
    throw new Error(`PDF has ${pageCount} pages; the ${MAX_PDF_PAGES}-page limit keeps extraction bounded.`);
  }
  const { text } = await withTimeout(
    extractText(pdf, { mergePages: true }),
    PDF_EXTRACT_TIMEOUT_MS,
    'PDF text extraction timed out.',
  );
  if (Array.isArray(text)) return text.join('\n');
  return typeof text === 'string' ? text : '';
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => reject(new Error(message)), ms);
      (timer as { unref?: () => void }).unref?.();
    }),
  ]);
}

export interface ImportTextResult {
  text: string;
  is_pdf: boolean;
  extraction_failed: boolean;
}

// Decode an uploaded payload to text: extract from PDF when the upload is a PDF,
// otherwise decode as UTF-8. Extraction failures degrade to empty text (so an
// upload never 500s on a malformed PDF) but are reported so the caller can warn
// instead of recording a silent zero-reading success.
export async function extractImportText(input: Pick<FileImportInput, 'content_type' | 'filename'>, payload: Buffer): Promise<ImportTextResult> {
  if (looksLikePdf(input, payload)) {
    try {
      return { text: await extractPdfText(payload), is_pdf: true, extraction_failed: false };
    } catch {
      return { text: '', is_pdf: true, extraction_failed: true };
    }
  }
  return { text: payload.toString('utf8'), is_pdf: false, extraction_failed: false };
}
