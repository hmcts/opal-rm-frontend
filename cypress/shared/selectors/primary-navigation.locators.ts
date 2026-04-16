const PRIMARY_NAVIGATION_CONTAINER = '#primaryNavigation nav[aria-label="Primary navigation"]';
const PRIMARY_NAVIGATION_ITEMS = '#primaryNavigation .moj-primary-navigation__link';

export const PrimaryNavigationLocators = {
  container: PRIMARY_NAVIGATION_CONTAINER,
  items: PRIMARY_NAVIGATION_ITEMS,
  activeItem: `${PRIMARY_NAVIGATION_ITEMS}[aria-current="page"]`,
  labels: {
    search: 'Search',
    accounts: 'Accounts',
    reports: 'Reports',
    administration: 'Administration',
  },
} as const;
