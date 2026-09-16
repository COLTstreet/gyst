import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MessageService } from 'primeng/api';
import { filter } from 'rxjs';

/**
 * Angular's service worker downloads new versions in the background but
 * doesn't serve them until the next full reload — on an installed PWA
 * (especially iOS home-screen apps), that can mean deploys silently never
 * show up until the user happens to fully close and reopen the app more
 * than once. This surfaces a reload prompt as soon as a new version is
 * actually ready, so updates land within moments of a deploy instead.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly messageService = inject(MessageService);

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.messageService.add({
          severity: 'info',
          summary: 'Update available',
          detail: 'Reloading to get the latest version…',
          life: 3000,
        });
        setTimeout(() => document.location.reload(), 1500);
      });

    // The SW only checks for updates on its own schedule (navigation/app
    // stability) — also check whenever the tab regains focus, since an
    // installed PWA can sit open/backgrounded for a long time otherwise.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void this.swUpdate.checkForUpdate();
      }
    });
  }
}
