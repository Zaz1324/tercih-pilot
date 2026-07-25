# Tercih Pilot

Tercih Pilot, üniversite ve bölüm adaylarını değerlendirmek, karşılaştırmak ve nihai tercih sırasını oluşturmak için geliştirilmiş yerel bir React uygulamasıdır.

Veriler yalnızca tarayıcının `LocalStorage` alanında tutulur. Uygulamada kalıcı backend, kullanıcı hesabı veya bulut servisi yoktur. Üniversiteler ekranı açıldığında YÖK Atlas filtre seçenekleri hazırlanır; kullanıcı isterse filtresiz tüm kayıtları çekebilir veya önce filtrelerle listeyi daraltabilir.

## Özellikler

- Toplam kayıt, en yüksek puan, profesör ortalaması ve öne çıkan şehir istatistikleri
- Ayrı profil sekmesinde yalnızca aday ismini yerel olarak saklama
- Üniversite/program ekleme, düzenleme, detay görüntüleme ve onaylı silme
- Filtresiz tüm YÖK Atlas kayıtlarını veya filtreli eşleşen üniversite ve programları çekme
- YÖK Atlas URL'si veya program koduyla tek programı şehir, başarı sırası, burs/ücret ve akademisyen bilgileriyle içe alma
- Üniversite, bölüm, şehir ve imkânlarda arama
- Program/bölüm, şehir, üniversite türü ve üniversite için arama odaklı çoklu seçim filtreleri
- Devlet, vakıf, KKTC, yurtdışı kamu ve yurtdışı vakıf türlerini birlikte seçebilme
- Durum ve başarı sırası aralığı filtreleri
- Öneri puanı, genel puan, başarı sırası, öğrenim ücreti ve üniversite adına göre sıralama
- Program detayında YÖK Atlas'ın döndürdüğü yıllara göre başarı sırası geçmişi
- Program detayında YÖK Akademik üzerinden bölüm akademik kadrosunu talep anında çekme
- Akademisyene tıklayınca YÖK Akademik özgeçmişini özet kartlar, timeline ve proje/yayın bölümleriyle gösterme
- Dinamik imkân etiketleri
- Birden fazla profesör ekleme, silme, puanlama ve not alma
- 2-4 programı yan yana karşılaştırma ve iyi değerleri vurgulama
- Tercih listesine ekleme, listeden çıkarma ve yukarı/aşağı taşıma
- Genel puana veya başarı sırasına göre otomatik tercih sıralama
- Elenen kayıtları tercih listesinde gizleme
- JSON dışa aktarma ve doğrulamalı JSON içe aktarma
- Tüm verileri onay penceresiyle silme
- 5 örnek kayıt içeren demo veri seti
- Masaüstü ve mobil ekranlara uyumlu koyu arayüz

## Teknolojiler

- Vite
- React
- TypeScript
- Tailwind CSS
- lucide-react
- LocalStorage

## Kurulum

Bilgisayarda Node.js `20.19+` veya `22.12+` sürümünün kurulu olması gerekir.

```bash
cd /home/uzer/Desktop/tercih-pilot
npm install
npm run dev
```

Vite terminalde yerel adresi gösterecektir. Varsayılan adres:

```text
http://127.0.0.1:5173
```

## Üretim Derlemesi

```bash
npm run build
npm run preview
```

Derlenen dosyalar `dist/` klasörüne yazılır.

## YÖK Atlas'tan Veri Alma

Üniversiteler ekranı açıldığında uygulama YÖK Atlas'ın program, şehir ve üniversite seçeneklerini alır. Kullanıcı `Atlas'ı Getir` dediğinde filtre yoksa tüm kayıtlar, filtre varsa yalnızca eşleşen kayıtlar sayfa sayfa çekilir. Bu listede:

- Tüm kayıtlar başarı sırasına göre sıralanabilir.
- Program/bölüm, şehir, tercih durumu, devlet/vakıf/KKTC/yurtdışı türleri, üniversite ve başarı sırası aralığıyla filtreleme yapılabilir.
- Vakıf programlarında burs oranı, tam ücret ve ödenecek ücret kart ve detay ekranlarında görünür.
- Program detayına basıldığında YÖK Atlas'ın resmi API'de döndürdüğü yıl geçmişi gösterilir. Güncel 2026 yanıtında mevcut yıl ve önceki 3 yıl alanı vardır; ileride beşinci yıl alanı dönerse uygulama onu da otomatik gösterir.
- Program detayına basıldığında bölümün YÖK Akademik kadrosu ayrıca çekilir. Çok sayfalı YÖK Akademik sonuçları yerel proxy tarafından birleştirilir.
- Akademisyen kartına basıldığında ilgili YÖK Akademik profil sayfası ve bağlantılı yayın/proje sayfaları çekilerek özgeçmiş detayı gösterilir.

Üniversiteler ekranındaki `Kodla / Manuel Ekle` düğmesi yeni kayıt formunu açar. Forma YÖK Atlas detay linki, eski `lisans.php?y=...` linki veya sayısal program kodu girildiğinde:

- Program adı, üniversite, şehir, başarı sırası, taban puan ve kontenjan bilgileri YÖK Atlas API'sinden alınır.
- Vakıf/KKTC programlarında burs oranı, tam ücret ve ödenecek ücret hesaplanır.
- Bölüm akademisyenleri YÖK Akademik yönlendirmesinden okunup akademik kadro listesine eklenir.
- Atlas ve YÖK Akademik kaynak linkleri kayıt detayında saklanır.

Bu akış CORS ve YÖK Akademik oturum yönlendirmeleri nedeniyle `npm run dev` sırasında çalışan yerel Vite proxy uçlarını kullanır.

## Veri Saklama ve Yedekleme

Kayıtlar `tercih-pilot:data:v1` anahtarıyla tarayıcının LocalStorage alanında saklanır. Tarayıcı verilerini temizlemek kayıtları da silebileceği için Ayarlar ve Veri Yedekleme ekranından düzenli olarak JSON yedeği alınması önerilir.

JSON içe aktarma işlemi mevcut verilerin yerini alır. Uygulama dosyayı uygulamadan önce biçimini ve zorunlu kayıt alanlarını kontrol eder, ardından onay ister.

## Öneri Puanı

Her program için 100 üzerinden gösterilen öneri puanı şu ağırlıklarla hesaplanır:

- Genel tercih puanı: `%50`
- Ortalama profesör puanı: `%30`
- İmkân sayısı: `%20`

Profesör puanı 10 üzerinden 100'lük ölçeğe dönüştürülür. İmkân katkısı 8 etikette en yüksek değere ulaşır.

## Proje Yapısı

```text
src/
├── components/       Ortak arayüz, form ve modal bileşenleri
├── contexts/         Üniversite verisi ve bildirim yönetimi
├── data/             Demo kayıtlar
├── pages/            Altı ana uygulama ekranı
├── types/            TypeScript veri modelleri
├── utils/            Depolama, puanlama ve JSON yardımcıları
├── App.tsx
├── index.css
└── main.tsx
```

## Gizlilik

Kayıtlar tarayıcı dışına otomatik gönderilmez. Üniversiteler ekranında yalnızca resmi YÖK Atlas ve YÖK Akademik kaynaklarına okuma isteği yapılır. Kullanıcının kendi kaydettiği tercih havuzu, notları ve düzenlemeleri LocalStorage içinde kalır. İndirilen font ve paketler uygulama derlemesinin yerel parçalarıdır.
