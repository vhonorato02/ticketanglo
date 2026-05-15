import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUsers } from '@/actions/users';
import { UserList } from './user-list';
import { CreateUserForm } from './create-user-form';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) redirect('/');

  const users = await getUsers();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerenciamento de usuários</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold mb-4">Usuários</h2>
          <UserList users={users} currentUserId={session.user.id} />
        </div>

        <div>
          <h2 className="text-base font-semibold mb-4">Adicionar usuário</h2>
          <CreateUserForm />
        </div>
      </div>
    </div>
  );
}
