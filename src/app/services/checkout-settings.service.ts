import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface DeliveryArea {
  _id?: string;
  city_en: string;
  city_ar: string;
  area_en: string;
  area_ar: string;
  deliveryFee: number;
  active: boolean;
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

  getDeliveryAreas(includeInactive = false): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/checkout/delivery-areas`, {
      params: includeInactive ? { includeInactive: 'true' } : {},
      withCredentials: true,
    });
  }

  getAdminDeliveryAreas(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/delivery-areas`, {
      params: { includeInactive: 'true' },
      withCredentials: true,
    });
  }

  createDeliveryArea(area: Partial<DeliveryArea>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/delivery-areas`, area, { withCredentials: true });
  }

  importDeliveryAreas(file: File, replaceAll = false): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('replaceAll', String(replaceAll));
    return this.http.post<any>(`${this.baseUrl}/admin/delivery-areas/import`, formData, { withCredentials: true });
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
