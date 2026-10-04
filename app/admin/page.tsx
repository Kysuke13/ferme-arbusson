import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin-session'
import { listCommandes, type Commande } from '@/lib/commandes'
import { logout } from './actions'
import styles from './admin.module.css'

export const dynamic = 'force-dynamic'

function euro(value: number | null) {
  if (value == null) return '—'
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' € HT'
}

function when(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function Orders({ rows }: { rows: Commande[] }) {
  if (!rows.length) return <p className={styles.empty}>Aucune commande pour le moment.</p>
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Reçue</th>
            <th>Restaurant</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>Adresse</th>
            <th>Formule</th>
            <th>Barquettes</th>
            <th>Jours</th>
            <th>Par livraison</th>
            <th>Par semaine</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-label="Reçue">{when(row.created_at)}</td>
              <td data-label="Restaurant">{row.restaurant}</td>
              <td data-label="Contact">{row.nom}</td>
              <td data-label="Email">
                <a href={`mailto:${row.email}`} style={{ color: '#141412' }}>
                  {row.email}
                </a>
              </td>
              <td data-label="Téléphone">
                <a href={`tel:${row.telephone}`} style={{ color: '#141412' }}>
                  {row.telephone}
                </a>
              </td>
              <td data-label="Adresse">{row.adresse}</td>
              <td data-label="Formule">{row.formule}</td>
              <td data-label="Barquettes">{row.barquettes}</td>
              <td data-label="Jours">{row.jours}</td>
              <td data-label="Par livraison">{euro(row.montant_livraison)}</td>
              <td data-label="Par semaine">{euro(row.total_semaine)}</td>
              <td data-label="Message">{row.message || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/login')

  let rows: Commande[] = []
  let loadError = ''
  try {
    rows = await listCommandes()
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Lecture impossible.'
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <div className={styles.kicker}>{loadError ? 'ADMIN' : `ADMIN · ${rows.length} COMMANDE${rows.length > 1 ? 'S' : ''}`}</div>
          <h1 className={styles.title}>Les demandes reçues</h1>
        </div>
        <div className={styles.actions}>
          <a className={styles.link} href="/">
            Retour au site
          </a>
          <form action={logout}>
            <button className={styles.ghost} type="submit">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      {loadError ? <p className={styles.error}>{loadError}</p> : <Orders rows={rows} />}
    </main>
  )
}
