# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Ushbu fayl Claude Code uchun asosiy qoida hisoblanadi. Quyidagi qoidalar **har bir task**, **har bir javob** va **har bir kod yozish jarayonida** majburiy hisoblanadi.

---

# 📦 Loyiha haqida (Project overview)

ChatFlow — real-time 1:1 chat ilovasi (email/parol bilan ro'yxatdan o'tish va kirish, foydalanuvchi qidiruv, kontaktlar, do'stlik so'rovi, online holat). Repo ikkita mustaqil qismdan iborat, umumiy root `package.json` yo'q — har biri o'z papkasidan alohida ishga tushiriladi:

- `frontend/latest/` — React 19 + Vite SPA. Bu yerga to'liq tahrir kiritish mumkin.
- `prod/` — Node/Express + Socket.io + MongoDB backend. Bu **alohida git repository** (o'z ichida `.git` bor) va **Bekzod Mirzaaliyevga tegishli — tahrirlash taqiqlanadi** (yuqoridagi "Backend" bo'limiga qarang). Faqat kontrakt (route'lar, socket event'lar, model sxemalari)ni tushunish uchun o'qiladi. Backend o'zgarishi zarur bo'lsa, patch tayyorlanadi (masalan repo ildizidagi `bekzod-backend-fix.patch`) va Bekzodga yetkaziladi, to'g'ridan-to'g'ri committed qilinmaydi.

