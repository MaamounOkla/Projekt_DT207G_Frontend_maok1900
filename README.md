 
---

# Norra Café – Frontend
# Projekt DT207G

## Beskrivning
Publik webbplats + enkel adminpanel för Norra Café. Frontend är byggd med **HTML/CSS/Vanilla JS** och konsumerar ett Node/Express-API med JWT.

## Författare  
- Maamoun Okla  

## Senaste uppdatering  
- 2025-10-24  
 

 
## Innehåll

* [Funktioner](#funktioner)
* [Struktur](#struktur)
* [Krav](#krav)
* [Konfiguration](#konfiguration)
* [Köra lokalt](#köra-lokalt)
* [Bygg & deploy](#bygg--deploy)
* [API-kontrakt (översikt)](#api-kontrakt-översikt)
* [Tillgänglighet](#tillgänglighet)
* [Felsökning](#felsökning)
* [Licens](#licens)

---

## Funktioner

**Publik sida (`index.html`)**

* Hero med animerade ikoner.
* **Menyvisning grupperad per kategori** (t.ex. Mat, Dryck, Dessert). Nya kategorier visas automatiskt.
* Sektion **“Om oss”** med bild och text.
* Sektion **“Var & När”** med adress och Google Maps inbäddning.
* Responsiv design.

**Adminpanel (`admin.html`)**

* Inloggning (JWT). Token lagras i `sessionStorage`.
* Skapa menyartikel (titel, pris, kategori, beskrivning, bild + alt-text).
* Lista, ändra pris, byt bild, ta bort artikel.
* Form-validering på klienten och serverfel visas i UI.

---

## Struktur

```text
frontend/
├─ index.html            # Publik startsida
├─ admin.html            # Adminpanel
├─ styles.css            # Gemensamma stilar
├─ admin.css             # Adminspecifika stilar
├─ main.js               # Publik: hämtar & renderar meny, grupperar per kategori
├─ admin.js              # Admin: login + CRUD + filuppladdning
└─ images/
   ├─ NorraCafelogo1.png
   ├─ BG.jpg
   ├─ hotdog.png
   ├─ burgerIcon.png
   ├─ coffemug.png
   └─ (övriga bilder, t.ex. about.jpg, ute.jpg)
```

---

## Krav

* Valfri statisk HTTP-server (t.ex. VS Code **Live Server**, `npx serve`, Netlify, Vercel).
* Backend-API körande lokalt eller externt (se **Konfiguration**).
* Modern webbläsare.

---

## Konfiguration

Frontend använder **konstanta bas-URL:er** i JavaScript:

* `main.js`

  ```js
  const API_URL = 'http://127.0.0.1:3000/api/menu';
  const ASSETS_URL = 'http://127.0.0.1:3000';
  ```
* `admin.js`

  ```js
  const API = 'http://127.0.0.1:3000/api';
  ```

Ändra dessa om backend körs på annan domän/port (t.ex. vid deploy).

> Glöm inte att backendens **CORS** måste tillåta din frontend-domän.

---

## Köra lokalt

1. Starta backend (se backend-README). Kontrollera att API:t svarar på `http://127.0.0.1:3000/api`.
2. Starta en enkel statisk server i `frontend/`:

   ```bash
   # alternativ 1 – med serve
   npx serve -p 5500

   # alternativ 2 – VS Code Live Server
   # högerklicka på index.html → "Open with Live Server"
   ```
3. Öppna `http://127.0.0.1:5500` (eller den port Live Server visar).
4. Gå till **/admin.html** för att logga in och testa CRUD.

---

## Bygg & deploy

Frontend är statisk – ingen build krävs. Du kan:

* Lägga upp på **Netlify**, **Vercel**, **GitHub Pages**.
* Se till att **backendens CORS** tillåter frontendens domän (https).
* Undvika **blandat innehåll** (don’t mix http backend med https frontend).

---

## API-kontrakt (översikt)

**Auth**

* `POST /api/login`
  **Body:** `{ "username": string, "password": string }`
  **Res:** `{ "token": string }`

**Menu**

* `GET /api/menu` → `[MenuItem]` (offentligt)
* `POST /api/menu` *(auth)* → skapa (stöd för `multipart/form-data`)
* `PUT /api/menu/:id` *(auth)* → uppdatera pris eller bild (JSON eller FormData)
* `DELETE /api/menu/:id` *(auth)* → ta bort

**MenuItem (JSON)**

```json
{
  "_id": "string",
  "title": "string",
  "price": 89,
  "category": "Mat",
  "description": "string",
  "imageUrl": "/uploads/abc.jpg",
  "imageAlt": "Alt text"
}
```

---

## Tillgänglighet

* Semantiska rubriker för sektioner (h2–h3).
* Korrekt `alt` på alla bilder (admin uppmanar alt-text vid bilduppladdning).
* Legendariska `<legend>` i `fieldset` + separat sektionstitel för skärmläsare.
* Kontrast och stor typografi enligt design (justera `:root`-variabler vid behov).

---

## Felsökning

**Inget laddas i menyn**

* Öppna konsolen → se status i `[menu]`-loggar.
* Kontrollera `API_URL` i `main.js`.
* Säkerställ att backend körs och returnerar JSON på `/api/menu`.

**CORS-fel**

* Lägg till din frontend-origin i backendens CORS (t.ex. `https://din-domän.netlify.app`).
* Undvik att blanda `http` (backend) med `https` (frontend).

**Bilder visas inte**

* Kontrollera att backend exponerar `app.use('/uploads', express.static(...))`.
* Frontend bygger bild-URL som `${ASSETS_URL}${item.imageUrl}`.

**Inloggning misslyckas**

* Rätt användare/lösen?
* Inspektera nätverkstrafik i devtools.
* Token lagras i `sessionStorage` – se att `Authorization: Bearer <token>` skickas.

---

## Licens

 
© Norra Café / Maamoun Okla.
