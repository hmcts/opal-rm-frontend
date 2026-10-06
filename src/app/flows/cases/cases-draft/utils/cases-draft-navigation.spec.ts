import { describe, expect, it } from 'vitest';
import { getCasesDraftTabs } from './cases-draft-tab-metadata';
import { defaultCasesDraftNavigation, parseCasesDraftNavigation } from './cases-draft-navigation';

describe.each(['inputter', 'checker'] as const)('%s fragment navigation', (mode) => {
  it.each([null, '', 'unknown', '__proto__', 'toString'])('resets unsupported fragment %s', (fragment) => {
    expect(parseCasesDraftNavigation(fragment, mode)).toEqual(defaultCasesDraftNavigation(undefined, mode));
  });
  it('selects supported queues with default local table state', () => {
    for (const tab of getCasesDraftTabs(mode)) {
      expect(parseCasesDraftNavigation(tab, mode)).toEqual(defaultCasesDraftNavigation(tab, mode));
    }
  });
  it('ignores queues from the other mode', () => {
    expect(parseCasesDraftNavigation(mode === 'checker' ? 'approved' : 'failed', mode)).toEqual(
      defaultCasesDraftNavigation(undefined, mode),
    );
  });
});
