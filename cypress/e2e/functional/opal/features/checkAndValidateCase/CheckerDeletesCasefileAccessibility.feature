@R1CRmCreateCaseFiles @JIRA-STORY:PO-10624 @JIRA-EPIC:PO-10817 @JIRA-LABEL:create-draft-casefile @retries(0)
Feature: Independent checker deletion accessibility
  @AC4
  Scenario: Accessibly delete and inspect the retained casefile
    Given my accessible deletion scenario owns a submitted case for "success"
    Then I check the page for accessibility
    When I confirm deletion with the prepared 250-character reason
    Then the owned case is retained in Deleted with its recorded reason
    And I check the page for accessibility
  @AC4 @PO10624SubmittedOnly
  Scenario: Accessibly validate blank input and enforce the deletion reason hard cap
    Given my accessible deletion scenario owns a submitted case for "validation"
    Then I check the page for accessibility
    When I confirm deletion without a reason
    Then the linked deletion validation says "Enter reason"
    And I check the page for accessibility
    When I try to enter a deletion reason longer than 250 characters
    Then the deletion reason is capped at 250 characters
    And I check the page for accessibility
    When I cancel deletion
    Then the saved case remains unchanged without a deletion decision
    And I check the page for accessibility
  @AC4 @PO10624SubmittedOnly
  Scenario: Accessibly cancel deletion and return to unchanged review
    Given my accessible deletion scenario owns a submitted case for "cancel"
    Then I check the page for accessibility
    When I cancel deletion
    Then the saved case remains unchanged without a deletion decision
    And I check the page for accessibility
  @AC4
  Scenario: Accessibly retain a definite failure and explicitly retry deletion
    Given my accessible deletion scenario owns a submitted case for "retry"
    Then I check the page for accessibility
    When I explicitly retry deletion after a definite failure
    Then the owned case is retained in Deleted with its recorded reason
    And I check the page for accessibility
