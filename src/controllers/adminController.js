const User = require('../models/User');

exports.dashboard = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, inactiveUsers, adminUsers, recentUsers] = await Promise.all([
      User.countDocuments(), User.countDocuments({ status: 'active' }), User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ role: 'admin' }), User.find().sort({ createdAt: -1 }).limit(6).select('name email role status createdAt')
    ]);
    res.render('admin/dashboard', { title: 'Admin overview', stats: { totalUsers, activeUsers, inactiveUsers, adminUsers }, recentUsers });
  } catch (error) { next(error); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 80);
    const filter = search ? { $or: [{ name: { $regex: escapeRegex(search), $options: 'i' } }, { email: { $regex: escapeRegex(search), $options: 'i' } }] } : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).select('name email role status createdAt lastLoginAt').limit(200);
    res.render('admin/users', { title: 'User management', users, search, error: null });
  } catch (error) { next(error); }
};

exports.createUser = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = req.body.role === 'admin' ? 'admin' : 'user';
    if (name.length < 2 || name.length > 70 || !validEmail(email) || password.length < 8 || password.length > 72) {
      return res.status(422).render('errors/error', { title: 'Invalid user details', message: 'Provide a name (2–70 characters), valid email and password (8–72 characters). Return to User Management and try again.' });
    }
    await User.create({ name, email, password, role, status: 'active' });
    res.redirect('/admin/users?message=User%20created');
  } catch (error) {
    if (error.code === 11000) return res.status(409).render('errors/error', { title: 'Email already exists', message: 'A user already uses this email address. Return to User Management and use another email.' });
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const target = await User.findById(id);
    if (!target) return res.status(404).render('errors/error', { title: 'User not found', message: 'The requested account could not be found.' });
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = req.body.role === 'admin' ? 'admin' : 'user';
    const status = req.body.status === 'inactive' ? 'inactive' : 'active';
    if (name.length < 2 || name.length > 70 || !validEmail(email)) return res.status(422).render('errors/error', { title: 'Invalid details', message: 'Enter a valid name and email address.' });
    if (target._id.equals(req.user._id) && (role !== 'admin' || status !== 'active')) return res.status(400).render('errors/error', { title: 'Action not allowed', message: 'You cannot remove your own administrator role or deactivate your own account.' });
    target.name = name; target.email = email; target.role = role; target.status = status;
    if (req.body.password) {
      if (req.body.password.length < 8 || req.body.password.length > 72) return res.status(422).render('errors/error', { title: 'Invalid password', message: 'A new password must be between 8 and 72 characters.' });
      target.password = req.body.password;
    }
    await target.save();
    res.redirect('/admin/users?message=User%20updated');
  } catch (error) {
    if (error.code === 11000) return res.status(409).render('errors/error', { title: 'Email already exists', message: 'Another account already uses that email address.' });
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).render('errors/error', { title: 'Action not allowed', message: 'You cannot delete your own administrator account.' });
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).render('errors/error', { title: 'User not found', message: 'This account may already have been removed.' });
    res.redirect('/admin/users?message=User%20deleted');
  } catch (error) { next(error); }
};

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
