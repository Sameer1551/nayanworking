package com.nayaneyecare.dto;

import com.nayaneyecare.entity.BillingRecord;

public class BillingRecordSaveResult {

    private final BillingRecord billingRecord;
    private final boolean duplicate;

    public BillingRecordSaveResult(BillingRecord billingRecord, boolean duplicate) {
        this.billingRecord = billingRecord;
        this.duplicate = duplicate;
    }

    public BillingRecord getBillingRecord() {
        return billingRecord;
    }

    public boolean isDuplicate() {
        return duplicate;
    }
}
