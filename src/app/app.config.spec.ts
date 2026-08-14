import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppInitializerService } from '@hmcts/opal-frontend-common/services/app-initializer-service';
import { withHttpRetry } from '@hmcts/opal-frontend-common/interceptors/http-retry';
import { appConfig } from './app.config';

type ProviderRecord = {
  provide?: {
    toString?: () => string;
  };
  useFactory?: () => unknown;
  ɵproviders?: unknown;
};

const findProvider = (value: unknown, matcher: (provider: ProviderRecord) => boolean): ProviderRecord | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findProvider(item, matcher);
      if (match) {
        return match;
      }
    }
    return null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const provider = value as ProviderRecord;
  if (matcher(provider)) {
    return provider;
  }

  if ('ɵproviders' in provider) {
    return findProvider(provider.ɵproviders, matcher);
  }

  return null;
};

describe('appConfig', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        {
          provide: AppInitializerService,
          useValue: {
            initializeApp: vi.fn(),
          },
        },
        provideHttpClientTesting(),
      ],
    });
  });

  it('resets the scroll position to the top for new navigations', () => {
    const routerScrollerProvider = findProvider(appConfig.providers, (provider) => {
      const providerLabel = provider.provide?.toString?.() ?? '';
      return providerLabel.includes('Router Scroller');
    });

    if (!routerScrollerProvider?.useFactory) {
      throw new Error('Expected appConfig to include the Router Scroller provider.');
    }

    const routerScroller = TestBed.runInInjectionContext(
      () =>
        routerScrollerProvider.useFactory?.() as {
          options: {
            anchorScrolling: string;
            scrollPositionRestoration: string;
          };
        },
    );

    expect(routerScroller.options).toMatchObject({
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'top',
    });
  });

  it('retries opted-in transient GET requests before surfacing an error', () => {
    const http = TestBed.inject(HttpClient);
    const httpTestingController = TestBed.inject(HttpTestingController);
    const response = vi.fn();
    const error = vi.fn();

    http.get('/retry', { context: withHttpRetry({ retryCount: 1, delayMs: 0 }) }).subscribe({ next: response, error });

    httpTestingController.expectOne('/retry').flush(null, { status: 503, statusText: 'Service Unavailable' });
    httpTestingController.expectOne('/retry').flush({ available: true });

    expect(response).toHaveBeenCalledWith({ available: true });
    expect(error).not.toHaveBeenCalled();
    httpTestingController.verify();
  });
});
