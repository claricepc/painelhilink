# Como conectar Supabase → Google Sheets → Looker Studio

## PASSO 1 — Criar o Google Sheets

1. Acesse https://sheets.google.com
2. Crie uma planilha nova
3. Dê o nome: **Registro de Treino - Dados**

---

## PASSO 2 — Abrir o Apps Script

1. No Sheets: menu **Extensões > Apps Script**
2. Apague o código que aparece (function myFunction...)
3. Cole todo o conteúdo do arquivo `supabase-to-sheets.gs`

---

## PASSO 3 — Preencher suas credenciais

No topo do script, preencha:

```js
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_KEY = 'SUA-ANON-KEY';
```

**Onde encontrar:**
- Acesse https://supabase.com > seu projeto
- Menu lateral: **Settings > API**
- `SUPABASE_URL` = campo "Project URL"
- `SUPABASE_KEY` = campo "anon public" (em Project API Keys)

---

## PASSO 4 — Rodar pela primeira vez

1. No Apps Script, selecione a função `syncAll` no menu suspenso
2. Clique em **Executar** (▶)
3. Autorize as permissões quando solicitado
4. Volte para o Sheets e veja as abas criadas:
   - Treinos
   - Medições
   - Hidratação
   - Hábitos
   - Pontos
   - Ranking

---

## PASSO 5 — Agendar atualização automática

1. No Apps Script, selecione a função `criarGatilhoAutomatico`
2. Clique em **Executar**
3. Pronto! Os dados serão atualizados a cada 6 horas automaticamente

---

## PASSO 6 — Conectar ao Looker Studio

1. Acesse https://lookerstudio.google.com
2. Clique em **Criar > Relatório**
3. Escolha a fonte: **Google Sheets**
4. Selecione sua planilha **Registro de Treino - Dados**
5. Escolha a aba que quer usar (ex: Ranking, Treinos)
6. Clique em **Adicionar**

### Gráficos sugeridos no Looker Studio:

| Aba | Gráfico | Campos |
|-----|---------|--------|
| Treinos | Gráfico de barras por semana | Data + contagem |
| Medições | Gráfico de linha | Data + Peso |
| Hidratação | Scorecards por dia | Data + ml |
| Ranking | Gráfico de pizza | Usuário + Pontos |
| Pontos | Linha do tempo | Data + Pontos acumulados |

---

## Resultado final

```
App (Rafael/Clarice registram) 
        ↓ (a cada 6h)
  Google Sheets (dados limpos)
        ↓
  Looker Studio (dashboard de BI)
```
