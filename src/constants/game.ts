export const MAP_ZOOM = 18;
export const PLAYER_SPEED_METERS_PER_SECOND = 120;
export const PROJECTILE_SPEED_METERS_PER_SECOND = 300;
export const PROJECTILE_MAX_DISTANCE_METERS = 30;
export const WEAPON_RELOAD_TIME_MS = 2000;
export const INITIAL_AMMO = 5;
export const TERRITORY_RADIUS_METERS = 50;
export const TERRITORY_CAPTURE_TIME_MS = 5000;
export const PLAYER_HIT_RADIUS_METERS = 2;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_RESPAWN_TIME_MS = 3000;
export const INVENTORY_SLOTS = 5;

export const WEAPONS = {
  pistol: {
    id: 'pistol',
    name: 'Pistola',
    maxAmmo: 5,
    reloadTime: 2000,
    damage: 25,
    fireRate: 200,
    range: 30,
    type: 'pistol' as const,
  },
  rifle: {
    id: 'rifle',
    name: 'Rifle',
    maxAmmo: 30,
    reloadTime: 3000,
    damage: 35,
    fireRate: 100,
    range: 50,
    type: 'rifle' as const,
  },
  sniper: {
    id: 'sniper',
    name: 'Sniper',
    maxAmmo: 5,
    reloadTime: 4000,
    damage: 100,
    fireRate: 500,
    range: 100,
    type: 'sniper' as const,
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    maxAmmo: 8,
    reloadTime: 3500,
    damage: 50,
    fireRate: 300,
    range: 20,
    type: 'shotgun' as const,
  },
};

export const TERRITORY_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
];

export const FALLBACK_START_POSITION = { lat: -23.55052, lng: -46.633308 };
