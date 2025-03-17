import PyInstaller.__main__
import os
import shutil
import platform

# Temiz bir başlangıç için dist ve build klasörlerini temizle
if os.path.exists('dist'):
    shutil.rmtree('dist')
if os.path.exists('build'):
    shutil.rmtree('build')

# Platform kontrolü
is_mac = platform.system() == 'Darwin'
is_windows = platform.system() == 'Windows'

# Standart parametreler
parameters = [
    'desktop_app.py',
    '--name=RefFinder',
    '--windowed',
    '--add-data=templates:templates',
    '--add-data=static:static',
    '--add-data=.env:.env',
    '--hidden-import=flask',
    '--hidden-import=jinja2',
    '--hidden-import=werkzeug',
    '--hidden-import=dotenv',
    '--hidden-import=openai',
    '--hidden-import=webview',
    '--hidden-import=requests'
]

# MacOS özel parametreleri
if is_mac:
    # İkon dosyasının mevcut olup olmadığını kontrol et
    ico_path = os.path.join('static', 'favicon.ico')
    icns_path = os.path.join('static', 'favicon.icns')
    
    if os.path.exists(icns_path):
        parameters.append(f'--icon={icns_path}')
    elif os.path.exists(ico_path):
        print(f"UYARI: MacOS için .icns formatında bir ikon dosyası önerilir. {ico_path} kullanılıyor.")
        parameters.append(f'--icon={ico_path}')
    
    # MacOS uygulaması için info.plist ekle
    parameters.append('--osx-bundle-identifier=com.reffinder.app')
    
    # MacOS one-file modunda sorun yaşanabiliyor, bundle tercih ediliyor
    # Bu nedenle one-file parametresini eklemiyoruz
else:
    # Diğer platformlar için tek dosya
    parameters.append('--onefile')
    
    # İkon ekle (Windows için)
    if is_windows and os.path.exists('static/favicon.ico'):
        parameters.append('--icon=static/favicon.ico')

# PyInstaller'ı çalıştır
print("Uygulama derleniyor...")
PyInstaller.__main__.run(parameters)

# MacOS için ek adımlar
if is_mac:
    print("\nMacOS için ek adımlar gerçekleştiriliyor...")
    app_path = os.path.join('dist', 'RefFinder.app')
    if os.path.exists(app_path):
        print(f"Uygulama başarıyla oluşturuldu: {app_path}")
        print("Not: MacOS uygulamanızı ilk kez çalıştırırken, Ctrl tuşuna basılı tutarak tıklayın ve 'Aç' seçeneğini seçin.")
else:
    print("\nUygulama başarıyla oluşturuldu!")
    if is_windows:
        print("Uygulama dist klasöründe RefFinder.exe olarak bulunabilir.")
    else:
        print("Uygulama dist klasöründe RefFinder olarak bulunabilir.") 