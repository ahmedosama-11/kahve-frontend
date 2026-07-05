import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css'],
})
export class LogoutComponent {
  constructor(private authService: AuthService, private router: Router) {}

onLogout(choice: string) {
  if (choice === 'Yes') {
    this.authService.logout(choice).subscribe({
      next: (res) => {
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Logout error:', err),
    });
  } else {
    this.router.navigate(['/home']);
  }
} 
}



