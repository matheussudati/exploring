export type LatLng = { lat: number; lng: number };

export interface Player {
  id: string;
  name: string;
  position: LatLng;
  color: string;
  score: number;
  territories: string[];
  health: number;
  maxHealth: number;
  isAlive: boolean;
}

export interface Projectile {
  id: string;
  position: LatLng;
  direction: { x: number; y: number };
  distanceTraveled: number;
  maxDistance: number;
  speed: number;
  timestamp: number;
  ownerId: string;
  damage: number;
}

export interface Weapon {
  id: string;
  name: string;
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
  lastShot: number;
  damage: number;
  fireRate: number;
  range: number;
  type: 'pistol' | 'rifle' | 'sniper' | 'shotgun';
}

export interface Territory {
  id: string;
  position: LatLng;
  radius: number;
  ownerId: string | null;
  captureProgress: number;
  color: string;
  captureTime: number;
}

export interface HitEffect {
  id: string;
  position: LatLng;
  timestamp: number;
  type: 'hit' | 'capture' | 'death';
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'weapon' | 'health' | 'ammo' | 'powerup';
  quantity: number;
  maxQuantity: number;
  icon: string;
  description: string;
}

export interface GameState {
  isConnected: boolean;
  playerName: string;
  playerColor: string;
  playerScore: number;
  playerId: string;
  playerHealth: number;
  playerMaxHealth: number;
  isAlive: boolean;
  center: LatLng;
  otherPlayers: Record<string, Player>;
  projectiles: Projectile[];
  territories: Territory[];
  hitEffects: HitEffect[];
  inventory: InventoryItem[];
  currentWeapon: Weapon | null;
  mousePosition: { x: number; y: number };
}

export interface MenuState {
  isOpen: boolean;
  activeTab: 'settings' | 'profile' | 'chat' | null;
}
