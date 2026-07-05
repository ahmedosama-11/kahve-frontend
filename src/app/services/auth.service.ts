import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

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
  private baseUrl = 'http://localhost:3000';

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasUser());
  private isAdminSubject = new BehaviorSubject<boolean>(this.checkAdminStatus());

  constructor(private http: HttpClient) {}

  private hasUser(): boolean {
    return !!localStorage.getItem('userId') || !!localStorage.getItem('user');
  }

  private checkAdminStatus(): boolean {
    const userJson = localStorage.getItem('user');
    if (!userJson) return false;

    try {
      const user = JSON.parse(userJson) as { role?: string };
      return user?.role === 'admin';
    } catch {
      return false;
    }
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
    return response?.data?.user || response?.data || response?.user || response;
  }

  private setUserData(data: any, accessToken?: string): void {
    if (!data) return;

    localStorage.setItem('user', JSON.stringify(data));

    const userId = data._id || data.id || data.userId;
    if (userId) localStorage.setItem('userId', userId);
    if (data.email) localStorage.setItem('email', data.email);
    if (data.preferredLanguage === 'ar' || data.preferredLanguage === 'en') {
      localStorage.setItem('kahve_language', data.preferredLanguage);
    }
    if (accessToken) localStorage.setItem('accessToken', accessToken);
  }

  private clearUserData(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('accessToken');
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
