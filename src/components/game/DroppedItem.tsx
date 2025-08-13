import React, { useMemo, useRef } from "react";
import type { InventoryItem, Weapon } from "../../types/game";
import { latLngToMeters, calculateDistance } from "../../utils/gameUtils";

interface DroppedItemProps {
  itemId: string; // ID único do item dropado
  item: InventoryItem;
  position: { lat: number; lng: number };
  currentCenter: { lat: number; lng: number };
  weaponData?: Weapon; // Dados específicos da arma
  onCollect?: (itemId: string) => void; // Callback para coletar item
}

export function DroppedItem({
  itemId,
  item,
  position,
  currentCenter,
  weaponData,
  onCollect,
}: DroppedItemProps) {
  // Cache para estabilizar a posição
  const stablePositionRef = useRef<{ pixelX: number; pixelY: number } | null>(null);
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  // Calcula a posição do item relativa ao centro atual
  const deltaLat = position.lat - currentCenter.lat;
  const deltaLng = position.lng - currentCenter.lng;

  const { metersNorth, metersEast } = latLngToMeters(
    currentCenter.lat,
    deltaLat,
    deltaLng
  );

  // No zoom 18, aproximadamente 0.6 metros por pixel
  const metersPerPixel = 0.6;
  
  // Calcula posição em pixels
  const rawPixelX = metersEast / metersPerPixel;
  const rawPixelY = -metersNorth / metersPerPixel; // Negativo porque Y cresce para baixo

  // Sistema de estabilização: apenas atualiza posição se houve mudança significativa
  let pixelX, pixelY;
  
  const hasSignificantChange = !lastCenterRef.current || 
    Math.abs(currentCenter.lat - lastCenterRef.current.lat) > 0.000005 || 
    Math.abs(currentCenter.lng - lastCenterRef.current.lng) > 0.000005;

  if (hasSignificantChange || !stablePositionRef.current) {
    // Houve mudança significativa, recalcula e arredonda para estabilidade
    pixelX = Math.round(rawPixelX * 2) / 2; // Arredonda para 0.5 pixels
    pixelY = Math.round(rawPixelY * 2) / 2; // Arredonda para 0.5 pixels
    
    // Atualiza o cache
    stablePositionRef.current = { pixelX, pixelY };
    lastCenterRef.current = { lat: currentCenter.lat, lng: currentCenter.lng };
  } else {
    // Usa posição estável do cache
    pixelX = stablePositionRef.current.pixelX;
    pixelY = stablePositionRef.current.pixelY;
  }

  // Calcula distância do jogador para o item
  const distanceToPlayer = calculateDistance(currentCenter, position);
  const isNearby = distanceToPlayer <= 20; // 20 metros de raio

  // Se o item estiver muito longe, não renderiza
  if (
    Math.abs(pixelX) > window.innerWidth ||
    Math.abs(pixelY) > window.innerHeight
  ) {
    return null;
  }

  return (
    <>
      {/* Estilos CSS para animação */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
      
      <div
        style={{
          position: "absolute",
          left: `calc(50% + ${pixelX}px)`,
          top: `calc(50% + ${pixelY}px)`,
          transform: "translate(-50%, -50%)",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          pointerEvents: "none",
          // Destaque visual quando próximo
          filter: isNearby ? "brightness(1.2) drop-shadow(0 0 8px rgba(255,213,79,0.6))" : "none",
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

        {/* Indicador de proximidade para coleta */}
        {isNearby && (
          <div style={{ 
            marginTop: "6px", 
            fontSize: "12px", 
            fontWeight: "bold",
            color: "#FFD54F",
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            animation: "pulse 1s infinite"
          }}>
            Pressione [E] para coletar
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
    </>
  );
}
