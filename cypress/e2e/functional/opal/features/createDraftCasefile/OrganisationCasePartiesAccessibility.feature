@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Organisation case parties accessibility
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10276
  Scenario: Organisation mandatory party capture has no detected Axe violations
    Given I have the live RM casefile permission
    And I have started a live REMO In casefile with an "Organisation" applicant
    When I open the respondent page for accessibility
    Then I check the page for accessibility
    When I populate the respondent details for accessibility
    And I exercise the respondent optional details for accessibility
    Then I check the page for accessibility
    When I save the respondent details for accessibility
    And I open the organisation applicant page for accessibility
    Then I check the page for accessibility
    When I populate the organisation applicant details for accessibility
    And I exercise the organisation applicant bank choices for accessibility
    Then I check the page for accessibility
    When I save the organisation applicant details for accessibility
