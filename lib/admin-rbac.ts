import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type AdminRole = 'super_admin' | 'branch_admin'

export interface AdminSession {
  userId: string
  email: string
  role: AdminRole
  branchId: string | null
  branchName: string | null
  isSuperAdmin: boolean
  isBranchAdmin: boolean
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role, branch_id, email, branches(name)')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return null
  if (profile.role !== 'super_admin' && profile.role !== 'branch_admin') return null

  const branch = Array.isArray(profile.branches) ? profile.branches[0] : profile.branches

  return {
    userId: user.id,
    email: profile.email ?? user.email ?? '',
    role: profile.role as AdminRole,
    branchId: profile.branch_id ?? null,
    branchName: branch?.name ?? null,
    isSuperAdmin: profile.role === 'super_admin',
    isBranchAdmin: profile.role === 'branch_admin',
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await requireAdmin()
  if (!session.isSuperAdmin) throw new Error('FORBIDDEN_SUPER_ADMIN_ONLY')
  return session
}

export async function requireBranchAccess(branchId: string | null): Promise<AdminSession> {
  const session = await requireAdmin()
  if (session.isSuperAdmin) return session
  if (!session.branchId || session.branchId !== branchId) {
    throw new Error('FORBIDDEN_BRANCH_ACCESS')
  }
  return session
}

export function scopeToBranch<T extends { eq: (col: string, val: unknown) => T }>(
  query: T,
  session: AdminSession,
  column = 'pickup_branch_id',
): T {
  if (session.isSuperAdmin) return query
  return query.eq(column, session.branchId)
}