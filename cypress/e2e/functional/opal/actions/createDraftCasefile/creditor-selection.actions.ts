import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';

/** Owns observed creditor identities and local UI assertions. */
export class CreditorSelectionActions {
  /** Selects an observed active BU 44 Major and captures its exact identity for replay. */
  public chooseMajor(): void {
    cy.get<IOpalMaintenanceMajorCreditorReferenceDataItem[]>('@observedMajors').then((records) => {
      const selected = records[0];
      if (
        !selected ||
        !Number.isInteger(selected.major_creditor_id) ||
        selected.major_creditor_id <= 0 ||
        !selected.name.trim()
      ) {
        throw new Error('A selectable active synthetic Major Creditor is required');
      }
      cy.wrap(String(selected.major_creditor_id), { log: false }).as('majorCreditorId');
      cy.wrap(selected.name, { log: false }).as('majorCreditorName');
      cy.get(S.creditor.major).check();
      cy.get(S.creditor.majorId).select(String(selected.major_creditor_id));
      cy.get(S.creditor.majorId).should('have.value', String(selected.major_creditor_id));
    });
  }
  /** Accepts the selected creditor through keyboard activation and requires local summary without submission. */
  public accept(): void {
    cy.get(S.creditor.continueButton).focus().should('be.focused').type('{enter}');
    cy.get(S.orderTerms.add).should('be.visible');
    cy.get('@liveDraftCreation').should('not.have.been.called');
  }
  /** Requires the synthetic applicant name on the scenario-owned first term. */
  public assertApplicant(): void {
    cy.get<number>('@firstTerm').then((id) =>
      cy.get(S.orderTermsSummary.card(id)).should('contain.text', 'Synthetic Applicant'),
    );
  }
  /** Requires the saved Applicant choice before replay acceptance can change any creditor selection. */
  public assertApplicantChoice(): void {
    cy.get(S.creditor.applicant).should('be.checked');
  }
  /** Requires the observed Major name on the scenario-owned stable term. */
  public assertMajor(): void {
    cy.get<number>('@firstTerm').then((id) => {
      cy.get('@majorCreditorName').then((name) =>
        cy.get(S.orderTermsSummary.card(id)).should('contain.text', String(name)),
      );
    });
  }
  /** Requires the retained Major type and exact observed identifier in the reopened choice. */
  public assertMajorChoice(): void {
    cy.get(S.creditor.major).should('be.checked');
    cy.get('@majorCreditorId').then((id) => cy.get(S.creditor.majorId).should('have.value', String(id)));
  }
  /** Captures the only scenario-owned Minor option value and selects it without assuming its sequence. */
  public chooseExistingMinor(): void {
    cy.get(S.creditor.minorChoices)
      .should('have.length', 1)
      .invoke('val')
      .then((choice) => {
        const value = String(choice);
        expect(value).to.match(/^minor:[1-9]\d*$/);
        cy.wrap(value, { log: false }).as('minorCreditorChoice');
        cy.get(S.creditor.minorChoices).check(value);
      });
    cy.get('@minorCreditorName').then((name) => cy.get(S.creditor.choiceLabels).should('contain.text', String(name)));
  }
  /** Requires both stable terms to retain the same synthetic Minor and no draft submission. */
  public assertReuse(): void {
    cy.get('@minorCreditorName').then((name) => {
      cy.get<number>('@firstTerm').then((id) =>
        cy.get(S.orderTermsSummary.card(id)).should('contain.text', String(name)),
      );
      cy.get<number>('@secondTerm').then((id) =>
        cy.get(S.orderTermsSummary.card(id)).should('contain.text', String(name)),
      );
    });
    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
    cy.get('@liveDraftCreation').should('not.have.been.called');
  }
  /** Requires exactly one retained checked Minor option with the previously observed value. */
  public assertSingleMinorChoice(): void {
    cy.get(S.creditor.minorChoices).should('have.length', 1).and('be.checked');
    cy.get('@minorCreditorChoice').then((choice) =>
      cy.get(S.creditor.minorChoices).should('have.value', String(choice)),
    );
  }
  /** Requires no existing-Minor option and no draft submission in a fresh order. */
  public assertHidden(): void {
    cy.get(S.creditor.minorChoices).should('not.exist');
    cy.get('@liveDraftCreation').should('not.have.been.called');
  }
  /** Reveals the actual Major conditional controls through the rendered radio. */
  public showMajorConditional(): void {
    cy.get(S.creditor.major).check();
  }
  /** Requires the revealed Major selector before accessibility scanning. */
  public assertMajorConditional(): void {
    cy.get(S.creditor.majorId).should('be.visible');
  }
}
