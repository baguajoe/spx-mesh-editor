const { contextBridge, ipcRenderer } = require("electron");

// ── Expose electronAPI to renderer ────────────────────────────────────────────
contextBridge.exposeInMainWorld("electronAPI", {

  // File system
  openFile: (options) => ipcRenderer.invoke("dialog:openFile", options),
  saveFile: (options) => ipcRenderer.invoke("dialog:saveFile", options),
  openDirectory: ()   => ipcRenderer.invoke("dialog:openDirectory"),

  // App info
  getVersion:  () => ipcRenderer.invoke("app:getVersion"),
  getPlatform: () => ipcRenderer.invoke("app:getPlatform"),

  // Window controls
  minimize:    () => ipcRenderer.invoke("window:minimize"),
  maximize:    () => ipcRenderer.invoke("window:maximize"),
  close:       () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),

  // Menu events (main → renderer)
  onMenu: (channel, callback) => {
    const validChannels = [
      "menu:new", "menu:save", "menu:saveAs", "menu:export",
      "menu:undo", "menu:redo", "menu:duplicate", "menu:delete",
      "menu:selectAll", "menu:wireframe", "menu:grid",
      "file:opened", "file:import",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    }
  },

  // Remove listener
  offMenu: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// ── Expose platform info ──────────────────────────────────────────────────────
contextBridge.exposeInMainWorld("__electronPlatform", {
  isElectron: true,
  platform:   process.platform,
  arch:       process.arch,
  version:    process.versions.electron,
});