> **⚠️ Muhim:** `claude/tasks/done.md` guruh chatlari, JWT/refresh-token auth kabi ancha boy bir backend haqida yozilgan (routes/, middleware/, sockets/ papkalari, `Room`/`Friend`/`RefreshToken`/`VerificationCode` modellari, `send-message`/`get-unread-counts` kabi event'lar) va `bekzod-backend-fix.patch` ham o'sha eski kontraktga qarshi yozilgan. **Bu holat hozir `prod/`da yo'q.** Eski done.md yozuvlariga yoki patch'ga tayanib kod yozishdan oldin joriy entrypoint (`prod/src/index.js`, pastdagi Backend bo'limiga qarang)ning holatini albatta tekshiring.

## Buyruqlar (Commands)

Frontend (`frontend/latest/`):
- `npm install` — bog'liqliklarni o'rnatish
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run preview` — production build'ni preview qilish
- `npx playwright test` — e2e testlar (`tests/*.spec.js`); config avtomatik `vite --port 3000`ni web server sifatida ko'taradi, `baseURL: http://localhost:3000`
- `npx playwright test tests/login-register.spec.js` — bitta spec faylini ishga tushirish

Backend (`prod/`, `sanjarb` branch) — faqat ma'lumot uchun, tahrirlanmaydi:
- `npm run dev` — nodemon bilan `src/index.js`ni ishga tushirish
- `npm start` — node bilan `src/index.js`ni ishga tushirish
- `.env`da `MONGO_URL` bo'lishi shart (`index.js` faqat shu nomni o'qiydi; `MONGODB_URI` emas)
- (`seed`/`migrate:friends` kabi qo'shimcha skriptlar joriy `prod/package.json`da yo'q; repo ildizidagi `scripts/` papkasida yordamchi skriptlar bor)

## Arxitektura (Architecture)

### Frontend (`frontend/latest/src/`)
- `features/*/*.js` — Redux Toolkit slice'lari: `auth`, `chat`, `users`, `presence`; `store/store.js`da birlashtiriladi, lekin `redux-persist` faqat `auth`ni saqlaydi (`store/persistConfig.js` whitelist). Backend'da token/sessiya yo'qligi sababli **`auth.user` — "login qilingan" holatning yagona manbayi**; server-side qayta tekshiruv yo'q (`routes/ProtectedRoute.jsx` faqat shu slice'ga qaraydi). `users` slice — server-haqiqat kontaktlar ro'yxati (`contacts:list`dan, har birida `unreadCount`), persist qilinmaydi. (`features/friends/friendsSlice.js` store'dan chiqarilgan — orphan fayl.)
- `services/*.js` — hammasi socket chegarasi (backend'da REST yo'q): `authService.js` (`auth:login`/`auth:register` ack bilan), `socket.js` (Socket.io klientining yagona nusxasi — `initializeSocket`/`emitEvent`/`emitWithAck`/`onEvent`; auth handshake'i yo'q — identity faqat `user:online` emit qilib o'rnatiladi), `chatService.js` (`contacts:list`, `chat:*`), `friendService.js` (`users:search`, `contacts:add`, `notifications:*`), `presenceService.js` (`users:online` snapshot), `profileService.js` (REST qoldiq — backend'da endpoint yo'q, graceful 404).
- `hooks/useSocket.js` — `utils/constants.js`dagi `SOCKET_EVENTS`ni Redux dispatch'lariga ulaydigan yagona joy; kod ichidagi izohlar har bir listener `prod/src/index.js`dagi qaysi event'ga mos kelishini aniq belgilaydi — yangi event qo'shishdan oldin shu faylni o'qing.
- `components/UI/SocketProvider.jsx` — `App.jsx`da bir marta mount bo'ladi, socket lifecycle'ini boshqaradi (login'da ulanish, logout'da uzilish).
- `routes/AppRoutes.jsx` — route jadvali (`/login`, `/register`, `/chat`, `/chat/:userId`, `/friends`); sahifalar lazy-load qilinadi. **`pages/VerifyOtp/` mavjud, lekin route jadvaliga ulanmagan — orphan sahifa.**
- `i18n/` — mustaqil `I18nContext` (kutubxona emas), tarjimalar `translations.js`da (en/uz/ru).
- `utils/constants.js` — `SOCKET_EVENTS` xaritasi (`prod/src/index.js`dagi event nomlari bilan aynan mos kelishi shart), `SERVER_URL`/`API_URL` (`VITE_SERVER_URL`dan), validatsiya konstantalari.
- **Guruh-chat komponentlari olib tashlangan:** eski `components/CreateRoomModal/`, `components/GroupInfo/`, `components/RoomItem/` endi mavjud emas (guruh-chat backend'da yo'q). Joriy `components/` faqat 1:1 chatga tegishli (ChatWindow, ContactItem, Drawer, Friends, Loader, MessageBubble, MessageInput, Navbar, Sidebar, TypingIndicator, UI, UserProfile). Yangi komponent qo'shishdan oldin haqiqatan import qilinganini tekshiring.

### Backend (`prod/src/`, `sanjarb` branch, faqat ma'lumot uchun)
- **`index.js` — haqiqiy va yagona ishga tushiriladigan entrypoint** (`package.json`dagi `dev`/`start` skriptlari shunga ishora qiladi — `sanjarb` branch'ida shunday o'zgartirilgan). REST yo'q (faqat `GET /`) — butun API socket event'lari, hammasi ack-callback bilan: `auth:login`/`auth:register` (bcrypt, `User.password`), `user:online` → `users:online` broadcast (yagona presence signali), `contacts:list` (populated kontaktlar + har birida `unreadCount`), `users:search`, `contacts:add` (ikkala tomonga `$addToSet` — mutual va idempotent; nishonga `contacts:added` + `notification:new` push), `notifications:list`/`notifications:read`, `chat:history`, `chat:send` (birinchi xabarda ikkala tomonni avtomatik kontakt qiladi) → `chat:receive`, `chat:read` (o'qilgan belgisi — yuboruvchiga `chat:read {by}` push).
- `start.js` — **eski entrypoint, endi ishlatilmaydi** (REST + `friend_request:*` + Gmail OTP kontrakti). Lokal listen-fix `git stash`da saqlangan.
- **Auth modeli: token/sessiya yo'q.** `auth:login` oddiy `{success, user}` qaytaradi; parol endi `User.password`da (`select: false`). Eslatma: eski REST davri parollari alohida `Auth` kolleksiyasida edi — `scripts/sync-auth-passwords.js` ularni `User.password`ga ko'chirgan; eski OTP davrida yaratilgan (parolsiz) akkauntlar yangi backend'da login qila olmaydi.
- Modellar (`models/`): `User` (`contacts: [ObjectId]`, `password`), `Message` (`from`, `to`, `text`, `read`), `Notification` (`user`, `from`, `type: 'friend_add'`, `read`). **Guruh/room, Friend, RefreshToken, VerificationCode modellari yo'q.**
- `sanjarb` branch'i `origin/main`dagi 2 ta keyingi fix'ni (parolsiz akkauntda login guard `8245e1f`, room-based delivery `ebda063`) **o'z ichiga olmaydi**.
- Socket event'lari frontend va backend o'rtasidagi asosiy kontrakt — bir tomonini o'zgartirishda `utils/constants.js` (frontend) va `index.js`dagi `socket.on`/`.emit` nomlarini (backend) o'zaro solishtirish kerak.

### Ikkala tomon bilan ishlash
`claude/tasks/done.md` va `task.md` avvalgi tuzatishlar/kutilayotgan topshiriqlarning jonli logi (asosan o'zbek tilida) — lekin yuqoridagi ⚠️ ogohlantirishni yodda tuting: ko'p done.md yozuvlari hozir mavjud bo'lmagan eski backend haqida.

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

# Backend
./Backend ni edit qilish mumkin emas
backend to'liq developerlar guruhidagi Bekzod Mirzaaliyev ga tegishli

# Frontend
Frontend socket bo'yicha ma'lumot kerak bo'lsa Bekzod yuborga DOCS url dan foydalaniladi
