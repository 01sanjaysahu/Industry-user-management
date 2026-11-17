const crypto = require('crypto');
const User = require('../models/User');

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

exports.showRegister = (req, res) => res.render('auth/register', { title: 'Create account', error: null, values: {} });

exports.register = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    const values = { name, email };
    let error = null;
    if (name.length < 2 || name.length > 70) error = 'Name must be between 2 and 70 characters.';
    else if (!validEmail(email)) error = 'Enter a valid email address.';
    else if (password.length < 8 || password.length > 72) error = 'Password must be between 8 and 72 characters.';
    else if (password !== confirmPassword) error = 'Passwords do not match.';
    else if (await User.exists({ email })) error = 'An account with this email already exists.';
    if (error) return res.status(422).render('auth/register', { title: 'Create account', error, values });

    const user = await User.create({ name, email, password, role: 'user' });
    req.session.regenerate((sessionError) => {
      if (sessionError) return next(sessionError);
      req.session.userId = user._id.toString();
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
      req.session.save((saveError) => saveError ? next(saveError) : res.redirect('/dashboard'));
    });
  } catch (error) {
    if (error.code === 11000) return res.status(422).render('auth/register', { title: 'Create account', error: 'An account with this email already exists.', values: { name: req.body.name, email: req.body.email } });
    next(error);
  }
};

exports.showLogin = (req, res) => res.render('auth/login', { title: 'Sign in', error: null, message: req.query.message || null, values: {} });

exports.login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).render('auth/login', { title: 'Sign in', error: 'Email or password is incorrect.', message: null, values: { email } });
    }
    if (user.status !== 'active') {
      return res.status(403).render('auth/login', { title: 'Sign in', error: 'This account is inactive. Contact an administrator.', message: null, values: { email } });
    }
    user.lastLoginAt = new Date();
    await user.save();
    req.session.regenerate((sessionError) => {
      if (sessionError) return next(sessionError);
      req.session.userId = user._id.toString();
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
      req.session.save((saveError) => saveError ? next(saveError) : res.redirect(user.role === 'admin' ? '/admin' : '/dashboard'));
    });
  } catch (error) { next(error); }
};

exports.logout = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('industry.sid');
    res.redirect('/login?message=You%20have%20signed%20out');
  });
};
