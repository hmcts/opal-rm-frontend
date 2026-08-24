import { CasesCreateCasefileApplicantType } from '../../types/cases-create-casefile-applicant-type.type';
import { CasesCreateCasefileCaseType } from '../../types/cases-create-casefile-case-type.type';

export interface ICasesCreateCasefileCaseTypeFormData {
  caseType: CasesCreateCasefileCaseType | null;
  applicantType: CasesCreateCasefileApplicantType | null;
}
