# kunlik-hisobotchi

Loyihaning kunlik holat hisobotini tayyorlaydigan va `claude/tasks/` ni tartibda saqlaydigan agent.

- **Ta'rif fayli:** `.claude/agents/kunlik-hisobotchi.md`
- **Biriktirilgan skill:** `writing-guidelines`
- **Model:** `sonnet` · **Ranq:** yashil
- **Vositalar:** `Read`, `Write`, `Edit`, `Glob`, `Grep`, `Bash`, `Skill`

## Nima qiladi

1. So'nggi 24 soatdagi commit'lar va commit qilinmagan fayllarni yig'adi.
2. `npm run build` ni ishga tushiradi — loyihadagi **yagona** sifat tekshiruvi (lint/test skriptlari yo'q).
3. Bajarilgan vazifalarni `claude/tasks/task.md` dan `claude/tasks/done.md` ga sana bilan ko'chiradi.
4. Kunlik hisobotni yozadi.

## Kirish (inputs)

- Ixtiyoriy: hisobot yoziladigan fayl yo'li. Berilmasa hisobot javob sifatida qaytariladi.
- Ixtiyoriy: qamrov davri (standart — 24 soat).
- Ixtiyoriy: boshqa agentlarning natijalari (masalan, `socket-kontrakt-nazoratchi` va `ui-screenshot-qa` hisobotlari) — ularni umumiy hisobotga qo'shadi.

## Chiqish (outputs)

1. **Sana** va umumiy holat.
2. **O'zgarishlar** — commit'lar va ishchi katalog holati.
3. **Build** — o'tdimi; o'tmasa xato matni.
4. **Arxivlangan vazifalar** — `done.md` ga ko'chirilganlar.
5. **Ochiq vazifalar** — `task.md` da qolganlar.
6. **E'tibor talab qiladigan joylar.**

## Bilishi shart bo'lgan chegaralar

- **`done.md` dan hech narsa o'chirilmaydi** — faqat oxiriga qo'shiladi.
- Vazifa bajarilganiga ishonch bo'lmasa arxivga ko'chirilmaydi, "tasdiq kerak" deb belgilanadi.
- `prod/` ga va `CLAUDE.md` ga tegmaydi.
- O'zi commit va push qilmaydi.
