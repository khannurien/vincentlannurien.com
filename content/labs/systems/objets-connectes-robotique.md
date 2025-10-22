---
draft: false
hide_title: false
math: true

title: "Objets connectés et robotique"
date: "2025-09-05T15:13:37+02:00"

tags:
  - "labs"
  - "embedded"
  - "systems"

todo:
  - Node.js -> Deno
  - JavaScript -> TypeScript
  - Calcul déporté
---

## Prérequis

- Une machine sous **Linux**
  - ⚙️ Démarrer sous Debian sur les machines du département
- [**Arduino IDE**](https://www.arduino.cc/en/software/)
  - ✅ Version 1 disponible sur les machines du département
- [**Visual Studio Code**](https://code.visualstudio.com/)
  - ✅ Disponible sur les machines du département
- [**Node.js**](https://nodejs.org/)
  - ✅ Disponible sur les machines du département

## TD 1 : Découverte de l'environnement

### Exercice 1 : On/Off

> Objectif de l'exercice :
> Allumer et éteindre une LED en introduisant un délai dans la boucle principale.

1. Réaliser le circuit sur le simulateur [Wokwi](https://wokwi.com/projects/new/arduino-uno).
2. Utiliser la fonction [`digitalWrite`](https://docs.arduino.cc/language-reference/en/functions/digital-io/digitalwrite/) pour allumer et éteindre la LED.
3. Utiliser la fonction [`delay`](https://docs.arduino.cc/language-reference/en/functions/time/delay/) pour produire un cycle d'allumage et d'extinction.

### Exercice 2 : PWM

> Objectif de l'exercice :
> Moduler l'intensité lumineuse de la LED.

1. Utiliser la fonction [`analogWrite`](https://docs.arduino.cc/language-reference/en/functions/analog-io/analogWrite/) pour allumer la LED à 50% de son intensité maximale.
2. Introduire des délais pour réaliser un effet de fondu en faisant varier l'intensité de la LED.

### Exercice 3 : communiquer sur liaison série

> Objectif de l'exercice :
> Envoyer et recevoir des caractères entre le PC et l'Arduino *via* la liaison série.
> Pour référence, s'appuyer sur la documentation : [SoftwareSerial.h](https://docs.arduino.cc/learn/built-in-libraries/software-serial/)

1. Vérifier le fonctionnement de l'Arduino en lui envoyant un programme d'exemple (menu *Fichier > Exemples > Basics > Blink*) :

    ![](../images/arduino-blink.png)

2. Écrire du texte sur la liaison depuis l'Arduino et l'afficher sur le PC en utilisant le moniteur série (menu *Outils*) :

    ![](../images/arduino-serial-hello-world.png)

3. Envoyer une chaîne de caractères depuis le PC, la recevoir sur l'Arduino et afficher les valeurs ASCII des caractères sur le moniteur série :

    ![](../images/arduino-serial-read.png)

    ![](../images/arduino-serial-read-write.png)

### Exercice 4 : communiquer *via* Zigbee

> Objectif de l'exercice :
> Par groupes, communiquer entre PC via Zigbee.
> Un binôme "émetteur", un binôme "récepteur".

L'exercice est à réaliser sous Linux (démarrer sous Debian en salle de TP).

#### Préparation des modules XBee

Deux méthodes sont possibles : soit avec un utilitaire graphique, **XCTU** ; soit par une liaison série via le terminal.

Choisissez l'une ou l'autre de ces deux méthodes, puis passez à la partie **Exercice**.

##### Méthode graphique : XCTU

###### Installation

1. Installez XCTU :
    1. Cliquez sur le lien **Download** de la [page du support Digi XCTU](https://hub.digi.com/support/products/xctu/?path=/support/asset/xctu-v-659-linux-x64/) ;
    2. Rendez exécutable le fichier d'installation téléchargé :

        ```sh
        cd Téléchargements
        chmod +x 40002881_AJ.run
        ./40002881_AJ.run
        ```

    3. Installez XCTU dans un répertoire quelconque préalablement créé (par exemple : `mkdir ~/xctu`).
2. Branchez le module XBee sur votre machine avec le câble USB - XBee.
3. Lancez XCTU et poursuivre avec la configuration. Pour exécuter le programme, lancez la commande suivante depuis un terminal : `~/xctu/XCTU-NG/app`

###### Configuration

1. Lancez XCTU. Ajoutez votre module radio dans XCTU en cliquant sur "*Add device*", en haut à gauche :

    ![](../images/xctu.png)

2. Cliquez sur "*Refresh ports*" puis sélectionnez le port USB correspondant à votre module (en salle TP, `/dev/ACM0`) et cliquez sur "*Finish*" :

    ![](../images/xctu-add.png)

3. Sélectionnez dans XCTU le module que vous venez d'ajouter. Vous accédez à sa configuration :

    ![](../images/xctu-config.png)

    Pour une utilisation *point à point*, la configuration doit être identique sur les deux modules XBee :

    - [CH] Channel : canal radio
    - [ID] PAN ID : identifiant du réseau
    - [DH/DL] Destination Address High/Low : adresse 64 bits du second module (et réciproquement)
    - [SH/SL] Serial Number High/Low : adresse 64 bits du module courant
    - [BD] Interface Data Rate : vitesse de transfert (9600 bauds, soit 960 octets/seconde)
    - [MM] MAC Mode : 802.15.4
    - [AP] API Enable : 0 (on utilise les commandes le mode transparent **AT**)

4. Une fois la configuration effectuée, validez en cliquant sur "*Write*".

##### Méthode terminal : `screen`

En utilisant les commandes **AT** :

1. Utiliser `screen` pour ouvrir un terminal série :

    ```sh
    screen /dev/ttyACM0 9600
    ```

2. Envoyer la série de commandes suivantes (taper "dans le vide" et valider avec Entrée) :

    ```txt
    +++             (démarrage de la session, retourne "OK")
    ATID 1234       (PAN ID = 0x1234)
    ATCH 0C         (canal = 0x0C)
    ATAP 0          (mode transparent)
    ATSH            (voir les 32 bits de la partie haute de sa propre adresse)
    ATSL            (voir les 32 bits de la partie basse de sa propre adresse)
    ATDH 0013A200   (exemple : partie haute de l'adresse du module destination)
    ATDL 40B9ABCD   (exemple : partie basse de l'adresse du module destination)
    ATBD 3          (baudrate = 9600)
    ATWR            (écrire)
    ATCN            (quitter)
    ```

#### Exercice

1. Créez un projet Node.js :

    ```sh
    mkdir td-xbee
    cd td-xbee
    npm init
    ```

2. Installez la bibliothèque `serialport` dans votre projet :

    ```sh
    npm install serialport
    ```

3. Créez deux fichiers, `sender.js` et `receiver.js`. Voici des squelettes, à compléter :

    ```js
    // sender.js

    // Importer la bibliothèque serialport
    const { SerialPort } = require('serialport');

    // Configurer le chemin du port série
    const PORT = '/dev/ttyACM0';
    // Configurer le baudrate
    const BAUD = 9600;
    // Le message à envoyer
    const MSG = 'Coucou';

    // Instancier l'objet SerialPort
    const port = new SerialPort({ path: PORT, baudRate: BAUD });

    // Deux événements nous intéressent :
    // Événement : ouverture du port série
    port.on('open', () => {
      // Confirmer l'ouverture du port en affichant son chemin et le baudrate
      console.log(...);
      // Transformer la chaîne de caractères en séquence d'octets
      const payload = Buffer.from(MSG, 'utf8');
      // Écrire la séquence sur le port série
      port.write(payload, (err) => {
        // Vérifier qu'il n'y a pas d'erreur
        if (...)
        // Confirmer l'envoi du message en affichant le nombre d'octets transmis
        console.log(...);
      });
    });
    // Événement : Erreur
    port.on('error', (err) => console.error('Serial error:', err));
    ```

    ```js
    // receiver.js
    
    // Importer la bibliothèque serialport
    const { SerialPort } = require('serialport');

    // Configurer le chemin du port série
    const PORT = '/dev/ttyACM0';
    // Configurer le baudrate
    const BAUD = 9600;

    // Instancier l'objet SerialPort
    const port = new SerialPort({ path: PORT, baudRate: BAUD });

    // Trois événements nous intéressent :
    // Événement : Ouverture du port série
    port.on('open', () => {
      // Confirmer l'ouverture du port en affichant son chemin et le baudrate
      console.log(...);
    });
    // Événement : Réception de données
    port.on('data', (buf) => {
      // Convertir la séquence d'octets en chaîne de caractères
      const text = ...
      // Afficher le message reçu
      console.log(...);
    });
    // Événement : Erreur
    port.on('error', (err) => console.error('Serial error:', err));
    ```

4. Pour exécuter vos programmes, utilisez la commande `node` :

    ```sh
    node receiver.js # côté récepteur
    node sender.js   # côté émetteur
    ```
