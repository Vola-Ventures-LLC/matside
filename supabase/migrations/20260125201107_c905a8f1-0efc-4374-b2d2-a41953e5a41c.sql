-- Add explicit restrictive DELETE policy to ensure audit trail is immutable
-- This explicitly documents that no one can delete audit records
CREATE POLICY "No one can delete consent audit records"
ON public.consent_audit
AS RESTRICTIVE
FOR DELETE
USING (false);