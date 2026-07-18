import { Component } from '@angular/core';
import { KAHVE_CONTACT } from '../../config/store-contact';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  contact = KAHVE_CONTACT;
}
