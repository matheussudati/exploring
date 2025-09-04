import React from "react";
import type { Player as PlayerType, LatLng } from "../../types/game";
import { latLngToMeters } from "../../utils/gameUtils";

interface OtherPlayerProps {
  player: PlayerType;
  currentCenter: LatLng;
}

export function OtherPlayer({ player, currentCenter }: OtherPlayerProps) {
  // Log de debug para verificar se o player está sendo renderizado
  console.log(`Renderizando OtherPlayer: ${player.name} (${player.id})`, {
    playerPosition: player.position,
    currentCenter,
    isAlive: player.isAlive
  });

  // Calcula a posição do outro jogador relativa ao centro atual
  const deltaLat = player.position.lat - currentCenter.lat;
  const deltaLng = player.position.lng - currentCenter.lng;

  const { metersNorth, metersEast } = latLngToMeters(
    currentCenter.lat,
    deltaLat,
    deltaLng
  );

  // No zoom 18, aproximadamente 0.6 metros por pixel
  const metersPerPixel = 0.6;
  const pixelX = metersEast / metersPerPixel;
  const pixelY = -metersNorth / metersPerPixel; // Negativo porque Y cresce para baixo

  console.log(`Posição calculada para ${player.name}:`, {
    deltaLat,
    deltaLng,
    metersNorth,
    metersEast,
    pixelX,
    pixelY,
    windowSize: { width: window.innerWidth, height: window.innerHeight }
  });

  // Se o jogador estiver muito longe, não renderiza
  if (
    Math.abs(pixelX) > window.innerWidth * 2 ||
    Math.abs(pixelY) > window.innerHeight * 2
  ) {
    console.log(`Player ${player.name} muito longe, não renderizando`);
    return null;
  }

  if (!player.isAlive) {
    console.log(`Player ${player.name} morto, não renderizando`);
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `calc(50% + ${pixelX}px)`,
        top: `calc(50% + ${pixelY}px)`,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          background: player.color,
          border: "2px solid black",
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          position: "relative",
        }}
      >
        {/* Barra de vida */}
        <div
          style={{
            position: "absolute",
            top: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "32px",
            height: "4px",
            background: "rgba(0,0,0,0.5)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(player.health / player.maxHealth) * 100}%`,
              height: "100%",
              background:
                player.health > 50
                  ? "#4CAF50"
                  : player.health > 25
                  ? "#FF9800"
                  : "#F44336",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
      <div
        style={{
          marginTop: "4px",
          padding: "2px 6px",
          background: "rgba(0,0,0,0.7)",
          color: "white",
          fontSize: "12px",
          borderRadius: "4px",
          whiteSpace: "nowrap",
        }}
      >
        {player.name}
      </div>
    </div>
  );
}
