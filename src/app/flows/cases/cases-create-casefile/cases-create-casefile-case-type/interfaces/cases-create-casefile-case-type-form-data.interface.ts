import { CasesCreateCasefileApplicantType } from '../../constants/cases-create-casefile-applicant-types.constant';
import { CasesCreateCasefileCaseType } from '../../constants/cases-create-casefile-case-types.constant';

export interface ICasesCreateCasefileCaseTypeFormData {
  caseType: CasesCreateCasefileCaseType | null;
  applicantType: CasesCreateCasefileApplicantType | null;
}
