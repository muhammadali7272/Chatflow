# socket-kontrakt-nazoratchi

Frontend'dagi socket event'lari backend kontrakti bilan mos kelishini tekshiruvchi agent. Faqat o'qiydi — kod tuzatmaydi.

- **Ta'rif fayli:** `.claude/agents/socket-kontrakt-nazoratchi.md`
- **Biriktirilgan skill:** `diagnosing-bugs`
- **Model:** `sonnet` · **Ranq:** ko'k
- **Vositalar:** `Read`, `Grep`, `Glob`, `Bash`, `Skill` (yozish huquqi yo'q)

## Nima qiladi

1. `prod/src/index.js` dan ruxsat etilgan socket event'lari ro'yxatini oladi — **har safar qaytadan o'qiydi**, xotiraga tayanmaydi.
2. `src/` dagi barcha `socket.on` / `socket.emit` / `ackEmit` chaqiruvlarini shu ro'yxat bilan solishtiradi.
3. `::app::` envelope tunnelini alohida tekshiradi: `kind` dispatcher'ga ulanganmi, 900 000 belgi cheklovi bormi, `call:*` tarixda tashlanayaptimi, `call-missed` prefiksisiz qolganmi.

## Kirish (inputs)

- Majburiy kirish yo'q — repo holatining o'zi yetarli.
- Ixtiyoriy: tekshiruvni toraytirish uchun fayl yoki funksiya nomi (masalan, "faqat `CallContext` signalizatsiyasini tekshir").

## Chiqish (outputs)

Markdown hisobot:

1. **Xulosa** — kontrakt butunmi yoki nechta buzilish bor.
2. **Buzilishlar** — `fayl:qator`, kutilgan va topilgan qiymat, oqibati.
3. **Ataylab qilingan chetlanishlar** — "xato emas" deb belgilangan holda.

## Bilishi shart bo'lgan chegaralar

- `prod/` — Bekzodning alohida repo'si, **tahrirlanmaydi**.
- `prod/src/start.js`, `claude/tasks/done.md`, ildizdagi `*.patch` — eski backend haqida, kontrakt emas.
- `UNSUPPORTED` stub'lari (guruh/kanal, stories, typing, OTP) va `login()` dagi parolsiz kirish yo'li — **ataylab shunday**, xato deb belgilanmaydi.
