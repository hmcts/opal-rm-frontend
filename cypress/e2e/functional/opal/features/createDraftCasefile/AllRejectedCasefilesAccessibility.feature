@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: All rejected consultation accessibility
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: Populated consultation and contained narrow table
    Given other inputters have rejected casefiles in my RM business unit
    When I open all rejected cases from my Rejected tab
    Then I see the complete other-inputter collection with six sortable columns and no case counts
    And I check the page for accessibility
    And I capture the populated rejected consultation
    And the rejected table remains contained at 320 CSS pixels

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: Empty consultation
    Given there are no other-inputter rejected cases
    When I open all rejected cases
    Then the rejected consultation shows its empty result without table or pagination
    And I check the page for accessibility
    And I capture the empty rejected consultation

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: Failure and pending Retry retain heading focus
    Given my all rejected consultation fails once
    When I open all rejected cases
    Then I see a recoverable list failure without an empty message
    And I check the page for accessibility
    And I capture the failed rejected consultation
    When I retry while the rejected provider response is pending
    Then I check the page for accessibility
    And I capture the pending rejected consultation
    When the rejected provider completes the pending consultation
    Then I see the refreshed other-inputter collection
    And I check the page for accessibility

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: Page transition and both navigation boundaries
    Given my dashboard and all rejected list have different page and sort selections
    Then I check the page for accessibility
    When I view the selected rejected details shell
    Then I check the page for accessibility
    When I return from the rejected shell to the refreshed consultation
    Then I check the page for accessibility
    When I return to my cases
    Then my originating Rejected dashboard selection is restored with fresh rows
    And I check the page for accessibility
