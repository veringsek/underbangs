const { app, BrowserWindow } = require("electron");

let createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600
    });
    win.on("close", () => {
        win = null;
    });
    win.loadURL("http://www.google.com/");
};

app.on("ready", createWindow);