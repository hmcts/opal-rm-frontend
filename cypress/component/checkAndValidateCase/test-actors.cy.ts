import { getTestActor } from '../../support/test-actors';

const buildTags = (): string[] => ['@JIRA-STORY:PO-10628', '@JIRA-EPIC:PO-10817'];

describe('Shared RM test actor selection', () => {
  let original: unknown;
  beforeEach(() => {
    original = Cypress.env('RM_TEST_ACTORS');
    Cypress.env({ RM_TEST_ACTORS: undefined });
  });
  afterEach(() => Cypress.env({ RM_TEST_ACTORS: original }));

  it(
    'AC2, AC3. should reuse existing provisioned defaults without ticket-specific configuration',
    { tags: buildTags() },
    () => {
      expect(getTestActor('inputter')).to.equal('opal-test@dev.platform.hmcts.net');
      expect(getTestActor('checker')).to.equal('opal-test-10@dev.platform.hmcts.net');
      expect(getTestActor('deniedUser')).to.equal('opal-test-4@dev.platform.hmcts.net');
    },
  );

  it(
    'AC2, AC3. should apply shared role overrides without changing other defaults or the supplied object',
    { tags: buildTags() },
    () => {
      const configured = {
        inputter: ' synthetic-primary ',
        secondInputter: 'synthetic-second',
        foreignBuInputter: 'synthetic-foreign',
      };
      Cypress.env('RM_TEST_ACTORS', configured);
      expect(getTestActor('inputter')).to.equal('synthetic-primary');
      expect(getTestActor('secondInputter')).to.equal('synthetic-second');
      expect(getTestActor('foreignBuInputter')).to.equal('synthetic-foreign');
      expect(getTestActor('checker')).to.equal('opal-test-10@dev.platform.hmcts.net');
      expect(configured.inputter).to.equal(' synthetic-primary ');
    },
  );

  it(
    'AC2, AC3. should require explicitly selected optional actors without inventing accounts',
    { tags: buildTags() },
    () => {
      expect(() => getTestActor('secondInputter')).to.throw("RM test actor 'secondInputter'");
      expect(() => getTestActor('foreignBuInputter')).to.throw("RM test actor 'foreignBuInputter'");
    },
  );

  it(
    'AC2, AC3. should reject malformed configuration and invalid actor overrides before authentication',
    { tags: buildTags() },
    () => {
      for (const value of [null, true, 'synthetic', []]) {
        Cypress.env('RM_TEST_ACTORS', value);
        expect(() => getTestActor('inputter')).to.throw('RM_TEST_ACTORS must be an object');
      }
      for (const value of [null, true, '', ' ']) {
        Cypress.env('RM_TEST_ACTORS', { checker: value });
        expect(() => getTestActor('checker')).to.throw("RM test actor 'checker'");
      }
    },
  );
});
