require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const http = require('http')
const { Server } = require('socket.io')
const bcrypt = require('bcryptjs')

const User = require('./models/user.model')
const Message = require('./models/message.model')
const Notification = require('./models/notification.model')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: '*' }
})

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err))

const onlineUsers = new Map() // userId -> socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Har bir kelgan socket eventni (kim, qaysi event, qanday payload) logga chiqaramiz
  socket.onAny((eventName, ...args) => {
    const payload = args.filter(a => typeof a !== 'function')
    const from = socket.userId || socket.id
    console.log(`[SOCKET IN] ${new Date().toISOString()} | from=${from} | event=${eventName} | payload=${JSON.stringify(payload)}`)
  })

  // ── Auth ──────────────────────────────────────────────────────────────────

  socket.on('auth:login', async ({ email, password }, callback) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
      if (!user) {
        return callback({ success: false, message: "Bunday foydalanuvchi topilmadi" })
      }
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        return callback({ success: false, message: "Parol noto'g'ri" })
      }
      const userObj = user.toObject()
      delete userObj.password
      callback({ success: true, user: userObj })
    } catch (err) {
      console.error('Login error:', err)
      callback({ success: false, message: 'Server xatoligi' })
    }
  })

  socket.on('auth:register', async ({ email, password, firstName, lastName, age }, callback) => {
    try {
      const existing = await User.findOne({ email: email.toLowerCase() })
      if (existing) {
        return callback({ success: false, message: "Bu email allaqachon ro'yxatdan o'tgan" })
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: Number(age),
        contacts: [],
      })
      const userObj = user.toObject()
      delete userObj.password
      callback({ success: true, user: userObj })
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

  socket.on('contacts:list', async (userId, callback) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return callback({ success: true, contacts: [] })
    }
    try {
      const me = await User.findById(userId)
        .populate('contacts', '_id firstName lastName email')
        .lean()
      const contacts = me?.contacts || []

      const unreadCounts = await Message.aggregate([
        { $match: { to: new mongoose.Types.ObjectId(userId), read: false } },
        { $group: { _id: '$from', count: { $sum: 1 } } },
      ])
      const unreadMap = Object.fromEntries(unreadCounts.map(u => [u._id.toString(), u.count]))
      const withUnread = contacts.map(c => ({ ...c, unreadCount: unreadMap[c._id.toString()] || 0 }))

      callback({ success: true, contacts: withUnread })
    } catch (err) {
      console.error('contacts:list error:', err)
      callback({ success: false, contacts: [] })
    }
  })

  socket.on('users:search', async ({ currentUserId, query }, callback) => {
    const q = (query || '').trim()
    if (!q) return callback({ success: true, users: [] })
    try {
      const regex = new RegExp(q.replace(/[.*+?^{}()|[\]\\$]/g, '\\$&'), 'i')
      const users = await User.find({
        _id: { $ne: currentUserId },
        $or: [{ email: regex }, { firstName: regex }, { lastName: regex }],
      }).select('_id firstName lastName email').limit(20).lean()
      callback({ success: true, users })
    } catch (err) {
      console.error('users:search error:', err)
      callback({ success: false, users: [] })
    }
  })

  socket.on('contacts:add', async ({ userId, targetId }, callback) => {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(targetId)) {
      return callback({ success: false, message: "Noto'g'ri foydalanuvchi" })
    }
    if (userId === targetId) {
      return callback({ success: false, message: "O'zingizni qo'sha olmaysiz" })
    }
    try {
      await User.findByIdAndUpdate(userId, { $addToSet: { contacts: targetId } })
      await User.findByIdAndUpdate(targetId, { $addToSet: { contacts: userId } })

      const [me, target] = await Promise.all([
        User.findById(userId).select('_id firstName lastName email').lean(),
        User.findById(targetId).select('_id firstName lastName email').lean(),
      ])

      const notification = await Notification.create({ user: targetId, from: userId, type: 'friend_add' })

      const targetSocketId = onlineUsers.get(targetId)
      if (targetSocketId) {
        io.to(targetSocketId).emit('contacts:added', me)
        io.to(targetSocketId).emit('notification:new', {
          _id: notification._id.toString(),
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt,
          from: me,
        })
      }

      callback({ success: true, contact: target })
    } catch (err) {
      console.error('contacts:add error:', err)
      callback({ success: false, message: 'Xatolik yuz berdi' })
    }
  })

  // ── Notifications ────────────────────────────────────────────────────────

  socket.on('notifications:list', async (userId, callback) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return callback({ success: true, notifications: [], unreadCount: 0 })
    }
    try {
      const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('from', '_id firstName lastName email')
        .limit(50)
        .lean()

      const formatted = notifications.map(n => ({
        _id: n._id.toString(),
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
        from: n.from,
      }))
      const unreadCount = formatted.filter(n => !n.read).length

      callback({ success: true, notifications: formatted, unreadCount })
    } catch (err) {
      console.error('notifications:list error:', err)
      callback({ success: false, notifications: [], unreadCount: 0 })
    }
  })

  socket.on('notifications:read', async (userId, callback) => {
    try {
      await Notification.updateMany({ user: userId, read: false }, { read: true })
      callback({ success: true })
    } catch (err) {
      console.error('notifications:read error:', err)
      callback({ success: false })
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
        read: m.read,
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
        read: false,
      }

      // Yozishgan har bir user avtomatik ravishda bir-birining chats (contacts) ro'yxatiga saqlanadi
      const [fromBefore, toBefore] = await Promise.all([
        User.findByIdAndUpdate(from, { $addToSet: { contacts: to } }, { new: false }).select('contacts').lean(),
        User.findByIdAndUpdate(to, { $addToSet: { contacts: from } }, { new: false }).select('contacts').lean(),
      ])

      const recipientSocketId = onlineUsers.get(to)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('chat:receive', payload)
      }

      const senderIsNewChat = !fromBefore?.contacts.some(id => id.toString() === to)
      const recipientIsNewChat = !toBefore?.contacts.some(id => id.toString() === from)

      if (senderIsNewChat || recipientIsNewChat) {
        const [fromInfo, toInfo] = await Promise.all([
          recipientIsNewChat && recipientSocketId ? User.findById(from).select('_id firstName lastName email').lean() : null,
          senderIsNewChat ? User.findById(to).select('_id firstName lastName email').lean() : null,
        ])
        if (senderIsNewChat && toInfo) socket.emit('contacts:added', toInfo)
        if (recipientIsNewChat && recipientSocketId && fromInfo) io.to(recipientSocketId).emit('contacts:added', fromInfo)
      }

      callback({ success: true, message: payload })
    } catch (err) {
      console.error('chat:send error:', err)
      callback({ success: false })
    }
  })

  socket.on('chat:read', async ({ userId, fromUserId }, callback) => {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(fromUserId)) {
      return callback && callback({ success: false })
    }
    try {
      await Message.updateMany({ from: fromUserId, to: userId, read: false }, { read: true })
      const senderSocketId = onlineUsers.get(fromUserId)
      if (senderSocketId) {
        io.to(senderSocketId).emit('chat:read', { by: userId })
      }
      callback && callback({ success: true })
    } catch (err) {
      console.error('chat:read error:', err)
      callback && callback({ success: false })
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

app.get('/', (req, res) => {
  res.send('Server ishlayapti 🚀')
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log('Server running on port ' + PORT)
})
