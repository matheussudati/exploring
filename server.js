import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    methods: ["GET", "POST"]
  }
});

// Armazena todos os jogadores conectados
const players = new Map();

io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  // Quando um jogador entra no jogo
  socket.on('join', (playerData) => {
    const player = {
      id: socket.id,
      name: playerData.name,
      position: playerData.position,
      color: `hsl(${Math.random() * 360}, 70%, 50%)` // Cor aleatória para cada jogador
    };
    
    players.set(socket.id, player);
    
    // Envia a lista de jogadores existentes para o novo jogador
    socket.emit('currentPlayers', Array.from(players.values()));
    
    // Notifica outros jogadores sobre o novo jogador
    socket.broadcast.emit('playerJoined', player);
    
    console.log(`${player.name} entrou no jogo`);
  });

  // Quando um jogador se move
  socket.on('playerMove', (position) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = position;
      // Envia a nova posição para todos os outros jogadores
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: position
      });
    }
  });

  // Quando um jogador desconecta
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      console.log(`${player.name} saiu do jogo`);
      players.delete(socket.id);
      // Notifica outros jogadores
      io.emit('playerLeft', socket.id);
    }
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Servidor multiplayer rodando na porta ${PORT}`);
  console.log(`Conecte-se usando o endereço da sua rede local`);
});
