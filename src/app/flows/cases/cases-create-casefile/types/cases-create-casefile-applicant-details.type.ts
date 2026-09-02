import type { ICasesCreateCasefileApplicantIndividual } from '../interfaces/cases-create-casefile-applicant-individual.interface';
import type { ICasesCreateCasefileApplicantOrganisation } from '../interfaces/cases-create-casefile-applicant-organisation.interface';

export type CasesCreateCasefileApplicantDetails =
  ICasesCreateCasefileApplicantIndividual | ICasesCreateCasefileApplicantOrganisation;
