@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Cancel case creation accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9818
  Scenario: Open cancellation and continue to an empty case accessibly
    Given I am reviewing a complete casefile for simulated submission
    When I open case creation cancellation
    Then I check the page for accessibility
    When I confirm discarding the local case
    Then case creation starts with no selected case or applicant type
    And I check the page for accessibility
