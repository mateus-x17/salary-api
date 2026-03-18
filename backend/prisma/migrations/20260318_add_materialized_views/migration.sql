-- ========================================
-- MATERIALIZED VIEW: GLOBAL
-- ========================================
CREATE MATERIALIZED VIEW mv_salary_global AS
SELECT 
  AVG(s.salary) AS average_salary,
  NOW() AS updated_at
FROM salary_history s
INNER JOIN (
  SELECT profile_id, MAX(created_at) as max_date
  FROM salary_history
  GROUP BY profile_id
) latest 
ON s.profile_id = latest.profile_id 
AND s.created_at = latest.max_date;

-- ========================================
-- MATERIALIZED VIEW: BY STACK
-- ========================================
CREATE MATERIALIZED VIEW mv_salary_by_stack AS
SELECT 
  ps.stack_id,
  AVG(s.salary) AS average_salary,
  COUNT(DISTINCT s.profile_id) AS total_records,
  NOW() AS updated_at
FROM salary_history s
INNER JOIN (
  SELECT profile_id, MAX(created_at) as max_date
  FROM salary_history
  GROUP BY profile_id
) latest 
ON s.profile_id = latest.profile_id 
AND s.created_at = latest.max_date
JOIN profile_stacks ps 
ON ps.profile_id = s.profile_id
GROUP BY ps.stack_id;

-- ========================================
-- MATERIALIZED VIEW: BY CITY
-- ========================================
CREATE MATERIALIZED VIEW mv_salary_by_city AS
SELECT 
  p.city_id,
  AVG(s.salary) AS average_salary,
  COUNT(DISTINCT s.profile_id) AS total_records,
  NOW() AS updated_at
FROM salary_history s
INNER JOIN (
  SELECT profile_id, MAX(created_at) as max_date
  FROM salary_history
  GROUP BY profile_id
) latest 
ON s.profile_id = latest.profile_id 
AND s.created_at = latest.max_date
JOIN professional_profiles p 
ON p.id = s.profile_id
GROUP BY p.city_id;

-- ========================================
-- MATERIALIZED VIEW: FILTERED
-- ========================================
CREATE MATERIALIZED VIEW mv_salary_filtered AS
SELECT 
  ps.stack_id,
  p.city_id,
  p.experience_level,
  AVG(s.salary) AS average_salary,
  COUNT(DISTINCT s.profile_id) AS total_records
FROM salary_history s
INNER JOIN (
  SELECT profile_id, MAX(created_at) as max_date
  FROM salary_history
  GROUP BY profile_id
) latest 
ON s.profile_id = latest.profile_id 
AND s.created_at = latest.max_date
JOIN professional_profiles p 
ON p.id = s.profile_id
JOIN profile_stacks ps 
ON ps.profile_id = p.id
GROUP BY ps.stack_id, p.city_id, p.experience_level;