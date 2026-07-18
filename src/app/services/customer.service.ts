import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private baseUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/customers`, { withCredentials: true });
  }

  getCustomerDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/customers/${id}`, { withCredentials: true });
  }

  updateCustomerStatus(id: string, status: 'active' | 'inactive' | 'blocked'): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/admin/customers/${id}/status`, { status }, { withCredentials: true });
  }

  updateCustomerRole(id: string, role: 'user' | 'admin'): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/admin/customers/${id}/role`, { role }, { withCredentials: true });
  }

  deleteCustomer(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/customers/${id}`, { withCredentials: true });
  }
}
