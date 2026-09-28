## Scop
Aplicație pentru urmărirea veniturilor și cheltuielilor personale, ca să am disciplină financiară. O folosesc zilnic, mai ales de pe telefon; pe PC intru ocazional pentru analiză.

## Constrângeri
- Cost ZERO: fără servicii plătite, fără backend, fără conturi. Toate datele rămân local, în browser (IndexedDB).
- PWA instalabilă pe telefon, care funcționează offline.
- Mobile-first, cu layout responsive. Pe desktop folosește spațiul suplimentar pentru grafice și tabele.
- Interfața este în limba română. Moneda implicită este RON.
- Cod în engleză (nume de variabile, funcții, fișiere), texte din UI în română.

## Stack
Vite + React + TypeScript, Tailwind CSS, Dexie (IndexedDB), Recharts, vite-plugin-pwa, Vitest pentru teste.

## Reguli de cod
- Sumele de bani se stochează ca numere ÎNTREGI în subunități (bani), niciodată ca float. Conversia și formatarea se fac într-un singur loc (utilitar dedicat).
- Datele se stochează ca string ISO (YYYY-MM-DD), în ora locală, fără probleme de fus orar.
- Logica de business (calcule, filtre, agregări) stă în funcții pure, separate de componente, ca să poată fi testată.
- Componente mici, cu un singur rol. Fără cod mort, fără dependențe în plus față de stack fără să mă întrebi.
- Tot ce înseamnă acțiune distructivă (ștergere) cere confirmare.
- Accesibilitate de bază: butoane de minimum 44px, contrast bun, label-uri la câmpuri.

## Mod de lucru
- Lucrăm pe etape. La fiecare etapă faci DOAR ce cere etapa respectivă, nimic în plus.
- La finalul fiecărei etape: rulezi build-ul și testele, îmi spui ce ai făcut, cum verific manual și ce ai lăsat intenționat pentru etapele următoare. Apoi te oprești și aștepți.
- Dacă ceva e ambiguu, întreabă-mă înainte să presupui.
