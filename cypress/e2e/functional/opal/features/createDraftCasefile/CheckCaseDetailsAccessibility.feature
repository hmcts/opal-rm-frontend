@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Check case details submission accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9819 @JIRA-STORY:PO-10273 @JIRA-STORY:PO-10283
  Scenario: Review, correct and open the submission confirmation accessibly
    Given I have completed a casefile ready for review
    Then I check the page for accessibility
    When I open the completed casefile review
    Then I check the page for accessibility
    When I correct the respondent from casefile review
    Then review shows the corrected respondent and unchanged orders
    And I check the page for accessibility
    When I submit the casefile for submission
    Then submission confirmation is shown after one create request
    And I check the page for accessibility
    When I create a new case from casefile confirmation
    Then an empty new case journey is shown without submitting data
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10283
  Scenario: Access comments and recover from rejected submission using the keyboard
    Given I have completed a casefile ready for review
    When I open casefile comments and notes
    Then I check the page for accessibility
    When I save optional casefile comments and notes using the keyboard
    And I open the completed casefile review
    Then review includes the saved casefile comments and notes
    And I check the page for accessibility
    When the next casefile submission is definitely rejected
    And I submit the casefile for submission
    Then the casefile submission failure is shown
    And the complete reviewed casefile is retained
    And I check the page for accessibility
    When I reopen comments and notes from casefile review
    Then the saved casefile comments and notes are retained
    And I check the page for accessibility
    When I return to review from comments and notes
    Then I check the page for accessibility
