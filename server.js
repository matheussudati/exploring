import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://localhost:5174", 
      "http://localhost:5175", 
      "http://localhost:5176",
      "http://192.168.2.202:5173" // IP do cliente
    ],
    methods: ["GET", "POST"]
  }
});

// Armazena todos os jogadores conectados
const players = new Map();

// Armazena territórios
const territories = new Map();

// Inicializa territórios padrão
function initializeTerritories() {
  const basePosition = { lat: -23.55052, lng: -46.633308 }; // São Paulo
  
  const territoryData = [
    { id: 'territory_1', lat: basePosition.lat + 0.0001, lng: basePosition.lng + 0.0001, color: '#FF6B6B' },
    { id: 'territory_2', lat: basePosition.lat - 0.0001, lng: basePosition.lng - 0.0001, color: '#4ECDC4' },
    { id: 'territory_3', lat: basePosition.lat + 0.0001, lng: basePosition.lng - 0.0001, color: '#45B7D1' },
  ];

  territoryData.forEach(territory => {
    territories.set(territory.id, {
      id: territory.id,
      position: { lat: territory.lat, lng: territory.lng },
      ownerId: null,
      color: territory.color,
      captureProgress: 0
    });
  });
}

initializeTerritories();

io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  // Quando um jogador entra no jogo
  socket.on('join', (playerData) => {
    const player = {
      id: socket.id,
      name: playerData.name,
      position: playerData.position,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Cor aleatória para cada jogador
      score: 0,
      territories: []
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

  // Quando um jogador atinge outro
  socket.on('playerHit', (data) => {
    const { targetId, projectileId } = data;
    const attacker = players.get(socket.id);
    const target = players.get(targetId);
    
    if (attacker && target && targetId !== socket.id) {
      // Adiciona pontos para o atacante
      attacker.score += 10;
      
      // Remove pontos do alvo
      target.score = Math.max(0, target.score - 5);
      
      // Notifica todos os jogadores sobre a mudança de pontuação
      io.emit('playerHit', { id: socket.id, score: attacker.score });
      io.emit('playerHit', { id: targetId, score: target.score });
      
      console.log(`${attacker.name} atingiu ${target.name}! ${attacker.name}: ${attacker.score}, ${target.name}: ${target.score}`);
    }
  });

  // Quando um território é capturado
  socket.on('territoryCaptured', (data) => {
    const { territoryId, ownerId } = data;
    const player = players.get(ownerId);
    const territory = territories.get(territoryId);
    
    if (player && territory) {
      // Remove território do dono anterior
      if (territory.ownerId) {
        const previousOwner = players.get(territory.ownerId);
        if (previousOwner) {
          previousOwner.territories = previousOwner.territories.filter(t => t !== territoryId);
          previousOwner.score = Math.max(0, previousOwner.score - 20);
          io.emit('playerHit', { id: territory.ownerId, score: previousOwner.score });
        }
      }
      
      // Atribui território ao novo dono
      territory.ownerId = ownerId;
      territory.captureProgress = 100;
      
      // Adiciona território à lista do jogador
      if (!player.territories.includes(territoryId)) {
        player.territories.push(territoryId);
      }
      
      // Adiciona pontos por captura
      player.score += 50;
      
      // Notifica todos os jogadores
      io.emit('territoryCaptured', {
        territoryId,
        ownerId,
        score: player.score
      });
      
      console.log(`${player.name} capturou o território ${territoryId}! Pontuação: ${player.score}`);
    }
  });

  // Quando um jogador desconecta
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      console.log(`${player.name} saiu do jogo`);
      
      // Libera territórios do jogador
      player.territories.forEach(territoryId => {
        const territory = territories.get(territoryId);
        if (territory) {
          territory.ownerId = null;
          territory.captureProgress = 0;
        }
      });
      
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
