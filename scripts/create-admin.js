require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

(async () => {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing in .env');
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) throw new Error('Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env');
    await mongoose.connect(process.env.MONGODB_URI);
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      existing.name = ADMIN_NAME.trim(); existing.role = 'admin'; existing.status = 'active'; existing.password = ADMIN_PASSWORD;
      await existing.save();
      console.log(`Administrator updated: ${email}`);
    } else {
      await User.create({ name: ADMIN_NAME.trim(), email, password: ADMIN_PASSWORD, role: 'admin', status: 'active' });
      console.log(`Administrator created: ${email}`);
    }
  } catch (error) { console.error('Could not create administrator:', error.message); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
})();
