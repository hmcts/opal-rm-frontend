import { inject, Injectable } from '@angular/core';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import type { IOpalMaintenanceApplicationReferenceDataItem } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-item.interface';
import type { ICasesCreateCasefileOrderDetails } from '../../interfaces/cases-create-casefile-order-details.interface';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES } from '../constants/cases-create-casefile-order-details-payment-frequencies.constant';
import type { ICasesCreateCasefileOrderDetailsFormData } from '../interfaces/cases-create-casefile-order-details-form-data.interface';

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileOrderDetailsMapperService {
  private readonly dateService = inject(DateService);

  private toCanonicalDate(value: string | null): string {
    if (value === null || !/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      throw new Error('Invalid Order Details date');
    }

    const date = this.dateService.getFromFormat(value, 'dd/MM/yyyy');
    const canonical = date.toFormat('yyyy-MM-dd');

    if (!date.isValid || canonical > this.dateService.getDateNow().toFormat('yyyy-MM-dd')) {
      throw new Error('Invalid Order Details date');
    }

    return canonical;
  }

  public toAutocompleteItems(
    records: IOpalMaintenanceApplicationReferenceDataItem[],
  ): IAlphagovAccessibleAutocompleteItem[] {
    return records.map((record) => ({
      name: `${record.application_code} - ${record.application_title}`,
      value: record.application_id,
    }));
  }

  public toFormData(saved: ICasesCreateCasefileOrderDetails | null): ICasesCreateCasefileOrderDetailsFormData {
    return {
      create_casefile_order_details_application_id: saved?.applicationId ?? null,
      create_casefile_order_details_court: saved?.court ?? null,
      create_casefile_order_details_date_order_made: saved?.dateOrderMade
        ? this.dateService.getFromFormatToFormat(saved.dateOrderMade, 'yyyy-MM-dd', 'dd/MM/yyyy')
        : null,
      create_casefile_order_details_payment_frequency: saved?.paymentFrequency ?? null,
      create_casefile_order_details_date_arrears_last_updated: saved?.dateArrearsLastUpdated
        ? this.dateService.getFromFormatToFormat(saved.dateArrearsLastUpdated, 'yyyy-MM-dd', 'dd/MM/yyyy')
        : null,
    };
  }

  public toOrderDetails(
    form: ICasesCreateCasefileOrderDetailsFormData,
    records: IOpalMaintenanceApplicationReferenceDataItem[],
  ): ICasesCreateCasefileOrderDetails {
    const selected = form.create_casefile_order_details_application_id;
    const record = records.find((item) => selected === item.application_id || selected === String(item.application_id));
    const frequency = CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES.find(
      (value) => value === form.create_casefile_order_details_payment_frequency,
    );
    const court = form.create_casefile_order_details_court?.trim() || null;
    const orderDate = form.create_casefile_order_details_date_order_made;

    if (!record || !frequency || (court !== null && court.length > 40)) {
      throw new Error('Invalid Order Details selection');
    }

    return {
      applicationId: record.application_id,
      court,
      dateOrderMade: orderDate === null || orderDate === '' ? null : this.toCanonicalDate(orderDate),
      paymentFrequency: frequency,
      dateArrearsLastUpdated: this.toCanonicalDate(form.create_casefile_order_details_date_arrears_last_updated),
    };
  }
}
