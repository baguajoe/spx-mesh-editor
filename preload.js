import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File system
  openFile:     (filters)           => ipcRenderer.invoke('dialog:openFile', filters),
  saveFile:     (name, filters)     => ipcRenderer.invoke('dialog:saveFile', name, filters),
  readFile:     (path)              => ipcRenderer.invoke('fs:readFile', path),
  writeFile:    (path, data)        => ipcRenderer.invoke('fs:writeFile', path, data),
  readTextFile: (path)              => ipcRenderer.invoke('fs:readTextFile', path),
  getPath:      (name)              => ipcRenderer.invoke('app:getPath', name),
  openExternal: (url)               => ipcRenderer.invoke('shell:openExternal', url),

  // Window controls
  minimize: ()  => ipcRenderer.send('window:minimize'),
  maximize: ()  => ipcRenderer.send('window:maximize'),
  close:    ()  => ipcRenderer.send('window:close'),

  // Platform info
  platform: process.platform,
  isDesktop: true,
});