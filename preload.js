const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  load: () => ipcRenderer.invoke("data:load"),
  save: (data) => ipcRenderer.invoke("data:save", data),
  export: (data) => ipcRenderer.invoke("data:export", data),
  import: () => ipcRenderer.invoke("data:import"),
});
