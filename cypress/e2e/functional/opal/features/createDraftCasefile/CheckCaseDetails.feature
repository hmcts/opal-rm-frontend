@JIRA-LABEL:create-draft-casefile @functional @local-mock
Feature: Check case details with a local mock submission
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9817
  Scenario: Correct accepted details before simulating submission
    Given I am reviewing a complete casefile in the local mock
    When I correct the respondent from casefile review
    Then review shows the corrected respondent and unchanged orders
    When I submit the casefile using the local mock
    Then a mock receipt is shown without a backend create request

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9817
  Scenario: Refresh the mock receipt without replaying submission
    Given I am reviewing a complete casefile in the local mock
    When I submit the casefile using the local mock
    Then a mock receipt is shown without a backend create request
    When I refresh the mock receipt
    Then the mock receipt expires without another submission

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9817
  Scenario: Keep accepted data at the cancellation boundary
    Given I am reviewing a complete casefile in the local mock
    When I open cancellation and return to the reviewed draft
    Then the accepted draft is retained without a submission
