@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Cancel case creation
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9818 @JIRA-STORY:PO-10605
  Scenario: Return to review without losing the case
    Given I am reviewing a complete casefile for submission
    When I open cancellation and return to the reviewed draft
    Then the accepted draft is retained without a submission

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9818 @JIRA-STORY:PO-10605
  Scenario: Discard the case and start again
    Given I am reviewing a complete casefile for submission
    When I open case creation cancellation
    And I confirm discarding the local case
    Then the Create cases dashboard is shown
    When I choose to create a case
    Then case creation starts with no selected case or applicant type
    And browser history cannot recover the discarded case

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9818 @JIRA-STORY:PO-10605
  Scenario: Discard a local case and return to the originating dashboard
    Given I started a new case from the rejected inputter dashboard
    And I am reviewing a complete casefile for submission
    When I open case creation cancellation
    And I confirm discarding the local case
    Then the rejected inputter dashboard selection is restored
    When I choose to create a case
    Then case creation starts with no selected case or applicant type
