from flask import Flask, render_template, request, jsonify, session
import os
from dotenv import load_dotenv
from openai import OpenAI
import json
import requests
import re
import uuid
from datetime import datetime

# .env dosyasından çevre değişkenlerini yükle
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)

# API anahtarlarını al - artık bunları doğrudan kullanmayacağız
# DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
# DeepSeek API URL
DEEPSEEK_API_URL = "https://api.deepseek.com"

@app.route('/')
def index():
    return render_template('index.html')

def verify_doi(doi):
    """DOI'yi doğrula ve bilgileri getir"""
    try:
        # DOI API'si üzerinden doğrulama yapar
        url = f"https://doi.org/api/handles/{doi}"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('responseCode') == 1:
                # DOI formatı doğru, şimdi içeriğini kontrol edelim
                try:
                    # Crossref API'sini kullanarak DOI'nin gerçek bir makaleye ait olup olmadığını kontrol et
                    crossref_url = f"https://api.crossref.org/works/{doi}"
                    crossref_response = requests.get(crossref_url, timeout=5)
                    
                    if crossref_response.status_code == 200:
                        crossref_data = crossref_response.json()
                        
                        # Makale başlığı ve diğer detaylar var mı kontrol et
                        if crossref_data.get('message') and crossref_data['message'].get('title'):
                            # Atıf sayısını Crossref'ten al (is-referenced-by-count veya references-count alanları)
                            citation_count = crossref_data['message'].get('is-referenced-by-count', 0)
                            reference_count = crossref_data['message'].get('references-count', 0)
                            
                            # URL erişilebilirliği kontrolü - DOI bağlantısı aktif mi?
                            doi_url = f"https://doi.org/{doi}"
                            try:
                                doi_status_response = requests.head(doi_url, timeout=3, allow_redirects=True)
                                doi_accessible = doi_status_response.status_code < 400
                            except:
                                doi_accessible = False
                            
                            return {
                                "verified": True,
                                "message": "DOI doğrulandı ve makale bilgileri bulundu",
                                "data": data,
                                "doi_accessible": doi_accessible,
                                "article_data": {
                                    "title": crossref_data['message'].get('title', [''])[0],
                                    "journal": crossref_data['message'].get('container-title', [''])[0],
                                    "publisher": crossref_data['message'].get('publisher', ''),
                                    "published_date": crossref_data['message'].get('published', {}).get('date-parts', [['']])[0][0],
                                    "citation_count": citation_count,
                                    "reference_count": reference_count
                                }
                            }
                        else:
                            return {
                                "verified": False,
                                "message": "DOI formatı doğru, ancak makale bilgileri bulunamadı",
                                "data": data
                            }
                    else:
                        # Crossref başarısız olursa, Unpaywall'ı deneyelim
                        unpaywall_url = f"https://api.unpaywall.org/v2/{doi}?email=test@example.com"
                        unpaywall_response = requests.get(unpaywall_url, timeout=5)
                        
                        if unpaywall_response.status_code == 200:
                            unpaywall_data = unpaywall_response.json()
                            if unpaywall_data.get('title') and unpaywall_data.get('journal_name'):
                                # Doğrudan DOI URL'sini kontrol edelim
                                doi_url = f"https://doi.org/{doi}"
                                try:
                                    doi_status_response = requests.head(doi_url, timeout=3, allow_redirects=True)
                                    doi_accessible = doi_status_response.status_code < 400
                                except:
                                    doi_accessible = False
                                
                                # Semantik Scholar API'sini kullanarak atıf sayısını almaya çalışalım
                                semantic_citation_count = 0
                                try:
                                    semantic_url = f"https://api.semanticscholar.org/v1/paper/{doi}"
                                    semantic_response = requests.get(semantic_url, timeout=5)
                                    if semantic_response.status_code == 200:
                                        semantic_data = semantic_response.json()
                                        semantic_citation_count = semantic_data.get('citationCount', 0)
                                except:
                                    pass  # Semantic Scholar API başarısız olursa sessizce devam et
                                
                                return {
                                    "verified": True,
                                    "message": "DOI doğrulandı ve makale bilgileri Unpaywall'dan bulundu",
                                    "data": data,
                                    "doi_accessible": doi_accessible,
                                    "article_data": {
                                        "title": unpaywall_data.get('title', ''),
                                        "journal": unpaywall_data.get('journal_name', ''),
                                        "publisher": unpaywall_data.get('publisher', ''),
                                        "published_date": unpaywall_data.get('year', ''),
                                        "citation_count": semantic_citation_count,
                                        "reference_count": 0  # Unpaywall bu bilgiyi sağlamıyor
                                    }
                                }
                            else:
                                return {
                                    "verified": False,
                                    "message": "DOI var, ancak makale bilgileri doğrulanamadı",
                                    "data": data
                                }
                        else:
                            # Doğrudan DOI.org URL'sini kontrol edelim
                            direct_url = f"https://doi.org/{doi}"
                            direct_response = requests.head(direct_url, timeout=5, allow_redirects=True)
                            
                            if direct_response.status_code == 200:
                                # Google Scholar kontrolü (sadece başlıkla eşleşme var mı?)
                                # Not: Google Scholar API resmi değil ve genellikle rate-limit sorunları yaşatır
                                return {
                                    "verified": True,
                                    "message": "DOI URL'si erişilebilir",
                                    "data": data,
                                    "doi_accessible": True
                                }
                            else:
                                return {
                                    "verified": False,
                                    "message": f"DOI erişilebilir değil: HTTP {direct_response.status_code}",
                                    "data": data,
                                    "doi_accessible": False
                                }
                except Exception as e:
                    # İkincil doğrulama sırasında hata oluştu
                    return {
                        "verified": False,
                        "message": f"DOI formatı doğru ama makale doğrulanırken hata: {str(e)}",
                        "data": data
                    }
            else:
                return {
                    "verified": False,
                    "message": "DOI bulunamadı veya geçersiz",
                    "data": data
                }
        else:
            return {
                "verified": False,
                "message": f"DOI doğrulama hatası: {response.status_code}",
                "data": None
            }
    except Exception as e:
        return {
            "verified": False,
            "message": f"DOI doğrulama sırasında hata: {str(e)}",
            "data": None
        }

