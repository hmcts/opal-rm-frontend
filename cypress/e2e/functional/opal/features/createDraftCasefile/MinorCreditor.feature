@JIRA-LABEL:create-draft-casefile @functional
Feature: Capture minor creditor details
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And I am adding a minor creditor to an accepted order term

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Save an international creditor without BIC or IBAN
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    Then I reach Minor Creditor Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Keep entered values after declining Cancel
    When I enter an unsaved minor creditor name
    And I cancel minor creditor details and decline the warning
    Then my minor creditor name remains on the details page

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Discard unsaved creditor details after accepting Cancel
    When I enter an unsaved minor creditor name
    And I cancel minor creditor details and accept the warning
    Then I return to Creditor without a new minor creditor

  @JIRA-STORY:PO-9810
  Scenario: Return from removal without changing the reviewed creditor
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I open minor creditor removal
    And I return from minor creditor removal
    Then I reach Minor Creditor Summary without creating a draft casefile

  @JIRA-STORY:PO-9810
  Scenario: Cancel the reviewed creditor before acceptance
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I cancel minor creditor review
    Then I return to Creditor without a new minor creditor

  @JIRA-STORY:PO-9810
  Scenario: Accept a reviewed creditor
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I accept the reviewed minor creditor
    Then the reviewed minor creditor is accepted without creating a draft casefile
