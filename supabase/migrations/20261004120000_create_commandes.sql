-- Commandes envoyées depuis le site.
-- anon et authenticated n'ont aucun droit : Next.js écrit et lit avec la clé service_role.

create table public.commandes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  restaurant text not null,
  nom text not null,
  email text not null,
  telephone text not null,
  adresse text not null,
  message text,
  formule text not null,
  barquettes integer not null,
  jours text not null,
  montant_livraison numeric(10, 2) not null,
  total_semaine numeric(10, 2),
  constraint commandes_formule_check check (
    formule in ('Abonnement hebdomadaire sans engagement', 'Commande ponctuelle')
  ),
  constraint commandes_barquettes_check check (barquettes between 10 and 500),
  constraint commandes_email_check check (
    email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint commandes_lengths_check check (
    char_length(restaurant) between 1 and 200
    and char_length(nom) between 1 and 200
    and char_length(telephone) between 6 and 40
    and char_length(adresse) between 1 and 400
    and char_length(jours) between 1 and 120
    and (message is null or char_length(message) <= 2000)
    and montant_livraison >= 0
    and montant_livraison <= 100000
    and (total_semaine is null or (total_semaine >= 0 and total_semaine <= 100000))
  )
);

create index commandes_created_at_idx on public.commandes (created_at desc);

alter table public.commandes enable row level security;

revoke all on table public.commandes from public, anon, authenticated;
grant all on table public.commandes to service_role;
