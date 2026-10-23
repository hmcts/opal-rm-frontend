@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional @accessibility
Feature: Accessible rejected casefile correction
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10610 @JIRA-STORY:PO-10611 @JIRA-EPIC:PO-10817
  Scenario: Correct a rejected case with keyboard and reflow checks
    Given a rejected casefile was submitted by "me" in my RM business unit
    When I amend that case from the rejected cases list
    Then the rejected amendment state is accessible at 1280 CSS pixels
    And the rejected amendment state is accessible at 320 CSS pixels
    When I correct the respondent and check the corrected case details
    Then the rejected amendment state is accessible at 320 CSS pixels
    And the amendment review actions are reachable using the keyboard
    When I resubmit the corrected case
    Then one replacement request uses the same case identifier and saved version
    And the rejected amendment state is accessible at 320 CSS pixels
    And the resubmission confirmation clears on "dismiss" without replay
    And the rejected amendment state is accessible at 320 CSS pixels

  @JIRA-STORY:PO-10610 @JIRA-EPIC:PO-10817
  Scenario: Malformed amendment entry shows an accessible error
    Given rejected amendment entry is unavailable because of "malformed-id"
    When I open the rejected amendment URL directly
    Then rejected amendment entry is denied for "malformed-id"
    And the rejected amendment state is accessible at 1280 CSS pixels

  @JIRA-STORY:PO-10610 @JIRA-EPIC:PO-10817
  Scenario: Failed resubmission retains an accessible review and existing Back action
    Given I have corrected a rejected case with an uncertain submission outcome
    When I go Back and choose to keep my corrections
    Then my corrections remain and no replacement request is replayed
    And the rejected amendment state is accessible at 320 CSS pixels
