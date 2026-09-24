@JIRA-LABEL:create-draft-casefile @functional
Feature: Create case files release access
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @R1CRmCreateCaseFiles
  Scenario: Only Cases is available when the create case files release is enabled
    When I open the RM path "/dashboard"
    Then only the Cases section and create case entry point are available
    When I follow the create case entry point
    Then the create case type page is available without primary navigation

  @R1CRmCreateCaseFiles
  Scenario: The enabled create case journey supports a direct URL and refresh
    When I open the RM path "/cases/create-casefile/case-type"
    Then the create case type page is available without primary navigation
    When I refresh the RM page
    Then the create case type page is available without primary navigation

  @R1CRmCreateCaseFiles
  Scenario Outline: Other sections remain unavailable when the create case release is enabled
    When I open the RM path "<path>"
    Then the unreleased RM section is denied with only Cases in navigation

    Examples:
      | path                      |
      | /dashboard/search         |
      | /dashboard/reports        |
      | /dashboard/administration |

  @R1CRmCreateCaseFilesOff
  Scenario Outline: The disabled release blocks dashboard and create case URLs
    When I open the RM path "<path>"
    Then RM access is denied without primary navigation or a create case entry point
    When I refresh the RM page
    Then RM access is denied without primary navigation or a create case entry point

    Examples:
      | path                                            |
      | /dashboard                                      |
      | /dashboard/cases                                |
      | /cases/create-casefile                          |
      | /cases/create-casefile/case-type                 |
      | /cases/create-casefile/task-list                 |
      | /cases/create-casefile/check-case-details        |
      | /cases/create-casefile/submission-confirmation   |

  @R1CRmCreateCaseFilesOff
  Scenario: Returning to the dashboard with no released sections remains access denied
    When I open the RM path "/dashboard"
    Then RM access is denied without primary navigation or a create case entry point
    When I return to the dashboard from Access Denied
    Then RM access is denied without primary navigation or a create case entry point
