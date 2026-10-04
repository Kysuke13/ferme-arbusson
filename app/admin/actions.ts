'use server'

import { redirect } from 'next/navigation'
import { clearAdminSession, passwordMatches, startAdminSession, usernameMatches } from '@/lib/admin-session'

export async function login(formData: FormData) {
  const username = String(formData.get('username') || '')
  const password = String(formData.get('password') || '')
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) redirect('/admin/login?error=config')
  if (!usernameMatches(username) || !passwordMatches(password)) redirect('/admin/login?error=1')
  await startAdminSession()
  redirect('/admin')
}

export async function logout() {
  await clearAdminSession()
  redirect('/admin/login')
}
