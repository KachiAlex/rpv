const { app, BrowserWindow, Menu, screen, shell } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';
const DEV_PORT = process.env.NEXT_PORT || 3001;
const PROD_URL = process.env.RPV_URL || 'https://rpvbible.com';

const baseUrl = () => (isDev ? `http://localhost:${DEV_PORT}` : PROD_URL);

let mainWindow = null;
let projectorWindow = null;
let remoteWindow = null;

const windowOptions = {
  backgroundColor: '#0B1030',
  icon: path.join(__dirname, 'icon.png'),
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    // Same partition everywhere so BroadcastChannel + localStorage are shared
    // between the control, remote and projector windows — instant sync.
    partition: 'persist:rpv',
  },
};

function attachWindowGuards(win) {
  // External links (YouTube, store files, etc.) open in the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(baseUrl())) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(baseUrl())) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    ...windowOptions,
    width: 1280,
    height: 840,
    minWidth: 800,
    minHeight: 600,
    show: false,
  });
  attachWindowGuards(mainWindow);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.loadURL(baseUrl());
}

// Opens the projector view fullscreen on the external display when one is
// connected, otherwise as a normal window on the primary display.
function openProjectorWindow() {
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.focus();
    return;
  }

  const primary = screen.getPrimaryDisplay();
  const external = screen
    .getAllDisplays()
    .find((d) => d.id !== primary.id);

  projectorWindow = new BrowserWindow({
    ...windowOptions,
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
  projectorWindow.loadURL(`${baseUrl()}/projector`);
}

function openRemoteWindow() {
  if (remoteWindow && !remoteWindow.isDestroyed()) {
    remoteWindow.focus();
    return;
  }
  remoteWindow = new BrowserWindow({
    ...windowOptions,
    width: 520,
    height: 860,
    autoHideMenuBar: true,
  });
  attachWindowGuards(remoteWindow);
  remoteWindow.on('closed', () => { remoteWindow = null; });
  remoteWindow.loadURL(`${baseUrl()}/remote`);
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Projector Display',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: openProjectorWindow,
        },
        {
          label: 'Open Remote Control',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: openRemoteWindow,
        },
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
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Single instance — a second launch focuses the existing window instead of
// opening a second app (and a second localStorage/BroadcastChannel partition).
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

  app.whenReady().then(() => {
    buildMenu();
    createMainWindow();

    // Auto-reopen the projector on the external display if one is hot-plugged.
    screen.on('display-added', () => {
      if (projectorWindow && !projectorWindow.isDestroyed()) return;
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
