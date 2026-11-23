const mongoose = require('mongoose');
const gameSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  image: { type: String, default: '' },
  activeTournaments: { type: Number, default: 0 },
  players: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Game', gameSchema);
