---
draft: false
hide_title: false

title: "Développer en local avec Docker"
date: "2025-03-03T12:02:15+02:00"

tags:
  - "guide"
  - "docker"
  - "development"
---

Dans ce guide, je vous propose d'utiliser Docker et Docker Compose pour conteneuriser un environnement de développement local.

![](./images/evergreen.png)

## Fichiers

### `Dockerfile`

On va créer une image pour notre conteneur `mkcert` :

```dockerfile
FROM alpine:3.20.3 AS build

WORKDIR /mkcert

RUN apk --no-cache add curl
RUN curl -JLO "https://dl.filippo.io/mkcert/v1.4.4?for=linux/amd64" && \
    chmod +x mkcert-v1.4.4-linux-amd64

FROM alpine:3.20.3

COPY --from=build /mkcert/mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert

WORKDIR /root/.local/share/mkcert

CMD mkcert -install && for i in $(echo $DOMAIN | sed "s/,/ /g"); do mkcert $i; done && tail -f -n0 /etc/hosts
```

### `dynamic.yml`

La configuration TLS pour Traefik, qui va utiliser les certificats générés par `mkcert` :

```yaml
tls:
  certificates:
    - certFile: "/etc/certs/_wildcard.localhost.pem"
      keyFile: "/etc/certs/_wildcard.localhost-key.pem"

    - certFile: "/etc/certs/_wildcard.app.localhost.pem"
      keyFile: "/etc/certs/_wildcard.app.localhost-key.pem"
```

### `docker-compose.yml`

```yaml
services:
  mkcert:
    platform: linux/amd64
    build: .
    environment:
      - DOMAIN=*.localhost,*.app.localhost
    volumes:
        - mkcert_data:/root/.local/share/mkcert
    labels:
      - "traefik.enable=false"

  traefik:
    image: traefik:latest
    command:
      - "--api"
      - "--providers.docker"
      - "--accesslog=true"
      - "--accesslog.filepath=/var/log/traefik.log"
      - "--pilot.dashboard=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
      - "--entrypoints.web.http.redirections.entrypoint.permanent=true"
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
      - ./dynamic.yml:/etc/traefik/dynamic.yml:ro
      - mkcert_data:/etc/certs:ro
      - traefik_logs:/var/log
    environment:
      - TZ=Europe/Paris
    labels:
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.rule=Host(`traefik.localhost`)"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.tls=true"

volumes:
  mkcert_data:
  traefik_logs:
```

## DNS

Modifier le fichier `hosts` pour autoriser la résolution des noms :

* Sous **macOS** et **Linux**, `/etc/hosts` ;
* Sous **Windows**, `C:\Windows\System32\drivers\etc\hosts`.

Ajoutez-y les lignes suivantes :

```sh
127.0.0.1        localhost
127.0.0.1        app.localhost
```

## Certificats

Faire confiance aux certificats pour éviter les erreurs dans le navigateur :

* Sous **macOS**: ouvrir le fichier `.pem` avec *Keychain Access* et ajouter le certificat à la keychain *System* or *Login*. Marquer le certificat comme *trusted*.
* Sous **Windows**: exécuter `certutil -addstore -f "ROOT" example.com+1.pem` depuis un terminal en tant qu'administrateur.
* Sous **Linux**: la méthode varie d'une distribution à l'autre. Sous Ubuntu, copier le fichier `.pem` vers `/usr/local/share/ca-certificates/` et exécuter `sudo update-ca-certificates`.
