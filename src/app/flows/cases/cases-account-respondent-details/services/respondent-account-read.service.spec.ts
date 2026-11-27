import { TestBed } from '@angular/core/testing';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { EMPTY, firstValueFrom } from 'rxjs';
import { RespondentAccountReadService } from './respondent-account-read.service';

describe('RespondentAccountReadService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [RespondentAccountReadService] });
  });

  it.each([
    ['title', { title: null }, { title: GENERIC_HTTP_ERROR_TITLE }],
    ['message', { message: '' }, { message: GENERIC_HTTP_ERROR_MESSAGE }],
  ] as const)(
    'fills in a missing banner %s and preserves the other error details',
    async (_, missingCopy, fallback) => {
      const globalStore = TestBed.inject(GlobalStore);
      const service = TestBed.inject(RespondentAccountReadService);
      const details = {
        title: 'Summary unavailable',
        message: 'Try again or contact the service desk.',
        operationId: 'reference-11748',
      };
      globalStore.setBannerError({ error: true, ...details, ...missingCopy });

      const result = await firstValueFrom(service.read(() => EMPTY));

      expect(result).toEqual({ status: 'failed', error: { ...details, ...fallback } });
      expect(globalStore.bannerError()).toEqual(GLOBAL_ERROR_STATE);
    },
  );
});
