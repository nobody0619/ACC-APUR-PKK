export enum ScreenState {
  WELCOME = 'WELCOME',
  MENU = 'MENU',
  GAME = 'GAME',
  LEADERBOARD = 'LEADERBOARD'
}

export interface GameItem {
  id: string;
  label: string;
  originalId: string; // Used for exact matching
  category?: string;  // Used for group matching (e.g. 'BELANJA')
}

export interface DropZoneData {
  id: string;
  
  // Logic for the Main Label (Right side or only side)
  correctLabel?: string; // Specific label required
  acceptsCategory?: string; // Any item with this category is accepted
  
  // Logic for the Operator (Left side, optional)
  hasOperator?: boolean;
  correctOperator?: string; // 'Tambah' or 'Tolak'

  // Visuals
  displayValue: string; // 'x', 'xx', '(x)', etc.
  indent?: number; // 0, 1, 2 for visual hierarchy
  
  // Type flags
  isHeaderRow?: boolean; // If true, visually styled as a header (bold/underline), but can still be a drop zone
  isStatic?: boolean; // If true, it is just static text, not interactive
  
  colIndex: 0 | 1 | 2; // Which column the value aligns to
}

export interface LevelConfig {
  id: string;
  title: string;
  subTitle: string;
  rows: DropZoneData[];
  items: { label: string; category?: string; id: string }[];
}

export interface LeaderboardEntry {
  name: string;
  levelId: string;
  score: number; // Number of mistakes
  time: number; // Seconds
  timestamp: number;
}