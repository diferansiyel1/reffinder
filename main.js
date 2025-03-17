const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

let mainWindow;
let flaskProcess;

function startFlaskServer() {
  // Python executable path
  const pythonCommand = os.platform() === 'win32' ? 'python' : 'python3';
  
  // Flask uygulamasını başlat
  flaskProcess = spawn(pythonCommand, ['app.py']);
  
  // Hata ve çıktıları konsola yönlendir
  flaskProcess.stdout.on('data', (data) => {
    console.log(`Flask: ${data}`);
  });
  
  flaskProcess.stderr.on('data', (data) => {
    console.error(`Flask Error: ${data}`);
  });
  
  flaskProcess.on('close', (code) => {
    console.log(`Flask process exited with code ${code}`);
  });
}

function createWindow() {
  // Ana pencereyi oluştur
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'static', 'favicon.ico')
  });

  // Flask sunucusuna yüklenene kadar bekle (yaklaşık 2 saniye)
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:5000');
  }, 2000);

  // DevTools'u geliştirme modunda aç
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Ana pencere kapatıldığında
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

// Electron hazır olduğunda
app.whenReady().then(() => {
  // Flask sunucusunu başlat
  startFlaskServer();
  
  // Ana pencereyi oluştur
  createWindow();
  
  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Tüm pencereler kapatıldığında
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});

// Uygulama kapanmadan önce Flask sürecini sonlandır
app.on('before-quit', () => {
  if (flaskProcess) {
    if (os.platform() === 'win32') {
      // Windows'ta process.kill() çalışmayabilir
      spawn('taskkill', ['/pid', flaskProcess.pid, '/f', '/t']);
    } else {
      flaskProcess.kill();
    }
  }
}); 