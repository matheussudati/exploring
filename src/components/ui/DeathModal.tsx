import React from "react";

interface DeathModalProps {
  isVisible: boolean;
  onRespawn: () => void;
  onExit: () => void;
  respawnTime: number;
}

export function DeathModal({
  isVisible,
  onRespawn,
  onExit,
  respawnTime,
}: DeathModalProps) {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "rgba(20,20,20,0.95)",
          border: "2px solid #FF4444",
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          color: "white",
          maxWidth: "400px",
          width: "90%",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            marginBottom: "16px",
          }}
        >
          💀
        </div>

        <h2 style={{ margin: "0 0 16px 0", color: "#FF4444" }}>Você Morreu!</h2>

        <p style={{ margin: "0 0 24px 0", opacity: 0.8 }}>
          Você perdeu todos os seus itens e territórios.
        </p>

        {respawnTime > 0 ? (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{ fontSize: "14px", opacity: 0.7, marginBottom: "8px" }}
            >
              Renascendo em:
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#FF9800" }}
            >
              {Math.ceil(respawnTime / 1000)}s
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "14px", opacity: 0.7 }}>
              Pronto para renascer!
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={onRespawn}
            disabled={respawnTime > 0}
            style={{
              padding: "12px 24px",
              background: respawnTime > 0 ? "#666" : "#4CAF50",
              border: "none",
              borderRadius: "6px",
              color: "white",
              cursor: respawnTime > 0 ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (respawnTime === 0) {
                e.currentTarget.style.background = "#45a049";
              }
            }}
            onMouseLeave={(e) => {
              if (respawnTime === 0) {
                e.currentTarget.style.background = "#4CAF50";
              }
            }}
          >
            {respawnTime > 0 ? "Aguardando..." : "Renascer"}
          </button>

          <button
            onClick={onExit}
            style={{
              padding: "12px 24px",
              background: "#FF4444",
              border: "none",
              borderRadius: "6px",
              color: "white",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#d32f2f";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FF4444";
            }}
          >
            Sair do Jogo
          </button>
        </div>

        <div style={{ marginTop: "16px", fontSize: "12px", opacity: 0.6 }}>
          Dica: Você renascerá em uma posição aleatória no mapa
        </div>
      </div>
    </div>
  );
}
