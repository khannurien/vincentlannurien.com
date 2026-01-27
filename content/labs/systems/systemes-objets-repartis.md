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
  - ...
---

![](../images/iot-philips.png)

[Internet of Shit](https://x.com/internetofshit/status/986006653605687296)

## Objectifs

- Développer une application suivant l'architecture trois tiers, s'appuyant sur des communications via HTTP et WebSockets ;
- Comprendre les mécanismes de l'authentification (avec ou sans état) d'un client auprès d'un serveur ;
- S'initier au déploiement d'une application répartie à l'aide d'un *reverse proxy*.

## Vue d'ensemble

![](../images/architecture.png)

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

Ci-dessous, le squelette de l'application côté serveur (`main.ts`) :

```ts
import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import { DatabaseSync } from "node:sqlite";

// ---------- Database -----------------------------------

export const db = new DatabaseSync("polls.db");

// ---------- HTTP Router --------------------------------

const router = new Router();

// ---------- WebSocket Management -----------------------

const clients = new Set<WebSocket>();

// ---------- API: Poll Management -----------------------

// ---------- API: Voting --------------------------------

// ---------- API: Poll Results --------------------------

// ---------- API: Authentication / Users ----------------

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

### Routes

Pour écrire une route, il nous faut :

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
    export function isPollRow(obj: Record<string, SQLOutputValue>): obj is PollRow { }

    export function isPollOptionRow(obj: Record<string, SQLOutputValue>): obj is PollOptionRow { }
    ```

    Attention : il faudra mettre à jour les interfaces `PollRow` et `PollOptionRow` pour qu'elles acceptent de porter des propriétés supplémentaires arbitraires :

    ```ts
    export interface PollRow {
      // ...
      [key: string]: SQLOutputValue; // Index signature
    }

    export interface PollOptionRow {
      // ...
      [key: string]: SQLOutputValue; // Index signature
    }
    ```

3. Coder les fonctions appelées dans les routes de l'API définies lors du TP 1.

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

<div class="hidden">
___

## TP 3 : Client React

### Pré-requis

1. Installation du *bundler* Vite et initialisation du projet

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

3. Installation des dépendances

    ```sh
    cd ~/tp_sor/client
    deno add npm:@deno/vite-plugin@latest npm:@types/react@latest npm:@vitejs/plugin-react@latest npm:react-router
    deno install
    ```

4. Exécution du serveur de développement

    ```sh
    deno run dev
    ```

### Déroulé

1. Mettre en place le routeur à la racine de l'application (`App.tsx`) :

    ```ts
    import Index from "./pages/index.tsx";
    import Poll from "./pages/Poll.tsx";
    ```

2. Créer les composants `index.tsx` (liste des sondages) et `Poll.tsx` (sondage sélectionné)

___

## TP 4 : Amélioration du client

> - Gestion de l'état du composant :
>   - Chargement
>   - Erreur
> - Contraintes :
>   - Limite sur la fréquence de vote

1. Ajouter un compteur du temps restant au sondage sur la page d'un sondage
2. ...

___

## TP 5 : Authentification

### Côté serveur

1. Écrire un module `jwt.ts` comprenant les fonctions suivantes :

    ```ts
    export async function createJWT(...): Promise<string>;
    export async function verifyJWT(...): Promise<AuthPayload | null>;
    export async function hashPassword(password: string): Promise<string>;
    export async function verifyPassword(password: string, hash: string): Promise<boolean>;
    ```

### Côté client

1. Créer un composant pour la connexion utilisateur

2. Ajouter la possibilité de restreindre le vote aux utilisateurs connectés lors de la création d'un sondage

___

## TP 6 : Déploiement

### `mkcert`

```sh
# Ajouter un répertoire local au PATH
mkdir -p ~/.local/bin
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.bashrc
source ~/.bashrc

# Installer mkcert
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
mv mkcert-v*-linux-amd64 ~/.local/bin

# Générer un certificat pour le domaine coucou.localhost
mkcert coucou.localhost
```

1. Dans Firefox : Paramètres > Vie privée et sécurité > Afficher les certificats
2. Onglet "Autorités" > Importer
3. Dossier personnel > Clic droit > Afficher les fichiers cachés
4. Se déplacer dans ~/.local/share/mkcert
5. Choisir le fichier rootCA.pem
6. Cocher "Confirmer cette AC pour identifier des sites web"
7. Valider avec OK
8. Relancer Firefox
9. Exécuter le script suivant :

```ts
const listener = Deno.listenTls({
  port: 4443,
  hostname: "coucou.localhost",
  cert: await Deno.readTextFile("coucou.localhost.pem"),
  key: await Deno.readTextFile("coucou.localhost-key.pem"),
});

console.log(`https://coucou.localhost:4443`);

for await (const conn of listener) {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    requestEvent.respondWith(new Response("Hello world"));
  }
}
```

10. Ouvrir la page https://coucou.localhost:4443 dans Firefox
11. Constater qu'il n'y a pas d'avertissement de sécurité

### nginx

1. Télécharger nginx et l'ajouter au PATH :

    ```sh
    curl -L https://github.com/jirutka/nginx-binaries/raw/refs/heads/binaries/nginx-1.28.1-x86_64-linux -o ~/.local/bin/nginx
    chmod +x ~/.local/bin/nginx
    ```

2. Écrire la configuration dans `nginx.conf`

___

## TP 7 : Performances

### Profilage

1. Profilez le fonctionnement de votre application

2. Analysez le fichier résultat dans [cpupro](https://discoveryjs.github.io/cpupro/)

### Injection de trafic

1. Installer [JMeter](https://jmeter.apache.org/)

---

## TP 8 : Améliorations

- Présentation des résultats
- Interface de création d'un sondage
- Interface de gestion d'un sondage
- Accès aux sondages par lien public
- Génération d'un QR Code
- Accès protégé par mot de passe
- Type de sondage : dates
- Type de sondage : cagnotte
</div>
