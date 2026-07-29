# Bajarilgan Vazifalar (Completed Tasks)

> `task.md` dan bajarilgan vazifalar shu yerga ko'chiriladi. Bu yerdan hech narsa o'chirilmaydi.

## Format
```
### [Kategoriya] Vazifa nomi
- **Yaratilgan:** YYYY-MM-DD
- **Bajarilgan:** YYYY-MM-DD
- **Tavsif:** ...
```

---

### [Merge/Feature] sanjarf frontend'ini qabul qilish (hamma kod sanjarnikidan)

- **Yaratilgan:** 2026-07-24
- **Bajarilgan:** 2026-07-24
- **Tavsif:** `sanjarf` branch'i `nF-2403-Teamwork/prod` repo'sida topildi
  (chat-backend'da emas; u yerda yana `frontend`, `sanjarP`, `ziyoda-updates`
  branch'lari bor). Root ChatFlow repo'siga fetch qilinib, `-X theirs`
  (hamma konflikt sanjar foydasiga) bilan master'ga merge qilindi — yagona
  haqiqiy konflikt `.gitignore` edi. Natija: **repo ildizi endi sanjarning
  to'liq frontend'i** (React 18 + Vite 5 + Tailwind/DaisyUI, Telegram-uslub
  UI; butun socket qatlami `src/context/WebSocketContext.jsx`da). Tekshirildi:
  sanjarf emit qiladigan 11 ta event `prod/src/index.js` (sanjarb) handler'lari
  bilan 1:1 mos — juftlik bir-biri uchun yozilgan; auth socket orqali
  (`auth:login`), "token" = userId; post/gift/call'lar `chat:send` envelope
  ichida. sanjarb'ning o'zi allaqachon yangilangan edi (pull no-op; chat-backend
  `main`i ham endi sanjarb merge'i). Eski frontend `frontend/latest/` diskda
  legacy sifatida qoldi (track qilinmaydi). Infra: `.env.local` →
  `VITE_SOCKET_URL=http://localhost:5000`; root package.json `type: module`
  bo'lgani uchun `scripts/*.js` → `.cjs` qilib nomlandi. Xatoliklar o'zim
  tuzatildi (foydalanuvchi "so'rab o'tirma" dedi): (1) bir tomonlama kontakt
  migration'i `--apply` bilan qo'llandi (qolgan 2 yozuv mutual qilindi);
  (2) admin paroli `putin` (5 belgi) sanjarf'ning 6-belgi validatsiyasidan
  o'tmasdi → `putin123` (`scripts/fix-login-passwords.cjs`, seed ham mos);
  (3) "parolsiz OTP akkauntlari" tashvishi tekshirilganda allaqachon hal —
  bazadagi 13 user'ning hammasida bcrypt parol bor. Tekshiruv: `npm install`
  + build o'tdi; Playwright smoke — admin/putin123 bilan UI orqali login,
  kontaktlar ro'yxati (sanjar, Bekzod, Xojiakbar...) chiqdi, skrinshot bilan
  tasdiqlangan; vaqtinchalik smoke-akkaunt DB'dan tozalandi.

- **Yaratilgan:** 2026-07-24
- **Bajarilgan:** 2026-07-24
- **Tavsif:** `prod/` (chat-backend) `origin/sanjarb`ga o'tkazildi (lokal
  start.js listen-fix stash'landi: "start.js: listen-after-connect fix").
  sanjarb = entrypoint `src/index.js` + `User.password` maydoni. Yangi
  kontrakt: REST YO'Q — hammasi socket ack bilan (`auth:login/register`,
  `contacts:list` unreadCount bilan, `users:search`, `contacts:add` —
  mutual+idempotent, `notifications:list/read`, `chat:read` o'qilgan
  belgisi). Frontend to'liq moslandi: `constants.js` yangi event xaritasi;
  `authService` socket'ga o'tdi (`emitWithAck` helper `socket.js`da);
  `chatService` — `fetchContacts`/`markChatRead`/`onChatRead`;
  `friendService` — search/add/notifications; `usersSlice` — server-haqiqat
  kontaktlar (+unread reducer'lari); sidebar'da unread badge, MessageBubble
  ✓✓ endi jonli ishlaydi; Friends sahifasi qidiruv-asosli bo'ldi (users:all
  yo'q); `UserProfile`dan ma'nosiz "add friend" tugmasi olib tashlandi;
  `authSlice.addContactId` va `friendsSlice` (storedan) olib tashlandi.
  Infra: `prod/.env`ga `MONGO_URL` qo'shildi (index.js faqat shuni o'qiydi);
  `scripts/sync-auth-passwords.js` — eski `auths` kolleksiyasidagi bcrypt
  xeshlarni `User.password`ga ko'chirdi (2 ta: admin, test). MUHIM: eski OTP
  davrida yaratilgan userlar (sanjar, Xojiakbar, Bekzod...) parolsiz — yangi
  backend'da parol o'rnatilmaguncha kira olmaydi; sanjarb branch'ida
  origin/main'dagi login-guard (8245e1f) va room-delivery (ebda063) fixlari
  YO'Q. Tekshiruv: to'liq socket E2E o'tdi (login→register→search→add(+push)
  →mutual list→send/receive→unread 1→read→unread 0), lint/build toza.

