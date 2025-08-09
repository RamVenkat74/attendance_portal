// server/Routes/adminRoutes.js

const { Router } = require('express');
const { protect } = require('../Middleware/middleware');
const {
    auth,
    register,
    removeRep,
    getRepresentatives,
    updateRepresentativeRole,
    createRepresentative, // Use the correct function for creating reps
} = require('../Controllers/adminController');

const router = Router();

// Public auth routes
router.post('/auth/login', auth);
router.post('/auth/register', register);

// Routes for managing representatives (now only Class Reps)
router.route('/representatives')
    .get(protect, getRepresentatives)       // GET all representatives
    .post(protect, createRepresentative);   // POST to create a new representative

// Routes for a specific representative by their ID
router.route('/representatives/:repId')
    .delete(protect, removeRep); // DELETE a specific representative

router.route('/representatives/:repId/role')
    .patch(protect, updateRepresentativeRole); // PATCH to update a rep's role

module.exports = router;