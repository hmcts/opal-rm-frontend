@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Capture a creditor for an order term
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Accept the applicant as creditor locally
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    When I choose the applicant as creditor
    And I continue from creditor selection
    Then I reach Order Terms Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Require a creditor choice
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    When I continue from creditor selection
    Then the creditor validation summary links to the required choice

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Require a Major creditor selection
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    When I choose the Major creditor type
    And I continue from creditor selection
    Then the Major creditor validation summary links to the required selection

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Accept an active Major creditor by ID
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    When I choose a Major creditor
    Then the selected Major creditor remains identified by ID
    When I continue from creditor selection
    Then I reach Order Terms Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Cancel pending minor creditor details without creating a creditor
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    When I choose to add a new minor creditor
    And I continue from creditor selection
    And I cancel minor creditor details without edits
    Then I return to Creditor without a selected creditor

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Decline cancellation with a local edit
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    When I choose the applicant as creditor
    And I cancel creditor selection and decline the warning
    Then my Applicant creditor edit remains selected

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Accept cancellation with a local edit
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    When I choose the applicant as creditor
    And I cancel creditor selection and accept the warning
    Then I reach Order Terms Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Reject missing term context after reload
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    When I reload the creditor page without journey state
    Then the creditor route rejects the missing term context

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9813
  Scenario: Remove pending minor creditor and continue with the applicant
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    When I choose to add a new minor creditor
    And I continue from creditor selection
    And I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I open minor creditor removal
    And I confirm minor creditor removal
    Then I return to Creditor with minor creditor removal success
    When I dismiss minor creditor removal success
    And I choose the applicant as creditor
    And I continue from creditor selection
    Then I reach Order Terms Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10279
  Scenario: Retain an observed Major Creditor by its identity
    Given I have the live RM casefile permission
    And I am choosing a creditor for an Order Term
    When I accept an available Major Creditor
    Then the selected Major Creditor is retained

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10279
  Scenario: Retain the applicant for a Order Term
    Given I have the live RM casefile permission
    And I am choosing a creditor for an Order Term
    When I accept the applicant as the creditor
    Then the applicant creditor is retained

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10279
  Scenario: Reuse a Minor Creditor for another term without duplication
    Given I have the live RM casefile permission
    And I am choosing a creditor for a second term with an existing Minor Creditor
    When I choose the existing Minor Creditor
    And I accept the existing Minor Creditor
    Then both Order Terms retain the same Minor Creditor
    And the existing Minor Creditor has not been duplicated

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10279
  Scenario: Hide existing Minor Creditor choices when none exists on the order
    Given I have the live RM casefile permission
    And I am choosing a creditor for an Order Term
    Then no existing Minor Creditor choice is displayed
