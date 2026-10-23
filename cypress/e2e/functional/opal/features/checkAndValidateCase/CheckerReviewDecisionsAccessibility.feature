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
