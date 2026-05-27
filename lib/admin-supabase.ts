const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminAccessKey = process.env.ADMIN_ACCESS_KEY

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

export function getSupabaseAdminConfig() {
  return {
    url: requireEnv('SUPABASE_URL', supabaseUrl),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey),
  }
}

export function verifyAdminAccessKey(request: Request) {
  const expected = adminAccessKey
  if (!expected) {
    throw new Error('ADMIN_ACCESS_KEY is required')
  }

  const actual = request.headers.get('x-admin-key')

  if (actual !== expected) {
    return false
  }

  return true
}
