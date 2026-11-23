const mongoose = require('mongoose');
const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  banner: String,
  description: String,
  category: { type: String, enum: ['Solo', 'Duo', 'Squad', 'Team vs Team'], required: true },
  entryFee: { type: Number, default: 0 },
  prizePool: { type: Number, required: true },
  maxParticipants: { type: Number, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  registrationDeadline: Date,
  tournamentDate: Date,
  startTime: String,
  rules: [String],
  matchFormat: String,
  status: { type: String, enum: ['Upcoming', 'Registration Open', 'Registration Closed', 'Live', 'Completed'], default: 'Upcoming' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
tournamentSchema.index({ name: 'text', description: 'text' });
module.exports = mongoose.model('Tournament', tournamentSchema);
