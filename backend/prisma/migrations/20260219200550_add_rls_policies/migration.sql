DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crm_app') THEN
    CREATE ROLE crm_app WITH LOGIN PASSWORD 'crm_app_password';
  END IF;
END
$$;
GRANT CONNECT ON DATABASE crm_db TO crm_app;
GRANT USAGE ON SCHEMA public TO crm_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO crm_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO crm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO crm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO crm_app;

ALTER TABLE "contacts"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deals"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pipelines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stages"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "member"    ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON "contacts"
  AS PERMISSIVE FOR ALL TO crm_app
  USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation ON "deals"
  AS PERMISSIVE FOR ALL TO crm_app
  USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation ON "pipelines"
  AS PERMISSIVE FOR ALL TO crm_app
  USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation ON "stages"
  AS PERMISSIVE FOR ALL TO crm_app
  USING ("pipelineId" IN (
    SELECT "id" FROM "pipelines"
    WHERE "organizationId" = current_setting('app.current_organization_id', true)
  ));

CREATE POLICY org_isolation ON "member"
  AS PERMISSIVE FOR ALL TO crm_app
  USING ("organizationId" = current_setting('app.current_organization_id', true));