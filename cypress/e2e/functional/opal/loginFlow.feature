Feature: Login And Sign Out
  Scenario: The user lands on a dashboard page and can sign out again
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"
    Then I should be on the dashboard landing page
    And The sign out link should be visible
    When I sign out from the header
    Then I am returned to the OPAL sign-in page
