import { provideZoneChangeDetection } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';
import { setAssetPath } from 'ionicons/components';

import { AppModule } from './app/app.module';

setAssetPath(new URL('.', document.baseURI).href);

platformBrowser().bootstrapModule(AppModule, {
  applicationProviders: [provideZoneChangeDetection()],
})
  .catch(err => console.log(err));
