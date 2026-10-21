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
    return next;
  }

  isDailyAvailable(date = new Date()): boolean {
    return this.getDailyProgress(date) !== null || localStorage.getItem('dailyChallengeDate') !== this.dailyKey(date);
  }

  completeDaily(date = new Date()): void {
    localStorage.setItem('dailyChallengeDate', this.dailyKey(date));
    this.clearDailyProgress();
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

  private dailyKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
}
