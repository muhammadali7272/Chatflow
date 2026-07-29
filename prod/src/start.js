require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const http = require('http')
const { Server } = require('socket.io')
const nodemailer = require('nodemailer')

const User = require('./models/user.model')
const Message = require('./models/message.model')
const authService = require('./services/auth.service')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: '*' }
})

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err))

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  }
})

const verificationCodes = new Map() // email -> { code, expiry }
const onlineUsers = new Map()       // userId -> socketId

function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString()
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // ── Auth ──────────────────────────────────────────────────────────────────

  socket.on('auth:send-code', async ({ email }, callback) => {
    try {
      const code = generateCode()
      verificationCodes.set(email.toLowerCase(), {
        code,
        expiry: Date.now() + 10 * 60 * 1000,
      })

      await transporter.sendMail({
        from: `"Chat App" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Tasdiqlash kodi',
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
            <h2 style="color:#111827;margin:0 0 8px">Chat App</h2>
            <p style="color:#6b7280;margin:0 0 24px">Kirish uchun tasdiqlash kodingiz:</p>
            <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;letter-spacing:12px;font-size:32px;font-weight:700;color:#4f46e5;">
              ${code}
            </div>
            <p style="color:#9ca3af;font-size:13px;margin:16px 0 0">Kod 10 daqiqa davomida amal qiladi.</p>
          </div>
        `,
      })

      callback({ success: true })
    } catch (err) {
      console.error('Email send error:', err)
      callback({ success: false, message: 'Email yuborishda xatolik yuz berdi' })
    }
  })

  socket.on('auth:verify-code', async ({ email, code }, callback) => {
    const key = email.toLowerCase()
    const stored = verificationCodes.get(key)

    if (!stored) {
      return callback({ success: false, message: "Kod topilmadi. Qayta urinib ko'ring" })
    }
    if (Date.now() > stored.expiry) {
      verificationCodes.delete(key)
      return callback({ success: false, message: 'Kod muddati tugagan. Qayta yuboring' })
    }
    if (stored.code !== code.trim()) {
      return callback({ success: false, message: "Noto'g'ri kod" })
    }

    verificationCodes.delete(key)

    try {
      const user = await User.findOne({ email: key })
      if (user) {
        callback({ success: true, userExists: true, user })
      } else {
        callback({ success: true, userExists: false })
      }
    } catch (err) {
      console.error('DB error:', err)
      callback({ success: false, message: 'Server xatoligi' })
    }
  })

  socket.on('auth:register', async ({ email, firstName, lastName, age }, callback) => {
    try {
      const user = await User.create({
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: Number(age),
        contacts: [],
      })
      callback({ success: true, user })
    } catch (err) {
      console.error('Register error:', err)
      callback({ success: false, message: "Ro'yxatdan o'tishda xatolik" })
    }
  })

  // ── Presence ──────────────────────────────────────────────────────────────

  socket.on('user:online', (userId) => {
    socket.userId = userId
    onlineUsers.set(userId, socket.id)
    io.emit('users:online', Array.from(onlineUsers.keys()))
  })

  // ── Contacts ──────────────────────────────────────────────────────────────

  socket.on('users:all', async (currentUserId, callback) => {
    try {
      const users = await User.find({ _id: { $ne: currentUserId } })
        .select('_id firstName lastName email')
        .lean()
      callback({ success: true, users })
    } catch (err) {
      console.error('users:all error:', err)
      callback({ success: false, users: [] })
    }
  })

  // ── Messages ──────────────────────────────────────────────────────────────

  socket.on('chat:history', async ({ from, to }, callback) => {
    if (!mongoose.Types.ObjectId.isValid(from) || !mongoose.Types.ObjectId.isValid(to)) {
      return callback({ success: true, messages: [] })
    }
    try {
      const messages = await Message.find({
        $or: [
          { from, to },
          { from: to, to: from },
        ]
      }).sort({ createdAt: 1 }).lean()

      const formatted = messages.map(m => ({
        _id: m._id.toString(),
        from: m.from.toString(),
        to: m.to.toString(),
        text: m.text,
        createdAt: m.createdAt,
      }))

      callback({ success: true, messages: formatted })
    } catch (err) {
      console.error('chat:history error:', err)
      callback({ success: false, messages: [] })
    }
  })

  socket.on('chat:send', async ({ from, to, text }, callback) => {
    if (!mongoose.Types.ObjectId.isValid(from) || !mongoose.Types.ObjectId.isValid(to)) {
      return callback({ success: false })
    }
    try {
      const message = await Message.create({ from, to, text })
      const payload = {
        _id: message._id.toString(),
        from: from.toString(),
        to: to.toString(),
        text,
        createdAt: message.createdAt,
      }

      const recipientSocketId = onlineUsers.get(to)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('chat:receive', payload)
      }

      callback({ success: true, message: payload })
    } catch (err) {
      console.error('chat:send error:', err)
      callback({ success: false })
    }
  })

  // ── Friend Requests ─────────────────────────────────────────────────────

  socket.on('friend_request:send', async ({ from, to, message }, callback) => {
    if (!mongoose.Types.ObjectId.isValid(from) || !mongoose.Types.ObjectId.isValid(to)) {
      return callback && callback({ success: false, message: 'Invalid user ID' })
    }
    try {
      const fromUser = await User.findById(from).select('_id firstName lastName email')
      const toUser = await User.findById(to).select('_id firstName lastName email')
      if (!fromUser || !toUser) {
        return callback && callback({ success: false, message: 'Foydalanuvchi topilmadi' })
      }

      const notification = {
        from: {
          _id: fromUser._id.toString(),
          firstName: fromUser.firstName,
          lastName: fromUser.lastName,
          email: fromUser.email,
        },
        to: {
          _id: toUser._id.toString(),
          firstName: toUser.firstName,
          lastName: toUser.lastName,
          email: toUser.email,
        },
        message: message || `${fromUser.firstName} ${fromUser.lastName} sizni kontaktlariga qo'shmoqchi`,
        type: 'friend_request',
        timestamp: new Date().toISOString(),
      }

      // Send real-time notification to the recipient
      const recipientSocketId = onlineUsers.get(to)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('friend_request:received', notification)
      }

      callback && callback({ success: true, notification })
    } catch (err) {
      console.error('friend_request:send error:', err)
      callback && callback({ success: false, message: 'Server xatoligi' })
    }
  })

  socket.on('friend_request:accept', async ({ userId, requesterId }, callback) => {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return callback && callback({ success: false, message: 'Invalid user ID' })
    }
    try {
      // Add requester to user's contacts
      const user = await User.findById(userId)
      const requester = await User.findById(requesterId)

      if (!user || !requester) {
        return callback && callback({ success: false, message: 'Foydalanuvchi topilmadi' })
      }

      // Add each other to contacts (mutual)
      if (!user.contacts.some(id => id.equals(requesterId))) {
        user.contacts.push(requesterId)
        await user.save()
      }
      if (!requester.contacts.some(id => id.equals(userId))) {
        requester.contacts.push(userId)
        await requester.save()
      }

      const contactData = {
        _id: requester._id.toString(),
        email: requester.email,
        firstName: requester.firstName,
        lastName: requester.lastName,
      }

      // Notify the requester that their request was accepted
      const requesterSocketId = onlineUsers.get(requesterId)
      if (requesterSocketId) {
        io.to(requesterSocketId).emit('friend_request:accepted', {
          contact: {
            _id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          message: `${user.firstName} ${user.lastName} so'rovingizni qabul qildi`,
        })
      }

      callback && callback({ success: true, contact: contactData })
    } catch (err) {
      console.error('friend_request:accept error:', err)
      callback && callback({ success: false, message: 'Server xatoligi' })
    }
  })

  socket.on('friend_request:decline', async ({ userId, requesterId }, callback) => {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return callback && callback({ success: false, message: 'Invalid user ID' })
    }
    try {
      const user = await User.findById(userId)
      const requester = await User.findById(requesterId)

      if (!user || !requester) {
        return callback && callback({ success: false, message: 'Foydalanuvchi topilmadi' })
      }

      // Notify the requester that their request was declined
      const requesterSocketId = onlineUsers.get(requesterId)
      if (requesterSocketId) {
        io.to(requesterSocketId).emit('friend_request:declined', {
          userId: userId.toString(),
          message: `${user.firstName} ${user.lastName} so'rovingizni rad etdi`,
        })
      }

      callback && callback({ success: true })
    } catch (err) {
      console.error('friend_request:decline error:', err)
      callback && callback({ success: false, message: 'Server xatoligi' })
    }
  })

  // ── Disconnect ────────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    if (socket.userId) {
      onlineUsers.delete(socket.userId)
      io.emit('users:online', Array.from(onlineUsers.keys()))
    }
  })
})

