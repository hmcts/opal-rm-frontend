@smoke
Feature: Sign In Smoke Test
  Scenario: The user can sign in to the dashboard and sign out
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    Then The sign out link should be visible
    When I sign out from the header
    Then I am returned to the OPAL sign-in page
