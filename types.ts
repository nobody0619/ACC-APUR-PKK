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
  correctLabel?: string; // Specific label required
  acceptsCategory?: string; // Any item with this category is accepted
  displayValue: string; // 'x', 'xx', '(x)', etc.
  indent?: number; // 0, 1, 2 for visual hierarchy
  isHeader?: boolean; // If true, it is just text, not a drop zone
  isStatic?: boolean; // If true, it renders as filled text (e.g. Untung Kasar start of Part 2)
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
