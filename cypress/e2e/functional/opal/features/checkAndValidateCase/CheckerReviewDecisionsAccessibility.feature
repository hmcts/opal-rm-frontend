@R1CRmCreateCaseFiles @JIRA-STORY:PO-10625 @JIRA-EPIC:PO-10817 @JIRA-LABEL:create-draft-casefile @retries(0)
Feature: Broad checker decision accessibility journeys
  Each example owns independent live data and applies strict scans at every meaningful visited state.

  @AC1 @accessibility
  Scenario Outline: Verify accessible checker <kind> journey and persisted business outcome
    Then the live checker "<kind>" journey is accessible with its business outcome verified

    Examples:
      | kind        |
      | publication |
      | rejection   |
      | validation  |
      | self        |
      | denied      |
      | stale       |

  @AC6 @AC7 @accessibility
  Scenario Outline: Consult accessible checker <status> calendar windows with real outcomes
    When the checker traverses its independent "<status>" outcome calendar accessibly
    Then its real collection and dashboard follow the "<window>" rule

    Examples:
      | status   | window    |
      | REJECTED | unbounded |
      | DELETED  | seven-day |

  @AC6 @AC7 @accessibility
  Scenario: Consult accessible genuinely empty checker outcome tabs
    When the checker traverses genuinely empty outcome tabs accessibly
    Then all checker outcome tabs retain genuine empty states and zero counts
