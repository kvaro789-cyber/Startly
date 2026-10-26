import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Tentukan lokasi folder public dengan aman, termasuk saat memakai ES Modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDirectory = path.join(__dirname, 'public');

// express.static menyajikan semua file di dalam folder public.
app.use(express.static(publicDirectory));

const server = app.listen(PORT, () => {
  console.log(`Startly berjalan di http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} sedang dipakai. Coba jalankan dengan port lain:`);
    console.error(`PORT=3001 npm start`);
    process.exit(1);
  }

  throw error;
});
