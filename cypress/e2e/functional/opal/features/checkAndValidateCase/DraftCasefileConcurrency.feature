@R1CRmCreateCaseFiles @JIRA-LABEL:check-and-validate-case @functional
@JIRA-EPIC:PO-10817 @JIRA-STORY:PO-10626 @retries(0)
Feature: Recover concurrent and unacknowledged Draft Casefile changes

  Scenario Outline: Recover a committed change whose response was lost
    Given an independent synthetic case is ready for a "<journey>" journey
    And the next case change loses its successful response
    When I submit the case change
    Then the case change outcome is uncertain and its context is retained
    When I recover the saved case through its supported controls
    Then the saved case shows exactly one committed "<journey>" outcome
    And recovery has not replayed the case change
    And the completed recovery has not replayed the case change

    Examples:
      | journey |
      | reject  |
      | delete  |

    # Consumer and pending/published cleanup are delivered on the support branch.
    # Retain this AC1 approval example until the deployed contract and a full owned
    # approval/recovery/cleanup run are verified. Producer/broker evidence remains
    # separate from browser request counts and persisted GET/timeline assertions.
    @skip @PO10626RequiresPublishedCleanup
    Examples:
      | journey |
      | approve |

  Scenario Outline: Correct and explicitly retry a definite failure
    Given an independent synthetic case is ready for a "<journey>" journey
    And the next case change definitely fails before reaching the backend
    When I submit the case change
    Then the saved case is unchanged and my complete corrections are retained
    When I explicitly retry the corrected case change
    Then the saved case shows exactly one committed "<journey>" outcome
    And the completed recovery has not replayed the case change

    Examples:
      | journey  |
      | reject   |
      | resubmit |

  Scenario Outline: Recover after another action advanced the case
    Given an independent synthetic case is ready for a "<journey>" journey
    And another authorised action advances the saved case
    When I submit the case change
    Then the stale case change is refused without changing the winning outcome
    When I recover the saved case through its supported controls
    Then I see the authoritative winning outcome without replaying my change
    And the completed recovery has not replayed the case change

    Examples:
      | journey  |
      | reject   |
      | resubmit |
