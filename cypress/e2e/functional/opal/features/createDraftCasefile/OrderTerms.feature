@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Select an order term
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9806
  Scenario: Continue to the selected Result and return with the choice restored
    Given I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    Then the input destination identifies order term "MAT" without creating a draft
    When I return from the order term input destination
    Then order term "MAT" is selected

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9806
  Scenario: An empty selection cannot continue
    Given I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I continue from order term selection
    Then the order term validation summary links to the required choice

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9806
  Scenario: A pending choice is discarded on a full reload
    Given I open the Order Terms Summary for a new casefile
    When I start adding an order term
    And I choose order term "MAT"
    And I continue from order term selection
    Then reloading the order term destination returns to Case Type with navigation hidden

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10278
  Scenario: Add and reopen an Order Term using Result metadata
    Given I have the live RM casefile permission
    And I have started Order Terms with completed Order Details
    When I add a applicant Order Term with amount "10" as "firstTerm"
    Then Order Term "firstTerm" retains amount "10"
    When I reopen Order Term "firstTerm" with amount "10"
    Then Order Term "firstTerm" retains amount "10"
