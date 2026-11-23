const mongoose = require('mongoose');
const registrationSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Not Required', 'Pending', 'Paid', 'Failed'], default: 'Not Required' }
}, { timestamps: true });
registrationSchema.index({ tournament: 1, user: 1 }, { unique: true, sparse: true });
registrationSchema.index({ tournament: 1, team: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('Registration', registrationSchema);
