@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: All rejected casefiles
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: Consult the complete other-inputter rejection collection
    Given other inputters have rejected casefiles in my RM business unit
    When I open all rejected cases from my Rejected tab
    Then I see the complete other-inputter collection with six sortable columns and no case counts

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: Keep list and dashboard selections independent during a protected details visit
    Given my dashboard and all rejected list have different page and sort selections
    When I view an all rejected case and return to that list
    Then my all rejected selection is restored with fresh rows
    When I return to my cases
    Then my originating Rejected dashboard selection is restored with fresh rows

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: Refresh resets consultation memory
    Given I selected a later all rejected page and a different sort
    When I refresh all rejected cases
    Then the list starts with the oldest rejection on page one

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: Recover a failed consultation
    Given my all rejected consultation fails once
    When I open all rejected cases
    Then I see a recoverable list failure without an empty message
    When I retry the rejected consultation
    Then I see the refreshed other-inputter collection

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: Browser history refreshes remembered list selection
    Given I selected a later all rejected page and a different sort
    When I return from a rejected details shell through browser history
    Then my all rejected selection is restored with fresh rows

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: A smaller refreshed collection clamps the remembered page
    Given I selected a later all rejected page and a different sort
    When the rejected collection shrinks during my details visit
    Then the rejected selection retains its sort and clamps to the remaining page

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: An empty other-inputter collection has an explicit result
    Given there are no other-inputter rejected cases
    When I open all rejected cases
    Then the rejected consultation shows its empty result without table or pagination

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario: Provider access loss owns a delayed Retry denial
    Given my all rejected consultation fails once
    When I open all rejected cases
    Then I see a recoverable list failure without an empty message
    When I retry while the rejected provider response is pending
    And the provider revokes access during the pending rejected consultation
    Then the denied pending consultation exposes no rejected rows or retry control

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario Outline: Denied direct entry cannot consult rejected cases
    Given my rejected consultation role is "<role>"
    When I open all rejected cases
    Then access is denied without rejected collection or persisted case requests
    Examples:
      | role                |
      | cross-business-unit |
      | checker-only        |

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario Outline: Direct protected shells have a safe dashboard fallback
    Given other inputters have rejected casefiles in my RM business unit
    When I open a rejected "<kind>" shell without a remembered origin
    Then the protected rejected "<kind>" shell offers the safe dashboard fallback
    Examples:
      | kind      |
      | details   |
      | amendment |
