-- ============================================================
-- MIGRATION: Recria Materialized Views com índices únicos
-- para suporte ao REFRESH MATERIALIZED VIEW CONCURRENTLY
-- ============================================================

-- ========================================
-- DROP todas as views existentes
-- (ordem importa: filtered depende das outras)
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS mv_salary_filtered;
DROP MATERIALIZED VIEW IF EXISTS mv_salary_by_stack;
DROP MATERIALIZED VIEW IF EXISTS mv_salary_by_city;
DROP MATERIALIZED VIEW IF EXISTS mv_salary_global;

-- ========================================
-- MATERIALIZED VIEW: GLOBAL
-- Adicionado ROW_NUMBER() AS id como âncora única
-- ========================================
CREATE MATERIALIZED VIEW mv_salary_global AS
SELECT
  ROW_NUMBER() OVER () AS id,
  AVG(s.salary)        AS average_salary,
  NOW()                AS updated_at
FROM salary_history s
INNER JOIN (
  SELECT profile_id, MAX(created_at) AS max_date
  FROM salary_history
  GROUP BY profile_id
) latest
  ON s.profile_id  = latest.profile_id
 AND s.created_at  = latest.max_date;

CREATE UNIQUE INDEX idx_mv_salary_global_id
  ON mv_salary_global (id);

-- ========================================
-- MATERIALIZED VIEW: BY STACK
-- stack_id é único pelo GROUP BY
-- ========================================
CREATE MATERIALIZED VIEW mv_salary_by_stack AS
SELECT
  ps.stack_id,
  AVG(s.salary)              AS average_salary,
  COUNT(DISTINCT s.profile_id) AS total_records,
  NOW()                      AS updated_at
FROM salary_history s
INNER JOIN (
  SELECT profile_id, MAX(created_at) AS max_date
  FROM salary_history
  GROUP BY profile_id
) latest
  ON s.profile_id  = latest.profile_id
 AND s.created_at  = latest.max_date
JOIN profile_stacks ps
  ON ps.profile_id = s.profile_id
GROUP BY ps.stack_id;

CREATE UNIQUE INDEX idx_mv_salary_by_stack_stack_id
  ON mv_salary_by_stack (stack_id);

-- ========================================
-- MATERIALIZED VIEW: BY CITY
-- city_id é único pelo GROUP BY
-- ========================================
CREATE MATERIALIZED VIEW mv_salary_by_city AS
SELECT
  p.city_id,
  AVG(s.salary)              AS average_salary,
  COUNT(DISTINCT s.profile_id) AS total_records,
  NOW()                      AS updated_at
FROM salary_history s
INNER JOIN (
  SELECT profile_id, MAX(created_at) AS max_date
  FROM salary_history
  GROUP BY profile_id
) latest
  ON s.profile_id  = latest.profile_id
 AND s.created_at  = latest.max_date
JOIN professional_profiles p
  ON p.id = s.profile_id
GROUP BY p.city_id;

CREATE UNIQUE INDEX idx_mv_salary_by_city_city_id
  ON mv_salary_by_city (city_id);

-- ========================================
-- MATERIALIZED VIEW: FILTERED
-- Combinação (stack_id, city_id, experience_level) única pelo GROUP BY
-- ========================================
CREATE MATERIALIZED VIEW mv_salary_filtered AS
SELECT
  ps.stack_id,
  p.city_id,
  p.experience_level,
  AVG(s.salary)              AS average_salary,
  COUNT(DISTINCT s.profile_id) AS total_records
FROM salary_history s
INNER JOIN (
  SELECT profile_id, MAX(created_at) AS max_date
  FROM salary_history
  GROUP BY profile_id
) latest
  ON s.profile_id  = latest.profile_id
 AND s.created_at  = latest.max_date
JOIN professional_profiles p
  ON p.id = s.profile_id
JOIN profile_stacks ps
  ON ps.profile_id = p.id
GROUP BY ps.stack_id, p.city_id, p.experience_level;

CREATE UNIQUE INDEX idx_mv_salary_filtered_composite
  ON mv_salary_filtered (stack_id, city_id, experience_level);