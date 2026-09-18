@JIRA-LABEL:create-draft-casefile @functional
Feature: Creditor accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And active non-Central-Authority Major creditors are available
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Creditor validation and details destination are accessible
    Then I check the page for accessibility
    When I continue from creditor selection
    Then the creditor validation summary links to the required choice
    And I check the page for accessibility
    When I choose a Major creditor
    Then I check the page for accessibility
    When I choose to add a new minor creditor
    And I continue from creditor selection
    Then I check the page for accessibility
