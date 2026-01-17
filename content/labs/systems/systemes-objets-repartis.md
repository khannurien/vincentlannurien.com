---
draft: false
hide_title: false

title: "Systèmes à objets répartis"
date: "2026-01-05T15:13:37+02:00"

tags:
  - "labs"
  - "web"
  - "systems"

todo:
  - ...
---

## Objectifs

- Développer une application suivant l'architecture trois tiers, s'appuyant sur des communications via HTTP et WebSockets ;
- Comprendre les mécanismes de l'authentification (avec ou sans état) d'un client auprès d'un serveur ;
- S'initier au déploiement d'une application répartie à l'aide d'un *reverse proxy*.

## Composants

- Serveur
  - **Runtime** : Deno <sup>[[doc]](https://docs.deno.com/runtime/)</sup>
  - **Langage** : TypeScript <sup>[[doc]](https://www.typescriptlang.org/docs/handbook/intro.html)</sup>
- Client
  - **Framework** : React (en TypeScript) <sup>[[doc]](https://react.dev/reference/react), [[doc]](https://docs.deno.com/examples/react_tutorial/)</sup>
  - **Outillage** : React Developer Tools (pour le navigateur) <sup>[[doc]](https://react.dev/learn/react-developer-tools)</sup>
- Infrastructure
  - **Base de données** : SQLite <sup>[[doc]](https://sqlite.org/quickstart.html)</sup>
  - **Reverse proxy** : nginx <sup>[[doc]](https://nginx.org/en/docs/beginners_guide.html)</sup>
  - **Certificats SSL** : mkcert <sup>[[doc]](https://github.com/FiloSottile/mkcert?tab=readme-ov-file#mkcert)</sup>

___

## TP 0 : Préparation de l'environnement

1. Installation de Deno

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

### Base de données

1. Reprendre la définition du cas d'usage ci-dessus et proposer un schéma de base de données. Donner la représentation graphique (Modèle Conceptuel de Données) du schéma.
2. Écrire le script SQL dans un fichier `schema.sql` et le passer à SQLite pour créer la base de données :

    ```sh
    sqlite3 polls.db < schema.sql
    ```

### Serveur

#### Pré-requis

1. Initialisation du projet

    ```sh
    cd ~/tp_sor
    deno init server
    ```

2. Installation des dépendances :

    ```sh
    cd ~/tp_sor/server
    deno add jsr:@oak/oak jsr:@tajpouria/cors jsr:@db/sqlite
    ```

3. Exécution du serveur de développement

    ```sh
    deno run dev
    ```

#### Déroulé

1. Écrire les interfaces TypeScript nécessaires à typer les objets qui seront échangés entre la base de données, le serveur et le client. Celles-ci doivent représenter :

- un sondage ;
- une option de sondage ;
- un vote ;

Ci-dessous, le squelette de l'application côté serveur.

```ts
import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import { Database } from "@db/sqlite";

// ---------- Database -----------------------------------

const db = new Database("polls.db");

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

2. Définir les routes qui seront nécessaires au fonctionnement de l'application. En d'autres termes : définir l'API de l'application.

3. Écrire les interfaces TypeScript (génériques !) représentant les réponses de l'API au client.

    > L'API retourne toujours une réponse. Celle-ci peut contenir la ressource demandée, ou une erreur.

4. Coder les fonctions appelées dans les routes de l'API.

___

## TP 2 : Développement du serveur

___

## TP 3 : Client React

### Client

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

___

## TP 4 :

___

## TP 5 :

___

## TP 6 : Performances

### Profilage

1. Profilez le fonctionnement de votre application
2. Analysez le fichier résultat dans [cpupro](https://discoveryjs.github.io/cpupro/)

### Injection de trafic

1. Installer [JMeter](https://jmeter.apache.org/)

___

## TP 7 : Déploiement

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

## TP 8 : Améliorations

- Interface de création d'un sondage
- Interface de gestion d'un sondage
- Accès aux sondages par lien public
- Génération d'un QR Code
- Accès protégé par mot de passe
- Type de sondage : dates
- Type de sondage : cagnotte
