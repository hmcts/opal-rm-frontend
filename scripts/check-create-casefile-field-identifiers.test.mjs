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
const orderDetailsDirectory = 'cases-create-casefile-order-details';
const orderDetailsTemplatePath = `${createCasefilePath}/${orderDetailsDirectory}/cases-create-casefile-order-details-form/cases-create-casefile-order-details-form.component.html`;
const orderTermsSelectDirectory = 'cases-create-casefile-order-terms-select';
const orderTermsSelectTemplatePath = `${createCasefilePath}/${orderTermsSelectDirectory}/cases-create-casefile-order-terms-select-form/cases-create-casefile-order-terms-select-form.component.html`;
const orderTermsSummaryTemplatePath = `${createCasefilePath}/cases-create-casefile-order-terms-summary/cases-create-casefile-order-terms-summary.component.html`;
const orderTermCreditorDirectory = 'cases-create-casefile-order-term-creditor';
const orderTermCreditorTemplatePath = `${createCasefilePath}/${orderTermCreditorDirectory}/cases-create-casefile-order-term-creditor-form/cases-create-casefile-order-term-creditor-form.component.html`;
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
  {
    path: `${orderDetailsDirectory}/constants/cases-create-casefile-order-details-field-names.constant.ts`,
    exportName: 'CASES_CREATE_CASEFILE_ORDER_DETAILS_FIELD_NAMES',
    key: 'applicationId',
    value: 'create_casefile_order_details_application_id',
  },
  {
    path: `${orderTermsSelectDirectory}/constants/cases-create-casefile-order-terms-select-field-names.constant.ts`,
    exportName: 'CASES_CREATE_CASEFILE_ORDER_TERMS_SELECT_FIELD_NAMES',
    key: 'resultId',
    value: 'create_casefile_order_terms_select_result_id',
  },
  {
    path: `${orderTermCreditorDirectory}/constants/cases-create-casefile-order-term-creditor-field-names.constant.ts`,
    exportName: 'CASES_CREATE_CASEFILE_ORDER_TERM_CREDITOR_FIELD_NAMES',
    key: 'choice',
    value: 'create_casefile_order_term_creditor_choice',
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

test('accepts the maintained form structural action identifiers', async () => {
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
    writeFixtureFile(
      repositoryRoot,
      orderDetailsTemplatePath,
      `<opal-lib-alphagov-accessible-autocomplete
  [inputId]="fieldNames.applicationId"
  [inputName]="fieldNames.applicationId"
/>
<button id="create_casefile_order_details_return_to_case_details" type="submit">Return to case details</button>
<span id="create_casefile_order_details_cancel"></span>
`,
    ),
    writeFixtureFile(
      repositoryRoot,
      orderTermsSelectTemplatePath,
      `<div id="create_casefile_order_terms_status"></div>
<button id="create_casefile_order_terms_retry" type="button">Retry</button>
<select [id]="fieldNames.resultId" [name]="fieldNames.resultId"></select>
<button id="create_casefile_order_terms_continue" type="submit">Continue</button>
<span id="create_casefile_order_terms_cancel"></span>
`,
    ),
    writeFixtureFile(
      repositoryRoot,
      orderTermsSummaryTemplatePath,
      `<opal-lib-govuk-button buttonId="create_casefile_order_terms_add">Add terms</opal-lib-govuk-button>
<a id="create_casefile_order_terms_return">Return to case details</a>
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

const orderTermsInputTemplatePath = `${createCasefilePath}/cases-create-casefile-order-terms-input/cases-create-casefile-order-terms-input-form/cases-create-casefile-order-terms-input-form.component.html`;

test('accepts metadata field identifiers in mutually exclusive input branches', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(
    repositoryRoot,
    orderTermsInputTemplatePath,
    `
    @for (view of views; track view.field.id) {
      @let field = view.field;
      @if (field.kind === 'readonly') { <dl [id]="field.id"></dl> }
      @else { @switch (field.kind) {
        @case ('date') { <opal-lib-moj-date-picker [inputId]="field.id" [inputName]="field.id" /> }
        @case ('radio') {
          <opal-lib-govuk-radio [fieldSetId]="field.id">
            @for (option of view.options; track option.value) {
              <div opal-lib-govuk-radios-item [inputId]="field.id + '-option-' + $index" [inputName]="field.id"></div>
            }
          </opal-lib-govuk-radio>
        }
        @case ('checkbox') {
          <opal-lib-govuk-checkboxes [fieldSetId]="field.id + '-fieldset'">
            <div opal-lib-govuk-checkboxes-item [inputId]="field.id" [inputName]="field.id"></div>
          </opal-lib-govuk-checkboxes>
        }
        @default { <opal-lib-govuk-text-input [inputId]="field.id" [inputName]="field.id" /> }
      } }
    }
    <button id="create_casefile_order_terms_input_continue">Continue</button>
  `,
  );
  const result = runScanner(repositoryRoot);
  assert.equal(result.status, 0, result.stderr);
});

test('rejects ungoverned dynamic order-term identifiers and wrong prefixes', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(
    repositoryRoot,
    orderTermsInputTemplatePath,
    `
    <opal-lib-govuk-text-input [inputId]="field.name" [inputName]="field.id + '-fieldset'" />
    <button id="create_casefile_order_details_continue">Continue</button>
  `,
  );
  const result = runScanner(repositoryRoot);
  assertRejected(result, /noncanonical inputId="field.name"/);
  assert.match(result.stderr, /noncanonical inputName/);
  assert.match(result.stderr, /noncanonical id="create_casefile_order_details_continue"/);
});

test('does not allow metadata field expressions on unrelated forms', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(
    repositoryRoot,
    caseTypeTemplatePath,
    '<opal-lib-govuk-text-input [inputId]="field.id" [inputName]="field.id" />',
  );
  assertRejected(runScanner(repositoryRoot), /noncanonical inputId="field.id"/);
});

test('accepts creditor sequence IDs and the native radio conditional target', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(
    repositoryRoot,
    `${createCasefilePath}/${orderTermCreditorDirectory}/constants/cases-create-casefile-order-term-creditor-field-names.constant.ts`,
    `export const CASES_CREATE_CASEFILE_ORDER_TERM_CREDITOR_FIELD_NAMES = {
  choice: 'create_casefile_order_term_creditor_choice',
  majorCreditorId: 'create_casefile_order_term_creditor_major_creditor_id',
} as const;
`,
  );
  await writeFixtureFile(
    repositoryRoot,
    orderTermCreditorTemplatePath,
    `<fieldset [id]="fieldNames.choice">
  @for (creditor of minorCreditors; track creditor.sequenceNumber) {
    <div opal-lib-govuk-radios-item
      [inputId]="fieldNames.choice + '-minor-' + creditor.sequenceNumber"
      [inputName]="fieldNames.choice"></div>
  }
  <div [id]="conditionalId">
    <opal-lib-govuk-select [selectId]="fieldNames.majorCreditorId" [selectName]="fieldNames.majorCreditorId" />
  </div>
</fieldset>
<button id="create_casefile_order_term_creditor_continue">Continue</button>
`,
  );

  const result = runScanner(repositoryRoot);
  assert.equal(result.status, 0, result.stderr);
});

test('rejects malformed creditor sequence IDs and duplicate Major targets in the same branch', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(
    repositoryRoot,
    orderTermCreditorTemplatePath,
    `<div opal-lib-govuk-radios-item
  [inputId]="fieldNames.choice + '-minor-' + creditor.displayName"
  [inputName]="fieldNames.choice"></div>
<opal-lib-govuk-select [selectId]="fieldNames.choice" [selectName]="fieldNames.choice" />
<div [id]="fieldNames.choice"></div>
<div opal-lib-govuk-radios-conditional [conditionalId]="wrongConditionalId"></div>
`,
  );

  const result = runScanner(repositoryRoot);
  assertRejected(result, /noncanonical inputId="fieldNames.choice \+ '-minor-' \+ creditor.displayName"/);
  assert.match(result.stderr, /duplicate ID declaration "fieldNames.choice"/);
  assert.match(result.stderr, /noncanonical conditionalId="wrongConditionalId"/);
});

test('rejects dynamic IDs that can render together in the same branch', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(
    repositoryRoot,
    orderTermsInputTemplatePath,
    `
    @switch (field.kind) { @case ('text') {
      <opal-lib-govuk-text-input [inputId]="field.id" />
      <opal-lib-govuk-text-area [inputId]="field.id" />
    } }
  `,
  );
  assertRejected(runScanner(repositoryRoot), /duplicate ID declaration "field.id"/);
});

test('rejects dynamic IDs across independent conditional blocks', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(
    repositoryRoot,
    orderTermsInputTemplatePath,
    `
    @if (first) { <opal-lib-govuk-text-input [inputId]="field.id" /> }
    @if (second) { <opal-lib-govuk-text-input [inputId]="field.id" /> }
  `,
  );
  assertRejected(runScanner(repositoryRoot), /duplicate ID declaration "field.id"/);
});

test('accepts the creditor return identifier with its own prefix', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(
    repositoryRoot,
    `${createCasefilePath}/cases-create-casefile-order-term-creditor/cases-create-casefile-order-term-creditor.component.html`,
    '<a id="create_casefile_order_term_creditor_return">Return to order terms</a>',
  );
  const result = runScanner(repositoryRoot);
  assert.equal(result.status, 0, result.stderr);
});

test('accepts the exact Minor creditor details return identifier', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(
    repositoryRoot,
    `${createCasefilePath}/cases-create-casefile-minor-creditor-details/cases-create-casefile-minor-creditor-details.component.html`,
    '<a id="returnToCreditor">Return to creditor selection</a>',
  );
  const result = runScanner(repositoryRoot);
  assert.equal(result.status, 0, result.stderr);
});

test('rejects malformed dynamic control-flow templates', async () => {
  const repositoryRoot = await createFixtureRepository();
  await writeFixtureFile(repositoryRoot, orderTermsInputTemplatePath, '@if (field.kind) {');
  assertRejected(runScanner(repositoryRoot), /invalid dynamic form template/);
});
