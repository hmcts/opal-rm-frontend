@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Individual case parties accessibility
  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10275
  Scenario: Individual mandatory party capture has no detected Axe violations
    Given I am an authorised RM casefile inputter
    And I have started a live REMO In casefile with an "Individual" applicant
    When I open the respondent page for accessibility
    Then I check the page for accessibility
    When I populate the respondent details for accessibility
    And I exercise the respondent optional details for accessibility
    Then I check the page for accessibility
    When I save the respondent details for accessibility
    And I open the individual applicant page for accessibility
    Then I check the page for accessibility
    When I populate the individual applicant details for accessibility
    And I exercise the individual applicant bank choices for accessibility
    Then I check the page for accessibility
    When I save the individual applicant details for accessibility
