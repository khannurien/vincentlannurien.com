---
draft: false
hide_title: false
math: true

title: "Objets connectés et robotique"
date: "2025-09-05T15:13:37+02:00"
updatedAt: 2026-09-16T12:03:43Z

tags:
  - "UBO"
  - "L3 IFA"
  - "S5"

todo:
  - Node.js -> Deno
  - JavaScript -> TypeScript
  - Calcul déporté
---

## TD 1 : Commande du robot

Dessiner sur un plan, mesurer

1. Comment tourner ?

2. Comment faire demi-tour ?

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

## TD 2 : comportement autonome avec un contrôleur PID

Équation d'un contrôleur PID en temps continu :

\[
u(t) = K_p \cdot e(t) + K_i \cdot \int_0^t e(\tau) \, d\tau + K_d \cdot \frac{de(t)}{dt}
\]

Et en version discrète, pour un implantation numérique :

\[
u[n] = K_p \cdot e[n] + K_i \cdot \sum_{i=0}^{n} e[i] + K_d \cdot (e[n] - e[n-1])
\]

Expliquer le rôle de chacune des composantes de la fonction discrète du PID, sachant que :

- \(u[n]\) : commande envoyée au système au pas de temps \(n\)
- \(e[n]\) : erreur mesurée au pas de temps \(n\) (exemple : \(distance_{cible} - distance_{mesurée}\))

Pour simplifier :

- erreur proportionnelle \(e_p\) : distance mesurée – distance voulue
- erreur intégrale \(e_i\) : somme des \(e_p\) calculées précédemment
- erreur dérivée \(e_d\) : \(e_{p}[n]\) - \(e_{p}[n-1]\)

### Exercice 1 : composante proportionnelle (P)

*Comment le terme proportionnel influence-t-il la réaction du robot ?*

> Un robot doit maintenir une distance de 10 cm avec un mur lorsqu'il le longe.
> Sa distance actuelle au mur est de 6 cm.

1. Que signifie \(e[0]\) ? Calculez sa valeur.
2. Si le gain proportionnel \(K_p = 0.5\), quelle est la correction appliquée ?
3. Que se passe-t-il si \(K_p = 2\) ?

### Exercice 2 : composante intégrale (I)

*Comment l'intégrale corrige les erreurs persistantes ?*

> Le robot reste trop près du mur pendant plusieurs secondes...
> Aux trois derniers pas de temps : \(e[0] = 4, e[1] = 4, e[2] = 4\)

1. Calculer la correction totale après 3 mesures.
2. Si le gain intégral \(K_i = 0.1\), quelle est la part due à l'intégrale ?
3. Que se passe-t-il si \(K_i\) est trop grand ?

### Exercice 3 : composante dérivée (D)

*Comment la dérivée anticipe les changements rapides ?*

> Le robot s'éloigne du mur.
> Aux deux derniers pas de temps : \(e[2] = 4, e[3] = 1\)

1. Calculer la variation d'erreur.
2. Pour un gain dérivé \(K_d = 02\), calculer la correction appliquée.
3. Quelle est la correction totale ?

### Exercice 4 : pertinence des composantes

*Comment diagnostiquer un mauvais réglage du contrôleur ?*

> Le robot oscille autour du seuil cible.
> Le robot corrige trop lentement sa trajectoire.
> Le robot dépasse systématiquement le seuil cible.

1. Que dire de \(K_p\), \(K_i\) et \(K_d\) dans chacune de ces trois situations ?
2. Comment peut-on corriger ces dysfonctionnements ?

## TD 3 : distribution du calcul et étude des compromis

### Exercice 1 : temps de calcul et fréquence de lecture

> Le capteur VL53L1X peut mesurer jusqu'à **50 Hz** (soit une mesure toutes les 20 ms).
> - Arduino Uno à 16 MHz
> - Temps de calcul d'un PID simple : \~1 ms
> - Temps de lecture du capteur : \~20 ms

1. Quelle est la fréquence maximale théorique de la boucle PID ?
2. Que se passe-t-il si l'on veut lire le capteur à 100 Hz ?
3. Proposez une fréquence raisonnable pour un robot roulant à 0.5 m/s.

### Exercice 2 : occupation mémoire du PID

> On veut stocker un historique de 100 erreurs pour calculer un PID discret.
> - Arduino Uno : 2 Ko de RAM
> - Chaque erreur est un `float` (4 octets)

1. Quelle quantité de mémoire est utilisée pour stocker 100 erreurs ?
2. Quelle est la mémoire restante pour le reste du programme ?
3. Proposer une solution pour réduire l'empreinte mémoire sans perdre trop de précision.

### Exercice 3 : énergie et efficacité

> Un robot utilise un PID mal réglé qui provoque des oscillations.
> - Les moteurs consomment 100 mA en ligne droite
> - En cas d'oscillations : consommation moyenne = 150 mA
> - Batterie = 1000 mAh

1. Quelle est l'autonomie du robot avec et sans oscillations ?
2. Quel est le gain en autonomie si le PID est bien réglé ?
3. Quelle stratégie PID permet de réduire les oscillations ?

### Exercice 4 : précision et bruit de mesure

> Le capteur VL53L1X a une précision de ±5% et une résolution de 1 mm.
> - Distance réelle = 200 mm
> - Mesures successives : 198, 202, 195, 205, 200

1. Calculez l'erreur moyenne et l'écart-type.
2. Quelle est l'influence du bruit sur le terme dérivé du PID ?
3. Proposez une méthode pour filtrer les mesures avant le calcul du PID.

### Exercice 5 : latence dans une architecture distribuée

> Pour économiser les ressources de l'Arduino, on propose de transférer le calcul du PID vers un PC. L'Arduino envoie les mesures via XBee, et reçoit en retour les commandes calculées.
> - Capteur VL53L1X : mesure toutes les 20 ms
> - Latence XBee (aller-retour) : \~50 ms
> - Temps de calcul PID sur PC : 1 ms
> - Vitesse du robot : 0.5 m/s

1. Quelle est la latence totale entre la mesure et l'application de la commande ?
2. Quelle distance le robot parcourt pendant cette latence ?
3. Est-ce acceptable pour un robot devant éviter des obstacles à 20 cm ?
4. Proposez une stratégie pour réduire l'impact de cette latence (*e.g.* prédiction, calcul local, hybridation).

{{< divider >}}

## TP 1

1. Fritzing
2. Montage électrique

## TP 2

### Prérequis

- Une machine sous **Linux**
  - ⚙️ Démarrer sous Debian sur les machines du département
- [**Visual Studio Code**](https://code.visualstudio.com/)
  - ✅ Disponible sur les machines du département

1. Découverte de l'environnement logiciel
    - On utilise un conteneur de développement
    - Exécuter la commande `docker` pour initialiser le *daemon*
    - Télécharger le projet et le décompresser : `unzip rubo-smol.zip`
    - Ouvrir le projet : `code rubo-smol/`
    - Installer l'extension pour VS Code "Dev Containers"
    - Rouvrir le projet dans le conteneur (<kbd>Ctrl</kbd> + <kbd>P</kbd> > "*Reopen in Container*")
2. Procédure de compilation et de flash du firmware
3. Implantation des commandes de base
4. Connexion du robot au Wi-Fi (SSID : `RUBOLINK-OCRx` avec `x` votre numéro de groupe, mot de passe : `nullptr`)

## TP 3

1. Mission "longer"

## TP 4

1. IHM

## TP 5

1. Mission "contourner" ?

## TP 6

1. PID

## TP 7

Démonstration :
- scénarios
- plan de démo
- difficultés rencontrées
- questions
