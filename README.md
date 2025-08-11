# 🎮 Jogo Multiplayer de Captura de Territórios

Um jogo multiplayer em tempo real onde jogadores competem para capturar territórios em um mapa real usando OpenStreetMap. Desenvolvido com React, TypeScript, Socket.IO e OpenLayers.

## 🎯 Sobre o Jogo

### Objetivo

- Capture territórios espalhados pelo mapa para ganhar pontos
- Elimine outros jogadores para aumentar sua pontuação
- Seja o jogador com mais pontos para vencer!

### Funcionalidades

- **Multiplayer em tempo real** - Jogue com outros jogadores simultaneamente
- **Mapa real** - Baseado em OpenStreetMap com geolocalização
- **Sistema de pontuação** - Ganhe pontos capturando territórios e eliminando jogadores
- **Territórios capturáveis** - Áreas específicas que podem ser conquistadas
- **Interface responsiva** - Funciona em diferentes dispositivos

### Como Jogar

1. **Movimento**: Use as teclas W/A/S/D para mover seu personagem
2. **Captura de Territórios**: Aproxime-se dos territórios coloridos para capturá-los
3. **Eliminação**: Ataque outros jogadores para ganhar pontos
4. **Pontuação**:
   - +50 pontos por território capturado
   - +10 pontos por jogador eliminado
   - -5 pontos quando você é atingido
   - -20 pontos quando perde um território

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js 18.18.0 ou superior
- npm ou yarn

### Instalação

1. **Clone o repositório**

```bash
git clone <url-do-repositorio>
cd exploring
```

2. **Instale as dependências**

```bash
npm install
```

### Executando o Projeto

#### Opção 1: Executar tudo de uma vez

```bash
npm start
```

Este comando inicia tanto o servidor quanto o cliente simultaneamente.

#### Opção 2: Executar separadamente

**Terminal 1 - Servidor (Porta 3000)**

```bash
npm run server
```

**Terminal 2 - Cliente (Porta 5173)**

```bash
npm run dev
```

### Acessando o Jogo

1. Abra seu navegador
2. Acesse: `http://localhost:5173`
3. Digite seu nome de jogador
4. Clique em "Entrar no Jogo"
5. Comece a jogar!

## 🛠️ Tecnologias Utilizadas

### Frontend

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **OpenLayers** - Biblioteca de mapas
- **Socket.IO Client** - Comunicação em tempo real

### Backend

- **Node.js** - Runtime JavaScript
- **Socket.IO** - Servidor WebSocket
- **HTTP Server** - Servidor HTTP básico

### Mapas

- **OpenStreetMap** - Dados de mapas (gratuito e open-source)
- **Geolocalização** - Posicionamento inicial do jogador

## 📁 Estrutura do Projeto

```
exploring/
├── src/
│   ├── components/
│   │   ├── game/          # Componentes do jogo
│   │   │   ├── Player.tsx
│   │   │   └── OtherPlayer.tsx
│   │   ├── ui/            # Interface do usuário
│   │   │   ├── GameHUD.tsx
│   │   │   ├── GameMenu.tsx
│   │   │   └── DeathModal.tsx
│   │   ├── LoginScreen.tsx
│   │   └── MapGame.tsx
│   ├── hooks/             # Hooks customizados
│   │   ├── useGameLoop.ts
│   │   └── useSocketConnection.ts
│   ├── types/             # Definições de tipos
│   ├── constants/         # Constantes do jogo
│   └── utils/             # Utilitários
├── server.js              # Servidor Socket.IO
├── package.json
└── README.md
```

## 🔧 Scripts Disponíveis

- `npm start` - Inicia servidor e cliente simultaneamente
- `npm run dev` - Inicia apenas o cliente (Vite)
- `npm run server` - Inicia apenas o servidor
- `npm run build` - Build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## 🌐 Configuração de Rede

O servidor está configurado para aceitar conexões de:

- `http://localhost:5173` (Vite dev server)
- `http://localhost:5174` (Vite preview)
- `http://localhost:5175` (Porta alternativa)
- `http://localhost:5176` (Porta alternativa)

Para jogar em rede local, certifique-se de que ambos os dispositivos estão na mesma rede e use o IP local do servidor.

## 🐛 Solução de Problemas

### Erro de Conexão

Se você ver `ERR_CONNECTION_REFUSED`, certifique-se de que:

1. O servidor está rodando na porta 3000
2. Não há firewall bloqueando a conexão
3. O Node.js está na versão 18.18.0 ou superior

### Problemas de Geolocalização

- O navegador pode solicitar permissão para usar sua localização
- Se negado, o jogo começará em São Paulo, Brasil
- Certifique-se de que o HTTPS está habilitado para geolocalização em produção

## 📝 Licença

Este projeto usa OpenStreetMap que é licenciado sob Open Database License (ODbL).

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:

- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests

---

**Divirta-se jogando! 🎮**
