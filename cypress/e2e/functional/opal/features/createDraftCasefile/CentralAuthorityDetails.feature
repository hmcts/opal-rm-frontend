@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Create Draft Casefile Central Authority details
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506 @JIRA-STORY:PO-9804
  Scenario Outline: Enter, replay and edit Central Authority details for a <path> casefile
    Given I have the live RM casefile permission
    And I have opened live Central Authority for a "<path>" casefile
    When I save Central Authority details with references "REMO-1" and "CA-1" using the first available authority
    Then Central Authority is marked Provided on Case details
    When I reopen Central Authority details
    Then the references "REMO-1" and "CA-1" and the first available authority are editable
    When I save Central Authority details with references "REMO-2" and "CA-2" using the second available authority
    And I reopen Central Authority details
    Then the references "REMO-2" and "CA-2" and the second available authority are editable
    And Central Authority capture has not submitted a Draft Casefile

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
