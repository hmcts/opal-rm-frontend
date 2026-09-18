@JIRA-LABEL:create-draft-casefile
Feature: Create Draft Casefile Central Authority accessibility

  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    When I open Central Authority details in a new REMO Out casefile

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9804
  Scenario: Central Authority valid and validation-error states have no detected Axe violations
    Then I check the page for accessibility
    When I submit over-limit Central Authority references
    Then I check the page for accessibility
