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
  Scenario: Retry collection and rejected count independently
    Given my inputter list and rejected count temporarily fail
    When I open the inputter dashboard
    Then the list error is announced and both retries are available
    When I retry the inputter list using the keyboard
    Then my inputter list is restored while the count error remains
    When I retry the rejected count using the keyboard
    Then the rejected count is restored without reloading the list

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
