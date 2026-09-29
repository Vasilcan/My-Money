# Finanțe - Aplicație de Buget Personal

O aplicație web progresivă (PWA) gratuită, rapidă și sigură pentru urmărirea veniturilor și cheltuielilor personale. Concepută cu o abordare "mobile-first", funcționează complet offline și îți păstrează datele local, pe dispozitivul tău, fără a necesita creare de conturi sau conexiune la un server backend.

## Funcționalități principale
- 🚀 **Complet Offline:** Toate datele sunt salvate local în browserul tău (folosind IndexedDB / Dexie.js).
- 📱 **Instalabilă (PWA):** Se poate instala pe telefon sau pe desktop direct din browser (Add to Home Screen), comportându-se ca o aplicație nativă.
- 📊 **Analiză detaliată:** Grafice vizuale (evoluție lunară, categorii) și comparații de la o lună la alta.
- 🎯 **Bugete lunare:** Setează limite pe categorii și urmărește progresul zilnic pentru a nu depăși suma alocată.
- 💾 **Export și Import (Backup):** Ești stăpânul datelor tale. Poți exporta oricând tranzacțiile în format CSV (pentru Excel) sau JSON (pentru backup complet / migrare pe alt dispozitiv).
- 🌙 **Mod Întunecat (Dark Mode):** Automat în funcție de setările telefonului sau comutare manuală din setări.

## Stack Tehnologic
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Dexie.js](https://dexie.org/) (pentru IndexedDB)
- [Recharts](https://recharts.org/) (pentru grafice)
- [Vitest](https://vitest.dev/) (pentru teste unitare)

---

## 💻 Cum rulezi aplicația local

1. Clonează acest repository:
   ```bash
   git clone <link-repo>
   cd "Finance APP"
   ```
2. Instalează dependențele:
   ```bash
   npm install
   ```
3. Pornește serverul de dezvoltare:
   ```bash
   npm run dev
   ```
4. Rulează testele:
   ```bash
   npm run test
   ```
5. Construiește aplicația pentru producție:
   ```bash
   npm run build
   ```

---

## ☁️ Cum publici aplicația GRATUIT (Cloudflare Pages)

Cea mai simplă, rapidă și gratuită metodă de a pune aplicația pe internet este **Cloudflare Pages**. Mai jos sunt pașii exacți (în limba română):

1. **Urcă codul pe GitHub**: Dacă nu ai făcut-o deja, creează un cont pe GitHub și împinge (push) acest cod într-un repository nou.
2. **Creează un cont pe Cloudflare**: Mergi la [dash.cloudflare.com](https://dash.cloudflare.com) și creează-ți un cont gratuit.
3. **Adaugă un proiect Pages**: 
   - În meniul din stânga, apasă pe **Workers & Pages**.
   - Apasă butonul albastru **Create application** (sau Create).
   - Selectează tab-ul **Pages** și apasă pe **Connect to Git**.
4. **Conectează GitHub**:
   - Autorizează Cloudflare să îți acceseze contul de GitHub.
   - Selectează repository-ul unde ai urcat codul aplicației de Finanțe.
   - Apasă pe **Begin setup**.
5. **Setări de Build** (foarte important):
   - **Project name:** alege un nume (ex: `finante-app`). Va genera un link de forma `finante-app.pages.dev`.
   - **Production branch:** `main` (sau `master`).
   - **Framework preset:** Alege **Vite** (dacă nu există, lasă pe `None`).
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. Apasă **Save and Deploy**. Cloudflare va descărca codul tău, va rula comanda de build și îți va oferi un link valid (ex: `https://finante-app.pages.dev`) unde aplicația ta va fi online, sigură (HTTPS) și rapidă. Ori de câte ori vei face un "push" pe GitHub, Cloudflare va actualiza aplicația automat!

---

## 📱 Cum o instalez pe telefon?

1. Deschide browserul (Safari pe iOS, Chrome pe Android).
2. Accesează linkul aplicației (ex: linkul tău de pe Cloudflare Pages).
3. **Pe iOS (Safari):** Apasă pe butonul de *Share* (pătratul cu o săgeată în sus) și alege **"Add to Home Screen"** (Adaugă pe ecranul principal).
4. **Pe Android (Chrome):** Browserul îți va arăta probabil un mesaj în partea de jos cu "Add to Home Screen". Dacă nu, apasă pe cele 3 puncte (Meniu) și selectează **"Install app"** (Instalează aplicația).
5. Aplicația va apărea ca o pictogramă pe telefonul tău. O poți deschide de acolo. Se va deschide pe tot ecranul (fără bara de browser) și va funcționa și dacă nu ai internet (Mod Avion).

## 💾 Cum fac backup și migrez datele?

1. De pe dispozitivul curent, intră în aplicație la secțiunea **Setări**.
2. Mergi la zona "Date și backup" și apasă **Backup complet JSON**. Un fișier va fi salvat în descărcările tale.
3. Dacă vrei să muți datele pe PC sau alt telefon, trimite-ți acel fișier ție însuți (prin email, WhatsApp etc.).
4. Pe noul dispozitiv, instalează/deschide aplicația, mergi la Setări -> Date și backup -> **Importă Backup** -> Selectează fișierul JSON. 
5. Alege "Înlocuiește tot" pentru a suprascrie datele noului dispozitiv cu datele din backup.

