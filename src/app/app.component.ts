import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  showNavbar: string = 'default';
  showFooter: boolean = true;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let child = this.activatedRoute.firstChild;
        while (child?.firstChild) { child = child.firstChild; }
        return child?.snapshot.data['title'] || 'KAHVE';
      })
    ).subscribe((title: string) => {
      this.titleService.setTitle(title);
      this.updateLayout(this.router.url);
    });
  }

  private updateLayout(url: string) {
    if (url.includes('welcome')) {
      this.showNavbar = 'welcome';
      this.showFooter = true;
    } else if (url.includes('home') || url.includes('dashboard') || url.includes('contactUs')) {
      this.showNavbar = 'home';
      this.showFooter = !url.includes('dashboard');  
    } else if (url.includes('logout')) {
      this.showNavbar = 'false';
      this.showFooter = false;
    } else {
      this.showNavbar = 'default';
      this.showFooter = true;
    }
  }
}