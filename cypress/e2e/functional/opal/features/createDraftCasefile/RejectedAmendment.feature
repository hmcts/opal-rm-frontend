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
