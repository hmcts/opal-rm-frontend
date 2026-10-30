@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Monitor independently owned live inputter casefiles
  # Each example requires its own compatible lifecycle/cleanup runtime; approval examples also require publication.
  # Fixtures use required automatic owner/marker cleanup. Discovery is not live acceptance.
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC1 @retries(0)
  Scenario: Monitor independently owned submitted rejected approved and deleted casefiles
    Given my live monitoring scenario owns one casefile in each lifecycle tab
    When I inspect my live inputter lifecycle tabs
    Then every owned casefile appears only in its matching lifecycle tab

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC1 @retries(0)
  Scenario Outline: Apply the seven-day visibility window only to approved and deleted work
    Given my live monitoring scenario owns a "<status>" casefile
    When I consult its dashboard at seven and eight calendar days after its lifecycle date
    Then its live visibility follows the "<window>" window
    @PO10628SubmittedOnly
    Examples: Submitted-only consultation
      | status    | window    |
      | SUBMITTED | unbounded |

    Examples: Transitioned lifecycle consultations
      | status    | window    |
      | REJECTED  | unbounded |
      | DELETED   | seven-day |
      | PUBLISHED | seven-day |

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC4 @retries(0)
  Scenario: Display every real published account number as read-only text
    Given my live monitoring scenario owns a published casefile with two minor creditors
    When I inspect its Approved row
    Then all generated respondent applicant and minor creditor numbers match the saved snapshot as read-only text

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC5 @PO10628SubmittedOnly @retries(0)
  Scenario: Deny monitoring to a provisioned user without inputter permission
    Given live authorised monitoring entry succeeds and my provisioned denied user lacks permission 21
    When the denied user opens the inputter monitoring dashboard
    Then access is denied without casefile counts or rows
