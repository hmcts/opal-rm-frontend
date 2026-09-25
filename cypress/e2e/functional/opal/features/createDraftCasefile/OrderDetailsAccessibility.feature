@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Order Details accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And I have completed the parties for a new REMO In casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Order Details clean and invalid states have no detected Axe violations
    When I open Order Details with available applications
    Then I check the page for accessibility
    When I return from Order Details without entering required fields
    Then the Order Details error summary receives focus
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Empty lookup errors remain accessible and keyboard retryable
    When no Order Details applications are available
    Then I check the page for accessibility
    When I retry opening Order Details using the keyboard
    Then Order Details opens with the available applications

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Global service failure remains accessible
    When the Order Details applications lookup fails
    Then Case Details retains my parties and announces the shared HTTP error and operation reference
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Refresh preserves hidden navigation and applies the direct-link guard
    When I open Order Details with available applications
    Then refreshing Order Details returns to Case Type with primary navigation hidden
