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

## Composants

- Serveur
  - **Runtime** : Deno
    - https://github.com/denoland/deno/
  - **Langage** : TypeScript
    - https://www.typescriptlang.org/docs/handbook/intro.html
- Client
  - **Framework** : React (en TypeScript)
    - https://react.dev/learn/build-a-react-app-from-scratch
  - **Outillage** : React Developer Tools (pour le navigateur)
    - https://react.dev/learn/react-developer-tools
- Infrastructure
  - **Reverse proxy** : nginx
    - https://nginx.org/en/docs/beginners_guide.html
  - **Certificats SSL** : mkcert
    - https://github.com/FiloSottile/mkcert
  - **DNS** : sslip.io
    - https://sslip.io/

Alternatives :
- localtunnel
  - https://github.com/localtunnel/localtunnel
- Caddy
  - https://caddyserver.com/docs/automatic-https
- tunneling
  - https://github.com/anderspitman/awesome-tunneling

## Objectifs

- ...

## TP 0 : Préparation de l'environnement

1. Installation de Deno

```sh
curl -fsSL https://deno.land/install.sh | sh
```

2. Configuration de VS Code :
  - installer l'extension officielle Deno (`denoland.vscode-deno`) ;
  - ouvrir séparément (dans des fenêtres distinctes) les répertoires du serveur et du client.

## TP1 :

> L'application est une plateforme de sondages en ligne. Elle permet à des utilisateurs de :
> - créer des sondages ;
> - ajouter des options de réponse ;
> - recueillir des votes.
> Les participants peuvent voter pour une ou plusieurs options selon des règles définies par le créateur du sondage.
> L'application gère également l'authentification des utilisateurs et assure la persistence des données.
>
> - Acteurs :
>   - Utilisateur authentifié : peut créer des sondages, voter, et consulter les résultats ;
>   - Utilisateur invité : peut voter (si autorisé) et consulter les résultats (si autorisé) ;
>   - Administrateur : peut gérer les sondages et les utilisateurs.
>
> - Principales fonctionnalités :
>   - Création de sondages avec : titre, description, date de création, date d'expiration, et statut (actif/inactif) ;
>   - Ajout d'options à un sondage : texte descriptif ;
>   - Vote pour une option de sondage ;
>   - Consultation des résultats (nomre de votes par option) ;
>   - Gestion des utilisateurs (inscription, authentification).

### Base de données


1. Reprendre la définition du cas d'usage 

### Serveur

1. Initialisation du projet

```sh
deno init server
```

2. Installation des dépendances :

```sh
deno add jsr:@oak/oak jsr:@tajpouria/cors jsr:@db/sqlite
```

3. Exécution du serveur de développement

```sh
deno run dev
```



## TP 2 :

### Client

1. Installation du *build system* Vite et initialisation du projet

```sh
deno init --npm vite client --template react-ts
```

2. Création du fichier `deno.json` :

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

3. Installation des dépendances :

```sh
deno add npm:@deno/vite-plugin@latest npm:@types/react@latest npm:@vitejs/plugin-react@latest npm:react-router
deno install
```

4. Exécution du serveur de développement

```sh
deno run dev
```

## TP 3 :

## TP 4 :

## TP 5 :

## TP 6 :

## TP 7 :

## TP 8 :

## TP 9 : Déploiement

### DNS

server.127-0-0-1.sslip.io
client.127-0-0-1.sslip.io

## Améliorations

- Interface de création d'un sondage
- Interface de gestion d'un sondage
- Accès aux sondages par lien public
- Génération d'un QR Code
- Accès protégé par mot de passe
- Type de sondage : dates
- Type de sondage : cagnotte
