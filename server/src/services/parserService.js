 const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const officeParser = require('officeparser');

async function parseFile(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  if (mimeType === 'application/pdf' || ext === '.pdf') {
    return await parsePDF(filePath);
  }

  if (
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    ext === '.ppt' ||
    ext === '.pptx'
  ) {
    return await parsePPT(filePath);
  }

  if (mimeType === 'text/plain' || ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

async function parsePDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function parsePPT(filePath) {
  return new Promise((resolve, reject) => {
    officeParser.parseOffice(filePath, (text, err) => {
      if (err) return reject(err);
      resolve(text);
    });
  });
}

module.exports = { parseFile };
