// ============================================================
//  Supabase → Google Sheets  (Registro de Treino)
//  Cole este script no Apps Script do seu Google Sheets
//  Menu: Extensões > Apps Script
// ============================================================

// ► PREENCHA AQUI com seus dados do Supabase
const SUPABASE_URL  = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_KEY  = 'SUA-ANON-KEY'; // Settings > API > anon public

// IDs dos usuários (copie do seu código)
const USERS = {
  'Rafael':  '11111111-1111-1111-1111-111111111111',
  'Clarice': '22222222-2222-2222-2222-222222222222',
};

// ============================================================
//  FUNÇÃO PRINCIPAL — rode esta para sincronizar tudo
// ============================================================
function syncAll() {
  syncWorkouts();
  syncBodyRecords();
  syncWaterLogs();
  syncChecklist();
  syncPoints();
  Logger.log('✅ Sincronização concluída: ' + new Date());
}

// ============================================================
//  TREINOS
// ============================================================
function syncWorkouts() {
  const data = fetchAll('workout_logs', 'logged_at');
  if (!data.length) return;

  const headers = ['ID', 'Usuário', 'Plano', 'Data', 'Duração (min)', 'Observações'];
  const rows = data.map(r => [
    r.id,
    nameById(r.user_id),
    r.plan_name || '',
    fmtDate(r.logged_at),
    r.duration_min || '',
    r.notes || '',
  ]);

  writeSheet('Treinos', headers, rows);
}

// ============================================================
//  MEDIÇÕES CORPORAIS
// ============================================================
function syncBodyRecords() {
  const data = fetchAll('body_records', 'recorded_at');
  if (!data.length) return;

  const headers = ['ID', 'Usuário', 'Data', 'Peso (kg)', 'Gordura (%)', 'Cintura (cm)', 'Peito (cm)', 'Quadril (cm)', 'Bíceps (cm)', 'Observações'];
  const rows = data.map(r => [
    r.id,
    nameById(r.user_id),
    fmtDate(r.recorded_at),
    r.weight_kg   || '',
    r.body_fat_pct|| '',
    r.waist_cm    || '',
    r.chest_cm    || '',
    r.hip_cm      || '',
    r.bicep_cm    || '',
    r.notes       || '',
  ]);

  writeSheet('Medições', headers, rows);
}

// ============================================================
//  HIDRATAÇÃO
// ============================================================
function syncWaterLogs() {
  const data = fetchAll('water_logs', 'logged_at');
  if (!data.length) return;

  const headers = ['ID', 'Usuário', 'Data', 'Hora', 'Quantidade (ml)'];
  const rows = data.map(r => [
    r.id,
    nameById(r.user_id),
    fmtDate(r.logged_at),
    fmtTime(r.logged_at),
    r.amount_ml || '',
  ]);

  writeSheet('Hidratação', headers, rows);
}

// ============================================================
//  HÁBITOS (CHECKLIST)
// ============================================================
function syncChecklist() {
  const data = fetchAll('daily_checklist', 'date');
  if (!data.length) return;

  const headers = ['ID', 'Usuário', 'Data', 'Hábito', 'Concluído'];
  const rows = data.map(r => [
    r.id,
    nameById(r.user_id),
    fmtDate(r.date || r.created_at),
    r.label || r.title || '',
    r.done ? 'Sim' : 'Não',
  ]);

  writeSheet('Hábitos', headers, rows);
}

// ============================================================
//  PONTOS / RANKING
// ============================================================
function syncPoints() {
  const data = fetchAll('points', 'earned_at');
  if (!data.length) return;

  const headers = ['ID', 'Usuário', 'Data', 'Ação', 'Descrição', 'Pontos'];
  const rows = data.map(r => [
    r.id,
    nameById(r.user_id),
    fmtDate(r.earned_at),
    r.action      || '',
    r.description || '',
    r.points      || 0,
  ]);

  writeSheet('Pontos', headers, rows);

  // Aba extra: total por usuário (útil no Looker)
  const totals = {};
  Object.keys(USERS).forEach(name => totals[name] = 0);
  data.forEach(r => {
    const name = nameById(r.user_id);
    if (name !== '?') totals[name] = (totals[name] || 0) + (r.points || 0);
  });

  const rankHeaders = ['Usuário', 'Total de Pontos'];
  const rankRows = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([n, p]) => [n, p]);
  writeSheet('Ranking', rankHeaders, rankRows);
}

// ============================================================
//  UTILITÁRIOS
// ============================================================

function fetchAll(table, orderCol) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?order=${orderCol}.desc&limit=1000`;
  const options = {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
    muteHttpExceptions: true,
  };
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log('Erro em ' + table + ': ' + response.getContentText());
    return [];
  }
  return JSON.parse(response.getContentText());
}

function writeSheet(name, headers, rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  sheet.clearContents();

  // Cabeçalho
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1a2535')
    .setFontColor('#ffffff');

  // Dados
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  // Auto-resize
  sheet.autoResizeColumns(1, headers.length);

  Logger.log(`📋 ${name}: ${rows.length} registros`);
}

function nameById(userId) {
  const entry = Object.entries(USERS).find(([, id]) => id === userId);
  return entry ? entry[0] : '?';
}

function fmtDate(iso) {
  if (!iso) return '';
  return Utilities.formatDate(new Date(iso), 'America/Sao_Paulo', 'dd/MM/yyyy');
}

function fmtTime(iso) {
  if (!iso) return '';
  return Utilities.formatDate(new Date(iso), 'America/Sao_Paulo', 'HH:mm');
}

// ============================================================
//  GATILHO AUTOMÁTICO — rode uma vez para agendar
// ============================================================
function criarGatilhoAutomatico() {
  // Apaga gatilhos existentes para evitar duplicatas
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // Sincroniza a cada 6 horas
  ScriptApp.newTrigger('syncAll')
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log('⏰ Gatilho criado: sincronização a cada 6 horas');
}
