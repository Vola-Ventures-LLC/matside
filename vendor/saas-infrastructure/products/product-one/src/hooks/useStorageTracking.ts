import { supabase } from "@/integrations/supabase/client";
import { COST_RATES, estimateStorageCost } from "./useCostMonitoring";

/**
 * Track file upload costs
 * Call this after successfully uploading a file to storage
 */
export async function trackStorageUpload(
  userId: string,
  fileSizeBytes: number,
  bucket: string,
  fileName: string
): Promise<void> {
  try {
    const estimatedCostCents = estimateStorageCost(fileSizeBytes, true);
    
    await supabase.rpc("record_usage", {
      p_user_id: userId,
      p_organization_id: null,
      p_resource_type: "storage",
      p_category: bucket,
      p_tokens_input: 0,
      p_tokens_output: 0,
      p_units: 1,
      p_model: null,
      p_estimated_cost_cents: estimatedCostCents,
      p_metadata: { 
        bucket, 
        file_name: fileName, 
        file_size_bytes: fileSizeBytes,
        file_size_mb: (fileSizeBytes / (1024 * 1024)).toFixed(2)
      },
    });
  } catch (error) {
    console.error("Failed to track storage usage:", error);
  }
}

/**
 * Track Stripe transaction fees
 * Call this when processing payments
 */
export async function trackStripeTransaction(
  userId: string,
  amountCents: number,
  transactionType: string,
  stripePaymentIntentId?: string
): Promise<void> {
  try {
    // Calculate Stripe fee: 2.9% + $0.30
    const percentFee = (amountCents * COST_RATES.stripe.percentFee) / 100;
    const totalFeeCents = percentFee + COST_RATES.stripe.fixedFeeCents;
    
    await supabase.rpc("record_usage", {
      p_user_id: userId,
      p_organization_id: null,
      p_resource_type: "stripe",
      p_category: transactionType,
      p_tokens_input: 0,
      p_tokens_output: 0,
      p_units: 1,
      p_model: null,
      p_estimated_cost_cents: totalFeeCents,
      p_metadata: { 
        transaction_type: transactionType,
        gross_amount_cents: amountCents,
        stripe_payment_intent_id: stripePaymentIntentId,
        percent_fee: percentFee.toFixed(2),
        fixed_fee: COST_RATES.stripe.fixedFeeCents
      },
    });
  } catch (error) {
    console.error("Failed to track Stripe fees:", error);
  }
}
