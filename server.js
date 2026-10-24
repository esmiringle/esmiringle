const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let waitingUser = null;

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('find_match', () => {
    if (waitingUser) {
      const partner = waitingUser;
      waitingUser = null;

      socket.emit('matched', { partnerId: partner.id, initiator: true });
      partner.emit('matched', { partnerId: socket.id, initiator: false });

      console.log(`Matched: ${socket.id} and ${partner.id}`);
    } else {
      waitingUser = socket;
      socket.emit('waiting');
      console.log(`User waiting: ${socket.id}`);
    }
  });

  socket.on('offer', (data) => {
    io.to(data.target).emit('offer', { offer: data.offer, sender: socket.id });
  });

  socket.on('answer', (data) => {
    io.to(data.target).emit('answer', { answer: data.answer, sender: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.target).emit('ice-candidate', { candidate: data.candidate });
  });

  socket.on('skip_chat', () => {
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Esmiringle Server running on port ${PORT}`);
});