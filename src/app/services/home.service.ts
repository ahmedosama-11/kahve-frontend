import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private baseUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  getHomeData(): Observable<any> {
    return this.http.get(`${this.baseUrl}/home`, {
      withCredentials: true,
    });
  }
}
