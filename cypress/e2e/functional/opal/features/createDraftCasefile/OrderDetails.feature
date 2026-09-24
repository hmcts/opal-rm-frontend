@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Create Draft Casefile Order Details
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And I have completed the parties for a new REMO In casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Save and edit Order Details with the required dates
    When I open Order Details with available applications
    And I save an application, monthly payments and both required dates
    Then Order Details is marked Provided and the remaining order tasks are available
    When I reopen Order Details
    Then my saved Order Details are editable

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Recover from unavailable applications without losing the parties
    When the Order Details applications lookup fails
    Then Case Details retains my parties and announces the shared HTTP error and operation reference
    When I retry opening Order Details using the keyboard
    Then Order Details opens with the available applications

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Refresh preserves hidden navigation and applies the direct-link guard
    When I open Order Details with available applications
    Then refreshing Order Details returns to Case Type with primary navigation hidden
