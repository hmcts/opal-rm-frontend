@JIRA-LABEL:create-draft-casefile @functional
Feature: Check case details with a simulated submission
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9817
  Scenario: Correct accepted details before simulating submission
    Given I am reviewing a complete casefile for simulated submission
    When I correct the respondent from casefile review
    Then review shows the corrected respondent and unchanged orders
    When I submit the casefile for simulated submission
    Then a submission confirmation is shown without a backend create request

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9819
  Scenario: Refresh the submission confirmation without replaying submission
    Given I am reviewing a complete casefile for simulated submission
    When I submit the casefile for simulated submission
    Then a submission confirmation is shown without a backend create request
    When I refresh the submission confirmation
    Then an empty new case journey is shown without submitting data

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9817
  Scenario: Keep accepted data at the cancellation boundary
    Given I am reviewing a complete casefile for simulated submission
    When I open cancellation and return to the reviewed draft
    Then the accepted draft is retained without a submission

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9819
  Scenario: Start an empty case from the confirmation
    Given I am reviewing a complete casefile for simulated submission
    When I submit the casefile for simulated submission
    Then a submission confirmation is shown without a backend create request
    When I create a new case from casefile confirmation
    Then an empty new case journey is shown without submitting data

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9819
  Scenario: Back from confirmation retains the case in the current journey
    Given I am reviewing a complete casefile for simulated submission
    When I submit the casefile for simulated submission
    Then a submission confirmation is shown without a backend create request
    When I go back from casefile confirmation
    Then review retains the case after returning from confirmation

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9819
  Scenario: Fresh confirmation entry starts an empty case
    When I open casefile confirmation without submitting a case
    Then an empty new case journey is shown without submitting data
