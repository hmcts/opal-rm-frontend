@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Inputter dashboard accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10605 @JIRA-EPIC:PO-10817
  Scenario Outline: Dashboard states remain accessible
    Given the inputter dashboard is in the "<state>" state
    Then I check the page for accessibility
    Examples:
      | state     |
      | loading   |
      | empty     |
      | populated |
      | error     |
      | published |

  @JIRA-STORY:PO-10605 @JIRA-EPIC:PO-10817
  Scenario: Populated tables and narrow screen reflow
    Given my inputter casefile collection is available
    When I open the inputter dashboard
    And I inspect each populated inputter table
    Then I check the page for accessibility
    And the inputter dashboard reflows at 320 CSS pixels
    And I check the page for accessibility

  @JIRA-STORY:PO-10605 @JIRA-EPIC:PO-10817
  Scenario: Dashboard and fresh creation remain accessible
    Given my inputter casefile collection is available
    When I open Create cases from the Cases page
    Then I check the page for accessibility
    When I choose to create a case
    Then I see an empty Case Type page
    And I check the page for accessibility
    And I capture the fresh Case Type page

  @JIRA-STORY:PO-10605 @JIRA-EPIC:PO-10817
  Scenario: The all rejected destination remains accessible
    Given my rejected inputter list is "populated"
    When I view all rejected cases
    Then the protected all rejected cases page is shown in the same tab
    And I check the page for accessibility
    And I capture the "all-rejected" inputter shell

  @JIRA-STORY:PO-10605 @JIRA-EPIC:PO-10817
  Scenario Outline: Persisted placeholders remain accessible
    Given my inputter casefile collection is available
    When I open the persisted "<kind>" destination with identifier "<id>"
    Then I check the page for accessibility
    And I capture the "<capture>" inputter shell
    Examples:
      | kind      | id  | capture             |
      | details   | 123 | details             |
      | details   | 0   | malformed-details   |
      | amendment | 123 | amendment           |
      | amendment | bad | malformed-amendment |
