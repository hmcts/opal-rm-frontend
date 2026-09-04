import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const scannerPath = resolve(scriptsDirectory, 'check-create-casefile-field-identifiers.mjs');
const fixturesDirectory = resolve(scriptsDirectory, 'fixtures/create-casefile-field-identifiers');
const createCasefilePath = 'src/app/flows/cases/cases-create-casefile';
const caseTypeDirectory = 'cases-create-casefile-case-type';
const caseTypeTemplatePath = `${createCasefilePath}/${caseTypeDirectory}/cases-create-casefile-case-type-form/cases-create-casefile-case-type-form.component.html`;
const centralAuthorityDirectory = 'cases-create-casefile-central-authority';
const centralAuthorityFieldNamesPath = `${createCasefilePath}/${centralAuthorityDirectory}/constants/cases-create-casefile-central-authority-field-names.constant.ts`;
const centralAuthorityTemplatePath = `${createCasefilePath}/${centralAuthorityDirectory}/cases-create-casefile-central-authority-form/cases-create-casefile-central-authority-form.component.html`;
const managingPaymentsTemplatePath = `${createCasefilePath}/cases-create-casefile-managing-payments/cases-create-casefile-managing-payments-form/cases-create-casefile-managing-payments-form.component.html`;
const temporaryRepositories = [];

const supportingFieldNameConstants = [
  {
    path: 'cases-create-casefile-respondent-details/constants/cases-create-casefile-respondent-details-field-names.constant.ts',
    exportName: 'CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES',
    key: 'firstNames',
    value: 'create_casefile_respondent_details_first_names',
  },
  {
    path: 'cases-create-casefile-applicant-individual/constants/cases-create-casefile-applicant-individual-field-names.constant.ts',
    exportName: 'CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES',
    key: 'firstNames',
    value: 'create_casefile_applicant_individual_first_names',
  },
  {
    path: 'cases-create-casefile-applicant-organisation/constants/cases-create-casefile-applicant-organisation-field-names.constant.ts',
    exportName: 'CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_NAMES',
    key: 'organisationName',
    value: 'create_casefile_applicant_organisation_name',
  },
  {
    path: 'cases-create-casefile-interest-indexation/constants/cases-create-casefile-interest-indexation-field-names.constant.ts',
    exportName: 'CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES',
    key: 'interestApplies',
    value: 'create_casefile_interest_indexation_interest_applies',
  },
  {
    path: `${centralAuthorityDirectory}/constants/cases-create-casefile-central-authority-field-names.constant.ts`,
    exportName: 'CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES',
    key: 'majorCreditorId',
    value: 'create_casefile_central_authority_major_creditor_id',
  },
];

const writeFixtureFile = async (repositoryRoot, relativePath, contents) => {
  const destination = resolve(repositoryRoot, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, contents);
};

const createFixtureRepository = async ({
  templateFixture = 'valid.component.html',
  constantFixture = 'valid.ts',
} = {}) => {
  const repositoryRoot = await mkdtemp(resolve(tmpdir(), 'create-casefile-identifiers-'));
  temporaryRepositories.push(repositoryRoot);

  const [caseTypeConstant, template] = await Promise.all([
    readFile(resolve(fixturesDirectory, 'constants', constantFixture), 'utf8'),
    readFile(resolve(fixturesDirectory, 'templates', templateFixture), 'utf8'),
  ]);
  await writeFixtureFile(
    repositoryRoot,
    `${createCasefilePath}/${caseTypeDirectory}/constants/cases-create-casefile-case-type-field-names.constant.ts`,
    caseTypeConstant,
  );
  await writeFixtureFile(repositoryRoot, caseTypeTemplatePath, template);
  await Promise.all(
    supportingFieldNameConstants.map(({ path, exportName, key, value }) =>
      writeFixtureFile(
        repositoryRoot,
        `${createCasefilePath}/${path}`,
        `export const ${exportName} = {\n  ${key}: '${value}',\n} as const;\n`,
      ),
    ),
  );

  return repositoryRoot;
};

