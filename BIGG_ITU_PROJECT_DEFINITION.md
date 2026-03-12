# Eleven — Proje Tanımı (Bigg ITÜ Çekirdek Başvurusu)

## Proje Adı
**Eleven**

### Başvuru formu — İş fikrinin adı
Eleven

### Başvuru formu — İş fikrinin kısa tanımı (max 100 karakter)
CRM ile proje ve görev yönetimini tek platformda birleştiren ekip odaklı SaaS uygulaması.

### Başvuru formu — İş fikrinin özeti (max 1000 karakter)
**Amaç:** Ekiplerin müşteri ilişkileri (CRM), satış süreçleri ve proje–görev yönetimini tek platformda toplaması; veri ve bağlamın dağılmadan kalması.

**Hedefler:** Organizasyon bazlı çok kiracılı SaaS sunmak; kişi, fırsat ve proje verilerini tek yerde tutarak raporlama ve karar alma süreçlerini hızlandırmak. Yol haritasında AI özetleme, bildirimler, finans/fatura kontrolleri, Microsoft Teams entegrasyonu (yoklama, toplantı geçmişi) ve çalışan analizleri ile ürünü derinleştirmek.

**Gerekçe:** Küçük ve orta ölçekli ekipler satış ile proje işlerini genelde ayrı araçlarda yürütüyor; bilgi parçalanıyor, tekrarlar artıyor. Tek platformda hem ilişki hem satış hem proje yönetimi sunan, kurulumu kolay ve ölçeklenebilir bir çözüm pazar ihtiyacına yanıt veriyor. Eleven bu boşluğu doldurmak ve modern teknoloji yığını (Bun, Elysia, Next.js) ile hızlı geliştirme yapmak amacıyla başlatıldı.

### Başvuru formu — Çözüm önerdiğiniz problemler (max 1000 karakter)
- **Veri dağınıklığı:** CRM (kişi, fırsat, satış aşamaları) ile proje ve görevler ayrı araçlarda tutulduğunda müşteri–proje bağlantısı kopuyor; aynı bilgi birden fazla yerde giriliyor ve güncel tek kaynak oluşmuyor.
- **Bağlam kaybı:** Bir kişi veya fırsatla ilgili toplantı, görev ve dosyalar farklı sistemlerde kaldığı için karar alma ve raporlama yavaşlıyor, bilgi tek yerde toplanmıyor.
- **Maliyet ve karmaşıklık:** Büyük kurumsal CRM ve ayrı proje yönetim araçları küçük/orta ekipler için pahalı veya fazla karmaşık; sade, tek abonelikle hem ilişki hem proje yönetimi sunan seçenek sınırlı.
- **Entegrasyon eksikliği:** Satış pipeline’ı ile proje ilerlemesi, fatura/finans ve toplantı katılımı (örn. Teams) tek ekranda görülemiyor; yöneticiler birden fazla rapor ve araç kullanmak zorunda kalıyor.

Eleven bu problemlere tek platformda CRM, proje, görev ve dosya yönetimini birleştirerek; ileride AI özetleme, bildirimler, finans/fatura kontrolleri ve Microsoft Teams entegrasyonu ile yanıt veriyor.

### Başvuru formu — Hedef kitle ve müşteri görüşmeleri (max 1000 karakter)
**Hedef kitle:** Küçük ve orta ölçekli ekipler (5–50 kişi); satış, pazarlama veya müşteri ilişkileri ile birlikte proje ve görev yönetimi yürüten şirketler; tek araçla hem CRM hem proje takibi isteyen girişimler ve KOBİ’ler. Özellikle ajanslar, danışmanlık firmaları, B2B satış ekipleri ve proje bazlı çalışan organizasyonlar.

**Müşteri görüşmeleri:** Potansiyel müşteri görüşmeleri henüz sistematik olarak yapılmadı. Plan: Çekirdek programı sürecinde hedef kitle içinden 10–15 kişiyle (satış/proje yöneticisi, operasyon sorumlusu) yarı yapılandırılmış görüşmeler yapmak; mevcut araç kullanımı, eksiklikler ve “tek platform” ihtiyacını doğrulamak. Görüşme çıktılarını ürün öncelikleri ve roadmap’e yansıtmak.

