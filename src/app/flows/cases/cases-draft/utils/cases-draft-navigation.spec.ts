import { describe, expect, it } from 'vitest';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';
import { defaultCasesDraftNavigation, parseCasesDraftNavigation } from './cases-draft-navigation';

describe('draft dashboard fragment parsing', () => {
  it.each(Object.keys(CASES_DRAFT_TABS) as CasesDraftTab[])('selects %s with default local table state', (tab) => {
    expect(parseCasesDraftNavigation(tab)).toEqual({
      tab,
      page: 1,
      sort: CASES_DRAFT_TABS[tab].defaultSort,
      direction: 'ascending',
    });
  });
  it.each([null, '', 'unknown', 'toString', '__proto__'])(
    'defaults unsupported fragment %s to In review',
    (fragment) => {
      expect(parseCasesDraftNavigation(fragment)).toEqual(defaultCasesDraftNavigation());
    },
  );
});
