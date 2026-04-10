DO
$$
DECLARE
  denied BOOLEAN := FALSE;
BEGIN
  SET ROLE guben_public_content_reader;

  PERFORM 1 FROM public_content.pages LIMIT 1;
  PERFORM 1 FROM public_content.footer_items LIMIT 1;

  BEGIN
    EXECUTE 'SELECT 1 FROM "Guben"."User" LIMIT 1';
  EXCEPTION
    WHEN insufficient_privilege THEN
      denied := TRUE;
  END;

  IF NOT denied THEN
    RAISE EXCEPTION 'Expected non-approved object access to be denied';
  END IF;

  denied := FALSE;

  BEGIN
    EXECUTE $sql$
      INSERT INTO public_content.footer_items (id, name, content)
      VALUES ('00000000-0000-0000-0000-000000000001', 'blocked', 'blocked')
    $sql$;
  EXCEPTION
    WHEN insufficient_privilege OR object_not_in_prerequisite_state OR read_only_sql_transaction THEN
      denied := TRUE;
  END;

  IF NOT denied THEN
    RAISE EXCEPTION 'Expected write operation through public_content.footer_items to be denied';
  END IF;

  RESET ROLE;
END
$$;
