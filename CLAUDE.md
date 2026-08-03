# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Ushbu fayl Claude Code uchun asosiy qoida hisoblanadi. Quyidagi qoidalar **har bir task**, **har bir javob** va **har bir kod yozish jarayonida** majburiy hisoblanadi.

---

# 📦 Loyiha haqida (Project overview)

ChatFlow — real-time 1:1 chat ilovasi: email/parol auth, foydalanuvchi qidiruvi, kontaktlar, online holat, unread/o'qilgan belgisi, hamda **butunlay frontend tomonda qurilgan** boy funksiyalar (media xabarlar, sovg'alar, postlar, WebRTC audio/video qo'ng'iroqlar).

Repo'da uch xil kod bir joyda yashaydi:

| Yo'l | Nima | Holati |
|---|---|---|
| `src/` (+ ildizdagi `package.json`) | **Joriy frontend** — React 18 + Vite 5 + Tailwind/DaisyUI + Redux Toolkit SPA | Faol ish shu yerda |
| `prod/` | Node/Express 5 + Socket.io + MongoDB backend | **Alohida git repo, Bekzod Mirzaaliyevniki — tahrirlash taqiqlanadi** (faqat o'qiladi) |
| `frontend/latest/` | Eski legacy frontend (React 19, o'zimizniki) | Arxiv — repo'da commit qilingan (105 fayl, `src/` dan kattaroq), lekin unga kod yozilmaydi |

Joriy frontend `nF-2403-Teamwork/prod` repo'sining `sanjarf` branch'idan merge qilingan (Sanjar Gafurovning Telegram-uslub UI'si). UI matnlari **rus tilida** hardcode qilingan (`ru`/`en` faqat Settings i18n'ida).

> **⚠️ Backendni o'zgartirish tartibi:** `prod/`ga hech qachon to'g'ridan-to'g'ri commit qilinmaydi. O'zgarish kerak bo'lsa repo ildizida `*.patch` fayl tayyorlanadi (`bekzod-backend-fix.patch`, `bekzod-backend-fix-2.patch`, `bekzod-backend-presence.patch`) va Bekzodga yetkaziladi; `claude/tasks/task.md` ga yozuv qo'shiladi.

> **⚠️ Eski hujjatlarga ishonmang:** `claude/tasks/done.md` va yuqoridagi patch'lar guruh chatlari, JWT/refresh-token, `routes/`+`middleware/`+`sockets/` papkalari, `Room`/`Friend`/`RefreshToken`/`VerificationCode` modellari bo'lgan **ancha boshqa backend** haqida yozilgan (u `prod/src/start.js` davri). Hozirgi entrypoint — `prod/src/index.js` va unda bularning hech biri yo'q. Har safar kod yozishdan oldin `prod/src/index.js` ni ochib real kontraktni tekshiring.

## Buyruqlar (Commands)

Frontend (repo ildizi — joriy):
```
npm install
npm run dev      # Vite dev server, port 5173 (vite.config.js'da qattiq belgilangan)
npm run build
npm run preview
```
Lint/test skriptlari **yo'q** — ESLint config ham, test runner ham o'rnatilmagan. "Build o'tadimi" tekshiruvi = `npm run build`.

Backend (`prod/`, `sanjarb` branch) — faqat lokal ishga tushirish uchun, tahrirlanmaydi:
```
cd prod && npm run dev     # nodemon src/index.js  (port 5000)
cd prod && npm start       # node src/index.js
```
`prod/.env` da **`MONGO_URL`** bo'lishi shart (`index.js` faqat shu nomni o'qiydi — `MONGODB_URI` emas).

Yordamchi skriptlar (repo ildizi, bir martalik DB tuzatishlari — `node scripts/<nom>.cjs`). Ular `prod/` ichidagi mongoose nusxasi va modellarini **faqat require qilib** ishlatadi, backend fayllariga tegmaydi va `prod/.env` dan ulanadi:
- `seedAdmin.cjs` — lokal test/admin akkaunt
- `sync-auth-passwords.cjs` — eski `Auth` kolleksiyasidagi parollarni `User.password` ga ko'chirish
- `fix-login-passwords.cjs` — parolsiz akkauntlarga vaqtinchalik parol (`chatflow123`), `admin@gmail.com` → `putin123`
- `fix-one-way-contacts.cjs` — bir tomonlama kontaktlarni o'zaro qilish

Muhit o'zgaruvchilari: `.env` (Render URL) va `.env.local` (`VITE_SOCKET_URL=http://localhost:5000`, lokal dev uchun ustun turadi). `.env.example` dagi `VITE_WS_AUTH` **hech qayerda o'qilmaydi** — qoldiq.

## Arxitektura (Architecture)

### Joriy frontend (`src/`)

**Provider zanjiri** (`main.jsx`): `Provider` → `PersistGate` → `ThemeApplier` → `WebSocketProvider` → `CallProvider` → `RouterProvider` + `CallOverlay`. `CallOverlay` **router'dan tashqarida** — kelayotgan qo'ng'iroq istalgan ekranda chiqishi uchun.

**Routing** (`createBrowserRouter`, lazy-load yo'q): `/login` · `ProtectedRoute` ostida `/` → `ChatLayout` (`index` → `ChatEmpty`, `chat/:contactId` → `Conversation`, `room/:roomId` → `RoomConversation`) · `*` → `NotFound`.

#### `context/WebSocketContext.jsx` — yagona socket/API qatlami (1000+ qator, loyihadagi eng katta fayl)
Butun server bilan muloqot shu yerda: auth, kontaktlar, xabarlar, media, sovg'alar, postlar, profil, presence, notifikatsiyalar, qo'ng'iroq signalizatsiyasi. Komponentlar `useWebSocket()` orqali oladi, socket instansiga to'g'ridan-to'g'ri tegmaydi.

- **`ackEmit(event, payload, timeoutMs=12000)`** — barcha so'rovlar shu orqali; backend javobni socket.io ack callback'ida qaytaradi (REST yo'q). Timeout'da `null` qaytaradi, throw qilmaydi.
- **Shape adapterlari:** server Mongo tilida gapiradi (`_id`, ObjectId), UI esa `id` bilan ishlaydi va suhbatlarni **email bo'yicha kalitlaydi**. `idOf`/`mapUser`/`mapMessage` + `usersRef`/`emailToIdRef` Map'lari shu ikki dunyoni bog'laydi. Har qanday yangi kod email↔id konversiyasini shu Map'lar orqali qilishi kerak (`idForEmail`, `emailOf`).
- **`token` = foydalanuvchining `_id`** (JWT yo'q). Socket handshake'da auth yo'q — identity `connect` da `socket.emit("user:online", myId)` bilan e'lon qilinadi va reconnect'da qayta yuboriladi. (`src/config.js` dagi `SOCKET_AUTH`/handshake izohi eski backend qoldig'i — joriy backend hech qanday token tekshirmaydi.)

#### 🔑 Envelope tunnel (`::app::`) — eng muhim arxitektura qarori
Backend faqat oddiy 1:1 matn uzatadi. Shu sabab **barcha boy funksiyalar `chat:send` xabar matni ichiga JSON envelope qilib joylanadi**:

```
"::app::" + JSON.stringify({ v: 1, kind, data })
```

- `encodeEnv`/`decodeEnv` funksiyalari `WebSocketContext.jsx` boshida; dispatcher — `handleEnvelopeRef.current(env, meta)` (latest-ref shabloni: socket effekti ichidan chaqiriladi, lekin har renderda yangilanadi).
- `kind` qiymatlari: `media` (image/voice/video/round/file — data URL sifatida), `gift`, `post`, `post:view`, `post:views`, `profile`, `call-missed`, va `call:offer` / `call:answer` / `call:ice` / `call:media` / `call:reject` / `call:end`.
- **`call-missed` ataylab `call:` prefiksisiz** — `call:*` envelope'lari tarixda tashlab yuboriladi (eski qo'ng'iroq qayta jiringlamasligi uchun), javobsiz qo'ng'iroq bildirishnomasi esa **saqlanishi shart**: oflayn odam ilovani ochganda uni ko'radi. `missedCallMsg()` uni lokal qo'ng'iroq jurnalining aynan o'sha bubble shakliga (`kind: "call"`) aylantiradi, shuning uchun qo'shimcha UI kerak emas. Yo'nalish kim qarayotganiga bog'liq: yuboruvchida `out`, qabul qiluvchida `missed`.
- Envelope'lar **DB'da saqlanadi** — `chat:history` ularni qayta o'ynatadi, shuning uchun sovg'a/post/profil reload'dan keyin ham tirik qoladi. `meta.live` bayrog'i live va history yo'llarini ajratadi: `call:*` envelope'lari history'da e'tiborsiz qoldiriladi (eski signalizatsiya jiringlamasligi kerak).
- Envelope'lar suhbat oqimidan **filtrlanadi** — foydalanuvchi `::app::...` matnini ko'rmaydi; `media`/`gift` esa alohida `kind` li bubble'ga aylantiriladi.
- **Hajm chegarasi:** socket.io `maxHttpBufferSize` (1MB) oshib ketmasligi uchun 900 000 belgidan katta payload yuborilmaydi — oldindan tushunarli xato qaytariladi. Yangi envelope turi qo'shsangiz, shu tekshiruvni chetlab o'tmang.
- `broadcastToContacts(kind, data)` — profil o'zgarishi/post kabi narsalarni barcha kontaktlarga tarqatadi (har biriga alohida `chat:send`).

#### Qo'ng'iroqlar (`context/CallContext.jsx` + `components/CallOverlay.jsx`)
`RTCPeerConnection` va media oqimlari faqat `CallContext` ichida; signalizatsiya `WebSocketContext` ning `callOffer/callAnswer/callIce/callMedia/callReject/callEnd` funksiyalari orqali envelope tunnelidan o'tadi (`onCallEvent` — kelgan hodisalarga obuna).
- Holat mashinasi: `idle → calling` (biz qo'ng'iroq qildik) yoki `idle → ringing` (bizga qo'ng'iroq) `→ active → idle`.
- **`phase` va `connected` — ikki xil narsa.** `phase === "active"` faqat offer/answer almashinuvi tugaganini bildiradi; `connected` esa `pc.connectionState === "connected"` bo'lganda, ya'ni media real oqa boshlaganda `true` bo'ladi. Davomiylik soati `connected` dan boshlanadi — undan oldin overlay'da `Соединение…` ko'rinadi.
- **30 soniyalik javobsizlik taymeri:** `calling`/`ringing` fazasi 30s dan oshsa, qo'ng'iroq qiluvchi tomon `callEnd` yuborib `Нет ответа` bilan to'xtaydi va `out` yozuvini qoldiradi; qabul qiluvchi tomon `callReject(..., "timeout")` yuboradi va `missed` yozuvini qoldiradi.
- **Rington (`lib/ringtone.js`, WebAudio — audio fayl yo'q):** `ringing` da `startRingtone("incoming")`, `calling` da `startRingtone("outgoing")` (ringback). Boshqa har qanday fazada — shu jumladan ulanish, tugash va overlay unmount bo'lganda — `stopRingtone()` chaqiriladi.
- Audio-only qo'ng'iroqda ham **audio va video transceiver'lari `sendrecv` bilan** ochiladi — video'ga o'tish `replaceTrack()` bo'ladi, renegotiation kerak emas (serverga qo'shimcha offer/answer yurmaydi). Peer o'zgarishni `call:media` dan biladi.
- **`callId` `RTCPeerConnection` dan oldin yaratiladi** (`newCallId()`), chunki `setLocalDescription` ICE yig'ishni darhol boshlaydi — har bir nomzod qarshi tomon solishtiradigan id bilan ketishi shart. Qabul qiluvchi tomon id'siz nomzodni ham qabul qiladi (bir vaqtda bitta qo'ng'iroq bo'lgani uchun), faqat **noto'g'ri** id'lisini tashlaydi.
- ICE nomzodlari `ICE_BATCH_MS` (700ms) buferlanib **paket qilib** yuboriladi — aks holda har nomzod alohida DB yozuviga aylanardi. Taymer **birinchi** nomzodda ishga tushadi va surilmaydi; qo'ng'iroq tugaganda `cancelIce()` buferlarni tozalaydi.
- STUN serverlari `callConfig()` da hardcode (Google STUN). **TURN ixtiyoriy** — `.env` dagi `VITE_TURN_URL`/`VITE_TURN_USERNAME`/`VITE_TURN_CREDENTIAL` to'ldirilsa qo'shiladi. Bo'sh bo'lsa faqat STUN qoladi va turli NAT ortidagi (mobil internet, korporativ wifi) qo'ng'iroqda media o'tmaydi.
- `connectionState === "failed"` da qo'ng'iroq yopiladi va jurnalga yoziladi; `"closed"` esa o'z `teardown()`imiz — unga reaksiya qilinmaydi.
- Qo'ng'iroq tugaganda har ikki tomon **o'zi uchun** lokal "call" bubble'ini yozadi (`logCallMessage`) — bu wire'dan o'tmaydi.

#### Redux (`src/store/`)
`authSlice` (user + `token` = userId) · `accountsSlice` (ko'p akkaunt eslab qolish + almashtirish) · `uiSlice` (tema, shrift, wallpaper, bildirishnoma/maxfiylik/auto-download sozlamalari) · `appSlice` (**faqat klientda yashovchi holat**: kanallar/guruhlar, qo'ng'iroqlar tarixi, `giftsByEmail`, `postsByEmail`, `postViewers`, `viewedPosts`, `profileOverrides`).
- `redux-persist` **to'rttala slice'ni ham** localStorage'ga saqlaydi (`whitelist`), `version: 2` va v2 migratsiyasi bor (mavjud sessiyadan `accounts` ro'yxatini to'ldiradi). Persist shakli o'zgarsa versiyani oshirib migratsiya yozish shart.
- `ProtectedRoute` faqat `auth` slice'ga qaraydi — server tomonda qayta tekshiruv yo'q.

#### UI qatlami
- `layouts/ChatLayout.jsx` (900+ qator) — chap rail + chat ro'yxati + global qidiruv + `Outlet`. Barcha yon panellar bitta `activePanel` state'i orqali boshqariladi va `components/panels/SlideOver.jsx` ichida render bo'ladi (`profile`, `wallet`, `contacts`, `calls`, `channel`, `group`, `settings`, `friend-requests`, `AccountDrawer`). Yangi panel qo'shish = `panels/` ga komponent + `activePanel` kalitiga ulash.
- `components/settings/Section*.jsx` — Settings paneli bo'limlari; `appearance.js`/`sounds.js`/`storage.js`/`i18n.js` — sof helper modullari.
- `lib/` — `media.js` (MediaRecorder → data URL), `image.js`, `ringtone.js` (WebAudio jiringlashi), `format.js`, `avatarColor.js`, `api.js` (**eski REST qoldig'i — joriy backendda ishlamaydi**).
- Dependency'lar ataylab minimal (7 ta: React, router, RTK, react-redux, redux-persist, socket.io-client). Lokal id kerak bo'lsa `nanoid` **`@reduxjs/toolkit` dan import qilinadi** (`import { nanoid } from "@reduxjs/toolkit"`) — alohida paket o'rnatilmaydi. Emoji picker, ikonkalar, sana formatlash — hammasi qo'lda yozilgan (`components/icons.jsx`, `lib/format.js`), UI kutubxonasi qo'shilmaydi.

#### `UNSUPPORTED` shabloni — kod yozishdan oldin o'qing
UI boyroq serverga mo'ljallab qurilgan. Backend qo'llab-quvvatlamaydigan narsalar **o'chirilmagan** — ular `WebSocketContext.jsx` dagi `UNSUPPORTED` konstantasini (`{ ok: false, error: "Не поддерживается сервером" }`) qaytaradigan stub'lar: guruhlar/kanallar (`createRoom`, `joinRoom`, `sendRoomMessage`…), stories, typing indikatori (`sendTyping` — no-op, `typing` state doim bo'sh), OTP (`verifyOtp`/`resendOtp`).
Shu sabab `/room/:roomId` route'i va `RoomConversation` mavjud, lekin real serverga bog'lanmagan — `appSlice` dagi lokal guruh/kanal yozuvlari bilan ishlaydi. **Bu funksiyalarni "tuzatishga" urinishdan oldin backend kontrakti o'zgarganini tekshiring** — aks holda mavjud stub yaxshiroq yechim.

### Backend (`prod/src/`, `sanjarb` branch — faqat o'qish uchun)
- **`index.js` — yagona real entrypoint** (320 qator). REST yo'q (faqat `GET /` health), butun API socket event'lari va hammasi ack-callback bilan javob beradi:

| Event (client → server) | Payload | Ack / Push |
|---|---|---|
| `auth:register` | `{email, password, firstName, lastName, age}` | `{success, user}` (bcrypt) |
| `auth:login` | `{email, password}` | `{success, user}` |
| `user:online` | `userId` | → hammaga `users:online` (online id massivi) |
| `contacts:list` | `userId` | `{contacts}` — populated + har birida `unreadCount` |
| `users:search` | `{currentUserId, query}` | `{users}` (`currentUserId` `$ne` bilan chiqarib tashlanadi, ObjectId'ga cast qilinadi) |
| `contacts:add` | `{userId, targetId}` | `{success, contact}`; nishonga `contacts:added` + `notification:new` |
| `notifications:list` / `notifications:read` | `userId` | `{notifications, unreadCount}` |
| `chat:history` | `{from, to}` | `{messages}` |
| `chat:send` | `{from, to, text}` | `{success, message}`; qabul qiluvchiga `chat:receive` (yuboruvchiga echo **yo'q** — ack'dan qo'shiladi). Birinchi xabarda ikkala tomon avtomatik kontakt bo'ladi → `contacts:added` |
| `chat:read` | `{userId, fromUserId}` | yuboruvchiga `chat:read {by}` |
| `disconnect` | — | → `users:online` qayta broadcast |

- **Auth modeli: token/sessiya yo'q.** `auth:login` shunchaki `{success, user}` qaytaradi; parol `User.password` da (`select: false`). Eski OTP davrida yaratilgan parolsiz akkauntlar login qila olmaydi (shuning uchun `scripts/fix-login-passwords.cjs`).
- `start.js` — **eski entrypoint, ishlatilmaydi** (REST + `friend_request:*` + Gmail OTP kontrakti). `bekzod-backend-presence.patch` aynan shunga qarshi yozilgan.
- Modellar: `User` (`contacts: [ObjectId]`, `password`), `Message` (`from`, `to`, `text`, `read`), `Notification` (`user`, `from`, `type: 'friend_add'`, `read`). **Room/guruh, Friend, RefreshToken, VerificationCode modellari yo'q.**
- `sanjarb` branch'ida `origin/main` dagi 2 ta keyingi fix **yo'q**: parolsiz akkauntda login guard (`8245e1f`), room-based delivery (`ebda063`).

### ⚠️ Tuzoqlar (kod yozishdan oldin biling)
1. **Login parolni majburiy tekshirmaydi.** `login()` avval `auth:login` ni sinaydi; muvaffaqiyatsiz bo'lsa `users:search` orqali emailni topib **parolsiz kiritadi** (`login()` funksiyasi, `WebSocketContext.jsx`). Bu ataylab qo'yilgan vaqtinchalik yechim — auth'ga tegishli ish qilsangiz shuni hisobga oling va o'z-o'zidan "tuzatib" qo'ymang, avval so'rang.
2. **Socket event nomlari — kontrakt.** Frontenddagi har bir `socket.on`/`emit` `prod/src/index.js` dagi nom bilan 1:1 mos bo'lishi shart. Yangi event **qo'shib bo'lmaydi** (backend bizniki emas) — yangi funksiya kerak bo'lsa envelope tunnelidan foydalaning.
3. **Fayllar data URL sifatida yuboriladi**, alohida upload servisi yo'q — ~600–700 KB dan katta media yuborilmaydi.
4. Login formasi parolni kamida 6 belgi talab qiladi — shuning uchun admin paroli `putin123` (`putin` emas).
5. **Ildizdagi qoldiqlarning ko'pi aslida repo ichida** — "track qilinmaydi" deb o'ylab ish qilmang. Faqat `dist/` va `*.local` haqiqatan `.gitignore` da. `frontend/latest/` (105 fayl), `mcode.exe` (1.3 MB binary, `9434e37` da qo'shilgan) va to'rtta `*.patch` — hammasi commit qilingan. `.env` ham track qilinadi: maxfiy qiymatlar faqat `.env.local` ga yoziladi (u `*.local` orqali ignore'da va Vite'da ustun turadi), ildizdagi `.env` da bo'sh placeholder qoldiriladi. Bu fayllar repo'da bo'lsa ham **ish maydoni emas** — ularga kod yozilmaydi.

### Ikkala tomon bilan ishlash
`claude/RULES.md` — `claude/` papkasining ichki tartibi. `claude/tasks/task.md` (faol vazifalar) va `done.md` (arxiv, hech qachon o'chirilmaydi) — asosan o'zbek tilida jonli log. Vazifa bajarilsa `task.md` dan sana bilan `done.md` ga ko'chiriladi. Yuqoridagi ⚠️ ogohlantirishni yodda tuting: `done.md` yozuvlarining ko'pi endi mavjud bo'lmagan backend haqida.

---

# 🔥 Asosiy qoidalar (Eng yuqori ustuvorlik)

Bu fayldagi barcha qoidalar majburiy.

Hech qaysi qoida e'tiborsiz qoldirilmaydi.

Kod yozishdan oldin ushbu fayl va `claude/` papkasidagi barcha qoidalar o'qilishi shart.

Agar qoidalar va foydalanuvchi topshirig'i o'rtasida ziddiyat bo'lsa, davom etishdan oldin foydalanuvchidan aniqlik kiritish so'raladi.

---

# 📁 Claude papkasi (Majburiy)

Loyihada `claude/` papkasi doimo mavjud bo'lishi kerak.

Har qanday ishni boshlashdan oldin Claude quyidagilarni bajarishi shart:

* `claude/` papkasi mavjudligini tekshirish.
* Papka ichidagi barcha `.md` fayllarni o'qish.
* Har bir qoidani tushunish.
* Har bir qoidaga to'liq amal qilish.
* Hech bir qoidani o'tkazib yubormaslik.
* Har bir yangi task boshlanishidan oldin qoidalarni qayta tekshirish.

Agar `claude/` papkasi mavjud bo'lmasa yoki qoida fayllari topilmasa, bu haqida foydalanuvchiga xabar beriladi.

---

# 👤 Foydalanuvchiga murojaat qilish

Claude foydalanuvchiga har doim:

**Putin**

deb murojaat qiladi.

Agar foydalanuvchi boshqa ism bilan murojaat qilishni so'ramasa, har doim "Putin" ishlatiladi.

---

# 🧠 Ishlash tartibi

Har bir task quyidagi ketma-ketlikda bajariladi.

1. Vazifani tushunish.
2. `CLAUDE.md` faylini o'qish.
3. `claude/` papkasidagi barcha qoidalarni o'qish.
4. Loyiha strukturasini tahlil qilish.
5. Reja tuzish.
6. Kod yozishni boshlash.
7. Kodni tekshirish.
8. Xatolarni tuzatish.
9. Yakuniy tekshiruv.
10. Javob berish.

Kod yozishdan oldin reja tuzilishi majburiy.

---

# 💻 Kod yozish qoidalari

Har doim:

* Toza kod yozish.
* Tushunarli kod yozish.
* Qayta ishlatiladigan komponentlardan foydalanish.
* Takroriy kod yozmaslik.
* Keraksiz kutubxona qo'shmaslik.
* Mavjud loyiha uslubiga amal qilish.
* Loyiha arxitekturasini buzmaslik.
* Keraksiz fayllar yaratmaslik.
* Keraksiz kod qoldirmaslik.
* Console error qoldirmaslik.
* ESLint xatolarini qoldirmaslik.
* Build buzilishiga sabab bo'ladigan kod yozmaslik.

---

# 📂 Fayllar bilan ishlash

Fayl yaratishdan oldin:

* Mavjud fayl bor-yo'qligini tekshirish.
* Takroriy fayl yaratmaslik.
* Keraksiz papka yaratmaslik.

Fayl o'chirishdan oldin foydalanuvchi roziligi olinadi.

---

# 🗄️ Ma'lumotlar bazasi

MongoDB ishlatilayotgan bo'lsa:

* Static data ishlatilmaydi.
* Fake data ishlatilmaydi.
* localStorage asosiy ma'lumotlar uchun ishlatilmaydi.
* db.json ishlatilmaydi.
* API orqali ishlash afzal.

---

# 🔒 Xavfsizlik

Har doim:

* Inputlarni tekshirish.
* XSS oldini olish.
* Injection xavfini oldini olish.
* Maxfiy kalitlarni kod ichiga yozmaslik.
* `.env` dan foydalanish.

---

# ⚡ Ishlash sifati

Har doim:

* Optimal kod yozish.
* Keraksiz renderlarni kamaytirish.
* Keraksiz so'rov yubormaslik.
* Performance haqida o'ylash.

---

# 🎨 Dizayn

UI ishlab chiqilganda:

* Responsive bo'lishi.
* Mobile ishlashi.
* Tablet ishlashi.
* Desktop ishlashi.
* Chiroyli animatsiyalar ishlatilishi.
* Zamonaviy dizayn saqlanishi.

---

# 🧪 Test

Task tugashidan oldin tekshiriladi:

* Kod ishlaydimi.
* Importlar to'g'rimi.
* Syntax xatolari yo'qmi.
* Console error yo'qmi.
* Build o'tadimi.
* Mantiqiy xatolar yo'qmi.

---

# ❌ Taxmin qilish taqiqlanadi

Claude quyidagilarni taxmin qilmaydi:

* API mavjudligini.
* Database strukturasi.
* Route mavjudligini.
* Environment variable qiymatini.
* Kutubxona mavjudligini.

Agar ma'lumot yetarli bo'lmasa, foydalanuvchidan so'raladi.

---

# 📋 Task tugagandan keyin

Har bir task tugaganda:

* Kod qayta tekshiriladi.
* Barcha qoidalarga mosligi tekshiriladi.
* Tugallanmagan joy qolmaganligi tekshiriladi.
* Keraksiz kod olib tashlanadi.
* Javob beriladi.

---

# 🚫 Taqiqlanadi

Quyidagilar mumkin emas:

* Qoida buzish.
* Rejasiz kod yozish.
* Yarim tayyor kod qoldirish.
* TODO qoldirish.
* FIX ME qoldirish.
* Ishlamaydigan kod yozish.
* Takroriy kod yozish.
* Keraksiz package o'rnatish.
* Keraksiz fayl yaratish.
* Keraksiz kod qo'shish.

---

# ✅ Yakuniy tekshiruv

Javob berishdan oldin Claude quyidagilarni tekshiradi:

✅ `CLAUDE.md` qoidalari bajarildimi?

✅ `claude/` papkasidagi barcha qoidalar bajarildimi?

✅ Kod to'liq tugadimi?

✅ Build buzilmaydimi?

✅ Console error yo'qmi?

✅ Import xatolari yo'qmi?

✅ Keraksiz kod qolmadimi?

✅ Loyiha strukturasi buzilmadimi?

✅ Javob foydalanuvchi talabiga mosmi?

---

# Yakuniy qoida

Har bir yangi task boshlanishida ushbu fayl va `claude/` papkasidagi barcha qoidalar avtomatik ravishda qayta o'qiladi va ularga to'liq amal qilinadi.

Ushbu fayldagi qoidalar loyiha uchun eng yuqori ustuvor qoidalar hisoblanadi va istisnosiz bajarilishi shart.
