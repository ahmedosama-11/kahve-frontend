import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { Title } from '@angular/platform-browser'; 

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
})
export class WelcomeComponent {
  title: string = 'welcome '; 
  constructor(private titleService: Title) {
    this.titleService.setTitle(this.title); 
  }
}
