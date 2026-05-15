// /tickets/novo redirects to a pre-opened ticket form on the main tickets page
import { redirect } from 'next/navigation';

export default function NovoPage() {
  redirect('/tickets');
}
