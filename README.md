# TicketAnglo

Sistema interno de gestão de demandas para TI e Marketing — Colégio Anglo Pindamonhangaba / Emílio Ribas.

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript** estrito
- **Neon Postgres** via `@neondatabase/serverless`
- **Drizzle ORM** + migrations
- **Auth.js v5** com Credentials provider (bcrypt + JWT)
- **Tailwind CSS v4** + componentes shadcn-style
- **@dnd-kit** — Kanban drag & drop
- **sonner** — Toasts
- **date-fns** — Datas em pt-BR

---

## Passo a passo: deploy na Vercel + Neon

### 1. Clone e instale dependências

```bash
git clone <repo-url>
cd ticketanglo
npm install
```

### 2. Crie o banco de dados no Neon

1. Acesse [neon.tech](https://neon.tech) e crie uma conta gratuita
2. Crie um novo projeto (ex: `ticketanglo`)
3. Na aba **Connection Details**, copie a **Connection string** (formato `postgresql://...`)

### 3. Configure variáveis de ambiente locais

```bash
cp .env.example .env
```

Preencha o `.env`:

```env
DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"
AUTH_SECRET="gere-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Para gerar o `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Aplique o schema no banco

```bash
npm run db:push
```

> Isso cria todas as tabelas automaticamente via Drizzle.

### 5. Popule os usuários iniciais

```bash
npm run db:seed
```

Cria o usuário padrão:
| Usuário | Senha | Admin |
|---------|-------|-------|
| anglo | tiango26## | Sim |

**Crie os demais usuários após o primeiro login** via `/configuracoes`.

### 6. Rode localmente

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

### 7. Deploy na Vercel

1. **Importe o repositório** no [vercel.com](https://vercel.com)
2. Na aba **Storage**, adicione uma integração **Neon** (ou use a URL do banco já criado)
3. Adicione as variáveis de ambiente no painel da Vercel:
   - `DATABASE_URL` — connection string do Neon
   - `AUTH_SECRET` — string aleatória segura
   - `NEXTAUTH_URL` — URL do deploy (ex: `https://ticketanglo.vercel.app`)
4. Clique em **Deploy**

Após o deploy, rode o seed uma vez via terminal local apontando para o banco de produção:
```bash
DATABASE_URL="postgresql://..." npm run db:seed
```

---

## Comandos úteis

```bash
npm run dev          # Desenvolvimento local
npm run build        # Build de produção
npm run db:push      # Aplica schema no banco (sem migrations)
npm run db:migrate   # Aplica migrations geradas pelo drizzle-kit
npm run db:studio    # Abre o Drizzle Studio (interface visual do banco)
npm run db:seed      # Cria usuários padrão
```

## Atalhos de teclado

| Tecla | Ação |
|-------|------|
| `N` | Novo ticket |
| `K` ou `Cmd+K` | Command palette |
| `/` | Foca campo de busca |
| `Esc` | Fecha modal/palette |
| `Cmd+Enter` | Envia comentário |

## Estrutura de pastas

```
src/
├── app/                    # Páginas (App Router)
│   ├── page.tsx            # Dashboard
│   ├── kanban/             # Kanban board
│   ├── tickets/            # Lista + detalhe
│   └── configuracoes/      # Admin
├── actions/                # Server Actions (tickets, comments, users)
├── auth.ts                 # Auth.js config completa
├── auth.config.ts          # Config edge-safe (middleware)
├── components/
│   ├── ui/                 # Componentes base (shadcn-style)
│   ├── layout/             # Nav + ThemeToggle
│   ├── tickets/            # TicketForm, TicketTable, badges
│   └── kanban/             # KanbanBoard, Column, Card
├── db/
│   ├── schema.ts           # Schema Drizzle
│   ├── index.ts            # Conexão Neon
│   └── seed.ts             # Script de seed
└── middleware.ts           # Proteção de rotas (edge)
```

## Modelo de dados

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários internos (bcrypt + isAdmin) |
| `tickets` | Demandas com código `TI-0001` / `MKT-0001` |
| `comments` | Thread de comentários por ticket |
| `ticket_history` | Log de auditoria de cada alteração |
