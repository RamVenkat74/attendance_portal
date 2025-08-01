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
    const { username, password } = req.body;
    const user = await Admin.findOne({ username });
    if (user && (await user.matchPassword(password))) {
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
    const { username, coursecode } = req.body;
    const rep = await Admin.findOne({ username, role: 'U' });
    if (!rep) {
        res.status(404);
        throw new Error('Representative not found');
    }
    const courseUpdateResult = await Course.updateOne(
        { coursecode },
        { $pull: { faculty: rep._id } }
    );
    if (courseUpdateResult.modifiedCount === 0) {
        res.status(404);
        throw new Error('Course not found, or representative was not assigned to it.');
    }
    await Admin.deleteOne({ _id: rep._id });
    res.status(200).json({ message: 'Representative removed successfully' });
});

module.exports = { auth, register, addRep, removeRep };