### Başvuru formu — İş fikrinin teknolojik yönü (max 1000 karakter)
**Altyapı:** Tek sunucuda ayrık backend ve frontend; REST API ile iletişim. Veritabanı: PostgreSQL 16, Prisma ORM ile şema ve migration yönetimi. Kimlik doğrulama: Better Auth (oturum, e-posta/şifre, OAuth). Ödeme: Stripe (tek seferlik ürün, webhook ile aktivasyon). Dosya depolama: S3 uyumlu (örn. Cloudflare R2); isteğe bağlı görsel işleme (Sharp).

**Mevcut teknolojiler:** Backend: Bun runtime, Elysia framework (hızlı, tip güvenli API). Frontend: Next.js 16 (App Router), shadcn/ui, Tailwind CSS, TanStack Query (sunucu state), React Hook Form + Zod (form/validasyon), TanStack Table, Recharts. Yerel geliştirme: Docker Compose (PostgreSQL, Redis).

**Yeni / ileriye dönük:** AI entegrasyonları (özetleme, öneri), gerçek zamanlı bildirimler, Microsoft Teams API (yoklama, toplantı geçmişi), fatura/fiş işleme ve finans analitiği için ek servisler. Modern JavaScript/TypeScript tabanlı stack ile hızlı iterasyon ve düşük operasyon maliyeti hedefleniyor.

### Başvuru formu — Yenilikçi yön / Ar-Ge yöntemleri (max 1000 karakter)
**Ürün yeniliği:** CRM ile proje/görev yönetimini tek veri modelinde birleştiren “bağlam grafiği” yaklaşımı: kişi–fırsat–proje–görev ilişkileri tek platformda tutuluyor; raporlama ve karar alma tek kaynaktan besleniyor. Piyasada çoğu çözüm ya sadece CRM ya sadece proje aracı; ikisini aynı organizasyon ve rol modeli altında sunan, tek seferlik ödeme ile yükseltilebilen model az.

**Ar-Ge yöntemi:** Modüler mimari (ayrık backend/frontend, org bazlı çok kiracılık) üzerinde özellik eklerken “önce veri modeli, sonra API, sonra UI” sırası; yeni entegrasyonlar (AI, Teams, fatura) eklendiğinde mevcut CRM ve proje verisiyle anlamlı bağ kurulması. Ar-Ge sürecinde kullanılan yöntem: müşteri görüşmeleriyle doğrulanan ihtiyaçları öncelik sırasına koymak, her özellik için MVP (minimum çalışan sürüm) ile hızlı test, geri bildirime göre iterasyon. AI özetleme ve Teams yoklama gibi özellikler bu çerçevede mevcut veriyle entegre şekilde tasarlanacak.

### Başvuru formu — Benzerler ve farklılaşma (max 1000 karakter)
**Yurtdışı benzerleri:** Salesforce, HubSpot (CRM ağırlıklı); Asana, Monday, ClickUp (proje/görev ağırlıklı). Bazıları her iki alanı da kısmen kapsıyor ancak genelde ayrı ürünler veya pahalı entegrasyonlarla bir araya geliyor; abonelik modeli ağırlıklı. **Yurtiçi:** CRM ve proje yönetimi sunan yerli SaaS’lar ve ajans/KOBİ odaklı araçlar mevcut; çoğu ya sadece CRM ya sadece proje/görev tarafında kalıyor.

**Bizi ayıran yenilikçi yönler:** (1) CRM ile proje/görev yönetimini tek ürün ve tek veri modelinde birleştirme: kişi–fırsat–proje–görev bağlamı tek ekranda; veri dağınıklığı yok. (2) Organizasyon bazlı çok kiracılık ve tek seferlik yükseltme ödemesi: abonelik yerine tek ödeme seçeneği, KOBİ’ler için daha sade maliyet. (3) Yol haritasında AI özetleme, Microsoft Teams (yoklama, toplantı geçmişi), finans/fatura kontrolleri ve çalışan analizlerinin mevcut CRM–proje verisiyle entegre sunulması; rakiplerde bu bütünleşik paket nadiren tek üründe toplanıyor.

### Başvuru formu — Hedef pazar analizi (max 1000 karakter)
**Pazar tanımı:** Ürün/hizmet sunulacak hedef pazar: Türkiye'deki küçük ve orta ölçekli işletmeler (KOBİ), 5–50 kişilik ekipler, ajanslar, danışmanlık firmaları, B2B satış ekipleri ve proje bazlı çalışan şirketler. İkincil hedef: benzer profile sahip yurtdışı pazarlar (dil ve ödeme altyapısı hazır olduktan sonra).

