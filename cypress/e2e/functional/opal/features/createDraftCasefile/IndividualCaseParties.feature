@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Capture individual case parties
  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10275
  Scenario: Capture and retain the mandatory individual parties
    Given I am an authorised RM casefile inputter
    And I have started a live REMO In casefile with an "Individual" applicant
    When I capture the respondent and individual applicant
    Then both individual party tasks are complete with their details retained locally
