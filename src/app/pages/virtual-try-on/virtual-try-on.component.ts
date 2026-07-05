import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { VirtualTryOnService } from '../../services/virtual-try-on.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-virtual-try-on',
  templateUrl: './virtual-try-on.component.html',
  styleUrl: './virtual-try-on.component.css',
})
export class VirtualTryOnComponent {
  title: string = 'Virtual-Try-On';
  isLoading: boolean = false; 

  constructor(
    private titleService: Title,
    private virtualTryOnService: VirtualTryOnService,
    private router: Router
  ) {
    this.titleService.setTitle(this.title);
  }
   postRunDetection(): void {
    this.isLoading = true; 

    this.virtualTryOnService.postRunDetection().subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Detection Successful:', response);

        this.router.navigate(['/bestStyle'], { state: { data: response } });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Detection Failed from Backend:', error);
        this.router.navigate(['/model-error']);
      }
    });
  }
}
