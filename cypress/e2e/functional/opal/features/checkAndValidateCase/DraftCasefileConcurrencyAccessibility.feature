@R1CRmCreateCaseFiles @JIRA-LABEL:check-and-validate-case @functional
@JIRA-EPIC:PO-10817 @JIRA-STORY:PO-10626 @retries(0)
Feature: Navigate Draft Casefile recovery accessibly

  Scenario Outline: Navigate case recovery accessibly
    Given an independent synthetic case is ready for a "<journey>" journey
    And the case is prepared for a "<fault>" recovery outcome
    When I submit the case change
    Then the recovery message and controls are accessible
    And I check the page for accessibility
    When I use the recovery controls with the keyboard
    Then I reach the supported next state without an automatic case change
    And I check the page for accessibility
    And publication evidence confirms no duplicate case publication

    Examples:
      | journey  | fault            |
      | reject   | lost-response    |
      | resubmit | lost-response    |
      | reject   | definite-failure |
      | resubmit | definite-failure |
      | reject   | conflict         |
      | resubmit | conflict         |
