// Solo para la compilación de diagnóstico de TestFlight.
// Mantiene la configuración de producción salvo las unidades iOS de Google.
import { environment as production } from './environment.prod';

export const environment = {
  ...production,
  adTestMode: true,
  nativeIosAdUnitId: 'ca-app-pub-3940256099942544/3986624511',
  bannerIosAdUnitId: 'ca-app-pub-3940256099942544/2934735716',
  interstitialIosAdUnitId: 'ca-app-pub-3940256099942544/4411468910',
  rewardedIosAdUnitId: 'ca-app-pub-3940256099942544/1712485313'
};