**Pazar büyüklüğü:** Türkiye'de yüz binlerce KOBİ ve binlerce ajans/danışmanlık firması var; CRM ve proje yönetimi araçlarına ihtiyaç duyan segment TAM olarak milyonlarca kullanıcı seviyesinde. Öncelikli hedef (SAM): satış ve proje yönetimini birlikte kullanan, tek platform arayan 5–50 kişilik organizasyonlar. İlk ticarileşmede (SOM): yıllık yüzlerce organizasyon hedeflenebilir.

**Ticarileşme potansiyeli:** Tek seferlik ödeme modeli nakit girişi ve tahsilat maliyetini sadeleştirir; kurumsal abonelik alternatifi sonra eklenebilir. AI, Teams ve finans modülleri ek ücret veya paket farkı ile değer artışı sağlayabilir. Ürün çalışır durumda; pilot müşteriler ve referanslarla büyüme planlanıyor.

### Başvuru formu — Ortaya çıkacak ürün/hizmet tanımı (max 1000 karakter)
Eleven, bulut tabanlı (SaaS) bir yazılım hizmetidir. Ekipler tek hesap altında müşteri ilişkileri (CRM), satış pipeline’ları, projeler ve görevleri yönetir; kişi–fırsat–proje–görev bağlantıları tek platformda tutulur. Ürün: web uygulaması (tarayıcı); organizasyon bazlı çok kiracılık, davet ve rol yönetimi, dosya yükleme (proje/görev ekleri), tek seferlik ödeme ile yükseltme. Planlanan ekler: AI özetleme, bildirimler, finans/fatura kontrolleri, Microsoft Teams (yoklama, toplantı geçmişi), çalışan analizleri. Sonuç: müşteri verisi, satış aşamaları ve proje ilerlemesi tek ekranda; raporlama ve karar alma tek kaynaktan beslenir.

### Başvuru formu — Orta/uzun vade ürün planı ve teknolojik gelişim (max 1000 karakter)
**Orta vade (1–2 yıl):** Mevcut CRM–proje veri modeli üzerine AI özetleme (toplantı, e-posta, görev açıklamaları); gerçek zamanlı bildirimler; Microsoft Teams entegrasyonu (toplantı yoklama, geçmişe erişim); fatura/fiş yükleme ve finans kontrolleri; çalışan aktivite/performans analizleri. Tek seferlik ödemeye ek olarak kurumsal abonelik veya modül bazlı ek ücret seçenekleri.

**Uzun vade (2+ yıl):** Veri ve API katmanını açarak üçüncü taraf entegrasyonları (muhasebe, e-posta, takvim); daha gelişkin AI (tahminleme, öneri, otomasyon); mobil uygulama; bölgesel/dil desteği ile yurtdışı pazar girişi. Teknolojik yenilikçi yön: “bağlam grafiği” (kişi–fırsat–proje–görev) tek kalırken yeni veri kaynakları (Teams, fatura, e-posta) bu grafiğe eklenerek raporlama ve karar destek güçlendirilecek; ölçeklenebilir altyapı (veritabanı, cache, kuyruk) ile büyüme karşılanacak.

### Başvuru formu — Şu ana kadar yapılan çalışmalar ve süre (max 1000 karakter)
Girişim üzerinde [süreyi kendiniz yazın: örn. X aydır] çalışılıyor. Gerçekleştirilen işler: (1) Ürün tanımı ve teknik mimari (backend–frontend ayrımı, çok kiracılık, veri modeli). (2) Tam yığın uygulama: kimlik doğrulama (e-posta/şifre, OAuth), organizasyon ve davet yönetimi, kişi (CRM) ve şirket kayıtları, satış pipeline'ları ve fırsatlar, projeler ve görevler, proje/görev dosya yükleme (S3 uyumlu depolama), Stripe ile tek seferlik organizasyon yükseltme ve webhook. (3) Teknoloji seçimi: Bun, Elysia, Prisma (PostgreSQL), Better Auth, Next.js 16, shadcn/ui, TanStack Query; Docker Compose ile yerel ortam. (4) Dokümantasyon ve proje dosyası (readme, kurulum, API özeti). Sırada: pilot kullanıcı testi, müşteri görüşmeleri ve yol haritasındaki AI, bildirim, Teams, finans modülleri.

### Başvuru formu — Ar-Ge tahmini bütçe (10–18 ay, TL)
**Tahmini bütçe:** [Tutarı TL olarak yazın, örn. 150.000 TL]

