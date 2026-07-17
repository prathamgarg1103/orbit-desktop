const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("orbit", {
  close: () => ipcRenderer.invoke("companion:close"),
  ask: (payload) => ipcRenderer.invoke("companion:ask", payload),
  draw: (payload) => ipcRenderer.invoke("companion:draw", payload),
  connectors: () => ipcRenderer.invoke("companion:connectors"),
  saveConnector: (payload) => ipcRenderer.invoke("companion:saveConnector", payload),
  disconnectConnector: (provider) => ipcRenderer.invoke("companion:disconnectConnector", provider),
  approveAgent: (taskId) => ipcRenderer.invoke("companion:approveAgent", taskId),
  transcribe: (payload) => ipcRenderer.invoke("companion:transcribe", payload),
  onOpened: (callback) => ipcRenderer.on("companion:opened", (_event, payload) => callback(payload)),
  onError: (callback) => ipcRenderer.on("companion:error", (_event, message) => callback(message)),
  onGuidance: (callback) => ipcRenderer.on("guidance:show", (_event, payload) => callback(payload))
});
