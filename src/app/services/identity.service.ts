import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints, build } from '../core/api/endpoints'

export interface SessionResponse {
  provider: string;
  inquiryId: string;
  status: string;
  createdAt: string;
  verificationUrl?: string;
  redirectUrl?: string;
  callbackUrl?: string;
  sessionToken?: string;
}

export interface VerificationStatusResponse {
  inquiryId?: string;
  verificationSessionId?: string;
  status?: string;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  reason?: string | null;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class IdentityService {
  private readonly apiUrl = '/api/v1/identity';

  constructor(private readonly http: HttpClient) {}

  createSession(): Observable<SessionResponse> {
    const fullUrl = build(ApiEndpoints.identity.CREATE_SESSION);
    return this.http.post<SessionResponse>(`${fullUrl}`, {});
  }

  getVerificationStatus(): Observable<VerificationStatusResponse | null> {
    const fullUrl = build(ApiEndpoints.identity.GET_VERIFICATION_STATUS);
    return this.http.get<VerificationStatusResponse | null>(`${fullUrl}`);
  }
}
