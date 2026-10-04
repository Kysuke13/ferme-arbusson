import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin-session'
import { login } from '../actions'
import styles from '../admin.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: "Connexion — La Ferme d'Arbusson" },
  robots: { index: false, follow: false, nocache: true },
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect('/admin')

  const params = await searchParams
  const message =
    params.error === '1'
      ? 'Identifiants incorrects.'
      : params.error === 'config'
        ? "La connexion admin n'est pas configurée."
        : ''

  return (
    <form className={styles.login} action={login}>
      <div>
        <div className={styles.kicker}>ADMIN</div>
        <h1 className={styles.title}>Connexion</h1>
      </div>
      <p className={styles.intro}>Les commandes ne sont visibles qu'après connexion.</p>
      <label className={styles.field}>
        Identifiant
        <input name="username" type="email" required autoComplete="username" inputMode="email" />
      </label>
      <label className={styles.field}>
        Mot de passe
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {message ? <p className={styles.error}>{message}</p> : null}
      <button className={styles.button} type="submit">
        Se connecter
      </button>
    </form>
  )
}
