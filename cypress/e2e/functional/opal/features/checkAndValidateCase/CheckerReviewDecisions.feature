@R1CRmCreateCaseFiles @JIRA-STORY:PO-10625 @JIRA-EPIC:PO-10817 @JIRA-LABEL:create-draft-casefile @retries(0)
Feature: Independent checker decisions and decision protection
  Real owned cases use normal API setup and actual UI decisions. Lifecycle and publication cleanup require external preflight.

  @AC1
  Scenario: Publish an independently checked case and show every generated account number to its inputter
    Given my live checker scenario owns a submitted case with two minor creditors
    When its independent checker approves the case through review
    Then the case leaves To review and confirms approval
    And actual publication supplies every generated account number on its inputter dashboard

  @AC1
  Scenario: Approve an independently resubmitted case while retaining its previous history
    Given my live checker scenario owns a "RESUBMITTED" case for "publication"
    When its independent checker approves the case through review
    Then the case leaves To review and confirms approval
    And actual publication supplies every generated account number on its inputter dashboard

  @AC1
  Scenario Outline: Reject an independently <status> case with an exact recorded reason
    Given my live checker scenario owns a "<status>" case for "decision"
    When its independent checker chooses "reject" through review
    Then the case leaves To review and confirms rejection to its inputter

    Examples:
      | status      |
      | SUBMITTED   |
      | RESUBMITTED |

  @AC1
  Scenario Outline: Validate the blank rejection reason on an independently <status> case
    Given my live checker scenario owns a "<status>" case for "validation"
    When its checker submits a blank rejection reason
    Then linked rejection validation prevents every change to the saved case

    @PO10625SubmittedOnly
    Examples:
      | status    |
      | SUBMITTED |

    Examples:
      | status      |
      | RESUBMITTED |

  @AC1 @PO10625SubmittedOnly
  Scenario Outline: Protect the checker decision from a <kind> actor
    Given my live checker scenario owns a "<kind>" protected case
    When its checker attempts the protected review route
    Then checker protection exposes no decision and leaves the saved case unchanged

    @PO10625Self
    Examples:
      | kind |
      | self |

    Examples:
      | kind   |
      | denied |

  @AC1
  Scenario Outline: Preserve a competing rejection when the old checker attempts <decision>
    Given my live checker scenario owns a "SUBMITTED" case for "stale"
    When its checker submits stale "<decision>" after a competing rejection
    Then the safe conflict preserves the competing checker decision

    Examples:
      | decision |
      | approve  |
      | reject   |

  @JIRA-STORY:PO-10625 @JIRA-EPIC:PO-10817 @AC6 @retries(0)
  Scenario Outline: Retain only the checker <status> outcomes allowed by their calendar window
    Given my live checker outcome scenario owns a "<status>" case
    When the checker consults its outcomes on inside boundary and outside calendar days
    Then its real collection and dashboard follow the "<window>" rule

    Examples:
      | status   | window    |
      | REJECTED | unbounded |
      | DELETED  | seven-day |

  @AC6 @PO10625SubmittedOnly
  Scenario: Consult genuinely empty checker outcome tabs without creating cases
    Given my live checker outcome collections are genuinely empty
    When the checker consults every empty outcome tab
    Then all checker outcome tabs retain genuine empty states and zero counts
