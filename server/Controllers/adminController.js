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

// --- THIS FUNCTION IS NOW UPDATED ---
const auth = asyncHandler(async (req, res) => {
    const { username, password, loginType } = req.body;

    if (!loginType || !['Faculty', 'Representative'].includes(loginType)) {
        res.status(400);
        throw new Error('A valid login type is required.');
    }

    const user = await Admin.findOne({ username });

    if (user && (await user.matchPassword(password))) {
        // Check permissions based on the selected login portal
        if (loginType === 'Faculty') {
            if (user.role !== 'A') {
                res.status(401);
                throw new Error('Access denied. Please use the Representative login portal.');
            }
        } else if (loginType === 'Representative') {
            // Allow both 'U' (per-course) and 'C' (class-wide) Reps to log in here
            if (!['U', 'C'].includes(user.role)) {
                res.status(401);
                throw new Error('Access denied. You are not a registered Representative.');
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

const addRep = asyncHandler(async (req, res) => {
    const { username, password, coursecode } = req.body;
    const repExists = await Admin.findOne({ username });
    if (repExists) {
        res.status(400);
        throw new Error('Representative username already exists');
    }
    const rep = await Admin.create({ username, password, role: 'U' });
    const course = await Course.findOneAndUpdate(
        { coursecode },
        { $push: { faculty: rep._id } },
        { new: true }
    );
    if (!course) {
        res.status(404);
        throw new Error('Course not found.');
    }
    res.status(201).json({
        message: 'New representative added successfully',
        representative: { _id: rep._id, username: rep.username },
    });
});

const removeRep = asyncHandler(async (req, res) => {
    const { repId } = req.params;
    await Course.updateMany(
        { faculty: repId },
        { $pull: { faculty: repId } }
    );
    const result = await Admin.deleteOne({ _id: repId, role: { $in: ['U', 'C'] } });
    if (result.deletedCount === 0) {
        res.status(404);
        throw new Error('Representative not found or is not a deletable role.');
    }
    res.status(200).json({ message: 'Representative removed successfully' });
});

const getRepresentatives = asyncHandler(async (req, res) => {
    const representatives = await Admin.find({ role: { $in: ['U', 'C'] } }).select('-password');
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
    rep.role = role;
    rep.assignedClass = role === 'C' ? assignedClass : null;
    await rep.save();
    res.status(200).json({ message: 'Representative role updated successfully.' });
});

module.exports = { auth, register, addRep, removeRep, getRepresentatives, updateRepresentativeRole };