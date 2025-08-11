import React from "react";
import type { GameState, InventoryItem } from "../../types/game";
import { formatScore } from "../../utils/gameUtils";

interface GameHUDProps {
  gameState: GameState;
  onInventoryItemClick?: (item: InventoryItem) => void;
  isReloading?: boolean;
  selectedSlot?: number;
}

export function GameHUD({
  gameState,
  onInventoryItemClick,
  isReloading = false,
  selectedSlot = 0,
}: GameHUDProps) {
  const {
    playerName,
    playerScore,
    playerHealth,
    playerMaxHealth,
    currentWeapon,
    inventory,
    otherPlayers,
    territories,
  } = gameState;

  const playerTerritories = territories.filter(
    (t) => t.ownerId === gameState.playerId
  ).length;

  return (
    <>
      {/* HUD Superior Esquerdo - Informações Gerais */}
      <div
        style={{
          position: "absolute",
          left: "12px",
          top: "12px",
          zIndex: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "12px",
          borderRadius: "8px",
          fontSize: "14px",
          minWidth: "200px",
        }}
      >
        <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
          Informações
        </div>
        <div>Jogador: {playerName}</div>
        <div>Pontuação: {formatScore(playerScore)}</div>
        <div>Jogadores online: {Object.keys(otherPlayers).length + 1}</div>
        <div>
          Territórios: {playerTerritories}/{territories.length}
        </div>
        <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.8 }}>
          <div>Use W/A/S/D para mover</div>
          <div>Clique para atirar</div>
          <div>Pressione R para recarregar</div>
          <div>Pressione Q para dropar item</div>
          <div>Fique nos círculos para capturar</div>
        </div>
      </div>

      {/* HUD Inferior Direito - Vida e Munição */}
      <div
        style={{
          position: "absolute",
          right: "12px",
          bottom: "12px",
          zIndex: 10,
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "16px",
          borderRadius: "8px",
          minWidth: "180px",
        }}
      >
        {/* Barra de Vida */}
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div style={{ marginBottom: "4px", fontSize: "12px", opacity: 0.8 }}>
            VIDA
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(playerHealth / playerMaxHealth) * 100}%`,
                height: "100%",
                background:
                  playerHealth > 50
                    ? "#4CAF50"
                    : playerHealth > 25
                    ? "#FF9800"
                    : "#F44336",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ fontSize: "12px", marginTop: "2px" }}>
            {playerHealth}/{playerMaxHealth}
          </div>
        </div>

        {/* Informações do Item Selecionado */}
        {(() => {
          const selectedItem = inventory[selectedSlot];
          if (!selectedItem) {
            return (
              <div
                style={{ fontSize: "12px", opacity: 0.6, fontStyle: "italic" }}
              >
                Slot vazio
              </div>
            );
          }

          return (
            <div>
              {/* Nome do Item */}
              <div
                style={{ marginBottom: "4px", fontSize: "12px", opacity: 0.8 }}
              >
                {selectedItem.name.toUpperCase()}
              </div>

              {/* Descrição do Item */}
              <div
                style={{ fontSize: "10px", opacity: 0.7, marginBottom: "8px" }}
              >
                {selectedItem.description}
              </div>

              {/* Informações específicas baseadas no tipo */}
              {selectedItem.type === "weapon" && (
                <>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                    {currentWeapon?.ammo || 0}/{currentWeapon?.maxAmmo || 0}
                  </div>
                  {isReloading && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#FF9800",
                        marginTop: "2px",
                      }}
                    >
                      Recarregando...
                    </div>
                  )}
                  {!isReloading && currentWeapon?.ammo === 0 && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#F44336",
                        marginTop: "2px",
                        fontWeight: "bold",
                      }}
                    >
                      Pressione R para recarregar
                    </div>
                  )}
                </>
              )}

              {selectedItem.type === "health" && (
                <div style={{ fontSize: "12px", color: "#4CAF50" }}>
                  Quantidade: {selectedItem.quantity}/{selectedItem.maxQuantity}
                </div>
              )}

              {selectedItem.type === "ammo" && (
                <div style={{ fontSize: "12px", color: "#FF9800" }}>
                  Munição: {selectedItem.quantity}/{selectedItem.maxQuantity}
                </div>
              )}

              {selectedItem.type === "powerup" && (
                <div style={{ fontSize: "12px", color: "#9C27B0" }}>
                  Power-ups: {selectedItem.quantity}/{selectedItem.maxQuantity}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Indicador de Slot Selecionado */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "80px",
          transform: "translateX(-50%)",
          zIndex: 10,
          background: "rgba(0,0,0,0.8)",
          color: "#FFD700",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: "bold",
          border: "2px solid #FFD700",
        }}
      >
        Slot {selectedSlot + 1} Selecionado
      </div>

      {/* Barra de Itens - Centro Inferior */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "12px",
          transform: "translateX(-50%)",
          zIndex: 10,
          background: "rgba(0,0,0,0.8)",
          padding: "8px",
          borderRadius: "8px",
          display: "flex",
          gap: "8px",
        }}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const item = inventory[index];
          const isSelected = index === selectedSlot;
          return (
            <div
              key={index}
              style={{
                width: "48px",
                height: "48px",
                background: isSelected
                  ? "rgba(255,215,0,0.3)" // Dourado para slot selecionado
                  : item
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.05)",
                border: isSelected
                  ? "3px solid #FFD700" // Borda dourada para slot selecionado
                  : item
                  ? "2px solid rgba(255,255,255,0.3)"
                  : "2px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: item ? "pointer" : "default",
                position: "relative",
                transition: "all 0.2s ease",
                transform: isSelected ? "scale(1.05)" : "scale(1)",
                boxShadow: isSelected ? "0 0 10px rgba(255,215,0,0.5)" : "none",
              }}
              onClick={() => item && onInventoryItemClick?.(item)}
              onMouseEnter={(e) => {
                if (item) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (item) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                }
              }}
            >
              {item ? (
                <>
                  <div
                    style={{
                      fontSize: "20px",
                      color: "white",
                    }}
                  >
                    {item.icon}
                  </div>
                  {item.quantity > 1 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "2px",
                        right: "2px",
                        background: "#FF5722",
                        color: "white",
                        fontSize: "10px",
                        padding: "1px 3px",
                        borderRadius: "2px",
                        minWidth: "16px",
                        textAlign: "center",
                      }}
                    >
                      {item.quantity}
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    fontSize: "12px",
                    color: isSelected ? "#FFD700" : "rgba(255,255,255,0.3)",
                    fontWeight: isSelected ? "bold" : "normal",
                  }}
                >
                  {index + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
