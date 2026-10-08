# varsity connect

campus marketplace, lost & found, and survival mode. minimal warm styling in the
stardust spirit, everything lowercase in the ui.

## stack

- backend: java 21, spring boot, maven, mysql, flyway, jwt
- frontend: react, typescript, vite, tailwind, router, tanstack query, axios

## local setup (no docker)

1. mysql running locally, database `varsity_connect` (created automatically by url flag too)
   - `mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS varsity_connect;"`
2. backend
   - `cd backend`
   - set env or copy `.env.example` values into your shell
   - `mvn spring-boot:run -Dspring-boot.run.profiles=dev`
   - health: `GET http://localhost:8080/actuator/health`
   - swagger: `http://localhost:8080/swagger-ui.html`
3. frontend
   - `cd frontend`
   - `npm install`
   - copy `.env.example` to `.env` if you need to point elsewhere
   - `npm run dev` (http://localhost:5173)

## builds + tests

- backend: `cd backend` then `mvn test`, `mvn package`
- frontend: `cd frontend` then `npm run build`, `npm test`

## env vars

backend: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRY`,
`CORS_ALLOWED_ORIGINS`, `MEDIA_UPLOAD_DIR`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`PAYMENT_MOCK_ENABLED`, `PORT`

frontend: `VITE_API_URL`, `VITE_WS_URL`, `VITE_CPUT_EMERGENCY_PHONE`

## demo payment

payments are simulated, no gateway, no card fields anywhere. on an order
receipt choose pay now (simulate success) or simulate failure. success marks
listings SOLD and empties the basket, failure returns stock to the shelf and
keeps the basket for a retry.

## demo and admin users

- buyer: `demo@cput.ac.za` / `password123` (student `22990099`)
- seller: `marketdemo@cput.ac.za` / `password123` (lists on the market)
- admins never come from signup. set `ADMIN_EMAIL` + `ADMIN_PASSWORD` and
  restart the backend once; the seeder creates the account and never touches
  it again. the seeded admin opens `/admin` (moderation desk).

## docker startup (other machines)

local dev here runs mysql + maven + vite directly, docker stays dormant.
elsewhere: `docker compose up --build` starts mysql (healthy first), the
backend on 8080 (production profile, flyway migrates), and the static
frontend on 5173. copy real values into the environment first, never bake
secrets into images.

## tracker

`varsity-connect-muse-implementation-tracker.md` is canonical. work one stage at a
time, only check boxes after code + tests + build pass.
