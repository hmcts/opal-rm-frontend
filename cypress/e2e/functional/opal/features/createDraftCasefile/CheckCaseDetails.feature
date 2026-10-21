@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Check case details and submit for review
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10273 @JIRA-STORY:PO-10283 @retries(0)
  # Cleanup requires TESTING_SUPPORT_ENDPOINTS_ENABLED=true in Maintenance.
  # Generated Draft Casefile ID display will be covered in a future UI functional-test ticket.
  # Cases-in-review navigation will be covered in a future UI functional-test ticket when that journey is available.
  Scenario: Complete and submit one Draft Casefile through live services
    Given I am reviewing a live completed Draft Casefile
    Then review includes the saved casefile comments and notes
    When I submit the live Draft Casefile
    Then the live Draft Casefile submission is confirmed
    And the submitted Create Draft Casefile journey is cleared
    And the submitted party forms and review cannot be reopened

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9817
  Scenario: Correct accepted details before simulating submission
    Given I am reviewing a complete casefile for submission
    When I correct the respondent from casefile review
    Then review shows the corrected respondent and unchanged orders
    When I submit the casefile for submission
    Then submission confirmation is shown after one create request

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9819
  Scenario: Refresh the submission confirmation without replaying submission
    Given I am reviewing a complete casefile for submission
    When I submit the casefile for submission
    Then submission confirmation is shown after one create request
    When I refresh the submission confirmation
    Then an empty new case journey is shown without submitting data

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9819
  Scenario: Start an empty case from the confirmation
    Given I am reviewing a complete casefile for submission
    When I submit the casefile for submission
    Then submission confirmation is shown after one create request
    When I create a new case from casefile confirmation
    Then an empty new case journey is shown without submitting data

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9819
  Scenario: Back from confirmation cannot recover the submitted case
    Given I am reviewing a complete casefile for submission
    When I submit the casefile for submission
    Then submission confirmation is shown after one create request
    When I go back from casefile confirmation
    Then the submitted case journey is empty without another create request
    And the submitted party forms and review cannot be reopened

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9819
  Scenario: Fresh confirmation entry starts an empty case
    When I open casefile confirmation without submitting a case
    Then an empty new case journey is shown without submitting data

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10283
  Scenario: Review optional comments and notes with a complete casefile
    Given I have completed a casefile ready for review
    When I open casefile comments and notes
    And I save optional casefile comments and notes
    And I open the completed casefile review
    Then review includes the saved casefile comments and notes
    When I reopen comments and notes from casefile review
    Then the saved casefile comments and notes are retained
    When I return to review from comments and notes
    Then review includes the saved casefile comments and notes

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10283
  Scenario: Submit a complete casefile without optional comments and notes
    Given I am reviewing a complete casefile for submission
    Then review has no optional casefile comments or notes
    When I submit the casefile for submission
    Then submission confirmation is shown after one create request
    And the submission omits optional casefile comments and notes

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10283
  Scenario: Retain and correct a complete casefile after rejected submission
    Given I have completed a casefile ready for review
    When I open casefile comments and notes
    And I save optional casefile comments and notes
    And I open the completed casefile review
    And the next casefile submission is definitely rejected
    And I submit the casefile for submission
    Then the casefile submission failure is shown
    And the complete reviewed casefile is retained
    When I reopen comments and notes from casefile review
    Then the saved casefile comments and notes are retained
    When I return to review from comments and notes
    And I correct the respondent from casefile review
    Then review shows the corrected respondent and unchanged orders
    When I submit the casefile for submission
    Then the corrected casefile is submitted after the rejection
    When I create a new case from casefile confirmation
    Then the submitted case journey is empty without another create request
