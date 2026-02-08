/**
 * Purpose:
 * Redirect from legacy /login path to canonical /signin path.
 *
 * System context:
 * - Maintains backwards compatibility for any existing /login links
 * - Canonical auth path is /signin
 */

import { redirect } from 'next/navigation'

export default function LoginPage() {
  redirect('/signin')
}
