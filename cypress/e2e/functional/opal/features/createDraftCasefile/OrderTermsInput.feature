@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Capture an order term
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And active non-Central-Authority Major creditors are available
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9807
  Scenario: Accept maintenance and continue without a backend draft
    When I enter order term amount "12.30"
    And I continue from order term input
    Then I reach Creditor without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9807
  Scenario: Required amount keeps the user on the input page
    When I continue from order term input
    Then the amount validation summary links to Amount
