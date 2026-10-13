@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Draft Casefile task permissions
  @JIRA-EPIC:PO-6506
  Scenario Outline: Deny <path> without Create and Manage Draft Casefiles for the RM Business Unit
    Given I am an authenticated RM user without casefile permission
    When I attempt to open the protected casefile task "<path>"
    Then I cannot access the Draft Casefile task

    @JIRA-STORY:PO-10275 @JIRA-STORY:PO-10276
    Examples: Shared party tasks
      | path                      |
      | respondent-details        |
      | central-authority-details |

    @JIRA-STORY:PO-10275
    Examples: Individual applicant
      | path                         |
      | applicant-details/individual |

    @JIRA-STORY:PO-10276
    Examples: Organisation applicant
      | path                           |
      | applicant-details/organisation |

    @JIRA-STORY:PO-10277
    Examples: Order Details
      | path          |
      | order-details |
