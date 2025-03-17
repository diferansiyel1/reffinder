# RefFinder - Akademik Referans Tarama Uygulaması

![Status](https://img.shields.io/badge/status-aktif-success) ![License](https://img.shields.io/badge/license-MIT-blue) ![Version](https://img.shields.io/badge/version-1.0.0-orange)

<p align="center">
  <img src="https://raw.githubusercontent.com/diferansiyel1/reffinder-akademik-referans-tarama/main/static/logo.png" alt="RefFinder Logo" width="200"/>
</p>

Bu uygulama, DeepSeek AI API kullanarak metinlerdeki akademik referansları otomatik olarak taramak ve APA formatında bibliyografya oluşturmak için tasarlanmıştır. Hem web uygulaması hem de masaüstü uygulaması olarak kullanılabilir.

## İçindekiler
- [Özellikler](#özellikler)
- [Ekran Görüntüleri](#ekran-görüntüleri)
- [Kurulum](#kurulum)
- [Uygulamayı Çalıştırma](#uygulamayı-çalıştırma)
- [Masaüstü Uygulaması Oluşturma](#masaüstü-uygulaması-oluşturma)
- [Kullanım](#kullanım)
- [Teknolojiler](#teknolojiler)
- [Katkıda Bulunma](#katkıda-bulunma)
- [Lisans](#lisans)

## Özellikler

- ✅ Metin içi referansları otomatik olarak tespit etme
- ✅ APA formatında doğru bibliyografya oluşturma
- ✅ DOI doğrulama ve Crossref API entegrasyonu
- ✅ Modern ve kullanıcı dostu web arayüzü
- ✅ Açık/koyu tema desteği
- ✅ Dil desteği (Türkçe/İngilizce)
- ✅ DeepSeek AI modeli ile güçlendirilmiş analiz
- ✅ Sorgu geçmişi ve sonuçları saklama
- ✅ Hem web uygulaması hem de masaüstü uygulaması olarak çalışabilme
- ✅ Responsive tasarım (farklı cihaz boyutlarına uyumlu)

## Ekran Görüntüleri

<p align="center">
  <img src="https://raw.githubusercontent.com/diferansiyel1/reffinder-akademik-referans-tarama/main/screenshots/screenshot1.png" alt="RefFinder Ekran Görüntüsü 1" width="400"/>
  <img src="https://raw.githubusercontent.com/diferansiyel1/reffinder-akademik-referans-tarama/main/screenshots/screenshot2.png" alt="RefFinder Ekran Görüntüsü 2" width="400"/>
</p>

## Kurulum

1. Depoyu klonlayın
```bash
git clone https://github.com/diferansiyel1/reffinder-akademik-referans-tarama.git
cd reffinder-akademik-referans-tarama
```

2. Gerekli paketleri yükleyin
```bash
pip install -r requirements.txt
```

3. DeepSeek API anahtarınızı ekleyin
`.env` dosyasını oluşturun ve API anahtarınızı ekleyin:
```
DEEPSEEK_API_KEY=your_api_key_here
```

## Uygulamayı Çalıştırma

### Web Uygulaması Olarak
```bash
python app.py
```
Tarayıcınızda `http://localhost:5000` adresine gidin

### Masaüstü Uygulaması Olarak
```bash
python desktop_app.py
```

## Masaüstü Uygulaması Oluşturma

### PyWebView ile:
```bash
pip install pywebview pyinstaller
python build.py
```
Uygulama `dist` klasöründe oluşturulacaktır.

### Electron ile:
```bash
npm install
npm run build
```

## Kullanım

1. Uygulama arayüzünü açın (web veya masaüstü)
2. Ayarlar menüsünden DeepSeek API anahtarınızı girin
3. Taranacak metni giriş alanına yapıştırın
4. İsteğe bağlı olarak gelişmiş ayarları yapılandırın
5. "Referansları Tara" düğmesine tıklayın
6. Sonuçları görüntüleyin - metin içi referanslar işaretlenecek ve APA formatında tam bibliyografya gösterilecektir

## Teknolojiler

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **AI**: DeepSeek AI API
- **Masaüstü Paketi**: PyWebView, PyInstaller, Electron

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Projeye katkıda bulunmak için:

1. Bu depoyu forklayın
2. Kendi branch'inizi oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Amazing feature added'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

<p align="center">
  <strong>RefFinder</strong> | Geliştiren <a href="https://github.com/diferansiyel1">HFOsoft</a> | © 2025
</p> 