import React, { useState } from "react";
import type { MenuState } from "../../types/game";

interface GameMenuProps {
  menuState: MenuState;
  onMenuToggle: () => void;
  onTabChange: (tab: "settings" | "profile" | "chat" | null) => void;
}

export function GameMenu({
  menuState,
  onMenuToggle,
  onTabChange,
}: GameMenuProps) {
  const { isOpen, activeTab } = menuState;

  return (
    <>
      {/* Botão do Menu */}
      <div
        style={{
          position: "absolute",
          right: "12px",
          top: "12px",
          zIndex: 20,
        }}
      >
        <button
          onClick={onMenuToggle}
          style={{
            width: "48px",
            height: "48px",
            background: "rgba(0,0,0,0.8)",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontSize: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.8)";
          }}
        >
          ☰
        </button>
      </div>

      {/* Menu Expansível */}
      <div
        style={{
          position: "absolute",
          right: isOpen ? "0" : "-300px",
          top: "0",
          width: "300px",
          height: "100vh",
          background: "rgba(0,0,0,0.95)",
          color: "white",
          transition: "right 0.3s ease",
          zIndex: 15,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header do Menu */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px" }}>Menu do Jogo</h2>
          <button
            onClick={onMenuToggle}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs de Navegação */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {(["settings", "profile", "chat"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                flex: 1,
                padding: "12px",
                background:
                  activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === tab ? "bold" : "normal",
                transition: "all 0.2s ease",
              }}
            >
              {tab === "settings" && "⚙️ Configurações"}
              {tab === "profile" && "👤 Perfil"}
              {tab === "chat" && "💬 Chat"}
            </button>
          ))}
        </div>

        {/* Conteúdo das Tabs */}
        <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
          {activeTab === "settings" && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
                Configurações
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Volume Geral
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="80"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Sensibilidade do Mouse
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  defaultValue="5"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{ marginRight: "8px" }}
                  />
                  Mostrar FPS
                </label>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{ marginRight: "8px" }}
                  />
                  Efeitos Sonoros
                </label>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <input type="checkbox" style={{ marginRight: "8px" }} />
                  Modo Noturno
                </label>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
                Perfil do Jogador
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Nome do Jogador
                </label>
                <input
                  type="text"
                  defaultValue="Jogador"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Cor do Jogador
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"].map(
                    (color) => (
                      <div
                        key={color}
                        style={{
                          width: "32px",
                          height: "32px",
                          background: color,
                          borderRadius: "4px",
                          cursor: "pointer",
                          border: "2px solid rgba(255,255,255,0.3)",
                        }}
                      />
                    )
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ marginBottom: "8px" }}>Estatísticas</h4>
                <div style={{ fontSize: "14px", opacity: 0.8 }}>
                  <div>Jogos Jogados: 0</div>
                  <div>Vitórias: 0</div>
                  <div>Tempo de Jogo: 00:00</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
                Chat do Jogo
              </h3>

              <div
                style={{
                  height: "200px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "4px",
                  padding: "12px",
                  marginBottom: "16px",
                  overflowY: "auto",
                  fontSize: "14px",
                }}
              >
                <div style={{ opacity: 0.6, marginBottom: "8px" }}>
                  [Sistema] Bem-vindo ao jogo!
                </div>
                <div style={{ opacity: 0.6, marginBottom: "8px" }}>
                  [Sistema] Use o chat para se comunicar com outros jogadores
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                />
                <button
                  style={{
                    padding: "8px 16px",
                    background: "#4CAF50",
                    border: "none",
                    borderRadius: "4px",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
