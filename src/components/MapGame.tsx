import React, { useEffect, useMemo, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import LoginScreen from "./LoginScreen";
import { Player } from "./game/Player";
import { OtherPlayer } from "./game/OtherPlayer";
import { GameHUD } from "./ui/GameHUD";
import { GameMenu } from "./ui/GameMenu";
import { DeathModal } from "./ui/DeathModal";
import { useGameLoop } from "../hooks/useGameLoop";
import { useSocketConnection } from "../hooks/useSocketConnection";
import type {
  GameState,
  MenuState,
  Player as PlayerType,
  Projectile,
  Territory,
  HitEffect,
  InventoryItem,
} from "../types/game";
import {
  MAP_ZOOM,
  PLAYER_MAX_HEALTH,
  PLAYER_RESPAWN_TIME_MS,
  TERRITORY_RADIUS_METERS,
  TERRITORY_CAPTURE_TIME_MS,
  FALLBACK_START_POSITION,
  TERRITORY_COLORS,
  WEAPONS,
} from "../constants/game";
import { generateRandomPosition, calculateDistance } from "../utils/gameUtils";
import "ol/ol.css";

const containerStyle: React.CSSProperties = {
  position: "relative",
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
};

const mapContainerStyle = { width: "100%", height: "100%" };

export default function MapGame(): React.ReactElement {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  // Estado do jogo
  const [gameState, setGameState] = useState<GameState>({
    isConnected: false,
    playerName: "",
    playerColor: "dodgerblue",
    playerScore: 0,
    playerId: "",
    playerHealth: PLAYER_MAX_HEALTH,
    playerMaxHealth: PLAYER_MAX_HEALTH,
    isAlive: true,
    center: FALLBACK_START_POSITION,
    otherPlayers: {},
    projectiles: [],
    territories: [],
    hitEffects: [],
    inventory: [],
    currentWeapon: null,
    mousePosition: { x: 0, y: 0 },
  });

  // Estado do menu
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    activeTab: null,
  });

  // Estado de morte
  const [deathState, setDeathState] = useState({
    isDead: false,
    respawnTime: 0,
  });

  const pressedKeys = useRef({ w: false, a: false, s: false, d: false });
  const lastEmittedPosition = useRef<{ lat: number; lng: number } | null>(null);

  // Inicializa territórios
  useEffect(() => {
    const initialTerritories: Territory[] = [
      {
        id: "territory_1",
        position: {
          lat: gameState.center.lat + 0.0001,
          lng: gameState.center.lng + 0.0001,
        },
        radius: TERRITORY_RADIUS_METERS,
        ownerId: null,
        captureProgress: 0,
        color: TERRITORY_COLORS[0],
        captureTime: TERRITORY_CAPTURE_TIME_MS,
      },
      {
        id: "territory_2",
        position: {
          lat: gameState.center.lat - 0.0001,
          lng: gameState.center.lng - 0.0001,
        },
        radius: TERRITORY_RADIUS_METERS,
        ownerId: null,
        captureProgress: 0,
        color: TERRITORY_COLORS[1],
        captureTime: TERRITORY_CAPTURE_TIME_MS,
      },
      {
        id: "territory_3",
        position: {
          lat: gameState.center.lat + 0.0001,
          lng: gameState.center.lng - 0.0001,
        },
        radius: TERRITORY_RADIUS_METERS,
        ownerId: null,
        captureProgress: 0,
        color: TERRITORY_COLORS[2],
        captureTime: TERRITORY_CAPTURE_TIME_MS,
      },
    ];
    setGameState((prev) => ({ ...prev, territories: initialTerritories }));
  }, [gameState.center.lat, gameState.center.lng]);

  // Socket connection
  const {
    handleConnect,
    emitPlayerMove,
    emitPlayerHit,
    emitTerritoryCaptured,
  } = useSocketConnection({
    gameState,
    setGameState,
    onConnect: (name: string) => {
      console.log(`Conectado como ${name}`);
    },
  });

  // Game loop
  useGameLoop({
    gameState,
    setGameState,
    pressedKeys,
    onPlayerMove: emitPlayerMove,
    onProjectileHit: emitPlayerHit,
  });

  // Inicializa o mapa OpenLayers
  useEffect(() => {
    if (!mapRef.current || !gameState.isConnected) return;

    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: fromLonLat([gameState.center.lng, gameState.center.lat]),
        zoom: MAP_ZOOM,
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      controls: [],
      interactions: [],
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [gameState.isConnected]);

  // Atualiza centro do mapa
  useEffect(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      view.setCenter(fromLonLat([gameState.center.lng, gameState.center.lat]));
    }
  }, [gameState.center]);

  // Geolocalização
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGameState((prev) => ({
          ...prev,
          center: { lat: latitude, lng: longitude },
        }));
      },
      () => {
        // Mantém fallback
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 5_000 }
    );
  }, []);

  // Controles de teclado
  useEffect(() => {
    if (!gameState.isConnected) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "a" || key === "s" || key === "d") {
        pressedKeys.current[key as "w" | "a" | "s" | "d"] = true;
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "a" || key === "s" || key === "d") {
        pressedKeys.current[key as "w" | "a" | "s" | "d"] = false;
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gameState.isConnected]);

  // Rastreia posição do mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setGameState((prev) => ({
        ...prev,
        mousePosition: { x: e.clientX, y: e.clientY },
      }));
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Sistema de captura de território
  useEffect(() => {
    const captureInterval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        territories: prev.territories.map((territory) => {
          const distance = calculateDistance(prev.center, territory.position);

          if (distance <= territory.radius) {
            if (territory.ownerId !== prev.playerId) {
              const newProgress = Math.min(
                100,
                territory.captureProgress + 100 / (territory.captureTime / 100)
              );

              if (newProgress >= 100 && territory.ownerId !== prev.playerId) {
                emitTerritoryCaptured(territory.id, prev.playerId);
              }

              return { ...territory, captureProgress: newProgress };
            }
          } else {
            if (territory.ownerId !== prev.playerId) {
              return {
                ...territory,
                captureProgress: Math.max(0, territory.captureProgress - 2),
              };
            }
          }

          return territory;
        }),
      }));
    }, 100);

    return () => clearInterval(captureInterval);
  }, [gameState.center, gameState.playerId]);

  // Sistema de morte e respawn
  useEffect(() => {
    if (!gameState.isAlive && !deathState.isDead) {
      setDeathState({ isDead: true, respawnTime: PLAYER_RESPAWN_TIME_MS });

      // Limpa inventário e territórios
      setGameState((prev) => ({
        ...prev,
        inventory: [],
        currentWeapon: null,
        territories: prev.territories.map((t) =>
          t.ownerId === prev.playerId
            ? { ...t, ownerId: null, captureProgress: 0 }
            : t
        ),
      }));
    }
  }, [gameState.isAlive, deathState.isDead]);

  // Timer de respawn
  useEffect(() => {
    if (deathState.isDead && deathState.respawnTime > 0) {
      const timer = setTimeout(() => {
        setDeathState((prev) => ({ ...prev, respawnTime: 0 }));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [deathState.isDead, deathState.respawnTime]);

  // Remove efeitos visuais antigos
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        hitEffects: prev.hitEffects.filter(
          (effect) => Date.now() - effect.timestamp < 1000
        ),
      }));
    }, 100);
    return () => clearInterval(cleanupInterval);
  }, []);

  // Função de disparo
  const handleShoot = () => {
    if (
      !gameState.currentWeapon ||
      gameState.currentWeapon.ammo <= 0 ||
      !gameState.isAlive
    )
      return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const deltaX = gameState.mousePosition.x - centerX;
    const deltaY = gameState.mousePosition.y - centerY;

    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const directionX = length > 0 ? deltaX / length : 0;
    const directionY = length > 0 ? deltaY / length : 0;

    const newProjectile: Projectile = {
      id: `projectile_${Date.now()}_${Math.random()}`,
      position: { ...gameState.center },
      direction: { x: directionX, y: directionY },
      distanceTraveled: 0,
      maxDistance: gameState.currentWeapon.range,
      speed: 300,
      timestamp: Date.now(),
      ownerId: gameState.playerId,
      damage: gameState.currentWeapon.damage,
    };

    setGameState((prev) => ({
      ...prev,
      projectiles: [...prev.projectiles, newProjectile],
      currentWeapon: prev.currentWeapon
        ? {
            ...prev.currentWeapon,
            ammo: prev.currentWeapon.ammo - 1,
            lastShot: Date.now(),
          }
        : null,
    }));
  };

  // Função de respawn
  const handleRespawn = () => {
    const newPosition = generateRandomPosition(gameState.center, 100);
    setGameState((prev) => ({
      ...prev,
      center: newPosition,
      isAlive: true,
      playerHealth: PLAYER_MAX_HEALTH,
      currentWeapon: {
        ...WEAPONS.pistol,
        ammo: WEAPONS.pistol.maxAmmo,
        lastShot: 0,
      },
    }));
    setDeathState({ isDead: false, respawnTime: 0 });
  };

  // Função de sair do jogo
  const handleExit = () => {
    window.location.reload();
  };

  // Função de toggle do menu
  const handleMenuToggle = () => {
    setMenuState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  };

  // Função de mudança de tab
  const handleTabChange = (tab: "settings" | "profile" | "chat" | null) => {
    setMenuState((prev) => ({ ...prev, activeTab: tab }));
  };

  // Função de clique em item do inventário
  const handleInventoryItemClick = (item: InventoryItem) => {
    console.log("Item clicado:", item);
    // Implementar lógica de uso de item
  };

  if (!gameState.isConnected) {
    return <LoginScreen onConnect={handleConnect} />;
  }

  return (
    <div style={containerStyle}>
      <div ref={mapRef} style={mapContainerStyle} />

      {/* Jogador local */}
      <Player
        player={{
          id: gameState.playerId,
          name: gameState.playerName,
          position: gameState.center,
          color: gameState.playerColor,
          score: gameState.playerScore,
          territories: [],
          health: gameState.playerHealth,
          maxHealth: gameState.playerMaxHealth,
          isAlive: gameState.isAlive,
        }}
        isLocal={true}
        weapon={gameState.currentWeapon || undefined}
        mousePosition={gameState.mousePosition}
        onShoot={handleShoot}
      />

      {/* Outros jogadores */}
      {Object.values(gameState.otherPlayers).map((player) => (
        <OtherPlayer
          key={player.id}
          player={player}
          currentCenter={gameState.center}
        />
      ))}

      {/* HUD */}
      <GameHUD
        gameState={gameState}
        onInventoryItemClick={handleInventoryItemClick}
      />

      {/* Menu */}
      <GameMenu
        menuState={menuState}
        onMenuToggle={handleMenuToggle}
        onTabChange={handleTabChange}
      />

      {/* Modal de morte */}
      <DeathModal
        isVisible={deathState.isDead}
        onRespawn={handleRespawn}
        onExit={handleExit}
        respawnTime={deathState.respawnTime}
      />
    </div>
  );
}
