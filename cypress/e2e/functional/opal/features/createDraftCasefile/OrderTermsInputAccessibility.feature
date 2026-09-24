@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Order term input accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And active non-Central-Authority Major creditors are available
    And I open the Order Terms Summary for a new casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9807
  Scenario: Maintenance input, validation and Creditor are accessible
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    Then I check the page for accessibility
    When I continue from order term input
    Then the amount validation summary links to Amount
    And I check the page for accessibility
    When I enter order term amount "12.30"
    And I continue from order term input
    Then I reach Creditor without creating a draft casefile
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9807
  Scenario: Child maintenance input and validation are accessible
    When I start adding an order term
    And I choose order term "MCHILD"
    And I continue from order term selection
    Then I check the page for accessibility
    When I continue from order term input
    Then I check the page for accessibility
