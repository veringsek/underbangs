const { app, BrowserWindow } = require("electron");

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'; // debug

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

app.on('window-all-closed', () => app.quit());