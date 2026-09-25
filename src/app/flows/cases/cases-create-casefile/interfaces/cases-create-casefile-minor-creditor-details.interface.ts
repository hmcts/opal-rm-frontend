import type { CasesCreateCasefileMinorCreditorBank } from '../types/cases-create-casefile-minor-creditor-bank.type';
import type { CasesCreateCasefileMinorCreditorIdentity } from '../types/cases-create-casefile-minor-creditor-identity.type';
import type { ICasesCreateCasefilePartyAddress } from './cases-create-casefile-party-address.interface';

export interface ICasesCreateCasefileMinorCreditorDetails {
  identity: CasesCreateCasefileMinorCreditorIdentity;
  address: ICasesCreateCasefilePartyAddress;
  bank: CasesCreateCasefileMinorCreditorBank;
}
