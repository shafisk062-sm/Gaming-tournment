const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Game = require('../models/Game');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Registration = require('../models/Registration');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET || 'arena-x-development-secret', { expiresIn: process.env.JWT_EXPIRES || '7d' });

router.post('/auth/register', async (req, res, next) => {
  try {
    const { name, username, email, phone, password, confirmPassword } = req.body;
    if (!name || !username || !email || !password) return res.status(400).json({ message: 'Required fields are missing' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = await User.create({ name, username, email, phone, password });
    res.status(201).json({ token: signToken(user._id), user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }] }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.suspended) return res.status(403).json({ message: 'Your account has been suspended' });
    res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, avatar: user.avatar, stats: user.stats } });
  } catch (err) { next(err); }
});
router.post('/auth/logout', (req, res) => res.json({ message: 'Logged out successfully' }));
router.post('/auth/forgot-password', async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  res.json({ message: 'If an account exists for this email, reset instructions have been sent.' });
});
router.post('/auth/reset-password', (req, res) => res.status(501).json({ message: 'Password reset delivery is not configured.' }));

router.get('/users/profile', protect, (req, res) => res.json(req.user));
router.put('/users/profile', protect, async (req, res, next) => {
  try {
    const allowed = ['name', 'username', 'phone', 'avatar'];
    allowed.forEach(key => { if (req.body[key] !== undefined) req.user[key] = req.body[key]; });
    await req.user.save();
    res.json(req.user);
  } catch (err) { next(err); }
});
router.get('/users', protect, authorize('admin'), async (req, res) => res.json(await User.find().select('-password')));
router.patch('/users/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try { res.json(await User.findByIdAndUpdate(req.params.id, { suspended: Boolean(req.body.suspended) }, { new: true }).select('-password')); } catch (err) { next(err); }
});

router.get('/games', async (req, res) => res.json(await Game.find().sort({ name: 1 }).lean()));
router.post('/games', protect, authorize('admin'), async (req, res, next) => { try { res.status(201).json(await Game.create(req.body)); } catch (e) { next(e); } });
router.put('/games/:id', protect, authorize('admin'), async (req, res, next) => { try { res.json(await Game.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (e) { next(e); } });
router.delete('/games/:id', protect, authorize('admin'), async (req, res, next) => { try { await Game.findByIdAndDelete(req.params.id); res.json({ message: 'Game deleted' }); } catch (e) { next(e); } });

router.get('/tournaments', async (req, res) => {
  const { game, status, search } = req.query;
  const filter = {};
  if (game) filter.game = game;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: 'i' };
  const tournaments = await Tournament.find(filter).populate('game organizer', 'name category username').sort({ tournamentDate: 1 });
  res.json(tournaments);
});
router.post('/tournaments', protect, authorize('admin', 'organizer'), async (req, res, next) => {
  try { res.status(201).json(await Tournament.create({ ...req.body, organizer: req.user._id })); } catch (e) { next(e); }
});
router.get('/tournaments/:id', async (req, res, next) => {
  try { const tournament = await Tournament.findById(req.params.id).populate('game').populate('participants', 'name username avatar stats'); if (!tournament) return res.status(404).json({ message: 'Tournament not found' }); res.json(tournament); } catch (e) { next(e); }
});
router.put('/tournaments/:id', protect, authorize('admin', 'organizer'), async (req, res, next) => { try { res.json(await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('game')); } catch (e) { next(e); } });
router.delete('/tournaments/:id', protect, authorize('admin'), async (req, res, next) => { try { await Tournament.findByIdAndDelete(req.params.id); res.json({ message: 'Tournament deleted' }); } catch (e) { next(e); } });

router.post('/tournaments/:id/register', protect, async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.participants.length >= tournament.maxParticipants) return res.status(409).json({ message: 'Tournament is full' });
    if (tournament.participants.some(id => id.toString() === req.user.id)) return res.status(409).json({ message: 'You are already registered' });
    const status = tournament.entryFee > 0 ? 'Pending' : 'Approved';
    const registration = await Registration.create({ tournament: tournament._id, user: req.user._id, status, paymentStatus: tournament.entryFee > 0 ? 'Pending' : 'Not Required' });
    tournament.participants.push(req.user._id);
    await tournament.save();
    await Notification.create({ user: req.user._id, title: 'Tournament Registered', message: `You joined ${tournament.name}`, type: 'registration' });
    res.status(201).json(registration);
  } catch (e) { next(e); }
});

