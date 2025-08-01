const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
	{
		course: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Course',
			required: true,
			unique: true,
			index: true,
		},
		timetable: {
			monday: { type: [Number], default: [] },
			tuesday: { type: [Number], default: [] },
			wednesday: { type: [Number], default: [] },
			thursday: { type: [Number], default: [] },
			friday: { type: [Number], default: [] },
		},
	},
	{
		timestamps: true,
	}
);

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
