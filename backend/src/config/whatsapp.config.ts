import { registerAs } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

export default registerAs('whatsapp', () => {
  const isWindows = process.platform === 'win32';
  
  // Buscar Chrome en diferentes ubicaciones comunes
  const possiblePaths = isWindows ? [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome Beta\\Application\\chrome.exe',
    process.env.CHROME_PATH
  ] : [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    process.env.CHROME_PATH
  ];

  let chromePath = null;
  for (const path of possiblePaths) {
    if (path && fs.existsSync(path)) {
      chromePath = path;
      break;
    }
  }

  if (!chromePath) {
    console.warn('No se encontró Chrome instalado en las rutas comunes. Usando configuración por defecto.');
  }

  return {
    sessionPath: path.join(process.cwd(), 'whatsapp-auth-v2'),
    puppeteer: {
      executablePath: chromePath,
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--allow-running-insecure-content',
        '--window-size=1280,720',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      ],
      ignoreDefaultArgs: ['--disable-extensions'],
      defaultViewport: null
    }
  };
}); 