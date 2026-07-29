/**
 * fix-one-way-contacts.js — Bir martalik migration: `users.contacts`dagi
 * nomuvofiq yozuvlarni tuzatadi.
 *
 * Nima qiladi:
 *  1. BIR TOMONLAMA yozuvlar: A.contacts ichida B bor, lekin B.contacts
 *     ichida A yo'q bo'lsa — B.contacts'ga A qo'shiladi (mutual qilinadi).
 *     Sabab: accept oqimi (`friend_request:accept`) har doim ikki tomonlama
 *     yozadi, UI ham kontaktni "o'zaro do'stlik" deb ko'rsatadi.
 *  2. DUBLIKAT id'lar: bitta user'ning contacts massivida takrorlangan
 *     id'lar olib tashlanadi.
 *  3. O'CHIRILGAN user'ga havolalar: mavjud bo'lmagan userga ishora qiluvchi
 *     id'lar olib tashlanadi.
 *
 * MUHIM: Backend (`prod/`) Bekzod Mirzaaliyevga tegishli va tahrirlanmaydi
 * (CLAUDE.md) — shu sabab script repo root'idagi scripts/ da turadi va prod/
 * modellarini faqat require qilib ishlatadi.
 *
 * Ishga tushirish:
 *   node scripts/fix-one-way-contacts.js           # dry-run: faqat hisobot
 *   node scripts/fix-one-way-contacts.js --apply   # o'zgarishlarni yozadi
 */

const path = require('path')

const PROD_DIR = path.join(__dirname, '..', 'prod')
const fromProd = (...p) => require(path.join(PROD_DIR, ...p))

fromProd('node_modules', 'dotenv').config({ path: path.join(PROD_DIR, '.env') })

const mongoose = fromProd('node_modules', 'mongoose')
const User = fromProd('src', 'models', 'user.model')

const APPLY = process.argv.includes('--apply')

async function main() {
  await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI)

  const users = await User.find({}).select('_id email firstName lastName contacts')
  const byId = new Map(users.map(u => [String(u._id), u]))
  const label = u => `${u.firstName} ${u.lastName} <${u.email}>`

  // planned[userId] = Set(yakuniy contacts) — o'zgarishlar avval shu yerda
  // yig'iladi, keyin bitta o'tishda yoziladi.
  const planned = new Map(users.map(u => [String(u._id), new Set(u.contacts.map(String))]))
  const changes = []

  // 1-o'tish: dublikat va o'chirilgan havolalar (mutual qo'shishlar planned
  // set'larni o'zgartirishidan OLDIN, aks holda hisobot chalkashadi).
  for (const u of users) {
    const mine = planned.get(String(u._id))
    if (mine.size !== u.contacts.length) {
      changes.push(`DUBLIKAT tozalandi: ${label(u)} (${u.contacts.length} -> ${mine.size})`)
    }
  }

  // 2-o'tish: bir tomonlama yozuvlarni mutual qilish.
  for (const u of users) {
    const uid = String(u._id)
    const mine = planned.get(uid)

    for (const cid of [...mine]) {
      const other = byId.get(cid)
      if (!other) {
        mine.delete(cid)
        changes.push(`O'CHIRILGAN havola olib tashlandi: ${label(u)} -> ${cid}`)
        continue
      }
      const theirs = planned.get(cid)
      if (!theirs.has(uid)) {
        theirs.add(uid)
        changes.push(`MUTUAL qilindi: ${label(other)} contacts'iga ${label(u)} qo'shildi`)
      }
    }
  }

  if (changes.length === 0) {
    console.log("Hech qanday nomuvofiqlik topilmadi — baza toza.")
  } else {
    console.log(`${APPLY ? 'QO\'LLANILAYOTGAN' : 'REJALASHTIRILGAN (dry-run)'} o'zgarishlar: ${changes.length} ta\n`)
    changes.forEach(c => console.log(' -', c))

    if (APPLY) {
      let written = 0
      for (const u of users) {
        const next = [...planned.get(String(u._id))]
        const current = u.contacts.map(String)
        if (next.length === current.length && next.every(id => current.includes(id))) continue
        await User.updateOne(
          { _id: u._id },
          { $set: { contacts: next.map(id => new mongoose.Types.ObjectId(id)) } }
        )
        written++
      }
      console.log(`\n${written} ta user hujjati yangilandi.`)
    } else {
      console.log("\nHech narsa yozilmadi. Qo'llash uchun: node scripts/fix-one-way-contacts.js --apply")
    }
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
