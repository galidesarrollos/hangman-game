import { Type } from '@angular/core';
import { ModalController } from '@ionic/angular';

export async function openSettingsModal(
  modalController: ModalController,
  component: Type<unknown>,
  cssClass: string,
  presentingElement?: HTMLElement
): Promise<void> {
  const modal = await modalController.create({
    component,
    cssClass,
    breakpoints: [0, 0.8, 1],
    initialBreakpoint: 1,
    presentingElement
  });
  await modal.present();
}
