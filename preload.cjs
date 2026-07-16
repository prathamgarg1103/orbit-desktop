const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("orbit", {
  onCursorUpdate: (callback) => ipcRenderer.on("cursor:update", (_event, payload) => callback(payload))
});
