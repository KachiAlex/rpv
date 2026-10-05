// Preload for the RPV desktop shell. The app loads the hosted web app, so no
// privileged APIs are exposed — this only marks the environment so the web UI
// can detect it's running inside the desktop app if needed.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('rpvDesktop', {
  isDesktop: true,
  platform: process.platform,
});
