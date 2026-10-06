@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Checker casefile dashboard
  Background:
    Given I am logged in with email "opal-test@dev.platform.hmcts.net"

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario Outline: Enter review cases and exclude the checker's own work
    Given my checker dashboard session has role "<role>"
    When I open Review cases from the Cases page
    Then I see four checker queues and only other submitters' cases
    And every checker list and count request uses my Business Unit identity exclusion
    Examples:
      | role    |
      | checker |
      | dual    |

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: Return to a smaller rejected collection
    Given my checker dashboard session has role "checker"
    And I selected rejected page 2 sorted by applicant descending
    When I view a rejected case and return after the collection shrinks
    Then the fresh rejected collection retains sorting and clamps to page 1

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: Recover a failure on the first dashboard entry
    Given my checker dashboard session has role "checker"
    And the first checker list request fails once
    When I open Review cases from the Cases page
    Then I can retry the announced list failure without leaving Review cases
    When I retry loading cases using the keyboard
    Then the current checker table is loaded once with the retained selection

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: Recover an independent failed count
    Given my checker dashboard session has role "checker"
    And the first Failed count request fails once
    When I open Review cases from the Cases page
    Then the checker table remains usable with an announced Failed count failure
    When I retry loading the Failed count using the keyboard
    Then the Failed badge is refreshed without a replacement list request

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario Outline: Deny direct checker URLs before consultations
    Given my checker dashboard session has role "<role>"
    When I open the protected checker destination "<destination>"
    Then checker access is denied without collection or persistence requests
    Examples:
      | role       | destination |
      | inputter   | dashboard   |
      | inputter   | review      |
      | inputter   | view        |
      | cross-bu   | dashboard   |
      | cross-bu   | review      |
      | cross-bu   | view        |
      | inactive   | dashboard   |
      | missing-id | dashboard   |

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: Checker-only access keeps creation protected
    Given my checker dashboard session has role "checker"
    Then I cannot start or directly enter case creation

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: Queue consultations retain lifecycle and original creation contracts
    Given my checker dashboard session has role "checker"
    Then each checker queue has its status and date contract and oldest original review order

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario Outline: Protected shells validate IDs and reject mode query tampering
    Given my checker dashboard session has role "checker"
    When I open the safe checker "<kind>" shell with identifier "<id>"
    Examples:
      | kind   | id               |
      | review | 123              |
      | view   | 123              |
      | review | 0                |
      | view   | bad              |
      | review | 9007199254740992 |

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: A pending outcome departure cannot replace a newer selected list
    Given my checker dashboard session has role "checker"
    And a Failed list response is pending
    Then leaving the pending outcome recovers its count and a newer list wins

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: Permission loss closes a pending checker route
    Given my checker dashboard session has role "checker"
    And a Failed list response is pending
    When I lose checker permission while a consultation is pending

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: Dual role return metadata remains independent
    Given my checker dashboard session has role "dual"
    Then the two dashboard journeys retain independent return selections
