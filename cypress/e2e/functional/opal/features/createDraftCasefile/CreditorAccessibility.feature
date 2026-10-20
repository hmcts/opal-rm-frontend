@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Creditor accessibility
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9808
  Scenario: Creditor validation and details destination are accessible
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    Then I check the page for accessibility
    When I continue from creditor selection
    Then the creditor validation summary links to the required choice
    And I check the page for accessibility
    When I choose a Major creditor
    Then I check the page for accessibility
    When I choose to add a new minor creditor
    And I continue from creditor selection
    Then I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9813
  Scenario: Creditor announces removable minor creditor success accessibly
    Given active non-Central-Authority Major creditors are available
    And Countries are available for minor creditor details
    And I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    And I enter order term amount "12.30"
    And I continue from order term input
    Then the creditor page is ready with the scoped Major creditor query
    When I choose to add a new minor creditor
    And I continue from creditor selection
    And I provide valid organisation creditor details with a non-UK bank and no international identifiers
    And I save the minor creditor details
    And I open minor creditor removal
    And I confirm minor creditor removal
    Then I return to Creditor with minor creditor removal success
    And I check the page for accessibility
    When I dismiss minor creditor removal success
    Then I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10279
  Scenario: applicant and Major Creditor selection states are accessible
    Given I have the live RM casefile permission
    And a sample Major Creditor is available for selection
    And I am choosing a creditor for an Order Term
    Then no existing Minor Creditor choice is displayed
    And I check the page for accessibility
    When I reveal the Major Creditor choices
    Then the Major Creditor choices are visible
    And I check the page for accessibility
    When I accept an available Major Creditor
    Then the selected Major Creditor is retained
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10279
  Scenario: existing Minor Creditor selection and retained summaries are accessible
    Given I have the live RM casefile permission
    And I am choosing a creditor for a second term with an existing Minor Creditor
    Then I check the page for accessibility
    When I choose the existing Minor Creditor
    Then I check the page for accessibility
    When I accept the existing Minor Creditor
    Then both Order Terms retain the same Minor Creditor
    And I check the page for accessibility
    And the existing Minor Creditor has not been duplicated
