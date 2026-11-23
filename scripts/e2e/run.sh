#!/bin/bash
# Crée un compte de test temporaire, lance le scénario complet, le compte est supprimé à la fin (delete-account).
# Usage (environnement cloud, secrets réseau Supabase et Gemini) : scripts/e2e/run.sh <photo.jpg>
ROOT=$(cd "$(dirname "$0")/../.." && pwd); PHOTO=$(realpath "$1"); S=$(mktemp -d); cd $S
PW=$(python3 -c "import secrets;print(secrets.token_urlsafe(18))")
python3 - "$PW" > q4.json <<'PY'
import json,sys
pw=sys.argv[1]; u='33333333-3333-4333-8333-333333333333'
sql=f"""insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('{u}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','e2e-test@exemple.invalid', crypt('{pw}', gen_salt('bf')), now(), '{{"provider":"email","providers":["email"]}}', '{{}}', now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '{u}', '{u}', '{{"sub":"{u}","email":"e2e-test@exemple.invalid","email_verified":true}}', 'email', now(), now(), now());"""
print(json.dumps({'query':sql}))
PY
curl -s -X POST "https://api.supabase.com/v1/projects/syitvnkpdzeapvvekbzk/database/query" -H "Authorization: Bearer dummy" -H "Content-Type: application/json" -d @q4.json >/dev/null
curl -s -X POST "https://syitvnkpdzeapvvekbzk.supabase.co/auth/v1/token?grant_type=password" -H "apikey: sb_publishable_jbXF_1Zg6xY6QnuTzgw4Lw_Bcd1x7zd" -H "Content-Type: application/json" -d "{\"email\":\"e2e-test@exemple.invalid\",\"password\":\"$PW\"}" | python3 -c "import json,sys; d=json.load(sys.stdin); open('.jwt','w').write(d.get('access_token',''))"
(cd $ROOT && NODE_USE_ENV_PROXY=1 node --no-warnings scripts/e2e/scenario.mjs $S $PHOTO)
rm -f .jwt q4.json
curl -s -X POST "https://api.supabase.com/v1/projects/syitvnkpdzeapvvekbzk/database/query" -H "Authorization: Bearer dummy" -H "Content-Type: application/json" -d '{"query":"delete from auth.users where email = '"'"'e2e-test@exemple.invalid'"'"' returning id"}'; echo " (restes supprimés)"
