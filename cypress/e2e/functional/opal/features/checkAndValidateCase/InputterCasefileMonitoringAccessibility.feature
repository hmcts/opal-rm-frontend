@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Consult live inputter casefiles accessibly
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC1 @AC6 @retries(0)
  Scenario: Consult every populated owned lifecycle tab accessibly
    Given my live monitoring scenario owns one casefile in each lifecycle tab
    Then the live "in-review" monitoring tab contains its owned lifecycle row
    And I check the page for accessibility
    When I consult the live "rejected" monitoring tab with the keyboard
    Then the live "rejected" monitoring tab contains its owned lifecycle row
    And I check the page for accessibility
    When I consult the live "approved" monitoring tab with the keyboard
    Then the live "approved" monitoring tab contains its owned lifecycle row
    And I check the page for accessibility
    When I consult the live "deleted" monitoring tab with the keyboard
    Then the live "deleted" monitoring tab contains its owned lifecycle row
    And I check the page for accessibility

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC1 @AC6 @PO10628SubmittedOnly @retries(0)
  Scenario: Consult genuinely empty personal lifecycle tabs accessibly
    Given my live personal monitoring dashboard is genuinely empty
    Then the live consulted monitoring tab is genuinely empty
    And I check the page for accessibility
    When I consult the live "rejected" monitoring tab with the keyboard
    Then the live consulted monitoring tab is genuinely empty
    And I check the page for accessibility
    When I consult the live "approved" monitoring tab with the keyboard
    Then the live consulted monitoring tab is genuinely empty
    And I check the page for accessibility
    When I consult the live "deleted" monitoring tab with the keyboard
    Then the live consulted monitoring tab is genuinely empty
    And I check the page for accessibility

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC2 @AC3 @AC6 @retries(0)
  Scenario: Sort paginate and return from another inputter amendment accessibly
    Given my live scenario owns paginated rejections and another inputter's rejected case
    Then I check the page for accessibility
    When I sort my live personal rejections "ascending" by applicant with the keyboard
    Then I check the page for accessibility
    When I sort my live personal rejections "descending" by applicant with the keyboard
    Then I check the page for accessibility
    When I visit the "next" live personal rejection page with the keyboard
    Then I check the page for accessibility
    When I visit the "previous" live personal rejection page with the keyboard
    Then I check the page for accessibility
    When I visit the "next" live personal rejection page with the keyboard
    Then I check the page for accessibility
    When I follow View all rejected cases from my live dashboard
    Then the real Business Unit rejection list contains the expected owned cases with every visited page accessible
    And I check the page for accessibility
    When I open the other inputter owned rejection with every visited sort and page accessible
    Then I check the page for accessibility
    When I return from live amendment to All rejected with the keyboard
    Then I check the page for accessibility
    When I return from live All rejected to my dashboard with the keyboard
    Then the matching persisted draft and originating dashboard page and sort are retained
    And I check the page for accessibility

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC4 @AC6 @retries(0)
  Scenario: Read a real published multi-account row accessibly
    Given my live monitoring scenario owns a published casefile with two minor creditors
    When I inspect its Approved row
    Then all generated respondent applicant and minor creditor numbers match the saved snapshot as read-only text
    And I check the page for accessibility

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC5 @AC6 @PO10628SubmittedOnly @retries(0)
  Scenario: Reach the actual denied monitoring destination accessibly
    Given live authorised monitoring entry succeeds and my provisioned denied user lacks permission 21
    When the denied user opens the inputter monitoring dashboard
    Then access is denied without casefile counts or rows
    And I check the page for accessibility
