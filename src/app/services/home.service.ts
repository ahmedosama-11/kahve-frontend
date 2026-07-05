import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getHomeData(): Observable<any> {
    return this.http.get(`${this.baseUrl}/home`, {
      withCredentials: true,
    });
  }
}
