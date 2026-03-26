const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs   = require("fs");

// ── Dev vs production ─────────────────────────────────────────────────────────
const isDev  = process.env.NODE_ENV === "development" || !app.isPackaged;
const DEV_URL = "http://localhost:5173";

let mainWindow = null;

// ── Create main window ────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1600,
    height:          900,
    minWidth:        1200,
    minHeight:       700,
    title:           "SPX Mesh Editor",
    backgroundColor: "#06060f",
    show:            false,
    titleBarStyle:   process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload:             path.join(__dirname, "preload.js"),
      contextIsolation:    true,
      nodeIntegration:     false,
      webSecurity:         true,
    },
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  // Show when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

// ── Native menus ──────────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ label: app.name, submenu: [
      { role:"about" }, { type:"separator" },
      { role:"services" }, { type:"separator" },
      { role:"hide" }, { role:"hideOthers" }, { role:"unhide" },
      { type:"separator" }, { role:"quit" }
    ]}] : []),
    {
      label: "File",
      submenu: [
        { label:"New Scene",    accelerator:"CmdOrCtrl+N",      click: () => mainWindow?.webContents.send("menu:new") },
        { label:"Open...",      accelerator:"CmdOrCtrl+O",      click: () => handleOpenFile() },
        { label:"Save",         accelerator:"CmdOrCtrl+S",      click: () => mainWindow?.webContents.send("menu:save") },
        { label:"Save As...",   accelerator:"CmdOrCtrl+Shift+S",click: () => mainWindow?.webContents.send("menu:saveAs") },
        { type:"separator" },
        { label:"Import...",    accelerator:"CmdOrCtrl+I",      click: () => handleImportFile() },
        { label:"Export...",    accelerator:"CmdOrCtrl+E",      click: () => mainWindow?.webContents.send("menu:export") },
        { type:"separator" },
        isMac ? { role:"close" } : { role:"quit" }
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label:"Undo",        accelerator:"CmdOrCtrl+Z",       click: () => mainWindow?.webContents.send("menu:undo") },
        { label:"Redo",        accelerator:"CmdOrCtrl+Y",       click: () => mainWindow?.webContents.send("menu:redo") },
        { type:"separator" },
        { role:"cut" }, { role:"copy" }, { role:"paste" },
        { type:"separator" },
        { label:"Duplicate",   accelerator:"CmdOrCtrl+D",       click: () => mainWindow?.webContents.send("menu:duplicate") },
        { label:"Delete",      accelerator:"Delete",            click: () => mainWindow?.webContents.send("menu:delete") },
        { label:"Select All",  accelerator:"CmdOrCtrl+A",       click: () => mainWindow?.webContents.send("menu:selectAll") },
      ],
    },
    {
      label: "View",
      submenu: [
        { label:"Toggle Wireframe", accelerator:"W",            click: () => mainWindow?.webContents.send("menu:wireframe") },
        { label:"Toggle Grid",      accelerator:"G",            click: () => mainWindow?.webContents.send("menu:grid") },
        { type:"separator" },
        { role:"reload" }, { role:"forceReload" },
        { type:"separator" },
        { role:"togglefullscreen" },
        { label:"Developer Tools",  accelerator:"F12",          click: () => mainWindow?.webContents.toggleDevTools() },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role:"minimize" }, { role:"zoom" },
        ...(isMac ? [{ type:"separator" }, { role:"front" }] : [{ role:"close" }]),
      ],
    },
    {
      label: "Help",
      submenu: [
        { label:"SPX Mesh Editor Docs",  click: () => shell.openExternal("https://streampirex.com/mesh-editor") },
        { label:"StreamPireX Platform",  click: () => shell.openExternal("https://streampirex.com") },
        { label:"Report Issue",          click: () => shell.openExternal("https://github.com/baguajoe/spx-mesh-editor/issues") },
        { type:"separator" },
        { label:"About SPX Mesh Editor", click: () => dialog.showMessageBox(mainWindow, {
            title:   "SPX Mesh Editor",
            message: "SPX Mesh Editor",
            detail:  "Version 1.0.0\nBuilt on Three.js + React\nPart of the StreamPireX platform\n\n© Eye Forge Studios LLC",
            buttons: ["OK"],
          })
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── File handlers ─────────────────────────────────────────────────────────────
async function handleOpenFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title:      "Open Scene",
    filters:    [
      { name:"SPX Scene",   extensions:["spx","json"] },
      { name:"3D Models",   extensions:["glb","gltf","obj","fbx"] },
      { name:"All Files",   extensions:["*"] },
    ],
    properties: ["openFile"],
  });
  if (!result.canceled && result.filePaths.length) {
    const filePath = result.filePaths[0];
    const data     = fs.readFileSync(filePath);
    mainWindow?.webContents.send("file:opened", {
      path: filePath,
      name: path.basename(filePath),
      ext:  path.extname(filePath).toLowerCase(),
      data: data.toString("base64"),
    });
  }
}

async function handleImportFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title:   "Import File",
    filters: [
      { name:"3D Models", extensions:["glb","gltf","obj","fbx","abc"] },
      { name:"All Files", extensions:["*"] },
    ],
    properties: ["openFile"],
  });
  if (!result.canceled && result.filePaths.length) {
    const filePath = result.filePaths[0];
    const data     = fs.readFileSync(filePath);
    mainWindow?.webContents.send("file:import", {
      path: filePath,
      name: path.basename(filePath),
      ext:  path.extname(filePath).toLowerCase(),
      data: data.toString("base64"),
    });
  }
}

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle("dialog:openFile", async (_, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title:      options.title   || "Open File",
    filters:    options.filters || [{ name:"All Files", extensions:["*"] }],
    properties: ["openFile"],
  });
  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  const data     = fs.readFileSync(filePath);
  return { path:filePath, name:path.basename(filePath), data:data.toString("base64") };
});

ipcMain.handle("dialog:saveFile", async (_, options = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title:       options.title      || "Save File",
    defaultPath: options.defaultPath|| "scene.spx",
    filters:     options.filters    || [{ name:"All Files", extensions:["*"] }],
  });
  if (result.canceled || !result.filePath) return null;
  const data = options.binary
    ? Buffer.from(options.data, "base64")
    : options.data;
  fs.writeFileSync(result.filePath, data);
  return { path:result.filePath, name:path.basename(result.filePath) };
});

ipcMain.handle("dialog:openDirectory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return { path: result.filePaths[0] };
});

ipcMain.handle("app:getVersion",  () => app.getVersion());
ipcMain.handle("app:getPlatform", () => process.platform);

ipcMain.handle("window:minimize",  () => mainWindow?.minimize());
ipcMain.handle("window:maximize",  () => mainWindow?.isMaximized() ? mainWindow.restore() : mainWindow.maximize());
ipcMain.handle("window:close",     () => mainWindow?.close());
ipcMain.handle("window:isMaximized",() => mainWindow?.isMaximized() || false);

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  buildMenu();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("web-contents-created", (_, contents) => {
  // Prevent navigation to external URLs
  contents.on("will-navigate", (event, url) => {
    if (!url.startsWith("http://localhost") && !url.startsWith("file://")) {
      event.preventDefault();
    }
  });
});
