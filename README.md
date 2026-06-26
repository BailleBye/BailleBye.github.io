# HomeBase

Lanceur perso : une icône sur l'écran d'accueil, tes projets en gros boutons,
recherche floue, accès direct à chaque GitHub Page. Les projets apparaissent
**automatiquement** dès qu'un repo porte le topic `homebase` — aucune liste à maintenir.

## Contenu

```
index.html                      l'app (HTML + CSS + JS, tout-en-un)
manifest.json                   manifest PWA
sw.js                           service worker (offline + installable)
repos.json                      données des projets (généré par l'Action — ne pas éditer à la main)
icon-180/192/512(.png)          icônes de l'app
icon-maskable-512.png           icône maskable (Android)
.github/workflows/build-repos.yml   l'Action qui régénère repos.json
```

## Déploiement (une seule fois)

1. **Crée le repo** `BailleBye.github.io` (public). Le nom doit être exactement ça :
   c'est ce qui sert ton lanceur à la racine `https://baillebye.github.io/`.

2. **Ajoute ces fichiers** à la racine du repo, en gardant le dossier
   `.github/workflows/` tel quel. (Le plus simple : dézippe et glisse tout, ou
   `git add . && git commit && git push`.)

3. **Active GitHub Pages** : *Settings → Pages → Build and deployment →
   Source : « Deploy from a branch » → Branch : `main` / `/ (root)`* → Save.

4. **Autorise l'Action à écrire** (sinon elle ne peut pas mettre à jour `repos.json`) :
   *Settings → Actions → General → Workflow permissions →* coche
   **« Read and write permissions »** → Save.

5. **Lance l'Action une fois** pour générer `repos.json` maintenant :
   *onglet Actions → « Build repos.json » → Run workflow*. Ensuite elle tourne
   toute seule chaque jour (et à chaque push).

6. **Ouvre** `https://baillebye.github.io/` dans **Safari** sur l'iPhone →
   bouton Partager → **« Sur l'écran d'accueil »**. L'icône HomeBase apparaît,
   ça s'ouvre en plein écran sans barre Safari.

## ⚠️ À régler pour Course-List

Son fichier déployé est `courses.html`, pas `index.html` → l'URL propre
`baillebye.github.io/Course-List/` renvoie une 404. Deux options (10 s) :

- **Recommandé** : renomme `courses.html` → `index.html` dans le repo Course-List.
  Le bouton ouvrira alors `baillebye.github.io/Course-List/` proprement, et c'est
  la convention à garder pour tes futurs projets (toujours un `index.html` à la racine).
- **Sinon** : *Settings du repo Course-List → champ « Website »* → mets
  `https://baillebye.github.io/Course-List/courses.html`. L'Action utilise ce champ
  en priorité s'il est rempli.

(En attendant, `repos.json` pointe déjà vers `courses.html`, donc le bouton marche
dès le premier déploiement.)

## Ajouter un projet plus tard

Mets le topic `homebase` sur le repo (*page du repo → roue ⚙️ à côté de « About »
→ Topics → `homebase` → Save*). Il apparaît dans HomeBase à la prochaine exécution
de l'Action — ou tout de suite si tu relances le workflow à la main (étape 5).

## Comment ça marche

- **Pas d'API GitHub au runtime** : l'Action interroge l'API côté serveur (avec le
  `GITHUB_TOKEN` intégré, éphémère et jamais exposé), filtre tes repos tagués
  `homebase`, et écrit `repos.json` dans le repo. L'app ne lit que ce fichier statique
  → **aucune limite de débit, aucun token côté client.**
- **Ordre d'ouverture de chaque projet** : champ « Website » s'il est rempli, sinon
  la GitHub Page par convention (`baillebye.github.io/<repo>/`), sinon le repo.
- **Hors-ligne** : le service worker met en cache la coquille de l'app ; les données
  sont aussi gardées en cache local. L'app s'ouvre instantanément, même sans réseau,
  et se rafraîchit en arrière-plan.
- **Recherche** : masquée tant que tu as ≤ 7 projets (inutile sur 2 boutons),
  elle apparaît automatiquement au-delà.
