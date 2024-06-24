const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  }
});

// Dicionário para armazenar os maiores placares de cada sala
const rooms = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/join', (req, res) => {
  const roomCode = req.body.room_code;
  res.redirect(`/game/${roomCode}`);
});

app.get('/game/:room_code', (req, res) => {
  res.sendFile(__dirname + '/public/game.html');
});

app.post('/save_score', (req, res) => {
  const player = req.body.player;
  const score = parseInt(req.body.score);
  const roomCode = req.body.room_code;

  if (!rooms[roomCode]) {
    rooms[roomCode] = [];
  }

  let playerFound = false;
  for (let i = 0; i < rooms[roomCode].length; i++) {
    if (rooms[roomCode][i][0] === player) {
      if (score > rooms[roomCode][i][1]) {
        rooms[roomCode][i][1] = score;
      }
      playerFound = true;
      break;
    }
  }

  if (!playerFound) {
    rooms[roomCode].push([player, score]);
  }

  rooms[roomCode].sort((a, b) => b[1] - a[1]);

  io.to(roomCode).emit('update_scores', { room_code: roomCode, high_scores: rooms[roomCode] });

  res.json({ status: 'success' });
});

io.on('connection', (socket) => {
  socket.on('join', ({ room_code }) => {
    socket.join(room_code);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
