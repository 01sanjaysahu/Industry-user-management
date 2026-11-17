const User = require('../models/User');

async function loadUser(req, res, next) {
  res.locals.currentUser = null;
  if (!req.session.userId) return next();
  try {
    const user = await User.findById(req.session.userId).select('_id name email role status');
    if (!user || user.status !== 'active') {
      return req.session.destroy(() => res.redirect('/login?message=Please%20sign%20in%20again'));
    }
    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch (error) { next(error); }
}

function requireAuth(req, res, next) {
  if (!req.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.redirect('/login');
  if (req.user.role !== 'admin') return res.status(403).render('errors/error', { title: 'Access denied', message: 'You do not have permission to view this page.' });
  next();
}

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const submitted = req.body && req.body._csrf;
  if (!submitted || submitted !== req.session.csrfToken) {
    return res.status(403).render('errors/error', { title: 'Request expired', message: 'This form has expired. Go back, refresh the page, and try again.' });
  }
  next();
}

module.exports = { loadUser, requireAuth, requireAdmin, csrfProtection };
