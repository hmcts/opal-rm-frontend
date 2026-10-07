import { describe, expect, it } from 'vitest';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { routing } from './cases-draft.routes';

describe('draft child routes', () => {
  it('redirects only the empty root to tabs and resolves explicit titles', () => {
    expect(routing[0]).toEqual({ path: '', pathMatch: 'full', redirectTo: 'tabs' });
    expect(routing.slice(1).map((route) => route.data)).toEqual([
      { title: 'Create cases' },
      { title: 'All rejected cases' },
    ]);
    expect(routing[1].resolve?.['draftCasefiles']).toEqual(expect.any(Function));
    expect(routing[1].resolve?.['rejectedCount']).toEqual(expect.any(Function));
    expect(routing[2].resolve?.['allRejectedCasefiles']).toEqual(expect.any(Function));
    expect(routing[2].runGuardsAndResolvers).toBe('always');
    for (const route of routing.slice(1)) {
      expect(route.loadComponent).toEqual(expect.any(Function));
      expect(route.resolve?.['title']).toBe(TitleResolver);
    }
  });
});
