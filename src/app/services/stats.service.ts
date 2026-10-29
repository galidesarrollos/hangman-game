import { Injectable } from '@angular/core';
import { GameState, Theme } from '../models/game.model';

export interface GameStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  bestStreak: number;
}

const DEFAULT_STATS: GameStats = { gamesPlayed: 0, wins: 0, losses: 0, bestStreak: 0 };

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly storageKey = 'gameStats';
  private readonly dailyRetryKey = 'dailyRewardedRetryDate';
  private readonly dailyProgressKey = 'dailyChallengeProgress';
  private readonly dailyResultKey = 'dailyChallengeResult';
  private readonly timeTrialAttemptsKey = 'timeTrialAttempts';
  private readonly timeTrialRetriesUnlockedKey = 'timeTrialRetriesUnlocked';
  private readonly timeTrialResultKey = 'timeTrialResult';
  private readonly dailyGamesKey = 'dailyGamesPlayed';
  private readonly dailyGamesAdKey = 'dailyGamesInterstitial';

  getStats(): GameStats {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return { ...DEFAULT_STATS };
    try {
      const parsed = JSON.parse(stored) as Partial<GameStats>;
      return {
        gamesPlayed: Number(parsed.gamesPlayed) || 0,
        wins: Number(parsed.wins) || 0,
        losses: Number(parsed.losses) || 0,
        bestStreak: Number(parsed.bestStreak) || 0
      };
    } catch {
      return { ...DEFAULT_STATS };
    }
  }

  recordResult(won: boolean, streak: number): GameStats {
    const current = this.getStats();
    const next: GameStats = {
      gamesPlayed: current.gamesPlayed + 1,
      wins: current.wins + (won ? 1 : 0),
      losses: current.losses + (won ? 0 : 1),
      bestStreak: Math.max(current.bestStreak, streak)
    };
    localStorage.setItem(this.storageKey, JSON.stringify(next));
    const today = this.dailyKey(new Date());
    const [storedDate, storedCount] = (localStorage.getItem(this.dailyGamesKey) ?? '').split(':');
    const count = storedDate === today ? (Number(storedCount) || 0) + 1 : 1;
    localStorage.setItem(this.dailyGamesKey, `${today}:${count}`);
    return next;
  }

  consumeDailyGamesInterstitial(date = new Date()): boolean {
    const today = this.dailyKey(date);
    const [storedDate, storedCount] = (localStorage.getItem(this.dailyGamesKey) ?? '').split(':');
    if (storedDate !== today || (Number(storedCount) || 0) <= 10 || localStorage.getItem(this.dailyGamesAdKey) === today) return false;
    localStorage.setItem(this.dailyGamesAdKey, today);
    return true;
  }

  isDailyAvailable(date = new Date()): boolean {
    return this.getDailyProgress(date) !== null || localStorage.getItem('dailyChallengeDate') !== this.dailyKey(date);
  }

  completeDaily(won: boolean, date = new Date()): void {
    localStorage.setItem('dailyChallengeDate', this.dailyKey(date));
    localStorage.setItem(this.dailyResultKey, `${this.dailyKey(date)}:${won ? 'won' : 'lost'}`);
    this.clearDailyProgress();
  }

  getDailyResult(date = new Date()): 'won' | 'lost' | null {
    const result = localStorage.getItem(this.dailyResultKey);
    if (result === `${this.dailyKey(date)}:won`) return 'won';
    if (result === `${this.dailyKey(date)}:lost`) return 'lost';
    return null;
  }

  getDailyProgress(date = new Date()): GameState | null {
    const stored = localStorage.getItem(this.dailyProgressKey);
    if (!stored) return null;
    try {
      const progress = JSON.parse(stored) as {
        date: string;
        secretWord: string;
        theme: Theme;
        lettersGuessed: string[];
        lettersFailed: string[];
        attemptsRemaining: number;
        score: number;
        streak: number;
      };
      if (progress.date !== this.dailyKey(date) ||
          typeof progress.secretWord !== 'string' ||
          !Array.isArray(progress.lettersGuessed) ||
          !Array.isArray(progress.lettersFailed) ||
          !Number.isInteger(progress.attemptsRemaining) ||
          progress.attemptsRemaining < 1 || progress.attemptsRemaining > 7 ||
          !Number.isFinite(progress.score) || !Number.isFinite(progress.streak)) return null;
      return {
        secretWord: progress.secretWord,
        theme: progress.theme,
        lettersGuessed: new Set(progress.lettersGuessed),
        lettersFailed: new Set(progress.lettersFailed),
        attemptsRemaining: progress.attemptsRemaining,
        score: progress.score,
        streak: progress.streak,
        gameOver: false,
        winner: false
      };
    } catch {
      return null;
    }
  }

  saveDailyProgress(state: GameState, date = new Date()): void {
    localStorage.setItem(this.dailyProgressKey, JSON.stringify({
      date: this.dailyKey(date),
      secretWord: state.secretWord,
      theme: state.theme,
      lettersGuessed: Array.from(state.lettersGuessed),
      lettersFailed: Array.from(state.lettersFailed),
      attemptsRemaining: state.attemptsRemaining,
      score: state.score,
      streak: state.streak
    }));
  }

  clearDailyProgress(): void {
    localStorage.removeItem(this.dailyProgressKey);
  }

  isDailyRetryAvailable(date = new Date()): boolean {
    return localStorage.getItem(this.dailyRetryKey) !== this.dailyKey(date);
  }

  useDailyRetry(date = new Date()): boolean {
    if (!this.isDailyRetryAvailable(date)) return false;
    localStorage.setItem(this.dailyRetryKey, this.dailyKey(date));
    return true;
  }

  getDailyRemainingMs(date = new Date()): number {
    const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return Math.max(0, nextDay.getTime() - date.getTime());
  }

  getTimeTrialAttempts(date = new Date()): number {
    const stored = localStorage.getItem(this.timeTrialAttemptsKey);
    if (!stored) return 0;
    const [key, attempts] = stored.split(':');
    return key === this.dailyKey(date) ? Math.min(3, Math.max(0, Number(attempts) || 0)) : 0;
  }

  startTimeTrialAttempt(date = new Date()): boolean {
    const attempts = this.getTimeTrialAttempts(date);
    if (attempts >= 3 || (attempts > 0 && this.getTimeTrialRetriesUnlocked(date) < attempts)) return false;
    localStorage.setItem(this.timeTrialAttemptsKey, `${this.dailyKey(date)}:${attempts + 1}`);
    return true;
  }

  getTimeTrialRetriesUnlocked(date = new Date()): number {
    const stored = localStorage.getItem(this.timeTrialRetriesUnlockedKey);
    if (stored === this.dailyKey(date)) return 1;
    const [key, retries] = (stored ?? '').split(':');
    return key === this.dailyKey(date) ? Math.min(2, Math.max(0, Number(retries) || 0)) : 0;
  }

  unlockTimeTrialRetry(date = new Date()): boolean {
    const unlocked = this.getTimeTrialRetriesUnlocked(date);
    if (unlocked >= 2 || unlocked >= this.getTimeTrialAttempts(date)) return false;
    localStorage.setItem(this.timeTrialRetriesUnlockedKey, `${this.dailyKey(date)}:${unlocked + 1}`);
    return true;
  }

  getTimeTrialRetriesRemaining(date = new Date()): number {
    return Math.max(0, 3 - this.getTimeTrialAttempts(date));
  }

  completeTimeTrial(won: boolean, date = new Date()): void {
    localStorage.setItem(this.timeTrialResultKey, `${this.dailyKey(date)}:${won ? 'won' : 'lost'}`);
  }

  getTimeTrialResult(date = new Date()): 'won' | 'lost' | null {
    const result = localStorage.getItem(this.timeTrialResultKey);
    if (result === `${this.dailyKey(date)}:won`) return 'won';
    if (result === `${this.dailyKey(date)}:lost`) return 'lost';
    return null;
  }

  private dailyKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
}
