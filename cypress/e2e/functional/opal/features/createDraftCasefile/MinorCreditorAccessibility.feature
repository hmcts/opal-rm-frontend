@JIRA-LABEL:create-draft-casefile @functional
Feature: Minor creditor accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And I am adding a minor creditor to an accepted order term

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Minor Creditor Details is accessible
    Then I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Minor Creditor validation errors are accessible
    When I save the minor creditor details
    Then the minor creditor validation summary shows all required errors
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Minor Creditor Summary is accessible
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    Then I reach Minor Creditor Summary without creating a draft casefile
    And I check the page for accessibility