const runScanner = (repositoryRoot) =>
  spawnSync(process.execPath, [scannerPath, '--root', repositoryRoot], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });

const assertRejected = (result, expectedMessage) => {
  assert.equal(result.status, 1, `expected scanner failure\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.match(result.stderr, expectedMessage);
};

afterEach(async () => {
  await Promise.all(temporaryRepositories.splice(0).map((repositoryRoot) => rm(repositoryRoot, { recursive: true })));
});

test('prints the exact success message for canonical field maps and controls', async () => {
  const repositoryRoot = await createFixtureRepository();
  const result = runScanner(repositoryRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'All Create Casefile form identifiers are canonical and unique.\n');
  assert.equal(result.stderr, '');
});

test('rejects a structural identifier used as a native form-control ID and name', async () => {
  const repositoryRoot = await createFixtureRepository({
    templateFixture: 'structural-as-form-control.component.html',
  });
  const result = runScanner(repositoryRoot);

  assertRejected(result, /noncanonical id="caseType"/);
  assert.match(result.stderr, /noncanonical name="caseType"/);
  assert.match(result.stderr, /noncanonical id="continue"/);
});

test('rejects a noncanonical value written with alternate field-map syntax', async () => {
  const repositoryRoot = await createFixtureRepository({ constantFixture: 'alternate-noncanonical.ts' });

  assertRejected(runScanner(repositoryRoot), /caseType does not use create_casefile_case_type_/);
});

test('rejects every unresolved field-map member', async () => {
  const repositoryRoot = await createFixtureRepository({ constantFixture: 'unresolved.ts' });
  const result = runScanner(repositoryRoot);

  assertRejected(result, /caseType has an unsupported or unresolved value/);
  assert.match(result.stderr, /applicantType has an unsupported or unresolved value/);
});

test('rejects a canonical identifier that uses the wrong page prefix', async () => {
  const repositoryRoot = await createFixtureRepository({ templateFixture: 'wrong-page-prefix.component.html' });

  assertRejected(runScanner(repositoryRoot), /noncanonical id="create_casefile_respondent_details_first_names"/);
});

test('rejects duplicate identifiers after resolving a field-map expression', async () => {
  const repositoryRoot = await createFixtureRepository({ templateFixture: 'duplicate-resolved.component.html' });

  assertRejected(
    runScanner(repositoryRoot),
    /duplicate ID declaration "create_casefile_case_type_case_type" \(first declared on line 2\)/,
  );
});

test('accepts the Central Authority and Managing Payments structural action identifiers', async () => {
  const repositoryRoot = await createFixtureRepository();
  await Promise.all([
    writeFixtureFile(
      repositoryRoot,
      centralAuthorityTemplatePath,
      `<opal-lib-alphagov-accessible-autocomplete
  [inputId]="fieldNames.majorCreditorId"
  [inputName]="fieldNames.majorCreditorId"
/>
<button id="returnToCaseDetails" type="submit">Return to case details</button>
<span id="cancelCentralAuthority"></span>
`,
    ),
    writeFixtureFile(
      repositoryRoot,
      managingPaymentsTemplatePath,
      `<button id="returnToCaseDetails" type="submit">Return to case details</button>
<span id="cancelManagingPayments"></span>
`,
    ),
  ]);

  const result = runScanner(repositoryRoot);

  assert.equal(result.status, 0, result.stderr);
});

test('rejects a Central Authority identifier that uses the wrong page prefix', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(
    repositoryRoot,
    centralAuthorityFieldNamesPath,
    `export const CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES = {
  majorCreditorId: 'create_casefile_respondent_details_major_creditor_id',
} as const;
`,
  );

  assertRejected(runScanner(repositoryRoot), /majorCreditorId does not use create_casefile_central_authority_/);
});
