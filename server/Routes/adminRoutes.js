// server/Routes/adminRoutes.js

const { Router } = require('express');
const { protect } = require('../Middleware/middleware');
const {
    auth,
    register,
    addRep,
    removeRep,
    getRepresentatives,
    updateRepresentativeRole,
} = require('../Controllers/adminController');

const router = Router();

// Public auth routes
router.post('/auth/login', auth);
router.post('/auth/register', register);

// --- FIX: Consolidated all '/representatives' routes into one block ---
router.route('/representatives')
    .get(protect, getRepresentatives)   // GET all representatives
    .post(protect, addRep);             // POST to create a new representative

// --- FIX: Defined specific routes with IDs separately ---
router.route('/representatives/:repId')
    .delete(protect, removeRep); // DELETE a specific representative by ID

router.route('/representatives/:repId/role')
    .patch(protect, updateRepresentativeRole); // PATCH to update a rep's role

module.exports = router;