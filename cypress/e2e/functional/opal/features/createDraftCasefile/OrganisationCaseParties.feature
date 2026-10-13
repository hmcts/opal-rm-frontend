@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Capture organisation case parties
  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10276
  Scenario: Capture and retain the mandatory organisation parties
    Given I am an authorised RM casefile inputter
    And I have started a live REMO In casefile with an "Organisation" applicant
    When I capture the respondent and organisation applicant
    Then both organisation party tasks are complete with their details retained locally
