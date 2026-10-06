-- Database schema.
-- Docker runs this automatically the first time the database container starts.
-- Without Docker, run it yourself:  psql -U postgres -d app -f database/schema.sql

CREATE TABLE IF NOT EXISTS todos (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  completed   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
