/**
 * Web App Google Apps Script pour centraliser et structurer les réponses
 * du questionnaire en plusieurs onglets exploitables directement.
 */

const SHEETS = {
  raw: 'RAW_Submissions',
  teams: 'Fiches_Equipes',
  details: 'Details_Tests',
  stats: 'Stats_Zones',
  dashboard: 'Dashboard'
};

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const shRaw = getOrCreateSheet_(ss, SHEETS.raw, [
      'timestamp', 'submission_id', 'club', 'niveau', 'prep_nom', 'prep_prenom', 'kine_nom', 'kine_prenom', 'json_payload'
    ]);

    const shTeams = getOrCreateSheet_(ss, SHEETS.teams, [
      'submission_id', 'timestamp', 'club', 'niveau', 'preparateur', 'kine', 'zones_selectionnees', 'barrieres', 'raisons'
    ]);

    const shDetails = getOrCreateSheet_(ss, SHEETS.details, [
      'submission_id', 'timestamp', 'club', 'niveau', 'zone', 'type_test', 'moments', 'details'
    ]);

    const timestamp = new Date();
    const submissionId = payload.submission_id || ('SUB-' + new Date().getTime());
    const prepNom = (payload.preparateur && payload.preparateur.nom) || '';
    const prepPrenom = (payload.preparateur && payload.preparateur.prenom) || '';
    const kineNom = (payload.kine && payload.kine.nom) || '';
    const kinePrenom = (payload.kine && payload.kine.prenom) || '';

    shRaw.appendRow([
      timestamp,
      submissionId,
      payload.club || '',
      payload.niveau || '',
      prepNom,
      prepPrenom,
      kineNom,
      kinePrenom,
      JSON.stringify(payload)
    ]);

    shTeams.appendRow([
      submissionId,
      timestamp,
      payload.club || '',
      payload.niveau || '',
      [prepNom, prepPrenom].join(' ').trim(),
      [kineNom, kinePrenom].join(' ').trim(),
      (payload.zones || []).join(', '),
      (payload.barrieres || []).join(', '),
      (payload.raisons || []).join(', ')
    ]);

    const rows = buildDetailRows_(payload, submissionId, timestamp);
    if (rows.length) {
      shDetails.getRange(shDetails.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }

    refreshStats_(ss);
    styleAllSheets_(ss);

    return jsonResponse_({ ok: true, submission_id: submissionId });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function buildDetailRows_(payload, submissionId, timestamp) {
  const rows = [];
  const zones = payload.zones_details || [];

  zones.forEach((z) => {
    const moments = (z.moments || []).join(' / ');
    const zone = z.zone || '';

    pushTypeRows_(rows, payload, submissionId, timestamp, zone, 'Force', z.force, moments);
    pushTypeRows_(rows, payload, submissionId, timestamp, zone, 'Mobilité', z.mobilite, moments);
    pushArrayRows_(rows, payload, submissionId, timestamp, zone, 'Proprioception / Équilibre', z.proprio, moments);
    pushArrayRows_(rows, payload, submissionId, timestamp, zone, 'Questionnaires', z.questionnaires, moments);
    pushArrayRows_(rows, payload, submissionId, timestamp, zone, 'Test de cognition', z.cognition, moments);
    pushArrayRows_(rows, payload, submissionId, timestamp, zone, 'Test oculaire', z.test_oculaire, moments);
    pushArrayRows_(rows, payload, submissionId, timestamp, zone, 'Test vestibulaire', z.test_vestibulaire, moments);
    pushArrayRows_(rows, payload, submissionId, timestamp, zone, 'Autres données', z.autres_donnees, moments);
  });

  return rows;
}

function pushTypeRows_(rows, payload, submissionId, timestamp, zone, type, items, moments) {
  (items || []).forEach((it) => {
    rows.push([
      submissionId,
      timestamp,
      payload.club || '',
      payload.niveau || '',
      zone,
      type,
      moments,
      JSON.stringify(it)
    ]);
  });
}

function pushArrayRows_(rows, payload, submissionId, timestamp, zone, type, items, moments) {
  (items || []).forEach((it) => {
    rows.push([
      submissionId,
      timestamp,
      payload.club || '',
      payload.niveau || '',
      zone,
      type,
      moments,
      String(it)
    ]);
  });
}

function refreshStats_(ss) {
  const shDetails = ss.getSheetByName(SHEETS.details);
  const shStats = getOrCreateSheet_(ss, SHEETS.stats, [
    'zone', 'type_test', 'nb_occurrences', '%_sur_total_zone'
  ]);

  const last = shDetails.getLastRow();
  shStats.getRange(2, 1, Math.max(0, shStats.getLastRow() - 1), 4).clearContent();
  if (last < 2) return;

  const values = shDetails.getRange(2, 1, last - 1, 8).getValues();
  const byZoneType = {};
  const byZone = {};

  values.forEach((r) => {
    const zone = r[4] || '';
    const type = r[5] || '';
    if (!zone || !type) return;

    const key = zone + '||' + type;
    byZoneType[key] = (byZoneType[key] || 0) + 1;
    byZone[zone] = (byZone[zone] || 0) + 1;
  });

  const rows = Object.keys(byZoneType)
    .map((k) => {
      const parts = k.split('||');
      const zone = parts[0];
      const type = parts[1];
      const occ = byZoneType[k];
      const pct = byZone[zone] ? occ / byZone[zone] : 0;
      return [zone, type, occ, pct];
    })
    .sort((a, b) => (a[0] === b[0] ? b[2] - a[2] : a[0].localeCompare(b[0])));

  if (rows.length) {
    shStats.getRange(2, 1, rows.length, 4).setValues(rows);
    shStats.getRange(2, 4, rows.length, 1).setNumberFormat('0.00%');
  }

  refreshDashboard_(ss);
}

function refreshDashboard_(ss) {
  const sh = getOrCreateSheet_(ss, SHEETS.dashboard, [
    'Tableau de bord', 'Valeur'
  ]);

  sh.clear();
  sh.getRange('A1:B1').setValues([['Indicateur', 'Valeur']]);
  sh.getRange('A2:B2').setValues([['Nombre total de fiches équipes', '=COUNTA(Fiches_Equipes!A:A)-1']]);
  sh.getRange('A3:B3').setValues([['Nombre total de lignes de détails tests', '=COUNTA(Details_Tests!A:A)-1']]);
  sh.getRange('A4:B4').setValues([['Nombre de zones distinctes', '=COUNTA(UNIQUE(Stats_Zones!A2:A))']]);
  sh.getRange('A6').setValue('Stats détaillées: voir onglet "Stats_Zones"');

  sh.getRange('A1:B1').setFontWeight('bold').setBackground('#EDE7F6');
  sh.autoResizeColumns(1, 2);
}

function styleAllSheets_(ss) {
  Object.keys(SHEETS).forEach((k) => {
    const sh = ss.getSheetByName(SHEETS[k]);
    if (!sh) return;
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, sh.getMaxColumns()).setFontWeight('bold').setBackground('#F3E5F5');
    sh.autoResizeColumns(1, Math.min(sh.getLastColumn(), 12));
  });
}

function getOrCreateSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
