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

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-STORY:PO-10611 @JIRA-EPIC:PO-10817
  Scenario Outline: Checker receives confirmation after the recorded decision
    Given my persisted casefile session has role "checker", status "<status>" and submitter "other"
    And saved checker decision has the "success" API outcome
    When I open saved details from the checker To review list
    And I continue with saved decision "<decision>" and reason "<reason>"
    Then the checker sees the confirmed "<outcome>" decision return
    Examples:
      | status      | decision | reason | outcome  |
      | SUBMITTED   | approve  | empty  | approved |
      | RESUBMITTED | approve  | empty  | approved |
      | SUBMITTED   | reject   | valid  | rejected |
      | RESUBMITTED | reject   | valid  | rejected |
      | SUBMITTED   | reject   | 250    | rejected |

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

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-STORY:PO-10611 @JIRA-EPIC:PO-10817
  Scenario: Switching to Approve clears the conditional rejection error
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    And saved checker decision has the "success" API outcome
    When I open saved casefile "17" through "review"
    And I continue with saved decision "reject" and reason "empty"
    Then the saved decision error "Enter reason for rejection" is linked from the focused summary
    When I change the saved review decision to Approve and continue
    Then the checker sees the confirmed "approved" decision return

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10609 @JIRA-EPIC:PO-10817
  Scenario: Checker cancels deletion and returns to the selected review
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    When I open saved casefile "17" through "review"
    Then the saved case is in "review" mode without summary editing
    When I choose Delete casefile from saved review
    Then the saved deletion reason screen is shown
    When I cancel the saved case deletion
    Then the selected review is restored after 3 selected GET requests without mutation

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10609 @JIRA-EPIC:PO-10817
  Scenario: An eligible checker cancels direct deletion to the selected review
    Given my persisted casefile session has role "checker", status "RESUBMITTED" and submitter "other"
    When I open saved casefile "17" through "delete"
    Then the saved deletion reason screen is shown
    When I cancel the saved case deletion
    Then the selected review is restored after 2 selected GET requests without mutation

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10609 @JIRA-EPIC:PO-10817
  Scenario Outline: Checker deletes submitted work from the review queue
    Given my persisted casefile session has role "checker", status "<status>" and submitter "other"
    And saved deletion has the "success" API outcome
    When I open saved details from the checker To review list
    And I choose Delete casefile from saved review
    And I enter saved deletion reason "Synthetic deletion reason"
    And I confirm the saved case deletion
    Then the checker sees the confirmed deleted return
    Examples:
      | status      |
      | SUBMITTED   |
      | RESUBMITTED |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10609 @JIRA-EPIC:PO-10817
  Scenario: Checker retains the reason after a shared request error
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    And saved deletion has the "error" API outcome
    When I open saved details from the checker To review list
    And I choose Delete casefile from saved review
    And I enter saved deletion reason "Synthetic deletion reason"
    And I confirm the saved case deletion
    Then the saved deletion reason remains editable without replay

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10608 @JIRA-STORY:PO-10609 @JIRA-EPIC:PO-10817
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

  @R1CRmCreateCaseFilesOff @JIRA-STORY:PO-10608 @JIRA-STORY:PO-10609 @JIRA-EPIC:PO-10817
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

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10611 @JIRA-EPIC:PO-10817
  Scenario Outline: Checker confirmation is transient and cannot replay its mutation
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    And saved checker decision has the "success" API outcome
    When I open saved details from the checker To review list
    And I continue with saved decision "<decision>" and reason "<reason>"
    Then the checker sees the confirmed "<outcome>" decision return
    And the checker decision confirmation clears on "<departure>" without replay
    Examples:
      | decision | reason | outcome  | departure |
      | approve  | empty  | approved | dismiss   |
      | approve  | empty  | approved | refresh   |
      | approve  | empty  | approved | history   |
      | approve  | empty  | approved | departure |
      | reject   | valid  | rejected | dismiss   |
      | reject   | valid  | rejected | refresh   |
      | reject   | valid  | rejected | history   |
      | reject   | valid  | rejected | departure |

  @R1CRmCreateCaseFiles @JIRA-STORY:PO-10611 @JIRA-EPIC:PO-10817
  Scenario Outline: Uncertain checker completion cannot show success or replay
    Given my persisted casefile session has role "checker", status "SUBMITTED" and submitter "other"
    And saved checker decision has the "<receipt>" API outcome
    When I open saved details from the checker To review list
    And I continue with saved decision "approve" and reason "empty"
    Then the saved checker decision fails without success or replay
    And I check the page for accessibility
    Examples:
      | receipt   |
      | error     |
      | malformed |
