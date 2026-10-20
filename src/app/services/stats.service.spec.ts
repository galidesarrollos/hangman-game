import { StatsService } from './stats.service';

describe('StatsService', () => {
  let service: StatsService;

  beforeEach(() => {
    localStorage.clear();
    service = new StatsService();
  });

  it('returns zeroed statistics when nothing has been saved', () => {
    expect(service.getStats()).toEqual({ gamesPlayed: 0, wins: 0, losses: 0, bestStreak: 0 });
  });

  it('records wins, losses and the best streak in local storage', () => {
    service.recordResult(true, 1);
    service.recordResult(true, 2);
    service.recordResult(false, 0);

    expect(service.getStats()).toEqual({ gamesPlayed: 3, wins: 2, losses: 1, bestStreak: 2 });
  });

  it('returns default statistics when saved JSON is invalid', () => {
    localStorage.setItem('gameStats', '{invalid');
    expect(service.getStats()).toEqual({ gamesPlayed: 0, wins: 0, losses: 0, bestStreak: 0 });
  });

  it('tracks completion and remaining time for a daily challenge', () => {
    const date = new Date(2026, 4, 17, 12);
    expect(service.isDailyAvailable(date)).toBeTrue();
    service.completeDaily(date);
    expect(service.isDailyAvailable(date)).toBeFalse();
    expect(service.getDailyRemainingMs(date)).toBe(12 * 60 * 60 * 1000);
  });

  it('allows only one rewarded retry per day', () => {
    const today = new Date(2026, 4, 17, 12);
    const tomorrow = new Date(2026, 4, 18, 12);
    expect(service.isDailyRetryAvailable(today)).toBeTrue();
    expect(service.useDailyRetry(today)).toBeTrue();
    expect(service.isDailyRetryAvailable(today)).toBeFalse();
    expect(service.useDailyRetry(today)).toBeFalse();
    expect(service.isDailyRetryAvailable(tomorrow)).toBeTrue();
  });
});
