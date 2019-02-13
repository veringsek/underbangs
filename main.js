const { app, BrowserWindow } = require("electron");

let createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600
    });
    win.on("close", () => {
        win = null;
    });
    win.loadURL(`file://${__dirname}/index.html`);
};

app.on("ready", createWindow);