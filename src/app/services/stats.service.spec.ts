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

  it('requests one interstitial after more than ten completed words in a day', () => {
    for (let index = 0; index < 11; index += 1) service.recordResult(index % 2 === 0, 0);

    expect(service.consumeDailyGamesInterstitial()).toBeTrue();
    expect(service.consumeDailyGamesInterstitial()).toBeFalse();
  });

  it('tracks completion and remaining time for a daily challenge', () => {
    const date = new Date(2026, 4, 17, 12);
    expect(service.isDailyAvailable(date)).toBeTrue();
    service.completeDaily(true, date);
    expect(service.isDailyAvailable(date)).toBeFalse();
    expect(service.getDailyResult(date)).toBe('won');
    expect(service.getDailyResult(new Date(2026, 4, 18))).toBeNull();
    expect(service.getDailyRemainingMs(date)).toBe(12 * 60 * 60 * 1000);
  });

  it('stores a daily loss and replaces it when a retry is won', () => {
    const date = new Date(2026, 4, 17, 12);
    service.completeDaily(false, date);
    expect(service.getDailyResult(date)).toBe('lost');

    service.completeDaily(true, date);
    expect(service.getDailyResult(date)).toBe('won');
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

  it('limits the time trial to three attempts per day', () => {
    const today = new Date(2026, 4, 17, 12);
    const tomorrow = new Date(2026, 4, 18, 12);
    expect(service.startTimeTrialAttempt(today)).toBeTrue();
    expect(service.startTimeTrialAttempt(today)).toBeFalse();
    expect(service.getTimeTrialRetriesRemaining(today)).toBe(2);
    service.unlockTimeTrialRetries(today);
    expect(service.areTimeTrialRetriesUnlocked(today)).toBeTrue();
    expect(service.startTimeTrialAttempt(today)).toBeTrue();
    expect(service.startTimeTrialAttempt(today)).toBeTrue();
    expect(service.startTimeTrialAttempt(today)).toBeFalse();
    expect(service.getTimeTrialRetriesRemaining(today)).toBe(0);
    expect(service.getTimeTrialAttempts(tomorrow)).toBe(0);
    expect(service.areTimeTrialRetriesUnlocked(tomorrow)).toBeFalse();
  });

  it('stores the daily time trial result', () => {
    const today = new Date(2026, 4, 17, 12);
    service.completeTimeTrial(false, today);
    expect(service.getTimeTrialResult(today)).toBe('lost');
    service.completeTimeTrial(true, today);
    expect(service.getTimeTrialResult(today)).toBe('won');
  });

  it('saves an unfinished daily challenge and clears it on completion', () => {
    const today = new Date(2026, 4, 17, 12);
    const state = {
      secretWord: 'GATO', theme: 'animales' as const, lettersGuessed: new Set(['G']), lettersFailed: new Set(['Z']),
      attemptsRemaining: 6, gameOver: false, winner: false, score: 0, streak: 0
    };
    service.saveDailyProgress(state, today);

    expect(service.getDailyProgress(today)).toEqual(state);
    expect(service.getDailyProgress(new Date(2026, 4, 18))).toBeNull();
    localStorage.setItem('dailyChallengeDate', '2026-5-17');
    expect(service.isDailyAvailable(today)).toBeTrue();
    service.completeDaily(false, today);
    expect(service.getDailyProgress(today)).toBeNull();
    expect(service.isDailyAvailable(today)).toBeFalse();
  });
});
