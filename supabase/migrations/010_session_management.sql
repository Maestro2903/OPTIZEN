-- Session Management System for Enhanced Security
-- This migration creates session tracking tables and security features

-- Create user_sessions table for comprehensive session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id TEXT PRIMARY KEY, -- Custom session ID
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    terminated_at TIMESTAMP WITH TIME ZONE,
    termination_reason TEXT, -- 'user_logout', 'expired', 'force_logout', 'ip_mismatch', etc.
    location JSONB DEFAULT '{}', -- Geolocation data if available
    device_fingerprint TEXT, -- Browser fingerprinting for additional security
    role_snapshot JSONB DEFAULT '[]', -- Snapshot of user roles at session creation
    metadata JSONB DEFAULT '{}' -- Additional session metadata
);

-- Create failed_login_attempts table for security monitoring
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    ip_address INET,
    user_agent TEXT,
    attempt_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    failure_reason TEXT, -- 'invalid_password', 'account_locked', 'invalid_email', etc.
    metadata JSONB DEFAULT '{}'
);

-- Create security_events table for advanced threat detection
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'suspicious_login', 'ip_change', 'multiple_failures', etc.
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address ON public.user_sessions(ip_address);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON public.failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip_address ON public.failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempt_time ON public.failed_login_attempts(attempt_time);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON public.security_events(ip_address);

-- Add updated_at trigger for user_sessions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_sessions_updated_at ON public.user_sessions;
CREATE TRIGGER user_sessions_updated_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Mark expired sessions as inactive
    UPDATE public.user_sessions
    SET is_active = FALSE,
        terminated_at = TIMEZONE('utc', NOW()),
        termination_reason = 'expired'
    WHERE expires_at < TIMEZONE('utc', NOW())
    AND is_active = TRUE;

    GET DIAGNOSTICS expired_count = ROW_COUNT;

    -- Clean up old failed login attempts (keep 30 days)
    DELETE FROM public.failed_login_attempts
    WHERE attempt_time < TIMEZONE('utc', NOW()) - INTERVAL '30 days';

    -- Clean up resolved security events (keep 90 days)
    DELETE FROM public.security_events
    WHERE resolved_at IS NOT NULL
    AND resolved_at < TIMEZONE('utc', NOW()) - INTERVAL '90 days';

    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious login patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_login(
    p_email TEXT,
    p_ip_address INET,
    p_user_agent TEXT
)
RETURNS JSONB AS $$
DECLARE
    failed_attempts_count INTEGER;
    recent_ip_changes INTEGER;
    result JSONB := '{}';
BEGIN
    -- Count failed attempts in last 15 minutes
    SELECT COUNT(*)
    INTO failed_attempts_count
    FROM public.failed_login_attempts
    WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '15 minutes';

    -- Count IP changes for this email in last 24 hours
    SELECT COUNT(DISTINCT ip_address)
    INTO recent_ip_changes
    FROM public.failed_login_attempts
    WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '24 hours';

    -- Build result
    result := jsonb_build_object(
        'suspicious', FALSE,
        'failed_attempts', failed_attempts_count,
        'recent_ip_changes', recent_ip_changes,
        'reasons', '[]'::jsonb
    );

    -- Check for suspicious patterns
    IF failed_attempts_count >= 5 THEN
        result := jsonb_set(result, '{suspicious}', 'true'::jsonb);
        result := jsonb_set(result, '{reasons}', result->'reasons' || '["too_many_failed_attempts"]'::jsonb);
    END IF;

    IF recent_ip_changes >= 10 THEN
        result := jsonb_set(result, '{suspicious}', 'true'::jsonb);
        result := jsonb_set(result, '{reasons}', result->'reasons' || '["multiple_ip_addresses"]'::jsonb);
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_severity TEXT,
    p_description TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.security_events (
        user_id,
        event_type,
        severity,
        description,
        ip_address,
        user_agent,
        session_id,
        metadata
    ) VALUES (
        p_user_id,
        p_event_type,
        p_severity,
        p_description,
        p_ip_address,
        p_user_agent,
        p_session_id,
        p_metadata
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for session analytics
CREATE OR REPLACE VIEW public.session_analytics AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(EXTRACT(EPOCH FROM (COALESCE(terminated_at, last_activity) - created_at))) as avg_duration_seconds,
    COUNT(CASE WHEN termination_reason = 'expired' THEN 1 END) as expired_sessions,
    COUNT(CASE WHEN termination_reason = 'user_logout' THEN 1 END) as user_logouts,
    COUNT(CASE WHEN termination_reason = 'force_logout' THEN 1 END) as force_logouts
FROM public.user_sessions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Create view for security dashboard
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT
    'failed_logins_last_hour' as metric,
    COUNT(*)::TEXT as value,
    'Last Hour' as period
FROM public.failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT
    'active_sessions' as metric,
    COUNT(*)::TEXT as value,
    'Current' as period
FROM public.user_sessions
WHERE is_active = TRUE
AND expires_at > NOW()

UNION ALL

SELECT
    'security_events_today' as metric,
    COUNT(*)::TEXT as value,
    'Today' as period
FROM public.security_events
WHERE created_at > CURRENT_DATE

UNION ALL

SELECT
    'unique_ips_today' as metric,
    COUNT(DISTINCT ip_address)::TEXT as value,
    'Today' as period
FROM public.user_sessions
WHERE created_at > CURRENT_DATE;

-- Enable RLS for security tables
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_sessions (users can only see their own sessions)
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
            AND ur.is_active = true
        )
    );

-- Users can update their own sessions (for logout)
CREATE POLICY "Users can update their own sessions" ON public.user_sessions
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Only super admins can view failed login attempts and security events
CREATE POLICY "Super admins can view failed login attempts" ON public.failed_login_attempts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'super_admin'
            AND ur.is_active = true
        )
    );

CREATE POLICY "Super admins can view security events" ON public.security_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'super_admin'
            AND ur.is_active = true
        )
    );

-- Add comments
COMMENT ON TABLE public.user_sessions IS 'User session tracking for security and compliance';
COMMENT ON TABLE public.failed_login_attempts IS 'Failed login attempts for security monitoring';
COMMENT ON TABLE public.security_events IS 'Security events and incidents tracking';

COMMENT ON VIEW public.session_analytics IS 'Session analytics for monitoring user activity patterns';
COMMENT ON VIEW public.security_dashboard IS 'Real-time security metrics dashboard';

COMMENT ON FUNCTION public.cleanup_expired_sessions IS 'Automated cleanup of expired sessions and old security data';
COMMENT ON FUNCTION public.detect_suspicious_login IS 'Detect suspicious login patterns for security alerts';
COMMENT ON FUNCTION public.log_security_event IS 'Log security events for monitoring and compliance';

-- Schedule automatic cleanup (if you have pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-sessions', '*/15 * * * *', 'SELECT public.cleanup_expired_sessions();');