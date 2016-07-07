'use strict';
const fs = require('fs');
const path = require('path');

const electron = require('electron');
const ipcMain = require('electron').ipcMain;
const dialog = require('dialog');

var parseString = require('xml2js').parseString;
var debug = require('debug')('index');

var wifiLogAnalyser = require('./wifiLogAnalyser');

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let logoWindow;
let dataPath;
let logoHasDisplayed = false;

function createWindow() {
  debug("[+] createWindow is called")

  // Create the browser window.
  logoWindow = new BrowserWindow({ width: 500, height: 500, transparent:true ,frame: false });
  logoWindow.loadURL('file://' + __dirname + '/public/logo.html');

  setTimeout(function () {
    logoWindow.close();
    logoWindow = null;
    logoHasDisplayed = true;

    dialog.showOpenDialog(function (fileNames) {
      debug("[!] Dialog box open")
      if (fileNames === undefined) {
        debug("[-] No file choose. Quit!");
        app.quit();

      } else {
        var fileName = fileNames[0];
        dataPath = fileName;

        debug("[!] dataPath = " + dataPath);

        // Create the browser window.
        mainWindow = new BrowserWindow({ width: 1500, height: 800 });

        // and load the index.html of the app.
        mainWindow.loadURL('file://' + __dirname + '/public/index.html');

        // Open the DevTools.
        //mainWindow.webContents.openDevTools();

        // Emitted when the window is closed.
        mainWindow.on('closed', function () {
          mainWindow = null;
        });
      }
    });


  }, 3000);



}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin' && logoHasDisplayed) {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});


ipcMain.on('getCoord', function (event, arg) {
  debug("[+] getCoord is called");

  var data = wifiLogAnalyser.getPoints(dataPath);

  debug("[+] data is set to: " + typeof (data));
  event.returnValue = data;
});
