import { CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES } from '../constants/cases-create-casefile-comments-notes-field-names.constant';

export interface ICasesCreateCasefileCommentsNotesFormData {
  [CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.comment]: string | null;
  [CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.note]: string | null;
}
