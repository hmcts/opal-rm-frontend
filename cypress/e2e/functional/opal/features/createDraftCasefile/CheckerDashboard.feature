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
  Scenario: Initial dashboard failure uses the existing error page
    Given my checker dashboard session has role "checker"
    And the first checker list request fails once
    When I open Review cases from the Cases page
    Then the existing error page handles the initial checker failure

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: Omit an unavailable independent count
    Given my checker dashboard session has role "checker"
    And the first Failed count request fails once
    When I open Review cases from the Cases page
    Then the checker table remains usable without the unavailable Failed badge

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario Outline: Deny direct checker URLs before consultations
    Given my checker dashboard session has role "<role>"
    When I open the protected checker destination "<destination>"
    Then checker access is denied without collection or persistence requests
    Examples:
      | role       | destination |
      | inputter   | dashboard   |
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
  Scenario Outline: Saved details validate IDs and reject mode query tampering
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
  Scenario: A non-retriable permission error follows the existing error route
    Given my checker dashboard session has role "checker"
    And a Failed list response is pending
    When I lose checker permission while a consultation is pending

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario: Dual role return metadata remains independent
    Given my checker dashboard session has role "dual"
    Then the two dashboard journeys retain independent return selections

  @JIRA-STORY:PO-10606 @JIRA-EPIC:PO-10817
  Scenario Outline: Later consultation failures use the existing error routes
    Given my checker dashboard session has role "checker"
    Then a later checker "<kind>" failure with status <status> and reference "<reference>" uses the existing error route
    Examples:
      | kind  | status | reference         |
      | list  | 503    | <unsafe-reference> |
      | list  | 500    | oversized         |
      | list  | 409    | safe-reference_42 |
      | count | 500    | <unsafe-reference> |
      | count | 503    | oversized         |
      | count | 500    | safe-reference_42 |
      | list  | 401    | <unsafe-reference> |
      | list  | 403    | <unsafe-reference> |
