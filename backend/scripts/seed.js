require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Game = require('../models/Game');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');

const names = ['BGMI', 'Free Fire MAX', 'Valorant', 'Counter-Strike 2', 'Call of Duty Mobile', 'PUBG', 'Fortnite', 'Minecraft', 'EA Sports FC', 'Clash of Clans'];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arena_x');
  await Promise.all([User.deleteMany({}), Game.deleteMany({}), Tournament.deleteMany({}), Team.deleteMany({}), Match.deleteMany({})]);

  const admin = await User.create({ name: 'Arena Admin', username: 'admin', email: 'admin@arenax.gg', phone: '9999999999', password: 'Admin@123', role: 'admin', verified: true });
  const users = [];
  for (let i = 1; i <= 20; i++) {
    users.push(await User.create({
      name: `Player ${i}`, username: `player${i}`, email: `player${i}@demo.gg`, password: 'Player@123',
      verified: i % 3 !== 0, stats: { matchesPlayed: 20 - i / 2, wins: 15 - i / 2, losses: i, points: 3000 - i * 115 }
    }));
  }
  const games = await Game.insertMany(names.map((name, i) => ({ name, category: i < 6 ? 'Battle Royale / FPS' : i < 8 ? 'Sandbox / Action' : 'Sports / Strategy', activeTournaments: (i % 4) + 1, players: 5000 + i * 930 })));
  const statuses = ['Registration Open', 'Live', 'Upcoming', 'Completed'];
  const tournaments = [];
  for (let i = 0; i < 13; i++) {
    tournaments.push(await Tournament.create({
      name: i < 5 ? `X ${names[i]} Championship` : `Arena ${names[i % names.length]} Series ${i + 1}`,
      game: games[i % games.length]._id, category: ['Solo', 'Duo', 'Squad', 'Team vs Team'][i % 4],
      description: 'Compete against the best players, climb the standings, and win a share of the prize pool.',
      entryFee: i % 3 === 0 ? 0 : 199, prizePool: [25000, 50000, 75000, 100000][i % 4],
      maxParticipants: [32, 64, 100, 128][i % 4], participants: users.slice(0, (i % 12) + 3).map(u => u._id),
      registrationDeadline: new Date(Date.now() + (i - 3) * 86400000),
      tournamentDate: new Date(Date.now() + (i - 5) * 86400000), startTime: '18:30',
      rules: ['No cheating or exploits', 'Join lobby 15 minutes early', 'Screenshots required for disputes'],
      matchFormat: i % 2 ? 'Double elimination' : 'Round robin',
      status: statuses[i % statuses.length], organizer: admin._id
    }));
  }
  for (let i = 0; i < 5; i++) {
    await Team.create({ name: `Neon Wolves ${i + 1}`, captain: users[i]._id, members: users.slice(i, i + 4).map(u => u._id), wins: 12 - i * 2, losses: i + 2, points: 1600 - i * 170 });
  }
  for (let i = 0; i < 10; i++) {
    await Match.create({ tournament: tournaments[i]._id, participants: users.slice(i, i + 2).map(u => u._id), matchDate: tournaments[i].tournamentDate, matchTime: '19:00', status: i < 3 ? 'Live' : i < 7 ? 'Scheduled' : 'Completed' });
  }
  console.log('Seed complete');
  console.log('Demo admin: admin@arenax.gg / Admin@123');
  console.log('Demo player: player1@demo.gg / Player@123');
  await mongoose.disconnect();
}
seed().catch(err => { console.error(err); process.exit(1); });
