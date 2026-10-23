@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Cancel case creation
  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9818 @JIRA-STORY:PO-10284 @JIRA-STORY:PO-10605
  Scenario: A completed draft remains available after returning from cancellation
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And I am reviewing a complete casefile for submission
    When I open cancellation and return to the reviewed draft
    Then the accepted draft is retained without a submission

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9818 @JIRA-STORY:PO-10284 @JIRA-STORY:PO-10605
  Scenario: Confirming cancellation starts a genuinely fresh browser journey
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And I am reviewing a complete casefile for submission
    When I open case creation cancellation
    And I confirm discarding the local case
    Then the Create cases dashboard is shown
    When I choose to create a case
    Then case creation starts with no selected case or applicant type
    And browser history cannot recover the discarded case

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10284
  Scenario: A user without the RM Business Unit permission cannot open cancellation
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"
    And I have the live RM casefile permission
    And the released RM casefile entry is available
    And I am authenticated with email "opal-test-4@dev.platform.hmcts.net"
    And I do not have the live RM casefile permission
    When I open the RM path "/cases/create-casefile/cancel"
    Then I cannot reach Draft Casefile cancellation or create a case

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9818 @JIRA-STORY:PO-10605
  Scenario: Discard a local case and return to the originating dashboard
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    And I started a new case from the rejected inputter dashboard
    And I am reviewing a complete casefile for submission
    When I open case creation cancellation
    And I confirm discarding the local case
    Then the rejected inputter dashboard selection is restored
    When I choose to create a case
    Then case creation starts with no selected case or applicant type
