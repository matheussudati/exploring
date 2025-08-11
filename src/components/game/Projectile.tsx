import React from "react";
import type { LatLng, Projectile as ProjectileType } from "../../types/game";
import { latLngToMeters } from "../../utils/gameUtils";

interface ProjectileProps {
  projectile: ProjectileType;
  currentCenter: LatLng;
}

export function Projectile({ projectile, currentCenter }: ProjectileProps) {
  const deltaLat = projectile.position.lat - currentCenter.lat;
  const deltaLng = projectile.position.lng - currentCenter.lng;

  const { metersNorth, metersEast } = latLngToMeters(
    currentCenter.lat,
    deltaLat,
    deltaLng
  );

  // Aproximação no zoom 18
  const metersPerPixel = 0.6;
  const pixelX = metersEast / metersPerPixel;
  const pixelY = -metersNorth / metersPerPixel; // Y cresce para baixo

  // Se estiver muito fora da tela, não renderiza
  const offscreenPadding = 50;
  if (
    Math.abs(pixelX) > window.innerWidth / 2 + offscreenPadding ||
    Math.abs(pixelY) > window.innerHeight / 2 + offscreenPadding
  ) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `calc(50% + ${pixelX}px)`,
        top: `calc(50% + ${pixelY}px)`,
        transform: "translate(-50%, -50%)",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#FFD54F",
        boxShadow: "0 0 8px rgba(255,213,79,0.8)",
        border: "1px solid rgba(0,0,0,0.4)",
        pointerEvents: "none",
        zIndex: 3,
      }}
    />
  );
}


