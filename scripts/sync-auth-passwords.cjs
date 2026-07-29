/**
 * sync-auth-passwords.js — Bir martalik sinxron: eski REST backend (start.js)
 * parollarni alohida `auths` kolleksiyasida saqlagan; sanjarb branch'idagi
 * yangi entrypoint (index.js) esa `User.password`dan o'qiydi. Bu script har
 * bir Auth yozuvidagi bcrypt xeshni mos User hujjatiga ko'chiradi (ikkala
 * tomon ham bcrypt/10 rounds — xeshlar bevosita mos).
 *
 * Faqat `User.password` BO'SH bo'lganda yoziladi — yangi backend orqali
 * ro'yxatdan o'tgan userlarning paroli hech qachon ustidan yozilmaydi.
 * `auths` kolleksiyasiga tegilmaydi.
 *
 * Ishga tushirish:  node scripts/sync-auth-passwords.js
 */

const path = require('path')

const PROD_DIR = path.join(__dirname, '..', 'prod')
const fromProd = (...p) => require(path.join(PROD_DIR, ...p))

fromProd('node_modules', 'dotenv').config({ path: path.join(PROD_DIR, '.env') })

const mongoose = fromProd('node_modules', 'mongoose')

async function main() {
  await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI)
  const db = mongoose.connection.db

  const auths = await db.collection('auths').find({}).toArray()
  const users = db.collection('users')

  let copied = 0, skippedHasPassword = 0, skippedNoUser = 0

  for (const auth of auths) {
    const user = await users.findOne({ _id: auth.userId })
    if (!user) { skippedNoUser++; console.log(`User topilmadi: ${auth.email}`); continue }
    if (user.password) { skippedHasPassword++; continue }
    await users.updateOne({ _id: user._id }, { $set: { password: auth.password } })
    copied++
    console.log(`Ko'chirildi: ${auth.email}`)
  }

  console.log(`\nJami Auth yozuvlari: ${auths.length}`)
  console.log(`Ko'chirildi: ${copied} | Paroli allaqachon bor: ${skippedHasPassword} | User topilmadi: ${skippedNoUser}`)

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
