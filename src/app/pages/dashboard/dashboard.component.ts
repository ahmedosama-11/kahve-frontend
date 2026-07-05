import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  previewImage: string | ArrayBuffer | null = null;
  currentPage: string = '';

  constructor(private router: Router) {}
  ngOnInit() {
    this.currentPage = this.router.url.split('/')[1]; 
  }
}
