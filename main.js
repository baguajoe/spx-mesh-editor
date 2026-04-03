import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1600,
    height: 1000,
    minWidth:  1200,
    minHeight: 800,
    frame: false,           // custom titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#06060f',
    webPreferences: {
      preload:          join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      webSecurity:      false,  // allow local file loads (textures, HDRIs)
      // ── Desktop GPU quality unlocks ──────────────────────────────────────
      enableBlinkFeatures: 'WebGPU',   // force WebGPU on
      offscreen: false,
    },
    show: false,
    icon: join(__dirname, 'public/icon.png'),
  });

  // ── Load app ──────────────────────────────────────────────────────────────
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(join(__dirname, 'dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // ── GPU flags for maximum rendering quality ───────────────────────────────
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      // Signal to app that we are running in Electron desktop mode
      window.__ELECTRON__ = true;
      window.__DESKTOP_MODE__ = true;
      window.__WEBGPU_ENABLED__ = true;
      // Unlock high-res rendering
      window.devicePixelRatio = window.devicePixelRatio || 2;
      console.log('[SPX Desktop] Electron desktop mode active');
      console.log('[SPX Desktop] WebGPU:', !!navigator.gpu);
    `);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── GPU flags before app ready ─────────────────────────────────────────────
app.commandLine.appendSwitch('enable-features', 'WebGPU,WebGPUDeveloperFeatures');
app.commandLine.appendSwitch('use-angle', 'default');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-hardware-overlays', 'single-fullscreen,single-on-top,underlay');
app.commandLine.appendSwitch('force-color-profile', 'display-p3-d65');

app.whenReady().then(() => {
  createWindow();
  buildMenu();
  app.on('activate', () => { if (!mainWindow) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ── IPC: File system access (not available in browser) ─────────────────────
ipcMain.handle('dialog:openFile', async (_, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [
      { name: 'All Supported', extensions: ['glb','gltf','fbx','obj','hdr','exr','png','jpg'] },
      { name: '3D Models',     extensions: ['glb','gltf','fbx','obj'] },
      { name: 'HDRI',          extensions: ['hdr','exr'] },
      { name: 'Images',        extensions: ['png','jpg','jpeg','webp'] },
    ]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (_, defaultName, filters) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'untitled.glb',
    filters: filters || [
      { name: 'GLB', extensions: ['glb'] },
      { name: 'PNG', extensions: ['png'] },
    ]
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  const buf = await readFile(filePath);
  return buf.buffer;
});

ipcMain.handle('fs:writeFile', async (_, filePath, data) => {
  const dir = dirname(filePath);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(filePath, Buffer.from(data));
  return true;
});

ipcMain.handle('fs:readTextFile', async (_, filePath) => {
  return await readFile(filePath, 'utf-8');
});

ipcMain.handle('app:getPath', async (_, name) => {
  return app.getPath(name);
});

ipcMain.handle('shell:openExternal', async (_, url) => {
  await shell.openExternal(url);
});

// Window controls
ipcMain.on('window:minimize',  () => mainWindow?.minimize());
ipcMain.on('window:maximize',  () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.on('window:close',     () => mainWindow?.close());

// ── Native menu ────────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'SPX Mesh Editor',
      submenu: [
        { label: 'About SPX Mesh Editor', role: 'about' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo',  accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo',  accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut',   role: 'cut' },
        { label: 'Copy',  role: 'copy' },
        { label: 'Paste', role: 'paste' },
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload',          accelerator: 'CmdOrCtrl+R',       role: 'reload' },
        { label: 'Force Reload',    accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Dev Tools',       accelerator: 'F12',               role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size',     role: 'resetZoom' },
        { label: 'Zoom In',         role: 'zoomIn' },
        { label: 'Zoom Out',        role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Full Screen',     role: 'togglefullscreen' },
      ]
    },
    {
      label: 'GPU',
      submenu: [
        { label: 'GPU Info', click: () => mainWindow?.webContents.executeJavaScript(`
          navigator.gpu?.requestAdapter().then(a => {
            a?.requestAdapterInfo().then(info => {
              console.log('GPU:', JSON.stringify(info));
              alert('GPU: ' + info.device + '\\nVendor: ' + info.vendor);
            });
          });
        `)},
        { label: 'Toggle WebGPU APIC Fluid', click: () => mainWindow?.webContents.executeJavaScript(`
          document.dispatchEvent(new CustomEvent('spx:menu', {detail:{fn:'apic_fluid_start'}}));
        `)},
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}