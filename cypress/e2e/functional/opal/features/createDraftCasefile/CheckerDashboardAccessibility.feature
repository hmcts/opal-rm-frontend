@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Checker dashboard accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario Outline: Checker dashboard states remain accessible
    Given the checker dashboard is in the "<state>" state
    Then I check the page for accessibility
    And I capture the checker "<state>" state
    Examples:
      | state       |
      | loading     |
      | empty       |
      | populated   |
      | list-error  |
      | count-error |

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: Cases entry and populated queues support keyboard and narrow screen use
    Given my checker dashboard session has role "checker"
    When I inspect Cases entry and each populated checker table
    Then I check the page for accessibility
    And the checker dashboard reflows with a keyboard reachable scroll region
    And I check the page for accessibility

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario Outline: Review and view shells remain accessible with valid or invalid identifiers
    Given my checker dashboard session has role "checker"
    When I open the safe checker "<kind>" shell with identifier "<id>"
    Then I check the page for accessibility
    And I capture the "<capture>" checker shell
    Examples:
      | kind   | id  | capture          |
      | review | 123 | review           |
      | view   | 123 | view             |
      | review | 0   | malformed-review |
      | view   | bad | malformed-view   |
