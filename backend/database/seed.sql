-- Sample data. Runs after schema.sql (Docker) or run it yourself:
--   psql -U postgres -d app -f database/seed.sql

INSERT INTO todos (title, completed) VALUES
  ('Explore the project structure', TRUE),
  ('Run the backend and the frontend', FALSE),
  ('Build something awesome', FALSE);
