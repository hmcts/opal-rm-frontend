@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Capture organisation case parties
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10276
  Scenario: Capture and retain the mandatory organisation parties
    Given I have the live RM casefile permission
    And I have started a live REMO In casefile with an "Organisation" applicant
    When I capture the respondent and organisation applicant
    Then both organisation party tasks are complete with their details retained locally
