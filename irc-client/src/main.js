const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1000
  });

  mainWindow.loadURL(`file://${__dirname}/main.html`);

  mainWindow.on('close', () => {
    console.log('mainWindow closed');
  });
});
