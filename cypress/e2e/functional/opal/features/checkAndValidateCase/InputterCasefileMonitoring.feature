@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Monitor independently owned live inputter casefiles
  # Each example requires its own compatible lifecycle/cleanup runtime; approval examples also require publication.
  # Verification switches are external safety guards. Discovery is not live acceptance.
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

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC2 @AC3 @retries(0)
  Scenario Outline: Reach the complete rejection list from either personal result state
    Given my live personal rejection collection is "<state>" and another inputter owns a rejected case
    When I follow View all rejected cases from my live dashboard
    Then the real Business Unit rejection list contains the expected owned cases
    Examples:
      | state     |
      | empty     |
      | populated |

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC3 @retries(0)
  Scenario: Open another inputter's rejected work and restore dashboard consultation state
    Given my live scenario owns paginated rejections and another inputter's rejected case
    When I open that case for amendment from All rejected and return
    Then the matching persisted draft and originating dashboard page and sort are retained

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC4 @retries(0)
  Scenario: Display every real published account number as read-only text
    Given my live monitoring scenario owns a published casefile with two minor creditors
    When I inspect its Approved row
    Then all generated respondent applicant and minor creditor numbers match the saved snapshot as read-only text

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC4 @retries(0)
  Scenario: Show no account numbers while real publication is pending
    Given my live monitoring scenario owns a verified pending casefile
    When I inspect its Approved row
    Then the pending casefile exposes no account numbers

  @JIRA-STORY:PO-10628 @JIRA-EPIC:PO-10817 @AC5 @PO10628SubmittedOnly @retries(0)
  Scenario: Deny monitoring to a provisioned user without inputter permission
    Given live authorised monitoring entry succeeds and my provisioned denied user lacks permission 21
    When the denied user opens the inputter monitoring dashboard
    Then access is denied without casefile counts or rows
