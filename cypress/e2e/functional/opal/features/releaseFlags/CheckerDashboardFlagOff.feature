@R1CRmCreateCaseFilesOff @JIRA-LABEL:create-draft-casefile @functional
Feature: Disabled checker dashboard release
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario Outline: Disabled release denies checker destinations without consultations
    Given my checker dashboard session has role "<role>"
    When I open the protected checker destination "<destination>"
    Then checker access is denied without collection or persistence requests
    And I check the page for accessibility
    Examples:
      | role    | destination |
      | checker | dashboard   |
      | checker | review      |
      | checker | view        |
      | dual    | dashboard   |
      | dual    | review      |
      | dual    | view        |
