@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Minor creditor accessibility
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Minor Creditor Details is accessible
    Given I am adding a minor creditor to an accepted order term
    Then I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Minor Creditor validation errors are accessible
    Given I am adding a minor creditor to an accepted order term
    When I save the minor creditor details
    Then the minor creditor validation summary shows all required errors
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Minor Creditor Summary is accessible
    Given I am adding a minor creditor to an accepted order term
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    Then I reach Minor Creditor Summary without creating a draft casefile
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9810
  Scenario: Review and removal preserve an accessible minor creditor journey
    Given I am adding a minor creditor to an accepted order term
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    Then I reach Minor Creditor Summary without creating a draft casefile
    And I check the page for accessibility
    When I open minor creditor removal
    Then I reach the minor creditor removal confirmation
    And I check the page for accessibility
    When I return from minor creditor removal
    Then I reach Minor Creditor Summary without creating a draft casefile
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9813
  Scenario: Removal confirmation and success are accessible
    Given I am adding a minor creditor to an accepted order term
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I open minor creditor removal
    Then I reach the minor creditor removal confirmation
    And I check the page for accessibility
    When I confirm minor creditor removal
    Then I return to Creditor with minor creditor removal success
    And I check the page for accessibility
    When I dismiss minor creditor removal success
    Then I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10280
  Scenario Outline: <kind> Minor Creditor details review and removal are accessible
    Given I have the live RM casefile permission
    And I have reviewed a new "<kind>" Minor Creditor
    Then I check the page for accessibility
    When I reopen Minor Creditor details for accessibility
    Then I check the page for accessibility
    When I check Minor Creditor bank branches for accessibility
    And I save the "<kind>" Minor Creditor after accessibility checks
    Then I check the page for accessibility
    When I open removal for the reviewed Minor Creditor
    Then I check the page for accessibility
    When I abandon removal of the reviewed Minor Creditor
    Then the "<kind>" Minor Creditor review is unchanged
    And I check the page for accessibility
    When I open removal for the reviewed Minor Creditor
    And I confirm removal of the reviewed Minor Creditor
    Then I check the page for accessibility
    And the removed "<kind>" Minor Creditor is not restored

    Examples:
      | kind         |
      | Individual   |
      | Organisation |
