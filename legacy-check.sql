SELECT
  e.id,
  e.title,
  e.event_id,
  e.start_date,
  e.end_date,
  e.duration,
  COUNT(es.id) AS submission_count
FROM public.exams e
LEFT JOIN public.exam_submissions es
  ON es.exam_id = e.id
GROUP BY
  e.id,
  e.title,
  e.event_id,
  e.start_date,
  e.end_date,
  e.duration
ORDER BY e.start_date;
