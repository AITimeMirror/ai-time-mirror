SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- 扩展部分 (从 schema.sql)
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
COMMENT ON SCHEMA "public" IS 'standard public schema';
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

SET default_tablespace = '';
SET default_table_access_method = "heap";

/*
 TABLES
 */

create table
    public.users (
        id uuid not null default auth.uid (),
        credits numeric not null default '0'::numeric,
        name text not null,
        email text not null,
        image text null,
        stripe_id text null,
        constraint users_pkey primary key (id),
        constraint users_id_fkey foreign key (id) references auth.users (id) on update cascade on delete cascade
) tablespace pg_default;
CREATE POLICY "Enable select for users based on user_id" ON "public"."users" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));
alter table public.users enable row level security;

create table
    public.data (
        id text not null,
        output text null,
        input text null,
        failed boolean null,
        created_at timestamp with time zone null default now(),
        user_id uuid null default auth.uid (),
        constraint data_pkey primary key (id),
        constraint data_user_id_fkey foreign key (user_id) references auth.users (id) on update cascade on delete set null
) tablespace pg_default;
alter publication supabase_realtime add table public.data;
create policy "Enable ALL for users based on user_id" on public.data to "authenticated" using ((( select "auth"."uid"() as "uid") = "user_id")) with check ((( select "auth"."uid"() as "uid") = "user_id"));
create policy "Enable read access for all users" on public.data for select using (true);
alter table public.data enable row level security;

create table
    public.products (
        id text not null,
        active boolean null,
        attributes jsonb null,
        created numeric null,
        default_price text null,
        description text null,
        images jsonb null,
        livemode boolean null,
        marketing_features jsonb null,
        metadata jsonb null,
        name text null,
        package_dimensions jsonb null,
        shippable boolean null,
        statement_descriptor text null,
        tax_code text null,
        type text null,
        unit_label text null,
        updated numeric null,
        url text null,
        object text null,
        constraint products_pkey primary key (id)
) tablespace pg_default;
alter table public.products enable row level security;

create table
    public.prices (
        id text not null,
        active boolean null,
        billing_scheme text null,
        created numeric null,
        currency text null,
        custom_unit_amount jsonb null,
        livemode boolean null,
        lookup_key text null,
        metadata jsonb null,
        nickname text null,
        product text null,
        recurring jsonb null,
        tax_behavior text null,
        tiers_mode text null,
        transform_quantity jsonb null,
        type text null,
        unit_amount numeric null,
        unit_amount_decimal text null,
        object text null,
        constraint prices_pkey primary key (id)
) tablespace pg_default;
alter table public.prices enable row level security;


/*
 Functions
 */

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
AS $$begin
    insert into public.users (id, email, name, image)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    return new;
end;$$;

CREATE OR REPLACE FUNCTION "public"."get_products"() RETURNS TABLE("id" "text", "price_id" "text", "name" "text", "description" "text", "price" numeric, "credits" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
        SELECT
            products.id,
            prices.id,
            products.name,
            products.description,
            ROUND((prices.unit_amount / 100.0), 2),
            (products.metadata ->> 'credits')::NUMERIC
        FROM
            products
                JOIN prices ON products.id = prices.product
        WHERE products.active = true;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_credits"("user_id" "uuid", "credit_amount" numeric) RETURNS numeric
    LANGUAGE "plpgsql"
AS $$
DECLARE current_credits numeric;

BEGIN
    SELECT credits INTO current_credits FROM public.users WHERE id = user_id;

    IF current_credits IS NOT NULL
    THEN UPDATE public.users SET credits = current_credits + credit_amount WHERE id = user_id;
    ELSE RAISE EXCEPTION 'User not found or permission denied';
    END IF;

    RETURN current_credits + credit_amount;
END;
$$;

/*
 Triggers
 */
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE TRIGGER "customer" AFTER INSERT OR DELETE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://ai-aging-pied.vercel.app/api/webhooks/supabase/customer', 'POST', '{"Content-type":"application/json"}', '{}', '1000');

/*
 Permissions
 */
ALTER FUNCTION "public"."get_products"() OWNER TO "postgres";
ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";
ALTER FUNCTION "public"."update_credits"("user_id" "uuid", "credit_amount" numeric) OWNER TO "postgres";

ALTER TABLE "public"."data" OWNER TO "postgres";
ALTER TABLE "public"."prices" OWNER TO "postgres";
ALTER TABLE "public"."products" OWNER TO "postgres";
ALTER TABLE "public"."users" OWNER TO "postgres";

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."get_products"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_products"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_credits"("user_id" "uuid", "credit_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_credits"("user_id" "uuid", "credit_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_credits"("user_id" "uuid", "credit_amount" numeric) TO "service_role";

GRANT ALL ON TABLE "public"."data" TO "anon";
GRANT ALL ON TABLE "public"."data" TO "authenticated";
GRANT ALL ON TABLE "public"."data" TO "service_role";

GRANT ALL ON TABLE "public"."prices" TO "anon";
GRANT ALL ON TABLE "public"."prices" TO "authenticated";
GRANT ALL ON TABLE "public"."prices" TO "service_role";

GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;