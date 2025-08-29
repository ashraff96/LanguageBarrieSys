import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up paths
const sourceDir = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build');
const destDir = path.join(__dirname, '..', 'public', 'pdfjs');
const workerSource = path.join(sourceDir, 'pdf.worker.min.js');
const workerDest = path.join(destDir, 'pdf.worker.min.js');

// Create pdfjs directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy worker file
try {
  fs.copyFileSync(workerSource, workerDest);
  console.log('PDF.js worker file copied successfully');
  process.exit(0);
} catch (error) {
  console.error('Error copying PDF.js worker file:', error);
  process.exit(1);
}
