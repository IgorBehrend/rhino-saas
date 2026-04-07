# 🦏 RHINO Machines — SaaS Platform

Plataforma SaaS de gestão de máquinas industriais, gerada a partir da planilha `Dados_Maquinas_-_RHINO.xlsx`.

---

## 🧱 Stack

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Frontend     | Next.js 14 (App Router) + TypeScript |
| Estilização  | TailwindCSS                         |
| Backend/DB   | Supabase (PostgreSQL + Auth + Storage) |
| API          | Server Actions (Next.js)            |
| Charts       | Recharts                            |

---

## 📁 Estrutura do Projeto

```
rhino-saas/
├── sql/
│   ├── schema.sql          ← Schema completo do Supabase
│   └── seed.sql            ← Dados iniciais da planilha
├── src/
│   ├── app/
│   │   ├── (app)/          ← Layout autenticado (sidebar)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── machines/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── production/page.tsx
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx        ← Redireciona para /dashboard
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── DashboardChart.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── machines/
│   │   │   ├── MachineTable.tsx
│   │   │   ├── MachineForm.tsx
│   │   │   └── MachineDetailClient.tsx
│   │   ├── production/
│   │   │   ├── ProductionList.tsx
│   │   │   ├── ProductionForm.tsx
│   │   │   └── ProductionTimeline.tsx
│   │   └── ui/
│   │       ├── StatCard.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── EmptyState.tsx
│   │       └── ConfirmDelete.tsx
│   ├── lib/
│   │   ├── actions/
│   │   │   ├── auth.ts
│   │   │   ├── machines.ts
│   │   │   └── production.ts
│   │   ├── supabase/
│   │   │   ├── client.ts   ← Browser client
│   │   │   └── server.ts   ← Server client
│   │   └── utils.ts
│   ├── middleware.ts        ← Auth guard + session refresh
│   └── types/index.ts      ← Todos os tipos TypeScript
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## 🚀 Como rodar localmente

### 1. Clonar e instalar dependências

```bash
# Copie os arquivos para sua pasta de projeto, então:
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **Settings → API** e copie:
   - `Project URL`
   - `anon/public` key

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 4. Criar o banco de dados

No Supabase, vá em **SQL Editor** e execute em ordem:

```sql
-- Passo 1: Execute o schema completo
-- (cole o conteúdo de sql/schema.sql)

-- Passo 2: Crie sua conta via /auth/signup na aplicação
-- Passo 3: Pegue seu user ID:
SELECT id FROM auth.users LIMIT 1;

-- Passo 4: Substitua 'YOUR-USER-UUID' no seed.sql e execute-o
-- (cole o conteúdo de sql/seed.sql)
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 🔐 Autenticação

- Registro e login via `/auth/signup` e `/auth/login`
- **Multi-tenant**: cada usuário vê **apenas suas próprias máquinas** (Row Level Security)
- Session refresh automático via middleware

---

## ✨ Funcionalidades

### Dashboard
- Cards com totais: modelos, produção, disponíveis, manutenção
- Gráfico de barras por status (Recharts)
- Alertas de divergência entre qtd. sistema vs. qtd. física
- Máquinas e ordens de produção recentes

### Máquinas (CRUD completo)
- Tabela com busca por código/nome
- Filtros por status e tipo
- Modal de criação/edição
- Exclusão com confirmação
- Badges coloridos por status:
  - 🟢 Disponível
  - 🔵 Produção
  - ⚫ Vendida
  - 🟡 Manutenção
  - 🔴 Sucateada

### Detalhes da Máquina
- Informações gerais (código, tipo, quantidades, NFs)
- Especificações técnicas (dimensões, dados elétricos, operacionais)
- Histórico de produção
- Notas com timestamp e autor

### Produção
- **Vista em Lista** com timeline expansível por ordem
- **Vista em Board** (kanban por status)
- Avanço rápido de status com 1 clique
- Alertas de atraso em dias
- 7 etapas: Aguardando → Mecânica → Elétrica → Check-List → Embalagem → Pronto → Despachado

---

## 🗄️ Schema do Banco

```
auth.users (Supabase)
    └─ profiles (full_name, role, company)

machines (code, name, type, status, qty_system, qty_physical, ...)
    ├─ specs (dimensões, dados elétricos e operacionais)
    ├─ production (etapas, responsáveis, datas, atraso calculado)
    └─ machine_notes (histórico de observações)
```

Todas as tabelas têm **Row Level Security** ativado — isolamento completo por usuário.

---

## 🚀 Deploy (Vercel)

```bash
# 1. Push para GitHub
# 2. Importe o projeto na Vercel
# 3. Configure as environment variables:
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
# 4. Deploy automático!
```

---

## 📦 Dados da Planilha Importados

| Aba da Planilha           | Destino no Banco          |
|---------------------------|---------------------------|
| Estoque Prosyst           | tabela `machines`         |
| Dimensões e Dados         | tabela `specs`            |
| Dados Montagem            | tabela `production`       |
| Potência Máquinas         | tabela `specs` (power_kw) |

---

## 🔧 Próximos Passos (Bônus)

- [ ] Upload de imagem por máquina (Supabase Storage — infra já pronta)
- [ ] Sistema de roles admin/user (coluna `role` já no schema)
- [ ] Exportar para Excel/PDF
- [ ] Notificações de atraso por email
- [ ] Integração com Prosyst via API
