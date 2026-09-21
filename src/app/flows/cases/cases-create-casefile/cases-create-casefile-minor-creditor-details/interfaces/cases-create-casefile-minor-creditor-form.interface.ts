import type { IAbstractFormBaseForm } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import type { ICasesCreateCasefileMinorCreditorFormData } from './cases-create-casefile-minor-creditor-form-data.interface';

// The emitted value always supplies nestedFlow: false; the base-compatible type is required by AbstractFormBaseComponent.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ICasesCreateCasefileMinorCreditorForm extends IAbstractFormBaseForm<ICasesCreateCasefileMinorCreditorFormData> {}
