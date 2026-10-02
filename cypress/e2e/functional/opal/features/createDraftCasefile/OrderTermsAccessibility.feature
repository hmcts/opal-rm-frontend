@JIRA-LABEL:create-draft-casefile @functional
Feature: Order term selection accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And I open the Order Terms Summary for a new casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9806
  Scenario: Summary, selection, validation and input are accessible
    Then I check the page for accessibility
    When I start adding an order term
    Then I check the page for accessibility
    When I continue from order term selection
    Then the order term validation summary links to the required choice
    And I check the page for accessibility
    When I choose order term "MAT"
    And I continue from order term selection
    Then the input destination identifies order term "MAT" without creating a draft
    And I check the page for accessibility
