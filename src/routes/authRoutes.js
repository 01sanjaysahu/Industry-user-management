const router = require('express').Router();
const auth = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
router.get('/register', auth.showRegister);
router.post('/register', auth.register);
router.get('/login', auth.showLogin);
router.post('/login', auth.login);
router.post('/logout', requireAuth, auth.logout);
module.exports = router;