- **Yaratilgan:** 2026-07-24
- **Bajarilgan:** 2026-07-24
- **Tavsif:** /friends'da sanjar/Xojiakbar'ga "Добавить" bosilganda 400
  "Bu foydalanuvchi allaqachon kontaktlaringizda" chiqar, lekin chap
  paneldagi CONTACTS'da ular yo'q edi. **DB tekshiruvi** (read-only script)
  isbotladi: `users.contacts`da admin↔sanjar va admin↔Xojiakbar IKKALA
  tomonlama BOR — backend haq. Yagona do'stlik manbai `User.contacts`
  (eski `friends`/`friendships` kolleksiyalari bo'sh; status/pending degan
  tushuncha yo'q — so'rovlar ephemeral). Asosiy sabab: sidebar va /friends
  ro'yxatlari DB'dan emas, redux-persist'dagi eskirgan `auth.user.contacts`
  massividan chiqadi (kontakt bu klient offline paytida qo'shilsa, massiv
  hech qachon yangilanmaydi — kontraktda "mening kontaktlarim"ni olib
  keladigan endpoint yo'q). **Tuzatish (frontend):**
  1. `friendService.js` — interceptor'dagi `toast.error` olib tashlandi
     (toast ikki marta chiqishining sababi: interceptor + catch), yangi
     `isAlreadyContactError()` eksporti.
  2. `DiscoveryCard.jsx` — "allaqachon kontakt" 400 endi xato emas,
     o'z-o'zini davolash signali: `addContactId` dispatch qilinadi (user
     sidebar'ga tushadi, discovery'dan yo'qoladi). Uch holat — uch xabar:
     qo'shildi / allaqachon bor (ro'yxat sinxronlandi) / haqiqiy xato.
  3. `translations.js` — `friends.alreadyContactSynced`, `friends.addFailed`
     (en/uz/ru).
  **Migration:** `scripts/fix-one-way-contacts.js` (dry-run default,
  `--apply` bilan yozadi) — bazada 5 ta bir tomonlama yozuv topildi
  (admin→Bekzod M., Azizbek, Test User, Alice, Bob), mutual qilinadi.
  **Tekshiruv:** socket-level E2E o'tdi — send→received→accept→accepted
  to'liq oqim, DB'da ikkala yo'nalish bor, dublikat yo'q; lint (o'zgartirilgan
  fayllar toza) va build o'tdi.

- **Yaratilgan:** 2026-07-22
- **Bajarilgan:** 2026-07-22
- **Tavsif:** Xato: `chatService.js does not provide an export named
  'addRoomMembers'` (va shu sinf: profileService, authSlice va h.k.). Sabab
  nuqtaviy emas edi — frontend YARIM tugallangan migratsiya holatida edi:
  ba'zi fayllar (Chat.jsx, Sidebar, chatSlice, chatService, friendService,
  authSlice, usersSlice, useSocket) soddalashtirilgan backend'ga ko'chirilgan,
  lekin ChatWindow + butun Friends/ papkasi + bir qancha orphan eski "boy"
  backend (rooms, typing, edit/delete/pin/save, seen, discovery, notifications,
  persist qilingan friend-request) uchun yozilgan holicha qolgan edi.
  **Audit:** `src/` ning barcha named import↔export mosligini tekshiruvchi
  skript yozildi (scratchpad/audit-imports.cjs) — 49 nomuvofiqlik topildi,
  hammasi shu eski-avlod fayllarda. `Chat.jsx→ChatWindow` va
  `Friends.jsx→tab'lar` route orqali yuklangani uchun /chat va /friends
  runtime'da butunlay ishlamas edi.
  **Yechim (Putin tanladi: frontend'ni joriy backend'ga moslab tugatish):**
  - ChatWindow.jsx — DM-only qilib qayta yozildi (chat:history/send, backend
    `{from,to,text,read}` shakli; incoming'ni useSocket global boshqaradi).
  - Friends.jsx — yagona "Discover & Add" sahifasi (users:all + add-contact,
    kontaktlarni chetlab, client qidiruv); DiscoveryCard soddalashtirildi.
  - MessageBubble.jsx — `text`/`read` (backend) va `content`/`isSeen` (eski)
    ikkalasini qo'llab-quvvatlaydigan qilindi.
  - chatSlice.js — `selectMessagesByUser` barqaror bo'sh massiv qaytaradi
    (React-Redux "unnecessary rerenders" warn'ini yo'qotdi).
  - O'chirildi (9 fayl, Putin roziligi bilan): GroupInfo, CreateRoomModal,
    RoomItem, NotificationBell, pages/Notifications, Friends/FriendsTabs,
    DiscoveryTab, RequestsTab, RequestCard. `useInfiniteScroll` qoldirildi
    (toza, reusable). discoverySlice/notificationsSlice/notificationService —
    umuman yo'q edi, endi ularga havola qolmadi.
  **Tekshiruv:** audit 49→0; `npm run build` OK (444 modul, import xatosi
  yo'q); ESLint — teggan fayllarda yangi xato yo'q (qolgan 6 xato oldindan
  mavjud, boshqa fayllarda); Playwright smoke (chromium): admin bilan login →
  /login /register /chat /friends aylandi — **console mutlaqo toza**.
  **Eslatma:** `tests/group-chat.spec.js` va `group-rename.spec.js` endi
  mavjud bo'lmagan guruh-chat funksiyasini sinaydi — ular eskirgan, yangilash
  yoki o'chirish kerak (doiradan tashqari).

### [DevOps/Seed] Local dev uchun admin/test akkaunt

- **Yaratilgan:** 2026-07-22
- **Bajarilgan:** 2026-07-22
- **Tavsif:** `admin@gmail.com` / `putin` akkaunti yaratildi (Muhammadali
  Rustamov, 18 yosh). Joriy backend (`prod/src/start.js`) auth modeli:
  parol alohida `Auth` kolleksiyasida, `pre('save')` hook orqali **bcrypt
  salt round 10**; login **token bermaydi** — faqat `{success, user}`
  qaytaradi. Ishlaydigan akkaunt uchun IKKI hujjat kerak: `User` (profil)
  + `Auth` (email + xeshlangan parol + userId). User modelida `role`/
  `isVerified` maydonlari yo'q, login verification tekshirmaydi.
  Seed script **`scripts/seedAdmin.js`** (repo root'da — backend
  Bekzodники, tahrirlanmadi; `prod/` modellari faqat
  require qilib qayta ishlatildi). `prod/package.json` ham tegilmadi;
  ishga tushirish: `node scripts/seedAdmin.js`. Parol "putin" 5 belgi
  (schema minlength 6), shuning uchun `validateBeforeSave:false` bilan
  chetlab o'tildi — hook baribir round 10 bilan xeshlaydi, login uzunlikni
  tekshirmagani uchun ishlaydi (lekin oddiy register formasi bu parolni
  qabul qilmaydi). Upsert: User `findOneAndUpdate(upsert)`, Auth topib
  yangilaydi/yaratadi. Tekshiruv: seed OK (User yangilandi, Auth
  yaratildi), login `curl` → to'g'ri parol HTTP 200 + to'g'ri ism-familiya,
  noto'g'ri parol HTTP 401.
  **Eslatma:** backend jarayoni Atlas overload paytida ishga tushgani
  uchun Mongo ulanmay qotib qolgan edi (`buffering timed out`) —
  `start.js` `mongoose.connect()`ni bir marta chaqiradi va boshlang'ich
  xatodan keyin o'zi tiklanmaydi; backend restart qilingach `MongoDB
  connected` va login ishladi.

### [Bugfix+Perf] Notifications — timeout, StrictMode double-fetch, Atlas kechikish

- **Yaratilgan:** 2026-07-16
- **Bajarilgan:** 2026-07-16
- **Tavsif:** Real brauzerda (Playwright) va real backend/MongoDB Atlas'da
  to'liq oqim qayta tekshirildi — timeout toza holatda takrorlanmadi, lekin
  uchta real muammo topildi va tuzatildi:
  1. `Notifications.jsx`dagi mount effect'ida cleanup yo'q edi — React
     StrictMode uni ikki marta chaqirib, `get-notifications`ni ikki marta
     yuborardi (ref-guard bilan tuzatildi).
  2. `.find().populate("senderId")` Atlas'da IKKITA ketma-ket (parallel
     emas) so'rov talab qilardi — shuning uchun kechikish 226-1183ms
     oralig'ida sakrardi (talab: <500ms). `$lookup` bilan bitta
     aggregatsiyaga birlashtirildi — natija: barqaror 114-124ms.
  3. **Muhim:** aggregatsiyaga o'tishda `$match: {recipientId: socket.userId}`
     satr sifatida solishtirilardi — `.aggregate()` Mongoose'ning avtomatik
     ObjectId cast'ini qo'llamaydi (`.find()`/`.countDocuments()` esa
     qo'llaydi). Bu HAR BIR real bildirishnomaga ega foydalanuvchi uchun
     bo'sh ro'yxat qaytarardi — `total` to'g'ri, `items` bo'sh. Real
     ma'lumot bilan (faqat admin'ning bo'sh ro'yxati bilan emas) tekshirib
     topildi va `new mongoose.Types.ObjectId(socket.userId)` bilan
     tuzatildi. Eski `.populate()` natijasi bilan bayt-baytiga solishtirib
     tasdiqlandi.
  Qo'shimcha: backend'ga vaqt o'lchash logi (`mongo=Xms total=Yms`)
  qo'shildi; frontend'da xato holati bo'sh ro'yxatdan ajratildi (Redux
  `error` maydoni) va Retry tugmasi qo'shildi — Playwright orqali WS'ni
  bloklab, Retry tugmasi cheklangan vaqtda chiqishi va qayta ulanish
  ishlashi tasdiqlandi (F5 shart emas).
  **Alohida topilma (tuzatilmadi, doiradan tashqari):** `index.js`dagi
  socket disconnect handler `socket.userId`ni Mongo so'rovida cast
  qilmasdan ishlatadi — faqat sun'iy (real bo'lmagan) noto'g'ri JWT bilan
  namoyon bo'ldi, real foydalanuvchida yuz bermaydi.

### [Bugfix] Notifications sahifasi — "Failed to load notifications" xatosi

- **Yaratilgan:** 2026-07-16
- **Bajarilgan:** 2026-07-16
- **Tavsif:** `services/socket.js` dagi `emitEvent` funksiyasi `socket.connected`
  tekshiruvi bilan himoyalangan edi va handshake tugamagan paytda yuborilgan
  paketlarni jimgina tashlab yuborardi ("will retry on reconnect" izohi noto'g'ri
  edi — hech narsa qayta urinmasdi). `SocketProvider` socket'ni yaratadi, sahifa
  esa o'sha zahoti `get-notifications` yuboradi — socket hali ulanmagan bo'ladi,
  shuning uchun so'rov har safar yo'qolardi va 10 soniyadan keyin timeout
  "Failed to load notifications" xatosini ko'rsatardi. socket.io o'zi paketlarni
  bufferlaydi, shuning uchun `connected` tekshiruvi olib tashlandi.
  `getFriends` faqat `waitForConnection()` ishlatgani uchun ta'sirlanmagan edi.
  Qo'shimcha: backend xatoni bo'sh ro'yxat bilan yashirardi — endi
  `notifications-error` yuboradi va haqiqiy xatoni log qiladi.
  **Eslatma:** :5000 portidagi ishlab turgan server eski kod bilan ishlayapti —
  `get-notifications` handler'i yo'q. Serverni qayta ishga tushirish kerak.

### [Feature] Xabar holati (✓/✓✓), unread badge va bildirishnoma ovozi

- **Yaratilgan:** 2026-07-17
- **Bajarilgan:** 2026-07-17
- **Tavsif:** Uch funksiya, hammasi Socket.io + MongoDB (fake data yo'q):
  1. **Read status:** `MessageBubble` belgilar Telegram uslubiga o'tkazildi —
     yuborilgan-o'qilmagan: bitta kulrang ✓; o'qilgan: ikkita ustma-ust yashil
     ✓✓ (green-300, size 12, `-ml-[7px]`). Holat Mongo'da (`isSeen`/`seenAt`),
     real-time `messages-seen` → `seen-status` oqimi mavjud edi, tegilmadi.
  2. **Unread badge (asosiy bug):** backend unread sonni faqat YUBORUVCHIga
     push qilardi — qabul qiluvchi badge'i hech qachon yangilanmasdi va
     login'da yuklanmasdi. Tuzatildi: `send-message` va `forward-message`
     endi qabul qiluvchiga `io.to(receiverId)` orqali Mongo'dan hisoblangan
     sonni push qiladi; `messages-seen` o'quvchining barcha qurilmalariga
     qolgan sonni push qiladi (badge avtomatik yo'qoladi); yangi
     `get-unread-counts` handler login/reconnect'da to'liq per-sender map
     qaytaradi (aggregate — `new mongoose.Types.ObjectId` cast bilan,
     done.md'dagi oldingi saboq). Frontend: `UNREAD_COUNTS_ALL` event,
     `chatSlice.setAllUnreadCounts`, connect'da `GET_UNREAD_COUNTS` emit.
     Badge UI (`ContactItem`) mavjud edi — tegilmadi.
  3. **Ovoz:** yangi `utils/notificationSound.js` — Web Audio API bilan
     sintezlangan qisqa ikki-notali chime (audio fayl/paket shart emas),
     message-id bo'yicha dedupe (bir xabar — bir ovoz, dublikat socket
     yetkazishlarida ham). `useSocket`da uch joyda: `receive-message`,
     `new-message-request`, `receive-room-message` — hammasi bir xil gating:
     o'z xabariga yo'q, ochiq va ko'rinib turgan chatga yo'q (u zahoti
     o'qilgan hisoblanadi), autoplay policy xatosi yutiladi.
  Tekshiruv: `node --check` OK, nodemon restart + Mongo connect toza,
  ESLint 0 xato (teggan fayllarda), Vite HMR xatosiz.
  **Eslatma:** Render'dagi backend hali eski kodda (444b0df push qilingan,
  lekin health-poll 8 daqiqada 404'dan chiqmadi — deploy holatini Render
  dashboard'da tekshirish kerak); bu funksiyalar hozircha faqat lokal
  backendda jonli.

### [Feature+Bugfix] Contacts — "Добавить" bosilganda darhol kontakt qo'shilishi

- **Yaratilgan:** 2026-07-17
- **Bajarilgan:** 2026-07-17
- **Tavsif:** "Добавить" tugmasi ilgari `send-friend-request` (`pending`) yaratardi
  — kontakt faqat qabul qilingandan keyin qo'shilardi, shuning uchun bosishda
  hech narsa ko'rinmasdi. Endi to'g'ridan-to'g'ri, ikki tomonlama `accepted`
  munosabat yaratiladi (request/accept qadamisiz).
  - **Backend** (`sockets/friendRequests.js`): yangi `add-contact` handler —
    mavjud juftlikni topadi/yaratadi (dublikatsiz, `pairKey` unique index;
    11000 race re-read), `pending` bo'lsa `accepted`ga ko'taradi, ikkala
    tomonga `chat-created` push qiladi (`redactForOthers` bilan).
  - **Frontend:** `constants.js` (ADD_CONTACT*), `friendService.addContact`,
    `discoverySlice.removeDiscoveryItem`, `DiscoveryCard.handleAdd` → `addContact`
    + discovery'dan olib tashlash, `useSocket` `chat-created`da ham
    `removeDiscoveryItem`, `Sidebar` kontakt bo'limi doim "Contacts",
    `translations` (en/uz/ru) `friends.addedToContacts`.
  Mavjud infra qayta ishlatildi: `chat-created` → `addUser` + `upsertRelationship`
  ikkala sidebarni jonli yangilaydi; `get-friends` login'da Mongo'dan yuklaydi
  (persistence). Request/accept oqimi va message-gate tegilmadi.
  Tekshiruv: ESLint (yangi xato yo'q), backend toza restart + Mongo ulanish,
  Vite compile toza.

### [Bugfix] Accept Friend Request — qabul qilingan do'st sidebarda ko'rinmasligi

- **Yaratilgan:** 2026-07-16
- **Bajarilgan:** 2026-07-16
- **Tavsif:** `usersSlice.addUser` reducerida mavjudlikni tekshirish sharti
  `u.id === action.payload.id` ikkala tomon ham `undefined` bo'lganda `true`
  qaytarardi (socket `.toObject()` payload'ida `id` yo'q, faqat `_id` bor).
  Natijada kontakt ro'yxati bo'sh bo'lmaganda `chat-created` hodisasi kelgan
  yangi do'st hech qachon qo'shilmasdi — ikkala foydalanuvchi uchun ham.
  Endi ID `_id || id` orqali normalizatsiya qilinadi. Backend, socket
  hodisalari va komponentlar to'g'ri ishlagan — o'zgartirilmadi.

### [Bugfix] Socket.IO — Render backendga o'tgandan keyin userlar ko'rinmasligi

- **Yaratilgan:** 2026-07-17
- **Bajarilgan:** 2026-07-17
- **Tavsif:** Asosiy sabab (jonli tekshiruv bilan isbotlangan):
  chat-backend-nl2o.onrender.com da ESKI backend build ishlab turibdi —
  barcha `/api/*` REST yo'llar 404 qaytaradi (jumladan `/api/auth/login`,
  `/api/health`) va socket auth middleware yo'q (yaroqsiz token ham
  ulanadi). Login ishlamagani uchun token yo'q, `friends-list` hech qachon
  kelmaydi → userlar ro'yxati bo'sh. Kodda tuzatilganlar:
  1. `frontend/latest/.env.local` — `VITE_SERVER_URL` oxiridagi ortiqcha
     `/` olib tashlandi (u `API_URL`ni `...com//api` qilib, Express'da 404
     berardi).
  2. `frontend/latest/src/services/socket.js` — connect/disconnect/
     connect_error/reconnect loglari; DEV rejimida emit/receive loglari.
  3. `prod/src/utils/tokens.js` — refresh cookie production'da
     `sameSite: "none"` (cross-site frontend↔Render uchun majburiy).
  Qolgan ish (foydalanuvchi tomonida): Render'da prod repo'ning oxirgi
  `main` (444b0df) commit'ini qayta deploy qilish va env'larni tekshirish
  (`MONGODB_URI`, `JWT_SECRET` — bularsiz yangi kod ishga tushmaydi va
  Render eski buildni ko'rsatishda davom etadi; `CLIENT_URL` — frontend
  origin'iga teng bo'lishi shart, aks holda CORS credentials bloklanadi).

### [Bugfix] 1:1 video qo'ng'iroq — qarshi tomonda qora ekran

- **Yaratilgan:** 2026-07-28
- **Bajarilgan:** 2026-07-28
- **Tavsif:** Lokal preview ishlagan, remote video qora qolgan. Asosiy sabab:
  qo'ng'iroq qiluvchining birinchi ICE nomzodlari `callId: null` bilan
  ketgan, chunki `callId` faqat `callOffer` ack'idan keyin paydo bo'lardi,
  `setLocalDescription` esa ICE yig'ishni darhol boshlaydi. Qabul qiluvchi
  tomondagi `callId` filtri ularni tashlab yuborgan — host nomzodlar
  (LAN/localhost, eng tez ulanadigan juftlik) yo'qolgan. Tuzatilganlar:
  1. `src/context/WebSocketContext.jsx` — `newCallId()` qo'shildi;
     `callOffer(peerEmail, callId, sdp, video)` endi tayyor id qabul qiladi;
     ICE buferi debounce o'rniga birinchi nomzoddan max-wait bo'ldi
     (`ICE_BATCH_MS`); `cancelIce()` qo'shildi; `callConfig()` `.env` dan
     ixtiyoriy TURN o'qiydi.
  2. `src/context/CallContext.jsx` — `callId` `RTCPeerConnection` dan oldin
     yaratiladi; `newPeerConnection(peerEmail, callId)`; `call:ice` id'siz
     nomzodni qabul qiladi; `connectionState === "failed"` da qo'ng'iroq
     to'g'ri yopiladi (`"closed"` — o'z teardown'imiz, e'tiborsiz).
  3. `src/components/CallOverlay.jsx` — remote `<video>` endi `call:media`
     xabariga emas, real track holatiga (`muted`/`unmute`/`ended`) qarab
     ko'rsatiladi; `peerVideo` faqat `connected` bo'lgandan keyingi zaxira.
  4. `.env.example` — `VITE_TURN_URL` / `VITE_TURN_USERNAME` /
     `VITE_TURN_CREDENTIAL` (bo'sh bo'lsa faqat STUN).
  Qolgan ish (foydalanuvchi tomonida): TURN server ma'lumotlari. TURN'siz
  turli NAT ortidagi (mobil internet) qo'ng'iroq baribir ulanmaydi — buni
  kod bilan hal qilib bo'lmaydi. Ikkinchi qurilmadan sinash uchun Vite
  `--host` + HTTPS kerak (HTTP LAN IP'da `getUserMedia` bloklanadi).

### [Feature] Oflayn odamga qo'ng'iroq + javobsiz qo'ng'iroq bildirishnomasi

- **Yaratilgan:** 2026-07-28
- **Bajarilgan:** 2026-07-28
- **Tavsif:** Oldin oflayn kontaktga qo'ng'iroq qilib bo'lmasdi (ikkita
  to'siq: `startCall` dagi presence guard va "peer oflayn bo'lsa uz"
  effekti `calling` fazasida ham ishlardi). Ikkalasi ham olib tashlandi —
  endi chaqiruv ketadi, 30s jiringlaydi va javobsiz qo'ng'iroq bo'lib
  tugaydi. Qo'shimcha: `call-missed` envelope turi qo'shildi, u DB'da
  saqlanadi va oflayn odam ilovani ochganda `chat:history` dan tiklanadi.
  Ataylab `call:` prefiksisiz — `call:*` tarixda tashlanadi.
  `missedCallMsg()` uni mavjud `kind: "call"` bubble shakliga aylantiradi,
  shuning uchun UI o'zgarmadi. Jonli probe bilan tasdiqlandi (lokal backend
  + MongoDB): oflayn qabul qiluvchi keyingi ochilishda envelope'ni oladi;
  probe yozgan test xabari keyin DB'dan o'chirildi.
  **Cheklov:** qo'ng'iroqning o'zi ulanmaydi — signalizatsiya jonli socket
  talab qiladi (`index.js:261`), `call:*` tarixda tiklanmaydi va WebRTC
  real vaqtli. Haqiqiy "telefonday" ishlashi uchun push notification kerak
  (backend tomonda, Bekzodning repo'si).

### [Feature+Bugfix] Real-time presence, last seen, va E2E qo'ng'iroq testi

- **Yaratilgan:** 2026-07-28
- **Bajarilgan:** 2026-07-28
- **Tavsif:** Qo'shilgan: onlayn odamlar chat ro'yxatida tepaga saraladi va
  "N в сети" hisoblagichi chiqadi (`ChatLayout.jsx`); presence indikatori
  kuchaytirildi (nuqta kattaroq + yashil halqa, "в сети" matni oxirgi xabar
  bo'lganda ham ko'rinadi); "oxirgi ko'rilgan" vaqti qo'shildi —
  `appSlice.lastSeenByEmail`, klient `users:online` o'tishlarini kuzatib
  yozadi (backendda `lastSeen` maydoni yo'q). `redux-persist` versiyasi
  2 -> 3 ga oshirildi va v3 migratsiyasi yozildi.
  Playwright bilan ikkita test akkaunt (`qa.alisa@test.local`,
  `qa.boris@test.local`, parol `test12345`) orasida to'liq E2E o'tkazildi:
  **18/18 tekshiruv o'tdi** — video qo'ng'iroq (ikkala tomonda 640x480 jonli
  kadrlar), audio qo'ng'iroq, presence, oxirgi ko'rilgan.
  Test paytida ikkita real bug topildi va tuzatildi:
  1. `CallContext.jsx` — javob berilgan **chiquvchi** qo'ng'iroq jurnalda
     "kiruvchi" deb yozilardi: `phase === "calling"` tekshiruvi javobdan
     keyin `"active"` ga o'tgani uchun yaroqsiz edi. Holatga `outgoing`
     bayrog'i qo'shildi (3 ta joyda ishlatilgan).
  2. `WebSocketContext.jsx` — `loadHistory` `messages[email]` ni butunlay
     almashtirib, lokal qo'ng'iroq bubble'larini o'chirib yuborardi. Endi
     `call_` prefiksli lokal yozuvlar saqlanib, vaqt bo'yicha qo'shiladi.
