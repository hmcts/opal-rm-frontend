import { readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const createCasefileRoot = resolve(repositoryRoot, 'src/app/flows/cases/cases-create-casefile');
const canonicalSuffix = /^[a-z0-9_]+(?:-[a-z0-9_-]+)?$/;
const pageDefinitions = [
  {
    directory: 'cases-create-casefile-case-type',
    prefix: 'create_casefile_case_type_',
    fieldNamesFile: 'cases-create-casefile-case-type/constants/cases-create-casefile-case-type-field-names.constant.ts',
  },
  {
    directory: 'cases-create-casefile-respondent-details',
    prefix: 'create_casefile_respondent_details_',
    fieldNamesFile:
      'cases-create-casefile-respondent-details/constants/cases-create-casefile-respondent-details-field-names.constant.ts',
  },
  {
    directory: 'cases-create-casefile-applicant-individual',
    prefix: 'create_casefile_applicant_individual_',
    fieldNamesFile:
      'cases-create-casefile-applicant-individual/constants/cases-create-casefile-applicant-individual-field-names.constant.ts',
  },
  {
    directory: 'cases-create-casefile-applicant-organisation',
    prefix: 'create_casefile_applicant_organisation_',
    fieldNamesFile:
      'cases-create-casefile-applicant-organisation/constants/cases-create-casefile-applicant-organisation-field-names.constant.ts',
  },
  {
    directory: 'cases-create-casefile-interest-indexation',
    prefix: 'create_casefile_interest_indexation_',
    fieldNamesFile:
      'cases-create-casefile-interest-indexation/constants/cases-create-casefile-interest-indexation-field-names.constant.ts',
  },
];

// These identifiers describe page structure or actions rather than form fields.
const structuralIdentifiers = new Set([
  'addApplicantAlias',
  'addRespondentAlias',
  'additionalInformation',
  'applicantAliasesConditional',
  'applicantItem',
  'applicantNonUkBankConditional',
  'applicantRestrictedInformationConditional',
  'applicantStatus',
  'applicantStatusTag',
  'applicantThirdPartyConditional',
  'applicantType',
  'applicantTypeConditional',
  'applicantUkBankConditional',
  'cancelApplicantDetails',
  'cancelCaseCreation',
  'cancelCaseType',
  'cancelInterestAndIndexation',
  'cancelRespondentDetails',
  'caseType',
  'caseDetails',
  'caseDetailsApplicantType',
  'caseDetailsCaseType',
  'centralAuthorityItem',
  'centralAuthorityStatus',
  'centralAuthorityStatusTag',
  'checkCaseBlockingGuidance',
  'checkCaseButton',
  'commentsAndNotesItem',
  'commentsAndNotesStatus',
  'commentsAndNotesStatusTag',
  'continue',
  'interestAndIndexationItem',
  'interestAndIndexationStatus',
  'interestAndIndexationStatusTag',
  'managingPaymentsItem',
  'managingPaymentsStatus',
  'managingPaymentsStatusTag',
  'order',
  'orderDetailsItem',
  'orderDetailsStatus',
  'orderDetailsStatusTag',
  'orderTermsItem',
  'orderTermsStatus',
  'orderTermsStatusTag',
  'partyDetails',
  'respondentAliasesConditional',
  'respondentEmployerConditional',
  'respondentItem',
  'respondentRestrictedInformationConditional',
  'respondentStatus',
  'respondentStatusTag',
  'respondentThirdPartyConditional',
  'returnToCaseDetails',
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
const formElements = new Set(['button', 'input', 'select', 'textarea']);

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

const structuralIdentifierExpressions = new Set([
  'applicantTypeConditionalId',
  'conditionalId',
  'nonUkBankConditionalId',
  'ukBankConditionalId',
]);

const isStructuralExpression = (expression) =>
  structuralIdentifierExpressions.has(expression.replace(/\s+/g, ' ').trim());

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

const failures = [];
const fieldNamesByDirectory = new Map();
for (const definition of pageDefinitions) {
  const fieldNamesPath = resolve(createCasefileRoot, definition.fieldNamesFile);
  const source = await readFile(fieldNamesPath, 'utf8');
  const fieldNames = new Map();
  const values = new Set();
  const entryPattern = /^\s*([A-Za-z][A-Za-z0-9]*):\s*'([^']+)',?\s*$/gm;
  let entryMatch;

  while ((entryMatch = entryPattern.exec(source)) !== null) {
    const [, key, value] = entryMatch;
    const line = lineNumberAt(source, entryMatch.index);
    if (!isCanonicalIdentifier(value, [definition.prefix])) {
      failures.push(`${relative(repositoryRoot, fieldNamesPath)}:${line}: ${key} does not use ${definition.prefix}`);
    }
    if (values.has(value)) {
      failures.push(`${relative(repositoryRoot, fieldNamesPath)}:${line}: duplicate field-name value "${value}"`);
    }
    fieldNames.set(key, value);
    values.add(value);
  }

  if (fieldNames.size === 0) {
    failures.push(`${relative(repositoryRoot, fieldNamesPath)}: no field-name entries found`);
  }
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
  const pageDefinition = pageDefinitionFor(templatePath);
  const acceptedPrefixes = acceptedPrefixesFor(templatePath);
  const fieldNames = pageDefinition === undefined ? undefined : fieldNamesByDirectory.get(pageDefinition.directory);
  const ids = new Map();
  const tagPattern = /<([a-z][\w-]*)\b([^>]*)>/gis;
  let tagMatch;

  while ((tagMatch = tagPattern.exec(source)) !== null) {
    const tagName = tagMatch[1].toLowerCase();
    const attributes = tagMatch[2];
    const attributesOffset = tagMatch.index + tagMatch[0].indexOf(attributes);
    const attributePattern =
      /(?:^|\s)(\[)?((?:attr\.)?(?:buttonId|checkboxFieldName|checkboxFieldsetId|conditionalId|fieldSetId|id|inputId|inputName|name|nonUkBankConditionalId|reasonFieldName|selectId|selectName|summaryListId|summaryListRowId|tagId|taskListId|taskListItemId|taskListStatusId|ukBankConditionalId))(\])?\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let attributeMatch;

    while ((attributeMatch = attributePattern.exec(attributes)) !== null) {
      const attributeName = attributeMatch[2].replace('attr.', '');
      if (!identifierAttributes.has(attributeName)) continue;

      const isBound = Boolean(attributeMatch[1] || attributeMatch[3] || attributeMatch[2].startsWith('attr.'));
      if (
        (attributeName === 'id' || attributeName === 'name') &&
        !isBound &&
        attributeName === 'name' &&
        !formElements.has(tagName)
      ) {
        continue;
      }

      const value = attributeMatch[4] ?? attributeMatch[5] ?? '';
      const line = lineNumberAt(source, attributesOffset + attributeMatch.index);
      let valid;
      if (fieldIdentifierAttributes.has(attributeName)) {
        valid = isBound
          ? isCanonicalExpression(value, acceptedPrefixes, fieldNames)
          : isCanonicalIdentifier(value, acceptedPrefixes);
      } else if (structuralIdentifierAttributes.has(attributeName)) {
        valid = isBound ? isStructuralExpression(value) : structuralIdentifiers.has(value);
      } else {
        valid = isBound
          ? isCanonicalExpression(value, acceptedPrefixes, fieldNames) || isStructuralExpression(value)
          : isCanonicalIdentifier(value, acceptedPrefixes) || structuralIdentifiers.has(value);
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
