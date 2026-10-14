@R1CRmCreateCaseFiles @JIRA-LABEL:create-draft-casefile @functional
Feature: Draft Casefile task permissions
  Background:
    Given I am authenticated with email "opal-test@dev.platform.hmcts.net"

  @JIRA-EPIC:PO-6506
  Scenario Outline: Deny <path> without Create and Manage Draft Casefiles for the RM Business Unit
    Given I have the live RM casefile permission
    And the released RM casefile entry is available
    And I am authenticated with email "opal-test-4@dev.platform.hmcts.net"
    And I do not have the live RM casefile permission
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

    @JIRA-STORY:PO-10278
    Examples: Order Term tasks
      | path                    |
      | order-terms/summary      |
      | order-terms/select       |
      | order-terms/add/MAT      |
      | order-terms/remove/0     |

    @JIRA-STORY:PO-10280
    Examples: Minor Creditor tasks
      | path                                       |
      | order-terms/creditor/minor-creditor-details  |
      | order-terms/creditor/minor-creditor-summary  |
      | order-terms/creditor/minor-creditor-remove   |
