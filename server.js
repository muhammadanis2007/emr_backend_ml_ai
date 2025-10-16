
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const app = express();
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/visits', require('./routes/visitRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/lab', require('./routes/labRoutes'));
app.use('/api/model', require('./routes/modelRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// health
app.get('/', (req, res) => res.send('EMR Backend OK'));

// start server with socket.io for alerts
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// attach io instance to alerts service
const alertsService = require('./services/alertsService');
alertsService.setIo(io);
alertsService.startSchedulers();

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected', socket.id));
});

const retrainService = require('./services/retrainService');
// retrain service schedules internally via cron

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
