@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Create Draft Casefile Order Details
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805 @JIRA-STORY:PO-10277
  Scenario: Complete and retain Order Details using an active Maintenance Application
    Given I have the live RM casefile permission
    And I have started live Order Details with completed mandatory parties
    When I open Order Details using live active applications
    And I save the selected live application and associated order information
    Then Order Details is complete with the parties retained and no draft submitted
    When I reopen the saved live Order Details
    Then the selected live application and associated order information are retained

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Recover from unavailable applications without losing the parties
    Given I have the live RM casefile permission
    And I have completed the parties for a new REMO In casefile
    When the Order Details applications lookup fails
    Then Case Details retains my parties and announces the shared HTTP error and operation reference
    When I retry opening Order Details using the keyboard
    Then Order Details opens with the available applications

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Refresh preserves hidden navigation and applies the direct-link guard
    Given I have the live RM casefile permission
    And I have completed the parties for a new REMO In casefile
    When I open Order Details with available applications
    Then refreshing Order Details returns to Case Type with primary navigation hidden