def extract_doi_from_reference(reference):
    """Referans metninden DOI çıkarmaya çalışır"""
    # DOI formatı için regex
    doi_pattern = r'10\.\d{4,9}/[-._;()/:A-Z0-9]+'
    match = re.search(doi_pattern, reference, re.IGNORECASE)
    if match:
        return match.group(0)
    return None

def extract_authors_year(citation):
    """Referans metninden yazar ve yıl bilgisini çıkarır"""
    try:
        # Tipik APA formatı: "Smith, J., & Doe, R. (2020). Başlık..."
        # Parantez içindeki yılı bul
        year_match = re.search(r'\((\d{4})\)', citation)
        year = year_match.group(1) if year_match else "N/A"
        
        # Yazarları bul (parantezden önce)
        authors_part = citation.split('(')[0].strip()
        
        # İki veya daha fazla yazar varsa
        if "&" in authors_part:
            if "," in authors_part.split("&")[0]:
                # Birden fazla yazar: "Smith, J., Johnson, K., & Doe, R."
                last_authors = [author.strip().split(',')[0] for author in authors_part.split('&')]
                first_author = last_authors[0].split(',')[0]
                return f"{first_author} et al.", year
            else:
                # İki yazar: "Smith & Doe"
                authors = [author.strip().split(',')[0] for author in authors_part.split('&')]
                return f"{authors[0]} & {authors[1]}", year
        else:
            # Tek yazar: "Smith, J."
            author = authors_part.split(',')[0]
            return author, year
    except Exception as e:
        print(f"Yazar/yıl çıkarma hatası: {str(e)}")
        return "Unknown", "0000"

