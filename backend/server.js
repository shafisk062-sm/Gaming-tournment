require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const apiRoutes = require('./routes/api');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
const server = http.createServer(app);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const corsOptions = {
  origin(origin, callback) {
    const isLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production'
      && origin
      && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (!origin || origin === clientUrl || isLocalDevelopmentOrigin) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};
const io = new Server(server, { cors: corsOptions });

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

io.on('connection', socket => {
  socket.on('join', userId => socket.join(`user:${userId}`));
  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arena_x')
  .then(() => server.listen(PORT, () => console.log(`Arena X API running on http://localhost:${PORT}`)))
  .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
