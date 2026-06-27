# CLAUDE.md — HomeBase

Brief technique pour reprendre le projet en session de code. Lis-le avant de modifier quoi que ce soit.

## But

Lanceur perso : **une PWA installée sur l'écran d'accueil** qui liste les projets de
l'utilisateur (repos GitHub) en gros boutons tactiles, avec recherche floue et accès
direct à chaque GitHub Page. Objectif assumé : remplacer « ouvrir GitHub sur mobile et
fouiller » par un tap. Petit projet, fait pour servir tous les jours.

- Propriétaire : `BailleBye`
- Hébergement : GitHub Pages, à la **racine** → `https://baillebye.github.io/`
  (le repo s'appelle exactement `BailleBye.github.io`).

## Stack

- Front : un seul `index.html` (HTML + CSS + JS vanilla, **aucune dépendance**).
- PWA : `manifest.json` + balises Apple + `sw.js` (service worker).
- Données : `repos.json` **statique**, régénéré par une GitHub Action.
- CI : `.github/workflows/build-repos.yml` (`actions/github-script@v7`).

## Architecture — le point clé

```
GitHub Action (serveur)                     App (client)
─────────────────────────                   ─────────────
API GitHub  ──filtre topic──►  repos.json  ──fetch──►  rendu des cartes
(GITHUB_TOKEN éphémère)         (commité dans le repo)   + cache localStorage + SW
```

**L'app n'appelle JAMAIS l'API GitHub au runtime.** Tout passe par `repos.json`, servi
par Pages depuis la même origine. Conséquence directe : aucune limite de débit côté
client (la limite anonyme de l'API REST est de 60 req/h/IP), aucun token exposé.
C'est le choix structurant du projet — ne pas le casser en rajoutant un appel API
direct dans le front.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | L'app entière. CSS dans `:root` (tokens), JS en bas. |
| `manifest.json` | Manifest PWA (Android/desktop). `start_url`/`scope` = `./`. |
| `sw.js` | Coquille en cache (offline) + `repos.json` réseau-d'abord. |
| `repos.json` | Données projets. **Généré par l'Action — ne pas éditer à la main.** |
| `icon-180/192/512.png`, `icon-maskable-512.png` | Icônes (maison olive sur charcoal). |
| `.github/workflows/build-repos.yml` | Régénère `repos.json`. Actions épinglées sur SHA. |
| `.github/dependabot.yml` | Maj hebdo des actions (bumpe le SHA + le commentaire de version). |

## Décisions & raisons (le « pourquoi »)

- **`repos.json` statique plutôt que l'API en direct.** Évite les 60 req/h anonymes,
  supprime tout besoin de token côté client (un PAT dans un fichier public = fuite),
  rend l'offline trivial. Fraîcheur J-1 max, acceptable pour un lanceur.
- **Filtre par topic `homebase`.** Curation sans liste manuelle : seul ce qui est tagué
  apparaît. Le 3e repo public (non tagué) est donc ignoré. Alternative écartée : filtrer
  sur `has_pages` (raterait un futur projet code-only voulu dans le lanceur).
- **Auth de l'Action via `GITHUB_TOKEN` intégré** (pas un PAT). Jeton éphémère, scopé au
  repo, jamais exposé. `permissions: contents: write` pour committer `repos.json`.
- **Actions épinglées sur le SHA de commit** (`actions/checkout`, `actions/github-script`),
  pas sur `@v4`/`@v7`. Un tag mobile repointé (compromission amont) ne peut pas changer ce
  qui s'exécute. Le commentaire `# vX.Y.Z` garde la lisibilité. `dependabot.yml` bumpe SHA
  + commentaire chaque semaine → intégrité sans rater les patchs. **Pour mettre à jour une
  action à la main** : remplacer le SHA par celui de la nouvelle release et corriger le commentaire.
- **Ordre de résolution de l'URL d'un projet** : champ `homepage` (« Website ») s'il est
  rempli → GitHub Page par convention `baillebye.github.io/<repo>/` → sinon `html_url`
  du repo. Le `homepage` gère les cas tordus (fichier d'entrée non standard, domaine custom).
- **Service worker à portée limitée.** Il n'intercepte QUE la coquille à la racine ;
  les sous-dossiers (`/Course-List/`, etc.) gardent leur comportement normal et leur
  propre SW. Évite que HomeBase mette en cache / casse les autres projets.
- **Recherche masquée sous `SEARCH_THRESHOLD` (= 7) projets.** Une barre au-dessus de
  2 boutons est inutile ; le code est là, l'UI apparaît quand la liste grossit.
- **Tri par usage (hors recherche).** Les projets les plus lancés remontent (compteur de
  taps en localStorage, clé `USAGE_KEY`), départage par l'ordre de `repos.json` (récence).
  Le réordonnancement ne se fait PAS en direct au tap (évite que la carte saute sous le
  doigt) : il s'applique au chargement suivant. En recherche, c'est la pertinence qui prime.
- **Liens en `target="_blank"`.** Sur iOS standalone, le projet s'ouvre dans une vue
  navigateur séparée → on revient à HomeBase intact. (Bonus : la page n'étant pas
  déchargée, l'écriture du compteur d'usage est fiable.)
- **Point de statut = info réelle**, pas déco : olive = `hasPage` (Page en ligne),
  gris = repo seul.
- **Mise à jour contrôlée (pas de `skipWaiting` auto).** Le nouveau SW reste en attente ;
  la page détecte l'état `waiting`/`installed` (avec un contrôleur existant = c'est une
  MAJ, pas une 1re install) et affiche une barre « mettre à jour ». Au clic, la page
  envoie `SKIP_WAITING` au SW, écoute `controllerchange`, et recharge **une seule fois**
  (flag `pendingReload` pour ignorer la prise de contrôle initiale). `reg.update()` au
  retour au premier plan pour proposer la MAJ vite sur l'app installée.

## Conventions (à respecter pour ajouter des projets)

1. Repo **public**.
2. Fichier d'entrée = **`index.html` à la racine du repo** → URL propre
   `baillebye.github.io/<repo>/`. (Pages ne sert pas `autre.html` par défaut.)
3. Topic **`homebase`** (minuscules obligatoires) sur le repo.
4. Le **nom du repo devient le libellé** du bouton, « prettifié » (`-`/`_` → espaces,
   Title Case). Nommer le repo en pensant à l'affichage.
5. (Optionnel) `description` du repo → texte sous le nom ; champ « Website » → force l'URL.

## État actuel

**Fait (livré) :**
- App complète : UI sombre, recherche floue, cartes, ligne de statut, bouton actualiser,
  états chargement/vide/erreur, cache localStorage, chargement stale-while-revalidate.
- PWA installable iOS + manifest + SW offline (portée racine).
- Action : déclencheurs cron quotidien (`0 6 * * *`) + push + manuel ; filtre topic ;
  exclusion du repo `<owner>.github.io` ; résolution d'URL ; commit auto de `repos.json`.
- Icônes + `repos.json` de départ (2 projets).

**À faire par l'utilisateur au déploiement** (voir README) :
- Créer `BailleBye.github.io`, pousser, activer Pages.
- **Settings → Actions → « Read and write permissions »** (sinon l'Action ne committe pas).
- Lancer le workflow une fois, puis Add to Home Screen.
- **Course-List** : renommer `courses.html` → `index.html` (ou remplir « Website ») pour
  une URL propre. En attendant, le `repos.json` fourni pointe sur `courses.html`.

**Pistes optionnelles (non nécessaires) :**
- Épinglage manuel de favoris en tête (le tri par usage est déjà en place : les plus
  lancés remontent, puis récence).
- Override de libellé par repo si la prettification ne suffit pas.
- Regroupement par langage/type quand la liste sera longue.

## Caveats connus

- **Filtre topic** : l'Action lit `r.topics` renvoyé par `listForUser`. Non testé en
  conditions réelles. Si les logs montrent « 0 tagué » alors que le topic est posé :
  ajouter un appel `github.rest.repos.getAllTopics({owner, repo})` par repo en repli
  (coût négligeable vu le faible nombre de repos).
- **localStorage** indisponible (navigation privée) → l'app retombe sur un fetch réseau
  à chaque ouverture. Géré (try/catch), juste moins instantané.
- **Latence Pages** : après que l'Action committe `repos.json`, le redéploiement Pages
  prend ~1 min. Le push du bot ne re-déclenche pas le workflow (token par défaut + `[skip ci]`).
- **`repos.json` édité à la main** sera écrasé au prochain run de l'Action.
- **Compteur d'usage local par appareil** : le tri par usage se construit sur ce device ;
  vider le cache du navigateur le remet à zéro. C'est voulu (pas de sync, pas de backend).

## Modifier l'app — où sont les boutons

- **Thème** : variables CSS dans `:root` (`index.html`).
- **Seuil de recherche** : const `SEARCH_THRESHOLD` (`index.html`).
- **Tri par usage** : const `USAGE_KEY` (`index.html`) ; logique dans `render()` et
  les écouteurs de clic. Pour repartir de zéro : supprimer cette clé du localStorage.
- **Fréquence de régénération** : `cron` dans `build-repos.yml`.
- **Forme des données** : si tu changes les champs de `repos.json`, bumper
  `STORAGE_KEY` (cache local) ET `CACHE` (`sw.js`) pour invalider l'ancien cache.
- **Mise à jour de la coquille** : tout changement d'`index.html`/`sw.js`/icônes
  nécessite de **bumper `CACHE` dans `sw.js`** (`homebase-v2` → `-v3`…). Les appareils
  voient alors la barre « mettre à jour » au prochain passage au premier plan.
  Exception : le tout premier passage depuis une version SANS ce mécanisme (l'ancien
  `v1` auto-skipWaiting) se fait en silence à la prochaine **fermeture/réouverture
  complète** de l'app — la barre prend le relais pour toutes les MAJ suivantes.

## À ne pas faire

- Ne pas appeler l'API GitHub depuis le front (casse le modèle sans-token / sans-limite).
- Ne pas committer de PAT/token dans un fichier (repo public).
- Ne pas élargir la portée du SW aux sous-dossiers de projets.
- Ne pas éditer `repos.json` à la main.