def enrich_text_with_references(text, bibliography):
    """Metni referanslarla zenginleştirir"""
    enriched_text = text
    
    # Tüm olası yer işaretlerini içeren anahtar kelimeler listesi
    keywords = [
        "monolayer", "kültür", "yansıtmaz", "kompleks", "hipoksik", "hücre", 
        "miyokardiyal", "iskemi", "kalp", "doku", "karmaşık", "fizyopatolojik"
    ]
    
    # Metni cümlelere ayır
    sentences = re.split(r'(?<=[.!?])\s+', enriched_text)
    
    # Her bir biblio öğesi için, ilgili anahtar kelimelerden sonra gelen cümleye referans ekle
    for ref in bibliography:
        if isinstance(ref, dict) and "citation" in ref:
            # Referans bilgilerini çıkar
            author, year = extract_authors_year(ref["citation"])
            ref_text = f"({author}, {year})"
            
            # İlgili anahtar kelimeleri içeren ve referans içermeyen ilk cümleyi bul
            for i, sentence in enumerate(sentences):
                # Eğer cümle zaten referans içeriyorsa atla
                if "(" in sentence and ")" in sentence and re.search(r'\(\w+(\s*et al\.)?(\s*&\s*\w+)?,\s*\d{4}\)', sentence):
                    continue
                
                # Anahtar kelimelerden herhangi birini içeriyor mu?
                for keyword in keywords:
                    if keyword.lower() in sentence.lower():
                        # Cümleyi güncelle, noktalama işaretinden önce referans ekle
                        punct_match = re.search(r'[.!?]$', sentence)
                        if punct_match:
                            punct = punct_match.group(0)
                            sentences[i] = sentence[:-1] + " " + ref_text + punct
                        else:
                            sentences[i] = sentence + " " + ref_text
                        
                        # İşlemi durdur (bir referansı sadece bir kez ekle)
                        keywords.remove(keyword)  # bu anahtarı tekrar kullanma
                        break  # iç döngüden çık
                
                # Eğer referans eklendiyse dış döngüden de çık
                if "(" in sentences[i] and ")" in sentences[i]:
                    break
    
    # Cümleleri birleştir
    enriched_text = " ".join(sentences)
    return enriched_text

def extract_title_from_citation(citation):
    """Alıntı metninden başlık bilgisini çıkarır"""
    try:
        # APA formatında başlık genellikle (yıl). ile nokta arasında yer alır
        title_match = re.search(r'\(\d{4}\)\.\s+([^\.]+)', citation)
        if title_match:
            return title_match.group(1).strip()
        
        # Başka formatlarda başlık bulma denemesi
        parts = citation.split('.')
        if len(parts) > 1:
            # İlk tarih referansından sonraki parça genellikle başlıktır
            for i, part in enumerate(parts):
                if re.search(r'\(\d{4}\)', part) and i + 1 < len(parts):
                    return parts[i + 1].strip()
        
        return None
    except Exception as e:
        print(f"Başlık çıkarma hatası: {str(e)}")
        return None

def are_titles_similar(title1, title2, threshold=50):
    """İki başlık arasındaki benzerliği değerlendirir
    Birkaç farklı benzerlik metriği kullanarak daha güvenilir sonuç elde edilir
    """
    if not title1 or not title2:
        return False
    
    # Metinleri normalize et (küçük harf, noktalama işaretlerini kaldır)
    def normalize_text(text):
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        return text
    
    norm_title1 = normalize_text(title1)
    norm_title2 = normalize_text(title2)
    
    # Çok kısa metinleri kontrol et
    if len(norm_title1) < 10 or len(norm_title2) < 10:
        # Kısa metinlerde tam eşleşme ara
        return norm_title1 == norm_title2
    
    # Kelime örtüşmesi - ortak kelimelerin yüzdesini hesapla
    words1 = set(norm_title1.split())
    words2 = set(norm_title2.split())
    
    if not words1 or not words2:
        return False
    
    # Ortak kelime sayısı / toplam benzersiz kelime sayısı
    word_overlap = len(words1.intersection(words2)) / len(words1.union(words2)) * 100
    
    # Levenshtein mesafesi - yazım hataları için tolerans sağlar
    # Maksimum düzenleme mesafesi, kısa başlığın uzunluğunun %30'u olmalı
    import difflib
    seq_match = difflib.SequenceMatcher(None, norm_title1, norm_title2)
    similarity_ratio = seq_match.ratio() * 100
    
    # İki veya daha fazla metriğin eşiği geçmesi gerekiyor
    return word_overlap >= threshold or similarity_ratio >= threshold

