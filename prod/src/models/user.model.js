const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  // Stored hashed by auth:register; hidden by default, pulled with .select('+password') on login.
  password: { type: String, select: false },
  bio: { type: String, trim: true, default: '', maxlength: 300 },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
