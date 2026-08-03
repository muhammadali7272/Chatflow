# ui-screenshot-qa

ChatFlow frontend'ini real ishga tushirib, uch xil ekran o'lchamida screenshot oladigan va console xatolarini yig'adigan vizual QA agenti.

- **Ta'rif fayli:** `.claude/agents/ui-screenshot-qa.md`
- **Biriktirilgan skill'lar:** `webapp-testing`, `agent-browser`
- **Model:** `sonnet` · **Ranq:** binafsha
- **Vositalar:** `Bash`, `Read`, `Write`, `Glob`, `Grep`, `Skill`

## Nima qiladi

1. `npm run dev` bilan Vite server'ini ko'taradi (port 5173 — `vite.config.js` da qattiq belgilangan) va port javob berishini kutadi.
2. `agent-browser` orqali `/login` va asosiy chat ekranini ochadi.
3. Uch o'lchamda screenshot oladi va console'dagi `error` xabarlarini yig'adi.
4. Ish tugagach dev server jarayonini to'xtatadi.

| Nom | O'lcham |
|---|---|
| mobile | 390 x 844 |
| tablet | 768 x 1024 |
| desktop | 1440 x 900 |

## Kirish (inputs)

- Ixtiyoriy: screenshot saqlanadigan papka yo'li. Berilmasa scratchpad ishlatiladi — loyiha ildiziga rasm tashlanmaydi.
- Ixtiyoriy: tekshiriladigan aniq ekran yoki panel nomi.

## Chiqish (outputs)

1. **Xulosa** — UI sog'lommi yoki nechta muammo bor.
2. **Screenshot'lar** — to'liq fayl yo'llari, o'lchami bilan.
3. **Console xatolari** — matni va manbasi bilan.
4. **Vizual muammolar** — qaysi o'lchamda, qaysi komponentda.

## Bilishi shart bo'lgan chegaralar

- Backend (`prod/`, port 5000) ishlamayotgan bo'lsa socket ulanmaydi — bu **kutilgan holat**, UI xatosi emas.
- UI matnlari rus tilida hardcode qilingan — tarjima yo'qligi xato emas.
- Agent kod tuzatmaydi, faqat kuzatganini yozadi.
