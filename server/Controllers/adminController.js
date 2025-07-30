const admin = require("../Models/adminModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const classmodel = require("../Models/courseModel");

const register = async (req, res) => {
	let data = req.body;
	data["role"] = "A";
	const username = data.username;
	try {
		const User = await admin.find(data);
		if (User.length > 0) {
			console.log(User);
			return res.status(400).send({ message: "Username already exists!" });
		}
		// Create a new user
		const user = new admin(data);
		await user.save();

		// Create a JWT token for the newly registered faculty
		const token = jwt.sign(
			{ id: user._id, username: username },
			process.env.JWT_SECRET_KEY,
			{
				expiresIn: "3d",
			}
		);
		console.log("register:", user);
		res.status(201).json({ token: token, user: user });
	} catch (err) {
		console.log("Error occurred @register:", err);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

const auth = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await admin.findOne({ username });
		console.log(user);
		if (!user) {
			return res.status(400).json({ message: "invalid username or password" });
		}
		if (user.password != password) {
			return res.status(400).json({ message: "invalid username or password" });
		}
		const token = jwt.sign(
			{ id: user._id, username: username },
			process.env.JWT_SECRET_KEY,
			{
				expiresIn: "3d",
			}
		);
		console.log("@auth:", user);
		return res.status(200).json({ token: token, user: user });
	} catch (err) {
		console.log(err);
		res.status(500).json(err);
	}
};

const addRep = async (req, res) => {
	let data = req.body;
	data["role"] = "U";
	console.log("Received Data:", data, req.user.id);

	try {
		const facultyClasses = await classmodel.find({
			faculty: { $in: [req.user.id] },
		});
		if (facultyClasses.length === 0) {
			return res.status(404).json({ message: "Faculty not found" });
		}
		const existingUser = await admin.findOne({ username: data.username });
		if (existingUser) {
			return res.status(400).json({ message: "Username already exists!" });
		}

		const rep = new admin(data);
		await rep.save();

		await classmodel.updateMany(
			{ faculty: { $in: [req.user.id] }, coursecode: data.coursecode },
			{ $push: { faculty: rep._id } }
		);

		console.log("New Representative Added:", rep);
		return res.status(201).json({ message: "New representative added", rep });
	} catch (err) {
		console.error("Error at creating representative:", err);
		return res.status(500).send("Internal Server Error");
	}
};

const removeRep = async (req, res) => {
	let data = req.body;
	data["role"] = "U";
	console.log("Received Data:", data, req.user.id);

	try {
		// Log the query parameters
		console.log("Query Parameters: ", {
			facultyId: req.user.id,
			coursecode: data.coursecode,
		});

		// Find the faculty classes where the representative should be removed
		const facultyClasses = await classmodel.find({
			faculty: { $in: [req.user.id] },
		});
		if (facultyClasses.length === 0) {
			return res.status(404).json({ message: "Faculty not found" });
		}

		// Find the representative in the admin collection
		const existingUser = await admin.findOne({ username: data.username });
		if (!existingUser) {
			return res.status(400).json({ message: "Username does not exist!" });
		}

		// Log facultyClasses to check if the representative is associated with any class
		console.log("Faculty Classes Found: ", facultyClasses);

		// Remove the representative's ID from the faculty array in classmodel
		const updateResult = await classmodel.updateMany(
			{
				faculty: { $in: [req.user.id] },
				coursecode: data.coursecode,
			},
			{ $pull: { faculty: existingUser._id } } // Ensure existingUser._id is an ObjectId
		);

		// Log the update result for debugging
		console.log("Update Result:", updateResult);

		// Check if the representative was actually pulled from any document
		if (updateResult.matchedCount === 0) {
			console.warn("No matching documents found for the representative.");
			return res.status(404).json({
				message: "No matching documents found for the representative.",
			});
		}

		// Remove the representative from the admin collection
		const removedRep = await admin.deleteOne({ _id: existingUser._id });

		console.log("Representative removed from admin:", removedRep);
		return res
			.status(200)
			.json({ message: "Representative removed", removedRep });
	} catch (err) {
		console.error("Error at removing representative:", err);
		return res.status(500).send("Internal Server Error");
	}
};

module.exports = {
	auth,
	register,
	addRep,
	removeRep,
};
