# HomeBase

Lanceur perso : une icône sur l'écran d'accueil, mes projets en gros boutons, recherche
floue, accès direct à chaque GitHub Page. Les projets apparaissent **automatiquement**
dès qu'un repo porte le topic `homebase` — aucune liste à maintenir.

**En ligne :** https://baillebye.github.io/

---

## État du projet

**Fait :**
- [x] App complète (`index.html`) : UI sombre, recherche floue (masquée ≤ 7 projets),
      cartes tactiles, ligne de statut, bouton actualiser, états chargement/vide/erreur.
- [x] Hors-ligne + installable : `manifest.json`, balises iOS, `sw.js` (service worker).
- [x] Données auto : GitHub Action qui régénère `repos.json` (quotidien + à chaque push + manuel).
- [x] Icônes + `repos.json` de départ.

**À faire (déploiement, une fois) :**
- [ ] Créer le repo `BailleBye.github.io` et pousser les fichiers.
- [ ] Activer GitHub Pages.
- [ ] Passer les permissions Actions en « Read and write ».
- [ ] Lancer le workflow une fois.
- [ ] Ajouter à l'écran d'accueil (Safari iOS).
- [ ] Course-List : renommer `courses.html` → `index.html` (ou remplir « Website »).

Une fois ça fait, le projet tourne tout seul : tu n'y reviens que pour ajouter un projet.

---

## Ajouter un projet à HomeBase

C'est la seule manip récurrente, et elle prend 30 secondes :

1. Le repo doit être **public**.
2. Son fichier d'entrée doit être **`index.html` à la racine du repo** → ça donne l'URL
   propre `https://baillebye.github.io/<nom-du-repo>/`. (GitHub Pages ne sert pas un
   `autre.html` automatiquement.)
3. Ajoute le topic **`homebase`** : page du repo → roue ⚙️ à côté de « About » →
   champ **Topics** → tape `homebase` → Entrée → **Save changes**. (Minuscules obligatoires.)
4. (Optionnel) Remplis la **description** du repo (elle s'affiche sous le nom) et/ou le
   champ **Website** (il force l'URL d'ouverture si tu veux pointer ailleurs).

Le projet apparaît dans HomeBase :
- automatiquement au prochain passage de l'Action (chaque jour à 06:00 UTC), **ou**
- tout de suite si tu relances le workflow à la main :
  onglet **Actions → « Build repos.json » → Run workflow**.

Le **nom du repo devient le libellé** du bouton (les `-` et `_` deviennent des espaces,
première lettre en majuscule). Nomme le repo en conséquence. Le point à gauche est olive
si la GitHub Page est en ligne, gris si c'est un repo sans Page (le bouton ouvre alors le repo).

---

## Déploiement (une seule fois)

1. **Crée le repo** `BailleBye.github.io` (public) — le nom exact sert le lanceur à la racine.
2. **Pousse ces fichiers** à la racine, dossier `.github/workflows/` inclus.
3. **Active Pages** : *Settings → Pages → Source : « Deploy from a branch » →
   `main` / `/ (root)`*.
4. **Autorise l'écriture** : *Settings → Actions → General → Workflow permissions →
   « Read and write permissions »*. (Sans ça, l'Action ne peut pas mettre à jour `repos.json`.)
5. **Lance l'Action** une fois : *Actions → « Build repos.json » → Run workflow*.
6. **Installe** : ouvre `https://baillebye.github.io/` dans **Safari** → Partager →
   **« Sur l'écran d'accueil »**.

### À régler pour Course-List
Son fichier déployé est `courses.html` → l'URL propre `/Course-List/` renvoie une 404.
Soit tu renommes `courses.html` → `index.html` (recommandé, et garde cette convention pour
tes futurs projets), soit tu mets `https://baillebye.github.io/Course-List/courses.html`
dans le champ « Website » du repo (l'Action l'utilise en priorité). En attendant, le
`repos.json` fourni pointe déjà vers `courses.html`.

---

## Comment ça marche

- **Aucun appel à l'API GitHub côté navigateur.** Une GitHub Action interroge l'API côté
  serveur (avec le `GITHUB_TOKEN` intégré, éphémère, jamais exposé), garde tes repos
  tagués `homebase`, et écrit `repos.json` dans le repo. L'app ne lit que ce fichier
  statique → **pas de limite de débit, pas de token côté client.**
- **Ordre d'ouverture d'un projet** : champ « Website » s'il est rempli → GitHub Page par
  convention → repo.
- **Tri** : les projets que tu ouvres le plus remontent automatiquement (compté en local,
  par appareil), départagés par la date du dernier push. En recherche, c'est la pertinence
  qui prime.
- **Hors-ligne** : le service worker met la coquille en cache et les données sont gardées
  en cache local ; l'app s'ouvre instantanément même sans réseau, puis se rafraîchit en fond.
- **Mises à jour** : quand tu déploies une nouvelle version (et que tu as bumpé `CACHE`),
  l'app affiche une barre « mettre à jour » au lieu de changer en douce — tu choisis quand recharger.

---

## Personnaliser

- **Couleurs / thème** : variables CSS dans `:root` (haut de `index.html`).
- **Quand la recherche apparaît** : constante `SEARCH_THRESHOLD` dans `index.html`.
- **Fréquence de mise à jour** : `cron` dans `.github/workflows/build-repos.yml`.
- **Après modif de l'app** (`index.html`, `sw.js`, icônes) : incrémente `CACHE` dans
  `sw.js` (`homebase-v2` → `homebase-v3`…). L'app proposera alors une barre « mettre à jour ».

> `repos.json` est généré automatiquement — ne pas l'éditer à la main, il serait écrasé.
