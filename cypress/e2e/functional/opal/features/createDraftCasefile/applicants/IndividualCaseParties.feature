@functional
@JIRA-STORY:PO-10275
Feature: Capture individual case parties

  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-LABEL:create-draft-casefile
  @JIRA-EPIC:PO-6506
  Scenario: Individual applicant and respondent details are provided and retained
    When I start a REMO In case with an Individual applicant
    Then the respondent Country options show United Kingdom first and the next three alphabetically
    When I complete the minimum respondent details
    And I complete the minimum individual applicant details
    Then the Respondent and Applicant tasks are Provided
    And the respondent and applicant details are retained when reopened
