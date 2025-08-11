import { useEffect, useRef } from 'react';
import type { GameState } from '../types/game';
import { PLAYER_SPEED_METERS_PER_SECOND, PROJECTILE_SPEED_METERS_PER_SECOND, PROJECTILE_MAX_DISTANCE_METERS, PLAYER_HIT_RADIUS_METERS } from '../constants/game';
import { metersToLatLngDelta, calculateDistance, normalizeDirection } from '../utils/gameUtils';

interface UseGameLoopProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  pressedKeys: React.MutableRefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>;
  onPlayerMove?: (newPosition: { lat: number; lng: number }) => void;
  onProjectileHit?: (projectileId: string, targetId: string) => void;
}

export function useGameLoop({
  gameState,
  setGameState,
  pressedKeys,
  onPlayerMove,
  onProjectileHit,
}: UseGameLoopProps) {
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gameState.isConnected || !gameState.isAlive) return;

    let rafId = 0;
    const tick = (ts: number) => {
      const last = lastTsRef.current;
      lastTsRef.current = ts;
      const dt = last == null ? 0 : (ts - last) / 1000; // segundos

      // Movimento do jogador
      const { w, a, s, d } = pressedKeys.current;
      if (dt > 0 && (w || a || s || d)) {
        const speed = PLAYER_SPEED_METERS_PER_SECOND;
        let moveEast = 0;
        let moveNorth = 0;
        if (w) moveNorth += speed * dt;
        if (s) moveNorth -= speed * dt;
        if (d) moveEast += speed * dt;
        if (a) moveEast -= speed * dt;

        setGameState((prev) => {
          const { deltaLat, deltaLng } = metersToLatLngDelta(
            prev.center.lat,
            moveEast,
            moveNorth
          );
          const newPosition = { 
            lat: prev.center.lat + deltaLat, 
            lng: prev.center.lng + deltaLng 
          };
          
          onPlayerMove?.(newPosition);
          
          return {
            ...prev,
            center: newPosition,
          };
        });
      }

      // Movimento dos projéteis e detecção de colisão
      if (dt > 0) {
        setGameState((prev) => {
          const updatedProjectiles = prev.projectiles
            .map((projectile) => {
              const distanceThisFrame = PROJECTILE_SPEED_METERS_PER_SECOND * dt;
              const newDistanceTraveled = projectile.distanceTraveled + distanceThisFrame;

              if (newDistanceTraveled >= projectile.maxDistance) {
                return null; // Remove projétil que atingiu distância máxima
              }

              // Calcula nova posição
              const { deltaLat, deltaLng } = metersToLatLngDelta(
                projectile.position.lat,
                projectile.direction.x * distanceThisFrame,
                -projectile.direction.y * distanceThisFrame
              );

              const newPosition = {
                lat: projectile.position.lat + deltaLat,
                lng: projectile.position.lng + deltaLng,
              };

              // Verifica colisão com jogadores
              const allPlayers = [
                {
                  id: prev.playerId,
                  position: prev.center,
                  name: prev.playerName,
                  color: prev.playerColor,
                  score: prev.playerScore,
                  health: prev.playerHealth,
                  maxHealth: prev.playerMaxHealth,
                  isAlive: prev.isAlive,
                  territories: [],
                },
                ...Object.values(prev.otherPlayers),
              ].filter(Boolean);

              for (const player of allPlayers) {
                if (player && player.id !== projectile.ownerId && player.isAlive) {
                  const distance = calculateDistance(newPosition, player.position);
                  if (distance <= PLAYER_HIT_RADIUS_METERS) {
                    // Colisão detectada!
                    setGameState((currentState) => ({
                      ...currentState,
                      hitEffects: [
                        ...currentState.hitEffects,
                        {
                          id: `hit_${Date.now()}`,
                          position: newPosition,
                          timestamp: Date.now(),
                          type: 'hit',
                        },
                      ],
                    }));

                    onProjectileHit?.(projectile.id, player.id);
                    return null; // Remove projétil
                  }
                }
              }

              return {
                ...projectile,
                position: newPosition,
                distanceTraveled: newDistanceTraveled,
              };
            })
            .filter((p): p is typeof prev.projectiles[0] => p !== null);

          return {
            ...prev,
            projectiles: updatedProjectiles,
          };
        });
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [gameState.isConnected, gameState.isAlive, onPlayerMove, onProjectileHit]);
}
