require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
console.log('URI set:', !!uri);
console.log('Connecting at:', new Date().toISOString());

mongoose.connect(uri)
  .then(() => {
    console.log('Connected at:', new Date().toISOString());
    const db = mongoose.connection.db;

    // List all collections
    return db.listCollections().toArray();
  })
  .then(collections => {
    console.log('Collections:', collections.map(c => c.name).join(', '));

    // Check User collection
    const User = require('../src/models/user.model');
    return User.find({}).lean();
  })
  .then(users => {
    console.log('Total users:', users.length);
    const admin = users.find(u => u.email === 'admin@gmail.com');
    if (admin) {
      console.log('Admin user EXISTS:', JSON.stringify(admin, null, 2));
    } else {
      console.log('admin@gmail.com NOT FOUND');
    }

    // Check Auth collection
    return mongoose.connection.db.collection('auths').find({}).toArray();
  })
  .then(auths => {
    console.log('Total auth records:', auths.length);
    auths.forEach(a => console.log('Auth:', a.email, '(userId:', a.userId, ')'));

    const adminAuth = auths.find(a => a.email === 'admin@gmail.com');
    if (adminAuth) {
      console.log('Admin auth EXISTS:', adminAuth.email);
    } else {
      console.log('Admin auth NOT FOUND');
    }

    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  });
