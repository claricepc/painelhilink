# FitDuo 💪

App de treino e gamificação para Rafael e Clarice.

## Stack
- React 18 + Create React App
- Supabase (PostgreSQL)
- Vercel (deploy)
- PWA (instalável no celular)

## Módulos
| Módulo | Pontos |
|--------|--------|
| 🏋️ Treinos — registrar sessão | +50pts |
| 📊 Evolução — medição corporal | +15pts |
| 💧 Água — atingir meta diária (2,5L) | +20pts |
| ✅ Checklist — cada hábito concluído | +10pts |
| 🏆 Ranking — placar Rafael vs Clarice | — |

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo de variáveis
cp .env.example .env.local
# Preencher com URL e Anon Key do Supabase

# 3. Executar supabase-schema.sql no SQL Editor do Supabase

# 4. Rodar em desenvolvimento
npm start
```

## Variáveis de ambiente

```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

Adicionar essas variáveis também no painel do Vercel (Project Settings > Environment Variables).

## Usuários fixos

| Nome | ID |
|------|----|
| Rafael | `11111111-1111-1111-1111-111111111111` |
| Clarice | `22222222-2222-2222-2222-222222222222` |
