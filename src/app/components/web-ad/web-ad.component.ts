import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, inject } from '@angular/core';
import { WebAdPlacement } from '../../config/web-ads.config';
import { WebAdsService } from '../../services/web-ads.service';

@Component({
  selector: 'app-web-ad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside *ngIf="ads.slot(placement) as slot" aria-label="Publicidad">
      <span>Publicidad</span>
      <ins #ad class="adsbygoogle" style="display:block"
        [attr.data-ad-client]="ads.client" [attr.data-ad-slot]="slot"
        data-ad-format="auto" data-full-width-responsive="true"></ins>
    </aside>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    aside { margin: 48px 0 24px; min-height: 120px; }
    span { display: block; margin-bottom: 12px; color: #a8b1c8; font-size: .7rem; text-align: center; }
    ins { width: 100%; min-height: 100px; }
  `]
})
export class WebAdComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) placement!: WebAdPlacement;
  @ViewChild('ad') private ad?: ElementRef<HTMLElement>;
  readonly ads = inject(WebAdsService);
  private observer?: ResizeObserver;

  ngAfterViewInit(): void {
    const element = this.ad?.nativeElement;
    if (!element) return;
    // Ionic caches views: wait until the slot has width in an active page.
    this.observer = new ResizeObserver(() => {
      if (element.closest('.ion-page-hidden') || element.getBoundingClientRect().width <= 0) return;
      this.ads.requestAd(element);
      this.observer?.disconnect();
    });
    this.observer.observe(element);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}
