import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { DraftCasefileConcurrencyFlow } from '../../../e2e/functional/opal/flows/checkAndValidateCase/draft-casefile-concurrency.flow';

const flow = new DraftCasefileConcurrencyFlow();

Given('an independent synthetic case is ready for a {string} journey', (journey: string) => flow.prepare(journey));
Given('the next case change loses its successful response', () => flow.inject('lost-response'));
Given('the next case change definitely fails before reaching the backend', () => flow.inject('definite-failure'));
Given('another authorised action advances the saved case', () => flow.compete());
Given('the case is prepared for a {string} recovery outcome', (fault: string) => flow.prepareRecovery(fault));
When('I submit the case change', () => flow.submit());
Then('the case change outcome is uncertain and its context is retained', () => flow.assertUncertain());
When('I recover the saved case through its supported controls', () => flow.recover());
Then('the saved case shows exactly one committed {string} outcome', (journey: string) => flow.assertCommitted(journey));
Then('recovery has not replayed the case change', () => flow.assertFinalState());
Then('the saved case is unchanged and my complete corrections are retained', () => flow.assertDefiniteFailure());
When('I explicitly retry the corrected case change', () => flow.retryExplicitly());
Then('the stale case change is refused without changing the winning outcome', () => flow.assertConflict());
Then('I see the authoritative winning outcome without replaying my change', () => flow.assertWinner());
Then('the recovery message and controls are accessible', () => flow.assertRecovery());
When('I use the recovery controls with the keyboard', () => flow.recoverUsingKeyboard());
Then('I reach the supported next state without an automatic case change', () => flow.assertAccessibleNextState());
