## Jogo 2D com OpenStreetMap (React + TypeScript + Vite)

### Setup

Instale dependências e rode o projeto:

```
npm install
npm run dev
```

**Não precisa de API key!** Usa OpenStreetMap (open-source).

### Como jogar

- Use W/A/S/D para mover o bloquinho azul.
- O mapa fica centralizado no jogador e se move conforme você anda.
- Se permitido, a posição inicial será sua geolocalização; caso contrário, começa em São Paulo.

### Observações

- Usa OpenLayers + OpenStreetMap (gratuito e open-source).
- A velocidade é medida em metros/segundo e convertida para delta de latitude/longitude.
- O mapa está com UI padrão desativada e interações do mouse/gestos bloqueadas para priorizar o controle via teclado.