export enum PetState {
  IDLE = 'idle',
  WALK = 'walk',
  SLEEP = 'sleep',
  CHEW = 'chew',
  GROOM = 'groom',
  STAND = 'stand',
  FOLLOW = 'follow',
  TUNNEL = 'tunnel',
}

export enum InteractionType {
  PET = 'pet',
  FEED = 'feed',
  CLICK = 'click',
  SCARE = 'scare',
  CHAT = 'chat',
}

export enum WorkMode {
  NONE = 'none',
  FOCUS = 'focus',
  REST_REMINDER = 'rest_reminder',
  DRINK_REMINDER = 'drink_reminder',
  NIGHT_COMPANION = 'night_companion',
}

export enum MiniGameType {
  CHASE_CURSOR = 'chase_cursor',
  SNACK_RAIN = 'snack_rain',
  TUNNEL_RACE = 'tunnel_race',
  CATCH_ME = 'catch_me',
}

export interface PetData {
  name: string;
  color: string;
  fullness: number;
  cleanliness: number;
  mood: number;
  intimacy: number;
  coins: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface AppConfig {
  alwaysOnTop: boolean;
  clickThrough: boolean;
  semiTransparent: boolean;
  hideOnEdge: boolean;
  autoStart: boolean;
  currentRatName: string;
  currentRatColor: string;
  focusMode: boolean;
  restReminder: boolean;
  drinkReminder: boolean;
  nightCompanion: boolean;
  restIntervalMinutes: number;
  drinkIntervalMinutes: number;
  volume: number;
}
