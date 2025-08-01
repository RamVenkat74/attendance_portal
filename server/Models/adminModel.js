const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        role: {
            type: String,
            required: true,
            enum: ['A', 'U'], // 'A' for Admin/Faculty, 'U' for User/Representative
        },
    },
    {
        timestamps: true,
    }
);

// Middleware to hash password before saving
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with the hashed password
adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
