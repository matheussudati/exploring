import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import LoginScreen from "./LoginScreen";
import { Player } from "./game/Player";
import { OtherPlayer } from "./game/OtherPlayer";
import { GameHUD } from "./ui/GameHUD";
import { GameMenu } from "./ui/GameMenu";
import { DeathModal } from "./ui/DeathModal";
import { Projectile as ProjectileDot } from "./game/Projectile";
import { DroppedItem as DroppedItemComponent } from "./game/DroppedItem";
import { useGameLoop } from "../hooks/useGameLoop";
import { useSocketConnection } from "../hooks/useSocketConnection";
import type {
  GameState,
  MenuState,
  Player as PlayerType,
  Projectile,
  Territory,
  HitEffect,
  InventoryItem,
  DroppedItem,
} from "../types/game";
import {
  MAP_ZOOM,
  PLAYER_MAX_HEALTH,
  PLAYER_RESPAWN_TIME_MS,
  TERRITORY_RADIUS_METERS,
  TERRITORY_CAPTURE_TIME_MS,
  FALLBACK_START_POSITION,
  TERRITORY_COLORS,
  WEAPONS,
  PROJECTILE_SPEED_METERS_PER_SECOND,
} from "../constants/game";
import { generateRandomPosition, calculateDistance, screenToGeographic } from "../utils/gameUtils";
import "ol/ol.css";

const containerStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
  zIndex: 1,
};

const mapContainerStyle = { width: "100%", height: "100%" };

