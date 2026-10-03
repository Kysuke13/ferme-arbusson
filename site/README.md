# La Ferme d'Arbusson — Site restaurateurs

Page de présentation des micropousses vivantes **Microgreens Chef Mix** destinée aux restaurateurs.

Site statique : un seul fichier `index.html` (HTML, CSS et JavaScript intégrés) et le logo dans `images/`.

## Voir le site en local
Ouvrir `index.html` dans un navigateur.

## Mettre en ligne avec GitHub Pages
1. Dans le dépôt : **Settings › Pages**
2. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`
3. Le site est publié sous quelques minutes à l'adresse indiquée.

## À compléter
Les éléments entre crochets dans `index.html` : zone de livraison, heure limite de commande, durée de conservation, délai de prévenance, frais de livraison, téléphone, email et adresse.
## Réception des commandes par email
Le formulaire envoie chaque commande par email via le service gratuit FormSubmit (formsubmit.co).
1. Dans `index.html`, l'adresse qui reçoit les commandes est définie par la variable `EMAIL_COMMANDES` en haut du script (actuellement contact@ferme-arbusson.fr).
2. Passer une première commande test depuis le site en ligne : FormSubmit envoie un email d'activation, cliquer sur le lien pour l'activer.
3. Les commandes suivantes arrivent directement dans la boîte mail, sous forme de tableau (restaurant, contact, formule, quantité, jours, montants).
