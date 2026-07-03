# Eleven — Next Phases

> Proje içi araştırma sonucu çıkarılan yol haritası. (Temmuz 2026)
> Kapsam: eksik sayfalar, tamamlanması gereken API'ler, redesign ihtiyaçları ve yeni özellik önerileri.

---

## Mevcut Durum Özeti

**Stack:** Next 16 + React 19 + Tailwind v4 + shadcn (frontend) · Elysia + Prisma + Bun (backend) · better-auth (organization plugin) · Stripe · TanStack Query.

**Çalışan modüller:** Contacts (people/companies + detay), Deals (pipeline/stage kanban + list + detay), Projects (+üyeler, +dosyalar), Tasks (list/kanban/calendar + attachments + markdown editor), Metrics (temel), Activities, Files (project finder), Team (+invite +rol değiştirme), Chat (polling ile), Settings (yalnız GitHub bağlantısı), Profile, Payments (Stripe checkout + webhook, FREE/PROFESSIONAL), Landing (yeni monokrom tasarım).

**API yüzeyi:** `backend/src/routes/` altında 14 route dosyası; contacts/deals/projects/tasks CRUD'ları sağlam ve org-scoped.

---

## Faz 1 — Yarım Kalanları Tamamlama (öncelik: yüksek)

### 1.1 Meet sayfası ~~tamamen boş~~ → frontend tamamlandı ✅
- **Yapıldı (frontend-only):** `app/meet` (lobi: yeni toplantı + kodla katılım + günün toplantıları) ve `app/meet/[roomId]` (pre-join kamera önizlemesi → görüşme ekranı → ayrılma ekranı). Gerçek getUserMedia/getDisplayMedia kullanıyor; katılımcılar, chat ve konuşmacı rotasyonu mock (`components/meet/`).
- **Kalan (API fazı):** Oda oturumu + sinyalleşme (WebRTC SFU ya da hazır SDK: LiveKit / Daily.co önerilir — sıfırdan WebRTC yazma), gerçek katılımcı/chat verisi, takvim senkronu. Sunumdaki "Microsoft Teams Entegrasyonu" hedefi bu faza bağlanabilir.

### 1.2 Metrics API tek endpoint
- `backend/src/routes/metrics.ts` yalnız `/deals-over-time` sunuyor; `metrics/page.tsx` (387 satır) kalan hesapları client-side yapıyor olmalı.
- **Yapılacak:** Sunucu tarafı aggregate endpoint'leri:
  - `/metrics/pipeline-summary` (stage bazlı toplam değer, win rate, ortalama döngü süresi)
  - `/metrics/tasks-throughput` (tamamlanan görev/hafta, kişi bazlı yük)
  - `/metrics/revenue` (kapanan deal değeri, aylık trend)
- Yeni monokrom temayla chart'lar gri tonlarına geçti (`--chart-1..5`); metrics sayfası bu ramp ile yeniden gözden geçirilmeli.

### 1.3 Chat polling → gerçek zamanlı
- `frontend/services/chat/use-chat.ts` `refetchInterval` ile poll ediyor. Sunum yol haritasında "WebSocket tabanlı anlık bildirim" zaten hedef.
- **Yapılacak:** Elysia/Bun native WebSocket ile `/ws` kanalı; mesaj + typing + presence. Poll fallback korunabilir.

### 1.4 Settings sayfası tek karttan ibaret
- `frontend/app/dashboard/settings/page.tsx` yalnız GitHub org bağlantısı gösteriyor.
- **Eklenecek bölümler:** Org adı/logo düzenleme, üye & rol yönetimi kısayolu, billing (plan görüntüle/yönet), danger zone (org silme), pipeline/stage varsayılanları.

### 1.5 Billing yönetimi eksik
- Checkout + webhook var (`backend/src/routes/payments.ts`), ama:
  - Plan iptal/downgrade yok → **Stripe Customer Portal** linki eklenmeli (en az maliyetli çözüm).
  - Fatura geçmişi yok.
  - **Plan gating hiçbir route'ta enforce edilmiyor** — `plan: PROFESSIONAL` sadece yazılıyor, hiçbir limit kontrolü yok. FREE plan limitleri (üye sayısı, contact sayısı vb.) backend'de kontrol edilmeli.
- Landing pricing (Starter/Pro/Enterprise) ile schema (`FREE`/`PROFESSIONAL`) uyumsuz — ya schema'ya plan eklenmeli ya landing copy sadeleşmeli.

### 1.6 Landing copy'nin verdiği sözler
Yeni landing'de yazılan ama üründe olmayan şeyler (ya yapılmalı ya copy düzeltilmeli):
- "CSV import for contacts" (FAQ) → contacts CSV import endpoint'i + modal yok.
- "Cancel anytime from settings" (FAQ) → billing yönetim UI'ı yok (bkz. 1.5).
- "Your data stays exportable" → veri export özelliği yok.

### 1.7 Küçük temizlikler
- `frontend/app/dashboard/team/team/invite/page.tsx` → redirect shim; linkler düzeltilip silinmeli.
- Legal sayfalar yok: `/privacy`, `/terms` — landing footer'a eklenecek (Stripe kullanan üründe fiilen zorunlu).

---

## Faz 2 — Ürünleştirme (öncelik: orta)

### 2.1 Bildirim sistemi ✅ (tamamlandı)
- `Notification` modeli + `/notifications` API + zil/popover UI + 30sn polling kuruldu.
- Tetikleyiciler: task atandı/tamamlandı, deal atandı/stage değişti/kazanıldı, contact atandı, projeye üye/dosya eklendi, meeting daveti, contacts import.
- E-posta fan-out: her bildirim BullMQ `emails` kuyruğu üzerinden mail atar (API beklemez). **Kalan:** polling → WebSocket push (1.3 altyapısı hazır).

