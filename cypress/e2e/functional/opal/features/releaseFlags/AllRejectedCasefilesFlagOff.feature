@R1CRmCreateCaseFilesOff @JIRA-LABEL:create-draft-casefile @functional
Feature: All rejected cases release boundary
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10607 @JIRA-EPIC:PO-10817
  Scenario Outline: Deny direct all rejected URLs for permitted roles before retrieval
    Given my rejected consultation role is "<role>"
    When I open the all rejected cases URL directly
    Then access is denied without rejected collection or persisted case requests
    Examples:
      | role     |
      | inputter |
      | dual     |
