@R1CRmCreateCaseFiles @JIRA-STORY:PO-10624 @JIRA-EPIC:PO-10817 @JIRA-LABEL:create-draft-casefile @retries(0)
Feature: Independent checker deletes a retained casefile
  @AC1
  Scenario: Delete a submitted case with a valid boundary reason and retain its read-only outcome
    Given my live deletion scenario owns a submitted case for "success"
    When I confirm deletion with the prepared 250-character reason
    Then the owned case is retained in Deleted with its recorded reason
  @AC2 @PO10624SubmittedOnly
  Scenario: Cancel deletion and return to the same unchanged review
    Given my live deletion scenario owns a submitted case for "cancel"
    When I cancel deletion
    Then the saved case remains unchanged without a deletion decision
  @AC3 @PO10624SubmittedOnly
  Scenario: Require the exact linked blank deletion reason error without a decision
    Given my live deletion scenario owns a submitted case for "blank"
    When I confirm deletion without a reason
    Then the linked deletion validation says "Enter reason"
    And the saved case remains unchanged without a deletion decision
  @AC2 @PO10624SubmittedOnly
  Scenario: Retain a visibly over-limit deletion reason without a decision
    Given my live deletion scenario owns a submitted case for "over-limit"
    When I confirm deletion with the prepared 251-character reason
    Then the linked deletion validation says "Reason must be 250 characters or fewer"
    And the saved case remains unchanged without a deletion decision
  @AC2
  Scenario: Retain a definite failed deletion and explicitly retry one real decision
    Given my live deletion scenario owns a submitted case for "retry"
    When I explicitly retry deletion after a definite failure
    Then the owned case is retained in Deleted with its recorded reason
