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

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9817
  Scenario: Refresh the submission confirmation without replaying submission
    Given I am reviewing a complete casefile for simulated submission
    When I submit the casefile for simulated submission
    Then a submission confirmation is shown without a backend create request
    When I refresh the submission confirmation
    Then refresh starts a new journey without submitting data

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9817
  Scenario: Keep accepted data at the cancellation boundary
    Given I am reviewing a complete casefile for simulated submission
    When I open cancellation and return to the reviewed draft
    Then the accepted draft is retained without a submission
