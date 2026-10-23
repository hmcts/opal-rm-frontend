/** Optional synthetic fixture variations; omitted options retain the recovery fixture. */
export interface IDraftCasefileFixtureOptions {
  inputter?: string;
  checker?: string;
  minorCreditorCount?: 0 | 2;
  uniqueNames?: boolean;
}
