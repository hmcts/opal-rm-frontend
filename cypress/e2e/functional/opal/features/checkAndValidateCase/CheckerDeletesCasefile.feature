@R1CRmCreateCaseFiles @JIRA-STORY:PO-10624 @JIRA-EPIC:PO-10817 @JIRA-LABEL:create-draft-casefile @retries(0)
Feature: Independent checker deletes a retained casefile
  @AC1
  Scenario: Delete a submitted case with a valid boundary reason and retain its read-only outcome
    Given my live deletion scenario owns a submitted case for "success"
    When its independent checker completes the deletion interaction
    Then the deletion outcome preserves the owned case and records only its intended decision
  @AC2 @PO10624SubmittedOnly
  Scenario: Cancel deletion and return to the same unchanged review
    Given my live deletion scenario owns a submitted case for "cancel"
    When its independent checker completes the deletion interaction
    Then the deletion outcome preserves the owned case and records only its intended decision
  @AC3 @PO10624SubmittedOnly
  Scenario: Require the exact linked blank deletion reason error without a decision
    Given my live deletion scenario owns a submitted case for "blank"
    When its independent checker completes the deletion interaction
    Then the deletion outcome preserves the owned case and records only its intended decision
  @AC2 @PO10624SubmittedOnly
  Scenario: Retain a visibly over-limit deletion reason without a decision
    Given my live deletion scenario owns a submitted case for "over-limit"
    When its independent checker completes the deletion interaction
    Then the deletion outcome preserves the owned case and records only its intended decision
  @AC2
  Scenario: Retain a definite failed deletion and explicitly retry one real decision
    Given my live deletion scenario owns a submitted case for "retry"
    When its independent checker completes the deletion interaction
    Then the deletion outcome preserves the owned case and records only its intended decision
