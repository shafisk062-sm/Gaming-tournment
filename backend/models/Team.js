const mongoose = require('mongoose');
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  logo: String,
  captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalMatches: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  points: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Team', teamSchema);
