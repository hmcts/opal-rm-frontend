@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Inputter casefile dashboard
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10605
  Scenario: Enter case creation through the inputter dashboard
    Given my inputter casefile collection is available
    When I open Create cases from the Cases page
    Then I see the four inputter lifecycle tabs
    When I choose to create a case
    Then I see an empty Case Type page

  @JIRA-STORY:PO-10605
  Scenario: Return to the selected rejected page from persisted details
    Given my rejected inputter list contains more than one page
    And I have selected rejected page 2 sorted by applicant descending
    When I open a rejected case's details
    And I return to Create cases
    Then my rejected page and sort are restored with refreshed rows

  @JIRA-STORY:PO-10605
  Scenario Outline: Open all rejected cases from either result state
    Given my rejected inputter list is "<state>"
    When I view all rejected cases
    Then the protected all rejected cases page is shown in the same tab
    Examples:
      | state     |
      | empty     |
      | populated |

  @JIRA-STORY:PO-10605
  Scenario: Published accounts remain read-only while queued work is absent
    Given my approved collection contains a published case and an unexpected pending case
    When I select Approved cases
    Then I see only the published account numbers as text
    And the request is bounded by publication status date

  @JIRA-STORY:PO-10605
  Scenario Outline: Cancel a dirty Case Type page
    Given I started a new case from the rejected inputter dashboard
    When I cancel a dirty Case Type page and "<decision>" leaving
    Then the Case Type cancellation outcome is "<outcome>"
    Examples:
      | decision | outcome  |
      | accept   | restored |
      | dismiss  | retained |

  @JIRA-STORY:PO-10605
  Scenario: Initial list resolver failure preserves the current page and later arrival succeeds
    Given my initial inputter list consultation fails once
    When I enter the inputter dashboard from the current Cases page
    Then dashboard arrival is cancelled and the application error banner is shown
    When I enter the inputter dashboard from the current Cases page
    Then a later navigation shows all inputter tabs and the rejected count

  @JIRA-STORY:PO-10605
  Scenario: Initial rejected count failure preserves the resolved list and every lifecycle tab
    Given my initial rejected count consultation fails once
    When I enter the inputter dashboard from the current Cases page
    Then the resolved list remains available without a rejected count badge

  @JIRA-STORY:PO-10605
  Scenario: A later failed tab hides stale cases and another tab recovers
    Given my inputter casefile collection is available
    When I open the inputter dashboard
    Given the next inputter tab consultation will fail
    When I select Approved using the keyboard
    Then the failed tab hides previous cases and reports through the application banner
    When I select Deleted using the keyboard
    Then the Deleted cases are shown after the failed consultation

  @JIRA-STORY:PO-10605
  Scenario Outline: Persisted destinations expose a protected shell without fetching case data
    Given my inputter casefile collection is available
    When I open the persisted "<kind>" destination with identifier "<id>"
    Then the "<kind>" shell shows "<message>" without persistence requests
    Examples:
      | kind      | id  | message                                              |
      | details   | 123 | Case details will be available here.                  |
      | details   | 0   | This case could not be opened. Return to Create cases.|
      | amendment | 123 | Case amendment will be available here.                |
      | amendment | bad | This case could not be opened. Return to Create cases.|

  @JIRA-STORY:PO-10605
  Scenario Outline: Permission in another business unit cannot open inputter routes
    Given my create permission belongs only to another business unit
    When I open the protected inputter path "<path>"
    Then inputter access is denied without collection or persistence requests
    Examples:
      | path                                     |
      | dashboard                                |
      | all rejected                             |
      | details                                  |
      | amendment                                |

  @JIRA-STORY:PO-10605
  Scenario: Submission returns to default In review
    Given I started a new case from the rejected inputter dashboard
    And I am reviewing a complete casefile for submission
    When I submit the casefile for submission
    Then the submitted case reference is shown after one create request
    When I return to the inputter dashboard from confirmation
    Then In review starts on its default page and sort