def process_with_deepseek(text, max_references=5, fact_check_level='standard', model_type='deepseek-chat', api_key=None):
    """Deepseek API'sini kullanarak metni işler ve referansları çıkarır."""
    try:
        # Eğer kullanıcı API anahtarı sağlamışsa onu kullan, yoksa env'den al
        api_key_to_use = api_key or os.getenv('DEEPSEEK_API_KEY')
        
        if not api_key_to_use:
            raise Exception("DeepSeek API anahtarı bulunamadı. Lütfen ayarlar menüsünden API anahtarınızı girin.")

        client = OpenAI(
            api_key=api_key_to_use,
            base_url="https://api.deepseek.com"
        )

        print(f"API isteği gönderiliyor: DeepSeek API, Model: {model_type}, Referans sayısı: {max_references}, Doğrulama seviyesi: {fact_check_level}")
        
        temperature = 0.7
        if fact_check_level == 'thorough':
            temperature = 0.2  # Daha düşük sıcaklık daha deterministik sonuçlar verir
        elif fact_check_level == 'basic':
            temperature = 0.8

        # Fact check seviyesine göre ek talimatlar
        fact_check_instructions = {
            'basic': "Temel seviyede doğrulama yeterlidir. Genel olarak DOI'nin geçerli bir formata sahip olduğunu kontrol edin.",
            'standard': "Standart seviyede doğrulama yapın. DOI'nin geçerli olduğundan ve erişilebilir olduğundan emin olun. PubMed, Google Scholar veya Semantic Scholar gibi akademik arama motorlarında aranan anahtar kelimeleri kontrol edin.",
            'thorough': "Çok kapsamlı ve detaylı doğrulama yapın. Tüm kaynakların gerçekliğinden %100 emin olun. DOI'nin geçerli olduğunu, makale başlığının ve yazarların metinle uyumlu olduğunu, makalenin anahtar kelimelerinin metindeki ifadelerle uyumluluğunu kontrol edin. Atıf sayısı yüksek ve saygın dergilerdeki makaleleri tercih edin."
        }
        
        # Deepseek modelini referans tarama için özelleştirilmiş prompt
        prompt = f"""
        Custom AI Talimatı:

        Sen, kullanıcı tarafından girilen bilimsel bir metnin bağlamını derinlemesine analiz edip anlayan bir yapay zekâ asistanısın. Görevin, SADECE GERÇEK VE MEVCUT bilimsel literatürden makaleleri belirlemek. Kesinlikle uydurma, hayal ürünü veya var olmayan makaleler ÖNERMEMELİSİN.

        Sorumlulukların:

        1. Girilen metnin bağlamını ve amacını net şekilde anlamak.
        2. Metindeki ifadelere uyan SADECE GERÇEK VE VAR OLAN literatürdeki makaleleri bulmak. ASLA UYDURMA KAYNAK SUNMA!
        3. Her makale için PubMed, Google Scholar, Web of Science, Semantic Scholar veya Scopus'ta gerçekten VAR OLDUĞUNU ve ERİŞİLEBİLİR olduğunu MUTLAKA doğrula.
        4. Önerdiğin her DOI'nin gerçekten VAR OLDUĞUNU ve erişilebilir olduğunu kontrol et.
        5. DOI'nin makalenin GERÇEK DOI'si olduğundan emin ol. Yanlış DOI bilgisi vermek, tamamen yanlış bir makaleyi referans göstermeye sebep olabilir!
        6. Uydurma veya şüpheli kaynaklar yerine, "kaynak bulunamadı" demeyi tercih et.
        7. Eğer referans bulunamazsa veya emin değilsen, kesinlikle uydurma bir kaynak önerme.
        8. Tam olarak {max_references} adet referans bulmaya çalış. Bu sayıdan fazla referans sunma.

        Özel Kurallar:

        - SADECE gerçek ve doğrulanabilir bilimsel makalelere referans ver. 
        - Makale başlıklarını, yazar isimlerini veya dergi bilgilerini ASLA UYDURMA. Gerçekte var olmayan dergi adları kullanma.
        - Gerçek olmayan veya şüpheli DOI numaraları ASLA PAYLAŞMA.
        - Her referansın gerçekliğinden %100 emin ol. Eğer emin değilsen, o referansı sunma.
        - Şu formatta çalışan gerçek DOI'ler kullan: 10.XXXX/XXXXX (sadece gerçekten var olan DOI'leri kullan)
        - Referansları önermeden önce, bu referansların gerçekten var olduğundan ve erişilebilir olduğundan emin ol.
        - Şüpheye düştüğünde, referans vermekten kaçın. Doğru olmayan referanslar vermek, hiç referans vermemekten çok daha zararlıdır.
        - Her referans için verdiğin DOI'nin, o referans için DOĞRU DOI olduğundan emin ol. DOI'nin işaret ettiği makale ile referans gösterdiğin makale AYNI olmalı.
        - Atıf sayısı yüksek ve saygın dergilerdeki makaleleri tercih et. Yüksek etkili ve çok atıf alan makaleler, bilimsel güvenilirliği artırır.
        - Makale yılı ve bilgilerin güncelliği açısından en güncel makaleleri tercih et, ancak klasik ve temel çalışmaları da gözden kaçırma.
        - {fact_check_instructions.get(fact_check_level, "Standart seviyede doğrulama yapın.")}

        DOI Bulma ve Doğrulama Stratejileri:
        1. Öncelikle Crossref API'sini kullanarak DOI'yi doğrulamaya çalış (https://api.crossref.org/works/[DOI])
        2. Eğer Crossref ile bulunamazsa, Unpaywall API'sini dene (https://api.unpaywall.org/v2/[DOI])
        3. Semantik Scholar ve PubMed gibi diğer akademik veritabanlarında makale başlığını ve yazar adlarını ara
        4. DOI olduğundan şüpheliysen, doğrudan https://doi.org/[DOI] linkini kontrol et
        5. Makalenin gerçek olduğundan emin olmak için atıf sayısını ve derginin etki faktörünü kontrol et
        6. DOI'nin işaret ettiği makale ile önerdiğin referans metnindeki makalenin aynı olduğundan emin ol

        Bu talimatlara harfiyen uyarak mükemmel doğrulukta, bilimsel olarak güvenilir ve SADECE GERÇEK OLAN, DOĞRULANMIŞ bilimsel kaynakları referans olarak sun.

        İşlenecek metin:
        {text}
        
        Yanıtını kesinlikle aşağıdaki JSON formatında ver ve başka bir şey ekleme:
        {{
          "processed_text": "Referanslarla zenginleştirilmiş metin",
          "bibliography": [
            {{
              "citation": "APA formatında tam referans",
              "doi": "referansın DOI numarası (varsa) - SADECE GERÇEKTE VAR OLAN DOI'LER",
              "verified": true/false,
              "verification_sources": ["Doğrulama için kullanılan kaynaklar, örn. 'Crossref', 'PubMed', 'Semantic Scholar'"],
              "relevance_score": 0-100 arasında, bu referansın metin için ne kadar alakalı olduğunu belirten bir skor
            }},
            ...
          ]
        }}
        """
        
        # OpenAI SDK ile istek gönder
        response = client.chat.completions.create(
            model=model_type,
            messages=[
                {"role": "system", "content": "Sen uzman bir akademik referans asistanısın. APA formatını çok iyi biliyorsun. Ayrıca bilimsel literatüre çok hakimsin ve hangi ifadelerin hangi kaynaklar tarafından desteklenebileceğini iyi biliyorsun."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},  # JSON çıktısı formatını zorla
            max_tokens=4000,
            temperature=temperature  # Doğrulama seviyesine göre sıcaklık
        )
        
        try:
            result = json.loads(response.choices[0].message.content)
            print("API yanıtı başarıyla alındı ve JSON'a dönüştürüldü")
            
            # DOI doğrulaması ekle
            if "bibliography" in result and isinstance(result["bibliography"], list):
                validated_bibliography = []
                invalid_references = []
                
                for ref in result["bibliography"]:
                    # Dictionary mi kontrol et
                    if not isinstance(ref, dict):
                        continue
                    
                    # DOI varsa doğrula
                    if "doi" in ref and ref["doi"]:
                        doi_result = verify_doi(ref["doi"])
                        
                        # İlk olarak DOI'nin geçerli olup olmadığını kontrol et
                        if doi_result["verified"]:
                            # Şimdi alıntı metnindeki başlık ile DOI'den alınan başlık tutarlı mı, onu kontrol et
                            citation_title = extract_title_from_citation(ref["citation"])
                            doi_title = None
                            
                            if "article_data" in doi_result and "title" in doi_result["article_data"]:
                                doi_title = doi_result["article_data"]["title"]
                            
                            # Başlıklar benzer mi? Değilse, bu DOI yanlış referans için kullanılmış olabilir
                            titles_match = are_titles_similar(citation_title, doi_title)
                            
                            if titles_match:
                                # Başlıklar eşleşiyor, referans geçerli
                                ref["verified"] = True
                                ref["verification_message"] = "DOI doğrulandı ve makale başlığı ile referans tutarlı."
                                ref["article_data"] = doi_result["article_data"]
                                validated_bibliography.append(ref)
                            else:
                                # Başlıklar eşleşmiyor, referans geçersiz
                                ref["verified"] = False
                                ref["verification_message"] = "UYARI: DOI mevcut, ancak referans gösterilen makale ile DOI'deki makale uyuşmuyor!"
                                
                                if citation_title and doi_title:
                                    ref["verification_detail"] = f"Referans başlığı: '{citation_title}' DOI başlığı: '{doi_title}'"
                                
                                invalid_references.append({
                                    "citation": ref["citation"],
                                    "doi": ref["doi"],
                                    "reason": "Referans metni ile DOI'deki makale başlıkları uyuşmuyor. Yanlış DOI numarası!"
                                })
                        else:
                            # DOI doğrulanamadı
                            ref["verified"] = False
                            ref["verification_message"] = doi_result["message"]
                            
                            invalid_references.append({
                                "citation": ref["citation"],
                                "doi": ref["doi"],
                                "reason": doi_result["message"]
                            })
                    else:
                        # DOI yoksa, Google Scholar veya Semantic Scholar'da arayarak bulmaya çalış
                        ref["verified"] = False
                        ref["verification_message"] = "DOI bilgisi bulunamadı. İkincil kontrol yapılamadı."
                        validated_bibliography.append(ref)
                
                # Eğer geçersiz referanslar varsa ve doğrulama seviyesi yüksekse, yeniden deneme yapalım
                if invalid_references and fact_check_level in ['standard', 'thorough']:
                    print(f"{len(invalid_references)} geçersiz referans bulundu. İkinci bir deneme yapılıyor...")
                    retry_result = retry_with_feedback(text, invalid_references, client, max_references, fact_check_level, api_key)
                    
                    # Retry sonucunu birleştir
                    if "bibliography" in retry_result and isinstance(retry_result["bibliography"], list):
                        # Geçerli referansları koruyalım, geçersizleri yeni sonuçlarla değiştirelim
                        final_bibliography = validated_bibliography.copy()
                        
                        # Yeni referanslardan sadece doğrulanmış olanları ekle
                        for new_ref in retry_result["bibliography"]:
                            if isinstance(new_ref, dict) and new_ref.get("verified", False):
                                # Aynı DOI'ye sahip başka bir referans var mı kontrol et
                                if "doi" in new_ref and any(ref.get("doi") == new_ref["doi"] for ref in final_bibliography):
                                    continue  # Aynı DOI varsa atla
                                
                                final_bibliography.append(new_ref)
                        
                        # Maksimum referans sayısına kadar kesme yap
                        final_bibliography = final_bibliography[:max_references]
                        result["bibliography"] = final_bibliography
                        
                        # Retry'dan gelen işlenmiş metni kullan
                        if "processed_text" in retry_result:
                            result["processed_text"] = retry_result["processed_text"]
                    
                # Referanslar varsa metni zenginleştir
                if result["bibliography"]:
                    result["processed_text"] = enrich_text_with_references(
                        result.get("processed_text", text),
                        result["bibliography"]
                    )
            
            return result
        except json.JSONDecodeError as e:
            print(f"JSON ayrıştırma hatası: {str(e)}")
            print(f"Ham yanıt: {response.choices[0].message.content}")
            return {"error": "API yanıtı JSON formatına dönüştürülemedi"}
            
    except Exception as e:
        print(f"DeepSeek API hatası: {str(e)}")
        return {"error": f"API işlemi sırasında hata oluştu: {str(e)}"}

def retry_with_feedback(text, invalid_references, client, max_references=5, fact_check_level='standard', api_key=None):
    """Geçersiz referanslar hakkında geri bildirim ile tekrar deneme"""
    feedback = "Önceki sonuçlarınızda aşağıdaki UYDURMA referanslar tespit edildi. Lütfen bu referansların yerine GERÇEK ve VAR OLAN akademik makaleleri bulun veya referans vermekten kaçının:\n\n"
    
    for idx, ref in enumerate(invalid_references, 1):
        feedback += f"{idx}. {ref['citation']}\n   DOI: {ref.get('doi', 'Belirtilmemiş')}\n   Sorun: {ref['reason']}\n\n"
    
    # Fact check seviyesine göre sıcaklık ayarı
    temp_settings = {
        'basic': 0.3,
        'standard': 0.2,
        'thorough': 0.1
    }
    temperature = temp_settings.get(fact_check_level, 0.1)
    
    # Geliştirilmiş talimatlarla yeni bir istek gönder
    feedback_prompt = f"""
    UYARI: Önceki yanıtınızda UYDURMA referanslar ve gerçekte VAR OLMAYAN DOI numaraları ürettiniz!
    
    {feedback}
    
    Yeni Talimatlar:
    1. ASLA UYDURMA REFERANS ÜRETMEYİN.
    2. SADECE gerçekte var olan, doğrulanabilir ve erişilebilir akademik makaleler kullanın.
    3. Gerçek olduğundan emin olmadığınız hiçbir makaleyi önermektense, hiç referans vermemeyi tercih edin.
    4. Gerçekliğinden emin olduğunuz referansları PubMed, Google Scholar veya Web of Science'ta arayarak kontrol edin.
    5. İnternette gerçekten erişilebilir ve mevcut olmayan hiçbir makaleyi veya DOI'yi önermemelisiniz.
    6. Tam olarak {max_references} adet referans bulmaya çalış (eğer mümkünse).
    
    Şimdi lütfen aşağıdaki metni SADECE GERÇEK ve VAR OLAN referanslarla analiz edin:
    
    {text}
    """
    
    print("Geçersiz referanslar için geri bildirim gönderiliyor...")
    
    try:
        # Yeni bir istek gönder
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "Sen uzman bir akademik referans asistanısın. SADECE GERÇEK ve DOĞRULANMIŞ makaleleri referans olarak kullanabilirsin."},
                {"role": "user", "content": feedback_prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=4000,
            temperature=temperature  # Doğrulama seviyesine göre sıcaklık
        )
        
        # API yanıtını al
        model_response = response.choices[0].message.content
        
        # Ham model yanıtını göster
        print("Düzeltilmiş Model Yanıtı:", model_response)
        
        # JSON formatındaki yanıtı parse et
        try:
            parsed_response = json.loads(model_response)
            
            # DOI doğrulaması ekle - aynı mantık ile
            updated_bibliography = []
            if "bibliography" in parsed_response and isinstance(parsed_response["bibliography"], list):
                for ref in parsed_response["bibliography"]:
                    if isinstance(ref, dict) and "doi" in ref and ref["doi"]:
                        # DOI varsa doğrula
                        doi_result = verify_doi(ref["doi"])
                        ref["verified"] = doi_result["verified"]
                        ref["verification_message"] = doi_result["message"]
                        
                        # Article data mevcut ise referansa ekle
                        if "article_data" in doi_result:
                            ref["article_data"] = doi_result["article_data"]
                    elif isinstance(ref, str):
                        # Eğer basit bir string ise, onu dictionary formatına çevirelim
                        citation = ref
                        doi = extract_doi_from_reference(ref)
                        verification = {"verified": False, "message": "DOI bulunamadı"}
                        
                        if doi:
                            verification = verify_doi(doi)
                        
                        ref_dict = {
                            "citation": citation,
                            "doi": doi,
                            "verified": verification["verified"],
                            "verification_message": verification["message"]
                        }
                        updated_bibliography.append(ref_dict)
                        continue
                    
                    updated_bibliography.append(ref)
                
                # Eğer bibliography liste içinde stringler vardı ise, onları güncelleyelim
                if updated_bibliography:
                    parsed_response["bibliography"] = updated_bibliography
                
                # Metni referanslarla zenginleştir
                if "processed_text" in parsed_response and parsed_response["bibliography"]:
                    parsed_response["processed_text"] = enrich_text_with_references(
                        parsed_response["processed_text"], 
                        parsed_response["bibliography"]
                    )
            
            # İşlenmiş metne bir not ekleyelim
            parsed_response["processed_text"] = parsed_response.get("processed_text", "") + \
                "\n\n<small><em>Not: Bu metin için otomatik referans taraması ikinci bir gerçeklik kontrolünden geçmiştir.</em></small>"
            
            return parsed_response
            
        except json.JSONDecodeError:
            # Eğer yanıt JSON formatında değilse, ilk yanıtı döndür
            return {
                "processed_text": text,
                "bibliography": [],
                "error": "API düzeltme isteğinde bir sorun oluştu. Lütfen daha sonra tekrar deneyin."
            }
        
    except Exception as e:
        print(f"Geri bildirim sırasında hata oluştu: {str(e)}")
        # İlk yanıtı döndür ama bir hata mesajıyla
        return {
            "processed_text": text,
            "bibliography": [],
            "error": f"Referans doğrulama sırasında bir hata oluştu: {str(e)}"
        }

