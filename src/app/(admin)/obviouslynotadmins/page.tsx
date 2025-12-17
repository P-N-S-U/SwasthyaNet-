
import { redirect } from 'next/navigation';

export default function AdminPage() {
  // The root admin page should redirect to a default dashboard or management page.
  redirect('/obviouslynotadmins/partners');
}
