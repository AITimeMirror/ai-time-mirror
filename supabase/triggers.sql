/*
 Triggers
 */
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE TRIGGER "customer" AFTER INSERT OR DELETE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://your_domain/api/webhooks/supabase/customer', 'POST', '{"Content-type":"application/json"}', '{}', '1000');
