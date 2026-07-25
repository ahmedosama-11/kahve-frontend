import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface DeliveryArea {
  _id?: string;
  area_en: string;
  area_ar: string;
  deliveryFee: number;
}


export interface DeliveryAreasImportSummary {
  totalRows: number;
  validRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface PaymentSettings {
  _id?: string;
  instapayEnabled: boolean;
  instapayLink: string;
  instapayShortName: string;
  manualPaymentInstructionsEn: string;
  manualPaymentInstructionsAr: string;
}

export interface Coupon {
  _id?: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  maxDiscount: number;
  active: boolean;
  expiresAt?: string | null;
  usageLimit: number;
  usedCount?: number;
  oneUsePerUser?: boolean;
  usedBy?: any[];
}

@Injectable({ providedIn: 'root' })
export class CheckoutSettingsService {
  private baseUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  getPaymentSettings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/checkout/payment-settings`, { withCredentials: true });
  }

  getAdminPaymentSettings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/payment-settings`, { withCredentials: true });
  }

  updatePaymentSettings(settings: Partial<PaymentSettings>): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/admin/payment-settings`, settings, { withCredentials: true });
  }

  getDeliveryAreas(search = ''): Observable<any> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('q', search.trim());
    return this.http.get<any>(`${this.baseUrl}/checkout/delivery-areas`, { params, withCredentials: true });
  }

  getAdminDeliveryAreas(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/delivery-areas`, { withCredentials: true });
  }

  createDeliveryArea(area: Partial<DeliveryArea>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/delivery-areas`, area, { withCredentials: true });
  }

  importDeliveryAreas(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/admin/delivery-areas/import`, formData, { withCredentials: true });
  }

  downloadDeliveryAreasTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/admin/delivery-areas/template`, {
      responseType: 'blob',
      withCredentials: true,
    });
  }

  updateDeliveryArea(id: string, area: Partial<DeliveryArea>): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/admin/delivery-areas/${id}`, area, { withCredentials: true });
  }

  deleteDeliveryArea(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/delivery-areas/${id}`, { withCredentials: true });
  }

  getCoupons(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/coupons`, { withCredentials: true });
  }

  createCoupon(coupon: Partial<Coupon>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/coupons`, coupon, { withCredentials: true });
  }

  updateCoupon(id: string, coupon: Partial<Coupon>): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/admin/coupons/${id}`, coupon, { withCredentials: true });
  }

  deleteCoupon(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/coupons/${id}`, { withCredentials: true });
  }

  validateCoupon(code: string, subtotal: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checkout/coupon/validate`, { code, subtotal }, { withCredentials: true });
  }
}
