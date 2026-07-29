const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['friend_add'], default: 'friend_add' },
  read: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema)
