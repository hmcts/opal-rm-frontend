@R1CRmCreateCaseFiles @JIRA-STORY:PO-10624 @JIRA-EPIC:PO-10817 @JIRA-LABEL:create-draft-casefile @retries(0)
Feature: Independent checker deletion accessibility
  @AC4
  Scenario: Accessibly delete and inspect the retained casefile
    Then my independent live checker deletion "success" journey is accessible with its business outcome verified
  @AC4 @PO10624SubmittedOnly
  Scenario: Accessibly correct blank and over-limit reasons without changing the saved case
    Then my independent live checker deletion "validation" journey is accessible with its business outcome verified
  @AC4 @PO10624SubmittedOnly
  Scenario: Accessibly cancel deletion and return to unchanged review
    Then my independent live checker deletion "cancel" journey is accessible with its business outcome verified
  @AC4
  Scenario: Accessibly retain a definite failure and explicitly retry deletion
    Then my independent live checker deletion "retry" journey is accessible with its business outcome verified
