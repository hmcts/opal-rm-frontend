@JIRA-LABEL:create-draft-casefile @functional
Feature: Capture a creditor for an order term
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Accept the applicant as creditor locally
    When I choose the applicant as creditor
    And I continue from creditor selection
    Then I reach Order Terms Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Require a creditor choice
    When I continue from creditor selection
    Then the creditor validation summary links to the required choice

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Accept an active Major creditor by ID
    When I choose a Major creditor
    Then the selected Major creditor remains identified by ID
    When I continue from creditor selection
    Then I reach Order Terms Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Cancel pending minor creditor details without creating a creditor
    When I choose to add a new minor creditor
    And I continue from creditor selection
    And I cancel minor creditor details without edits
    Then I return to Creditor without a selected creditor

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Decline cancellation with a local edit
    When I choose the applicant as creditor
    And I cancel creditor selection and decline the warning
    Then my Applicant creditor edit remains selected

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Accept cancellation with a local edit
    When I choose the applicant as creditor
    And I cancel creditor selection and accept the warning
    Then I reach Order Terms Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Reject missing term context after reload
    When I reload the creditor page without journey state
    Then the creditor route rejects the missing term context

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9813
  Scenario: Remove pending minor creditor and continue with the applicant
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
