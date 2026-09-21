@JIRA-LABEL:create-draft-casefile @functional
Feature: Review order terms
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9811
  Scenario: Amend one of two maintenance orders
    Given I have two accepted maintenance orders with different amounts
    When I change the second maintenance order and complete its creditor selection
    Then only the second maintenance order has the amended amount
    And the casefile has not been submitted

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9811
  Scenario: Cancel a new creditor during an order amendment
    Given I am amending an accepted order with a shared minor creditor
    When I enter a new minor creditor and cancel its review
    Then the original order and shared creditor remain unchanged
    And the new minor creditor is not selectable

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9811
  Scenario: Return from removal without removing an order
    Given I have two accepted maintenance orders with different amounts
    When I open removal for the second order and return to order terms
    Then both original orders remain on the summary
