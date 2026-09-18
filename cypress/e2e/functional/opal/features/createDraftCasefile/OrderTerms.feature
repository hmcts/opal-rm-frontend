@JIRA-LABEL:create-draft-casefile @functional
Feature: Select an order term
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And I open the Order Terms Summary for a new casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9806
  Scenario: Continue to the selected Result and return with the choice restored
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    Then the input destination identifies order term "MAT" without creating a draft
    When I return from the order term input destination
    Then order term "MAT" is selected

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9806
  Scenario: An empty selection cannot continue
    When I start adding an order term
    And I continue from order term selection
    Then the order term validation summary links to the required choice

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9806
  Scenario: A pending choice is discarded on a full reload
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    Then reloading the order term destination returns to Case Type with navigation hidden
