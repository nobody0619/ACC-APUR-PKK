import { LeaderboardEntry } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

const LOCAL_STORAGE_KEY = 'akaun_master_scores';

export const saveScore = async (entry: LeaderboardEntry): Promise<void> => {
  // 1. Save Locally (Backup/Demo mode)
  const currentData = localStorage.getItem(LOCAL_STORAGE_KEY);
  const parsedData: LeaderboardEntry[] = currentData ? JSON.parse(currentData) : [];
  parsedData.push(entry);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsedData));

  // 2. Try Save to Google Sheet if configured
  if (GOOGLE_SCRIPT_URL) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // standard for Google Apps Script Web Apps to avoid CORS errors on simple posts
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (e) {
      console.error("Failed to sync with Google Sheet", e);
    }
  }
};

export const getScores = async (): Promise<LeaderboardEntry[]> => {
  // Ideally fetch from API, falling back to local for this demo
  const currentData = localStorage.getItem(LOCAL_STORAGE_KEY);
  const parsedData: LeaderboardEntry[] = currentData ? JSON.parse(currentData) : [];
  
  // Sort: Fewest mistakes first, then fastest time
  return parsedData.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.time - b.time;
  });
};
