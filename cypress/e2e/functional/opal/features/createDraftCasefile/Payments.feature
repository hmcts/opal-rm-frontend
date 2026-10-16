@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Capture Draft Casefile payment arrangements
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"
    And I have the live RM casefile permission
    And I have reached the payment tasks with completed mandatory parties and Order Details

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10281
  Scenario Outline: Retain interest <interest> and indexation <indexation> in the local Draft Casefile
    When I open Interest and Indexation
    And I choose interest "<interest>" and indexation "<indexation>"
    And I save Interest and Indexation to Case Details
    And I reopen Interest and Indexation
    Then interest "<interest>" and indexation "<indexation>" are retained without submitting the casefile

    Examples:
      | interest | indexation |
      | Yes      | RPI        |
      | No       | CPI        |
      | Yes      | OTHER      |
      | No       | NONE       |

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10281
  Scenario Outline: Retain <arrangement> payments without changing interest and indexation
    Given I have saved interest "Yes" and indexation "CPI"
    When I open Managing Payments
    And I choose "<arrangement>" payments
    And I save Managing Payments to Case Details
    Then "<arrangement>" payments and the saved interest and indexation are retained without submitting the casefile

    Examples:
      | arrangement |
      | court       |
      | direct      |
