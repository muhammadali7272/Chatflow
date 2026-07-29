const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/user.model')

// Auth schema - separate collection for auth data (email + password)
const authSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true })

// Pre-save hook to hash password
authSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Method to compare passwords
authSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

const Auth = mongoose.models.Auth || mongoose.model('Auth', authSchema)

class AuthService {
  /**
   * Register a new user with email + password
   */
  async register({ email, password, firstName, lastName, age }) {
    // Check if auth already exists
    const existingAuth = await Auth.findOne({ email: email.toLowerCase().trim() })
    if (existingAuth) {
      throw new Error('Bu email bilan allaqachon ro\'yxatdan o\'tilgan')
    }

    // Create the User record (reuse existing User model)
    let user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      user = await User.create({
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: Number(age) || 18,
        contacts: [],
      })
    }

    // Create auth record
    await Auth.create({
      email: email.toLowerCase().trim(),
      password,
      userId: user._id,
    })

    return {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      contacts: user.contacts || [],
      verified: true,
    }
  }

  /**
   * Login with email + password
   */
  async login({ email, password }) {
    const authRecord = await Auth.findOne({ email: email.toLowerCase().trim() })
    if (!authRecord) {
      throw new Error('Email yoki parol noto\'g\'ri')
    }

    const isMatch = await authRecord.comparePassword(password)
    if (!isMatch) {
      throw new Error('Email yoki parol noto\'g\'ri')
    }

    // Get full user data
    const user = await User.findById(authRecord.userId)
    if (!user) {
      throw new Error('Foydalanuvchi topilmadi')
    }

    return {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      contacts: user.contacts || [],
      verified: true,
    }
  }

  /**
   * Search users by email
   */
  async searchUsers(query, excludeUserId) {
    if (!query || query.trim().length < 2) return []

    const users = await User.find({
      _id: { $ne: excludeUserId },
      email: { $regex: query.trim(), $options: 'i' },
    })
      .select('_id email firstName lastName')
      .limit(10)
      .lean()

    return users.map(u => ({
      _id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
    }))
  }

  /**
   * Add a contact to user's contact list
   */
  async addContact(userId, contactId) {
    const user = await User.findById(userId)
    if (!user) throw new Error('Foydalanuvchi topilmadi')

    if (user.contacts.some(id => id.equals(contactId))) {
      throw new Error('Bu foydalanuvchi allaqachon kontaktlaringizda')
    }

    user.contacts.push(contactId)
    await user.save()

    // Return the contact user data
    const contactUser = await User.findById(contactId)
      .select('_id email firstName lastName')
      .lean()

    return contactUser
      ? { _id: contactUser._id.toString(), email: contactUser.email, firstName: contactUser.firstName, lastName: contactUser.lastName }
      : null
  }
}

module.exports = new AuthService()