export default function MapGame(): React.ReactElement {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  // Estado do jogo
  const [gameState, setGameState] = useState<GameState>({
    isConnected: false,
    playerName: "",
    playerColor: "dodgerblue",
    playerId: "",
    playerHealth: PLAYER_MAX_HEALTH,
    playerMaxHealth: PLAYER_MAX_HEALTH,
    isAlive: true,
    center: FALLBACK_START_POSITION,
    otherPlayers: {},
    projectiles: [],
    territories: [],
    hitEffects: [],
    droppedItems: [],
    inventory: [
      {
        id: "pistol_1",
        name: "Pistola",
        type: "weapon",
        icon: "🔫",
        quantity: 1,
        maxQuantity: 1,
        description: "Arma básica de fogo com 5 tiros por pente",
      },
    ],
    currentWeapon: {
      ...WEAPONS.pistol,
      ammo: WEAPONS.pistol.maxAmmo,
      lastShot: 0,
    },
    mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  });

  // Estado do menu
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    activeTab: null,
  });

  // Estado de morte
  const [deathState, setDeathState] = useState({
    isDead: false,
    respawnTime: 0,
  });

  // Estado de recarga da arma
  const [isReloadingWeapon, setIsReloadingWeapon] = useState(false);
  const reloadTimeoutRef = useRef<number | null>(null);

  // Estado do slot selecionado no inventário
  const [selectedSlot, setSelectedSlot] = useState(0); // 0-4 para slots 1-5

  // Estado de notificação de inventário cheio
  const [inventoryFullNotification, setInventoryFullNotification] = useState(false);

  const pressedKeys = useRef({ w: false, a: false, s: false, d: false });
  const lastEmittedPosition = useRef<{ lat: number; lng: number } | null>(null);

  // Inicializa territórios
  useEffect(() => {
    const initialTerritories: Territory[] = [
      {
        id: "territory_1",
        position: {
          lat: gameState.center.lat + 0.0001,
          lng: gameState.center.lng + 0.0001,
        },
        radius: TERRITORY_RADIUS_METERS,
        ownerId: null,
        captureProgress: 0,
        color: TERRITORY_COLORS[0],
        captureTime: TERRITORY_CAPTURE_TIME_MS,
      },
      {
        id: "territory_2",
        position: {
          lat: gameState.center.lat - 0.0001,
          lng: gameState.center.lng - 0.0001,
        },
        radius: TERRITORY_RADIUS_METERS,
        ownerId: null,
        captureProgress: 0,
        color: TERRITORY_COLORS[1],
        captureTime: TERRITORY_CAPTURE_TIME_MS,
      },
      {
        id: "territory_3",
        position: {
          lat: gameState.center.lat + 0.0001,
          lng: gameState.center.lng - 0.0001,
        },
        radius: TERRITORY_RADIUS_METERS,
        ownerId: null,
        captureProgress: 0,
        color: TERRITORY_COLORS[2],
        captureTime: TERRITORY_CAPTURE_TIME_MS,
      },
    ];
    setGameState((prev) => ({ ...prev, territories: initialTerritories }));
  }, [gameState.center.lat, gameState.center.lng]);

  // Socket connection
  const {
    handleConnect,
    emitPlayerMove,
    emitPlayerHit,
    emitTerritoryCaptured,
  } = useSocketConnection({
    gameState,
    setGameState,
    onConnect: (name: string) => {
      console.log(`Conectado como ${name}`);
    },
  });

  // Game loop
  useGameLoop({
    gameState,
    setGameState,
    pressedKeys,
    onPlayerMove: emitPlayerMove,
    onProjectileHit: emitPlayerHit,
  });

  // Inicializa o mapa OpenLayers
  useEffect(() => {
    if (!mapRef.current || !gameState.isConnected) return;

    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: fromLonLat([gameState.center.lng, gameState.center.lat]),
        zoom: MAP_ZOOM,
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      controls: [],
      interactions: [],
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [gameState.isConnected]);

  // Atualiza centro do mapa
  useEffect(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      view.setCenter(fromLonLat([gameState.center.lng, gameState.center.lat]));
    }
  }, [gameState.center]);

  // Geolocalização
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGameState((prev) => ({
          ...prev,
          center: { lat: latitude, lng: longitude },
        }));
      },
      () => {
        // Mantém fallback
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 5_000 }
    );
  }, []);

  // Função de recarga instantânea para teste
  const handleInstantReload = useCallback(() => {
    console.log("⚡ Recarga instantânea!");
    const weapon = gameState.currentWeapon;
    if (weapon && gameState.isAlive && weapon.ammo < weapon.maxAmmo) {
      setGameState((prev) => ({
        ...prev,
        currentWeapon: {
          ...prev.currentWeapon!,
          ammo: prev.currentWeapon!.maxAmmo,
        },
      }));
      console.log("✅ Recarga instantânea concluída!");
    }
  }, [gameState.currentWeapon, gameState.isAlive]);

  // Função de drop de item
  const handleDropItem = useCallback((dropPosition?: { x: number; y: number }) => {
    console.log("🎯 Tentativa de drop");
    console.log("🔍 Estado atual:", {
      isAlive: gameState.isAlive,
      inventory: gameState.inventory,
      selectedSlot,
      inventoryLength: gameState.inventory?.length,
      dropPosition,
      hasCurrentWeapon: !!gameState.currentWeapon,
    });

    if (!gameState.isAlive) {
      console.log("❌ Jogador morto, não pode dropar itens!");
      return;
    }

    // Se não tem posição de drop (tecla Q), sempre dropa a arma atual
    let itemToDrop;
    let weaponData;
    let isCurrentWeapon = false;

    if (!dropPosition) {
      // Tecla Q pressionada - dropa a arma atual
      if (!gameState.currentWeapon) {
        console.log("❌ Nenhuma arma equipada para dropar!");
        return;
      }
      
      // Encontra a arma no inventário
      const weaponInInventory = gameState.inventory.find(item => item.type === "weapon");
      if (!weaponInInventory) {
        console.log("❌ Arma atual não encontrada no inventário!");
        return;
      }
      
      itemToDrop = weaponInInventory;
      weaponData = gameState.currentWeapon;
      isCurrentWeapon = true;
      console.log("🔫 Dropando arma atual:", itemToDrop.name);
    } else {
      // Shift+click - dropa o item do slot selecionado
      if (selectedSlot < 0 || selectedSlot >= 5) {
        console.log("❌ Slot inválido selecionado!");
        return;
      }

      const selectedItem = getSelectedItem();
      if (!selectedItem) {
        console.log(`❌ Slot ${selectedSlot + 1} não tem item para dropar!`);
        return;
      }
      
      itemToDrop = selectedItem;
      weaponData = selectedItem.type === "weapon" ? gameState.currentWeapon : undefined;
      console.log(`📦 Dropando item do slot ${selectedSlot + 1}:`, itemToDrop.name);
    }

    // Validação do inventário
    if (!gameState.inventory || gameState.inventory.length === 0) {
      console.log("❌ Inventário vazio!");
      return;
    }

    // Log dos dados da arma se for uma arma
    if (itemToDrop.type === "weapon") {
      console.log("🔫 Dados da arma sendo dropada:", {
        currentWeapon: gameState.currentWeapon,
        ammo: gameState.currentWeapon?.ammo,
        maxAmmo: gameState.currentWeapon?.maxAmmo,
        type: gameState.currentWeapon?.type,
      });
    }

    // Validação final: confirma que estamos dropando o item correto
    console.log("✅ Validação final:", {
      itemParaDropar: itemToDrop.name,
      itemId: itemToDrop.id,
      isCurrentWeapon,
    });

    // Remove o item do inventário e cria o drop na posição EXATA E ATUAL do jogador
    setGameState((prev) => {
      // CAPTURA A POSIÇÃO ATUAL DO JOGADOR NO MOMENTO EXATO DO DROP
      const currentPlayerPosition = {
        lat: prev.center.lat,
        lng: prev.center.lng,
      };
      
      console.log("📍 Drop na posição EXATA do jogador:", {
        lat: currentPlayerPosition.lat.toFixed(8),
        lng: currentPlayerPosition.lng.toFixed(8),
        dropType: dropPosition ? "Shift+Clique" : "Tecla Q"
      });

      // Cria o item dropado na posição exata do jogador
      const droppedItem: DroppedItem = {
        id: `dropped_${Date.now()}_${Math.random()}`,
        item: { ...itemToDrop },
        position: currentPlayerPosition, // Usa a posição atual capturada dentro do setState
        timestamp: Date.now(),
        // Se for uma arma, inclui os dados específicos da arma
        weaponData: weaponData || undefined,
      };

      console.log("✅ Item criado com posição:", {
        itemId: droppedItem.id,
        itemName: droppedItem.item.name,
        savedPosition: {
          lat: droppedItem.position.lat.toFixed(8),
          lng: droppedItem.position.lng.toFixed(8)
        },
        jogadorAtual: {
          lat: prev.center.lat.toFixed(8),
          lng: prev.center.lng.toFixed(8)
        }
      });

      // Cria uma cópia do inventário
      const newInventory = [...prev.inventory];
      let newCurrentWeapon = prev.currentWeapon;

      if (isCurrentWeapon) {
        // Se está dropando a arma atual (tecla Q)
        const weaponIndex = newInventory.findIndex(item => item.type === "weapon");
        if (weaponIndex !== -1) {
          newInventory.splice(weaponIndex, 1);
          newCurrentWeapon = null; // Remove a arma atual
          
          console.log("🔍 Debug - Arma atual removida:", {
            removedItem: itemToDrop.name,
            newInventoryLength: newInventory.length,
            droppedItemsCount: prev.droppedItems.length + 1,
          });
        } else {
          console.log("❌ Erro: Arma não encontrada no inventário!");
          return prev;
        }
      } else {
        // Se está dropando um item do slot selecionado (Shift+click)
        if (selectedSlot < newInventory.length && newInventory[selectedSlot]) {
          const removedItem = newInventory[selectedSlot];
          newInventory.splice(selectedSlot, 1);

          // Se o item removido era uma arma, remove também a currentWeapon
          if (removedItem.type === "weapon") {
            newCurrentWeapon = null;
          }

          console.log("🔍 Debug - Item do slot removido:", {
            removedItem: removedItem.name,
            slot: selectedSlot + 1,
            newInventoryLength: newInventory.length,
            droppedItemsCount: prev.droppedItems.length + 1,
          });
        } else {
          console.log("❌ Erro: Item não encontrado no slot para remoção!");
          return prev; // Retorna o estado anterior sem mudanças
        }
      }

      return {
        ...prev,
        inventory: newInventory,
        currentWeapon: newCurrentWeapon,
        droppedItems: [...prev.droppedItems, droppedItem],
      };
    });

    console.log(`✅ Item ${itemToDrop.name} dropado com sucesso!`);
  }, [gameState.isAlive, gameState.inventory, gameState.center, selectedSlot, gameState.currentWeapon]);

  // Função para coletar item dropado
  const handleCollectItem = useCallback((itemId: string) => {
    console.log(`🎯 Tentativa de coleta do item: ${itemId}`);
    
    // Encontra o item dropado
    const droppedItem = gameState.droppedItems.find(item => item.id === itemId);
    if (!droppedItem) {
      console.log("❌ Item não encontrado!");
      return;
    }

    // Calcula distância para verificar se está próximo
    const distance = calculateDistance(gameState.center, droppedItem.position);
    if (distance > 20) {
      console.log(`❌ Muito longe para coletar! Distância: ${distance.toFixed(1)}m`);
      return;
    }

    // Verifica se há slot disponível no inventário (máximo 5 slots)
    if (gameState.inventory.length >= 5) {
      console.log("❌ Inventário cheio!");
      setInventoryFullNotification(true);
      setTimeout(() => setInventoryFullNotification(false), 3000); // Remove após 3 segundos
      return;
    }

    console.log(`✅ Coletando item: ${droppedItem.item.name}`);

    // Adiciona item ao inventário e remove da lista de itens dropados
    setGameState((prev) => {
      const newInventory = [...prev.inventory, droppedItem.item];
      const newDroppedItems = prev.droppedItems.filter(item => item.id !== itemId);
      
      // Se o item coletado for uma arma e não há arma atual, equipa ela
      let newCurrentWeapon = prev.currentWeapon;
      if (droppedItem.item.type === "weapon" && !prev.currentWeapon && droppedItem.weaponData) {
        newCurrentWeapon = droppedItem.weaponData;
      }

      console.log("📦 Item adicionado ao inventário:", {
        itemName: droppedItem.item.name,
        newInventorySize: newInventory.length,
        remainingDroppedItems: newDroppedItems.length,
      });

      return {
        ...prev,
        inventory: newInventory,
        currentWeapon: newCurrentWeapon,
        droppedItems: newDroppedItems,
      };
    });
  }, [gameState.droppedItems, gameState.center, gameState.inventory]);

  // Função para coletar o item mais próximo quando pressionar E
  const handleCollectNearestItem = useCallback(() => {
    if (!gameState.isAlive) {
      console.log("❌ Jogador morto, não pode coletar itens!");
      return;
    }

    // Encontra todos os itens dentro do raio de 20 metros
    const nearbyItems = gameState.droppedItems
      .map(item => ({
        ...item,
        distance: calculateDistance(gameState.center, item.position)
      }))
      .filter(item => item.distance <= 20)
      .sort((a, b) => a.distance - b.distance); // Ordena por distância

    if (nearbyItems.length === 0) {
      console.log("❌ Nenhum item próximo para coletar!");
      return;
    }

    // Coleta o item mais próximo
    const nearestItem = nearbyItems[0];
    console.log(`🎯 Coletando item mais próximo: ${nearestItem.item.name} (${nearestItem.distance.toFixed(1)}m)`);
    handleCollectItem(nearestItem.id);
  }, [gameState.droppedItems, gameState.center, gameState.isAlive, handleCollectItem]);

  // Controles de teclado
  useEffect(() => {
    if (!gameState.isConnected) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "a" || key === "s" || key === "d") {
        pressedKeys.current[key as "w" | "a" | "s" | "d"] = true;
        e.preventDefault();
      } else if (key === "r") {
        // Recarga manual da arma - apenas quando zerada
        console.log("🔧 Tecla R pressionada - tentando recarregar");
        const weapon = gameState.currentWeapon;
        console.log("🔍 Estado da arma:", {
          weapon: weapon,
          isAlive: gameState.isAlive,
          isReloading: isReloadingWeapon,
          ammo: weapon?.ammo,
          maxAmmo: weapon?.maxAmmo,
          canReload:
            weapon &&
            gameState.isAlive &&
            !isReloadingWeapon &&
            weapon.ammo === 0,
        });

        if (
          weapon &&
          gameState.isAlive &&
          !isReloadingWeapon &&
          weapon.ammo === 0
        ) {
          console.log("🔫 Iniciando recarga via teclado (arma zerada)");
          setIsReloadingWeapon(true);

          if (reloadTimeoutRef.current) {
            clearTimeout(reloadTimeoutRef.current);
          }

          reloadTimeoutRef.current = window.setTimeout(() => {
            console.log("⏰ Timeout de recarga executado!");
            setGameState((prev) => {
              const newState = {
                ...prev,
                currentWeapon: prev.currentWeapon
                  ? { ...prev.currentWeapon, ammo: prev.currentWeapon.maxAmmo }
                  : prev.currentWeapon,
              };
              console.log("🔄 Estado atualizado:", newState.currentWeapon);
              return newState;
            });
            setIsReloadingWeapon(false);
            reloadTimeoutRef.current = null;
            console.log("✅ Recarga via teclado concluída!");
          }, weapon.reloadTime);
        } else {
          console.log("❌ Não foi possível recarregar:", {
            hasWeapon: !!weapon,
            isAlive: gameState.isAlive,
            isReloading: isReloadingWeapon,
            ammo: weapon?.ammo,
            maxAmmo: weapon?.maxAmmo,
            isZero: weapon ? weapon.ammo === 0 : false,
          });
        }
        e.preventDefault();
      } else if (key === "t") {
        // Recarga instantânea para teste
        console.log("⚡ Tecla T pressionada - recarga instantânea");
        handleInstantReload();
        e.preventDefault();
      } else if (key === "q") {
        // Drop do item selecionado
        console.log("📦 Tecla Q pressionada - tentando dropar item");
        handleDropItem();
        e.preventDefault();
      } else if (key === "e") {
        // Coletar item próximo
        console.log("🎯 Tecla E pressionada - tentando coletar item");
        handleCollectNearestItem();
        e.preventDefault();
      } else if (key >= "1" && key <= "5") {
        // Seleção de slots do inventário (1-5)
        const slotIndex = parseInt(key) - 1; // Converte 1-5 para 0-4
        console.log(`🎒 Selecionando slot ${key} (índice ${slotIndex})`);
        setSelectedSlot(slotIndex);
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "a" || key === "s" || key === "d") {
        pressedKeys.current[key as "w" | "a" | "s" | "d"] = false;
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    gameState.isConnected,
    gameState.currentWeapon,
    gameState.isAlive,
    isReloadingWeapon,
    handleCollectNearestItem,
    handleInstantReload,
    handleDropItem,
  ]);

  // Inicializa a posição do mouse no centro da tela
  useEffect(() => {
    setGameState((prev) => ({
      ...prev,
      mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    }));
  }, []);

  // Rastreia posição do mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Atualiza a posição do mouse de forma mais responsiva
      setGameState((prev) => ({
        ...prev,
        mousePosition: { x: e.clientX, y: e.clientY },
      }));
    };

    // Adiciona listener para mousemove com throttling para melhor performance
    let ticking = false;
    const throttledMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleMouseMove(e);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("mousemove", throttledMouseMove);
    return () => window.removeEventListener("mousemove", throttledMouseMove);
  }, []);

  // Scroll do mouse para navegar entre slots
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        // Scroll para baixo - próximo slot
        setSelectedSlot((prev) => (prev + 1) % 5);
      } else {
        // Scroll para cima - slot anterior
        setSelectedSlot((prev) => (prev - 1 + 5) % 5);
      }
      e.preventDefault();
    };

    window.addEventListener("wheel", handleWheel);
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Sistema de captura de território
  useEffect(() => {
    const captureInterval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        territories: prev.territories.map((territory) => {
          const distance = calculateDistance(prev.center, territory.position);

          if (distance <= territory.radius) {
            if (territory.ownerId !== prev.playerId) {
              const newProgress = Math.min(
                100,
                territory.captureProgress + 100 / (territory.captureTime / 100)
              );

              if (newProgress >= 100 && territory.ownerId !== prev.playerId) {
                emitTerritoryCaptured(territory.id, prev.playerId);
              }

              return { ...territory, captureProgress: newProgress };
            }
          } else {
            if (territory.ownerId !== prev.playerId) {
              return {
                ...territory,
                captureProgress: Math.max(0, territory.captureProgress - 2),
              };
            }
          }

          return territory;
        }),
      }));
    }, 100);

    return () => clearInterval(captureInterval);
  }, [gameState.center, gameState.playerId]);

  // Monitora mudanças no estado de recarga e arma
  useEffect(() => {
    console.log("🔍 Estado da arma mudou:", {
      weapon: gameState.currentWeapon,
      isReloading: isReloadingWeapon,
      ammo: gameState.currentWeapon?.ammo,
      maxAmmo: gameState.currentWeapon?.maxAmmo,
    });

    // Limpa o estado de recarga quando a munição é reposta
    if (
      gameState.currentWeapon &&
      gameState.currentWeapon.ammo > 0 &&
      isReloadingWeapon
    ) {
      console.log("🔄 Limpando estado de recarga - munição reposta");
      setIsReloadingWeapon(false);
    }
  }, [
    gameState.currentWeapon?.ammo,
    isReloadingWeapon,
    gameState.currentWeapon,
  ]);

  // Limpa timeout de recarga quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
    };
  }, []);

  // Função de recarga manual
  const handleManualReload = () => {
    console.log("🔧 Tentativa de recarga manual...");
    console.log("🔧 Estado atual:", {
      weapon: gameState.currentWeapon,
      isAlive: gameState.isAlive,
      isReloadingWeapon,
      ammo: gameState.currentWeapon?.ammo,
      maxAmmo: gameState.currentWeapon?.maxAmmo,
    });

    const weapon = gameState.currentWeapon;
    if (!weapon) {
      console.log("❌ Nenhuma arma equipada!");
      return;
    }

    if (!gameState.isAlive) {
      console.log("❌ Jogador morto, não pode recarregar!");
      return;
    }

    if (isReloadingWeapon) {
      console.log("❌ Já está recarregando!");
      return;
    }

    // Permite recarga se a arma não estiver cheia
    if (weapon.ammo < weapon.maxAmmo) {
      console.log(
        `🔫 Iniciando recarga: ${weapon.ammo}/${weapon.maxAmmo} -> ${weapon.maxAmmo}/${weapon.maxAmmo}`
      );

      // Marca como recarregando
      setIsReloadingWeapon(true);

      // Limpa qualquer timeout existente
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
        console.log("🧹 Timeout anterior limpo");
      }

      // Inicia a recarga com timeout
      reloadTimeoutRef.current = window.setTimeout(() => {
        console.log("⏰ Timeout de recarga executado!");

        // Atualiza o estado da arma
        setGameState((prev) => {
          if (!prev.currentWeapon) {
            console.log("⚠️ Arma não existe mais, cancelando recarga");
            return prev;
          }

          const newState = {
            ...prev,
            currentWeapon: {
              ...prev.currentWeapon,
              ammo: prev.currentWeapon.maxAmmo,
            },
          };
          console.log("🔄 Estado atualizado:", newState.currentWeapon);
          return newState;
        });

        // Limpa o estado de recarga
        setIsReloadingWeapon(false);
        reloadTimeoutRef.current = null;

        console.log("✅ Recarga concluída!");
      }, weapon.reloadTime);

      console.log(`⏱️ Recarga programada para ${weapon.reloadTime}ms`);
    } else {
      console.log("⚠️ Arma já está cheia!");
    }
  };

  // Sistema de morte e respawn
  useEffect(() => {
    if (!gameState.isAlive && !deathState.isDead) {
      console.log("💀 Jogador morreu - limpando arma e estado de recarga");
      setDeathState({ isDead: true, respawnTime: PLAYER_RESPAWN_TIME_MS });

      // Limpa inventário e territórios
      setGameState((prev) => ({
        ...prev,
        inventory: [],
        currentWeapon: null,
        territories: prev.territories.map((t) =>
          t.ownerId === prev.playerId
            ? { ...t, ownerId: null, captureProgress: 0 }
            : t
        ),
      }));

      // Limpa o estado de recarga na morte
      setIsReloadingWeapon(false);
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
    }
  }, [gameState.isAlive, deathState.isDead]);

  // Timer de respawn
  useEffect(() => {
    if (deathState.isDead && deathState.respawnTime > 0) {
      const timer = setTimeout(() => {
        setDeathState((prev) => ({ ...prev, respawnTime: 0 }));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [deathState.isDead, deathState.respawnTime]);

  // Remove efeitos visuais antigos e itens dropados expirados
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        hitEffects: prev.hitEffects.filter(
          (effect) => Date.now() - effect.timestamp < 1000
        ),
        droppedItems: prev.droppedItems.filter(
          (item) => Date.now() - item.timestamp < 60000 // 1 minuto = 60000ms
        ),
      }));
    }, 100);
    return () => clearInterval(cleanupInterval);
  }, []);

  // Sistema de drop com clique
  useEffect(() => {
    if (!gameState.isConnected) return;

    const handleClickDrop = (e: MouseEvent) => {
      // Verifica se Shift está pressionado
      if (e.shiftKey) {
        console.log("🖱️ Shift+clique detectado para drop");
        console.log("📍 Coordenadas do clique:", { x: e.clientX, y: e.clientY });
        console.log("📍 Posição atual do jogador:", gameState.center);
        
        handleDropItem({ x: e.clientX, y: e.clientY });
        e.preventDefault();
        e.stopPropagation(); // Impede que outros eventos de clique sejam executados
      }
    };

    // Adiciona o listener com capture=true para ter prioridade
    window.addEventListener("click", handleClickDrop, true);
    return () => window.removeEventListener("click", handleClickDrop, true);
  }, [gameState.isConnected, handleDropItem, gameState.center]);

  // Função de disparo melhorada - direção precisa do mouse
  const handleShoot = (mousePosition?: { x: number; y: number }) => {
    if (
      !gameState.currentWeapon ||
      gameState.currentWeapon.ammo <= 0 ||
      !gameState.isAlive
    )
      return;

    // Captura a posição atual do mouse no momento do disparo
    const currentMouseX = mousePosition?.x ?? gameState.mousePosition.x;
    const currentMouseY = mousePosition?.y ?? gameState.mousePosition.y;

    // Calcula a direção do tiro baseada na posição atual do mouse
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const deltaX = currentMouseX - centerX;
    const deltaY = currentMouseY - centerY;

    // Validação robusta da direção
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Verifica se a posição do mouse é válida (não está no canto 0,0)
    if (currentMouseX === 0 && currentMouseY === 0) {
      console.warn("Posição do mouse não inicializada, usando direção padrão");
      setGameState((prev) => {
        const newProjectile: Projectile = {
          id: `projectile_${Date.now()}_${Math.random()}`,
          position: { ...prev.center }, // Usa a posição atual do jogador
          direction: { x: 0, y: -1 }, // Tiro para cima
          distanceTraveled: 0,
          maxDistance: PROJECTILE_SPEED_METERS_PER_SECOND * 3,
          speed: PROJECTILE_SPEED_METERS_PER_SECOND,
          timestamp: Date.now(),
          ownerId: prev.playerId,
          damage: prev.currentWeapon!.damage,
        };

        return {
          ...prev,
          projectiles: [...prev.projectiles, newProjectile],
          currentWeapon: prev.currentWeapon
            ? {
                ...prev.currentWeapon,
                ammo: prev.currentWeapon.ammo - 1,
                lastShot: Date.now(),
              }
            : null,
        };
      });
      return;
    }

    // Se o mouse estiver muito próximo do centro, usa uma direção padrão (para cima)
    if (length < 5) {
      setGameState((prev) => {
        const newProjectile: Projectile = {
          id: `projectile_${Date.now()}_${Math.random()}`,
          position: { ...prev.center }, // Usa a posição atual do jogador
          direction: { x: 0, y: -1 }, // Tiro para cima
          distanceTraveled: 0,
          maxDistance: PROJECTILE_SPEED_METERS_PER_SECOND * 3,
          speed: PROJECTILE_SPEED_METERS_PER_SECOND,
          timestamp: Date.now(),
          ownerId: prev.playerId,
          damage: prev.currentWeapon!.damage,
        };

        return {
          ...prev,
          projectiles: [...prev.projectiles, newProjectile],
          currentWeapon: prev.currentWeapon
            ? {
                ...prev.currentWeapon,
                ammo: prev.currentWeapon.ammo - 1,
                lastShot: Date.now(),
              }
            : null,
        };
      });
      return;
    }

    // Normaliza a direção para ter magnitude 1
    const directionX = deltaX / length;
    const directionY = deltaY / length;

    // Validação adicional para garantir que a direção seja válida
    if (
      isNaN(directionX) ||
      isNaN(directionY) ||
      !isFinite(directionX) ||
      !isFinite(directionY)
    ) {
      console.warn("Direção inválida detectada, usando direção padrão");
      return;
    }

    // Verifica se a magnitude da direção é aproximadamente 1
    const magnitude = Math.sqrt(
      directionX * directionX + directionY * directionY
    );
    if (Math.abs(magnitude - 1) > 0.01) {
      console.warn("Magnitude da direção incorreta, normalizando");
      const normalizedX = directionX / magnitude;
      const normalizedY = directionY / magnitude;

      setGameState((prev) => {
        const newProjectile: Projectile = {
          id: `projectile_${Date.now()}_${Math.random()}`,
          position: { ...prev.center }, // Usa a posição atual do jogador
          direction: { x: normalizedX, y: normalizedY },
          distanceTraveled: 0,
          maxDistance: PROJECTILE_SPEED_METERS_PER_SECOND * 3,
          speed: PROJECTILE_SPEED_METERS_PER_SECOND,
          timestamp: Date.now(),
          ownerId: prev.playerId,
          damage: prev.currentWeapon!.damage,
        };

        return {
          ...prev,
          projectiles: [...prev.projectiles, newProjectile],
          currentWeapon: prev.currentWeapon
            ? {
                ...prev.currentWeapon,
                ammo: prev.currentWeapon.ammo - 1,
                lastShot: Date.now(),
              }
            : null,
        };
      });
      return;
    }

    // Cria o projétil com a direção exata do mouse
    setGameState((prev) => {
      const newProjectile: Projectile = {
        id: `projectile_${Date.now()}_${Math.random()}`,
        position: { ...prev.center }, // Usa a posição atual do jogador
        direction: { x: directionX, y: directionY },
        distanceTraveled: 0,
        maxDistance: PROJECTILE_SPEED_METERS_PER_SECOND * 3,
        speed: PROJECTILE_SPEED_METERS_PER_SECOND,
        timestamp: Date.now(),
        ownerId: prev.playerId,
        damage: prev.currentWeapon!.damage,
      };

      // Debug: mostra a direção do tiro
      console.log(
        `🎯 Tiro disparado: direção (${directionX.toFixed(
          3
        )}, ${directionY.toFixed(3)})`
      );
      console.log(`📍 Posição do mouse: (${currentMouseX}, ${currentMouseY})`);
      console.log(`🎯 Centro da tela: (${centerX}, ${centerY})`);
      console.log(
        `🎯 Posição do jogador: (${prev.center.lat.toFixed(
          6
        )}, ${prev.center.lng.toFixed(6)})`
      );

      return {
        ...prev,
        projectiles: [...prev.projectiles, newProjectile],
        currentWeapon: prev.currentWeapon
          ? {
              ...prev.currentWeapon,
              ammo: prev.currentWeapon.ammo - 1,
              lastShot: Date.now(),
            }
          : null,
      };
    });
  };

  // Função de respawn
  const handleRespawn = () => {
    console.log("🔄 Respawn iniciado - resetando arma");
    const newPosition = generateRandomPosition(gameState.center, 100);
    setGameState((prev) => ({
      ...prev,
      center: newPosition,
      isAlive: true,
      playerHealth: PLAYER_MAX_HEALTH,
      currentWeapon: {
        ...WEAPONS.pistol,
        ammo: WEAPONS.pistol.maxAmmo,
        lastShot: 0,
      },
    }));
    setDeathState({ isDead: false, respawnTime: 0 });
    // Limpa o estado de recarga no respawn
    setIsReloadingWeapon(false);
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
      reloadTimeoutRef.current = null;
    }
    console.log("✅ Respawn concluído - arma resetada");
  };

  // Função de sair do jogo
  const handleExit = () => {
    window.location.reload();
  };

  // Função de toggle do menu
  const handleMenuToggle = () => {
    setMenuState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  };

  // Função de mudança de tab
  const handleTabChange = (tab: "settings" | "profile" | "chat" | null) => {
    setMenuState((prev) => ({ ...prev, activeTab: tab }));
  };

  // Função para obter o item selecionado
  const getSelectedItem = () => {
    // Validação adicional para garantir que o slot é válido
    if (selectedSlot < 0 || selectedSlot >= 5) {
      console.log(`❌ Slot inválido: ${selectedSlot}`);
      return undefined;
    }

    // Verifica se o inventário existe e tem o slot
    if (!gameState.inventory || selectedSlot >= gameState.inventory.length) {
      console.log(`❌ Slot ${selectedSlot + 1} não existe no inventário`);
      return undefined;
    }

    const item = gameState.inventory[selectedSlot];
    if (!item) {
      console.log(`❌ Slot ${selectedSlot + 1} está vazio`);
      return undefined;
    }

    return item;
  };

  // Função para obter a arma do slot selecionado
  const getSelectedWeapon = () => {
    const selectedItem = getSelectedItem();
    if (selectedItem && selectedItem.type === "weapon") {
      // Se o item selecionado for uma arma, retorna ela
      return {
        ...WEAPONS.pistol, // Assumindo que é uma pistola por enquanto
        ammo: gameState.currentWeapon?.ammo || WEAPONS.pistol.maxAmmo,
        lastShot: gameState.currentWeapon?.lastShot || 0,
      };
    }
    return null; // Retorna null se não houver arma no slot selecionado
  };

  // Função de clique em item do inventário
  const handleInventoryItemClick = (item: InventoryItem) => {
    console.log("Item clicado:", item);
    // Implementar lógica de uso de item
  };

  if (!gameState.isConnected) {
    return <LoginScreen onConnect={handleConnect} />;
  }

  return (
    <div style={containerStyle}>
      <div ref={mapRef} style={mapContainerStyle} />

      {/* Jogador local */}
      <Player
        player={{
          id: gameState.playerId,
          name: gameState.playerName,
          position: gameState.center,
          color: gameState.playerColor,
          territories: [],
          health: gameState.playerHealth,
          maxHealth: gameState.playerMaxHealth,
          isAlive: gameState.isAlive,
        }}
        isLocal={true}
        weapon={getSelectedWeapon() || undefined}
        mousePosition={gameState.mousePosition}
        onShoot={handleShoot}
        isReloading={isReloadingWeapon}
      />

      {/* Outros jogadores */}
      {Object.values(gameState.otherPlayers).map((player) => (
        <OtherPlayer
          key={player.id}
          player={player}
          currentCenter={gameState.center}
        />
      ))}

      {/* Projéteis */}
      {gameState.projectiles.map((p) => (
        <ProjectileDot
          key={p.id}
          projectile={p}
          currentCenter={gameState.center}
        />
      ))}

      {/* Itens Dropados */}
      {gameState.droppedItems.length > 0 && (
        <div style={{ display: "none" }}>
          Debug: {gameState.droppedItems.length} itens dropados
        </div>
      )}
      {gameState.droppedItems.map((droppedItem) => (
        <DroppedItemComponent
          key={droppedItem.id}
          itemId={droppedItem.id}
          item={droppedItem.item}
          position={droppedItem.position}
          currentCenter={gameState.center}
          weaponData={droppedItem.weaponData}
          onCollect={handleCollectItem}
        />
      ))}

      {/* HUD */}
      <GameHUD
        gameState={gameState}
        onInventoryItemClick={handleInventoryItemClick}
        isReloading={isReloadingWeapon}
        selectedSlot={selectedSlot}
      />

      {/* Menu */}
      <GameMenu
        menuState={menuState}
        onMenuToggle={handleMenuToggle}
        onTabChange={handleTabChange}
      />

      {/* Modal de morte */}
      <DeathModal
        isVisible={deathState.isDead}
        onRespawn={handleRespawn}
        onExit={handleExit}
        respawnTime={deathState.respawnTime}
      />

      {/* Notificação de inventário cheio */}
      {inventoryFullNotification && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(255, 0, 0, 0.9)",
            color: "white",
            padding: "16px 24px",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            zIndex: 1000,
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
            animation: "pulse 0.5s ease-in-out",
          }}
        >
          ⚠️ INVENTÁRIO CHEIO! ⚠️
          <div style={{ fontSize: "14px", marginTop: "8px", fontWeight: "normal" }}>
            Remova alguns itens antes de coletar mais
          </div>
        </div>
      )}
    </div>
  );
}
