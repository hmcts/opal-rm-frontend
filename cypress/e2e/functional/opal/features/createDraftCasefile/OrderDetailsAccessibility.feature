@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Order Details accessibility
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805 @JIRA-STORY:PO-10277
  Scenario: Live Order Details initial, invalid and replayed states have no detected Axe violations
    Given I have the live RM casefile permission
    And I have started live Order Details with completed mandatory parties
    When I open Order Details using live active applications
    Then I check the page for accessibility
    When I return from Order Details without entering required fields
    Then the Order Details error summary receives focus
    And I check the page for accessibility
    When I save the selected live application and associated order information
    Then Order Details is complete with the parties retained and no draft submitted
    When I reopen the saved live Order Details
    Then the selected live application and associated order information are retained
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Empty lookup errors remain accessible and keyboard retryable
    Given I have the live RM casefile permission
    And I have completed the parties for a new REMO In casefile
    When no Order Details applications are available
    Then I check the page for accessibility
    When I retry opening Order Details using the keyboard
    Then Order Details opens with the available applications

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9805
  Scenario: Global service failure remains accessible
    Given I have the live RM casefile permission
    And I have completed the parties for a new REMO In casefile
    When the Order Details applications lookup fails
    Then Case Details retains my parties and announces the shared HTTP error and operation reference
    And I check the page for accessibility
