@JIRA-LABEL:create-draft-casefile @functional
Feature: Check persisted case details
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario: An inputter reads a saved case and returns to its originating dashboard
    Given my persisted casefile session has role "inputter", status "SUBMITTED" and submitter "self"
    When I open saved details from my In review dashboard
    Then I see the saved parties, order terms and chronological case history
    And the saved case is in "view" mode without summary editing
    When I return from the saved case details
    Then the saved case stays unchanged when the "inputter" dashboard is shown

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario Outline: Owning business unit permissions and route intent control saved actions
    Given my persisted casefile session has role "<role>", status "<status>" and submitter "<submitter>"
    When I open saved casefile "17" through "<destination>"
    Then the saved case is in "<mode>" mode without summary editing
    Examples:
      | role     | status            | submitter | destination   | mode   |
      | inputter | SUBMITTED         | other     | inputter-view | view   |
      | checker  | SUBMITTED         | other     | inputter-view | view   |
      | dual     | SUBMITTED         | other     | inputter-view | view   |
      | inputter | SUBMITTED         | other     | view          | view   |
      | checker  | SUBMITTED         | other     | view          | view   |
      | dual     | SUBMITTED         | other     | view          | view   |
      | inputter | SUBMITTED         | other     | review        | view   |
      | checker  | SUBMITTED         | other     | review        | review |
      | dual     | RESUBMITTED       | other     | review        | review |
      | checker  | SUBMITTED         | self      | review        | view   |
      | dual     | RESUBMITTED       | self      | review        | view   |
      | checker  | REJECTED          | other     | review        | view   |
      | checker  | DELETED           | other     | review        | view   |
      | checker  | PUBLISHED         | other     | review        | view   |
      | checker  | PUBLISHING_FAILED | other     | review        | view   |
      | checker  | PUBLISHING_PENDING| other     | review        | view   |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario Outline: Readable fallback returns to an available dashboard
    Given my persisted casefile session has role "<role>", status "SUBMITTED" and submitter "other"
    When I open saved casefile "17" through "<destination>"
    Then the saved case is in "view" mode without summary editing
    When I return from the saved case details
    Then the saved case stays unchanged when the "<dashboard>" dashboard is shown
    Examples:
      | role     | destination   | dashboard |
      | inputter | review        | inputter  |
      | checker  | inputter-view | checker   |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario Outline: Approve and valid Reject return locally without changing the review queue
    Given my persisted casefile session has role "checker", status "<status>" and submitter "other"
    When I open saved casefile "17" through "review"
    And I continue with saved decision "<decision>" and reason "<reason>"
    Then the saved case stays unchanged when the "checker" dashboard is shown
    And no saved casefile mutation has been requested
    Examples:
      | status      | decision | reason |
      | SUBMITTED   | approve  | empty  |
      | RESUBMITTED | reject   | valid  |
      | SUBMITTED   | reject   | 250    |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario Outline: Decision validation identifies and focuses the missing or invalid field
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    When I open saved casefile "17" through "review"
    And I continue with saved decision "<decision>" and reason "<reason>"
    Then the saved decision error "<error>" is linked from the focused summary
    Examples:
      | decision | reason     | error                                                |
      | none     | empty      | Select a review decision                             |
      | reject   | empty      | Enter reason for rejection                           |
      | reject   | whitespace | Enter reason for rejection                           |
      | reject   | 251        | Reason for rejection must be 250 characters or fewer |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario: Switching to Approve clears the conditional rejection error
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    When I open saved casefile "17" through "review"
    And I continue with saved decision "reject" and reason "empty"
    Then the saved decision error "Enter reason for rejection" is linked from the focused summary
    When I change the saved review decision to Approve and continue
    Then the saved case stays unchanged when the "checker" dashboard is shown

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario: Interim Delete returns without changing the saved case
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    When I open saved casefile "17" through "review"
    And I choose Delete casefile from saved review
    Then the interim Delete casefile walkthrough is shown
    When I return from the interim Delete walkthrough
    Then the saved case stays unchanged when the "checker" dashboard is shown
    And no saved casefile mutation has been requested

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario Outline: Direct Delete is limited to eligible checker work
    Given my persisted casefile session has role "<role>", status "<status>" and submitter "<submitter>"
    When I open saved casefile "17" through "delete"
    Then saved case access is denied after 1 selected GET requests
    Examples:
      | role     | status    | submitter |
      | inputter | SUBMITTED | other     |
      | checker  | SUBMITTED | self      |
      | checker  | REJECTED  | other     |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario: An eligible checker opens Delete directly
    Given my persisted casefile session has role "checker", status "RESUBMITTED" and submitter "other"
    When I open saved casefile "17" through "delete"
    Then the interim Delete casefile walkthrough is shown
    When I return from the interim Delete walkthrough
    Then the saved case stays unchanged when the "checker" dashboard is shown

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario Outline: Other business unit permission denies saved URLs before GET
    Given my persisted casefile session has role "cross-bu", status "SUBMITTED" and submitter "other"
    When I open saved casefile "17" through "<destination>"
    Then saved case access is denied after 0 selected GET requests
    Examples:
      | destination   |
      | inputter-view |
      | view          |
      | review        |
      | delete        |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario: A loaded record from another business unit cannot activate saved details
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    And the saved casefile has a "wrong-business-unit" failure
    When I open saved casefile "17" through "review"
    Then saved case access is denied after 1 selected GET requests

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario Outline: Malformed saved identifiers fail before selected GET
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    When I attempt saved casefile "<id>" through "review" from the Cases page
    Then saved details fail safely after 0 selected GET requests
    Examples:
      | id               |
      | 0                |
      | bad              |
      | 9007199254740992 |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario Outline: Missing, failed or unmappable saved data cannot activate details
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    And the saved casefile has a "<failure>" failure
    When I attempt saved casefile "17" through "review" from the Cases page
    Then saved details fail safely after 1 selected GET requests
    Examples:
      | failure     |
      | unavailable |
      | http        |
      | mapping     |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario Outline: Untrusted query flags cannot enable saved review actions
    Given my persisted casefile session has role "<role>", status "SUBMITTED" and submitter "other"
    When I open saved "<destination>" with untrusted mode query flags
    Then the saved case is in "view" mode without summary editing
    Examples:
      | role     | destination |
      | checker  | view        |
      | inputter | review      |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario: Draft switching reuses the component and later creation starts cleanly
    Given my persisted casefile session has role "dual", status "SUBMITTED" and submitter "other"
    When I open saved casefile "17" through "review"
    Then switching to another saved draft and starting creation clears the previous saved state

  @R1CRmCreateCaseFilesOff @JIRA-STORY:PO-10608 @JIRA-EPIC:PO-10817
  Scenario Outline: Disabled release denies saved destinations before GET
    Given my persisted casefile session has role "dual", status "SUBMITTED" and submitter "other"
    When I open saved casefile "17" through "<destination>"
    Then saved case access is denied after 0 selected GET requests
    Examples:
      | destination   |
      | inputter-view |
      | view          |
      | review        |
      | delete        |
