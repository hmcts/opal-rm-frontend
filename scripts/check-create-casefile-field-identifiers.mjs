import { readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptRepositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootArgumentIndex = process.argv.indexOf('--root');
const repositoryRoot = rootArgumentIndex === -1 ? scriptRepositoryRoot : resolve(process.argv[rootArgumentIndex + 1]);
const createCasefileRoot = resolve(repositoryRoot, 'src/app/flows/cases/cases-create-casefile');
const canonicalSuffix = /^[a-z0-9_]+(?:-[a-z0-9_-]+)?$/;
const pageDefinitions = [
  {
    directory: 'cases-create-casefile-case-type',
    prefix: 'create_casefile_case_type_',
    constantName: 'CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES',
    fieldNamesFile: 'cases-create-casefile-case-type/constants/cases-create-casefile-case-type-field-names.constant.ts',
  },
  {
    directory: 'cases-create-casefile-respondent-details',
    prefix: 'create_casefile_respondent_details_',
    constantName: 'CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES',
    fieldNamesFile:
      'cases-create-casefile-respondent-details/constants/cases-create-casefile-respondent-details-field-names.constant.ts',
  },
  {
    directory: 'cases-create-casefile-applicant-individual',
    prefix: 'create_casefile_applicant_individual_',
    constantName: 'CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES',
    fieldNamesFile:
      'cases-create-casefile-applicant-individual/constants/cases-create-casefile-applicant-individual-field-names.constant.ts',
  },
  {
    directory: 'cases-create-casefile-applicant-organisation',
    prefix: 'create_casefile_applicant_organisation_',
    constantName: 'CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_NAMES',
    fieldNamesFile:
      'cases-create-casefile-applicant-organisation/constants/cases-create-casefile-applicant-organisation-field-names.constant.ts',
  },
  {
    directory: 'cases-create-casefile-interest-indexation',
    prefix: 'create_casefile_interest_indexation_',
    constantName: 'CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES',
    fieldNamesFile:
      'cases-create-casefile-interest-indexation/constants/cases-create-casefile-interest-indexation-field-names.constant.ts',
  },
  {
    directory: 'cases-create-casefile-central-authority',
    prefix: 'create_casefile_central_authority_',
    constantName: 'CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES',
    fieldNamesFile:
      'cases-create-casefile-central-authority/constants/cases-create-casefile-central-authority-field-names.constant.ts',
  },
];

const templatePaths = {
  applicantIndividual:
    'cases-create-casefile-applicant-individual/cases-create-casefile-applicant-individual-form/cases-create-casefile-applicant-individual-form.component.html',
  applicantOrganisation:
    'cases-create-casefile-applicant-organisation/cases-create-casefile-applicant-organisation-form/cases-create-casefile-applicant-organisation-form.component.html',
  bankDetails: 'components/cases-create-casefile-bank-details/cases-create-casefile-bank-details.component.html',
  caseType:
    'cases-create-casefile-case-type/cases-create-casefile-case-type-form/cases-create-casefile-case-type-form.component.html',
  centralAuthority:
    'cases-create-casefile-central-authority/cases-create-casefile-central-authority-form/cases-create-casefile-central-authority-form.component.html',
  interestIndexation:
    'cases-create-casefile-interest-indexation/cases-create-casefile-interest-indexation-form/cases-create-casefile-interest-indexation-form.component.html',
  managingPayments:
    'cases-create-casefile-managing-payments/cases-create-casefile-managing-payments-form/cases-create-casefile-managing-payments-form.component.html',
  respondentDetails:
    'cases-create-casefile-respondent-details/cases-create-casefile-respondent-details-form/cases-create-casefile-respondent-details-form.component.html',
  restrictedInformation:
    'components/cases-create-casefile-restricted-information/cases-create-casefile-restricted-information.component.html',
  taskList: 'cases-create-casefile-task-list/cases-create-casefile-task-list.component.html',
  thirdParty: 'components/cases-create-casefile-third-party/cases-create-casefile-third-party.component.html',
};

const structuralIdentifierKey = (templatePath, tagName, attributeName, value) =>
  [templatePath, tagName, attributeName, value].join('\u0000');

const taskListItems = [
  ['respondentItem', 'respondentStatus', 'respondentStatusTag'],
  ['applicantItem', 'applicantStatus', 'applicantStatusTag'],
  ['centralAuthorityItem', 'centralAuthorityStatus', 'centralAuthorityStatusTag'],
  ['orderDetailsItem', 'orderDetailsStatus', 'orderDetailsStatusTag'],
  ['orderTermsItem', 'orderTermsStatus', 'orderTermsStatusTag'],
  ['interestAndIndexationItem', 'interestAndIndexationStatus', 'interestAndIndexationStatusTag'],
  ['managingPaymentsItem', 'managingPaymentsStatus', 'managingPaymentsStatusTag'],
  ['commentsAndNotesItem', 'commentsAndNotesStatus', 'commentsAndNotesStatusTag'],
];

// Structural exceptions are exact path/tag/attribute/value tuples. They are never valid as field names elsewhere.
const structuralIdentifierAllowlist = new Set([
  structuralIdentifierKey(templatePaths.caseType, 'div', '[id]', 'applicantTypeConditionalId'),
  structuralIdentifierKey(templatePaths.caseType, 'button', 'id', 'continue'),
  structuralIdentifierKey(templatePaths.caseType, 'span', 'id', 'cancelCaseType'),

  structuralIdentifierKey(
    templatePaths.respondentDetails,
    'div[opal-lib-govuk-checkboxes-conditional]',
    'conditionalId',
    'respondentAliasesConditional',
  ),
  structuralIdentifierKey(templatePaths.respondentDetails, 'opal-lib-govuk-button', 'buttonId', 'addRespondentAlias'),
  structuralIdentifierKey(
    templatePaths.respondentDetails,
    'app-cases-create-casefile-third-party',
    'conditionalId',
    'respondentThirdPartyConditional',
  ),
  structuralIdentifierKey(
    templatePaths.respondentDetails,
    'div[opal-lib-govuk-checkboxes-conditional]',
    'conditionalId',
    'respondentEmployerConditional',
  ),
  structuralIdentifierKey(
    templatePaths.respondentDetails,
    'app-cases-create-casefile-restricted-information',
    'conditionalId',
    'respondentRestrictedInformationConditional',
  ),
  structuralIdentifierKey(templatePaths.respondentDetails, 'button', 'id', 'returnToCaseDetails'),
  structuralIdentifierKey(templatePaths.respondentDetails, 'span', 'id', 'cancelRespondentDetails'),

  structuralIdentifierKey(
    templatePaths.applicantIndividual,
    'div[opal-lib-govuk-checkboxes-conditional]',
    'conditionalId',
    'applicantAliasesConditional',
  ),
  structuralIdentifierKey(templatePaths.applicantIndividual, 'opal-lib-govuk-button', 'buttonId', 'addApplicantAlias'),
  structuralIdentifierKey(
    templatePaths.applicantIndividual,
    'app-cases-create-casefile-third-party',
    'conditionalId',
    'applicantThirdPartyConditional',
  ),
  structuralIdentifierKey(
    templatePaths.applicantIndividual,
    'app-cases-create-casefile-bank-details',
    '[ukBankConditionalId]',
    'ukBankConditionalId',
  ),
  structuralIdentifierKey(
    templatePaths.applicantIndividual,
    'app-cases-create-casefile-bank-details',
    '[nonUkBankConditionalId]',
    'nonUkBankConditionalId',
  ),
  structuralIdentifierKey(
    templatePaths.applicantIndividual,
    'app-cases-create-casefile-restricted-information',
    'conditionalId',
    'applicantRestrictedInformationConditional',
  ),
  structuralIdentifierKey(templatePaths.applicantIndividual, 'button', 'id', 'returnToCaseDetails'),
  structuralIdentifierKey(templatePaths.applicantIndividual, 'span', 'id', 'cancelApplicantDetails'),

  structuralIdentifierKey(
    templatePaths.applicantOrganisation,
    'app-cases-create-casefile-bank-details',
    '[ukBankConditionalId]',
    'ukBankConditionalId',
  ),
  structuralIdentifierKey(
    templatePaths.applicantOrganisation,
    'app-cases-create-casefile-bank-details',
    '[nonUkBankConditionalId]',
    'nonUkBankConditionalId',
  ),
  structuralIdentifierKey(templatePaths.applicantOrganisation, 'button', 'id', 'returnToCaseDetails'),
  structuralIdentifierKey(
    templatePaths.applicantOrganisation,
    'opal-lib-govuk-cancel-link',
    'id',
    'cancelApplicantDetails',
  ),

  structuralIdentifierKey(templatePaths.interestIndexation, 'button', 'id', 'returnToCaseDetails'),
  structuralIdentifierKey(templatePaths.interestIndexation, 'span', 'id', 'cancelInterestAndIndexation'),

  structuralIdentifierKey(templatePaths.centralAuthority, 'button', 'id', 'returnToCaseDetails'),
  structuralIdentifierKey(templatePaths.centralAuthority, 'span', 'id', 'cancelCentralAuthority'),

  structuralIdentifierKey(templatePaths.managingPayments, 'button', 'id', 'returnToCaseDetails'),
  structuralIdentifierKey(templatePaths.managingPayments, 'span', 'id', 'cancelManagingPayments'),

  structuralIdentifierKey(
    templatePaths.thirdParty,
    'div[opal-lib-govuk-checkboxes-conditional]',
    '[conditionalId]',
    'conditionalId',
  ),
  structuralIdentifierKey(
    templatePaths.restrictedInformation,
    'div[opal-lib-govuk-checkboxes-conditional]',
    '[conditionalId]',
    'conditionalId',
  ),
  structuralIdentifierKey(templatePaths.bankDetails, 'div', '[id]', 'ukBankConditionalId'),
  structuralIdentifierKey(templatePaths.bankDetails, 'div', '[id]', 'nonUkBankConditionalId'),

  structuralIdentifierKey(templatePaths.taskList, 'opal-lib-govuk-summary-list', 'summaryListId', 'caseDetails'),
  structuralIdentifierKey(
    templatePaths.taskList,
    'div[opal-lib-govuk-summary-list-row]',
    'summaryListId',
    'caseDetails',
  ),
  structuralIdentifierKey(
    templatePaths.taskList,
    'div[opal-lib-govuk-summary-list-row]',
    'summaryListRowId',
    'caseType',
  ),
  structuralIdentifierKey(
    templatePaths.taskList,
    'div[opal-lib-govuk-summary-list-row]',
    'summaryListRowId',
    'applicantType',
  ),
  ...['partyDetails', 'order', 'additionalInformation'].map((value) =>
    structuralIdentifierKey(templatePaths.taskList, 'opal-lib-govuk-task-list', 'taskListId', value),
  ),
  ...taskListItems.flatMap(([itemId, statusId, tagId]) => [
    structuralIdentifierKey(templatePaths.taskList, 'opal-lib-govuk-task-list-item', 'taskListItemId', itemId),
    structuralIdentifierKey(templatePaths.taskList, 'opal-lib-govuk-task-list-item', 'taskListStatusId', statusId),
    structuralIdentifierKey(templatePaths.taskList, 'opal-lib-govuk-tag', 'tagId', tagId),
  ]),
  structuralIdentifierKey(templatePaths.taskList, 'opal-lib-govuk-button', 'buttonId', 'checkCaseButton'),
  structuralIdentifierKey(templatePaths.taskList, 'p', 'id', 'checkCaseBlockingGuidance'),
  structuralIdentifierKey(templatePaths.taskList, 'a', 'id', 'cancelCaseCreation'),
]);

const fieldIdentifierAttributes = new Set([
  'checkboxFieldName',
  'checkboxFieldsetId',
  'fieldSetId',
  'inputId',
  'inputName',
  'reasonFieldName',
  'selectId',
  'selectName',
]);
const structuralIdentifierAttributes = new Set([
  'buttonId',
  'conditionalId',
  'nonUkBankConditionalId',
  'summaryListId',
  'summaryListRowId',
  'tagId',
  'taskListId',
  'taskListItemId',
  'taskListStatusId',
  'ukBankConditionalId',
]);
const identifierAttributes = new Set([...fieldIdentifierAttributes, ...structuralIdentifierAttributes, 'id', 'name']);
const idAttributes = new Set([
  'buttonId',
  'checkboxFieldName',
  'checkboxFieldsetId',
  'conditionalId',
  'fieldSetId',
  'id',
  'inputId',
  'nonUkBankConditionalId',
  'reasonFieldName',
  'selectId',
  'summaryListId',
  'summaryListRowId',
  'tagId',
  'taskListId',
  'taskListItemId',
  'taskListStatusId',
  'ukBankConditionalId',
]);

const lineNumberAt = (source, offset) => source.slice(0, offset).split('\n').length;

const isCanonicalIdentifier = (value, acceptedPrefixes) => {
  const prefix = acceptedPrefixes.find((candidate) => value.startsWith(candidate));
  return prefix !== undefined && canonicalSuffix.test(value.slice(prefix.length));
};

const fieldNameReference = /^fieldNames\.([A-Za-z][A-Za-z0-9]*)/;

const isCanonicalExpression = (expression, acceptedPrefixes, fieldNames) => {
  const compactExpression = expression.replace(/\s+/g, ' ').trim();
  if (/^fieldNames\.[A-Za-z][A-Za-z0-9]*(?: \+ (?:'[^']*'|"[^"]*"|option\.(?:key|value)))*$/.test(compactExpression)) {
    const key = compactExpression.match(fieldNameReference)?.[1];
    return (
      fieldNames === undefined ||
      (key !== undefined && isCanonicalIdentifier(fieldNames.get(key) ?? '', acceptedPrefixes))
    );
  }
  const aliasMatch = compactExpression.match(/^aliasControl\['([^']+)'\]\.(?:inputId|inputName)$/);
  if (aliasMatch !== null) {
    return isCanonicalIdentifier(aliasMatch[1], acceptedPrefixes);
  }
  if (['checkboxFieldName', 'checkboxFieldsetId', 'reasonFieldName'].includes(compactExpression)) {
    return true;
  }
  return false;
};

const resolveIdExpression = (expression, fieldNames) => {
  const compactExpression = expression.replace(/\s+/g, ' ').trim();
  const literalMatch = compactExpression.match(/^(['"])(.*)\1$/);
  if (literalMatch !== null) return `literal:${literalMatch[2]}`;

  if (compactExpression === 'applicantTypeConditionalId') return 'literal:applicantTypeConditional';
  if (compactExpression === 'ukBankConditionalId') return 'literal:applicantUkBankConditional';
  if (compactExpression === 'nonUkBankConditionalId') return 'literal:applicantNonUkBankConditional';

  const fieldMatch = compactExpression.match(/^fieldNames\.([A-Za-z][A-Za-z0-9]*)(?: \+ (['"])([^'"]*)\2)?$/);
  if (fieldMatch !== null && fieldNames?.has(fieldMatch[1])) {
    return `literal:${fieldNames.get(fieldMatch[1])}${fieldMatch[3] ?? ''}`;
  }

  return `expression:${compactExpression}`;
};

const tagIdentityFor = (tagName, attributes) => {
  for (const directive of ['opal-lib-govuk-checkboxes-conditional', 'opal-lib-govuk-summary-list-row']) {
    if (new RegExp(`(?:^|\\s)${directive}(?:\\s|$)`).test(attributes)) return `${tagName}[${directive}]`;
  }
  return tagName;
};

const duplicateKeyFor = (attributeName, value, isBound, fieldNames, tagName, attributes) => {
  const isSummaryListRow =
    tagName.includes('summary-list-row') || attributes.includes('opal-lib-govuk-summary-list-row');
  if (attributeName === 'summaryListId' && isSummaryListRow) return undefined;

  if (attributeName === 'summaryListRowId') {
    const summaryListId = attributes
      .match(/\bsummaryListId\s*=\s*(?:"([^"]*)"|'([^']*)')/)
      ?.slice(1)
      .find(Boolean);
    if (summaryListId !== undefined && !isBound) {
      const upperCaseRowId = `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
      return `literal:${summaryListId}${upperCaseRowId}`;
    }
  }

  const resolved = isBound ? resolveIdExpression(value, fieldNames) : `literal:${value}`;
  if (attributeName === 'conditionalId') return `${resolved}-conditional`;
  return resolved;
};

const collectTemplates = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTemplates(path)));
    } else if (entry.isFile() && entry.name.endsWith('.component.html')) {
      files.push(path);
    }
  }
  return files.sort();
};

const unwrapExpression = (expression) => {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }
  return current;
};

const memberLine = (sourceFile, member) =>
  sourceFile.getLineAndCharacterOfPosition(member.getStart(sourceFile)).line + 1;

const propertyNameFor = (name) => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return undefined;
};

const stringValueFor = (initializer) => {
  const expression = unwrapExpression(initializer);
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return expression.text;
  return undefined;
};

const parseFieldNames = (source, fieldNamesPath, definition, failures) => {
  const displayPath = relative(repositoryRoot, fieldNamesPath);
  const sourceFile = ts.createSourceFile(fieldNamesPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const diagnostic of sourceFile.parseDiagnostics) {
    const line = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1;
    failures.push(`${displayPath}:${line}: invalid TypeScript in field-name constant`);
  }

  const declarations = sourceFile.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .filter((declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === definition.constantName);
  if (declarations.length !== 1) {
    failures.push(`${displayPath}: expected exactly one ${definition.constantName} declaration`);
    return new Map();
  }

  const initializer = declarations[0].initializer && unwrapExpression(declarations[0].initializer);
  if (initializer === undefined || !ts.isObjectLiteralExpression(initializer)) {
    failures.push(`${displayPath}: ${definition.constantName} must be an object literal`);
    return new Map();
  }

  const fieldNames = new Map();
  const values = new Set();
  for (const member of initializer.properties) {
    const line = memberLine(sourceFile, member);
    if (!ts.isPropertyAssignment(member)) {
      failures.push(`${displayPath}:${line}: field-name member has an unsupported or unresolved value`);
      continue;
    }

    const key = propertyNameFor(member.name);
    if (key === undefined || !/^[A-Za-z][A-Za-z0-9]*$/.test(key)) {
      failures.push(`${displayPath}:${line}: field-name member has an unsupported or unresolved key`);
      continue;
    }
    const value = stringValueFor(member.initializer);
    if (value === undefined) {
      failures.push(`${displayPath}:${line}: ${key} has an unsupported or unresolved value`);
      continue;
    }
    if (fieldNames.has(key)) {
      failures.push(`${displayPath}:${line}: duplicate field-name key "${key}"`);
      continue;
    }
    if (!isCanonicalIdentifier(value, [definition.prefix])) {
      failures.push(`${displayPath}:${line}: ${key} does not use ${definition.prefix}`);
    }
    if (values.has(value)) {
      failures.push(`${displayPath}:${line}: duplicate field-name value "${value}"`);
    }
    fieldNames.set(key, value);
    values.add(value);
  }

  if (initializer.properties.length === 0) {
    failures.push(`${displayPath}: no field-name entries found`);
  }
  return fieldNames;
};

const failures = [];
const fieldNamesByDirectory = new Map();
for (const definition of pageDefinitions) {
  const fieldNamesPath = resolve(createCasefileRoot, definition.fieldNamesFile);
  const source = await readFile(fieldNamesPath, 'utf8');
  const fieldNames = parseFieldNames(source, fieldNamesPath, definition, failures);
  fieldNamesByDirectory.set(definition.directory, fieldNames);
}

const pageDefinitionFor = (templatePath) =>
  pageDefinitions.find(({ directory }) => templatePath.split('/').includes(directory));

const acceptedPrefixesFor = (templatePath) => {
  const pageDefinition = pageDefinitionFor(templatePath);
  if (pageDefinition !== undefined) return [pageDefinition.prefix];
  if (templatePath.includes('/cases-create-casefile-bank-details/')) {
    return ['create_casefile_applicant_individual_', 'create_casefile_applicant_organisation_'];
  }
  if (
    templatePath.includes('/cases-create-casefile-restricted-information/') ||
    templatePath.includes('/cases-create-casefile-third-party/')
  ) {
    return ['create_casefile_respondent_details_', 'create_casefile_applicant_individual_'];
  }
  if (
    templatePath.includes('/cases-create-casefile-address/') ||
    templatePath.includes('/cases-create-casefile-contact-details/')
  ) {
    return [
      'create_casefile_respondent_details_',
      'create_casefile_applicant_individual_',
      'create_casefile_applicant_organisation_',
    ];
  }
  return [];
};

for (const templatePath of await collectTemplates(createCasefileRoot)) {
  const source = await readFile(templatePath, 'utf8');
  const displayPath = relative(repositoryRoot, templatePath);
  const templatePathWithinCreateCasefile = relative(createCasefileRoot, templatePath);
  const pageDefinition = pageDefinitionFor(templatePath);
  const acceptedPrefixes = acceptedPrefixesFor(templatePath);
  const fieldNames = pageDefinition === undefined ? undefined : fieldNamesByDirectory.get(pageDefinition.directory);
  const ids = new Map();
  const tagPattern = /<([a-z][\w-]*)\b([^>]*)>/gis;
  let tagMatch;

  while ((tagMatch = tagPattern.exec(source)) !== null) {
    const tagName = tagMatch[1].toLowerCase();
    const attributes = tagMatch[2];
    const tagIdentity = tagIdentityFor(tagName, attributes);
    const attributesOffset = tagMatch.index + tagMatch[0].indexOf(attributes);
    const attributePattern =
      /(?:^|\s)(\[)?((?:attr\.)?(?:buttonId|checkboxFieldName|checkboxFieldsetId|conditionalId|fieldSetId|id|inputId|inputName|name|nonUkBankConditionalId|reasonFieldName|selectId|selectName|summaryListId|summaryListRowId|tagId|taskListId|taskListItemId|taskListStatusId|ukBankConditionalId))(\])?\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let attributeMatch;

    while ((attributeMatch = attributePattern.exec(attributes)) !== null) {
      const attributeName = attributeMatch[2].replace('attr.', '');
      if (!identifierAttributes.has(attributeName)) continue;

      const isBound = Boolean(attributeMatch[1] || attributeMatch[3] || attributeMatch[2].startsWith('attr.'));
      const value = attributeMatch[4] ?? attributeMatch[5] ?? '';
      const line = lineNumberAt(source, attributesOffset + attributeMatch.index);
      const rawAttributeName = isBound ? `[${attributeMatch[2]}]` : attributeMatch[2];
      const structurallyAllowed = structuralIdentifierAllowlist.has(
        structuralIdentifierKey(templatePathWithinCreateCasefile, tagIdentity, rawAttributeName, value),
      );
      let valid;
      if (fieldIdentifierAttributes.has(attributeName)) {
        valid = isBound
          ? isCanonicalExpression(value, acceptedPrefixes, fieldNames)
          : isCanonicalIdentifier(value, acceptedPrefixes);
      } else if (structuralIdentifierAttributes.has(attributeName)) {
        valid = structurallyAllowed;
      } else {
        valid = isBound
          ? isCanonicalExpression(value, acceptedPrefixes, fieldNames) || structurallyAllowed
          : isCanonicalIdentifier(value, acceptedPrefixes) || structurallyAllowed;
      }

      if (!valid) {
        failures.push(`${displayPath}:${line}: noncanonical ${attributeMatch[2]}="${value}"`);
      }

      if (idAttributes.has(attributeName)) {
        const idKey = duplicateKeyFor(attributeName, value, isBound, fieldNames, tagName, attributes);
        if (idKey === undefined) continue;
        const priorLine = ids.get(idKey);
        if (priorLine !== undefined) {
          failures.push(
            `${displayPath}:${line}: duplicate ID declaration "${value}" (first declared on line ${priorLine})`,
          );
        } else {
          ids.set(idKey, line);
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('All Create Casefile form identifiers are canonical and unique.');
}
