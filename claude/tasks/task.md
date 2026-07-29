# Faol Vazifalar (Active Tasks)

> Barcha bajarilayotgan yoki rejalashtirilgan vazifalar shu yerda.
> Vazifa bajarilgach, uni bu yerdan o'chirib `done.md` ga sana bilan ko'chiring.

## Format
```
### [Kategoriya] Vazifa nomi
- **Yaratilgan:** YYYY-MM-DD
- **Muhimlik:** High | Medium | Low
- **Holat:** In Progress | Blocked | Pending
- **Tavsif:** ...
```

---

### [Backend/Sanjar] sanjarb branch'iga origin/main fixlarini yetkazish

- **Yaratilgan:** 2026-07-24
- **Muhimlik:** Medium
- **Holat:** Pending (Sanjar/Bekzod hal qilishi kerak)
- **Tavsif:** `prod/` hozir `sanjarb` branch'ida (entrypoint `src/index.js`).
  Bu branch `origin/main`dagi 2 ta fix'ni o'z ichiga olmaydi:
  `8245e1f` (parolsiz legacy akkauntda `auth:login` bcrypt.compare crash
  guard'i) va `ebda063` (chat:receive/chat:read/contacts:added/
  notification:new'ni per-user room orqali yetkazish — reconnect va ko'p tab
  xavfsiz; user:online validatsiyasi). Sanjar `main`ni o'z branch'iga merge/
  rebase qilishi tavsiya qilinadi. (Parolsiz akkauntlar muammosi hal bo'lgan —
  2026-07-24 holatida bazadagi barcha userlar bcrypt parolga ega.)
  Yana: `main`da stash bor ("start.js: listen-after-connect fix") —
  start.js'ga qaytilsa kerak bo'ladi.

### [Backend/Bekzod] Stash'dagi backend o'zgarishlarini Bekzodga yetkazish

- **Yaratilgan:** 2026-07-17
- **Muhimlik:** High
- **Holat:** Pending (foydalanuvchi Bekzodga yuborishi kerak)
- **Tavsif:** `prod/` toza `nF-2403-Teamwork/prod` `main` (444b0df) holatiga
  keltirildi. Ikkita commit qilinmagan lokal o'zgarish `git stash` ga
  saqlandi (stash nomi: "unread-counts handlers + sameSite:none cookie
  (Bekzodga yuborish uchun)"):
  1. `src/index.js` — `get-unread-counts` / `unread-counts-all` socket
     handlerlari va send/seen/forward'da real-time badge push. **Frontend
     bunga bog'liq** (`useSocket.js:133,306`) — bu handlerlar backendga
     merge bo'lmaguncha sidebar'dagi unread badge'lar ishlamaydi.
  2. `src/utils/tokens.js` — refresh cookie production'da `sameSite:"none"`
     (cross-site frontend↔Render refresh ishlashi uchun shart).
  Patch olish: `prod/` ichida `git stash show -p` (yoki qaytarish:
  `git stash pop`).

### [Backend/Bekzod] Presence (online/offline + lastSeen) patch'ini yetkazish

- **Yaratilgan:** 2026-07-24
- **Muhimlik:** High
- **Holat:** Pending (foydalanuvchi Bekzodga yuborishi kerak)
- **Tavsif:** Frontend presence tizimi (online/offline indikator + "oxirgi
  faollik") to'liq yozildi va `master`da. Backend qismi `prod/`ga tegmasdan
  patch qilib berildi: repo ildizida `bekzod-backend-presence.patch`
  (`src/start.js` + `src/models/user.model.js`, +99/-38).
  O'zgarishlar: `onlineUsers` Map endi `userId -> Set<socketId>` (ko'p
  tab/qurilma xavfsiz), handshake `auth.userId` orqali identifikatsiya,
  birinchi ulanishda `user:online` / oxirgi uzilishda `lastSeen` DB'ga
  yozilib `user:offline` broadcast, yangi `GET /api/users/online`, va
  `chat/friend_request` yetkazishlari `emitToUser` orqali barcha socketlarga.
  User modelga `lastSeen: Date` qo'shildi (online holat DB'da saqlanmaydi).
  **Qo'llash:** `prod/` ichida `git apply ../bekzod-backend-presence.patch`
  (toza qo'llanishi `git apply --check` bilan tekshirilgan).
  Frontend patch merge bo'lmaguncha ham ishlaydi (users:online snapshot
  orqali), lekin lastSeen vaqti va bir tab yopilganda online qolish faqat
  patch merge bo'lgandan keyin ishlaydi.

### [Backend/Bekzod] Presence — disconnect onlayn userni o'chirib yuboradi

- **Yaratilgan:** 2026-07-28
- **Muhimlik:** High
- **Holat:** Blocked (Bekzodga yetkazilishi kerak)
- **Tavsif:** `prod/src/index.js:304-310` — `disconnect` `onlineUsers` dan
  `userId` bo'yicha shartsiz o'chiradi va mapping hali shu socketniki
  ekanini tekshirmaydi. Sahifa qayta yuklanganda yangi socket avval
  ro'yxatdan o'tadi, eski socketning `disconnect` i esa keyinroq keladi va
  **onlayn foydalanuvchini ro'yxatdan o'chirib yuboradi**. Lokal probe bilan
  isbotlangan (`users:online` ketma-ketligi patch faylida). Oqibati: hamma
  bir-birini oflayn ko'radi, `chat:receive` ham yetib bormaydi (`index.js:261`
  o'sha Map'ga qaraydi). Patch tayyor: `bekzod-backend-presence-2.patch`
  (bitta shart: `onlineUsers.get(socket.userId) === socket.id`).
  Frontend tomonda vaqtinchalik yechim qo'yildi (`WebSocketContext.jsx`,
  `users:online` da o'zini ro'yxatda topmasa darhol qayta e'lon qiladi) —
  bu simptomni yopadi, lekin asl sabab backendda qoladi.
