Feature: Sign In Smoke Test - Legacy Mode
  Scenario: The user can sign in to the application in legacy mode
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    Then I should see the service header containing text "Opal RM"
    And The sign out link should be visible
