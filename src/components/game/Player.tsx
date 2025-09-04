import React, { useState, useEffect } from "react";
import type { Player as PlayerType, Weapon } from "../../types/game";
import { calculateAngle } from "../../utils/gameUtils";

interface PlayerProps {
  player: PlayerType;
  isLocal?: boolean;
  weapon?: Weapon;
  mousePosition: { x: number; y: number };
  onShoot?: (mousePosition?: { x: number; y: number }) => void;
  isReloading?: boolean;
}

export function Player({
  player,
  isLocal = false,
  weapon,
  mousePosition,
  onShoot,
  isReloading = false,
}: PlayerProps) {
  // Calcula a direção da arma baseada na posição do mouse
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const deltaX = mousePosition.x - centerX;
  const deltaY = mousePosition.y - centerY;
  const angle = calculateAngle(
    { x: centerX, y: centerY },
    { x: mousePosition.x, y: mousePosition.y }
  );

  const handleShoot = (event?: MouseEvent) => {
    if (
      weapon &&
      weapon.ammo > 0 &&
      !isReloading &&
      Date.now() - weapon.lastShot > weapon.fireRate
    ) {
      // Se temos o evento do mouse, passa a posição atualizada
      if (event) {
        // Passa a posição do mouse no momento exato do clique
        const updatedMousePosition = { x: event.clientX, y: event.clientY };
        // Chama onShoot com a posição atualizada
        onShoot?.(updatedMousePosition);
      } else {
        onShoot?.();
      }
    }
  };

  useEffect(() => {
    if (!isLocal) return;

    const handleClick = (event: MouseEvent) => {
      // Não atira se Shift estiver pressionado (para evitar conflito com drop)
      if (!event.shiftKey) {
        handleShoot(event);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [weapon?.ammo, isReloading, weapon?.lastShot, isLocal]);

  if (!player.isAlive) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: isLocal ? 3 : 2,
      }}
    >
      {/* Jogador */}
      <div
        style={{
          width: "24px",
          height: "24px",
          background: player.color,
          border: `2px solid ${isLocal ? "white" : "black"}`,
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          position: "relative",
        }}
      >
        {/* Barra de vida */}
        {isLocal && (
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
        )}
      </div>

      {/* Arma */}
      {isLocal && weapon && (
        <div
          style={{
            position: "absolute",
            width: "20px",
            height: "6px",
            background: isReloading
              ? "#FF9800"
              : weapon.ammo === 0
              ? "#666"
              : "#333",
            borderRadius: "3px",
            transform: `translate(-50%, -50%) rotate(${angle}rad)`,
            transformOrigin: "center",
            top: "50%",
            left: "50%",
            zIndex: 4,
            transition: "background-color 0.3s ease",
            boxShadow: isReloading
              ? "0 0 8px rgba(255,152,0,0.6)"
              : weapon.ammo === 0
              ? "0 0 4px rgba(255,0,0,0.3)"
              : "none",
            opacity: weapon.ammo === 0 ? 0.7 : 1,
          }}
        />
      )}

      {/* Indicador de recarga */}
      {isLocal && isReloading && (
        <div
          style={{
            position: "absolute",
            top: "-30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,152,0,0.9)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: "bold",
            zIndex: 5,
            animation: "pulse 1s infinite",
          }}
        >
          RECARREGANDO
        </div>
      )}

      {/* Nome do jogador */}
      <div
        style={{
          marginTop: "4px",
          padding: "2px 6px",
          background: "rgba(0,0,0,0.7)",
          color: "white",
          fontSize: "12px",
          borderRadius: "4px",
          whiteSpace: "nowrap",
          fontWeight: isLocal ? "bold" : "normal",
        }}
      >
        {player.name}
      </div>
    </div>
  );
}