(İsteğe bağlı kısa dağılım: personel/taşeron, altyapı ve araçlar, lisanslar, pazara çıkış ve test.)

### Başvuru formu — Gelir modeli (max 1000 karakter)
**Ana gelir:** Organizasyon başına tek seferlik yükseltme ödemesi (ör. belirli bir tutar; Stripe ile tahsilat). Ücretsiz katmanda temel CRM, proje ve görev kullanımı sunulur; gelişmiş özellikler veya kullanıcı/kapasite limitleri aşıldığında tek ödeme ile profesyonel plana geçiş yapılır. Nakit girişi tek seferde olur; abonelik yönetimi ve iptal takibi gerektirmez.

**Tamamlayıcı gelir (planlanan):** Kurumsal abonelik (aylık/yıllık) seçeneği; AI özetleme, Microsoft Teams entegrasyonu veya finans/fatura modülleri için modül bazlı ek ücret veya paket fiyatı farkı. Büyük ekipler veya ek depolama için kapasite bazlı ücretlendirme.

**Hedef:** Önce tek seferlik ödeme ile satış ve referans oluşturmak; ardından abonelik ve modül gelirleri ile tekrarlayan gelir (ARR) artırmak.

### Başvuru formu — Aynı iş fikri ile diğer yarışma/destek başvurusu (max 1000 karakter)
[Seçenek A – Yoksa:] Aynı iş fikri ile geçmişte veya eş zamanlı başka bir yarışmaya, destek mekanizmasına veya merkeze başvuru yapılmamıştır.

[Seçenek B – Varsa:] Başvuru yapılan program adı, başvuru tarihi ve sonucu (beklemede/kabul/red vb.) buraya yazılmalıdır.

### Başvuru formu — Fikri ve sınai mülkiyet (FSM) hak iddiası (max 1000 karakter)
[Yoksa:] İş fikri ve çıktıları üzerinde FSM hakları açısından hak iddia edebilecek başka kişi veya kurum bulunmamaktadır; fikir ve yazılım girişimci/girişim ekibi tarafından geliştirilmiştir.

[Varsa:] Hak iddia edebilecek kişi/kurum (ortak, eski işveren, üniversite, lisans anlaşması vb.) ve durum kısaca açıklanmalıdır.

### Başvuru formu — Patent bağımlılığı (max 1000 karakter)
İş fikrinin başka bir patente bağımlılığı söz konusu değildir. Ürün, açık kaynak yazılımlar (Bun, Elysia, Prisma, Next.js vb.) ve ticari API’lerin (Stripe, S3 uyumlu depolama, Better Auth) kendi kullanım koşulları çerçevesinde kullanılmasıyla geliştirilmektedir; patent lisansı gerektiren özel veya tescilli bir teknoloji kullanılmamaktadır.

### Başvuru formu — Ekip üyesi görevi (yetkinlik bazlı rol)
CEO/CTO unvanı yerine yetkinlikle tanımlanacak örnek roller:
- **Ürün ve strateji:** İş fikrinin yönü, öncelikler, müşteri ihtiyaçları ve roadmap; pazara giriş ve pilot kullanıcı süreçleri.
- **Yazılım geliştirme (full-stack):** Backend API, frontend, veritabanı ve entegrasyonlar (auth, ödeme, depolama); ürünün teknik geliştirmesi.
- **Backend ve altyapı:** API, veritabanı, kimlik doğrulama, ödeme ve depolama entegrasyonları; deployment ve güvenlik.
- **Frontend ve kullanıcı deneyimi:** Arayüz, bileşenler, formlar ve raporlama ekranları; kullanılabilirlik ve UX.
- **Pazar ve müşteri:** Hedef kitle, müşteri görüşmeleri, satış ve pazarlama; gelir modeli ve geri bildirim.

[Her ekip üyesi için yukarıdakilerden birini seçip kendi yetkinliklerine göre uyarlayınız.]

### Başvuru formu — Kısa özgeçmiş (max 1000 karakter) — Yusuf Yıldız
Full Stack Developer; 2+ yıldır Next.js, React, TypeScript ile modern web uygulamaları geliştiriyor. Baltech Ventures’ta Frontend Web Developer (Aralık 2025–), JuniusTech ve Medyanes 360’ta frontend/full-stack rollerinde çalıştı. Projeler: Eleven (CRM ve proje yönetimi, çok kiracılı SaaS), AnimePulse (anime takip platformu), NoteLab (gerçek zamanlı ortak editör, Yjs), Shortr (URL kısaltma), MarkAI (markdown editör). TypeScript, Prisma, PostgreSQL, Better Auth/Clerk, TanStack Query, Tailwind, shadcn/ui, Docker deneyimi. Clarusway Full-Stack Bootcamp; sonrasında modern web ve DevOps alanında kendi kendine geliştirme. Ölçeklenebilir, kullanıcı odaklı uygulamalar ve temiz mimari üzerine odaklanıyor.

