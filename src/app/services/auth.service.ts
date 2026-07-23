import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = API_BASE_URL;

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasUser());
  private isAdminSubject = new BehaviorSubject<boolean>(this.checkAdminStatus());

  constructor(private http: HttpClient) {}

  private hasUser(): boolean {
    return this.hasStoredSession();
  }

  hasStoredSession(): boolean {
    return !!localStorage.getItem('userId') || !!localStorage.getItem('user') || !!localStorage.getItem('accessToken');
  }

  private checkAdminStatus(): boolean {
    const userJson = localStorage.getItem('user');
    const storedRole = this.normalizeRole(localStorage.getItem('role'));

    if (storedRole === 'admin') return true;
    if (!userJson) return false;

    try {
      const user = JSON.parse(userJson);
      return this.userIsAdmin(user);
    } catch {
      return false;
    }
  }

  private normalizeRole(value: any): string {
    return String(value || '').trim().toLowerCase();
  }

  private extractRole(data: any): string {
    const possibleRoles = [
      data?.role,
      data?.user?.role,
      data?.data?.role,
      data?.data?.user?.role,
      data?.account?.role,
      data?.profile?.role,
    ];

    const role = possibleRoles.map((value) => this.normalizeRole(value)).find(Boolean);
    if (role) return role;

    const possibleAdminFlags = [
      data?.isAdmin,
      data?.admin,
      data?.user?.isAdmin,
      data?.user?.admin,
      data?.data?.isAdmin,
      data?.data?.user?.isAdmin,
      data?.account?.isAdmin,
      data?.profile?.isAdmin,
    ];

    return possibleAdminFlags.some((value) => value === true || this.normalizeRole(value) === 'true')
      ? 'admin'
      : '';
  }

  private userIsAdmin(data: any): boolean {
    return this.extractRole(data) === 'admin';
  }

  get isLoggedIn$() { return this.isLoggedInSubject.asObservable(); }
  get isAdmin$() { return this.isAdminSubject.asObservable(); }

  get isLoggedInValue(): boolean { return this.isLoggedInSubject.value; }
  get isAdminValue(): boolean { return this.isAdminSubject.value; }

  private currentLanguage(): 'en' | 'ar' {
    return localStorage.getItem('kahve_language') === 'ar' ? 'ar' : 'en';
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { email, password, language: this.currentLanguage() }, { withCredentials: true })
      .pipe(
        tap((response: any) => {
          const user = this.extractUser(response);
          this.setUserData(user, response?.accessToken);
          this.isLoggedInSubject.next(true);
          this.isAdminSubject.next(user?.role === 'admin');
        }),
        catchError(this.handleError)
      );
  }

  signup(name: string, email: string, password: string, phone?: string): Observable<any> {
    const payload: SignupPayload & { language: 'en' | 'ar' } = { name, email, password, phone, language: this.currentLanguage() };
    return this.http.post(`${this.baseUrl}/signup`, payload, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  verifyEmail(email: string, code: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verifyEmail`, { email, code, language: this.currentLanguage() }, { withCredentials: true })
      .pipe(
        tap((response: any) => {
          const user = this.extractUser(response);
          this.setUserData(user, response?.accessToken);
          this.isLoggedInSubject.next(true);
          this.isAdminSubject.next(user?.role === 'admin');
        }),
        catchError(this.handleError)
      );
  }

  resendVerificationCode(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/resendVerificationCode`, { email, language: this.currentLanguage() }, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgotPassword`, { email, language: this.currentLanguage() }, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  verifyResetCode(resetCode: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verifyResetCode`, { resetCode, language: this.currentLanguage() }, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  resetPassword(email: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/resetPassword`, { email, newPassword, language: this.currentLanguage() }, { withCredentials: true })
      .pipe(
        tap((response: any) => {
          const user = this.extractUser(response);
          this.setUserData(user, response?.accessToken);
          this.isLoggedInSubject.next(true);
          this.isAdminSubject.next(user?.role === 'admin');
        }),
        catchError(this.handleError)
      );
  }

  logout(choice: string = 'logout'): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, { submit: choice }, { withCredentials: true })
      .pipe(
        tap(() => this.clearUserData()),
        catchError((err) => {
          this.clearUserData();
          return throwError(() => err);
        })
      );
  }

  checkAuthStatus(): Observable<boolean> {
    return this.http.get(`${this.baseUrl}/check`, { withCredentials: true }).pipe(
      map((response: any) => {
        const user = this.extractUser(response);
        this.setUserData(user, response?.accessToken);
        this.isLoggedInSubject.next(true);
        this.isAdminSubject.next(user?.role === 'admin');
        return true;
      }),
      catchError(() => {
        this.clearUserData();
        return of(false);
      })
    );
  }

  clearSession(): void {
    this.clearUserData();
  }

  private extractUser(response: any): any {
    const direct =
      response?.data?.user ||
      response?.user ||
      response?.data?.data?.user ||
      response?.data ||
      response;

    const nestedUser =
      direct?.user ||
      direct?.data?.user ||
      direct?.account ||
      direct?.profile ||
      null;

    const merged = nestedUser && typeof nestedUser === 'object'
      ? { ...direct, ...nestedUser }
      : direct;

    const role = this.extractRole(merged) || this.extractRole(response);
    return role ? { ...merged, role } : merged;
  }

  private setUserData(data: any, accessToken?: string): void {
    if (!data) return;

    const role = this.extractRole(data);
    const userToStore = role ? { ...data, role } : data;

    localStorage.setItem('user', JSON.stringify(userToStore));
    if (role) localStorage.setItem('role', role);

    const userId = userToStore._id || userToStore.id || userToStore.userId || userToStore.user_id;
    if (userId) localStorage.setItem('userId', userId);
    if (userToStore.email) localStorage.setItem('email', userToStore.email);
    if (userToStore.preferredLanguage === 'ar' || userToStore.preferredLanguage === 'en') {
      localStorage.setItem('kahve_language', userToStore.preferredLanguage);
    }
    if (accessToken) localStorage.setItem('accessToken', accessToken);
  }

  private clearUserData(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    localStorage.removeItem('cart');
    localStorage.removeItem('favorites');
    localStorage.removeItem('kahveCartCount');
    this.isLoggedInSubject.next(false);
    this.isAdminSubject.next(false);
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}