// ── REST API Auth Routes ────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, age } = req.body

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Barcha maydonlarni to\'ldiring' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' })
    }

    const user = await authService.register({ email, password, firstName, lastName, age })
    res.json({ success: true, user })
  } catch (err) {
    console.error('Register error:', err)
    res.status(400).json({ message: err.message || 'Ro\'yxatdan o\'tishda xatolik' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email va parolni kiriting' })
    }

    const user = await authService.login({ email, password })
    res.json({ success: true, user })
  } catch (err) {
    console.error('Login error:', err)
    res.status(401).json({ message: err.message || 'Kirishda xatolik' })
  }
})

app.get('/api/users/search', async (req, res) => {
  try {
    const { q, exclude } = req.query
    const users = await authService.searchUsers(q, exclude)
    res.json({ success: true, users })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ message: 'Qidirishda xatolik' })
  }
})

app.post('/api/users/add-contact', async (req, res) => {
  try {
    const { userId, contactId } = req.body
    const contact = await authService.addContact(userId, contactId)
    res.json({ success: true, contact })
  } catch (err) {
    console.error('Add contact error:', err)
    res.status(400).json({ message: err.message || 'Kontakt qo\'shishda xatolik' })
  }
})

app.get('/', (req, res) => {
  res.send('Server ishlayapti 🚀')
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (with auth routes)`)
})
