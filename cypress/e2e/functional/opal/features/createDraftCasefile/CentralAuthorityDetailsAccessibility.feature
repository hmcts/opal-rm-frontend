@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Create Draft Casefile Central Authority accessibility
  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9804
  Scenario Outline: Central Authority initial, invalid and replayed states are accessible for <path>
    Given I have opened live Central Authority for a "<path>" casefile
    Then I check the page for accessibility
    When I submit over-limit Central Authority references
    Then I check the page for accessibility
    When I save Central Authority details with references "REMO-1" and "CA-1" using the first available authority
    Then Central Authority is marked Provided on Case details
    When I reopen Central Authority details
    Then the references "REMO-1" and "CA-1" and the first available authority are editable
    And Central Authority capture has not submitted a Draft Casefile
    And I check the page for accessibility

    @JIRA-STORY:PO-10275
    Examples: Individual applicant
      | path       |
      | Individual |

    @JIRA-STORY:PO-10276
    Examples: Organisation applicant
      | path         |
      | Organisation |

    Examples: Existing REMO Out regression
      | path     |
      | REMO Out |
