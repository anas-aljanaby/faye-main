-- Track which financial transaction marked a month as paid so mistaken
-- transactions can safely restore the previous state or remove newly-created rows.

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS paid_transaction_id UUID REFERENCES financial_transactions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_by_transaction_id UUID REFERENCES financial_transactions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS previous_status_before_paid TEXT CHECK (
        previous_status_before_paid IN ('مدفوع', 'مستحق', 'متأخر', 'قيد المعالجة')
    ),
    ADD COLUMN IF NOT EXISTS previous_amount_before_paid NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_payments_paid_transaction_id
    ON payments(paid_transaction_id)
    WHERE paid_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_created_by_transaction_id
    ON payments(created_by_transaction_id)
    WHERE created_by_transaction_id IS NOT NULL;
