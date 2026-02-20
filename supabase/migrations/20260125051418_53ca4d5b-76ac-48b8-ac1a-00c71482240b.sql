-- Update the check constraint to include 'unconfirmed' status
ALTER TABLE public.meet_attendance DROP CONSTRAINT IF EXISTS meet_attendance_status_check;
ALTER TABLE public.meet_attendance ADD CONSTRAINT meet_attendance_status_check 
  CHECK (status IN ('pending', 'unconfirmed', 'attending', 'not_attending', 'arriving_late', 'leaving_early'));