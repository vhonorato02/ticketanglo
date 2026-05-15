import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Users, Shield } from 'lucide-react';
import { getUsers } from '@/actions/users';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserList } from './user-list';
import { CreateUserForm } from './create-user-form';
import { AccountSettings } from './account-settings';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Configurações',
};

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) redirect('/');

  const users = await getUsers();
  const currentUser = session.user as {
    id: string;
    name?: string | null;
    isAdmin?: boolean;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Gerencie usuários, permissões e a sua conta.
        </p>
      </header>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios" className="gap-1.5">
            <Users className="size-3.5" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="minha-conta" className="gap-1.5">
            <Shield className="size-3.5" />
            Minha conta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-8 mt-6">
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold">Equipe ({users.length})</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Acesso, permissões e redefinição de senhas.
                </p>
              </div>
            </div>
            <UserList users={users} currentUserId={currentUser.id} />
          </section>

          <section>
            <div className="mb-3">
              <h2 className="text-base font-semibold">Adicionar novo usuário</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crie credenciais para um novo membro da equipe.
              </p>
            </div>
            <CreateUserForm />
          </section>
        </TabsContent>

        <TabsContent value="minha-conta" className="space-y-6 mt-6">
          <AccountSettings
            userId={currentUser.id}
            displayName={currentUser.name ?? ''}
            isAdmin={currentUser.isAdmin ?? false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
