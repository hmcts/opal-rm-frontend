import { inject } from '@angular/core';
import { hasFlowStateGuard } from '@hmcts/opal-frontend-common/guards/has-flow-state';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { isCasesCreateCasefileIndividualApplicantSelection } from '../../utils/cases-create-casefile-individual-applicant-selection';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

export const casesCreateCasefileApplicantIndividualGuard = hasFlowStateGuard(
  () => {
    const store = inject(CasesCreateCasefileStore);
    return { caseTypeSelection: store.caseTypeSelection() };
  },
  (state) => isCasesCreateCasefileIndividualApplicantSelection(state.caseTypeSelection),
  () => CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
);
