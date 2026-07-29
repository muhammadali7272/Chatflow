/**
 * fix-login-passwords.cjs — Yangi backend (sanjarb, prod/src/index.js) +
 * sanjarf UI'da hamma akkaunt kira olishi uchun bir martalik tuzatish:
 *
 *  1. `User.password`i YO'Q akkauntlar (eski OTP davrida yaratilganlar —
 *     parol hech qayerda saqlanmagan) — vaqtinchalik parol o'rnatiladi:
 *     `chatflow123` (bcrypt/10). Egalari keyin o'zi almashtirishi mumkin.
 *  2. admin@gmail.com — paroli `putin` (5 belgi) sanjarf Login'ining
 *     "kamida 6 belgi" validatsiyasidan o'tmaydi → `putin123` qilinadi.
 *
 * Ishga tushirish:  node scripts/fix-login-passwords.cjs
 */

const path = require('path')

const PROD_DIR = path.join(__dirname, '..', 'prod')
const fromProd = (...p) => require(path.join(PROD_DIR, ...p))

fromProd('node_modules', 'dotenv').config({ path: path.join(PROD_DIR, '.env') })

const mongoose = fromProd('node_modules', 'mongoose')
const bcrypt = fromProd('node_modules', 'bcryptjs')

const DEFAULT_PASSWORD = 'chatflow123'
const ADMIN_EMAIL = 'admin@gmail.com'
const ADMIN_PASSWORD = 'putin123'

async function main() {
  await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI)
  const users = mongoose.connection.db.collection('users')

  const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
  const missing = await users.find({ password: { $exists: false } }).toArray()
  for (const u of missing) {
    await users.updateOne({ _id: u._id }, { $set: { password: defaultHash } })
    console.log(`Vaqtinchalik parol (${DEFAULT_PASSWORD}): ${u.email}`)
  }

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const res = await users.updateOne({ email: ADMIN_EMAIL }, { $set: { password: adminHash } })
  console.log(`Admin paroli yangilandi (${ADMIN_PASSWORD}): ${res.modifiedCount === 1 ? 'OK' : 'topilmadi'}`)

  console.log(`\nJami: parolsiz ${missing.length} ta akkauntga vaqtinchalik parol qo'yildi.`)
  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
