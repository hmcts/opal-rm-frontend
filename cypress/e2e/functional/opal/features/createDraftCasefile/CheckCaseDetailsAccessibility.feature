@JIRA-LABEL:create-draft-casefile @functional
Feature: Check case details accessibility with simulated submission
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9817
  Scenario: Review, correct and open the submission confirmation accessibly
    Given I am reviewing a complete casefile for simulated submission
    Then I check the page for accessibility
    When I correct the respondent from casefile review
    Then review shows the corrected respondent and unchanged orders
    And I check the page for accessibility
    When I submit the casefile for simulated submission
    Then a submission confirmation is shown without a backend create request
    And I check the page for accessibility