## Kısa Tanım (Elevator Pitch)
Eleven, CRM (müşteri ilişkileri yönetimi) ile proje ve görev yönetimini tek platformda birleştiren, çok kiracılı (multi-tenant) bir SaaS uygulamasıdır. Ekipler, ilişkileri, satış hunisi ve proje işlerini tek yerde yönetebilir; organizasyonlar tek seferlik Stripe ödemesi ile yükseltilebilir.

## Sorun / Fırsat
Küçük ve orta ölçekli ekipler genelde satış (CRM) ve proje yönetimini ayrı araçlarda tutar; veri dağınık kalır, bağlam kaybolur. Tek platformda hem ilişki hem satış hem proje/görev yönetimi sunan, kurulumu kolay ve ölçeklenebilir bir çözüm pazar açığı oluşturuyor.

## Çözüm
- **CRM**: Kişi ve şirket kayıtları (Lead → Prospect → Customer), satış pipeline’ları, aşamalar, fırsatlar (deal), aktiviteler (arama, e-posta, toplantı).
- **Proje yönetimi**: Projeler, üye atamaları, proje dosyaları (drive benzeri), bağlantılar (Figma, GitHub vb.).
- **Görev yönetimi**: Görevler (durum, öncelik, atanan/oluşturan), alt görevler, markdown açıklama, ekler; isteğe bağlı proje / kişi / fırsat bağlantısı.
- **Dosya**: Proje dosyaları ve görev ekleri; S3 uyumlu depolama (örn. Cloudflare R2), isteğe bağlı görsel işleme.
- **Çok kiracılık**: Organizasyon bazlı veri; davet ve rol tabanlı üyelik.
- **Gelir modeli**: Organizasyon başına tek seferlik ödeme (Stripe; örn. $1000), webhook ile aktivasyon.

## Hedef Kitle
Küçük ve orta ölçekli ekipler, satış ve proje işlerini birlikte yürüten şirketler, tek araçla hem CRM hem proje yönetimi isteyen kullanıcılar.

## Teknoloji Özeti
- **Backend**: Bun, Elysia (REST API, port 3333), Prisma (PostgreSQL 16), Better Auth, Stripe webhook, S3 uyumlu depolama (R2).
- **Frontend**: Next.js 16 (App Router), shadcn/ui, Tailwind, TanStack Query, React Hook Form, Zod, TanStack Table, Recharts.
- **Altyapı**: Docker Compose (PostgreSQL, Redis); production’da PostgreSQL + S3/R2.

## Farklılaştırıcı Özellikler
- CRM + proje + görev tek uygulamada; kişi/fırsat/proje bağlamı korunuyor.
- Organizasyon bazlı çok kiracılık ve tek seferlik yükseltme ödemesi.
- Modern stack (Bun, Elysia, Next.js 16) ile hızlı geliştirme ve düşük operasyon maliyeti.

## Planlanan Gelişmiş Özellikler (Roadmap)
- **AI entegrasyonları**: Akıllı özetleme, içerik üretimi, öneri ve otomasyon.
- **Bildirimler**: Görev, fırsat, proje ve ekip olayları için anlık/push bildirimleri.
- **Finans**: Finansal analizler, bütçe/finans kontrolleri, raporlama.
- **Fatura / fiş**: Fatura ve fiş yükleme, doğrulama ve takip.
- **Microsoft Teams**: Otomatik yoklama (toplantı katılımı), toplantı geçmişlerine erişim, takım senkronizasyonu.
- **Çalışan analizleri**: Performans, katılım ve aktivite metrikleri; raporlama ve dashboard'lar.
- Benzer karmaşık özellikler yol haritasında yer alacak.

## Mevcut Durum
Tam yığın (full-stack) çalışan uygulama: auth, organizasyonlar, davetler, kişiler, pipeline’lar, fırsatlar, projeler, görevler, dosya yükleme ve Stripe ödeme entegrasyonu mevcut.
