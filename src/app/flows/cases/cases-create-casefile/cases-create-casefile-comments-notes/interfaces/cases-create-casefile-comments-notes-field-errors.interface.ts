import type {
  IAbstractFormBaseFieldError,
  IAbstractFormBaseFieldErrors,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import { CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES } from '../constants/cases-create-casefile-comments-notes-field-names.constant';

export interface ICasesCreateCasefileCommentsNotesFieldErrors extends IAbstractFormBaseFieldErrors {
  [CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.comment]: IAbstractFormBaseFieldError;
  [CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.note]: IAbstractFormBaseFieldError;
}
