import { AudioService } from './audio.service';

describe('AudioService', () => {
  let play: jasmine.Spy;
  let pause: jasmine.Spy;

  beforeEach(() => {
    localStorage.removeItem('gameVolume');
    spyOn(HTMLMediaElement.prototype, 'load').and.stub();
    play = spyOn(HTMLMediaElement.prototype, 'play').and.returnValue(Promise.resolve());
    pause = spyOn(HTMLMediaElement.prototype, 'pause').and.stub();
  });

  afterEach(() => localStorage.removeItem('gameVolume'));

  it('does not start sounds while muted and stops sounds already playing', () => {
    const audio = new AudioService();
    audio.playSound('acierto');
    expect(play).toHaveBeenCalledTimes(1);

    audio.toggleMute();
    expect(pause).toHaveBeenCalledTimes(4);
    audio.playSound('error');
    expect(play).toHaveBeenCalledTimes(1);

    audio.toggleMute();
    audio.playSound('error');
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('respects a muted volume saved from a previous session', () => {
    localStorage.setItem('gameVolume', '0');
    const audio = new AudioService();

    audio.playSound('victoria');

    expect(play).not.toHaveBeenCalled();
  });
});
