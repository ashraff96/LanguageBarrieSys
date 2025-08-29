const fs = require('fs');
const path = require('path');
const https = require('https');

// First try to copy from node_modules, if that fails, download from CDN
const PDFJS_VERSION = '3.11.174';
const LOCAL_WORKER_PATH = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');
const WORKER_DEST = path.join(__dirname, '..', 'public', 'pdfjs', 'pdf.worker.min.js');

// Create pdfjs directory if it doesn't exist
const pdfJsDir = path.dirname(WORKER_DEST);
if (!fs.existsSync(pdfJsDir)) {
  fs.mkdirSync(pdfJsDir, { recursive: true });
}

// Try to copy from local node_modules first
if (fs.existsSync(LOCAL_WORKER_PATH)) {
  try {
    fs.copyFileSync(LOCAL_WORKER_PATH, WORKER_DEST);
    console.log('PDF.js worker file copied from node_modules successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error copying from node_modules:', err);
    downloadWorkerFile();
  }
} else {
  console.log('Worker file not found in node_modules, downloading from CDN...');
  downloadWorkerFile();
}

function downloadWorkerFile() {
  https.get(WORKER_URL, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download worker file: ${response.statusCode} ${response.statusMessage}`);
      process.exit(1);
      return;
    }

    const file = fs.createWriteStream(WORKER_DEST);
    response.pipe(file);

    file.on('finish', () => {
      file.close();
      console.log('PDF.js worker file downloaded successfully');
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('Error downloading worker file:', err.message);
    try {
      fs.unlinkSync(WORKER_DEST);
    } catch {}
    process.exit(1);
  });
}
