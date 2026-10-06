import { describe, expect, it } from 'vitest';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { PRIMARY_NAV_HIDDEN_ROUTE_DATA } from '@app/constants/route-data.constant';
import { routing } from './cases-draft-checker.routes';
describe('checker child routes', () => {
  it('renders tabs with title-only resolution and hides primary navigation in both safe shells', async () => {
    expect(routing[0]).toEqual({ path: '', pathMatch: 'full', redirectTo: 'tabs' });
    expect(routing[1].data).toEqual({ title: 'Review cases' });
    expect(routing[1].resolve).toEqual({ title: TitleResolver });
    expect(routing[2].data).toEqual(PRIMARY_NAV_HIDDEN_ROUTE_DATA);
    expect(routing[2].children?.map((route) => route.data)).toEqual([
      { title: 'Review case', placeholderKind: 'review' },
      { title: 'View case details', placeholderKind: 'view' },
    ]);
    for (const route of [routing[1], ...routing[2].children!]) {
      expect(route.resolve).toEqual({ title: TitleResolver });
      expect(await (route.loadComponent as () => Promise<unknown>)()).toEqual(expect.any(Function));
    }
  });
});