@app.route('/process', methods=['POST'])
def process():
    try:
        # Gelen veriler
        text = request.form.get('text')
        max_references = request.form.get('max_references', '5')
        fact_check_level = request.form.get('fact_check_level', 'standard')
        model_type = request.form.get('model_type', 'deepseek-chat')
        api_key = request.form.get('api_key')
        
        # Sorgu için benzersiz ID oluştur
        query_id = str(uuid.uuid4())
        
        # Sorgu geçmişi için kısa versiyon
        query_preview = text[:100] + "..." if len(text) > 100 else text
        query_timestamp = datetime.now().strftime('%d.%m.%Y %H:%M')
        
        # Parametrelerin geçerliliğini kontrol et
        try:
            max_references = int(max_references)
            if max_references < 1 or max_references > 20:
                max_references = 5
        except:
            max_references = 5
            
        if fact_check_level not in ['basic', 'standard', 'thorough']:
            fact_check_level = 'standard'
            
        if model_type not in ['deepseek-chat', 'deepseek-coder', 'deepseek-lite', 'mixtral']:
            model_type = 'deepseek-chat'
        
        # API ile işleme
        result = process_with_deepseek(
            text, 
            max_references=max_references, 
            fact_check_level=fact_check_level,
            model_type=model_type,
            api_key=api_key
        )
        
        # Sorgu bilgilerini ekle
        result['query_id'] = query_id
        result['query_preview'] = query_preview
        result['timestamp'] = query_timestamp
        
        return jsonify(result)
    except Exception as e:
        print(f"Hata: {str(e)}")
        return jsonify({
            "error": f"İstek işlenirken bir hata oluştu: {str(e)}"
        }), 500

# API anahtarını doğrulama endpoint'i
@app.route('/verify-api-key', methods=['POST'])
def verify_api_key():
    try:
        api_key = request.form.get('api_key')
        
        if not api_key:
            return jsonify({
                "verified": False,
                "message": "API anahtarı bulunamadı"
            })
        
        # DeepSeek API'sine basit bir istek göndererek anahtarı doğrula
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com"
        )
        
        # Basit bir istek deneme (ayrıntılı model listesi isteği)
        response = client.models.list()
        
        return jsonify({
            "verified": True,
            "message": "API anahtarı başarıyla doğrulandı"
        })
    
    except Exception as e:
        print(f"API anahtarı doğrulama hatası: {str(e)}")
        return jsonify({
            "verified": False,
            "message": f"API anahtarı doğrulanamadı: {str(e)}"
        })

if __name__ == '__main__':
    app.run(debug=True) 