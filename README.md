# varsity connect

campus marketplace, lost & found, survival mode, and community. minimal warm
styling in the stardust spirit, everything lowercase in the ui.

## what you need

- **java 21** (`java -version`)
- **maven** (`mvn -version`) — or use the included wrapper `./mvnw`
- **node 22** (`node -version`), npm comes with it
- **mysql 8** running locally

## fastest start (windows)

double-click **`start-varsity-connect.bat`** in this folder. it checks java
and node, builds the backend jar if needed, installs frontend packages if
needed, then opens two windows: backend on :8080, frontend on :5173.

give the backend about a minute (watch for `Started VarsityConnectApplication`
in its window), then open http://localhost:5173.

## manual start

1. mysql running locally, then create the database (it is also created
   automatically by the url flag):
   - `mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS varsity_connect;"`
2. backend
   - `cd backend`
   - set env or copy `.env.example` values into your shell
   - `mvn spring-boot:run -Dspring-boot.run.profiles=dev`
   - health: `GET http://localhost:8080/actuator/health`
   - swagger: `http://localhost:8080/swagger-ui.html`
   - double-clickable alternative: `backend\start-backend.bat` (needs
     `mvn package` first so `target\*.jar` exists)
3. frontend
   - `cd frontend`
   - `npm install`
   - copy `.env.example` to `.env` if you need to point elsewhere
   - `npm run dev` (http://localhost:5173)

## testing on your phone (same wifi)

1. find this machine's wifi ip (`ipconfig`, e.g. `192.168.0.139`)
2. backend must allow the phone origin — start it with e.g.
   `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://192.168.0.139:5173`
3. frontend `.env`:
   - `VITE_API_URL=http://192.168.0.139:8080/api/v1`
   - `VITE_WS_URL=http://192.168.0.139:8080/ws`
4. restart `npm run dev` (`vite --host` is already on) and open
   `http://192.168.0.139:5173` on the phone. allow windows firewall when asked.

## demo accounts

- buyer: `demo@cput.ac.za` / `password123` (student `22990099`)
- seller: `marketdemo@cput.ac.za` / `password123` (lists on the market)
- seed sellers: `seed-amahle` … `seed-eliers@cput.ac.za` / `password123`

admins never come from signup. set `ADMIN_EMAIL` + `ADMIN_PASSWORD` and
restart the backend once; the seeder creates the account and never touches
it again. the seeded admin opens `/admin` (moderation desk).

## seeded market

the dev backend stocks the market up to ~400 listings on boot (idempotent —
a full shelf means it skips). photos are deterministic placeholders from
picsum, one per title, so cards and galleries always have something to show.
test and prod profiles never seed.

## builds + tests

- backend: `cd backend` then `mvn test`, `mvn package`
  (`./mvnw clean verify` for the full fresh pass)
- frontend: `cd frontend` then `npm run build`, `npm test`
- end to end: `npm run test:e2e` (needs chromium: `npx playwright install
  chromium`, plus both servers running)

## env vars

backend: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRY`,
`CORS_ALLOWED_ORIGINS`, `MEDIA_UPLOAD_DIR`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`PAYMENT_MOCK_ENABLED`, `PORT`

frontend: `VITE_API_URL`, `VITE_WS_URL`, `VITE_CPUT_EMERGENCY_PHONE`

production boot: `SPRING_PROFILES_ACTIVE=prod` with every variable above
exported (no defaults for secrets or the database). flyway migrates on
startup, jpa validates the schema.

## demo payment

payments are simulated, no gateway, no card fields anywhere. on an order
receipt choose pay now (simulate success) or simulate failure. success marks
listings SOLD and empties the basket, failure returns stock to the shelf and
keeps the basket for a retry.

## features

marketplace with search and filters, cart, checkout with reservation,
orders with seller-ready and complete flow, lost & found with smart matching
and dual accept, survival board with offers, community threads and replies,
ratings and reviews on completed orders, aggregate dashboard, persisted +
realtime notifications with toasts, admin moderation desk.

## tracker

`varsity-connect-muse-implementation-tracker.md` is canonical. work one stage
at a time, only check boxes after code + tests + build pass.

## troubleshooting

- **backend window closes instantly** — java 21 missing, or port 8080 busy
  (another backend already running?), or mysql down. read the error text.
- **frontend shows network error** — backend not up yet, or `.env` urls
  point somewhere unreachable. health-check the backend first.
- **login fails after disabling a user** — expected, re-enable from `/admin`.
- **lost & found pair never matches** — score needs 55+: same category and
  close wording, location, and date.
- **websocket toasts silent** — sign out and back in (token drives the
  socket), and confirm `VITE_WS_URL` reaches the backend host.
