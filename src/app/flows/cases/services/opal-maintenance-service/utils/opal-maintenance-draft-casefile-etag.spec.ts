import { describe, expect, it } from 'vitest';
import { isUsableDraftCasefileEtag } from './opal-maintenance-draft-casefile-etag';

describe('isUsableDraftCasefileEtag', () => {
  it.each(['"0"', '"0001"', '"9007199254740993"', '"9223372036854775807"'])('accepts %s', (value) => {
    expect(isUsableDraftCasefileEtag(value)).toBe(true);
  });
  it.each([null, '', '0', 'W/"1"', '"-1"', '"+1"', '"1.0"', '"9223372036854775808"', '"1"\r\n'])(
    'rejects %s',
    (value) => expect(isUsableDraftCasefileEtag(value)).toBe(false),
  );
});
