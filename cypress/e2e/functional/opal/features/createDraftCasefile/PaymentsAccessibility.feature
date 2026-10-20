@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Draft Casefile payment arrangements accessibility
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"
    And I have the live RM casefile permission
    And I have reached the payment tasks with completed mandatory parties and Order Details

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10281
  Scenario: Interest and indexation initial, selected and reopened states are accessible
    When I open Interest and Indexation
    Then I check the page for accessibility
    When I select no interest and RPI indexation using the keyboard
    Then I check the page for accessibility
    When I save Interest and Indexation to Case Details
    And I reopen Interest and Indexation
    Then interest "No" and indexation "RPI" are retained without submitting the casefile
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10281
  Scenario: Managing payments initial, selected and reopened states are accessible
    Given I have saved interest "Yes" and indexation "CPI"
    When I open Managing Payments
    Then I check the page for accessibility
    When I select direct payments using the keyboard
    Then I check the page for accessibility
    When I save Managing Payments to Case Details
    Then "direct" payments and the saved interest and indexation are retained without submitting the casefile
    And I check the page for accessibility
