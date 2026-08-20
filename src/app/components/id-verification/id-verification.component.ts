import { Component, Inject, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService, SessionResponse } from '../../services/identity.service';

@Component({
  selector: 'app-id-verification',
  templateUrl: './id-verification.component.html',
  styleUrl: './id-verification.component.scss',
  standalone: true
})
export class IdVerificationComponent implements OnInit {
  loading = false;
  private pollingTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly maxStatusChecks = 12;
  private statusCheckCount = 0;

  constructor(
    private readonly identityService: IdentityService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    this.handleVerificationCallback();
  }

  startVerification(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loading = true;
    this.statusCheckCount = 0;
    this.clearPolling();

    this.identityService.createSession().subscribe({
      next: (session) => {
        const verificationUrl = session.verificationUrl ?? session.redirectUrl;

        if (verificationUrl) {
          window.location.href = verificationUrl;
          return;
        }

        this.startPollingStatus(session.inquiryId);
      },
      error: (err: unknown) => {
        this.loading = false;
        console.error('Failed to create verification session', err);
      }
    });
  }

  private handleVerificationCallback(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const verificationSessionId = params.get('verificationSessionId');

    if (!verificationSessionId) {
      return;
    }

    this.loading = true;
    this.statusCheckCount = 0;
    this.clearPolling();
    this.startPollingStatus(verificationSessionId);

    const url = new URL(window.location.href);
    url.searchParams.delete('verificationSessionId');
    url.searchParams.delete('status');
    window.history.replaceState({}, '', url.toString());
  }

  private startPollingStatus(verificationSessionId?: string): void {
    const pollStatus = () => {
      this.identityService.getVerificationStatus().subscribe({
        next: (statusRes) => {
          const status = (statusRes?.status || '').toLowerCase();

          if (status === 'pending' || status === 'in_progress') {
            this.statusCheckCount += 1;

            if (this.statusCheckCount >= this.maxStatusChecks) {
              this.clearPolling();
              this.loading = false;
              console.info('Verification is still pending. Waiting for the backend webhook to complete it.', statusRes);
              return;
            }

            this.pollingTimer = setTimeout(pollStatus, 3000);
            return;
          }

          this.clearPolling();
          this.loading = false;

          if (status === 'verified' || status === 'approved' || status === 'completed') {
            console.log('Identity verification complete', statusRes);
            this.handleFlowComplete(statusRes);
            return;
          }

          if (status === 'rejected' || status === 'failed' || status === 'canceled' || status === 'cancelled') {
            console.warn('Identity verification was not completed', statusRes);
            return;
          }
        },
        error: (err: unknown) => {
          this.clearPolling();
          this.loading = false;
          console.error('Failed to fetch verification status', err);
        }
      });
    };

    pollStatus();
  }

  private clearPolling(): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private handleFlowComplete(statusRes: any): void {
    console.log('Identity verification finished', statusRes);
    this.router.navigate(['/profile'], { queryParams: { verificationStatus: statusRes?.status } });
  }
}
