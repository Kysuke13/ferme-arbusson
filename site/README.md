# La Ferme d'Arbusson — Site restaurateurs

Application Next.js. La page publique reprend `site/index.html`. Les commandes sont enregistrées dans Supabase. Resend envoie ensuite le détail à la ferme et un accusé au client.

## Lancer en local

```bash
npm install
npm run dev
```

Le site est sur [http://localhost:3000](http://localhost:3000). Les commandes se lisent sur [http://localhost:3000/admin](http://localhost:3000/admin).

## Variables

Copier `.env.example` vers `.env` :

- `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` : clé secrète, utilisée seulement par le serveur
- `RESEND_API_KEY` : envoi des emails (Resend). Le domaine de `RESEND_FROM` doit être vérifié dans Resend
- `RESEND_FROM` : expéditeur, par exemple `"La Ferme d'Arbusson" <contact@ferme-arbusson.fr>`
- `ORDER_NOTIFY_EMAIL` : destinataire interne de chaque commande
- `ADMIN_USERNAME` et `ADMIN_PASSWORD` : accès à `/admin`
- `ADMIN_SESSION_SECRET` : signature du cookie de session

`.env` n'est pas versionné.

## Base de données

La table `commandes` est décrite dans `supabase/migrations`. Le rôle public ne peut ni lire ni écrire. Le serveur Next.js utilise la clé `service_role`, qui contourne ces restrictions.

```bash
supabase link --project-ref ivyocvcoszyrlpqblqzc
npm run db:push
```

## À compléter

Les éléments entre crochets dans `site/index.html` : zone de livraison, heure limite de commande, durée de conservation, délai de prévenance.
