const mongoose = require('mongoose');
const matchSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, refPath: 'participantModel' }],
  participantModel: { type: String, enum: ['User', 'Team'], default: 'User' },
  matchDate: Date,
  matchTime: String,
  status: { type: String, enum: ['Scheduled', 'Live', 'Completed', 'Cancelled'], default: 'Scheduled' },
  roomDetails: String,
  result: {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    screenshot: String,
    winner: { type: mongoose.Schema.Types.ObjectId, refPath: 'participantModel' },
    verified: { type: Boolean, default: false }
  }
}, { timestamps: true });
module.exports = mongoose.model('Match', matchSchema);
