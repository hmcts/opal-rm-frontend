import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesDraftPlaceholderComponent } from './cases-draft-placeholder.component';

describe('draft placeholder metadata', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'missing', component: CasesDraftPlaceholderComponent, data: { placeholderKind: 'details' } },
          {
            path: ':draftCasefileId',
            component: CasesDraftPlaceholderComponent,
            data: { placeholderKind: 'amendment' },
          },
        ]),
        {
          provide: GlobalStore,
          useValue: { authenticated: signal(false), userState: signal(null), featureFlags: signal({}) },
        },
      ],
    });
  });
  it('takes mode only from trusted route data and validates a safe internal Back destination', async () => {
    const harness = await RouterTestingHarness.create(
      '/123?placeholderKind=rejections&tab=deleted&page=3&sort=statusDate&direction=descending&returnUrl=https://example.test',
    );
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Amend case');
    expect(harness.routeNativeElement?.textContent).toContain('Case amendment will be available here.');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
      '/cases/draft/create-and-manage/tabs?page=3&sort=statusDate&direction=descending#deleted',
    );
  });
  it('keeps a missing ID safe when rendering an incomplete details route', async () => {
    const harness = await RouterTestingHarness.create('/missing');
    expect(harness.routeNativeElement?.textContent).toContain('This case could not be opened.');
  });
  it('rejects whitespace and signs rather than parsing a valid numerical prefix', async () => {
    const harness = await RouterTestingHarness.create('/%2B123');
    expect(harness.routeNativeElement?.textContent).toContain('This case could not be opened.');
    await harness.navigateByUrl('/123%20');
    expect(harness.routeNativeElement?.textContent).toContain('This case could not be opened.');
  });
});
