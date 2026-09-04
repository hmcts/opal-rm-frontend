@JIRA-LABEL:create-draft-casefile
Feature: Create Draft Casefile Central Authority details

  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9804
  Scenario: Enter, replay and edit Central Authority details
    When I open Central Authority details in a new REMO Out casefile
    And I save Central Authority details with references "REMO-1" and "CA-1" and authority "0123 - Central Authority One"
    Then Central Authority is marked Provided on Case details
    When I reopen Central Authority details
    Then the references "REMO-1" and "CA-1" and authority "0123 - Central Authority One" are editable
    When I save Central Authority details with references "REMO-2" and "CA-2" and authority "0456 - Central Authority Two"
    And I reopen Central Authority details
    Then the references "REMO-2" and "CA-2" and authority "0456 - Central Authority Two" are editable
