@JIRA-LABEL:create-draft-casefile @functional
Feature: Cancel case creation
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And I am reviewing a complete casefile for simulated submission

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9818
  Scenario: Return to review without losing the case
    When I open cancellation and return to the reviewed draft
    Then the accepted draft is retained without a submission

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9818
  Scenario: Discard the case and start again
    When I open case creation cancellation
    And I confirm discarding the local case
    Then case creation starts with no selected case or applicant type
    And browser history cannot recover the discarded case
