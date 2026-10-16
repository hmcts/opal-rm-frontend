@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Capture minor creditor details
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Save an international creditor without BIC or IBAN
    Given I am adding a minor creditor to an accepted order term
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    Then I reach Minor Creditor Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Keep entered values after declining Cancel
    Given I am adding a minor creditor to an accepted order term
    When I enter an unsaved minor creditor name
    And I cancel minor creditor details and decline the warning
    Then my minor creditor name remains on the details page

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9809
  Scenario: Discard unsaved creditor details after accepting Cancel
    Given I am adding a minor creditor to an accepted order term
    When I enter an unsaved minor creditor name
    And I cancel minor creditor details and accept the warning
    Then I return to Creditor without a new minor creditor

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9810
  Scenario: Return from removal without changing the reviewed creditor
    Given I am adding a minor creditor to an accepted order term
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I open minor creditor removal
    And I cancel minor creditor removal
    Then I reach Minor Creditor Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9810
  Scenario: Cancel the reviewed creditor before acceptance
    Given I am adding a minor creditor to an accepted order term
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I cancel minor creditor review
    Then I return to Creditor without a new minor creditor

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9810
  Scenario: Accept a reviewed creditor
    Given I am adding a minor creditor to an accepted order term
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I accept the reviewed minor creditor
    Then the reviewed minor creditor is accepted without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9813
  Scenario: Remove a reviewed pending minor creditor
    Given I am adding a minor creditor to an accepted order term
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I open minor creditor removal
    And I confirm minor creditor removal
    Then I return to Creditor with minor creditor removal success
    When I dismiss minor creditor removal success
    Then I return to Creditor without a new minor creditor

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9813
  Scenario: Keep a reviewed minor creditor after cancelling removal
    Given I am adding a minor creditor to an accepted order term
    When I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I open minor creditor removal
    And I cancel minor creditor removal
    Then I reach Minor Creditor Summary without creating a draft casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10280
  Scenario Outline: Create and retain a <kind> Minor Creditor
    Given I have the live RM casefile permission
    And I have reviewed a new "<kind>" Minor Creditor
    When I continue from the reviewed Minor Creditor
    Then the "<kind>" Minor Creditor is retained for its Order Term

    Examples:
      | kind         |
      | Individual   |
      | Organisation |

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10280
  Scenario Outline: Change a locally reviewed <kind> Minor Creditor
    Given I have the live RM casefile permission
    And I have reviewed a new "<kind>" Minor Creditor
    When I change the reviewed "<kind>" Minor Creditor
    Then the updated "<kind>" Minor Creditor is in the local review
    When I continue from the reviewed Minor Creditor
    Then the updated "<kind>" Minor Creditor is retained for its Order Term

    Examples:
      | kind         |
      | Individual   |
      | Organisation |

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10280
  Scenario: Remove a locally reviewed Minor Creditor
    Given I have the live RM casefile permission
    And I have reviewed a new "Organisation" Minor Creditor
    When I open removal for the reviewed Minor Creditor
    And I confirm removal of the reviewed Minor Creditor
    Then the removed "Organisation" Minor Creditor is not restored

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10280
  Scenario: Abandon Minor Creditor removal without losing details
    Given I have the live RM casefile permission
    And I have reviewed a new "Organisation" Minor Creditor
    When I open removal for the reviewed Minor Creditor
    And I abandon removal of the reviewed Minor Creditor
    Then the "Organisation" Minor Creditor review is unchanged
    When I continue from the reviewed Minor Creditor
    Then the "Organisation" Minor Creditor is retained for its Order Term