### 2.2 Global arama (⌘K)
- `components/ui/command.tsx` kurulu ama hiçbir yerde CommandDialog kullanılmıyor.
- **Yapılacak:** ⌘K palette — contacts/deals/projects/tasks arası arama + hızlı aksiyonlar ("yeni görev", "yeni deal"). Backend'e tek bir `/search?q=` endpoint'i.

### 2.3 E-posta bildirimleri ✅ (altyapı tamamlandı)
- BullMQ + Redis kuyruk (`src/queue/email.ts`, in-process worker, 3x retry) ve monokrom şablon (`src/lib/email-templates.ts`) kuruldu; doğrulama/davet/bildirim mailleri buradan geçiyor.
- **Dikkat:** `.env`'deki Gmail app password reddediliyor (535 BadCredentials) — yeni app password gerekli, yoksa hiçbir mail çıkmaz.
- **Kalan:** haftalık özet (digest), kullanıcı bazlı opt-out ayarları, worker'ı ayrı prosese alma.

### 2.4 Aktivite akışının derinleştirilmesi
- `activities` route yalnız düz liste. Detay sayfalarında entity bazlı timeline var mı tutarlı değil.
- **Yapılacak:** entity bazlı filtre (`?entityType=DEAL&entityId=`), yorum ekleme (activity + comment birleşimi), @mention.

### 2.5 Testler ve kalite
- **Projede hiç test yok** (0 adet `*.test.*`).
- **`bun run lint` şu an kırık:** ESLint 10 + eslint-plugin-react uyumsuzluğu (`contextOrFilename.getFilename is not a function`). Plugin güncellenmeli veya flat config'e taşınmalı.
- Asgari: backend route'ları için bun:test ile org-scope/permission testleri (en kritik: başka org'un verisine erişememe), payments webhook testi.
- CI: lint + tsc + test pipeline'ı (GitHub Actions).

### 2.6 Güvenlik/sağlamlaştırma denetimi
- Rate limiting yok (özellikle auth ve upload).
- Upload route'unda dosya tipi/boyut limitleri gözden geçirilmeli.
- Webhook imza doğrulaması var mı kontrol edilip yoksa eklenmeli (`payments.ts /stripe`).

---

## Faz 3 — Yeni Özellikler (sunum yol haritası + öneriler)

| Özellik | Kaynak | Not |
|---|---|---|
| AI entegrasyonu | sunum 07/07 | Deal/proje özetleme, sonraki adım önerisi, e-posta taslağı. Claude API ile; önce tek yüzey (deal detayında "Summarize") ile başla. |
| Finans & raporlama | sunum 07/07 | Bütçe takibi, fatura/makbuz yükleme + doğrulama akışı. Yeni Prisma modelleri gerekir. |
| Microsoft Teams | sunum 07/07 | Meet (1.1) ile birlikte planla. |
| Performans analizleri | sunum 07/07 | Metrics API'nin (1.2) doğal devamı — kişi bazlı raporlar. |
| Contacts CSV import/export | landing sözü | 1.6 ile aynı iş. |
| Takvim entegrasyonu | öneri | Tasks calendar view var; Google/Outlook sync ile toplantı + due date senkronu. |
| Otomasyonlar | öneri | "Deal X stage'e gelince görev aç" tarzı kurallar — basit trigger/action tablosuyla başla. |
| Public API + API keys | öneri | Enterprise satışı için ön koşul. |

---

## Tasarım / Redesign İhtiyaçları

Yeni monokrom tema (siyah/beyaz/gri, Instrument Serif + Geist) landing'e uygulandı. Dashboard tarafında gözden geçirilmesi gerekenler:

1. **Settings** (`dashboard/settings`) — tek kart, boş görünüyor. Sekmeli/section'lı yapı (General · Integrations · Billing · Danger zone).
2. **Team** (`dashboard/team`) — işlevsel ama sade tablo; davet durumları (pending/expired) ve rol açıklamaları eklenmeli.
3. **Chat boş durumu** (`app/chat/page.tsx`) — "Select a conversation" düz yazı; boş durum tasarımı + org chat'e otomatik yönlendirme zaten var, gecikmede skeleton gösterilmeli.
4. **Meet** — 1.1'e bağlı; ne olursa olsun mevcut placeholder kalkmalı.
5. **Metrics** — yeni gri chart paletiyle kontrast/okunabilirlik kontrolü; boş-veri durumları.
6. **Activities** — düz liste; gün bazlı gruplama + entity ikonları ile timeline görünümü.
7. **Genel denetim** — yeni temada `--primary` artık siyah/beyaz: renkli primary'ye güvenen eski ekran parçaları (badge, chart, durum renkleri) tek tek gözden geçirilmeli. Durum bildiren yerlerde (task status/priority) griden fazlası gerekiyorsa tema dışı semantik tonlar tanımlanabilir.
8. **Mobil** — dashboard'un dar ekran davranışı sistematik test edilmedi; en az contacts/deals/tasks için kontrol.

---

## Önerilen Sıra (özet)

1. Meet kararı + placeholder kaldırma (1.1)
2. Plan gating + Stripe Customer Portal (1.5) — para akışının bütünlüğü
3. Landing sözlerini kapatma: CSV import, export, billing UI (1.6)
4. WebSocket altyapısı → chat + notifications (1.3 + 2.1)
5. Metrics API + sayfa revizyonu (1.2)
6. Settings redesign (1.4)
7. Global arama ⌘K (2.2)
8. Test + CI tabanı (2.5)
9. Faz 3 özellikleri (AI ile başla)
