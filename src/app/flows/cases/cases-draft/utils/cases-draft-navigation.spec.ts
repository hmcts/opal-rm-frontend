import { convertToParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';
import { defaultCasesDraftNavigation, parseCasesDraftNavigation } from './cases-draft-navigation';

describe('draft dashboard navigation parsing', () => {
  it.each(Object.keys(CASES_DRAFT_TABS) as CasesDraftTab[])('defaults omitted metadata for %s', (tab) => {
    expect(parseCasesDraftNavigation(tab, convertToParamMap({}))).toEqual({
      tab,
      page: 1,
      sort: CASES_DRAFT_TABS[tab].defaultSort,
      direction: 'ascending',
    });
  });
  it('defaults a missing fragment to In review', () => {
    expect(parseCasesDraftNavigation(null, convertToParamMap({}))).toEqual(defaultCasesDraftNavigation());
  });
  it.each([
    ['unknown', { page: '3', sort: 'created', direction: 'ascending' }],
    ['approved', { page: '-2', sort: 'approved', direction: 'ascending' }],
    ['approved', { page: '2', sort: 'respondent', direction: 'ascending' }],
    ['deleted', { page: '2', sort: 'statusDate', direction: 'sideways' }],
    ['deleted', { page: '2', sort: 'statusDate', direction: 'none' }],
    ['rejected', { page: '1.5', sort: 'created', direction: 'ascending' }],
    ['', {}],
    ['toString', {}],
    ['__proto__', {}],
  ])('rejects invalid complete selection %s %j', (fragment, query) => {
    expect(parseCasesDraftNavigation(fragment, convertToParamMap(query))).toEqual(defaultCasesDraftNavigation());
  });
  it.each(['0', '01', '+1', '1e2', ' 2', '2 ', '', 'NaN', 'Infinity', '9007199254740992'])(
    'rejects noncanonical or unsafe page %s',
    (page) => {
      expect(parseCasesDraftNavigation('approved', convertToParamMap({ page }))).toEqual(defaultCasesDraftNavigation());
    },
  );
  it.each(['sort', 'direction'])('rejects a supplied empty %s', (key) => {
    expect(parseCasesDraftNavigation('approved', convertToParamMap({ [key]: '' }))).toEqual(
      defaultCasesDraftNavigation(),
    );
  });
  it('restores a supported selection and ignores arbitrary fields', () => {
    expect(
      parseCasesDraftNavigation(
        'rejected',
        convertToParamMap({
          page: '3',
          sort: 'applicant',
          direction: 'descending',
          returnUrl: 'https://example.invalid',
          respondent: 'SYNTHETIC',
        }),
      ),
    ).toEqual({ tab: 'rejected', page: 3, sort: 'applicant', direction: 'descending' });
  });
  it('accepts the largest safe integer page', () => {
    expect(parseCasesDraftNavigation('approved', convertToParamMap({ page: '9007199254740991' }))).toEqual({
      ...defaultCasesDraftNavigation('approved'),
      page: Number.MAX_SAFE_INTEGER,
    });
  });
  it.each(Object.keys(CASES_DRAFT_TABS) as CasesDraftTab[])('accepts every supported column for %s', (tab) => {
    for (const sort of CASES_DRAFT_TABS[tab].columns) {
      expect(parseCasesDraftNavigation(tab, convertToParamMap({ sort }))).toEqual({
        ...defaultCasesDraftNavigation(tab),
        sort,
      });
    }
  });
});
