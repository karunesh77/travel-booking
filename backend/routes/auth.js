const router = require('express').Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.patch('/change-password', verifyToken, changePassword);

module.exports = router;
