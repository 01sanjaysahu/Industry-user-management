const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const crypto = require('crypto');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { loadUser, requireAuth, csrfProtection } = require('./middleware/auth');
const User = require('./models/User');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: { ...helmet.contentSecurityPolicy.getDefaultDirectives(), "script-src": ["'self'", "https://cdn.jsdelivr.net"], "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], "font-src": ["'self'", "https://fonts.gstatic.com"] } } }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));
app.use(session({
  name: 'industry.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: 'sessions', ttl: 60 * 60 * 8 }),
  cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 }
}));
app.use((req, res, next) => {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  res.locals.notice = req.query.message || null;
  next();
});
app.use(loadUser);
app.use(csrfProtection);
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: 'Too many attempts. Please try again in 15 minutes.' });
app.use('/login', loginLimiter);
app.use('/register', rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/', (req, res) => res.redirect(req.user ? (req.user.role === 'admin' ? '/admin' : '/dashboard') : '/login'));
app.use('/', authRoutes);
app.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const totalUsers = req.user.role === 'admin' ? await User.countDocuments() : 1;
    res.render('dashboard', { title: 'My dashboard', totalUsers });
  } catch (error) { next(error); }
});
app.use('/admin', adminRoutes);

// Read-only REST API. Mutations are intentionally performed through CSRF-protected forms.
app.get('/api/health', (req, res) => res.json({ success: true, service: 'industry-user-management-portal', database: 'connected' }));
app.get('/api/admin/stats', requireAuth, async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required.' });
  try {
    const [total, active, inactive, admins] = await Promise.all([User.countDocuments(), User.countDocuments({ status: 'active' }), User.countDocuments({ status: 'inactive' }), User.countDocuments({ role: 'admin' })]);
    res.json({ success: true, data: { totalUsers: total, activeUsers: active, inactiveUsers: inactive, adminUsers: admins } });
  } catch (error) { next(error); }
});
app.get('/api/admin/users', requireAuth, async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required.' });
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(200).select('name email role status createdAt');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) { next(error); }
});
app.use((req, res) => res.status(404).render('errors/error', { title: 'Page not found', message: 'The page you requested does not exist.' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  res.status(status).render('errors/error', { title: status === 500 ? 'Something went wrong' : 'Request error', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred. Please try again.' : error.message });
});
module.exports = app;
