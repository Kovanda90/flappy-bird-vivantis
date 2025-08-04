# Flappy Bird - Vivantis Edition

Hra Flappy Bird vytvořená pro zaměstnance Vivantisu s možností soutěžení v online žebříčku.

## 🎮 Jak hrát

1. **Ovládání:**
   - Klikněte na obrazovku nebo stiskněte mezerník pro skok ptáčka
   - Na mobilních zařízeních stačí dotknout se obrazovky

2. **Cíl hry:**
   - Proletěte co nejvíce překážek (trubek)
   - Každá překážka = 1 bod
   - Vyhněte se nárazu do trubek nebo země

3. **Funkce:**
   - Lokální žebříček (top 10 nejlepších výsledků)
   - Ukládání skóre s jménem hráče
   - Responzivní design pro mobilní zařízení

## 🚀 Jak spustit hru

1. **Lokální spuštění:**
   - Otevřete soubor `index.html` v prohlížeči
   - Nebo použijte lokální server (doporučeno)

2. **Lokální server (doporučeno):**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (pokud máte nainstalovaný)
   npx http-server
   ```

3. **Otevřete v prohlížeči:**
   - Přejděte na `http://localhost:8000`

## 📱 Mobilní optimalizace

Hra je plně optimalizována pro mobilní zařízení:
- Touch ovládání
- Responzivní design
- Optimalizované pro vertikální orientaci

## 🔧 Technické detaily

- **Technologie:** HTML5, CSS3, JavaScript (ES6+)
- **Canvas:** Pro vykreslování hry
- **LocalStorage:** Pro ukládání žebříčku
- **Responzivní design:** CSS Grid a Flexbox

## 🎨 Vlastní úpravy

### Přidání historie Vivantisu

Pro přidání historických prvků Vivantisu můžete:

1. **Upravit pozadí podle období:**
   ```javascript
   // V game.js přidejte různé pozadí podle skóre
   if (this.score < 10) {
       // Pozadí pro 90. léta
   } else if (this.score < 20) {
       // Pozadí pro 2000-2010
   }
   ```

2. **Přidat informační karty:**
   - Vytvořte popup s historií firmy
   - Zobrazujte při dosažení určitých bodů

3. **Upravit překážky:**
   - Různé typy trubek podle období
   - Historické symboly jako překážky

### Online žebříček

Pro vytvoření online žebříčku budete potřebovat:

1. **Backend službu (zdarma):**
   - Firebase (Google)
   - Supabase
   - Vercel + MongoDB

2. **API endpointy:**
   - POST /scores - uložení skóre
   - GET /leaderboard - získání žebříčku

## 📈 Další kroky vývoje

1. **Fáze 1 - Základní hra ✅**
   - [x] Základní mechanika Flappy Bird
   - [x] Responzivní design
   - [x] Lokální žebříček

2. **Fáze 2 - Historie Vivantisu**
   - [ ] Různé pozadí podle období
   - [ ] Historické překážky
   - [ ] Informační karty o firmě

3. **Fáze 3 - Online funkcionality**
   - [ ] Online žebříček
   - [ ] Uživatelská autentifikace
   - [ ] Push notifikace

4. **Fáze 4 - Optimalizace**
   - [ ] Testování na různých zařízeních
   - [ ] Optimalizace výkonu
   - [ ] Bug fixes

## 🎯 Hosting (zdarma)

Pro zveřejnění hry můžete použít:

1. **GitHub Pages:**
   - Nahrajte na GitHub
   - Povolte GitHub Pages v nastavení

2. **Netlify:**
   - Drag & drop složky s hrou
   - Automatické nasazení

3. **Vercel:**
   - Propojte s GitHub repozitářem
   - Automatické nasazení při změnách

## 📞 Podpora

Pro jakékoliv dotazy nebo pomoc s vývojem kontaktujte autora hry.

---

**Vytvořeno pro zaměstnance Vivantisu** 🏢 