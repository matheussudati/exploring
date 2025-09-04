import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import { WEAPONS } from '../constants/game';

interface UseSocketConnectionProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onConnect: (name: string) => void;
}

export function useSocketConnection({
  gameState,
  setGameState,
  onConnect,
}: UseSocketConnectionProps) {
  const socketRef = useRef<Socket | null>(null);
  const lastEmittedPosition = useRef<{ lat: number; lng: number } | null>(null);

  const handleConnect = (name: string) => {
    setGameState(prev => ({ ...prev, playerName: name }));
    
    const socket = io('http://192.168.2.202:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado ao servidor');
      if (socket.id) {
        setGameState(prev => ({ 
          ...prev, 
          playerId: socket.id || '',
          isConnected: true,
          currentWeapon: { ...WEAPONS.pistol, ammo: WEAPONS.pistol.maxAmmo, lastShot: 0 }
        }));
      }
      socket.emit('join', {
        name,
        position: gameState.center
      });
    });

    socket.on('currentPlayers', (players: any[]) => {
      console.log('Recebendo lista de players:', players);
      const playersObj: Record<string, any> = {};
      players.forEach(player => {
        if (player.id !== socket.id) {
          // Garante que o player tenha todas as propriedades necessárias
          playersObj[player.id] = {
            ...player,
            health: player.health || 100,
            maxHealth: player.maxHealth || 100,
            isAlive: player.isAlive !== false,
            score: player.score || 0
          };
          console.log(`Adicionando player ${player.name} (${player.id}) aos outros players`);
        } else {
          setGameState(prev => ({
            ...prev,
            playerColor: player.color,
            playerScore: player.score || 0,
            playerHealth: player.health || 100,
            playerMaxHealth: player.maxHealth || 100,
            isAlive: player.isAlive !== false,
          }));
          console.log(`Configurando dados do player local: ${player.name}`);
        }
      });
      setGameState(prev => ({ ...prev, otherPlayers: playersObj }));
      console.log(`Total de outros players: ${Object.keys(playersObj).length}`);
    });

    socket.on('playerJoined', (player: any) => {
      console.log(`Novo player entrou: ${player.name} (${player.id})`);
      // Garante que o player tenha todas as propriedades necessárias
      const completePlayer = {
        ...player,
        health: player.health || 100,
        maxHealth: player.maxHealth || 100,
        isAlive: player.isAlive !== false,
        score: player.score || 0
      };
      setGameState(prev => ({
        ...prev,
        otherPlayers: { ...prev.otherPlayers, [player.id]: completePlayer }
      }));
      console.log(`Player ${player.name} adicionado aos outros players`);
    });

    socket.on('playerMoved', ({ id, position }: { id: string; position: any }) => {
      setGameState(prev => {
        const player = prev.otherPlayers[id];
        if (player) {
          return {
            ...prev,
            otherPlayers: { ...prev.otherPlayers, [id]: { ...player, position } }
          };
        }
        return prev;
      });
    });

    socket.on('playerLeft', (id: string) => {
      setGameState(prev => {
        const { [id]: removed, ...rest } = prev.otherPlayers;
        return { ...prev, otherPlayers: rest };
      });
    });

    socket.on('playerHit', ({ id, score, health }: { id: string; score: number; health?: number }) => {
      if (id === socket.id) {
        setGameState(prev => ({
          ...prev,
          playerScore: score,
          playerHealth: health ?? prev.playerHealth,
          isAlive: health !== undefined ? health > 0 : prev.isAlive,
        }));
      } else {
        setGameState(prev => {
          const player = prev.otherPlayers[id];
          if (player) {
            return {
              ...prev,
              otherPlayers: {
                ...prev.otherPlayers,
                [id]: { ...player, score, health: health ?? player.health, isAlive: health !== undefined ? health > 0 : player.isAlive }
              }
            };
          }
          return prev;
        });
      }
    });

    socket.on('territoryCaptured', ({ territoryId, ownerId, score }: { territoryId: string; ownerId: string; score: number }) => {
      setGameState(prev => ({
        ...prev,
        territories: prev.territories.map(territory =>
          territory.id === territoryId
            ? { ...territory, ownerId, captureProgress: 100 }
            : territory
        ),
        playerScore: ownerId === socket.id ? score : prev.playerScore,
        hitEffects: ownerId === socket.id ? [
          ...prev.hitEffects,
          {
            id: `capture_${Date.now()}`,
            position: prev.territories.find(t => t.id === territoryId)?.position ?? prev.center,
            timestamp: Date.now(),
            type: 'capture',
          }
        ] : prev.hitEffects,
      }));
    });

    onConnect(name);
  };

  const emitPlayerMove = (position: { lat: number; lng: number }) => {
    if (socketRef.current && socketRef.current.connected) {
      const lastPos = lastEmittedPosition.current;
      if (!lastPos || 
          Math.abs(lastPos.lat - position.lat) > 0.00001 || 
          Math.abs(lastPos.lng - position.lng) > 0.00001) {
        socketRef.current.emit('playerMove', position);
        lastEmittedPosition.current = position;
      }
    }
  };

  const emitPlayerHit = (targetId: string, projectileId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('playerHit', { targetId, projectileId });
    }
  };

  const emitTerritoryCaptured = (territoryId: string, ownerId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('territoryCaptured', { territoryId, ownerId });
    }
  };

  const emitHeartbeat = (playerData: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('heartbeat', playerData);
    }
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    handleConnect,
    emitPlayerMove,
    emitPlayerHit,
    emitTerritoryCaptured,
    emitHeartbeat,
  };
}
