const Tesseract = require('tesseract.js');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractFromPDF(buffer) {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

async function extractFromImage(buffer, mimeType) {
  try {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
      logger: () => {},
    });
    return text.trim();
  } catch (error) {
    throw new Error(`Image OCR failed: ${error.message}`);
  }
}

async function extractText(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    return await extractFromPDF(buffer);
  }
  return await extractFromImage(buffer, mimeType);
}

module.exports = { extractText };
