import type { ICasesCreateCasefileCommentsNotes } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-comments-notes.interface';

export const SAVED_COMMENTS_AND_NOTES: ICasesCreateCasefileCommentsNotes = {
  comment: 'Existing respondent account comment',
  note: 'Existing account history note',
};

export const REPLACEMENT_COMMENTS_AND_NOTES: ICasesCreateCasefileCommentsNotes = {
  comment: 'Replacement respondent account comment',
  note: 'Replacement account history note',
};

export const COMMENTS_AND_NOTES_LENGTH_MOCK = {
  nearLimit: { comment: 'a'.repeat(249), note: 'b'.repeat(999) },
  atLimit: { comment: 'a'.repeat(250), note: 'b'.repeat(1000) },
} satisfies Record<'nearLimit' | 'atLimit', ICasesCreateCasefileCommentsNotes>;
