// server/Controllers/adminController.js

const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Admin = require('../Models/adminModel');
const Course = require('../Models/courseModel');

const generateToken = (id, username) => {
    return jwt.sign({ id, username }, process.env.JWT_SECRET_KEY, {
        expiresIn: '3d',
    });
};

const register = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400);
        throw new Error('Please provide a username and password');
    }
    const userExists = await Admin.findOne({ username });
    if (userExists) {
        res.status(400);
        throw new Error('Username already exists');
    }
    const user = await Admin.create({ username, password, role: 'A' });
    if (user) {
        res.status(201).json({
            token: generateToken(user._id, user.username),
            user: { _id: user._id, username: user.username, role: user.role },
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

const auth = asyncHandler(async (req, res) => {
    const { username, password, loginType } = req.body;

    if (!loginType || !['Faculty', 'Representative'].includes(loginType)) {
        res.status(400);
        throw new Error('A valid login type is required.');
    }

    const user = await Admin.findOne({ username });

    if (user && (await user.matchPassword(password))) {
        if (loginType === 'Faculty') {
            if (user.role !== 'A') {
                res.status(401);
                throw new Error('Access denied. Please use the Class Rep login portal.');
            }
        } else if (loginType === 'Representative') {
            if (user.role !== 'C') {
                res.status(401);
                throw new Error('Access denied. You are not a registered Class Representative.');
            }
        }

        res.json({
            token: generateToken(user._id, user.username),
            user: { _id: user._id, username: user.username, role: user.role },
        });
    } else {
        res.status(401);
        throw new Error('Invalid username or password');
    }
});

// This is the new, primary function for creating any non-admin user
const createRepresentative = asyncHandler(async (req, res) => {
    const { username, password, assignedClass } = req.body;
    if (!username || !password || !assignedClass) {
        throw new Error('Username, password, and assigned class are required.');
    }
    const repExists = await Admin.findOne({ username });
    if (repExists) {
        res.status(400);
        throw new Error('Username already exists.');
    }
    // All created representatives are now Class Reps by default
    const rep = await Admin.create({
        username,
        password,
        role: 'C',
        assignedClass,
    });
    res.status(201).json({ message: 'New Class Rep created successfully.', rep });
});


const removeRep = asyncHandler(async (req, res) => {
    const { repId } = req.params;
    // This function now only needs to delete the user account
    const result = await Admin.deleteOne({ _id: repId, role: 'C' });
    if (result.deletedCount === 0) {
        res.status(404);
        throw new Error('Class Representative not found.');
    }
    res.status(200).json({ message: 'Representative removed successfully' });
});

const getRepresentatives = asyncHandler(async (req, res) => {
    // This now only fetches users with the 'C' role
    const representatives = await Admin.find({ role: 'C' }).select('-password');
    res.status(200).json(representatives);
});

const updateRepresentativeRole = asyncHandler(async (req, res) => {
    const { repId } = req.params;
    const { role, assignedClass } = req.body;
    const rep = await Admin.findById(repId);
    if (!rep) {
        res.status(404);
        throw new Error('Representative not found.');
    }
    // This function now toggles a user between Admin and Class Rep
    rep.role = role;
    rep.assignedClass = role === 'C' ? assignedClass : null;
    await rep.save();
    res.status(200).json({ message: 'Representative role updated successfully.' });
});

module.exports = {
    auth,
    register,
    removeRep,
    getRepresentatives,
    updateRepresentativeRole,
    createRepresentative
};