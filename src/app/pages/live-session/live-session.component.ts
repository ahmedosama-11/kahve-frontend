import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

declare var JEELIZVTOWIDGET: any;

@Component({
  selector: 'app-live-session',
  templateUrl: './live-session.component.html',
  styleUrls: ['./live-session.component.css'],
})
export class LiveSessionComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initVTO();
    }, 2000);
  }

  initVTO() {
    if (typeof JEELIZVTOWIDGET !== 'undefined') {
      setTimeout(() => {
        const loader = document.getElementById('jeezWidgetLoading');
        if (loader && loader.style.display !== 'none') {
          loader.style.display = 'none';
        }
      }, 10000);

      JEELIZVTOWIDGET.start({
        searchRootDir: 'assets/jeeliz-vto/',
        canvasId: 'jeezWidgetCanvas',
        sku: 'rayban_aviator_or_vertFlash',
        callbacks: {
          onReady: () => {
            console.log('Engine Ready!');
            const loader = document.getElementById('jeezWidgetLoading');
            if (loader) loader.style.display = 'none';
          },
          onError: (err: string) => {
            console.error('VTO Error:', err);
            const loader = document.getElementById('jeezWidgetLoading');
            if (loader) loader.style.display = 'none';
            alert('Could not start camera. Please check permissions.');
          },
        },
      });
    } else {
      console.error(
        'JEELIZVTOWIDGET is not defined. Check angular.json scripts.',
      );
    }
  }

  changeModel(sku: string) {
    if (typeof JEELIZVTOWIDGET !== 'undefined' && sku) {
      console.log('Loading New SKU:', sku);
      JEELIZVTOWIDGET.load(sku);
    }
  }

  ngOnDestroy(): void {
    if (typeof JEELIZVTOWIDGET !== 'undefined' && JEELIZVTOWIDGET.destroy) {
      JEELIZVTOWIDGET.destroy();
    }
  }
}
