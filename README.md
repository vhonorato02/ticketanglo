# TicketAnglo

Sistema interno de gestão de demandas para TI e Marketing do Colégio Anglo Pindamonhangaba.

## Stack

- Next.js 15 App Router
- React 19 e TypeScript estrito
- Auth.js v5 com Credentials, JWT e bcrypt
- Neon Postgres com Drizzle ORM
- Tailwind CSS v4 e componentes Radix/shadcn-style
- Kanban com `@dnd-kit`
- Toasts com `sonner`

## Princípios do projeto

- Nenhuma senha real ou padrão versionada.
- Textos de interface centralizados em `src/lib/copy.ts`.
- Regras de domínio centralizadas em `src/lib/constants.ts`.
- Server Actions com validação por Zod antes de gravar no banco.
- Administração com criação, edição, permissão, desativação, redefinição de senha e exclusão segura de usuários.
- Exclusão de usuário preserva demandas, comentários e histórico como registros de usuário removido.
- Demandas com edição completa de detalhes, paginação, exportação CSV, Kanban, histórico e exclusão administrativa para registros criados por engano.
- Comentários com edição e exclusão por autor ou administrador.

## Ambiente

Crie `.env` a partir de `.env.example` e preencha os valores reais:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

BOOTSTRAP_ADMIN_USERNAME="admin"
BOOTSTRAP_ADMIN_DISPLAY_NAME="Administrador"
BOOTSTRAP_ADMIN_PASSWORD="defina-localmente"
```

Gere o `AUTH_SECRET` com:

```bash
openssl rand -base64 32
```

## Desenvolvimento

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

`db:seed` cria ou sincroniza o primeiro administrador usando apenas as variáveis `BOOTSTRAP_ADMIN_*`. A senha nunca fica no repositório.

## Scripts

```bash
npm run dev        # Servidor local
npm run build      # Build de produção
npm run lint       # ESLint
npm run test:smoke # Sobe servidor isolado e valida fluxos críticos HTTP
npm run db:push    # Aplica schema Drizzle
npm run db:migrate # Aplica migrations
npm run db:studio  # Abre Drizzle Studio
npm run db:seed    # Sincroniza primeiro admin via env
```

## Estrutura

```txt
src/
  actions/          Server Actions validadas
  app/              Rotas do App Router
  components/       UI, layout, tickets e kanban
  db/               Schema, conexão e seed
  lib/
    constants.ts    Domínio: áreas, status, prioridades e transições
    copy.ts         Textos visíveis e mensagens
    format.ts       Formatação e helpers de apresentação
    validation.ts   Schemas reutilizáveis
```

## Bootstrap remoto

Existe `POST /api/admin/bootstrap` para sincronizar o primeiro administrador em ambientes remotos. Ele exige:

- `Authorization: Bearer <AUTH_SECRET>`
- `BOOTSTRAP_ADMIN_USERNAME`
- `BOOTSTRAP_ADMIN_DISPLAY_NAME`
- `BOOTSTRAP_ADMIN_PASSWORD`

Sem essas variáveis, a rota não cria credenciais.
