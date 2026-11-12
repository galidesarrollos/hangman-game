// Copy data-ad-slot from AdSense Display units. Empty slots never request ads.
export const WEB_ADS_CONFIG = {
  client: 'ca-pub-6536506161156686',
  hosts: ['elahorcadojuego.com', 'www.elahorcadojuego.com'],
  slots: { themes: '2821034524', levels: '8077230632' }
};
export type WebAdPlacement = keyof typeof WEB_ADS_CONFIG.slots;
