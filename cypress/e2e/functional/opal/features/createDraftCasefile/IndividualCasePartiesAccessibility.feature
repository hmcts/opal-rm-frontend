@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Individual case parties accessibility
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10275 @JIRA-STORY:PO-10273
  Scenario: Individual mandatory party capture has no detected Axe violations
    Given I have the live RM casefile permission
    And I have started a live REMO In casefile with an "Individual" applicant
    Then I check the page for accessibility
    When I open the respondent page for accessibility
    Then I check the page for accessibility
    When I populate the respondent details for accessibility
    And I exercise the respondent optional details for accessibility
    Then I check the page for accessibility
    When I save the respondent details for accessibility
    Then I check the page for accessibility
    When I open the individual applicant page for accessibility
    Then I check the page for accessibility
    When I populate the individual applicant details for accessibility
    And I exercise the individual applicant bank choices for accessibility
    Then I check the page for accessibility
    When I save the individual applicant details for accessibility
    Then I check the page for accessibility
