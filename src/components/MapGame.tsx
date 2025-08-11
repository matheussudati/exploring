import React, { useEffect, useMemo, useRef, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import { io, Socket } from 'socket.io-client'
import LoginScreen from './LoginScreen'
import 'ol/ol.css'

type LatLng = { lat: number; lng: number }

interface Player {
  id: string
  name: string
  position: LatLng
  color: string
}

const MAP_ZOOM = 18
const PLAYER_SPEED_METERS_PER_SECOND = 120 // velocidade do "bloquinho"

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
}

const mapContainerStyle = { width: '100%', height: '100%' }

function metersToLatLngDelta(latDegrees: number, moveEastMeters: number, moveNorthMeters: number) {
  const metersPerDegreeLat = 111_320
  const metersPerDegreeLng = 111_320 * Math.cos((latDegrees * Math.PI) / 180)

  const deltaLat = moveNorthMeters / metersPerDegreeLat
  const deltaLng = metersPerDegreeLng === 0 ? 0 : moveEastMeters / metersPerDegreeLng

  return { deltaLat, deltaLng }
}

function PlayerComponent({ 
  name, 
  color, 
  isLocal = false 
}: { 
  name: string
  color: string
  isLocal?: boolean 
}): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          background: color,
          border: `2px solid ${isLocal ? 'white' : 'black'}`,
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          zIndex: isLocal ? 3 : 2,
        }}
      />
      <div
        style={{
          marginTop: 4,
          padding: '2px 6px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: 12,
          borderRadius: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>
    </div>
  )
}

