import type { ICasesCreateCasefileCommentsNotesFieldErrors } from '../interfaces/cases-create-casefile-comments-notes-field-errors.interface';
import { CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES } from './cases-create-casefile-comments-notes-field-names.constant';

export const CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_ERRORS: ICasesCreateCasefileCommentsNotesFieldErrors = {
  [CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.comment]: {
    maxlength: { message: 'Comment must be 250 characters or fewer', priority: 1 },
  },
  [CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.note]: {
    maxlength: { message: 'Account note must be 1,000 characters or fewer', priority: 1 },
  },
};
