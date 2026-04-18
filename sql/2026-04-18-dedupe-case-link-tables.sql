-- Dedupe case_clients / case_defendants / case_opponents before
-- applying the @Unique constraints from the entities. Keeps the
-- lowest id per (case, party) pair and drops the rest.

BEGIN;

DELETE FROM case_clients
WHERE id NOT IN (
  SELECT MIN(id) FROM case_clients GROUP BY case_id, client_id
);

DELETE FROM case_defendants
WHERE id NOT IN (
  SELECT MIN(id) FROM case_defendants GROUP BY case_id, defendant_id
);

DELETE FROM case_opponents
WHERE id NOT IN (
  SELECT MIN(id) FROM case_opponents GROUP BY case_id, opponent_id
);

ALTER TABLE case_clients
  ADD CONSTRAINT uq_case_clients_case_client UNIQUE (case_id, client_id);

ALTER TABLE case_defendants
  ADD CONSTRAINT uq_case_defendants_case_defendant UNIQUE (case_id, defendant_id);

ALTER TABLE case_opponents
  ADD CONSTRAINT uq_case_opponents_case_opponent UNIQUE (case_id, opponent_id);

COMMIT;
