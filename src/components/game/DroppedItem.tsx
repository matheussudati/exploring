import React, { useMemo } from "react";
import type { InventoryItem, Weapon } from "../../types/game";
import { latLngToMeters } from "../../utils/gameUtils";
import { MAP_ZOOM } from "../../constants/game";

interface DroppedItemProps {
  item: InventoryItem;
  position: { lat: number; lng: number };
  currentCenter: { lat: number; lng: number };
  weaponData?: Weapon; // Dados específicos da arma
}

export function DroppedItem({
  item,
  position,
  currentCenter,
  weaponData,
}: DroppedItemProps) {
  // Memoiza o cálculo de posição para evitar recálculos desnecessários
  const { screenX, screenY, isVisible } = useMemo(() => {
    // Calcula a diferença entre a posição do item e o centro atual
    const deltaLat = position.lat - currentCenter.lat;
    const deltaLng = position.lng - currentCenter.lng;

    // Converte para metros usando a mesma lógica do OtherPlayer
    const { metersNorth, metersEast } = latLngToMeters(
      currentCenter.lat,
      deltaLat,
      deltaLng
    );

    // Usa escala fixa para zoom 18 (0.6 metros por pixel)
    const metersPerPixel = 0.6;
    
    const pixelX = metersEast / metersPerPixel;
    const pixelY = -metersNorth / metersPerPixel; // Negativo porque Y cresce para baixo

    // Calcula a posição na tela (centro + offset)
    const screenX = window.innerWidth / 2 + pixelX;
    const screenY = window.innerHeight / 2 + pixelY;

    // Debug: log das posições (apenas quando necessário)
    if (Math.abs(pixelX) > 1000 || Math.abs(pixelY) > 1000) {
      console.log(`📍 Item ${item.name} - Posição muito longe:`, {
        itemPosition: position,
        currentCenter,
        metersNorth,
        metersEast,
        pixelX,
        pixelY,
        screenX,
        screenY,
      });
    }

    // Log para verificar se o item está se movendo
    console.log(`📍 Item ${item.name} - Posição fixa:`, {
      deltaLat: deltaLat.toFixed(8),
      deltaLng: deltaLng.toFixed(8),
      metersNorth: metersNorth.toFixed(2),
      metersEast: metersEast.toFixed(2),
      pixelX: pixelX.toFixed(2),
      pixelY: pixelY.toFixed(2),
      screenX: screenX.toFixed(2),
      screenY: screenY.toFixed(2),
    });

    // Verifica se o item está visível na tela (com margem de 100px)
    const visible =
      screenX >= -100 &&
      screenX <= window.innerWidth + 100 &&
      screenY >= -100 &&
      screenY <= window.innerHeight + 100;

    return { screenX, screenY, isVisible: visible };
  }, [position.lng, position.lat, currentCenter.lng, currentCenter.lat]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: screenX - 24, // Centraliza o ícone
        top: screenY - 24,
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {/* Ícone do item */}
      <div
        style={{
          width: "48px",
          height: "48px",
          background: "rgba(255,255,255,0.9)",
          border: "2px solid rgba(0,0,0,0.3)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {item.icon}
      </div>

      {/* Nome e descrição do item */}
      <div
        style={{
          background: "rgba(128,128,128,0.8)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: "normal",
          textAlign: "center",
          maxWidth: "140px",
          whiteSpace: "normal",
          lineHeight: "1.2",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{ fontWeight: "bold", marginBottom: "2px", fontSize: "12px" }}
        >
          {item.name}
        </div>
        <div>{item.description}</div>

        {/* Informações específicas da arma */}
        {weaponData && (
          <div style={{ marginTop: "4px", fontSize: "10px", opacity: 0.9 }}>
            <div>
              Munição: {weaponData.ammo}/{weaponData.maxAmmo}
            </div>
            <div>Dano: {weaponData.damage}</div>
            <div>Tipo: {weaponData.type}</div>
          </div>
        )}
      </div>

      {/* Quantidade (se maior que 1) */}
      {item.quantity > 1 && (
        <div
          style={{
            background: "rgba(255,87,34,0.9)",
            color: "white",
            fontSize: "10px",
            padding: "2px 6px",
            borderRadius: "4px",
            fontWeight: "bold",
            position: "absolute",
            top: "-4px",
            right: "-4px",
            minWidth: "16px",
            textAlign: "center",
          }}
        >
          {item.quantity}
        </div>
      )}
    </div>
  );
}
