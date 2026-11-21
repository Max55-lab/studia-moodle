# Referentni API — server-side autorizacija i prava baza

Zaseban, izvediv artefakt koji pokazuje kako izgleda sigurnosni sloj iz
[`docs/USE-CASE.md`](../../docs/USE-CASE.md) i [`docs/schema.sql`](../../docs/schema.sql).
Nastao je prema **ADR-002**. Nije dio produkcijskog smjera iz ADR-001 i **nije
spojen** na statički portal ni na `server/moodle-proxy.js`.

## Pokretanje

Ne treba `npm install` — koriste se samo ugrađeni moduli Nodea 22+ (`node:sqlite`,
`node:http`, `node:crypto`).

```bash
node server/reference/server.js
# ili: npm run serve:reference
```

Poslužitelj sluša na `http://127.0.0.1:8790`. Baza se kreira pri prvom pokretanju u
`server/reference/data/reference.db` (može se preusmjeriti varijablom
`STUDIA_REF_DB`). Testovi koriste vlastitu privremenu bazu.

## Generički demo korisnici

Svi korisnici imaju isti demo password: **`Demo123!`**. To nije tajna ni pravi
korisnički podatak — samo ogledni identiteti.

| E-mail | Uloga | Dozvole |
| --- | --- | --- |
| `admin@demo.sum.ba` | SuperAdmin | sve |
| `moderator@demo.sum.ba` | FacultyModerator | read, upload, verify, delete |
| `lead@demo.sum.ba` | CourseLead | read, upload, verify |
| `pro@demo.sum.ba` | StudentPro | read, upload |
| `free@demo.sum.ba` | StudentFree | read |
| `guest@demo.sum.ba` | GuestViewer | nema dozvola za materijale |
| `pro@demo.other.ba` | StudentPro | read, upload (druga institucija) |

## Endpointi

| Metoda | Put | Zahtjev | Opis |
| --- | --- | --- | --- |
| `GET` | `/health` | — | status servisa |
| `POST` | `/api/v1/auth/login` | `{email, password}` | kreira sesiju i CSRF token |
| `POST` | `/api/v1/auth/logout` | sesija + CSRF | poništava sesiju |
| `GET` | `/api/v1/me` | sesija | identitet, uloge, dozvole |
| `GET` | `/api/v1/materials` | `material:read` | samo materijali prijavljene institucije |
| `POST` | `/api/v1/materials` | `material:upload` + CSRF | novi materijal u sesijskoj instituciji |
| `PATCH` | `/api/v1/materials/:id` | `material:verify` + CSRF | verifikacija materijala |
| `DELETE` | `/api/v1/materials/:id` | `material:delete` + CSRF | meko brisanje (`status='deleted'`) |
| `GET` | `/api/v1/admin/users` | `admin:access` | korisnici samo iz vlastite institucije |

Primjer prijave i čitanja:

```bash
curl -s -X POST http://127.0.0.1:8790/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pro@demo.sum.ba","password":"Demo123!"}'
# → {"token":"...","csrfToken":"...", ...}

curl -s http://127.0.0.1:8790/api/v1/materials \
  -H "Authorization: Bearer <token>"
```

Mutacije šalju zaglavlje `x-csrf-token: <csrfToken>`.

## Sigurnosna pravila koja se provjeravaju

- **Identitet prije ovlasti:** bez važeće sesije svaka zaštićena ruta vraća **401**.
- **Autorizacija na poslužitelju:** korisnik bez dozvole dobiva **403 Forbidden**
  s porukom koja navodi traženu dozvolu. Klijentsko skrivanje gumba nije zaštita.
- **CSRF na mutacijama:** pogrešan ili izostanak tokena vraća **403**.
- **Izolacija stanara:** institucija se izvodi iz sesije, nikad iz tijela zahtjeva.
  Pokušaj podmetanja `institutionId` vraća **403**; upit nad tuđim materijalom
  vraća **404**. U produkcijskoj PostgreSQL varijanti tu ulogu ima RLS.
- **Lozinke:** scrypt sa saltom, pohranjene kao `scrypt$...`; tokeni sesija čuvaju
  se kao SHA-256 digesti, nikad u čistom tekstu.
- **Zaglavlja:** CSP, HSTS, `nosniff`, `no-referrer`, `no-store`, strogi CORS
  (zadano nijedan izvor; postavlja se `STUDIA_REF_ORIGIN`).
- **Rate limiting:** najviše 10 prijava po IP-u u minuti (`STUDIA_REF_LOGIN_LIMIT`
  se koristi samo u testovima).
- **Audit log:** upload, verifikacija i brisanje upisuju `audit_logs`.

## Testovi

```bash
node --test tests/api/reference-api.test.js     # ili: npm run test:api
```

16 testova pokriva prijavu, 401/403, CSRF, tenant izolaciju, CRUD materijala,
administraciju, odjavu, hashiranje i audit log. Testovi se također pokreću unutar
`node scripts/check.mjs`.

## Što ovo nije

Nije produkcijski backend za SUM, nema pravih studentskih podataka, nije spojen
na Moodle i ne zamjenjuje `theme_studia`. Prelazak u produkciju zahtijeva novu ADR
odluku, PostgreSQL iz `docs/schema.sql`, EduID/Moodle identitet i pravni okvir
obrade osobnih podataka.
