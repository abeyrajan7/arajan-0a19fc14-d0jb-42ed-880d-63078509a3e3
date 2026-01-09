import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

type LoginResponse = {
  access_token: string; // or token
  user?: any; // optional
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'accessToken'; // Use the same key everywhere

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    // Changed 'username' to 'email' to match your form
    return this.http
      .post<any>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          // The API returns 'accessToken' (based on your screenshot)
          const token = res.accessToken || res.token;
          if (!token) throw new Error('No token returned');

          // Use localStorage to match your TaskComponent logic
          localStorage.setItem(this.tokenKey, token);
        }),
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey); // Match the storage
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