function OtherPlayer({ 
  player, 
  currentCenter 
}: { 
  player: Player
  currentCenter: LatLng 
}): React.ReactElement | null {
  // Calcula a posição do outro jogador relativa ao centro atual
  const deltaLat = player.position.lat - currentCenter.lat
  const deltaLng = player.position.lng - currentCenter.lng

  // Converte diferença de coordenadas para pixels (aproximado)
  const metersPerDegreeLat = 111_320
  const metersPerDegreeLng = 111_320 * Math.cos((currentCenter.lat * Math.PI) / 180)
  
  const deltaMetersNorth = deltaLat * metersPerDegreeLat
  const deltaMetersEast = deltaLng * metersPerDegreeLng

  // No zoom 18, aproximadamente 0.6 metros por pixel
  const metersPerPixel = 0.6
  const pixelX = deltaMetersEast / metersPerPixel
  const pixelY = -deltaMetersNorth / metersPerPixel // Negativo porque Y cresce para baixo

  // Se o jogador estiver muito longe, não renderiza
  if (Math.abs(pixelX) > window.innerWidth || Math.abs(pixelY) > window.innerHeight) {
    return null
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${pixelX}px)`,
        top: `calc(50% + ${pixelY}px)`,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          background: player.color,
          border: '2px solid black',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      />
      <div
        style={{
          marginTop: 4,
          padding: '2px 6px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: 12,
          borderRadius: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {player.name}
      </div>
    </div>
  )
}

export default function MapGame(): React.ReactElement {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const socketRef = useRef<Socket | null>(null)
  
  const [isConnected, setIsConnected] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [playerColor, setPlayerColor] = useState('dodgerblue')
  const [otherPlayers, setOtherPlayers] = useState<Record<string, Player>>({})

  const fallbackStart: LatLng = useMemo(
    () => ({ lat: -23.55052, lng: -46.633308 }),
    []
  ) // São Paulo como fallback

  const [center, setCenter] = useState<LatLng>(fallbackStart)
  const pressedRef = useRef({ w: false, a: false, s: false, d: false })
  const lastTsRef = useRef<number | null>(null)
  const lastEmittedPosition = useRef<LatLng | null>(null)

  // Conecta ao servidor quando o usuário escolhe um nome
  const handleConnect = (name: string) => {
    setPlayerName(name)
    
    // Conecta ao servidor Socket.io
    const socket = io('http://localhost:3000')
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Conectado ao servidor')
      socket.emit('join', {
        name,
        position: center
      })
    })

    socket.on('currentPlayers', (players: Player[]) => {
      const playersObj: Record<string, Player> = {}
      players.forEach(player => {
        if (player.id !== socket.id) {
          playersObj[player.id] = player
        } else {
          setPlayerColor(player.color)
        }
      })
      setOtherPlayers(playersObj)
    })

    socket.on('playerJoined', (player: Player) => {
      setOtherPlayers(prev => ({
        ...prev,
        [player.id]: player
      }))
    })

    socket.on('playerMoved', ({ id, position }: { id: string; position: LatLng }) => {
      setOtherPlayers(prev => {
        const player = prev[id]
        if (player) {
          return {
            ...prev,
            [id]: { ...player, position }
          }
        }
        return prev
      })
    })

    socket.on('playerLeft', (id: string) => {
      setOtherPlayers(prev => {
        const { [id]: removed, ...rest } = prev
        return rest
      })
    })

    setIsConnected(true)
  }

  // Inicializa o mapa OpenLayers
  useEffect(() => {
    if (!mapRef.current || !isConnected) return

    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: fromLonLat([center.lng, center.lat]),
        zoom: MAP_ZOOM,
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      controls: [], // Remove controles padrão
      interactions: [], // Remove interações padrão (pan, zoom, etc)
    })

    mapInstanceRef.current = map

    return () => {
      map.setTarget(undefined)
      mapInstanceRef.current = null
    }
  }, [isConnected])

  // Atualiza centro do mapa quando center muda
  useEffect(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView()
      view.setCenter(fromLonLat([center.lng, center.lat]))

      // Emite a nova posição para o servidor se mudou significativamente
      if (socketRef.current && socketRef.current.connected) {
        const lastPos = lastEmittedPosition.current
        if (!lastPos || 
            Math.abs(lastPos.lat - center.lat) > 0.00001 || 
            Math.abs(lastPos.lng - center.lng) > 0.00001) {
          socketRef.current.emit('playerMove', center)
          lastEmittedPosition.current = center
        }
      }
    }
  }, [center])

  // Tenta usar geolocalização do navegador para posição inicial
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCenter({ lat: latitude, lng: longitude })
      },
      () => {
        // ignora erro, mantém fallback
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 5_000 }
    )
  }, [])

  // Controles de teclado WASD
  useEffect(() => {
    if (!isConnected) return

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        pressedRef.current[key as 'w' | 'a' | 's' | 'd'] = true
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        pressedRef.current[key as 'w' | 'a' | 's' | 'd'] = false
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [isConnected])

  // Loop de animação baseado em requestAnimationFrame
  useEffect(() => {
    if (!isConnected) return

    let rafId = 0
    const tick = (ts: number) => {
      const last = lastTsRef.current
      lastTsRef.current = ts
      const dt = last == null ? 0 : (ts - last) / 1000 // segundos

      const { w, a, s, d } = pressedRef.current
      if (dt > 0 && (w || a || s || d)) {
        const speed = PLAYER_SPEED_METERS_PER_SECOND
        let moveEast = 0
        let moveNorth = 0
        if (w) moveNorth += speed * dt
        if (s) moveNorth -= speed * dt
        if (d) moveEast += speed * dt
        if (a) moveEast -= speed * dt

        setCenter((prev) => {
          const { deltaLat, deltaLng } = metersToLatLngDelta(prev.lat, moveEast, moveNorth)
          return { lat: prev.lat + deltaLat, lng: prev.lng + deltaLng }
        })
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isConnected])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  if (!isConnected) {
    return <LoginScreen onConnect={handleConnect} />
  }

  return (
    <div style={containerStyle}>
      <div ref={mapRef} style={mapContainerStyle} />
      
      {/* Jogador local */}
      <PlayerComponent name={playerName} color={playerColor} isLocal={true} />
      
      {/* Outros jogadores */}
      {Object.values(otherPlayers).map(player => (
        <OtherPlayer key={player.id} player={player} currentCenter={center} />
      ))}
      
      {/* HUD */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          padding: '8px 10px',
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        <div>Use W/A/S/D para mover</div>
        <div>Jogador: {playerName}</div>
        <div>Posição: {center.lat.toFixed(6)}, {center.lng.toFixed(6)}</div>
        <div>Jogadores online: {Object.keys(otherPlayers).length + 1}</div>
      </div>
    </div>
  )
}