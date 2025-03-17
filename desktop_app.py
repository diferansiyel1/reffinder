import webview
import threading
import sys
import os
import subprocess

# Flask uygulamasını başlatan fonksiyon
def start_server():
    # Python executable path
    python_executable = sys.executable
    
    # Flask uygulamasını ayrı bir süreç olarak başlat, debug modunu kapatarak
    flask_process = subprocess.Popen([python_executable, 'app.py', '--no-debugger', '--no-reload'])
    return flask_process

if __name__ == '__main__':
    # Flask sunucusunu başlat
    flask_process = start_server()
    
    # Sunucunun başlaması için biraz bekle
    import time
    time.sleep(2)
    
    # PyWebView penceresini oluştur
    webview.create_window(
        title='RefFinder | Akademik Referans Tarama', 
        url='http://127.0.0.1:5000',
        width=1000,
        height=800,
        resizable=True,
        min_size=(800, 600)
    )
    
    # Uygulamayı başlat
    webview.start(debug=False)
    
    # Uygulama kapandığında Flask sürecini sonlandır
    if flask_process:
        flask_process.terminate()
    
    # Python sürecini tamamen sonlandır
    sys.exit() 