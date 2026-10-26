@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Correct and resubmit rejected casefiles
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10610 @JIRA-STORY:PO-10611 @JIRA-EPIC:PO-10817
  Scenario Outline: Correct a rejected case through the existing task journey
    Given a rejected casefile was submitted by "<inputter>" in my RM business unit
    When I amend that case from the rejected cases list
    And I correct the respondent and check the corrected case details
    Then the corrected respondent and unchanged case details are shown
    When I resubmit the corrected case
    Then one replacement request uses the same case identifier and saved version
    Examples:
      | inputter |
      | me       |
      | another  |

  @JIRA-STORY:PO-10610 @JIRA-EPIC:PO-10817
  Scenario Outline: Deny an unauthorised or ineligible direct amendment
    Given rejected amendment entry is unavailable because of "<reason>"
    When I open the rejected amendment URL directly
    Then rejected amendment entry is denied for "<reason>"
    Examples:
      | reason              |
      | checker-only        |
      | wrong-business-unit |
      | non-rejected        |
      | malformed-id        |

  @JIRA-STORY:PO-10610 @JIRA-EPIC:PO-10817
  Scenario: Reload an uncertain submission only after accepting departure protection
    Given I have corrected a rejected case with an uncertain submission outcome
    When I go Back and choose to keep my corrections
    Then my corrections remain and no replacement request is replayed
    When I go Back and choose to discard my corrections
    Then one fresh read restores the saved respondent without resubmitting

  @JIRA-STORY:PO-10610 @JIRA-STORY:PO-10611 @JIRA-EPIC:PO-10817
  Scenario Outline: Inputter resubmission confirmation clears without repeating the replacement
    Given a rejected casefile was submitted by "<submitter>" in my RM business unit
    When I amend that case from the rejected cases list
    And I correct the respondent and check the corrected case details
    And I resubmit the corrected case
    Then one replacement request uses the same case identifier and saved version
    And the resubmission confirmation clears on "<operation>" without replay
    Examples:
      | submitter | operation |
      | me        | dismiss   |
      | another   | dismiss   |
      | me        | refresh   |
      | another   | refresh   |

  @JIRA-STORY:PO-10623 @JIRA-EPIC:PO-10817 @AC1 @retries(0)
  Scenario: Resubmit my corrected complete rejected case through its original dashboard
    Given an owned rejected case is ready for the "same-user" amendment outcome
    When I resubmit the complete corrected rejected case
    Then the corrected case returns to review with its original identifier and the originating rejection list no longer contains the case

  @JIRA-STORY:PO-10623 @JIRA-EPIC:PO-10817 @AC1 @AC3 @retries(0)
  Scenario: Resubmit another inputter's rejected case and prevent latest-submitter self-review
    Given an owned rejected case is ready for the "cross-user" amendment outcome
    When I resubmit the complete corrected rejected case
    Then the corrected case returns to review with its original identifier, leaves the originating rejection list, and the correcting inputter becomes latest submitter and cannot review that case

  @JIRA-STORY:PO-10623 @JIRA-EPIC:PO-10817 @AC2 @retries(0)
  Scenario: Retain complete corrections after definite failure and explicitly retry once
    Given an owned rejected case is ready for the "retry" amendment outcome
    When I explicitly retry the complete correction after a definite failure
    Then the corrected case returns to review with its original identifier and the originating rejection list no longer contains the case

  @JIRA-STORY:PO-10623 @JIRA-EPIC:PO-10817 @AC4 @retries(0)
  Scenario: Protect a winning resubmission from a stale amendment and reload without replay
    Given an owned rejected case is ready for the "stale" amendment outcome
    When I submit my old correction after another correction has returned the case to review
    Then I recover the saved winning correction without replay

  @JIRA-STORY:PO-10623 @JIRA-EPIC:PO-10817 @AC4 @retries(0)
  Scenario: Deny rejected amendment to an inputter from another Business Unit
    Given an owned rejected case is ready for the "denied" amendment outcome
    When I attempt to amend the protected rejected case
    Then amendment is denied without exposing or changing the case

  @JIRA-STORY:PO-10623 @JIRA-EPIC:PO-10817 @AC4 @retries(0)
  Scenario: Deny amendment after the rejected case has actually returned to review
    Given an owned rejected case is ready for the "non-rejected" amendment outcome
    When I attempt to amend the protected rejected case
    Then amendment is denied without exposing or changing the case
