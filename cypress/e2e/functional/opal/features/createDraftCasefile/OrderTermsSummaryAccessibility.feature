@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Review order terms accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9811 @JIRA-STORY:PO-9812
  Scenario: Summary and removal confirmation are accessible
    Given I have two accepted maintenance orders with different amounts
    Then I check the page for accessibility
    When I open removal for the second maintenance order
    Then I check the page for accessibility
    When I cancel order term removal
    Then both original orders remain on the summary
    And I check the page for accessibility
