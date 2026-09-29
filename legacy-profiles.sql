SELECT
  id,
  email,
  full_name,
  school,
  grade,
  phone,
  registered_events
FROM public.profiles
ORDER BY created_at;
