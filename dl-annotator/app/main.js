'use strict';

const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const fs = require('fs');
const dataurl = require('dataurl');
const stringify = require('csv-stringify/lib/sync');

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '../', 'node_modules', '.bin', 'electron')
});

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({ 
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.loadFile('app/index.html');
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

const filePath2dataUrl = (filePath) => {
    const filePromise = new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) { reject(err); }
        resolve(dataurl.convert({ data, mimetype: 'audio/mp3' }));
      });
    });
    return songPromise;
  };

const readAudioFile = exports.readAudioFile = () => {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Audio files', extensions: ['wav', 'mp3']}
        ]
    })
    .then(obj => {
        const filePath = obj.filePaths[0]
        if (filePath) {
            return filePath;
        } else { // user canceled out from selecting a file to read
            throw 'no file selected';
        }
    })
    .then(path2filenameAndDataURI)
    .then(obj => mainWindow.webContents.send('file-opened', obj))
    .catch(()=> 'nothing to see here') // not doing anything on error, what is to be done here?!
};

const readAudioFileFromPath = exports.readAudioFileFromPath = (filePath) => {
    let obj = path2filenameAndDataURI(filePath);
    mainWindow.webContents.send('file-opened', obj)
}

const path2filenameAndDataURI = (path) => {
    let fileContents = fs.readFileSync(path);
    let [filename, extension] = path.split('\\').pop().split('.');
    return {
        filename: filename,
        dataURI: dataurl.convert({data: fileContents, mimetype: `audio/${extension}`})
    }
}

const getAnnoOutputDir = exports.getAnnoOutputDir = () => {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
    })
    .then(obj => {
        const dirPath = obj.filePaths[0]
        if (dirPath) {
            return dirPath;
        } else { // user canceled out from selecting a directory
            throw 'no directory selected';
        }
    })
    .then(dirPath => mainWindow.webContents.send('dir-selected', dirPath))
    .catch(()=> 'nihil novi sub sole')
}

const addAnnoToCsv = exports.addAnnoToCsv = (annoTimes, dirPath, fileName) => {
    let header = ['Selection', 'Begin Time (s)', 'End Time(s)'];
    let data = [header];
    for (const [index, annoTime] of annoTimes.entries()) {
        data.push([index+1, annoTime, annoTime]);
      }
    let stringifiedData = stringify(data, {delimiter: '\t'});
    fs.writeFileSync(path.join(dirPath, fileName + '.txt'), stringifiedData);
}
