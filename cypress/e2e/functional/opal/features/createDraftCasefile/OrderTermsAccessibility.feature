@R1CRmCreateCaseFiles
@JIRA-LABEL:create-draft-casefile @functional
Feature: Order term selection accessibility
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9806
  Scenario: Summary, selection, validation and input are accessible
    Given I open the Order Terms Summary for a new casefile
    Then I check the page for accessibility
    When I start adding an order term
    Then I check the page for accessibility
    When I continue from order term selection
    Then the order term validation summary links to the required choice
    And I check the page for accessibility
    When I choose order term "MAT"
    And I continue from order term selection
    Then the input destination identifies order term "MAT" without creating a draft
    And I check the page for accessibility

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-10278
  Scenario: Order Term selection input summary and removal are accessible
    Given I have the live RM casefile permission
    And I have started Order Terms with completed Order Details
    When I open Order Term selection
    Then I check the page for accessibility
    When I continue Order Term selection to MAT input
    Then I check the page for accessibility
    When I complete the MAT input with amount "10"
    And I accept the applicant for Order Term "firstTerm" with amount "10"
    Then Order Term "firstTerm" retains amount "10"
    And I check the page for accessibility
    When I open removal for Order Term "firstTerm"
    Then I check the page for accessibility
    When I abandon Order Term removal
    Then Order Term "firstTerm" retains amount "10"
    And I check the page for accessibility
    When I open removal for Order Term "firstTerm"
    And I confirm removal of Order Term "firstTerm"
    Then I check the page for accessibility
