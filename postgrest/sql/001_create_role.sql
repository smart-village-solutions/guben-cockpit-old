DO
$$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'guben_public_content_reader'
  ) THEN
    CREATE ROLE guben_public_content_reader NOLOGIN;
  END IF;
END
$$;

COMMENT ON ROLE guben_public_content_reader IS
  'Read-only PostgREST role for public content exposed via schema public_content.';
