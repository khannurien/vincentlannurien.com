---
draft: false
hide_title: false

title: "Systèmes à objets répartis"
date: "2026-01-05T15:13:37+02:00"

tags:
  - "labs"
  - "web"
  - "systems"
  - "development"
  - "deployment"

todo:
  - add final resources (slides, exercises)
  - update figure 1 (add vite http server for client application)
---

![](./images/iot-philips.png)

[Internet of Shit](https://x.com/internetofshit/status/986006653605687296)

## Objectifs

- Développer une application suivant l'architecture trois tiers, s'appuyant sur des communications via HTTP et WebSockets ;
- Comprendre les mécanismes de l'authentification (avec ou sans état) d'un client auprès d'un serveur ;
- S'initier au déploiement d'une application répartie à l'aide d'un *reverse proxy*.

## Vue d'ensemble

![](./images/architecture.png)

## Composants

- Serveur
  - **Runtime** : Deno <sup>[[doc]](https://docs.deno.com/runtime/)</sup>
  - **Langage** : TypeScript <sup>[[doc]](https://www.typescriptlang.org/docs/handbook/intro.html)</sup>
  - **Framework** : Oak <sup>[[doc]](https://jsr.io/@oak/oak/doc)</sup>
- Client
  - **Bundler** : Vite <sup>[[doc]](https://docs.deno.com/examples/react_tutorial/)</sup>
  - **Framework** : React (en TypeScript) <sup>[[doc]](https://react.dev/reference/react)</sup>
  - **Outillage** : React Developer Tools (pour le navigateur) <sup>[[doc]](https://react.dev/learn/react-developer-tools)</sup>
- Infrastructure
  - **Base de données** : SQLite <sup>[[doc]](https://sqlite.org/quickstart.html)</sup>
  - **Reverse proxy** : nginx <sup>[[doc]](https://nginx.org/en/docs/beginners_guide.html)</sup>
  - **Certificats SSL** : mkcert <sup>[[doc]](https://github.com/FiloSottile/mkcert?tab=readme-ov-file#mkcert)</sup>

___

## TP 0 : Préparation de l'environnement

1. Installation de Deno :

    ```sh
    curl -fsSL https://deno.land/install.sh | sh
    ```

2. Configuration de VS Code :
    - installer l'extension officielle Deno (`denoland.vscode-deno`) ;
    - ouvrir séparément (dans des fenêtres distinctes) les répertoires du serveur et du client.

3. Création des répertoires du projet :

    ```sh
    mkdir -p ~/tp_sor/{server,client}
    cd ~/tp_sor/server
    git init
    cd ~/tp_sor/client
    git init
    ```

> 💡 Si vous n'avez pas l'habitude d'utiliser Git, que vous ne vous sentez pas à l'aise ou que vous avez besoin de revoir certains concepts durant les TP, reportez-vous à l'excellent [Beej's Guide to Git](https://beej.us/guide/bggit/html/split/).
___

## TP1 : Architecture

> L'application est une **plateforme de sondages en ligne**. Elle permet à des utilisateurs de **créer des sondages** et d'ajouter des **options de réponse**.
> Les participants peuvent **voter** pour une ou plusieurs options selon des règles définies par le créateur du sondage.
> L'application gère également l'**authentification** des utilisateurs et assure la **persistance** des données.
>
> Les acteurs de l'application sont les suivants :
> - Utilisateur authentifié : peut créer des sondages, voter, et consulter les résultats ;
> - Utilisateur invité : peut voter (si autorisé) et consulter les résultats (si autorisé) ;
> - Administrateur : peut gérer les sondages et les utilisateurs.
>
> Les principales fonctionnalités de l'application peuvent être résumées ainsi :
> - Création de sondages avec : titre, description, date de création, date d'expiration, statut (actif/inactif) ;
> - Ajout d'options à un sondage : texte descriptif ;
> - Vote pour une option de sondage ;
> - Consultation des résultats (nombre de votes par option) ;
> - Gestion des utilisateurs (inscription, authentification).

### Conception de la base de données

1. Reprendre la définition du cas d'usage ci-dessus et proposer un schéma de base de données. Donner la représentation graphique (Modèle Conceptuel de Données) du schéma (utiliser [draw.io](https://app.diagrams.net/)).

2. Écrire le script SQL correspondant au schéma dans un fichier `schema.sql`, et le passer à SQLite pour initialiser la base de données :

    ```sh
    sqlite3 polls.db < schema.sql
    ```

### Architecture du serveur

#### Pré-requis

1. Initialisation du projet avec Deno :

    ```sh
    cd ~/tp_sor
    deno init server
    ```

      - Observer l'arborescence du répertoire `server` que l'on vient de créer. Quel est le point d'entrée de l'application ?
      - Lire la sortie de la commande d'initialisation et tester les commandes suggérées.
      - Modifier l'application pour afficher `Hello, World`.

2. Installation des dépendances qui seront nécessaires au fonctionnement de l'application :

    ```sh
    cd ~/tp_sor/server
    deno add jsr:@oak/oak jsr:@tajpouria/cors jsr:@db/sqlite
    ```

    - À quoi correspond chacun des paquets de cette liste ? Trouver leur page de description et leur documentation.
    - Que pouvez-vous dire sur le fichier `deno.json` ? Sur le fichier `deno.lock` ?
    - Où sont installées les dépendances ? Utiliser la commande `deno info`.

#### Déroulé

1. Écrire les interfaces TypeScript nécessaires à typer les objets qui seront échangés entre la base de données, le serveur et le client. Celles-ci doivent représenter :

    - un sondage ;
    - une option de sondage ;
    - un vote.

    On doit en avoir six pour représenter les différentes "vues" sur nos données (c'est-à-dire à ce stade les *objets manipulés par l'API*, et les *enregistrements stockés en base de données*) :

    - Vue API :
      - `Poll`
      - `PollOption`
      - `Vote`
    - Vue base de données :
      - `PollRow`
      - `PollOptionRow`
      - `VoteRow`

Ci-dessous, le squelette de l'application côté serveur (`main.ts`) :

```ts
import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import { DatabaseSync } from "node:sqlite";

// ---------- Database -----------------------------------

const db = new DatabaseSync("polls.db");

// ---------- HTTP Router --------------------------------

const router = new Router();

// ---------- Poll Management ----------------------------

// Create a new poll
router.post("/polls", async (ctx) => {
  // TODO: validate body, create poll
});

// Get a single poll by ID
router.get("/polls/:pollId", (ctx) => {
  // TODO: fetch poll from DB
});

// List all polls
router.get("/polls", (ctx) => {
  // TODO: return polls list
});

// Update a poll
router.put("/polls/:pollId", async (ctx) => {
  // TODO: update poll in DB
});

// Delete a poll
router.delete("/polls/:pollId", (ctx) => {
  // TODO: delete poll from DB
});

// ---------- Voting -------------------------------------

// Upgrade HTTP to WebSocket
router.get("/votes/:pollId", (ctx) => {
  // TODO: create vote record, increment tally, idempotency
});

// ---------- Poll Results -------------------------------

// Get aggregated results for a poll
router.get("/polls/:pollId/results", (ctx) => {
  // TODO: compute and return current tally
});

// ---------- Authentication / Users ---------------------

// Register
router.post("/users/register", (ctx) => {
  // TODO: register user, return token
});

// Login
router.post("/users/login", (ctx) => {
  // TODO: authenticate user, return token
});

// Validate token
router.get("/users/validate", (ctx) => {
  // TODO: check token validity
});

// Get user profile
router.get("/users/me", (ctx) => {
  // TODO: check token validity
});

// ---------- Application --------------------------------

const PROTOCOL = "http";
const HOSTNAME = "localhost";
const PORT = 8000;
const ADDRESS = `${PROTOCOL}://${HOSTNAME}:${PORT}`;

const app = new Application();

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener(
  "listen",
  () => console.log(`Server listening on ${ADDRESS}`),
);

if (import.meta.main) {
  await app.listen({ hostname: HOSTNAME, port: PORT });
}

export { app };
```

2. Définir les routes qui seront nécessaires au fonctionnement de l'application. Il s'agit ici, en d'autres termes, de définir l'API de l'application (mais pas encore de programmer son fonctionnement). On peut s'inspirer de ces cinq exemples de routes, qui permettent respectivement de lister des valeurs, récupérer une valeur par son identifiant, ajouter une nouvelle valeur, mettre à jour une valeur et supprimer une valeur :

    ```ts
    // Obtenir la liste des valeurs
    router.get("/values", (ctx) => {});
    // Obtenir une valeur unique
    router.get("/values/:valueId", (ctx) => {});
    // Ajouter une valeur
    router.post("/values", (ctx) => {})
    // Modifier une valeur
    router.put("/values/:valueId", (ctx) => {})
    // Supprimer une valeur
    router.delete("/values/:valueId", (ctx) => {})
    ```

3. Toute route devra retourner une réponse au client. Celle-ci peut contenir la ressource demandée, ou une erreur. Ci-dessous, voici des exemples de réponses de l'API :

    ```json
    // Succès
    {
      success: true,
      data: [
        { id: "abcd" },
      ],
    }
    ```

    ```json
    // Erreur
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Requested value not found",
      },
    }
    ```

    Il faut représenter cette *union discriminée* dans le système de types. En utilisant la généricité lorsque necéssaire, écrire les interfaces, énumérations et types TypeScript nécessaires à représenter les réponses de l'API au client.

___

## TP 2 : Développement du serveur

Rappel : on utilisera le serveur de développement fourni par Deno pour travailler sur l'application.

```sh
deno run dev
```

Par commidité, on peut passer dans le fichier `deno.json` les permissions requises par l'application. On spécifie l'appel à `run` dans la définition de la tâche `dev` :

```json
{
  "tasks": {
    "dev": "deno run --watch --allow-net --allow-read --allow-write main.ts",
  },
  // ...
}
```

### Routes

Le routage est le mécanisme principal d'un serveur web. Router une requête utilisateur, c'est la diriger vers la fonction appropriée pour traitement et réponse. Afin d'écrire une route, il nous faut :

- sa *méthode* HTTP : `GET`, `POST`, `UPDATE`, `DELETE`, etc. ;
- son *chemin* (la partie finale de l'adresse) : par exemple, la route `"/polls"` sera atteinte à l'adresse `http://localhost:8000/polls` ;
- sa *fonction* associée, c'est-à-dire le code qui sera appelé par le routeur lorsqu'il recevra une requête utilisateur sur cette route.

Pour illustrer, on trouve ci-dessous le code d'une fonction qui retourne "Hello, world!" dans le corps d'une réponse HTTP :

```ts
function sayHello(ctx: any) {
  ctx.response.body = "Hello, world!"
}
```

On associe cette fonction en la passant au routeur pour une méthode (ici, `GET`) et un chemin (ici, la racine) donnés. Le routeur passera l'objet `ctx` à la fonction lors de son exécution :

```ts
router.get("/", sayHello);
```

Le contexte `ctx` comprend notamment les paramètres de la requête (`ctx.params`), la requête complète (`ctx.request`), ainsi qu'un objet réponse (`ctx.response`). Il est plus simple de passer une fonction anonyme au routeur, car l'IDE inférera le type de l'objet de `ctx` :

```ts
router.get("/", (ctx) => {
  ctx.response.body = "Hello, world!"
});
```

1. Voici quelques exemples de routes qui implantent le comportement de fonctions CRUD du serveur :

    ```ts
    // Données
    let values = { "foo": 42, "bar": 13.37 };

    // Lister les données
    router.get("/values", (ctx) => {
      ctx.response.body = { success: true, data: values };
    });

    // Lister les détails d'une donnée
    router.get("/values/:valueId", (ctx) => {
      const valueId = ctx.params.valueId;

      if (!(valueId in values)) {
        ctx.response.status = 404;

        // Attention !
        // Il faudra ici typer explicitement la réponse (erreur) de l'API
        ctx.response.body = {
          success: false,
          error: { code: "NOT_FOUND", message: `Value "${valueId}" not found` },
        };

        return;
      }

      // Attention !
      // Il faudra ici typer explicitement la réponse (succès) de l'API
      ctx.response.body = { success: true, data: values[valueId] };
    });

    // Créer une nouvelle donnée
    router.post("/values", async (ctx) => {
      try {
        const body = await ctx.request.body.json();
      } catch (err) {
        console.error(err);

        ctx.response.status = 500;

        // Attention !
        // Il faudra ici typer explicitement la réponse (erreur) de l'API
        ctx.response.body = {
          success: false,
          error: { code: "SERVER_ERROR", message: "Failed to read request body" },
        };
      }

      // Attention !
      // Il faudra ici valider les données envoyées par l'utilisateur
      values = { ...values, ...body };

      ctx.response.status = 201;
      ctx.response.body = { success: true, data: values };
    })
    ```

    - Comment modifier une valeur existante ?

    - Comment supprimer une valeur de l'ensemble des données ?

2. Dans notre application, les valeurs manipulées par les routes ne sont pas stockées dans une variable locale mais bien dans une base de données.

    - On récupère un enregistrement unique avec :

      ```ts
      const pollRow = db.prepare(
        `SELECT id, title, description, created_at, expires_at, is_active
        FROM polls WHERE id = ?;`,
      ).get(pollId);
      ```

    - On récupère une liste d'enregistrements avec :

      ```ts
      const pollOptionRows = db.prepare(
        `SELECT id, text, vote_count FROM poll_options WHERE poll_id = ?;`,
      ).all(pollId);
      ```

    Ces fonctions retournent des objets, arbitraires, de type `Record<string, SQLOutputValue>`. Le compilateur TypeScript ne nous laisse donc pas accéder aux champs de données définis dans nos interfaces.

    Écrire les fonctions permettant de convertir les enregistrements pour les sondages en base de données vers des objets exploitables dans l'API. Voici les signatures des deux fonctions :

    ```ts
    export function pollOptionRowToApi(row: PollOptionRow): PollOption { }

    export function pollRowToApi(row: PollRow, optionRows: PollOptionRow[]): Poll { }
    ```

    Essayer de passer aux fonctions de conversion les valeurs retournées par la base de données. On obtient une erreur de type :

    ```text
    Argument of type 'Record<string, SQLOutputValue>' is not assignable to parameter of type 'PollRow'.
      Type 'Record<string, SQLOutputValue>' is missing the following properties from type 'PollRow': id, title, description, user_id, and 3 more.deno-ts(2345)
    ```

    Pour les utiliser, il faudra d'abord affiner le type des objets passés en paramètres des fonctions de conversion. Écrire les deux *type guards* suivants :

    ```ts
    export function isPollRow(obj: Record<string, SQLOutputValue>): obj is PollRow {
      return (
        "id" in obj && typeof obj.id === "string" &&
        "title" in obj && typeof obj.title === "string" &&
        "description" in obj && (typeof obj.description === "string" || obj.description === null) &&
        // ... à compléter
      );
    }

    export function isPollOptionRow(obj: Record<string, SQLOutputValue>): obj is PollOptionRow {
      return (
        "id" in obj && typeof obj.id === "string" &&
        "poll_id" in obj && typeof obj.poll_id === "string" &&
        // ... à compléter
      );
    }
    ```

    Attention : il faudra mettre à jour les interfaces `PollRow` et `PollOptionRow` pour qu'elles acceptent de porter des propriétés supplémentaires arbitraires :

    ```ts
    export interface PollRow {
      // ...
      [key: string]: SQLOutputValue; // Index signature (à ajouter)
    }

    export interface PollOptionRow {
      // ...
      [key: string]: SQLOutputValue; // Index signature (à ajouter)
    }
    ```

3. Coder les fonctions appelées dans les routes de l'API définies lors du TP 1.

    > Seules les routes concernant la gestion des **sondages** sont nécessaires à ce stade : lister les sondages, lister un sondage par son identifiant, créer un sondage, modifier un sondage, supprimer un sondage.
    > Pour créer un sondage, il faudra générer son identifiant et un horodatage à la date de création :

    ```ts
    const pollId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    ```

    > Une fois que l'on a récupéré les valeurs envoyées par le client, on peut faire l'insertion en base de données :

    ```ts
    // On récupère le corps de la requête utilisateur, en JSON
    const createPollRequest = await ctx.request.body.json();

    // Attention : il faut ici valider les données envoyées par le client...
    db.prepare(
    `INSERT INTO polls (id, title, description, user_id, created_at, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?);`,
    ).run(
      pollId,
      createPollRequest.title,
      createPollRequest.description ?? null,
      null, // TODO: Authentication, cf. TP 5
      createdAt,
      createPollRequest.expiresAt ?? null,
      1,
    );

    // Ensuite, on procède aux insertions pour les options du sondage !
    // À compléter...
    ```

### Test fonctionnel

1. Avec `curl` :
    - créer un premier sondage et ses options associées ;
    - tester la récupération de la liste des sondages ;
    - tester la récupération d'un sondage par identifiant.

    ```sh
    curl [-X METHOD] [PROTOCOL]://[HOSTNAME]:[PORT] \
      -H "Content-Type: application/json" \
      -d '{
            "id": "abcd"
          }'
    ```

### Architecture

1. Le fichier `main.ts` n'a pas vocation à comprendre l'intégralité de l'application. Découper en modules les fonctionnalités principales :
    - Le *modèle* : les interfaces écrites pour le système de types de l'application ;
    - Les *routes* : le comportement de l'application en réponse aux requêtes utilisateur.

    Pour les routes, on peut définir un routeur par fichier :

    ```ts
    // routes/polls.ts
    const router = new Router({ prefix: "/polls" });
    // ...
    export default router;
    ```

    Et l'importer tel que :

    ```ts
    // main.ts
    import pollsRouter from "./routes/polls.ts";
    // ...
    const app = new Application();
    app.use(pollsRouter.routes(), pollsRouter.allowedMethods());
    // ...
    ```

2. Importer les modules dans `main.ts`.

3. Les routes sont alourdies par la gestion des cas d'erreur :

    - leur code est englobé dans un `try`/`catch` général en cas d'erreur inattendue ;
    - dans le chemin "normal", il existe beaucoup de cas dans lesquels on retourne une erreur au client :

      ```ts
      const responseBody: APIFailure = {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        }
      };

      ctx.response.status = err.status;
      ctx.response.body = responseBody;
      ```

    Ce comportement doit être déplacé dans un *middleware* chargé de faire cette réponse au client. Les routes peuvent alors :

    - être débarassées de leur `try`/`catch` global (les erreurs inattendues seront levées par le *middleware*) ;
    - se contenter de lever une `APIException` en cas d'erreur, et laisser au *middleware* le soin de retourner cette erreur au client.

    Voici une classe `APIException` (vue en cours) que l'on peut utiliser :

    ```ts
    export class APIException extends Error {
      readonly code: APIErrorCode;
      readonly status: number;

      constructor(code: APIErrorCode, status: number, message: string) {
        super(message);
        this.code = code;
        this.status = status;
      }
    }
    ```

    Ainsi que le code du *middleware* à ajouter à la chaîne de traitement des requêtes pour toutes les routes :

    ```ts
    import { Context, Next } from "@oak/oak";

    import { APIErrorCode, APIException, type APIFailure } from "../model/interfaces.ts";

    export async function errorMiddleware(ctx: Context, next: Next) {
      try {
        await next();
      } catch (err) {
        if (err instanceof APIException) {
          const responseBody: APIFailure = {
            success: false,
            error: {
              code: err.code,
              message: err.message,
            }
          };

          ctx.response.status = err.status;
          ctx.response.body = responseBody;

          console.log(responseBody);
        } else {
          console.error(err);

          const responseBody: APIFailure = {
            success: false,
            error: {
              code: APIErrorCode.SERVER_ERROR,
              message: "Unexpected server error",
            }
          };

          ctx.response.status = 500;
          ctx.response.body = responseBody;
        }
      }
    }
    ```

    On peut l'ajouter aux définitions individuelles des routes :

    ```ts
    router.get("/", errorMiddleware, async (ctx) => { }
    ```

    Ou bien (solution recommandée) l'ajouter systématiquement à la chaîne de traitement (dans `main.ts`) :

    ```ts
    const app = new Application();

    app.use(errorMiddleware);
    // ...
    ```

___

## TP 3 : Client React

### Pré-requis

1. Installation du *bundler* Vite et initialisation du projet :

    ```sh
    cd ~/tp_sor
    deno init --npm vite client --template react-ts
    ```

2. Création du fichier `deno.json` dans le répertoire `~/tp_sor/client` :

    ```json
    {
      "tasks": {
        "dev": "deno run -A npm:vite",
        "build": "deno run -A npm:vite build"
      },
      "nodeModulesDir": "auto",
      "compilerOptions": {
          "types": [
              "react",
              "react-dom",
              "@types/react"
          ],
          "lib": [
              "dom",
              "dom.iterable",
              "deno.ns"
          ],
          "jsx": "react-jsx",
          "jsxImportSource": "react"
      }
    }
    ```

3. Installation des dépendances de l'application client :

    ```sh
    cd ~/tp_sor/client
    deno add npm:@deno/vite-plugin@latest npm:@types/react@latest npm:@vitejs/plugin-react@latest npm:react-router
    deno install
    ```

    On note qu'ici, pour des questions de disponibilité, on récupère des paquets NPM plutôt que JSR. Cela entraîne la création d'un répertoire `node_modules` et d'un fichier `package.json`.

4. Exécution du serveur de développement :

    ```sh
    deno run dev
    ```

### Déroulé

Le fichier `src/main.tsx` indique le point d'entrée de l'application :

```tsx
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

> Le mode strict (`StrictMode`) active un [ensemble de comportements](https://react.dev/reference/react/StrictMode) utiles en phase de développement de l'application :
> - chaque composant sera rendu *une fois de plus que nécessaire* : cela permet de vérifier l'*idempotence* d'un composant (étant données les mêmes entrées, un composant doit toujours retourner la même sortie). En d'autres termes, cela permet de détecter les effets de bord indésirables dans un composant *impur*, c'est-à-dire un composant qui produirait des modifications en-dehors de son état local (telles que muter les valeurs passées en entrée) ;
> - chaque composant exécutera ses `Effects` *une fois de plus que nécessaire* : cela permet de détecter des bugs causés par un nettoyage manquant de l'état du composant, tels que des connexions qui resteraient ouvertes, provoquant des fuites mémoire ;
> - chaque composant exécutera ses *callbacks* `ref` *une fois de plus que nécessaire* : cela permet de détecter des bugs provenant d'une incohérence entre les références et le DOM réel ; par exemple, un accès à un élément supprimé dans le DOM de la page.
>
> Avec ce mode activé, on verra donc des requêtes HTTP en double dans les journaux, des connexions/déconnexions supplémentaires aux WebSockets, etc.

On va définir le composant `App` comme étant un routeur React. C'est un outil qui permet de gérer la navigation dans une application à page unique (*SPA*, *Single-Page Application*) en associant des URL à des composants :
- chaque chemin d'URL correspond à un composant React affiché ;
- le routeur écoute les changements d'URL et se charge du rendu du composant correspondant sans recharger la page ;

Il permet par ailleurs de gérer les paramètres d'URL, les redirections, les protections de route, etc.

1. Mettre en place le routeur à la racine de l'application (`App.tsx`). Voici un point de départ pour créer deux routes :
    - à la racine, on affiche l'index de l'application (`src/pages/index.tsx`) ;
    - au chemin `"/polls/:selectedPoll"`, on affiche un sondage sélectionné.

    ```tsx
    import { BrowserRouter, Route, Routes } from "react-router";

    import Index from "./pages/index.tsx";
    import Poll from "./pages/Poll.tsx";
    import "./App.css";

    function App() {
      return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/polls/:selectedPoll" element={<Poll />} />
          </Routes>
        </BrowserRouter>
      );
    }

    export default App;

    ```

2. Créer le composant `Index` (`src/pages/index.tsx`), dans lequel on affichera la liste des sondages :
    1. Utiliser `useState` pour initialiser la liste des sondages (elle sera toujours vide avant la première requête vers le serveur) et définir la fonction de mise à jour de l'état du composant ;
    2. Utiliser `useEffect` pour émetttre la requête HTTP nécessaire à récupérer les sondages depuis l'API et la passer à la fonction de mise à jour de l'état :

        ```tsx
        export default function Index() {
          const [polls, setPolls] = ... // À compléter

          useEffect(() => {
            (async () => {
              const response = fetch(...) // À compléter
            })();
          }, []);
        ```

        Voici deux exemples de fonctionnement de l'API `fetch` pour :
        - une requête `GET` :

          ```ts
          async function fetch(url: string);
          ```
        
        - une requête `POST` :

          ```ts
          async function fetch(url: string, {
            method: "POST",
            body: {}, // un objet JSON
          });
          ```

        Observer le type de `response`. Observer aussi la hiérachie des interfaces. De quelles propriétés et méthodes fournies par cet objet peut-on se servir pour la récupération des données, leur affichage, et le traitement des erreurs ?

    3. Utiliser le style de programmation fonctionnel pour *mapper* chaque sondage à un item de liste (`<li>`) dans la définition du composant :

        ```tsx
        return (
          <main id="content">
            <h1>📊 Real-time polls</h1>
            <p>Click on a poll below to participate.</p>

            <ul>
              {polls.map(
                // À compléter
                // ...
              )}
            </ul>
          </main>
        );
        ```

3. Créer le composant `Poll` (`src/pages/Poll.tsx`) dans lequel on affichera et interagira avec le sondage sélectionné :
    - S'appuyer sur les interfaces et *type guards* définis pour les objets de l'API : il faut copier dans le projet client les fichiers de types et de fonctions *helpers* issus du projet serveur ;
    - Dans le composant :
      1. récupérer l'identifiant du sondage sélectionné *via* le routeur avec `useParams` :

          ```tsx
          const { selectedPoll } = useParams();
          ```

      2. récupérer, *via* `useEffect`, les valeurs depuis l'API avec `fetch` ;
      3. vérifier leur type avec un *type guard* ;
      4. les afficher dans le code HTML retourné par le composant.

4. Adapter l'affichage du composant aux situations suivantes :
    - le sondage courant n'est pas encore chargé ;
    - le serveur ne répond pas ;
    - le sondage demandé n'existe pas.

    Pour simplifier le code du client, notamment en matière de gestion des dépendances (les effets sont déclenchés lors d'un changement d'état des variables dont ils dépendent), on peut utiliser le *pattern* suivant pour définir l'état d'un sondage :

      ```tsx
      type PollState =
        | { status: "loading" }
        | { status: "error"; error: string }
        | { status: "loaded"; poll: Poll };

      export default function Poll() {
        const { selectedPoll } = useParams();

        const [pollState, setPollState] = useState<PollState>({ status: "loading" });

        useEffect(() => {
          if (!selectedPoll) return;

          setPollState({ status: "loading" });

          (async () => {
            try {
              const resp = await fetch(`${API_URL}/polls/${selectedPoll}`);
              if (!resp.ok) {
                const json = await resp.json();
                throw new Error(json.error?.message || `HTTP ${resp.status}`);
              }

              const json = await resp.json();
              // Attention : il faut valider les données reçues
              setPollState({ status: "loaded", poll: json.data });
            } catch (err) {
              setPollState({
                status: "error",
                error: err instanceof Error ? err.message : "Failed to load poll",
              });
            }
          })();
        }, [selectedPoll]); // Dépendance à `selectedPoll` : l'effet sera déclenché à nouveau lors d'une modification de l'état du sondage
    }
    ```

    Bien sûr, à ce stade on étudie un système "distribué" composé d'un serveur et d'un client déployés sur la même machine. La latence est donc virtuellement inexistante, de même que les pertes de connexion. Pour mieux visualiser ces phénomènes côté client, on peut ajouter au serveur un *middleware* qui provoque des délais et des erreurs aléatoirement :

      ```ts
      import { randomInt } from "node:crypto";

      import { Context, Next } from "@oak/oak";

      import { APIErrorCode, APIException } from "../model/interfaces.ts";

      function delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

      export async function entropyMiddleware(ctx: Context, next: Next) {
        const d10 = randomInt(0, 10);

        if (d10 === 9) {
          throw new APIException(APIErrorCode.SERVER_ERROR, 500, "Entropy error :-)");
        }

        if (d10 >= 3 && d10 < 9) {
          const timeout = randomInt(0, 5);

          await delay(timeout * 1000);
        }

        await next();
      }
      ```

    On l'intègre à la chaîne de traitement d'une requête pour que la réponse échoue ou soit retardée en cas de mauvais tirage :

    ```ts
    router.post("/", errorMiddleware, entropyMiddleware, async (ctx) => { }
    ```

---

## TP 4 : Mécanisme de vote en direct

On propose d'utiliser l'API WebSocket pour ouvrir un canal de communication bidirectionnelle entre les applications serveur et client.

Deno offre une implantation de WebSocket, l'interface [`WebSocket`](https://docs.deno.com/api/web/~/WebSocket), dans sa bibliothèque standard. On va l'utiliser côté serveur.

### Interfaces

{{< flex columns="6, 3" >}}

Il faut définir un langage commun pour que le serveur et le client puissent communiquer sur un WebSocket. On définit trois types de messages :
- l'envoi d'un vote (`VoteCastMessage`) : envoyé par le client au serveur lors d'un vote de l'utilisateur ;
- l'accusé de réception (`VoteAckMessage`) : retourné par le serveur au client lorsque son vote a été traité. Il peut comporter une erreur ;
- la mise à jour du nombre de votes (`VotesUpdateMessage`) : diffusé par le serveur à tous les clients connectés à un sondage lors d'un changement du nombre de votes pour une option.

---

![](./images/websocket-tp.png)

{{< /flex >}}

```ts
/**
 * WebSockets
 */

// Requête : vote de l'utilisateur
export interface VoteCastMessage {
  type: "vote_cast";
  pollId: string;
  optionId: string;
  userId?: string;
}

// Réponse : accusé de réception
export interface VoteAckMessageFailure {
  type: "vote_ack";
  pollId: string;
  optionId: string;
  success: false;
  error: APIError;
}

export interface VoteAckMessageSuccess {
  type: "vote_ack";
  pollId: string;
  optionId: string;
  success: true;
  error?: never;
}

export type VoteAckMessage = VoteAckMessageFailure | VoteAckMessageSuccess;

// Diffusion : compteurs de votes
export interface VotesUpdateMessage {
  type: "votes_update";
  pollId: string;
  optionId: string;
  voteCount: number;
}
```

Ces messages peuvent être sérialisés sous forme de chaînes de caractères pour être communiqués sur un WebSocket :

```ts
// Envoi (sérialisation)
const objSrc: VoteCastMessage = {
  type: "vote_cast",
  pollId: "foo",
  optionId: "bar",
};
const str = JSON.stringify(objSrc);

// Réception (désérialisation)
const objDst = JSON.parse(str);
```

### Côté serveur

1. On commence par ajouter une route pour la gestion des votes (`routes/votes.ts`). La route inclut l'identifiant du sondage, car les clients s'abonnent à un canal *par sondage*. Cela permet de recevoir les mises à jour du nombre de votes pour toutes les options d'un sondage. L'API WebSocket est événementielle : on définit des *callbacks* à exécuter lors de la connexion, de la réception d'un message, de la déconnexion ainsi que de la réception d'une erreur.

    ```ts
    router.get("/votes/:pollId", errorMiddleware, (ctx) => {
      const pollId = ctx.params.pollId;

      if (!pollId) {
        throw new APIException(APIErrorCode.NOT_FOUND, 404, "Poll not found");
      }

      if (!ctx.isUpgradable) {
        throw new APIException(APIErrorCode.BAD_REQUEST, 400, "WebSocket required");
      }

      // On demande à HTTP de mettre à jour le protocole pour mettre en place une connexion WebSocket
      const ws: WebSocket = ctx.upgrade();

      ws.onopen = () => {
        // À compléter...
      };

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        // Il faut vérifier l'interface de `msg`...

        if (msg.type === "vote_cast") {
          // À compléter...
        } else {
          // À compléter...
        }
      };

      ws.onclose = () => {
        // À compléter...
      }

      ws.onerror = (e) => {
        // À compléter...
      }
    }
    ```

2. Pour garder le code de la route succinct, on délègue la gestion des WebSockets à un service (`services/vote-service.ts`). Celui-ci stocke l'ensemble des connexions ouvertes dans une `Map`, pour diffuser à tous les clients connectés à un sondage donné les messages de mise à jour. Les fonctionnalités du service sont données telles que :
    - la fonction `handleVoteMessage` est appelée lors de la réception d'un message de type `vote_cast`. Elle appelle la fonction `castVote` qui interagit avec la base de données ;
    - la fonction `broadcast` est appelée pour diffuser les messages de mise à jour des compteurs de votes ;
    - les fonctions `subscribe` et `unsubscribe` sont responsables de maintenir la `Map` des connexions en cours.

    ```ts
    // Poll ID vers liste de WebSockets uniques
    const subscriptions = new Map<string, Set<WebSocket>>();

    // Fonction d'écriture d'un vote en base de données
    // Retourne le compteur de votes mis à jour pour l'option choisie
    function castVote(
      pollId: string,
      optionId: string,
      userId?: string,
    ): number {
      // ...
    }

    // Ajout d'un client à la liste des WebSockets ouverts pour un sondage donné
    export function subscribe(ws: WebSocket, pollId: string): void {
      // ...
    }

    // Retrait d'un client à la liste des WebSockets ouverts pour un sondage donné
    export function unsubscribe(ws: WebSocket, pollId: string): void {
      // ...
    }

    // Fonction appelée à la réception d'un message `vote_cast` sur un WebSocket
    // Retourne un message `vote_ack` au client responsable du vote
    // Appelle `broadcast` pour diffuser un message `votes_update` à tous les clients connectés à un sondage donné
    export function handleVoteMessage(
      ws: WebSocket,
      msg: VoteCastMessage,
    ): void {
      // ...
    }

    // Diffuse un message `votes_update` à tous les clients connectés à un sondage donné
    export function broadcast(pollId: string, message: VotesUpdateMessage): void {
      // ...
    }

    // Fonction utilisée pour retourner un message d'erreur au client
    export function sendError(ws: WebSocket, exception: APIException): void {
      ws.send(JSON.stringify({
        type: "vote_ack",
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
        },
      }));
    }
    ```

### Côté client

1. Le cycle de vie du WebSocket doit être lié au cycle de vie du composant `Poll` : l'instanciation du WebSocket a lieu lors du montage du composant, et sa fermeture est garantie par la fonction de nettoyage retournée par `useEffect`.

    On met en œuvre ce mécanisme dans le composant `Poll.tsx` en définissant deux *callbacks* qui implantent le comportement à adopter en cas de réception de messages `vote_ack` ou bien `votes_update` :

    ```ts
    // On définit la fonction à exécuter à la réception d'un message `votes_update`
    const handleUpdate = useCallback((update: VotesUpdateMessage) => {
      setPollState((prev) => {
        if (prev.status !== "loaded") return prev;

        return {
          ...prev,
          poll: {
            ...prev.poll,
            options: prev.poll.options.map((opt) =>
              opt.id === update.optionId
                ? { ...opt, voteCount: update.voteCount }
                : opt
            ),
          },
        };
      });

      setAnimatingOptionId(update.optionId);
    }, []);

    // On définit la fonction à exécuter à la réception d'un accusé de réception `vote_ack`
    const handleAck = useCallback((ack: VoteAckMessage) => {
      if (!ack.success) {
        setVoteError(ack.error.message);
      }
    }, []);

    // On initialise le hook `useVoteSocket` qui se déclenchera à la réception de tout message (voir étape suivante dans le sujet)
    // On lui passe l'identifiant du sondage courant, et les méthodes à aossier aux deux types de message
    // La fonction `vote` qu'il retourne doit être utilisée dans le composant pour envoyer un vote (lorsque l'utilisateur sélectionne une option de sondage)
    const { vote } = useVoteSocket(selectedPoll, {
      onUpdate: handleUpdate,
      onAck: handleAck,
    });
    ```

2. Pour garder le code du composant succinct, on définit les effets dans un *hook* React (`hooks/useVoteSocket.ts`) qui encapsule la gestion des communications en maintenant une référence (`useRef`) au WebSocket courant. Ce mécanisme permet de réagir à la réception d'un message en appelant les fonctions `onUpdate` ou `onAck`, en fonction du type de message transmis par le serveur :

    ```ts
    import { useEffect, useRef } from "react";

    import type { VoteAckMessage, VotesUpdateMessage } from "../model.ts";

    import { WS_URL } from "../config/api.ts";

    // Définition du hook, qui prend en paramètre l'identifiant du sondage courant, et les deux fonctions à exécuter à la réception de messages du serveur (respectivement `votes_update` et `vote_ack`)
    export function useVoteSocket(
      pollId: string | undefined,
      {
        onUpdate,
        onAck,
      }: {
        onUpdate?: (msg: VotesUpdateMessage) => void;
        onAck?: (msg: VoteAckMessage) => void;
      },
    ) {
      // Le hook maintient une référence au WebSocket courant
      const socketRef = useRef<WebSocket | null>(null);

      // L'effet sera déclenché en fonction de ses dépendances :
      // - à tout changement de sondage courant (`pollId`) : le client se connecte à/se déconnecte d'un WebSocket par sondage ;
      // - à tout changement des fonctions `onUpdate` et `onAck` : ces fonctions capturent l'état du composant, elles sont donc recréées à chaque rendu
      useEffect(() => {
        if (!pollId) return;

        // On ouvre un WebSocket sur le canal du sondage courant
        const ws = new WebSocket(`${WS_URL}/votes/${pollId}`);
        socketRef.current = ws;

        // Événement : lors de la réception d'un message, on exécute la fonction appropriée en fonction de son type
        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data);

          if (msg.type === "votes_update" && onUpdate) {
            onUpdate(msg);
          }

          if (msg.type === "vote_ack" && onAck) {
            onAck(msg);
          }
        };

        // Fonction de nettoyage exécutée au démontage du composant :
        // On déconnecte le client du WebSocket
        return () => {
          ws.close();
          socketRef.current = null;
        };
      }, [pollId, onUpdate, onAck]); // Dépendances de l'effet

      // Fonction retournée par le hook : envoi d'un vote
      // Envoi par le client d'un message `vote_cast` au serveur
      const vote = (optionId: string) => {
        // On récupère le WebSocket courant
        const ws = socketRef.current;

        if (!ws || ws.readyState !== WebSocket.OPEN) {
          return { success: false, error: "Not connected" };
        }

        // On envoie le message sur le WebSocket
        ws.send(
          JSON.stringify({
            type: "vote_cast",
            pollId,
            optionId,
          }),
        );

        return { success: true };
      };

      // Le hook retourne une fonction `vote` que l'on appelle dans le composant pour envoyer un message `vote_cast`
      return { vote };
    }
    ```

___

## TP 5 : Authentification

### Fonctionnement général

{{< flex columns="6, 4" >}}

Dans ce TP, nous allons ajouter à notre application la gestion des utilisateurs et de leur authentification. Il sera possible d'empêcher l'accès à certaines fonctionnalités aux utilisateurs qui ne seraient pas connectés.

Pour cela, on utilisera un mécanisme de jeton de connexion, *JWT* (pour *JSON Web Tokens*). Il est dit *sans état*, c'est-à-dire que le serveur ne maintient pas de session en mémoire : le client doit authentifier chacune de ses requêtes en y joignant un jeton valide, généré par le serveur pour une période de validité donnée.

---

![](./images/authentication-tp.png)

{{< /flex >}}

1. Lors d'une connexion de l'utilisateur (*login*), le serveur vérifie les identifiants transmis par l'utilisateur, puis crée et signe cryptographiquement un jeton. Il le retourne au client.

    Un jeton contient trois champs : l'en-tête, le corps (*payload*) et la signature, qui est chiffrée (`Chiffrement(En-tête + Corps) = Signature`).

2. Le client peut ensuite ajouter ce jeton au corps des requêtes qu'il envoie vers le serveur.

3. Le serveur vérifie le jeton : d'abord, il utilise l'algorithme de chiffrement indiqué par l'en-tête du jeton pour déchiffrer la signature avec sa clef privée. Ensuite, il chiffre à son tour l'en-tête et le corps du jeton et vérifie que le résultat est indentique à la signature.

4. Le client est alors *authentifié*, et peut recevoir l'autorisation d'accéder à la ressource demandée.

Voici un exemple de requête de connexion émise avec `curl` :

```sh
curl -X POST http://localhost:8000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!"
  }'
```

La réponse du serveur doit comporter le token généré pour l'utilisateur :

```json
{
  "success": true,
  "data": {
    "token":"eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMTgwZjM4Mi1lMGU4LTQyY2MtODMxNi1jN2FhNGU2N2ExYzMiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaXNBZG1pbiI6ZmFsc2UsImV4cCI6MTc3MTI2OTE3N30.dXG1iSse5fJ1z7KaBGXOo3M6fyNuf-0oo1LVQJpChAY",
    "user": {
      "id": "1180f382-e0e8-42cc-8316-c7aa4e67a1c3",
      "username": "testuser",
      "isAdmin": false,
      "createdAt": "2026-02-12T12:52:05.324Z"
    }
  }
}
```

Pour authentifier ses requêtes, le client y adjoint son jeton dans un en-tête *Authorization*. Le jeton est précédé du mot-clef *Bearer* :

```sh
curl -X GET http://ubordinateur:8000/users/validate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMTgwZjM4Mi1lMGU4LTQyY2MtODMxNi1jN2FhNGU2N2ExYzMiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaXNBZG1pbiI6ZmFsc2UsImV4cCI6MTc3MTI2OTE3N30.dXG1iSse5fJ1z7KaBGXOo3M6fyNuf-0oo1LVQJpChAY"
```

Après l'avoir décodé, voici ce que retrouve le serveur dans ce jeton :

![](./images/jwt-decoded.png)

[JWT Debugger](https://www.jwt.io/)

### Structures de données

On commence par détailler l'ensemble des structures de données que l'on va manipuler, aussi bien côté serveur et que côté client, pour la fonctionnalité d'authentification.

Voici les interfaces partagées entre le serveur et le client :

- `User` : un utilisateur (côté serveur, il faut aussi son pendant base de données, `UserRow`) ;
- `LoginRequest` : *Data Transfer Object* (*DTO*) qui contient les informations requises pour une connexion utilisateur ;
- `RegisterRequest` : *DTO* qui contient les informations requises pour l'enregistrement d'un nouvel utilisateur ;
- `AuthResponse` : réponse du serveur en cas d'authentification réussie ; comporte une structure `User` ainsi qu'un jeton *JWT*.

Côté serveur :

- `AuthPayload` : le contenu décodé du jeton, signé cryptographiquement. On y retrouve l'identifiant unique de l'utilisateur, son nom, son niveau de permissions ainsi qu'un champ `exp` donnant la date d'expiration du jeton.

```ts
/**
 * Authentification
 */

export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  isAdmin?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Côté serveur
export interface AuthPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
  exp: number;
}
```

### Côté serveur

Plusieurs nouveaux fichiers sont nécessaires pour gérer l'authentification côté serveur :

- `lib/jwt.ts` : module de gestion des jetons (création et vérification d'un jeton) et des mots de passe (hashage et vérification d'un mot de passe). S'appuie sur la bibliothèque cryptographique de Node ;
- `middleware/auth.ts` : ajouté à la chaîne de middlewares des routes à protéger, il vérifie la présence et la validité de l'en-tête `Authorization` des requêtes reçues. Si le jeton transmis par le client est valide, la requête est validée et son contexte est augmenté des informations de l'utilisateur ;
- `routes/users.ts` : définit les routes de gestion des utilisateurs (CRUD) ainsi que de connexion et déconnexion.

1. Compléter la fonction `verifyJWT` du module `jwt.ts` donné ci-dessous :

    ```ts
    import { randomBytes, scrypt } from "node:crypto";
    import { jwtVerify, SignJWT } from "@panva/jose";

    import { type AuthPayload, isAuthPayload } from "../model/interfaces.ts";

    const JWT_SECRET = "tp-M1-SOR-2026";
    const JWT_KEY = new TextEncoder().encode(JWT_SECRET);

    // Crée un jeton d'authentification
    // Le jeton est hashé avec l'algorithme HMAC avec SHA-256 et une clef secrète
    // Le jeton est valide pendant 24 heures et attribué à l'utilisateur contenu dans `payload`
    export async function createJWT(
      payload: Omit<AuthPayload, "exp">,
    ): Promise<string> {
      return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .sign(JWT_KEY);
    }

    // Passe le jeton à la fonction `jwtVerify` de la bibliothèque de JSON Web Tokens
    // Valide le type de l'objet retourné par `jwtVerify`, qui doit être conforme à `AuthPayload`
    // Retourne le payload s'il est valide, `null` sinon
    export async function verifyJWT(token: string): Promise<AuthPayload | null> {
      // À compléter...
    }

    // Produit le hash d'un mot de passe donné en paramètre
    // Format : hash.salt
    export function hashPassword(password: string): Promise<string> {
      const salt = randomBytes(16).toString("hex");

      return new Promise((resolve, reject) => {
        scrypt(password, salt, 64, (err, derivedKey) => {
          if (err) reject(err);
          else resolve(`${derivedKey.toString("hex")}.${salt}`);
        });
      });
    }

    // Compare le mot de passe et le hash passés en paramètres, en ré-hashant le mot de passe
    export function verifyPassword(
      password: string,
      storedHash: string,
    ): Promise<boolean> {
      const [hash, salt] = storedHash.split(".");

      return new Promise((resolve, reject) => {
        scrypt(password, salt, 64, (err, derivedKey) => {
          if (err) reject(err);
          else resolve(hash === derivedKey.toString("hex"));
        });
      });
    }
    ```

2. Compléter le *middleware* `authMiddleware` qui sera utilisé pour protéger les routes nécessitant une authentification du client :

    ```ts
    import { Context, Next, State } from "@oak/oak";
    import { verifyJWT } from "../lib/jwt.ts";
    import { APIErrorCode, type AuthPayload } from "../model/interfaces.ts";

    // On étend la définition du contexte d'une requête en typant la variable `state` contenant son état
    export interface AuthContext extends Context {
      state: AuthState;
    }

    // On définit l'état d'une requête, qui peut contenir un payload JWT en cas de connexion réussie
    export interface AuthState extends State {
      user?: AuthPayload;
    }

    export async function authMiddleware(ctx: AuthContext, next: Next) {
      // On récupère l'en-tête `Authorization` de la requête
      const authHeader = ctx.request.headers.get("Authorization");

      // On vérifie s'il est bien formé
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new APIException(APIErrorCode.UNAUTHORIZED, 401, "Missing or invalid token");
      }

      // On découpe l'en-tête pour récupérer le token, puis on le vérifie
      const token = authHeader.substring(7);
      const payload = await verifyJWT(token);

      // Erreur retournée en cas de token invalide
      if (!payload) {
        throw new APIException(APIErrorCode.UNAUTHORIZED, 401, "Invalid token");
      }

      // Mise à jour du contexte de la requête pour un utilisateur authentifié
      ctx.state.user = payload;

      // On passe au middleware suivant
      await next();
    }
    ```

3. Écrire les trois routes suivantes en s'appuyant sur les ajouts précédents :

    ```ts
    // Enregistrement d'un nouvel utilisateur
    router.post("/register", async (ctx) => {
      // À compléter...
    }

    // Connexion utilisateur
    router.post("/login", async (ctx) => {
      // À compléter...
    }

    // Retourne les informations stockées en BDD pour l'utilisateur connecté
    // (Liste des sondages créés, nombre de votes, etc.)
    // Les requêtes passent par le middleware d'authentification !
    router.get("/me", authMiddleware, (ctx: AuthContext) => {
      // À compléter...
    }
    ```

    > De manière similaire à ce que l'on a fait pour les sondages et les votes, on peut créer un service (`services/users.ts`) qui centralise les fonctions en lien avec la gestion des utilisateurs. Cela permettra de garder le code des routes succinct.

### Côté client

Pour bien comprendre la séparation des responsabilités, on crée plusieurs fichiers dans l'application React. Les trois premiers sont donnés ci-dessous :

- `contexts/AuthContext.ts` : "conteneur de l'état", fournit l'interface qui définit le contexte d'identification courant (c'est-à-dire l'utilisateur et le token retournés par le serveur après une connexion réussie). Permet d'accéder à l'état du contexte, et retourne une fonction qui permet de le modifier ;

    ```ts
    import { createContext } from "react";

    import { type AuthResponse } from "../model.ts";

    export interface AuthContextValue {
      authResponse: AuthResponse | null;
      setAuthResponse: (authResponse: AuthResponse | null) => void;
    }

    export const AuthContext = createContext<AuthContextValue>({
      authResponse: null,
      setAuthResponse: () => {},
    });
    ```

- `contexts/AuthProvider.tsx` : composant *wrapper* qui englobe toute l'application et qui maintient effectivement l'état de ce contexte (en faisant appel à `useState`). Il est responsable de passer l'état de l'authentification à tous les composants enfants ;

    ```tsx
    import { ReactNode, useState } from "react";

    import { AuthContext, type AuthContextValue } from "./AuthContext.ts";

    import { type AuthResponse } from "../model.ts";

    export function AuthProvider({ children }: { children: ReactNode }) {
      const [authResponse, setAuthResponse] = useState<AuthResponse | null>(() => {
        const stored = localStorage.getItem("authResponse");

        return stored ? JSON.parse(stored) : null;
      });

      const value: AuthContextValue = { authResponse, setAuthResponse };

      return (
        <AuthContext.Provider value={value}>
          {children}
        </AuthContext.Provider>
      );
    }
    ```

- `hooks/useAuth.ts` : "accesseur / mutateur de l'état", lit le contexte d'authentification et fournit les méthodes pour agir dessus (`login`, `logout`). Fournit également une fonction *helper* `authFetch` qui ajoute l'en-tête `Authorization` aux requêtes HTTP `fetch` vers le serveur nécessitant d'être authentifié ;

```ts
import { useContext } from "react";

import { AuthContext } from "../contexts/AuthContext.ts";

import { type AuthResponse } from "../model.ts";

export const useAuth = () => {
  const { authResponse, setAuthResponse } = useContext(AuthContext);

  const login = (response: AuthResponse) => {
    setAuthResponse(response);
    localStorage.setItem("authResponse", JSON.stringify(response));
  };

  const logout = () => {
    setAuthResponse(null);
    localStorage.removeItem("authResponse");
  };

  const authFetch = async (input: RequestInfo, init: RequestInit = {}) => {
    const token = authResponse?.token;

    const res = await fetch(input, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401) {
      logout();
    }

    return res;
  };

  return {
    user: authResponse?.user ?? null,
    token: authResponse?.token ?? null,
    login,
    logout,
    authFetch,
  };
};
```

1. Il faut maintenant créer les composants nécessaires pour mettre en place l'authentification dans l'application client :

- `pages/Register.tsx` : formulaire de création d'un nouveau compte utilisateur ;
- `pages/Login.tsx` : point d'entrée pour la connexion d'un utilisateur, affiche un formulaire (nom d'utilisateur, mot de passe), envoie la requête de connexion au serveur, reçoit `AuthResponse` et appelle `login` pour mettre à jour le contexte d'authentification dans toute l'application ;
- `pages/Restricted.tsx` : *wrapper* qui englobe toute page de l'application accessible seulement par les utilisateurs authentifiés. Bloque la navigation si l'utilisateur n'est pas connecté.

    À titre d'exemple, ce dernier composant est donné ci-dessous. Il montre comment se servir de la fonction du hook `useAuth` :

    ```ts
    import { Navigate } from "react-router";

    import { useAuth } from "../hooks/useAuth.ts";

    export function RestrictedRoute({ children }: { children: React.ReactNode }) {
      // On récupère le token de l'utilisateur courant
      const { token } = useAuth();

      // S'il existe, c'est que l'utilisateur est authentifié : on affiche la page demandée
      // Sinon, on redirige l'utilisateur vers la page de connexion
      return token ? <>{children}</> : <Navigate to="/login" />;
    }
    ```

2. On crée aussi un composant `User` (`pages/User.tsx`) qui affiche une page qui comporte les informations sur l'utilisateur si ce dernier est connecté (liste des sondages créés, nombre de votes, etc.). Ce composant doit être inaccessible si l'utilisateur n'est pas connecté (voir ci-dessous).

3. Mettre à jour le routeur de l'application dans `App.tsx`. On restreint l'accès au composant `User` en le déclarant sous un composant parent `Restricted` :

```tsx
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/polls/:selectedPoll" element={<Poll />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/me"
            element={
              <RestrictedRoute>
                <User />
              </RestrictedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### Nouvelles fonctionnalités

Grâce à l'ajout des utilisateurs et de l'authentification, on peut intégrer de nouvelles fonctionnalités à l'application :

1. Ajouter la possibilité de restreindre le vote aux utilisateurs connectés lors de la création d'un sondage ;
2. Permettre à l'utilisateur ayant créé un sondage de le modifier par la suite ;
3. Permettre à un administrateur de modifier et supprimer tout sondage dans l'application.

> Il ne faut pas oublier de mettre à jour le schéma de la base de données, si besoin, pour intégrer les identifiants utilisateur comme clefs étrangères aux enregistrements (sondages, votes). Éventuellement, il faut choisir un comportement par défaut pour l'application : on peut tout à fait, par exemple, resteindre la possiblité de voter sur un sondage aux seuls utilisateurs connectés.
> Ces changements doivent se refléter dans les interfaces des objets de l'API.

___

## TP 6 : Déploiement

Dans ce TP, on va configurer les deux applications ainsi qu'un *reverse proxy* de manière à accéder au client à l'adresse suivante : `https://app.sor.localhost`.

> Sous Linux, il n'est, par défaut, pas possible pour un processus utilisateur d'écouter sur un port privilégié ([inférieur à 1024](https://unix.stackexchange.com/a/16568)). Sur une machine personnelle, on peut [y remédier](https://superuser.com/a/892391) :
> - en donnant les privilèges `CAP_NET_BIND_SERVICE` à l'exécutable ;
> - en configuration le pare-feu pour rediriger un port privilégié vers un port plus haut ;
> - en désactivant complètement ce mécanisme de protection au niveau du noyau.
> Sur les machines du département, ces manipulations sont impossibles. On utilisera donc le port `4443` dans le cadre de ce TP.

### Création des certificats

1. Installation de `mkcert` :

```sh
# Ajouter un répertoire local au PATH
mkdir -p ~/.local/bin
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.bashrc
source ~/.bashrc

# Installer mkcert
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
mv mkcert-v*-linux-amd64 ~/.local/bin
```

2. Génération des certificats :

```sh
# Générer un certificat pour :
# - le domaine sor.localhost
# - l'ensemble de ses sous-domaines (wildcard)
mkcert sor.localhost *.sor.localhost
```

3. Ajout de l'autorité de certification au navigateur :

    1. Dans Firefox : *Paramètres > Vie privée et sécurité > Afficher les certificats* ;
    2. Onglet *Autorité > Importer* ;
    3. Afficher le répertoire des certificats dans *Dossier personnel > Clic droit > Afficher les fichiers cachés* ;
    4. Se déplacer dans `~/.local/share/mkcert` ;
    5. Choisir le fichier `rootCA.pem` ;
    6. Cocher *"Confirmer cette AC pour identifier des sites web"* ;
    7. Valider avec *OK* ;
    8. Relancer Firefox ;
    9. Exécuter le script suivant avec Deno :

    ```ts
    const listener = Deno.listenTls({
      port: 4443,
      hostname: "sor.localhost",
      cert: await Deno.readTextFile("sor.localhost+1.pem"),
      key: await Deno.readTextFile("sor.localhost+1-key.pem"),
    });

    console.log(`https://sor.localhost:4443`);

    for await (const conn of listener) {
      const httpConn = Deno.serveHttp(conn);
      for await (const requestEvent of httpConn) {
        requestEvent.respondWith(new Response("Hello world"));
      }
    }
    ```

    10. Ouvrir la page [`https://sor.localhost:4443`](https://sor.localhost:4443) dans Firefox ;
    11. Constater qu'il n'y a pas d'avertissement de sécurité.

### Configuration du *reverse proxy*

1. Télécharger nginx et le déplacer dans un répertoire du `PATH` :

    ```sh
    curl -L https://github.com/jirutka/nginx-binaries/raw/refs/heads/binaries/nginx-1.28.2-x86_64-linux -o ~/.local/bin/nginx
    chmod +x ~/.local/bin/nginx
    ```

2. Écrire la configuration dans `nginx.conf` comme vu en cours.

3. Faire les ajustements nécessaires dans la configuration des deux applications.

    > Note : côté client, il faut aussi préciser au serveur de développement Vite à quels noms d'hôte il est autorisé à répondre. On modifie le fichier `vite.config.ts` :

    ```ts
    import { defineConfig } from "vite";
    import react from "@vitejs/plugin-react";
    import deno from "@deno/vite-plugin";

    export default defineConfig({
      server: {
        port: 3000,
        // Ajouter le nom d'hôte du client ici
        allowedHosts: [
          "app.sor.localhost",
        ],
      },
      plugins: [react(), deno()],
      optimizeDeps: {
        include: ["react/jsx-runtime"],
      },
    });
    ```

4. Exécuter nginx dans le répertoire comportement le fichier de configuration. En cas de modification à ce fichier, nginx devrait recharger sa configuration automatiquement. Si ce n'est pas le cas, pour tuer le processus, on peut utiliser le fichier `nginx.pid` :

    ```sh
    kill $(cat nginx.pid)
    ```

<div class="hidden">
___

## TP 7 : Performances et fiabilité

### Jeux de tests

1. Tests unitaires côté serveur

2. Tests *end-to-end* (E2E) côté client

### Profilage

1. Profilez le fonctionnement de votre application

2. Analysez le fichier résultat dans [cpupro](https://discoveryjs.github.io/cpupro/)

### Injection de trafic

1. Installer [JMeter](https://jmeter.apache.org/)

---

## TP 8 : Améliorations

> - Gestion de l'état du composant :
>   - Chargement
>   - Erreur
> - Contraintes :
>   - Limite sur la fréquence de vote

1. Ajouter un compteur du temps restant au sondage sur la page d'un sondage
2. ...

- Présentation des résultats
- Interface de création d'un sondage
- Interface de gestion d'un sondage
- Accès aux sondages par lien public
- Génération d'un QR Code
- Accès protégé par mot de passe
- Type de sondage : dates
- Type de sondage : cagnotte
</div>
