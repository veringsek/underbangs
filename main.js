const { app, BrowserWindow } = require("electron");

let createWindow = () => {
    win = new BrowserWindow({
        webPreferences: {
            webSecurity: false
        }
    });
    win.maximize();
    win.on("close", () => {
        win = null;
    });
    win.loadURL(`file://${__dirname}/index.html`);
};

app.on("ready", createWindow);