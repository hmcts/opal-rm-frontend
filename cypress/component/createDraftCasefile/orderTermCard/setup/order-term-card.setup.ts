import { mount } from 'cypress/angular';
import { CasesCreateCasefileOrderTermCardComponent } from 'src/app/flows/cases/cases-create-casefile/components/cases-create-casefile-order-term-card/cases-create-casefile-order-term-card.component';
import type { ICasesCreateCasefileOrderTermCard } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-order-term-card.interface';
import { UK_CARD } from '../mocks/order-term-card.mock';

export function setupOrderTermCard(card: ICasesCreateCasefileOrderTermCard = UK_CARD) {
  const inputCard = structuredClone(card);
  cy.wrap(inputCard).as('inputCard');
  cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.title = 'Order term card component test';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.removeAttribute('role');
  });
  return mount(
    `<div class="govuk-width-container"><main class="govuk-main-wrapper"><h1 class="govuk-heading-l" tabindex="-1">Order term</h1>
      <div class="govuk-grid-row"><div class="govuk-grid-column-two-thirds">
        <app-cases-create-casefile-order-term-card [card]="card" />
      </div></div></main></div>`,
    { imports: [CasesCreateCasefileOrderTermCardComponent], componentProperties: { card: inputCard } },
  );
}
