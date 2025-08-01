const { Router } = require('express');
const { protect } = require('../Middleware/middleware');
const {
    auth,
    register,
    addRep,
    removeRep,
} = require('../Controllers/adminController');

const router = Router();

router.post('/auth/login', auth);
router.post('/auth/register', register);

router.route('/representatives')
    .post(protect, addRep)
    .delete(protect, removeRep);

module.exports = router;