router.get('/teams', protect, async (req, res) => res.json(await Team.find({ $or: [{ captain: req.user._id }, { members: req.user._id }] }).populate('captain members', 'name username avatar')));
router.post('/teams', protect, async (req, res, next) => {
  try { res.status(201).json(await Team.create({ name: req.body.name, logo: req.body.logo, captain: req.user._id, members: [req.user._id] })); } catch (e) { next(e); }
});
router.put('/teams/:id', protect, async (req, res, next) => {
  try { const team = await Team.findOne({ _id: req.params.id, captain: req.user._id }); if (!team) return res.status(403).json({ message: 'Only the team captain can edit this team' }); Object.assign(team, req.body); await team.save(); res.json(team); } catch (e) { next(e); }
});
router.post('/teams/:id/invite', protect, async (req, res, next) => {
  try { const team = await Team.findOne({ _id: req.params.id, captain: req.user._id }); if (!team) return res.status(403).json({ message: 'Only the team captain can invite players' }); const user = await User.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] }); if (!user) return res.status(404).json({ message: 'Player not found' }); await Notification.create({ user: user._id, title: 'Team Invitation', message: `You were invited to join ${team.name}`, type: 'team' }); res.json({ message: 'Invitation sent' }); } catch (e) { next(e); }
});

router.get('/matches', async (req, res) => res.json(await Match.find().populate('tournament', 'name status').populate('participants', 'name username')));
router.post('/matches', protect, authorize('admin', 'organizer'), async (req, res, next) => { try { res.status(201).json(await Match.create(req.body)); } catch (e) { next(e); } });
router.put('/matches/:id/result', protect, async (req, res, next) => {
  try { const match = await Match.findById(req.params.id); if (!match) return res.status(404).json({ message: 'Match not found' }); match.result = { submittedBy: req.user._id, screenshot: req.body.screenshot, winner: req.body.winner, verified: req.user.role === 'admin' }; if (match.result.verified) match.status = 'Completed'; await match.save(); res.json(match); } catch (e) { next(e); }
});
router.patch('/matches/:id/verify', protect, authorize('admin'), async (req, res, next) => {
  try { const match = await Match.findById(req.params.id); if (!match) return res.status(404).json({ message: 'Match not found' }); match.result.verified = true; match.status = 'Completed'; await match.save(); if (match.result.winner) await User.findByIdAndUpdate(match.result.winner, { $inc: { 'stats.matchesPlayed': 1, 'stats.wins': 1, 'stats.points': 100 } }); res.json(match); } catch (e) { next(e); }
});

router.get('/leaderboard', async (req, res) => {
  const users = await User.find().select('name username avatar stats').sort({ 'stats.points': -1, 'stats.wins': -1 }).limit(100);
  res.json(users);
});
router.get('/notifications', protect, async (req, res) => res.json(await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50)));
router.patch('/notifications/:id/read', protect, async (req, res) => res.json(await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true })));
router.get('/payments', protect, async (req, res) => res.json(await Payment.find({ user: req.user._id }).populate('tournament', 'name')));
router.get('/admin/stats', protect, authorize('admin'), async (req, res) => res.json({
  users: await User.countDocuments(),
  tournaments: await Tournament.countDocuments(),
  teams: await Team.countDocuments(),
  matches: await Match.countDocuments(),
  activeTournaments: await Tournament.countDocuments({ status: { $in: ['Live', 'Registration Open'] } })
}));

module.exports = router;
