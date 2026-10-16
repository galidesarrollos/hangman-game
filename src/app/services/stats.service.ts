import { Injectable } from '@angular/core';

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
    return localStorage.getItem('dailyChallengeDate') !== this.dailyKey(date);
  }

  completeDaily(date = new Date()): void {
    localStorage.setItem('dailyChallengeDate', this.dailyKey(date));
  }

  getDailyRemainingMs(date = new Date()): number {
    const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return Math.max(0, nextDay.getTime() - date.getTime());
  }

  private dailyKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
}
