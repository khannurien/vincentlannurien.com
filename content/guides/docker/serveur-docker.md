---
draft: false
hide_title: false

title: "Un serveur avec Docker"
date: "2025-03-03T12:02:15+02:00"

tags:
  - "guide"
  - "docker"
  - "deployment"
---

# Un serveur avec Docker

Dans ce guide, je vous propose d'utiliser Docker et Docker Compose pour déployer et orchestrer vos services sur un serveur.

![](../images/home-server.jpg)

## Architecture

* [Traefik](https://hub.docker.com/_/traefik), un *reverse proxy* qui va s'intercaler entre Internet et les différents services que l'on souhaite exposer ;
* [WireGuard](https://github.com/wg-easy/wg-easy), un VPN moderne, que l'on va configurer pour qu'il soit accessible depuis la majorité des réseaux publics ;
* [Netdata](https://hub.docker.com/r/netdata/netdata), une plateforme de monitoring complète et peu gourmande en ressources ;
* [Portainer](https://hub.docker.com/r/portainer/portainer-ce), un *dashboard* web pour Docker ;
* [Nextcloud](https://github.com/linuxserver/docker-nextcloud), une plateforme de stockage (documents, photos, etc.) et de partage (calendriers, contacts, etc.) ;
* [MariaDB](https://hub.docker.com/_/mariadb), une base de données qui sera utilisée par Nextcloud ;
* [Docker Volume Backup](https://github.com/offen/docker-volume-backup), une image Docker pour la sauvegarde automatique des données des conteneurs.

## Pré-requis

1. Il voudra faudra un nom de domaine (optez pour [l'un](https://www.bookmyname.com/) [des](https://www.gandi.net/fr) [nombreux](https://www.namecheap.com/) [fournisseurs](https://www.ovhcloud.com/fr/domains/), certains sont même [gratuits](https://www.dynu.com/)). Pour l'exemple, mon domaine sera `example.com`.

Faîtes pointer votre nom de domaine ainsi que tous ses sous-domaines vers votre adresse IP publique. La marche est à suivre diffère selon les fournisseurs (*registrars*), mais en gros, dans la configuration DNS de votre domaine, vous devrez créer deux enregistrements `A` de type :

| Type | Domaine       | Adresse  |
|------|---------------|----------|
| A    | @             | 10.0.0.1 |
| A    | *.example.com | 10.0.0.1 |

`@` correspond à la racine (c'est-à-dire *example.com*) chez la plupart des bureaux d'enregistrement. `10.0.0.1` correspond à l'[adresse IP publique](https://unix.stackexchange.com/a/194136/350724) obtenue par la box de votre opérateur.

2. Il faudra ouvrir deux ports sur votre routeur ou box : 80 (`http`) et 443 (`https`). La marche à suivre dépend du modèle, mais [tout est documenté](https://fr.wikihow.com/ouvrir-des-ports).

3. Vous avez à votre disposition une machine GNU/Linux. Le guide fonctionne pour Ubuntu 22.04.

### Installation de Docker

On suit [la documentation](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository) :

```shell
# Update the apt package index and install packages to allow apt to use a repository over HTTPS:
sudo apt-get update
sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker’s official GPG key:
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Use the following command to set up the repository:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update the apt package index:
sudo apt-get update

# Install Docker Engine, containerd, and Docker Compose.
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Vérifiez que tout fonctionne correctement :

```shell
sudo docker run hello-world
```

## Préambule

Puisque Traefik va écouter sur des ports réservés (443 et 80), un simple utilisateur ne pourra pas créer leurs conteneurs. On va donc passer en `root` avant d'effectuer la suite des manipulations.

## Démarrage

On crée un répertoire pour stocker la configuration des services :

```shell
sudo su
mkdir /var/stack
chmod 700 /var/stack
cd /var/stack
```

Docker propose de gérer des volumes nommés, par défaut stockés sous `/var/lib/docker/volumes`. C'est la solution que l'on va utiliser pour centraliser les données et la configuration des services.

## Définition des services

On crée le fichier `/var/stack/docker-compose.yml` avec la définition de l'ensemble de nos services.

La configuration de Traefik est dynamique : on la passe à la création du conteneur. Les labels que l'on ajoute à chacun des conteneurs permettent à Traefik d'identifier les services et de créer les routes nécessaires.

```yaml
services:
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
      - "--serverstransport.insecureskipverify=true"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
      - "--entrypoints.web.http.redirections.entrypoint.permanent=true"
      - "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=toto@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/etc/traefik/acme/acme.json"
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
      - traefik_logs:/var/log
      - traefik_certs:/etc/traefik/acme
    environment:
      - TZ=Europe/Paris
    labels:
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.rule=Host(`traefik.example.com`)"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik.middlewares=admin"
      - "traefik.http.middlewares.admin.basicauth.users=toto:$$2y$$05$$LJ8gDZQN7puZmTM.OygwXu2uQQt1aTPDeA2uR6wExVSH6NRS0Ku8C"

  wireguard:
    image: ghcr.io/wg-easy/wg-easy:latest
    restart: always
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv4.conf.all.src_valid_mark=1
    ports:
      - "123:123/udp"
    expose:
      - "51821"
    volumes:
      - wireguard_config:/etc/wireguard
    environment:
      - LANG=fr
      # Adresse publique du serveur
      - WG_HOST=example.com
      # À compléter impérativement en utilisant la doc suivante :
      # https://github.com/wg-easy/wg-easy/blob/master/How_to_generate_an_bcrypt_hash.md
      - PASSWORD_HASH=''
      # Le port 123/udp est traditionnellement utilisé par NTP
      # Il a de grande chance d'être ouvert sur un réseau public
      - WG_PORT=123
      # Utiliser le DNS de la box (IP à vérifier)
      - WG_DEFAULT_DNS=192.168.1.254
      # Graphiques dans le dashboard
      - UI_TRAFFIC_STATS=true
      - UI_CHART_TYPE=2 # (0 Charts disabled, 1 # Line chart, 2 # Area chart, 3 # Bar chart)
    labels:
      - "traefik.http.services.wireguard.loadbalancer.server.port=51821"
      - "traefik.http.routers.wireguard.entrypoints=websecure"
      - "traefik.http.routers.wireguard.rule=Host(`vpn.example.com`)"
      - "traefik.http.routers.wireguard.tls=true"
      - "traefik.http.routers.wireguard.tls.certresolver=letsencrypt"

  netdata:
    image: netdata/netdata:latest
    restart: always
    hostname: example.com
    pid: host
    cap_add:
      - SYS_PTRACE
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined
    expose:
      - "19999"
    volumes:
      - netdata_config:/etc/netdata
      - netdata_lib:/var/lib/netdata
      - netdata_cache:/var/cache/netdata
      - /etc/passwd:/host/etc/passwd:ro
      - /etc/group:/host/etc/group:ro
      - /etc/localtime:/etc/localtime:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /etc/os-release:/host/etc/os-release:ro
      - /var/log:/host/var/log:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /run/dbus:/run/dbus:ro
    labels:
      - "traefik.http.services.netdata.loadbalancer.server.port=19999"
      - "traefik.http.routers.netdata.rule=Host(`monitoring.example.com`)"
      - "traefik.http.routers.netdata.tls=true"
      - "traefik.http.routers.netdata.tls.certresolver=letsencrypt"
      - "traefik.http.routers.netdata.entrypoints=websecure"
      - "traefik.http.routers.netdata.middlewares=admin"
      - "traefik.http.middlewares.admin.basicauth.users=toto:$$2y$$05$$LJ8gDZQN7puZmTM.OygwXu2uQQt1aTPDeA2uR6wExVSH6NRS0Ku8C"

  portainer:
    image: portainer/portainer-ce:latest
    command: -H unix:///var/run/docker.sock
    restart: always
    expose:
      - "8000"
      - "9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    labels:
      - "traefik.http.services.portainer.loadbalancer.server.port=9000"
      - "traefik.http.routers.portainer.entrypoints=websecure"
      - "traefik.http.routers.portainer.rule=Host(`portainer.example.com`)"
      - "traefik.http.routers.portainer.tls=true"
      - "traefik.http.routers.portainer.tls.certresolver=letsencrypt"

  nextcloud:
    image: ghcr.io/linuxserver/nextcloud:latest
    restart: always
    expose:
      - "443"
    volumes:
      - nextcloud_config:/config
      - nextcloud_data:/data
    environment:
      - PUID=1000
      - GUID=1000
      - TZ=Europe/Paris
    labels:
      - "traefik.http.services.nextcloud.loadbalancer.server.port=443"
      - "traefik.http.services.nextcloud.loadbalancer.server.scheme=https"
      - "traefik.http.routers.nextcloud.entrypoints=websecure"
      - "traefik.http.routers.nextcloud.rule=Host(`cloud.example.com`)"
      - "traefik.http.routers.nextcloud.tls=true"
      - "traefik.http.routers.nextcloud.tls.certresolver=letsencrypt"
      - "traefik.http.middlewares.nc-rep.redirectregex.regex=https://(.*)/.well-known/(card|cal)dav"
      - "traefik.http.middlewares.nc-rep.redirectregex.replacement=https://$$1/remote.php/dav/"
      - "traefik.http.middlewares.nc-rep.redirectregex.permanent=true"
      - "traefik.http.middlewares.nc-header.headers.referrerPolicy=no-referrer"
      - "traefik.http.middlewares.nc-header.headers.stsSeconds=31536000"
      - "traefik.http.middlewares.nc-header.headers.forceSTSHeader=true"
      - "traefik.http.middlewares.nc-header.headers.stsPreload=true"
      - "traefik.http.middlewares.nc-header.headers.stsIncludeSubdomains=true"
      - "traefik.http.middlewares.nc-header.headers.browserXssFilter=true"
      - "traefik.http.middlewares.nc-header.headers.customRequestHeaders.X-Forwarded-Proto=https"
      - "traefik.http.middlewares.nc-header.headers.customResponseHeaders.X-Robots-Tag=noindex,nofollow"
      - "traefik.http.routers.nextcloud.middlewares=nc-rep,nc-header"
      # Arrêter Nextcloud pendant les sauvegardes nocturnes
      - "docker-volume-backup.stop-during-backup=true"

  mariadb:
    image: mariadb:latest
    command: --transaction-isolation=READ-COMMITTED --binlog-format=ROW --innodb-read-only-compressed=OFF
    restart: always
    expose:
      - "3306"
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /etc/timezone:/etc/timezone:ro
      - nextcloud_db:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=nextcloud
      - MYSQL_PASSWORD=nextcloud
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MARIADB_AUTO_UPGRADE=true
    labels:
      # Pas besoin de rendre la base de données accessible depuis l'extérieur
      - "traefik.enable=false"
      # Arrêter Nextcloud pendant les sauvegardes nocturnes
      - "docker-volume-backup.stop-during-backup=true"

  backup:
    image: offen/docker-volume-backup:latest
    restart: always
    volumes:
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
      # Volumes à sauvegarder
      - nextcloud_config:/backup/nextcloud_config-backup:ro
      - nextcloud_data:/backup/nextcloud_data-backup:ro
      - nextcloud_db:/backup/nextcloud_db-backup:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      # On suppose un disque monté sous /media/backups pour les sauvegardes
      - /media/backups/backup:/backup
      - /media/backups/archive:/archive
      - /media/backups/tmp:/tmp
    environment:
      # Configuration pour une sauvegarde locale des données toutes les nuits à 2:30
      # La rotation des archives des sauvegardes a lieu tous les 7 jours
      # Voir la documentation : https://offen.github.io/docker-volume-backup/
      - BACKUP_CRON_EXPRESSION="30 02 * * *"
      - BACKUP_FILENAME="backup-%Y-%m-%dT%H-%M-%S.tar.gz"
      - BACKUP_LATEST_SYMLINK="backup.latest.tar.gz"
      - BACKUP_ARCHIVE="/archive"
      - BACKUP_RETENTION_DAYS="7"
      - EXEC_FORWARD_OUTPUT="true"
    labels:
      # Rien à voir depuis l'extérieur
      - "traefik.enable=false"

volumes:
  traefik_logs:
  traefik_certs:
  wireguard_config:
  netdata_config:
  netdata_lib:
  netdata_cache:
  portainer_data:
  nextcloud_config:
  nextcloud_data:
  nextcloud_db:
  nextcloud_redis:
```

À noter qu'on utilise une authentification basique pour l'interface web de Traefik. Pour générer un identifiant, utilisez la commande suivante – ici, l'utilisateur `toto` avec comme mot de passe `blabla` :

```shell
echo $(htpasswd -nbB toto "blabla") | sed -e s/\\$/\\$\\$/g
```

On sauvegarde également dans un volume le fichier `acme.json` qui contient nos certificats Let's Encrypt. Cela évite la mauvaise surprise d'atteindre les limites de renouvellement de certificats du service quand on fait ses tests...

## Configuration

### WireGuard

Remplacez `example.com` par votre nom de domaine dans la configuration de l'environnement pour WireGuard. Utilisez [la documentation](https://github.com/wg-easy/wg-easy/blob/master/How_to_generate_an_bcrypt_hash.md) fournie avec l'image pour générer le hash du mot de passe de l'interface d'administration.

### Nextcloud

On va créer les conteneurs pour initialiser leur configuration. Les volumes correspondant seront créés à la volée :

```shell
docker-compose up -d
```

Le cycle de vie d'un conteneur est court : on peut le détruire et le recréer comme on le souhaite, et il s'initialisera de la même manière à chaque lancement.

Il vous reste à accéder à Portainer et Nextcloud pour initialiser leur configuration. Pour Nextcloud, n'oubliez pas de préciser les informations sur la base de données. Le conteneur MariaDB et le conteneur Nextcloud sont connectés au même réseau, on peut donc compter sur Docker pour la résolution des noms et l'ouverture du port : le nom d'hôte du serveur est `mariadb`, port `3306`.

## Sauvegardes

À ce stade, dans `/var/stack`, vous avez un fichier `docker-compose.yml` qui définit les services à exécuter. Vos données sont stockées dans les *volumes nommés* définis par Docker Compose, sous le répertoire `/var/lib/docker/volumes`.

Chaque nuit, les données de Nextcloud et sa base de données sont sauvegardées sur le disque `/media/backups`.

## Et ensuite ?

N'oubliez pas de mettre à jour régulièrement les images de vos services :

```shell
docker-compose pull
docker-compose up -d
```

Au fur et à mesure, les versions antérieures des images peuvent être effacées pour récupérer de l'espace disque :

```shell
docker system prune
```

Enfin en cas de problème, consultez les journaux des conteneurs :

```shell
docker-compose logs
```

Pour jeter un œil rapidement sur l'activité de vos conteneurs, je vous recommande [ctop](https://github.com/bcicen/ctop).
