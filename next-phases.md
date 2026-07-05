# Eleven — Next Phases

> Ürün pivotu sonrası yol haritası. (Temmuz 2026)
> Eleven artık bir CRM değil: **yazılım ekipleri için Slack + Jira + Linear + Notion** karışımı bir çalışma platformu.
> Kapsam: pivotta tamamlananlar, bilinen boşluklar, ölçeklenme borçları ve sonraki özellikler.

---

## Ürün Vizyonu

Yazılım ekiplerinin tek çalışma alanı: **Tasks · Sprints · Projects · Chat · Files · Team · Activity · AI Analytics · Notifications.** Odak; hız, canlı işbirliği ve gerçek veriye dayalı AI içgörüleri. CRM (deals/pipelines/leads/contacts) tamamen kaldırıldı.

**Stack:** Next 16 + React 19 + Tailwind v4 + shadcn (frontend) · Elysia + Prisma 7 + Bun (backend) · better-auth (organization plugin) · BullMQ/Redis · `@anthropic-ai/sdk` (Claude) · Stripe · TanStack Query.

---

## Pivotta Tamamlananlar ✅

Bu batch'te bitenler (hepsi org-scoped, `bunx tsc --noEmit` iki tarafta da temiz):

- **Schema pivotu:** Contact/Pipeline/Stage/Deal ve enum'ları kaldırıldı. Eklenen modeller: `Sprint`, `Milestone`, `TaskComment`, `TaskWatcher`, `TaskDependency`, `TimeEntry`, `MessageReaction`, `ChatRead`, `NotificationPreference`, `AiReport`. `Member` presence alanları (statusEmoji/statusText/workingOn/timezone/skills/lastSeenAt), `Message` (replyToId/pinnedAt/editedAt/mentionUserIds), `ProjectFile` (folder/versionHistory), `Notification` (category/priority/archivedAt/snoozedUntil). `TaskStatus`: TODO/IN_PROGRESS/IN_REVIEW/BLOCKED/DONE/CANCELLED.
- **Status Badge design system:** `components/ui/status-badge.tsx` — tüm uygulamada ortak, semantik renk token'ları (`--status-*` light/dark), ikon + tooltip + `role="status"`. `PresenceDot` + `presenceState()`.
- **Dashboard:** Dev-team hub — Today's Focus, presence, recent activity, projeler (progress bar), mentions, meetings; renkli gradient/kartlar.
- **Tasks (Jira seviyesi):** Subtasks, labels, priority, estimate, sprint, milestone, dependencies, watchers, time tracking, comments, activity timeline, bulk actions, board/list.
- **Sprints:** CRUD + state (upcoming/active/done) + velocity.
- **Team:** Presence heartbeat, status/emoji/workingOn/timezone/skills, üye profilleri.
- **Chat (Slack seviyesi):** Reactions, reply threads, typing indicator, read receipts, mentions, emoji picker, message search, pinned messages, artımlı polling (`after=`).
- **Files:** Org-geneli liste, preview (image/video/audio/pdf), folder desteği, version history, drag&drop upload, recent files.
- **Projects:** Sekmeli detay (Overview/Board/List/Files/Members) — progress ring, health badge, milestones, burn-up + velocity mini-chart (`/projects/:id/insights`).
- **Activities:** Filtre + arama + gün bazlı timeline (entity ikonlarıyla) / tablo görünümü.
- **AI Analytics:** Claude tool-calling motoru (`ai-reports.ts`) — MINI/MEDIUM/HIGH raporları, staleness ile gate'li üretim. Frontend: Reports sayfası (markdown render, generate/regenerate) + yeniden tasarlanmış Metrics (throughput/velocity/cycle-time/team-load).
- **Notifications:** `/dashboard/notifications` (kategori tab'ları, read/unread, archive, snooze, priority, mark-all) + `/preferences` (kategori bazlı in-app/email, quiet hours, digest).
- **Landing + copy:** Tüm CRM copy'si dev-team platform vizyonuna çevrildi; monokrom tema korundu.

---

## Faz 1 — Pivotu Sağlamlaştırma ✅ (tamamlandı)

### 1.1 AI raporları — gerçek dünya sağlaması ✅
- Token/maliyet loglama eklendi (`[ai-reports]` — turn, in/out token, ~$ tahmini, süre). `ANTHROPIC_PRICE_IN/OUT` env ile ayarlanır.
- **Cron:** `src/queue/ai-reports.ts` — BullMQ repeatable job (MINI günlük 06:00 / MEDIUM Pzt 06:00 / HIGH ayın 1'i 06:00). Her org için staleness kontrolüyle fan-out; `ANTHROPIC_API_KEY` yoksa no-op (uyarı loglar).
- Model `ANTHROPIC_MODEL ?? "claude-sonnet-5"`; prod'da dated snapshot pinlemek için env override yorumu bırakıldı.

### 1.2 Gerçek zamanlı: polling → WebSocket ✅
- `src/lib/ws-hub.ts` (org-scoped in-memory hub) + `src/routes/live.ts` (`/ws/live`, session cookie auth). Publish noktaları: chat mesajı, chat okundu, mention/notification, presence.
- Frontend: `services/live` (`useLiveChannel`, `useOnlineUsers`, `liveSendTyping`) + `components/live/live-channel.tsx` dashboard layout'a mount edildi. Chat mesajları `mergeChatMessages` ile cache'e anında; typing/presence canlı; notification invalidation. Polling fallback korunuyor.
- `PresenceDot` artık canlı `online` bayrağını da kabul ediyor; team presence grid WS online setini kullanıyor.
- **Ceiling:** hub + typing state tek-process in-memory (ponytail). Çok-process'te Redis pub/sub gerekir.

### 1.3 Bildirim tetikleyicileri + digest ✅
- Kapsam denetlendi: TASK_ASSIGNED/COMPLETED/COMMENT, MENTION (chat + comment), PROJECT_MEMBER_ADDED, PROJECT_FILE_ADDED, MEETING_INVITED, SPRINT_STARTED. Watcher'lar `taskAudience()` üzerinden fan-out'a dahil.
- **Digest:** `src/queue/digest.ts` — günlük 08:00 / haftalık Pzt 08:00 repeatable job; `NotificationPreference.digest` = daily/weekly olan ve `emailEnabled` üyelere tek özet mail (kuyruk üzerinden).

### 1.4 Settings sayfası ✅
- Sekmeli: General (ad/logo/slug) · Integrations (GitHub) · Members (sayaç + kısayol) · Notifications (tercihler linki) · Billing (plan + upgrade) · Danger zone (slug onaylı org silme).

### 1.5 Billing — plan gating ✅
- **Gerçeklik:** ürün tek-seferlik ödeme modeli (bir kez öde → PROFESSIONAL, kalıcı). Frontend zaten ödenmemiş FREE org'u tüm dashboard'dan bloke ediyordu ama **backend hiçbir şey enforce etmiyordu** → doğrudan API çağrısıyla bypass edilebiliyordu.
- `requirePaidOrg` macro'su (auth.plugin) eklendi; ana yazma uçlarına (project/task/sprint create) uygulandı → ödenmemiş org 402 alır. Bypass kapatıldı.
- **Not (Stripe Customer Portal):** Portal abonelik modeli içindir; tek-seferlik ödemede yönetilecek yinelenen bir şey yok → uygulanmadı (YAGNI). Billing sekmesi plan + ödeme tarihini gösteriyor. Gerçek abonelik modeline geçilirse portal + `stripeCustomerId` + fatura geçmişi eklenir.

### 1.6 Temizlikler ✅
- `/privacy` + `/terms` sayfaları eklendi (`components/legal/legal-shell.tsx`, landing nav+footer ile) ve footer'a "Legal" grubu linklendi.
- `team/team/invite` redirect shim ve contacts `imports` route'u zaten pivotta kaldırılmıştı — doğrulandı, artık yok.

---

## Faz 2 — Derinleştirme (öncelik: orta)

### 2.1 Global arama (⌘K) ✅
- Backend `/search?q=` (tasks/projects/sprints/files/people, org-scoped, grup başına cap). Frontend `CommandPalette` (`⌘/Ctrl+K` veya header'daki `CommandSearchButton`), gruplu sonuçlar + "Go to" hızlı navigasyon. `services/search`.

### 2.2 Rich text & collaboration ✅
- Paylaşımlı `@mention` autocomplete: `components/mentions/mention-autocomplete.tsx` (hook + `MentionSuggestions`); hem chat-input hem task yorum kutusu bunu kullanıyor (chat → userId, comment → memberId). Chat-input'un eski kopya mention mantığı buna refactor edildi.
- Task details editörüne markdown biçimlendirme toolbar'ı (bold/italic/heading/list/quote/code/link, seçimi sarar) + mevcut inline görsel ekleme korundu.
- **Kalan (Faz 3):** gerçek Notion-benzeri blok editör + sprint/proje doc/wiki sayfaları.

### 2.3 Projects — Calendar + Timeline ✅
- `components/projects/project-schedule.tsx`: `ProjectCalendar` (ay grid'i, task+milestone due date'leri) ve `ProjectTimeline` (yatay Gantt-vari, min→max aralığında task/milestone markerları + "bugün" çizgisi). Proje detayına Calendar + Timeline sekmeleri eklendi.

### 2.4 Meet — API fazı
- Frontend + kendi WebRTC sinyalleşmesi var. Ölçek için hazır SFU (LiveKit/Daily) değerlendirmesi, kayıt (recording modeli eklendi), takvim senkronu.

### 2.5 Testler ve kalite
- **Projede hâlâ test yok.** Asgari: backend route'ları için `bun:test` ile org-scope/permission testleri (kritik: başka org verisine erişememe), AI tool-calling motoru için deterministik tool-output testi, notify fan-out testi.
- **`bun run lint` kırık** (ESLint 10 + eslint-plugin-react). Flat config'e taşınmalı.
- CI: lint + tsc + test (GitHub Actions).

### 2.6 Güvenlik/sağlamlaştırma
- Rate limiting yok (auth, upload, AI generate — özellikle AI maliyet DoS'a açık).
- Upload dosya tipi/boyut limitleri gözden geçirilmeli.
- Stripe webhook imza doğrulaması kontrol edilmeli.

### UX standardı: icon-only buton tooltip'leri ✅
- `components/ui/icon-button.tsx` (`IconButton`) — zorunlu `label` prop'u hem `aria-label` hem tooltip verir. Uygulamadaki tüm icon-only butonlar (files, chat, kanban, meet, modallar, task editör toolbar'ı) buna veya trigger'larda `Tooltip` sarmalayıcısına (theme-toggle, notification bell) çevrildi.

### Rol tabanlı erişim denetimi (audit sonucu)
- **better-auth** org mutasyonları (org update/delete, invite/remove member, updateMemberRole) zaten sunucu tarafında owner/admin ile enforce ediliyor — bu en hassas işlemler korunuyor.
- **Bizim custom route'lar** bilinçli olarak "flat" (her üye task/proje/sprint CRUD yapabilir — işbirlikçi araç için normal). İstisnalar: settings/GitHub → owner; comment silme → yazar veya admin; **yeni:** proje silme (cascade) → `requireAdmin`.
- **Frontend UI gating eklendi** (`lib/use-my-role.ts`, better-auth `useActiveMember`): settings General edit + Billing upgrade admin-only, Danger (org silme) sekmesi owner-only, Team member row-actions (rol değiştir/çıkar) ve "Invite" butonu admin-only. Sidebar navigasyonu herkese açık (görüntüleme serbest; mutasyonlar gate'li).
- **Kalan:** custom route'lar için daha ince RBAC gerekirse better-auth access-control rolleriyle veya `requireAdmin` yayarak genişletilebilir; test kapsamına permission testleri eklenmeli.

---

## Faz 3 — Yeni Özellikler

| Özellik | Not |
|---|---|
| AI: task/sprint asistanı | Tool-calling motoru genişletilerek "bu sprint'i planla", "blocker'ları özetle", "PR açıklaması yaz". Tek yüzeyle başla (task detayında "Summarize/Suggest"). |
| Delivery forecast & risk | AI raporlarındaki metrikleri (velocity, burn rate) proaktif uyarıya çevir — "bu sprint %70 ihtimalle kaçacak". |
| GitHub derin entegrasyonu | Commit/PR → task otomatik bağlama, branch adından task, PR merge → task done. |
| Otomasyonlar | "Task BLOCKED olunca watcher'lara bildir", "sprint bitince rapor üret" — basit trigger/action tablosu. |
| Takvim entegrasyonu | Google/Outlook sync — due date + meeting. |
| Public API + API keys | Enterprise ön koşulu. |
| Mobil / responsive denetim | Board/list/chat dar ekran davranışı sistematik test edilmedi. |

---

## Teknik Borç (Technical Debt)

- **Multi-process ceiling:** WS hub + typing state tek-process in-memory (Faz 1'de WS geldi ama tek instance). Yatay ölçekte Redis pub/sub şart — her instance subscribe olup kendi local socket'lerine relay eder.
- **AI rate-limit yok:** Token/maliyet artık loglanıyor ama `/ai-reports/generate` ve cron'da hız/bütçe sınırı yok → kötüye kullanım/maliyet DoS'a açık.
- **Cycle time yaklaşımı:** `completedAt` üzerinden hesap; edge case'ler (yeniden açılan task) ele alınmıyor.
- **Test kapsamı sıfır:** Regresyon güvenliği yok. WS hub, notify fan-out, plan gating, AI tool loop öncelikli.
- **Lint kırık:** ESLint 10 uyumsuzluğu.
- **File storage:** Version history JSON kolonda; büyük dosya/çok versiyonda ayrı tabloya (veya S3 + metadata) taşınmalı.
- **Billing modeli:** Tek-seferlik ödeme; abonelik/portal/fatura geçmişi yok (ürün kararı). Abonelik gerekirse `stripeCustomerId` + portal eklenir.

---

## Önerilen Sıra (özet)

Faz 1 tamamlandı (AI cron + token log, WebSocket realtime, digest, settings sekmeleri, plan gating, legal sayfalar). Sıradaki:

1. Global arama ⌘K (2.1)
2. Test + CI tabanı + lint onarımı (2.5)
3. Güvenlik sertleştirme: rate limiting (auth/upload/AI), webhook denetimi (2.6)
4. WS'i çok-process'e taşı (Redis pub/sub) — ölçek gerektiğinde
5. Projects Calendar/Timeline (2.3) + rich collaboration (2.2)
6. Faz 3: AI task asistanı + GitHub entegrasyonu
