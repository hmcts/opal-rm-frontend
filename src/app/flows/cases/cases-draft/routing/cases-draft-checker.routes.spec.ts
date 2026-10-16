import { describe, expect, it } from 'vitest';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { PRIMARY_NAV_HIDDEN_ROUTE_DATA } from '@app/constants/route-data.constant';
import { CasesDraftCheckAndValidateTabsComponent } from '../cases-draft-check-and-validate-tabs/cases-draft-check-and-validate-tabs.component';
import { routing as featureRouting } from './cases-draft-checker.routes';
const routing = featureRouting[0].children!;
describe('checker child routes', () => {
  it('renders tabs with initial data resolution and hides primary navigation in both safe shells', async () => {
    expect(routing[0]).toEqual({ path: '', pathMatch: 'full', redirectTo: 'tabs' });
    expect(routing[1].data).toEqual({ title: 'Review cases' });
    expect(routing[1].resolve).toEqual({
      title: TitleResolver,
      draftCasefiles: expect.any(Function),
      rejectedCount: expect.any(Function),
      failedCount: expect.any(Function),
    });
    expect(await (routing[1].loadComponent as () => Promise<unknown>)()).toBe(CasesDraftCheckAndValidateTabsComponent);
    expect(routing[2].data).toEqual(PRIMARY_NAV_HIDDEN_ROUTE_DATA);
    expect(routing[2].children?.map((route) => route.data)).toEqual([
      { title: 'Review case', placeholderKind: 'review' },
      { title: 'View case details', placeholderKind: 'view' },
    ]);
    for (const route of routing[2].children!) {
      expect(route.resolve).toEqual({ title: TitleResolver });
      expect(await (route.loadComponent as () => Promise<unknown>)()).toEqual(expect.any(Function));
    }
  });
});
