Feature: Sign In Smoke Test
  Scenario: The user can sign in to the application
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    Then The sign out link should be visible
