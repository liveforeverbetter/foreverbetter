import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractImportText, looksLikePdf } from '../src/core/pdf.js';
import { buildSourceReference, normalizeImportedFile } from '../src/core/normalization.js';
import { runHealthAnalysis } from '../src/core/analysis.js';

// Build a minimal single-page PDF with lab text and correct xref offsets so
// pdf.js (via unpdf) can parse it - no PDF fixture file or generator dep needed.
function buildLabPdf(lines: string[]): Buffer {
  const content = 'BT /F1 12 Tf 72 740 Td ' + lines.map((line, i) => `${i === 0 ? '' : '0 -18 Td '}(${line}) Tj`).join(' ') + ' ET';
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach(off => { pdf += `${String(off).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

test('detects PDFs by content type, filename, and byte signature', () => {
  const pdf = buildLabPdf(['ApoB 100 mg/dL']);
  assert.equal(looksLikePdf({ content_type: 'application/pdf' }, Buffer.from('x')), true);
  assert.equal(looksLikePdf({ filename: 'report.PDF' }, Buffer.from('x')), true);
  assert.equal(looksLikePdf({}, pdf), true);
  assert.equal(looksLikePdf({ content_type: 'text/csv' }, Buffer.from('a,b')), false);
});

test('extracts multiple biomarkers with correct units from a lab PDF', async () => {
  const pdf = buildLabPdf([
    'Lab Report',
    'ApoB 105 mg/dL',
    'Total cholesterol 5.2 mmol/L',
    'HDL cholesterol 60 mg/dL',
    'HbA1c 38 mmol/mol',
  ]);
  const input = { content_type: 'application/pdf', filename: 'lab.pdf' };
  const extracted = await extractImportText(input, pdf);
  assert.equal(extracted.is_pdf, true);
  assert.equal(extracted.extraction_failed, false);
  const text = extracted.text;
  assert.match(text, /ApoB 105/);

  const source = buildSourceReference({ user_id: 'u1', organization_id: 'o1', category: 'biomarkers', filename: 'lab.pdf', content_type: 'application/pdf', text }, pdf);
  const observations = normalizeImportedFile(source, text);
  const ids = observations.map(o => o.name).sort();
  // All four markers extracted (not just one), and HDL/total cholesterol not conflated.
  assert.ok(ids.includes('apob'));
  assert.ok(ids.includes('total_cholesterol'));
  assert.ok(ids.includes('hdl_c'));
  assert.ok(ids.includes('hba1c'));

  const analysis = runHealthAnalysis('u1', [source], observations, undefined, 'o1');
  const byId = Object.fromEntries(analysis.derived_interpretations.map(d => [d.raw && typeof d.raw === 'object' && 'id' in d.raw ? (d.raw as { id: string }).id : d.title, d]));
  // Total cholesterol 5.2 mmol/L converts to ~201 mg/dL - must not read as optimal.
  const totalChol = analysis.derived_interpretations.find(d => (d.raw as { id?: string })?.id === 'total_cholesterol');
  assert.ok(totalChol);
  assert.equal((totalChol!.raw as { converted_from?: string }).converted_from, 'mmol/L');
  assert.notEqual(totalChol!.status, 'optimal');
  void byId;
});
