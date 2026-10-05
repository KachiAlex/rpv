const { app, BrowserWindow, Menu, screen, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// The desktop app serves the bundled static export (out/) from a local HTTP
// server, so the shell, IndexedDB cache, BroadcastChannel and localStorage all
// work with zero internet. API calls go to https://rpvbible.com when online
// (NEXT_PUBLIC_API_BASE_URL baked in at build time); when offline the app
// reads from its IndexedDB cache and projector sync stays same-machine.
const isDev = process.env.NODE_ENV === 'development';
const DEV_PORT = process.env.NEXT_PORT || 3001;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.txt': 'text/plain', '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json', '.map': 'application/json',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.pdf': 'application/pdf',
};

let server = null;
let serverPort = 0;
let mainWindow = null;
let projectorWindow = null;
let remoteWindow = null;

// Fixed port: localStorage, IndexedDB and BroadcastChannel are scoped to the
// origin, so a stable 127.0.0.1:port is what keeps the offline bible cache and
// projector channel persistent across launches. The single-instance lock
// prevents port collisions.
const APP_PORT = 39327;

// Tiny static file server for the Next.js export. trailingSlash:true means
// every route is a directory containing index.html (e.g. /projector/).
function startStaticServer() {
  const root = path.join(__dirname, 'out');

  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        let file = path.normalize(path.join(root, urlPath));
        if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }

        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          file = path.join(file, 'index.html');
        }
        if (!fs.existsSync(file)) {
          // SPA-ish fallback: try any parent index.html, else root
          let dir = path.dirname(file);
          while (dir.startsWith(root)) {
            const candidate = path.join(dir, 'index.html');
            if (fs.existsSync(candidate)) { file = candidate; break; }
            dir = path.dirname(dir);
          }
          if (!fs.existsSync(file)) file = path.join(root, '404.html');
          if (!fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
        }

        const ext = path.extname(file).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        });
        fs.createReadStream(file).pipe(res);
      } catch {
        res.writeHead(500); res.end();
      }
    });
    server.listen(APP_PORT, '127.0.0.1', () => resolve(APP_PORT));
    server.on('error', reject);
  });
}

const baseUrl = () =>
  isDev ? `http://localhost:${DEV_PORT}` : `http://127.0.0.1:${serverPort}`;

const windowOptions = () => ({
  backgroundColor: '#0B1030',
  icon: path.join(__dirname, 'icon.png'),
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    // One partition for every window — BroadcastChannel, localStorage and the
    // IndexedDB bible cache are shared, so remote → projector sync is instant
    // and works fully offline.
    partition: 'persist:rpv',
  },
});

function attachWindowGuards(win) {
  // Anything outside the local app (YouTube, store files…) opens externally.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(baseUrl()) || url.startsWith('https://rpvbible.com')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    ...windowOptions(),
    width: 1280,
    height: 840,
    minWidth: 800,
    minHeight: 600,
    show: false,
  });
  attachWindowGuards(mainWindow);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.loadURL(baseUrl() + '/');
}

// Projector view: fullscreen on the external display when one is connected.
function openProjectorWindow() {
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.focus();
    return;
  }

  const primary = screen.getPrimaryDisplay();
  const external = screen.getAllDisplays().find((d) => d.id !== primary.id);

  projectorWindow = new BrowserWindow({
    ...windowOptions(),
    autoHideMenuBar: true,
    ...(external
      ? {
          x: external.bounds.x,
          y: external.bounds.y,
          width: external.bounds.width,
          height: external.bounds.height,
          fullscreen: true,
        }
      : { width: 1280, height: 800 }),
  });
  attachWindowGuards(projectorWindow);
  projectorWindow.on('closed', () => { projectorWindow = null; });
  projectorWindow.loadURL(`${baseUrl()}/projector/`);
}

function openRemoteWindow() {
  if (remoteWindow && !remoteWindow.isDestroyed()) {
    remoteWindow.focus();
    return;
  }
  remoteWindow = new BrowserWindow({
    ...windowOptions(),
    width: 520,
    height: 860,
    autoHideMenuBar: true,
  });
  attachWindowGuards(remoteWindow);
  remoteWindow.on('closed', () => { remoteWindow = null; });
  remoteWindow.loadURL(`${baseUrl()}/remote/`);
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { label: 'Open Projector Display', accelerator: 'CmdOrCtrl+Shift+P', click: openProjectorWindow },
        { label: 'Open Remote Control', accelerator: 'CmdOrCtrl+Shift+R', click: openRemoteWindow },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools' }] : []),
      ],
    },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
  ]));
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    if (!isDev) {
      try {
        serverPort = await startStaticServer();
      } catch (err) {
        console.error('Failed to start static server:', err);
        app.quit();
        return;
      }
    }
    buildMenu();
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('quit', () => { if (server) server.close(); });
}
