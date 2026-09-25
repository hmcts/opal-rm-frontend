@JIRA-LABEL:create-draft-casefile @functional
Feature: Create case files release accessibility
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @R1CRmCreateCaseFiles
  Scenario: The released Cases dashboard and entry page are accessible
    When I open the RM path "/dashboard"
    Then only the Cases section and create case entry point are available
    And I check the page for accessibility
    When I follow the create case entry point
    Then the create case type page is available without primary navigation
    And I check the page for accessibility

  @R1CRmCreateCaseFilesOff
  Scenario: The no-release Access Denied page is accessible
    When I open the RM path "/dashboard"
    Then RM access is denied without primary navigation or a create case entry point
    And I check the page for accessibility
