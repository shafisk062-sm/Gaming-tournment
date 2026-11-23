const mongoose = require('mongoose');
module.exports = mongoose.model('Payment', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Created', 'Paid', 'Failed'], default: 'Created' },
  provider: { type: String, default: 'Razorpay Test' },
  transactionId: String
}, { timestamps: true }));
