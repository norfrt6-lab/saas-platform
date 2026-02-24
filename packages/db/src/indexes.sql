-- Multi-tenant access patterns
CREATE INDEX idx_projects_team_id ON projects (team_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_team_slug ON projects (team_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_team_members_user_id ON team_members (user_id);
CREATE INDEX idx_team_members_team_id ON team_members (team_id);

-- Billing
CREATE INDEX idx_teams_stripe_customer ON teams (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_teams_billing_status ON teams (billing_status) WHERE billing_status != 'active';

-- Audit logs (time-range queries)
CREATE INDEX idx_audit_logs_team_created ON audit_logs (team_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action, created_at DESC);

-- API Keys (lookup by hash)
CREATE UNIQUE INDEX idx_api_keys_hashed ON api_keys (hashed_key);

-- Invitations (token lookup)
CREATE UNIQUE INDEX idx_invitations_token ON invitations (token) WHERE status = 'pending';

-- Soft delete purge job
CREATE INDEX idx_projects_purge ON projects (scheduled_purge_at) WHERE scheduled_purge_at IS NOT NULL;

-- Notifications (user inbox)
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, created_at DESC) WHERE read = false;

-- Usage records
CREATE INDEX idx_usage_records_team_period ON usage_records (team_id, period, metric);
