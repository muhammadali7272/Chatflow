/**
 * seedAdmin.js — Local development uchun test/admin akkaunt yaratadi.
 *
 * MUHIM: Backend (`prod/`) Bekzod Mirzaaliyevga tegishli va tahrirlanmaydi
 * (CLAUDE.md). Shu sabab bu script backend'ning ICHIDA emas, repo root'ida
 * turadi va prod/ modellarini FAQAT require qilib (o'qib) qayta ishlatadi —
 * hech qanday backend fayli o'zgartirilmaydi.
 *
 * Auth modeli: parol alohida `Auth` kolleksiyasida saqlanadi (User'da emas),
 * `Auth` schema'sining pre('save') hook'i orqali bcrypt salt round = 10 bilan
 * xeshlanadi — bu yerda AYNAN o'sha usul (register/service bilan bir xil)
 * qayta ishlatiladi. Ishlaydigan akkaunt uchun IKKI hujjat kerak:
 * `User` (profil) + `Auth` (email + xeshlangan parol + userId).
 *
 * Ishga tushirish:  node scripts/seedAdmin.js
 */

const path = require('path')

// prod/ ildizi — barcha bog'liqliklar va modellar shu yerdan olinadi, shunda
// script prod'dagi AYNAN o'sha mongoose nusxasini ishlatadi (model'lar shu
// nusxada ro'yxatdan o'tadi).
const PROD_DIR = path.join(__dirname, '..', 'prod')
const fromProd = (...p) => require(path.join(PROD_DIR, ...p))

// .env ni prod/ dan yuklaymiz (backend xuddi shu faylni ishlatadi).
fromProd('node_modules', 'dotenv').config({ path: path.join(PROD_DIR, '.env') })

const mongoose = fromProd('node_modules', 'mongoose')
const User = fromProd('src', 'models', 'user.model')
// auth.service.js require qilinganda `Auth` modeli mongoose'da ro'yxatdan o'tadi.
fromProd('src', 'services', 'auth.service')
const Auth = mongoose.model('Auth')

// Yaratiladigan akkaunt — model'da MAVJUD maydonlargina (role/isVerified
// schema'da yo'q, shuning uchun qo'shilmaydi; login verification tekshirmaydi).
const ADMIN = {
  email: 'admin@gmail.com',
  password: 'putin123',     // sanjarf UI Login validatsiyasi kamida 6 belgi talab qiladi
  firstName: 'Muhammadali',
  lastName: 'Rustamov',
  age: 18,
}

async function seed() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI
  if (!uri) {
    console.error('❌ MONGO_URL / MONGODB_URI topilmadi (prod/.env ni tekshiring).')
    process.exit(1)
  }

  // Mongo ulanmasa tez to'xtaydi (cheksiz osilib qolmaydi).
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  console.log('✅ MongoDB ulandi')

  const email = ADMIN.email.toLowerCase().trim()

  // 1) User profilini upsert qilamiz (bor bo'lsa yangilaydi, yo'q bo'lsa yaratadi).
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { email, firstName: ADMIN.firstName, lastName: ADMIN.lastName, age: ADMIN.age } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  )
  console.log(`✅ User ${user.isNew ? 'yaratildi' : 'yangilandi'}: ${user._id}`)

  // 2) Auth (parol) hujjatini upsert qilamiz. Parolni OCHIQ matnda beramiz —
  //    pre('save') hook uni bcrypt round 10 bilan xeshlaydi. minlength:6 ni
  //    chetlab o'tish uchun validateBeforeSave:false (hook baribir ishlaydi).
  let auth = await Auth.findOne({ email })
  let action
  if (auth) {
    auth.password = ADMIN.password // isModified('password') => hook qayta xeshlaydi
    auth.userId = user._id
    action = 'yangilandi'
  } else {
    auth = new Auth({ email, password: ADMIN.password, userId: user._id })
    action = 'yaratildi'
  }
  await auth.save({ validateBeforeSave: false })
  console.log(`✅ Auth ${action}: ${auth._id} (parol bcrypt round 10 bilan xeshlandi)`)

  console.log('\n──────── Akkaunt tayyor ────────')
  console.log(`  email:     ${user.email}`)
  console.log(`  parol:     ${ADMIN.password}`)
  console.log(`  ism:       ${user.firstName} ${user.lastName}`)
  console.log(`  yosh:      ${user.age}`)
  console.log(`  User _id:  ${user._id}`)
  console.log('────────────────────────────────')
}

seed()
  .then(() => console.log('\n🎉 Seed muvaffaqiyatli yakunlandi'))
  .catch((err) => {
    console.error('\n❌ Seed xatosi:', err.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
    console.log('🔌 MongoDB ulanishi yopildi')
  })
