// Tüm form elemanları ve uygulamanın durumunu yönetecek ana modül
const AppModule = {
    // Uygulama durumu
    state: {
        isDarkTheme: false,
        language: 'tr',
        queries: [],  // Geçmiş sorguları saklar
        activeQueryId: null,  // Şu an görüntülenen sorgu ID'si
    },
    
    // Çeviri nesnesi
    translations: {
        tr: {
            searchPlaceholder: "Ara...",
            noQueryFound: "Eşleşen sorgu bulunamadı",
            newQuerySuccess: "Form temizlendi, yeni sorgu hazır",
            apiKeySaved: "API anahtarı başarıyla kaydedildi",
            apiKeyRequired: "Lütfen API anahtarınızı girin",
            apiKeyInvalid: "API anahtarı doğrulanamadı",
            apiKeyError: "API anahtarı doğrulanırken bir hata oluştu",
            settingsSaved: "Ayarlar başarıyla kaydedildi",
            queryHistoryCleared: "Sorgu geçmişi temizlendi",
            textCopied: "Metin panoya kopyalandı",
            textCopyError: "Metin kopyalanırken bir hata oluştu",
            textRequired: "Lütfen işlenecek bir metin girin",
            apiKeyPrompt: "Lütfen ayarlar menüsünden DeepSeek API anahtarınızı girin",
            processing: "İşleniyor...",
            scanning: "Referansları Tara",
            preparing: "Hazırlanıyor...",
            connecting: "AI ile iletişim kuruluyor...",
            analyzing: "Metin analiz ediliyor...",
            searchingRefs: "Referanslar aranıyor...",
            verifyingRefs: "Referanslar doğrulanıyor...",
            preparingResults: "Sonuçlar hazırlanıyor...",
            completed: "Tamamlandı!",
            articleTitle: "Başlık",
            journal: "Dergi",
            publishDate: "Yayınlanma",
            citationCount: "Atıf Sayısı",
            referenceCount: "Referans Sayısı",
            notSpecified: "Belirtilmemiş",
            relevanceScore: "İlgi Skoru",
            noBibliography: "Referans bulunamadı"
        },
        en: {
            searchPlaceholder: "Search...",
            noQueryFound: "No matching query found",
            newQuerySuccess: "Form cleared, new query ready",
            apiKeySaved: "API key successfully saved",
            apiKeyRequired: "Please enter your API key",
            apiKeyInvalid: "API key could not be verified",
            apiKeyError: "An error occurred while verifying the API key",
            settingsSaved: "Settings successfully saved",
            queryHistoryCleared: "Query history cleared",
            textCopied: "Text copied to clipboard",
            textCopyError: "An error occurred while copying the text",
            textRequired: "Please enter a text to process",
            apiKeyPrompt: "Please enter your DeepSeek API key in the settings menu",
            processing: "Processing...",
            scanning: "Scan References",
            preparing: "Preparing...",
            connecting: "Connecting to AI...",
            analyzing: "Analyzing text...",
            searchingRefs: "Searching for references...",
            verifyingRefs: "Verifying references...",
            preparingResults: "Preparing results...",
            completed: "Completed!",
            articleTitle: "Title",
            journal: "Journal",
            publishDate: "Published Date",
            citationCount: "Citation Count",
            referenceCount: "Reference Count",
            notSpecified: "Not Specified",
            relevanceScore: "Relevance Score",
            noBibliography: "No references found"
        }
    },
    
    init: function() {
        // Form elemanlarını seçme
        this.textForm = document.getElementById('textForm');
        this.inputText = document.getElementById('inputText');
        this.resultsSection = document.getElementById('resultsSection');
        this.processedText = document.getElementById('processedText');
        this.bibliography = document.getElementById('bibliography');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.submitText = document.getElementById('submitText');
        this.errorAlert = document.getElementById('errorAlert');
        this.advancedToggle = document.querySelector('.advanced-toggle');
        this.advancedSettings = document.querySelector('.advanced-settings');
        this.maxReferences = document.getElementById('maxReferences');
        this.factCheckLevel = document.getElementById('factCheckLevel');
        this.modelType = document.getElementById('modelType');
        this.copyTextBtn = document.getElementById('copyTextBtn');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressStatus = document.getElementById('progressStatus');
        
        // Yan menü ve kullanıcı menüsü elemanları
        this.sideMenu = document.getElementById('sideMenu');
        this.toggleSidemenu = document.getElementById('toggleSidemenu');
        this.queriesList = document.getElementById('queriesList');
        this.userMenu = document.getElementById('userMenu');
        this.userDropdown = document.getElementById('userDropdown');
        this.apiKeyInput = document.getElementById('apiKey');
        this.toggleApiKeyBtn = document.getElementById('toggleApiKey');
        this.apiKeyForm = document.getElementById('apiKeyForm');
        this.settingsForm = document.getElementById('settingsForm');
        this.themeSelect = document.getElementById('theme');
        this.languageSelect = document.getElementById('language');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        
        // Yeni eklenen elementler
        this.newQueryBtn = document.getElementById('newQueryBtn');
        this.searchQueriesInput = document.getElementById('searchQueries');
        this.searchButton = document.getElementById('searchButton');
        this.toggleLanguageBtn = document.getElementById('toggleLanguageBtn');

        // Form submit olayını dinle
        if (this.textForm) {
            this.textForm.addEventListener('submit', this.handleSubmit.bind(this));
        }
        
        // Gelişmiş ayarlar toggle
        if (this.advancedToggle) {
            this.advancedToggle.addEventListener('click', this.toggleAdvancedOptions.bind(this));
            
            // Başlangıçta gelişmiş ayarları gizle
            if (this.advancedSettings) {
                this.advancedSettings.style.display = 'none';
            }
        }

        // Metni kopyalama butonu işlevselliği
        if (this.copyTextBtn) {
            this.copyTextBtn.addEventListener('click', this.copyProcessedText.bind(this));
        }
        
        // Yan menü açma/kapama
        if (this.toggleSidemenu) {
            this.toggleSidemenu.addEventListener('click', this.toggleSideMenu.bind(this));
        }
        
        // Kullanıcı menüsü açma/kapama
        if (this.userMenu) {
            this.userMenu.addEventListener('click', this.toggleUserMenu.bind(this));
            
            // Menünün dışına tıklanınca kapanması
            document.addEventListener('click', (e) => {
                if (!this.userMenu.contains(e.target) && this.userDropdown.classList.contains('show')) {
                    this.userDropdown.classList.remove('show');
                }
            });
        }
        
        // API key göster/gizle
        if (this.toggleApiKeyBtn) {
            this.toggleApiKeyBtn.addEventListener('click', this.toggleApiKeyVisibility.bind(this));
        }
        
        // API anahtarı formunu dinle
        if (this.apiKeyForm) {
            this.apiKeyForm.addEventListener('submit', this.saveApiKey.bind(this));
        }
        
        // Ayarlar formunu dinle
        if (this.settingsForm) {
            this.settingsForm.addEventListener('submit', this.saveSettings.bind(this));
        }
        
        // Geçmişi temizle
        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', this.clearQueryHistory.bind(this));
        }
        
        // Yeni eklenen elementlere olay dinleyicileri ekle
        if (this.newQueryBtn) {
            this.newQueryBtn.addEventListener('click', this.createNewQuery.bind(this));
        }
        
        if (this.searchQueriesInput) {
            this.searchQueriesInput.addEventListener('input', this.searchQueries.bind(this));
            this.searchQueriesInput.placeholder = this.getTranslation('searchPlaceholder');
        }
        
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => {
                if (this.searchQueriesInput) {
                    this.searchQueries({ target: this.searchQueriesInput });
                }
            });
        }
        
        if (this.toggleLanguageBtn) {
            this.toggleLanguageBtn.addEventListener('click', this.toggleLanguage.bind(this));
        }
        
        // Uygulama verilerini yerel depolamadan yükle
        this.loadAppData();
        
        // Tooltips başlat
        this.initTooltips();
        
        // Dil ayarlarını uygula
        this.applyLanguage();
        
        console.log('Uygulama başlatıldı');
    },
    
    // Dil değiştirme fonksiyonu
    toggleLanguage: function() {
        const currentLang = this.state.language;
        const newLang = currentLang === 'tr' ? 'en' : 'tr';
        
        // Dili değiştir ve uygula
        this.state.language = newLang;
        this.applyLanguage();
        
        // Dil seçimini localStorage'a kaydet
        localStorage.setItem('language', newLang);
        
        // Dil seçim menüsünü güncelle
        if (this.languageSelect) {
            this.languageSelect.value = newLang;
        }
        
        // Bildirim göster
        this.showAlert(this.getTranslation('settingsSaved'), 'success');
    },
    
    // Belirli bir dil değerini uygulama
    applyLanguage: function() {
        const lang = this.state.language;
        
        // data-lang attribute'u olan tüm elementleri seç
        document.querySelectorAll('[data-lang]').forEach(el => {
            if (el.getAttribute('data-lang') === lang) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
        
        // Placeholder'ları güncelle
        document.querySelectorAll('[data-placeholder-tr], [data-placeholder-en]').forEach(el => {
            if (lang === 'tr' && el.hasAttribute('data-placeholder-tr')) {
                el.placeholder = el.getAttribute('data-placeholder-tr');
            } else if (lang === 'en' && el.hasAttribute('data-placeholder-en')) {
                el.placeholder = el.getAttribute('data-placeholder-en');
            }
        });
        
        // Tooltip başlıklarını güncelle
        document.querySelectorAll('[data-title-tr], [data-title-en]').forEach(el => {
            if (lang === 'tr' && el.hasAttribute('data-title-tr')) {
                el.setAttribute('title', el.getAttribute('data-title-tr'));
            } else if (lang === 'en' && el.hasAttribute('data-title-en')) {
                el.setAttribute('title', el.getAttribute('data-title-en'));
            }
        });
        
        // Tooltipleri yeniden başlat
        this.initTooltips();
        
        // Arama input placeholder güncelle
        if (this.searchQueriesInput) {
            this.searchQueriesInput.placeholder = this.getTranslation('searchPlaceholder');
        }
    },
    
    // Çeviri metni getir
    getTranslation: function(key) {
        const lang = this.state.language;
        return this.translations[lang][key] || key;
    },
    
    // Yeni sorgu oluştur
    createNewQuery: function() {
        // Formu temizle
        if (this.textForm) {
            this.textForm.reset();
        }
        
        // Sonuçları gizle
        if (this.resultsSection) {
            this.resultsSection.style.display = 'none';
        }
        
        // Aktif sorguyu temizle
        this.state.activeQueryId = null;
        
        // Sorgu listesinde aktiflik durumunu güncelle
        this.updateQueryList();
        
        // Input alanına odaklan
        if (this.inputText) {
            this.inputText.focus();
        }
        
        // Bildirim göster
        this.showAlert(this.getTranslation('newQuerySuccess'), 'info');
    },
    
    // Sorgu geçmişinde arama yap
    searchQueries: function(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        
        if (!searchTerm) {
            // Arama terimi yoksa tüm sorguları göster
            this.updateQueryList();
            return;
        }
        
        // Arama terimine göre sorguları filtrele
        const filteredQueries = this.state.queries.filter(query => 
            query.text.toLowerCase().includes(searchTerm) || 
            query.preview.toLowerCase().includes(searchTerm)
        );
        
        // Filtrelenmiş sorguları göster
        this.renderFilteredQueries(filteredQueries, searchTerm);
    },
    
    // Filtrelenmiş sorguları göster
    renderFilteredQueries: function(queries, searchTerm) {
        if (!this.queriesList) return;
        
        this.queriesList.innerHTML = '';
        
        const noQueries = document.querySelector('.no-queries');
        
        if (queries.length === 0) {
            // Eşleşen sorgu yoksa bilgi mesajı göster
            if (noQueries) {
                const noResultsEl = document.createElement('div');
                noResultsEl.className = 'px-3 py-2 text-center';
                noResultsEl.innerHTML = `
                    <i class="fas fa-search mb-2"></i>
                    <p>${this.getTranslation('noQueryFound')}: "${searchTerm}"</p>
                `;
                this.queriesList.appendChild(noResultsEl);
                noQueries.style.display = 'none';
            }
            return;
        }
        
        if (noQueries) noQueries.style.display = 'none';
        
        // En yeni sorguları en üstte göster
        const sortedQueries = [...queries].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        sortedQueries.forEach(query => {
            const li = document.createElement('li');
            li.className = 'query-item';
            if (query.id === this.state.activeQueryId) {
                li.className += ' active';
            }
            
            // Arama terimini vurgula
            let preview = query.preview;
            if (searchTerm) {
                const regex = new RegExp(searchTerm, 'gi');
                preview = preview.replace(regex, match => `<mark>${match}</mark>`);
            }
            
            li.innerHTML = `
                ${preview}
                <span class="query-time">${query.timestamp}</span>
            `;
            
            li.addEventListener('click', () => this.loadQuery(query.id));
            
            this.queriesList.appendChild(li);
        });
    },
    
    // API anahtarını görünürlüğünü değiştirme
    toggleApiKeyVisibility: function() {
        const input = this.apiKeyInput;
        const icon = this.toggleApiKeyBtn.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    },
    
    // API anahtarını sakla
    saveApiKey: function(e) {
        e.preventDefault();
        
        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            this.showAlert(this.getTranslation('apiKeyRequired'), 'warning');
            return;
        }
        
        // API anahtarını doğrula
        this.verifyApiKey(apiKey).then(response => {
            if (response.verified) {
                // API anahtarını localStorage'a kaydet
                localStorage.setItem('deepseekApiKey', apiKey);
                
                this.showAlert(this.getTranslation('apiKeySaved'), 'success');
                
                // Modal'ı kapat
                const modal = bootstrap.Modal.getInstance(document.getElementById('apiKeyModal'));
                if (modal) {
                    modal.hide();
                }
            } else {
                this.showAlert(`${this.getTranslation('apiKeyInvalid')}: ${response.message}`, 'danger');
            }
        }).catch(error => {
            this.showAlert(this.getTranslation('apiKeyError'), 'danger');
            console.error('API anahtarı doğrulama hatası:', error);
        });
    },
    
    // API anahtarını doğrula
    verifyApiKey: async function(apiKey) {
        try {
            const response = await fetch('/verify-api-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'api_key': apiKey
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API doğrulama hatası:', error);
            return { verified: false, message: error.message };
        }
    },
    
    // Ayarları kaydet
    saveSettings: function(e) {
        e.preventDefault();
        
        const theme = this.themeSelect.value;
        const language = this.languageSelect.value;
        
        // Ayarları localStorage'a kaydet
        localStorage.setItem('theme', theme);
        localStorage.setItem('language', language);
        
        // Temayı uygula
        this.applyTheme(theme);
        
        // Dili değiştir
        if (language !== this.state.language) {
            this.state.language = language;
            this.applyLanguage();
        }
        
        this.showAlert(this.getTranslation('settingsSaved'), 'success');
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        if (modal) {
            modal.hide();
        }
    },
    
    // Temayı uygula
    applyTheme: function(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            this.state.isDarkTheme = true;
        } else if (theme === 'light') {
            document.body.classList.remove('dark-theme');
            this.state.isDarkTheme = false;
        } else if (theme === 'system') {
            // Sistem temasını kontrol et
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.body.classList.add('dark-theme');
                this.state.isDarkTheme = true;
            } else {
                document.body.classList.remove('dark-theme');
                this.state.isDarkTheme = false;
            }
        }
    },
    
    // Sorgu geçmişini temizle
    clearQueryHistory: function() {
        if (confirm('Tüm sorgu geçmişini silmek istediğinizden emin misiniz?')) {
            // Geçmiş sorgular listesini temizle
            this.state.queries = [];
            localStorage.setItem('queryHistory', JSON.stringify([]));
            
            // Yan menüdeki listeyi temizle
            this.updateQueryList();
            
            this.showAlert(this.getTranslation('queryHistoryCleared'), 'success');
        }
    },
    
    // Yan menüyü aç/kapa
    toggleSideMenu: function() {
        this.sideMenu.classList.toggle('show');
    },
    
    // Kullanıcı menüsünü aç/kapa
    toggleUserMenu: function(e) {
        e.stopPropagation();
        this.userDropdown.classList.toggle('show');
    },
    
    // Gelişmiş ayarları aç/kapa
    toggleAdvancedOptions: function() {
        const icon = this.advancedToggle.querySelector('i.fa-chevron-down, i.fa-chevron-up');
        
        if (this.advancedSettings.style.display === 'none') {
            this.advancedSettings.style.display = 'block';
            if (icon) icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
            this.advancedSettings.style.display = 'none';
            if (icon) icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
    },
    
    // Uygulama verilerini yerel depolamadan yükle
    loadAppData: function() {
        // API anahtarını yükle
        const apiKey = localStorage.getItem('deepseekApiKey');
        if (apiKey && this.apiKeyInput) {
            this.apiKeyInput.value = apiKey;
        }
        
        // Tema ayarlarını yükle
        const theme = localStorage.getItem('theme') || 'light';
        if (this.themeSelect) {
            this.themeSelect.value = theme;
        }
        this.applyTheme(theme);
        
        // Dil ayarlarını yükle
        const language = localStorage.getItem('language') || 'tr';
        this.state.language = language;
        if (this.languageSelect) {
            this.languageSelect.value = language;
        }
        
        // Sorgu geçmişini yükle
        const queryHistory = localStorage.getItem('queryHistory');
        if (queryHistory) {
            try {
                this.state.queries = JSON.parse(queryHistory);
                this.updateQueryList();
            } catch (e) {
                console.error('Sorgu geçmişi yüklenirken hata oluştu:', e);
                this.state.queries = [];
            }
        }
    },
    
    // Sorgu geçmişi listesini güncelle
    updateQueryList: function() {
        if (!this.queriesList) return;
        
        this.queriesList.innerHTML = '';
        
        const noQueries = document.querySelector('.no-queries');
        if (this.state.queries.length === 0) {
            if (noQueries) noQueries.style.display = 'block';
            return;
        }
        
        if (noQueries) noQueries.style.display = 'none';
        
        // En yeni sorguları en üstte göster
        const sortedQueries = [...this.state.queries].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        sortedQueries.forEach(query => {
            const li = document.createElement('li');
            li.className = 'query-item';
            if (query.id === this.state.activeQueryId) {
                li.className += ' active';
            }
            
            li.innerHTML = `
                ${query.preview}
                <span class="query-time">${query.timestamp}</span>
            `;
            
            li.addEventListener('click', () => this.loadQuery(query.id));
            
            this.queriesList.appendChild(li);
        });
    },
    
    // Bir sorguyu yükle
    loadQuery: function(queryId) {
        const query = this.state.queries.find(q => q.id === queryId);
        if (!query) return;
        
        // Form alanlarını doldur
        this.inputText.value = query.text;
        
        // Gelişmiş ayarlar varsa onları da güncelle
        if (query.settings) {
            if (this.maxReferences) this.maxReferences.value = query.settings.maxReferences;
            if (this.factCheckLevel) this.factCheckLevel.value = query.settings.factCheckLevel;
            if (this.modelType) this.modelType.value = query.settings.modelType;
        }
        
        // Sonuçlar varsa göster
        if (query.results) {
            this.displayResults(query.results);
            this.resultsSection.style.display = 'block';
        }
        
        // Aktif sorguyu güncelle
        this.state.activeQueryId = queryId;
        
        // Sorgu listesini güncelle
        this.updateQueryList();
        
        // Mobil görünümde yan menüyü kapat
        if (window.innerWidth < 992) {
            this.sideMenu.classList.remove('show');
        }
    },
    
    // Bildirim göster
    showAlert: function(message, type = 'info') {
        // Bootstrap toast kullanılarak bildirim göster
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
        toastEl.role = 'alert';
        toastEl.ariaLive = 'assertive';
        toastEl.ariaAtomic = 'true';
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        document.getElementById('toastContainer').appendChild(toastEl);
        
        const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
        toast.show();
        
        // Önceki hata mesajlarını temizle
        this.errorAlert.style.display = 'none';
    },
    
    handleSubmit: async function(e) {
        e.preventDefault();
        
        const text = this.inputText.value.trim();
        if (!text) {
            this.showAlert(this.getTranslation('textRequired'), 'warning');
            return;
        }
        
        // API anahtarını kontrol et
        const apiKey = localStorage.getItem('deepseekApiKey');
        if (!apiKey) {
            this.showAlert(this.getTranslation('apiKeyPrompt'), 'warning');
            
            // API key modal'ını aç
            const apiKeyModal = new bootstrap.Modal(document.getElementById('apiKeyModal'));
            apiKeyModal.show();
            
            return;
        }
        
        // Gelişmiş ayarları al
        const maxReferences = this.maxReferences.value;
        const factCheckLevel = this.factCheckLevel.value;
        const modelType = this.modelType.value;
        
        // UI öğelerini ayarla
        this.setLoading(true);
        this.resultsSection.style.display = 'none';
        this.errorAlert.style.display = 'none';
        
        try {
            // İşleme API'sini çağır
            const result = await this.processText(text, maxReferences, factCheckLevel, modelType, apiKey);
            
            if (result.error) {
                this.showError(result.error);
                return;
            }
            
            // Sorgu geçmişi için gerekli bilgileri sakla
            const queryData = {
                id: result.query_id,
                text: text,
                preview: result.query_preview,
                timestamp: result.timestamp,
                settings: {
                    maxReferences,
                    factCheckLevel,
                    modelType
                },
                results: result
            };
            
            // Sorgu listesine ekle
            this.state.queries.push(queryData);
            
            // En fazla 20 sorgu sakla (eski sorguları sil)
            if (this.state.queries.length > 20) {
                this.state.queries = this.state.queries.slice(-20);
            }
            
            // Aktif sorgu olarak işaretle
            this.state.activeQueryId = result.query_id;
            
            // LocalStorage'a kaydet
            localStorage.setItem('queryHistory', JSON.stringify(this.state.queries));
            
            // Yan menüyü güncelle
            this.updateQueryList();
            
            // Sonuçları göster
            this.displayResults(result);
            
        } catch (error) {
            this.showError('İstek işlenirken bir hata oluştu: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    },
    
    updateProgress: function(percentage, status) {
        this.progressContainer.style.display = 'block';
        this.progressBar.style.width = percentage + '%';
        this.progressBar.setAttribute('aria-valuenow', percentage);
        this.progressBar.textContent = percentage + '%';
        
        const statusKey = this.getStatusKeyForPercentage(percentage);
        const statusText = this.getTranslation(statusKey);
        
        const statusBadges = this.progressStatus.querySelectorAll('.badge');
        statusBadges.forEach(badge => {
            if (badge.getAttribute('data-lang') === this.state.language) {
                badge.textContent = statusText;
                badge.style.display = '';
            } else {
                badge.style.display = 'none';
            }
        });
        
        // Renk değişimi
        if (percentage < 30) {
            this.progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-info';
        } else if (percentage < 60) {
            this.progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-primary';
        } else if (percentage < 90) {
            this.progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-warning';
        } else {
            this.progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-success';
        }
    },
    
    // İlerleme yüzdesine göre durum metni anahtarını belirle
    getStatusKeyForPercentage: function(percentage) {
        if (percentage <= 10) return 'preparing';
        if (percentage <= 30) return 'connecting';
        if (percentage <= 50) return 'analyzing';
        if (percentage <= 70) return 'searchingRefs';
        if (percentage <= 90) return 'verifyingRefs';
        if (percentage < 100) return 'preparingResults';
        return 'completed';
    },
    
    setLoading: function(isLoading) {
        if (isLoading) {
            this.submitText.disabled = true;
            this.loadingIndicator.style.display = 'inline-block';
            
            // İşleniyor metnini dil durumuna göre güncelleyelim
            const processingText = this.getTranslation('processing');
            const spans = this.submitText.querySelectorAll('[data-lang]');
            spans.forEach(span => {
                if (span.getAttribute('data-lang') === this.state.language) {
                    span.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i> ${processingText}`;
                }
            });
        } else {
            this.submitText.disabled = false;
            this.loadingIndicator.style.display = 'none';
            
            // Normal metne geri dönelim
            const scanText = this.getTranslation('scanning');
            const spans = this.submitText.querySelectorAll('[data-lang]');
            spans.forEach(span => {
                if (span.getAttribute('data-lang') === this.state.language) {
                    span.innerHTML = `<i class="fas fa-search me-2"></i> ${scanText}`;
                }
            });
        }
    },
    
    showError: function(message) {
        this.errorAlert.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${message}`;
        this.errorAlert.style.display = 'block';
        
        // Hata alanına kaydır
        this.errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    
    initTooltips: function() {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    },
    
    copyProcessedText: function() {
        const textToCopy = this.processedText.innerText;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                this.showAlert(this.getTranslation('textCopied'), 'success');
            })
            .catch(err => {
                console.error('Kopyalama hatası:', err);
                this.showAlert(this.getTranslation('textCopyError'), 'danger');
            });
    },
    
    processText: async function(text, maxReferences, factCheckLevel, modelType, apiKey) {
        try {
            this.updateProgress(10, 'AI ile iletişim kuruluyor...');
            
            const response = await fetch('/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'text': text,
                    'max_references': maxReferences,
                    'fact_check_level': factCheckLevel,
                    'model_type': modelType,
                    'api_key': apiKey
                })
            });

            this.updateProgress(30, 'Metin analiz ediliyor...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.updateProgress(50, 'Referanslar aranıyor...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("API yanıtı JSON formatında değil!");
            }

            this.updateProgress(70, 'Referanslar doğrulanıyor...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            const responseText = await response.text();
            console.log("Ham API yanıtı:", responseText);

            this.updateProgress(90, 'Sonuçlar hazırlanıyor...');
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                const result = JSON.parse(responseText);
                this.updateProgress(100, 'Tamamlandı!');
                await new Promise(resolve => setTimeout(resolve, 500));
                this.progressContainer.style.display = 'none';
                return result;
            } catch (parseError) {
                console.error('JSON ayrıştırma hatası:', parseError);
                console.error('Ayrıştırılamayan yanıt:', responseText);
                throw new Error('API yanıtı geçerli bir JSON formatında değil');
            }
        } catch (error) {
            console.error('API isteği sırasında hata:', error);
            this.progressContainer.style.display = 'none';
            throw error;
        }
    },
    
    displayResults: function(results) {
        if (!results) return;
        
        // İşlenmiş metni göster
        if (results.processed_text) {
            this.processedText.innerHTML = results.processed_text.replace(/\n/g, '<br>');
        } else {
            this.processedText.innerText = '';
        }
        
        // Bibliyografyayı göster
        if (results.bibliography && results.bibliography.length > 0) {
            let bibliographyHTML = '<div class="bibliography-container">';
            
            results.bibliography.forEach((item, index) => {
                const isVerified = item.verified === true;
                const citation = item.citation || '';
                const verificationClass = isVerified ? 'verified' : 'unverified';
                const verificationIcon = isVerified ? 
                    '<i class="fas fa-check-circle text-success" title="Doğrulanmış Referans"></i>' : 
                    '<i class="fas fa-exclamation-circle text-warning" title="Doğrulanamamış Referans"></i>';
                
                // Başlık uyuşmazlığı veya diğer kritik hatalar için özel class ata
                let itemClass = `bibliography-item ${verificationClass} mb-3`;
                let hasTitleMismatch = false;
                
                if (item.verification_message && item.verification_message.includes("makale ile DOI'deki makale uyuşmuyor")) {
                    itemClass += ' title-mismatch';
                    hasTitleMismatch = true;
                }
                
                bibliographyHTML += `
                    <div class="${itemClass}">
                        <div class="d-flex align-items-start">
                            <div class="me-2">${hasTitleMismatch ? 
                                '<i class="fas fa-exclamation-triangle text-danger" title="Başlık Uyuşmazlığı!"></i>' : 
                                verificationIcon}</div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="fw-bold">[${index + 1}]</div>
                                    <div class="verification-status small">
                                        ${isVerified ? 
                                            '<span class="badge bg-success">Doğrulanmış</span>' : 
                                            hasTitleMismatch ? 
                                                '<span class="badge bg-danger">KRİTİK HATA</span>' : 
                                                '<span class="badge bg-warning text-dark">Doğrulanamamış</span>'}
                                    </div>
                                </div>
                                <div class="citation-text">${citation}</div>
                            </div>
                        </div>
                `;
                
                // DOI bilgisi varsa göster
                if (item.doi) {
                    bibliographyHTML += `
                        <div class="mt-2">
                            <small class="text-muted">DOI: <a href="https://doi.org/${item.doi}" target="_blank">${item.doi}</a></small>
                        </div>
                    `;
                }
                
                // Başlık uyuşmazlığı varsa, uyarı göster
                if (hasTitleMismatch) {
                    bibliographyHTML += `
                        <div class="alert alert-danger mt-2">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>Kritik Hata:</strong> Bu referans kullanılamaz çünkü referans metni ve DOI farklı makalelere işaret ediyor.
                            ${item.verification_detail ? `<div class="mt-1 small">${item.verification_detail}</div>` : ''}
                        </div>
                    `;
                }
                
                // Makale bilgileri varsa göster
                if (item.article_data) {
                    // Atıf sayısı bilgisini kontrol et ve göster
                    const citationCount = item.article_data.citation_count || 0;
                    const citationBadgeClass = citationCount > 50 ? 'bg-success' : (citationCount > 10 ? 'bg-primary' : 'bg-secondary');
                    
                    bibliographyHTML += `
                        <div class="article-details mt-3">
                            <div><i class="fas fa-book text-muted me-1"></i> <strong>${this.getTranslation('articleTitle')}:</strong> ${item.article_data.title || this.getTranslation('notSpecified')}</div>
                            <div><i class="fas fa-newspaper text-muted me-1"></i> <strong>${this.getTranslation('journal')}:</strong> ${item.article_data.journal || this.getTranslation('notSpecified')}</div>
                            <div><i class="fas fa-calendar-alt text-muted me-1"></i> <strong>${this.getTranslation('publishDate')}:</strong> ${item.article_data.published_date || this.getTranslation('notSpecified')}</div>
                            <div><i class="fas fa-quote-right text-muted me-1"></i> <strong>${this.getTranslation('citationCount')}:</strong> 
                                <span class="badge ${citationBadgeClass}">${citationCount}</span>
                            </div>
                    `;
                    
                    // Referans sayısı bilgisi varsa göster
                    if (item.article_data.reference_count) {
                        bibliographyHTML += `
                            <div><i class="fas fa-list-ul text-muted me-1"></i> <strong>${this.getTranslation('referenceCount')}:</strong> ${item.article_data.reference_count}</div>
                        `;
                    }
                    
                    bibliographyHTML += `</div>`;
                }
                
                // Referansın doğrulama mesajı varsa göster (başlık uyuşmazlığı durumunda zaten gösterildiği için tekrar gösterme)
                if (item.verification_message && !hasTitleMismatch) {
                    bibliographyHTML += `
                        <div class="mt-2 small">
                            <i class="fas fa-info-circle me-1"></i> ${item.verification_message}
                        </div>
                    `;
                }
                
                // Relevance score varsa göster
                if (item.relevance_score) {
                    const relevanceClass = item.relevance_score > 70 ? 'text-success' : 
                                        (item.relevance_score > 40 ? 'text-primary' : 'text-muted');
                    bibliographyHTML += `
                        <div class="mt-2 small ${relevanceClass}">
                            <i class="fas fa-bullseye me-1"></i> ${this.getTranslation('relevanceScore')}: ${item.relevance_score}/100
                        </div>
                    `;
                }
                
                bibliographyHTML += `</div>`;
            });
            
            bibliographyHTML += '</div>';
            this.bibliography.innerHTML = bibliographyHTML;
        } else {
            this.bibliography.innerHTML = `<div class="alert alert-info">${this.getTranslation('noBibliography')}</div>`;
        }
        
        // Sonuç bölümünü göster
        this.resultsSection.style.display = 'block';
        
        // Sonuçlara kaydır
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // İlerleme çubuğunu kapat
        this.progressContainer.style.display = 'none';
    },
    
    renderBibliography: function(bibliography) {
        const bibliographyEl = this.bibliography;
        bibliographyEl.innerHTML = '';
        
        if (bibliography && bibliography.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'bibliography-list';
            
            bibliography.forEach(item => {
                const li = document.createElement('li');
                li.className = 'bibliography-item';
                
                if (typeof item === 'object' && item !== null) {
                    if (item.citation) {
                        this.renderCitationItem(item, li);
                    } else {
                        li.innerHTML = `<code>${JSON.stringify(item)}</code>`;
                    }
                } else {
                    li.innerHTML = item;
                }
                
                ul.appendChild(li);
            });
            
            bibliographyEl.appendChild(ul);
        } else {
            bibliographyEl.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>Bibliyografya bulunamadı.</div>';
        }
    },
    
    renderCitationItem: function(item, container) {
        // Güvenilirlik skoru (demo için)
        const reliabilityScore = item.verified ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 30) + 20;
        
        // Referans kartı başlığı
        const refHeader = document.createElement('div');
        refHeader.className = 'd-flex justify-content-between align-items-start mb-2';
        
        const citeDiv = document.createElement('div');
        citeDiv.className = 'flex-grow-1';
        citeDiv.innerHTML = `<strong>${item.citation}</strong>`;
        
        const badgeDiv = document.createElement('div');
        badgeDiv.className = 'ms-2';
        
        if (item.verified === true) {
            badgeDiv.innerHTML = `<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Doğrulanmış</span>`;
        } else if (item.verified === false) {
            badgeDiv.innerHTML = `<span class="badge bg-danger"><i class="fas fa-exclamation-circle me-1"></i>Doğrulanmamış</span>`;
            container.style.borderLeft = '3px solid #dc3545';
            container.style.paddingLeft = '12px';
            container.style.backgroundColor = '#fff8f8';
        }
        
        refHeader.appendChild(citeDiv);
        refHeader.appendChild(badgeDiv);
        container.appendChild(refHeader);
        
        // DOI ve Doğrulama bilgisi
        if (item.doi) {
            const doiDiv = document.createElement('div');
            doiDiv.className = 'mt-2';
            doiDiv.innerHTML = `<div class="small">
                <i class="fas fa-link text-muted me-1"></i>
                <strong>DOI:</strong> <a href="https://doi.org/${item.doi}" target="_blank" class="text-decoration-none">${item.doi}</a>
            </div>`;
            
            if (item.verification_message) {
                doiDiv.innerHTML += `<div class="small ${item.verified ? 'text-success' : 'text-danger'} mt-1">
                    <i class="fas fa-info-circle me-1"></i> ${item.verification_message}
                </div>`;
            }
            
            container.appendChild(doiDiv);
        }
        
        // Güvenilirlik göstergesi
        const reliabilityDiv = document.createElement('div');
        reliabilityDiv.className = 'verification-scale';
        reliabilityDiv.innerHTML = `
            <div class="d-flex justify-content-between">
                <small>Güvenilirlik Skoru:</small>
                <small><strong>${reliabilityScore}%</strong></small>
            </div>
            <div class="progress verification-progress">
                <div class="progress-bar ${reliabilityScore > 70 ? 'bg-success' : reliabilityScore > 40 ? 'bg-warning' : 'bg-danger'}" 
                    role="progressbar" style="width: ${reliabilityScore}%" 
                    aria-valuenow="${reliabilityScore}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
        `;
        container.appendChild(reliabilityDiv);
        
        // Makale bilgileri varsa göster
        if (item.article_data) {
            const articleDiv = document.createElement('div');
            articleDiv.className = 'article-details mt-3';
            articleDiv.innerHTML = `
                <div><i class="fas fa-book text-muted me-1"></i> <strong>Başlık:</strong> ${item.article_data.title || 'Belirtilmemiş'}</div>
                <div><i class="fas fa-newspaper text-muted me-1"></i> <strong>Dergi:</strong> ${item.article_data.journal || 'Belirtilmemiş'}</div>
                <div><i class="fas fa-calendar-alt text-muted me-1"></i> <strong>Yayınlanma:</strong> ${item.article_data.published_date || 'Belirtilmemiş'}</div>
            `;
            container.appendChild(articleDiv);
        }
    }
};

// DOM yüklendiğinde uygulamayı başlat
document.addEventListener('DOMContentLoaded', function() {
    AppModule.init();
    
    // İlk yüklendiğinde API anahtarı kontrolü yap
    const apiKey = localStorage.getItem('deepseekApiKey');
    if (!apiKey) {
        // Kullanıcıyı API anahtarı girmeye yönlendir
        setTimeout(() => {
            const apiKeyModal = new bootstrap.Modal(document.getElementById('apiKeyModal'));
            apiKeyModal.show();
        }, 1000);
    }
    
    // Toast container oluştur
    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
}); 