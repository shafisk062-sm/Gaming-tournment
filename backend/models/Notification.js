const mongoose = require('mongoose');
module.exports = mongoose.model('Notification', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: String
}, { timestamps: true }));
