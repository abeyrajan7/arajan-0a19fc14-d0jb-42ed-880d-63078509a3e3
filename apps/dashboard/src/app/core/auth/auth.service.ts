import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

type LoginResponse = {
  access_token: string; 
  user?: any;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'accessToken'; 

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<any>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          const token = res.accessToken || res.token;
          if (!token) throw new Error('No token returned');
          localStorage.setItem(this.tokenKey, token);
        }),
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey); 
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
