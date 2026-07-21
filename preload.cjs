const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("diya", {
  close: () => ipcRenderer.invoke("companion:close"),
  resize: (size) => ipcRenderer.send("companion:resize", size),
  setFollow: (shouldFollow) => ipcRenderer.send("companion:follow", shouldFollow),
  setPointerMode: (enabled) => ipcRenderer.send("companion:pointerMode", enabled),
  ask: (payload) => ipcRenderer.invoke("companion:ask", payload),
  draw: (payload) => ipcRenderer.invoke("companion:draw", payload),
  connectors: () => ipcRenderer.invoke("companion:connectors"),
  saveConnector: (payload) => ipcRenderer.invoke("companion:saveConnector", payload),
  disconnectConnector: (provider) => ipcRenderer.invoke("companion:disconnectConnector", provider),
  sendFeedback: (payload) => ipcRenderer.invoke("companion:sendFeedback", payload),
  approveAgent: (taskId) => ipcRenderer.invoke("companion:approveAgent", taskId),
  startOAuth: (provider) => ipcRenderer.invoke("companion:startOAuth", provider),
  openLink: (kind) => ipcRenderer.invoke("companion:openLink", kind),
  transcribe: (payload) => ipcRenderer.invoke("companion:transcribe", payload),
  onOpened: (callback) => ipcRenderer.on("companion:opened", (_event, payload) => callback(payload)),
  onPrompt: (callback) => ipcRenderer.on("companion:prompt", () => callback()),
  onError: (callback) => ipcRenderer.on("companion:error", (_event, message) => callback(message)),
  onHover: (callback) => ipcRenderer.on("companion:hover", (_event, payload) => callback(payload)),
  onGuidance: (callback) => ipcRenderer.on("guidance:show", (_event, payload) => callback(payload))
});
