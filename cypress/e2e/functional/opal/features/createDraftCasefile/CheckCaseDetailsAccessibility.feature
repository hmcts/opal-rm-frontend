@JIRA-LABEL:create-draft-casefile @functional @local-mock
Feature: Check case details accessibility with local mock submission
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9817
  Scenario: Review, correct and open the mock receipt accessibly
    Given I am reviewing a complete casefile in the local mock
    Then I check the page for accessibility
    When I correct the respondent from casefile review
    Then review shows the corrected respondent and unchanged orders
    And I check the page for accessibility
    When I submit the casefile using the local mock
    Then a mock receipt is shown without a backend create request
    And I check the page for accessibility
