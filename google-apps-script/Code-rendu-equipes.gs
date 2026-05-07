/**
 * Google Apps Script pour centraliser les réponses du questionnaire FFR et
 * produire automatiquement un rendu Google Sheets lisible par équipe.
 *
 * Deux flux sont supportés :
 * 1) Webhook doPost depuis le front existant.
 * 2) Réponses Google Forms dans un onglet contenant les colonnes
 *    "Horodateur" et "Répondant" où "Répondant" contient le payload JSON.
 */

const SHEETS = {
  raw: 'RAW_Submissions',
  teams: 'Fiches_Equipes',
  details: 'Details_Tests',
  stats: 'Stats_Zones',
  dashboard: 'Dashboard',
  formResponses: 'Form_Responses',
  rendered: 'Rendu_Equipes'
};

const FORM_RESPONSE_CONFIG = {
  timestampHeader: 'Horodateur',
  payloadHeader: 'Répondant'
};

const REPORT_THEME = {
  navy: '#0B3F7A',
  lineBlue: '#0066CC',
  red: '#FF3B30',
  white: '#FFFFFF',
  pale: '#F7F9FC'
};

const REPORT_LAYOUT = {
  firstCol: 1,
  lastCol: 10,
  labelCols: 2,
  rowHeight: 34,
  gap: 2
};

/**
 * Évite l'erreur "Script function not found: doGet" si le projet Apps
 * Script est ouvert/déployé comme application web ou si un ancien déclencheur
 * pointe vers doGet. Le rendu Sheet se lance via le menu ou les fonctions
 * genererRenduEquipes / rebuildTeamReportsFromFormResponses.
 */
function doGet() {
  return HtmlService
    .createHtmlOutput('Script Apps Script FFR installé. Ouvre le Google Sheet puis utilise le menu "Rendu équipes" pour générer le rendu.');
}

/**
 * Ajoute un menu directement dans le Google Sheet pour éviter de chercher la
 * fonction dans la liste déroulante de l'éditeur Apps Script.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Rendu équipes')
    .addItem('Générer / reconstruire le rendu', 'genererRenduEquipes')
    .addToUi();
}

/**
 * Alias court et facile à repérer dans la liste déroulante Apps Script.
 */
function genererRenduEquipes() {
  return rebuildTeamReportsFromFormResponses();
}

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
    renderTeamReports_([{ payload, timestamp, submissionId }], { append: true });

    return jsonResponse_({ ok: true, submission_id: submissionId });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

/**
 * À lancer manuellement depuis Apps Script pour reconstruire tout le rendu
 * depuis l'onglet Google Forms `Form_Responses`.
 */
function rebuildTeamReportsFromFormResponses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const submissions = readFormResponsePayloads_(ss);
  renderTeamReports_(submissions, { append: false });
  return submissions.length;
}

/**
 * Déclencheur installable possible : Extensions > Apps Script > Déclencheurs
 * puis choisir cette fonction sur "Lors de l'envoi du formulaire".
 */
function onFormSubmit(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const submission = readSubmittedPayload_(ss, e);
  if (submission) {
    renderTeamReports_([submission], { append: true });
    return;
  }
  rebuildTeamReportsFromFormResponses();
}

function readFormResponsePayloads_(ss) {
  const sh = ss.getSheetByName(SHEETS.formResponses);
  if (!sh || sh.getLastRow() < 2) return [];

  const values = sh.getDataRange().getValues();
  const headers = values[0].map(String);
  const timestampIndex = headers.indexOf(FORM_RESPONSE_CONFIG.timestampHeader);
  const payloadIndex = headers.indexOf(FORM_RESPONSE_CONFIG.payloadHeader);
  if (payloadIndex === -1) {
    throw new Error('Colonne JSON introuvable: ' + FORM_RESPONSE_CONFIG.payloadHeader);
  }

  return values.slice(1)
    .map((row, index) => buildSubmissionFromCell_(row[payloadIndex], timestampIndex >= 0 ? row[timestampIndex] : '', index + 2))
    .filter(Boolean);
}

function readSubmittedPayload_(ss, e) {
  if (!e || !e.namedValues) return null;
  const payloadCell = firstNamedValue_(e.namedValues, FORM_RESPONSE_CONFIG.payloadHeader);
  const timestamp = firstNamedValue_(e.namedValues, FORM_RESPONSE_CONFIG.timestampHeader) || new Date();
  return buildSubmissionFromCell_(payloadCell, timestamp, 'TRIGGER');
}

function buildSubmissionFromCell_(cellValue, timestamp, rowNumber) {
  const raw = String(cellValue || '').trim();
  if (!raw) return null;

  const payload = JSON.parse(raw);
  const submissionId = payload.submission_id || makeSubmissionId_(payload, timestamp, rowNumber);
  return { payload, timestamp, submissionId };
}

function makeSubmissionId_(payload, timestamp, rowNumber) {
  const stamp = timestamp instanceof Date ? timestamp.getTime() : String(timestamp || '').replace(/\D/g, '');
  return [payload.club || 'Equipe', stamp || new Date().getTime(), rowNumber].join('-');
}

function renderTeamReports_(submissions, options) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = getOrCreateSheet_(ss, SHEETS.rendered, []);
  const shouldAppend = options && options.append;

  if (!shouldAppend) {
    sh.getDataRange().breakApart();
    sh.clear();
    applyReportCanvas_(sh);
  }

  let row = shouldAppend ? Math.max(1, sh.getLastRow() + REPORT_LAYOUT.gap) : 1;
  submissions.forEach((submission) => {
    row = renderSingleTeamReport_(sh, row, submission.payload, submission.timestamp, submission.submissionId);
    row += REPORT_LAYOUT.gap;
  });

  sh.setFrozenRows(0);
  sh.activate();
}

function applyReportCanvas_(sh) {
  sh.setHiddenGridlines(true);
  sh.setColumnWidths(1, REPORT_LAYOUT.lastCol, 120);
  sh.setColumnWidth(1, 170);
  sh.setColumnWidth(2, 170);
  for (let col = 3; col <= REPORT_LAYOUT.lastCol; col += 1) {
    sh.setColumnWidth(col, 135);
  }
  sh.getRange(1, 1, Math.max(sh.getMaxRows(), 250), REPORT_LAYOUT.lastCol)
    .setBackground(REPORT_THEME.navy)
    .setFontColor(REPORT_THEME.white)
    .setFontFamily('Arial')
    .setVerticalAlignment('middle')
    .setWrap(true);
}

function renderSingleTeamReport_(sh, startRow, payload, timestamp, submissionId) {
  applyReportCanvas_(sh);
  let row = startRow;

  row = writeTeamHeader_(sh, row, payload, timestamp, submissionId);
  row = writeInfoCard_(sh, row, payload);
  row += 1;

  (payload.zones_details || []).forEach((zone) => {
    row = writeChapterTitle_(sh, row, 'ZONES ANATOMIQUES ÉVALUÉES', zone.zone || 'Zone non renseignée');
    row = writeZoneBlocks_(sh, row, zone);
    row += 1;
  });

  if (payload.globaux) {
    row = writeGlobalBlocks_(sh, row, payload.globaux);
  }

  row = writeCommonQuestions_(sh, row, payload);
  return row;
}

function writeTeamHeader_(sh, row, payload, timestamp, submissionId) {
  const range = sh.getRange(row, 1, 2, REPORT_LAYOUT.lastCol).merge();
  range
    .setValue(String(payload.club || 'Équipe sans nom').toUpperCase())
    .setFontSize(34)
    .setFontWeight('bold')
    .setFontColor(REPORT_THEME.white)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
  sh.setRowHeights(row, 2, 48);

  const meta = sh.getRange(row + 2, 1, 1, REPORT_LAYOUT.lastCol).merge();
  meta
    .setValue('Soumission : ' + submissionId + '  |  Horodateur : ' + formatDateForReport_(timestamp))
    .setFontSize(9)
    .setFontColor('#CFE4FF')
    .setHorizontalAlignment('left');

  return row + 4;
}

function writeInfoCard_(sh, row, payload) {
  const range = sh.getRange(row, 2, 5, 8).merge();
  range
    .setBackground(REPORT_THEME.white)
    .setFontColor(REPORT_THEME.navy)
    .setBorder(true, true, true, true, false, false, REPORT_THEME.red, SpreadsheetApp.BorderStyle.SOLID_THICK)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  const prep = personName_(payload.preparateur);
  const kine = personName_(payload.kine);
  range.setValue([
    'Information sur la structure',
    '',
    'Niveau de compétition : ' + valueOrDash_(payload.niveau),
    'Kinésithérapeute : ' + valueOrDash_(kine),
    'Préparateur Physique : ' + valueOrDash_(prep)
  ].join('\n'));
  range.setFontSize(13).setFontWeight('bold');
  sh.setRowHeights(row, 5, 38);
  return row + 6;
}

function writeChapterTitle_(sh, row, title, subtitle) {
  const titleRange = sh.getRange(row, 1, 2, REPORT_LAYOUT.lastCol).merge();
  titleRange
    .setValue(title)
    .setFontSize(32)
    .setFontWeight('bold')
    .setFontColor(REPORT_THEME.white)
    .setHorizontalAlignment('left');
  sh.setRowHeights(row, 2, 44);

  const subRange = sh.getRange(row + 2, 1, 1, 5).merge();
  subRange
    .setValue(subtitle)
    .setBackground(REPORT_THEME.white)
    .setFontColor(REPORT_THEME.navy)
    .setFontSize(18)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBorder(true, false, true, true, false, false, REPORT_THEME.red, SpreadsheetApp.BorderStyle.SOLID_THICK);
  sh.setRowHeight(row + 2, 38);
  return row + 4;
}

function writeZoneBlocks_(sh, row, zone) {
  if ((zone.force || []).length) {
    row = writeTypedItemTable_(sh, row, 'Force', 'Mouvements', zone.force, ['Moment', 'Outils', 'Tests', 'Paramètres', 'Critère d’évaluations', 'Vitesses isocinétisme', 'Modes isocinétisme'], forceValueForRow_);
  }
  if ((zone.mobilite || []).length) {
    row = writeTypedItemTable_(sh, row, 'Mobilité', 'Mouvements', zone.mobilite, ['Moment', 'Outils', 'Critère d’évaluations'], mobilityValueForRow_);
  }

  row = writeArrayTypeBlock_(sh, row, 'Proprioception', zone.proprio || zone.proprioception_equilibre, ['Moment', 'Tests', 'Critère d’évaluations']);
  row = writeArrayTypeBlock_(sh, row, 'Questionnaire', zone.questionnaires, ['Moment', 'Questionnaire']);
  row = writeArrayTypeBlock_(sh, row, 'Test de cognition', zone.cognition, ['Moment', 'Tests']);
  row = writeArrayTypeBlock_(sh, row, 'Test oculaire', zone.test_oculaire, ['Moment', 'Données']);
  row = writeArrayTypeBlock_(sh, row, 'Test vestibulaire', zone.test_vestibulaire, ['Moment', 'Données']);
  row = writeArrayTypeBlock_(sh, row, 'Autres données', zone.autres_donnees, ['Moment', 'Données']);

  return row;
}

function writeGlobalBlocks_(sh, row, globaux) {
  const configs = [
    { key: 'sauts', label: 'Test de saut', firstHeader: 'Saut' },
    { key: 'course', label: 'Test de course', firstHeader: 'Course' },
    { key: 'mi', label: 'Test global MI', firstHeader: 'Tests' },
    { key: 'ms', label: 'Test global MS', firstHeader: 'Test' }
  ];

  configs.forEach((cfg) => {
    const block = globaux[cfg.key];
    if (!block || block.fait !== 'Oui') return;
    row = writeChapterTitle_(sh, row, 'EVALUATIONS TRANSVERSALES', cfg.label);
    row = writeGlobalDetailTable_(sh, row, cfg.firstHeader, block.details_par_test || []);
  });

  if (globaux.combat && globaux.combat.fait === 'Oui') {
    row = writeChapterTitle_(sh, row, 'EVALUATIONS TRANSVERSALES', 'Test combat');
    row = writeSimpleTwoColumnTable_(sh, row, 'Test combat', [
      ['Test', 'Oui'],
      ['Moment', 'Retour au jeu']
    ]);
  }
  return row;
}

function writeTypedItemTable_(sh, row, sectionLabel, firstHeader, items, rowLabels, valueGetter) {
  const tableStartCol = 3;
  const maxItemsPerTable = REPORT_LAYOUT.lastCol - tableStartCol;
  const chunks = chunkItems_(items.length ? items : [{}], maxItemsPerTable);

  chunks.forEach((chunk, chunkIndex) => {
    const tableCols = chunk.length + 1;
    const tableRows = rowLabels.length + 1;
    const label = chunkIndex === 0 ? sectionLabel : sectionLabel + ' (suite)';

    writeSideLabel_(sh, row, tableRows, label);
    const range = sh.getRange(row, tableStartCol, tableRows, tableCols);
    range.setBackground(REPORT_THEME.navy).setFontColor(REPORT_THEME.white).setBorder(true, true, true, true, true, true, REPORT_THEME.lineBlue, SpreadsheetApp.BorderStyle.SOLID_THICK);

    sh.getRange(row, tableStartCol).setValue(firstHeader).setFontWeight('bold').setHorizontalAlignment('left');
    chunk.forEach((item, index) => {
      sh.getRange(row, tableStartCol + index + 1).setValue(item.mouvement || item.test || 'Item').setFontWeight('bold').setHorizontalAlignment('center');
    });

    rowLabels.forEach((labelText, labelIndex) => {
      const currentRow = row + labelIndex + 1;
      sh.getRange(currentRow, tableStartCol).setValue(labelText).setFontWeight('bold').setHorizontalAlignment('left');
      chunk.forEach((item, itemIndex) => {
        sh.getRange(currentRow, tableStartCol + itemIndex + 1)
          .setValue(valueGetter(item, labelText))
          .setHorizontalAlignment('center');
      });
    });

    sh.setRowHeights(row, tableRows, REPORT_LAYOUT.rowHeight);
    row += tableRows + 2;
  });

  return row;
}

function writeArrayTypeBlock_(sh, row, sectionLabel, rawItems, labels) {
  const items = normalizeArrayItems_(rawItems);
  if (!items.length) return row;

  const values = labels.map((label, index) => [label, arrayValueForIndex_(items, index, labels.length)]);
  return writeSimpleTwoColumnTable_(sh, row, sectionLabel, values);
}

function writeGlobalDetailTable_(sh, row, firstHeader, details) {
  if (!details.length) return row;
  return writeTypedItemTable_(sh, row, '', firstHeader, details, ['Moment', 'Outils', 'Paramètres', 'Critère d’évaluations'], globalValueForRow_);
}

function writeSimpleTwoColumnTable_(sh, row, sectionLabel, rows) {
  const tableStartCol = 4;
  const tableCols = 5;
  const tableRows = rows.length;
  writeSideLabel_(sh, row, tableRows, sectionLabel);

  const range = sh.getRange(row, tableStartCol, tableRows, tableCols);
  range.setBackground(REPORT_THEME.navy).setFontColor(REPORT_THEME.white).setBorder(true, true, true, true, true, true, REPORT_THEME.lineBlue, SpreadsheetApp.BorderStyle.SOLID_THICK);
  rows.forEach((line, index) => {
    sh.getRange(row + index, tableStartCol, 1, 2).merge().setValue(line[0]).setFontWeight('bold').setHorizontalAlignment('left');
    sh.getRange(row + index, tableStartCol + 2, 1, tableCols - 2).merge().setValue(line[1]).setHorizontalAlignment('center');
  });
  sh.setRowHeights(row, tableRows, REPORT_LAYOUT.rowHeight);
  return row + tableRows + 2;
}

function writeCommonQuestions_(sh, row, payload) {
  row = writeChapterTitle_(sh, row, 'QUESTIONS COMMUNES', 'Limites et barrières');
  return writeSimpleTwoColumnTable_(sh, row, 'Questions communes', [
    ['Limites / Barrières', joinList_(payload.barrieres)],
    ['Guide les choix', joinList_([].concat(payload.raisons || [], payload.raisons_autre || []))]
  ]);
}

function writeSideLabel_(sh, row, tableRows, label) {
  if (!label) return;
  const range = sh.getRange(row, 1, tableRows, 2).merge();
  range
    .setValue(label)
    .setBackground(REPORT_THEME.navy)
    .setFontColor(REPORT_THEME.red)
    .setFontSize(18)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
}

function forceValueForRow_(item, label) {
  if (label === 'Moment') return joinList_(item.moments);
  if (label === 'Outils') return joinList_(item.outils);
  if (label === 'Tests') return joinList_(item.tests);
  if (label === 'Paramètres') return joinList_(item.params);
  if (label === 'Critère d’évaluations') return joinList_(item.criteres);
  if (label === 'Vitesses isocinétisme') return joinList_(item.isoVitesses);
  if (label === 'Modes isocinétisme') return joinList_(item.isoModes);
  return '';
}

function mobilityValueForRow_(item, label) {
  if (label === 'Moment') return joinList_(item.moments);
  if (label === 'Outils') return joinList_(item.outils);
  if (label === 'Critère d’évaluations') return joinList_(item.criteres);
  return '';
}

function globalValueForRow_(item, label) {
  if (label === 'Moment') return joinList_(item.moments);
  if (label === 'Outils') return joinList_(item.outils);
  if (label === 'Paramètres') return joinList_(item.params);
  if (label === 'Critère d’évaluations') return joinList_(item.criteres);
  return '';
}

function chunkItems_(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function normalizeArrayItems_(rawItems) {
  if (!rawItems) return [];
  if (Array.isArray(rawItems)) return rawItems.filter((item) => String(item || '').trim() !== '');
  return [rawItems];
}

function arrayValueForIndex_(items, index, labelCount) {
  if (!items.length) return '-';
  if (labelCount === 2 && index === 1) return joinList_(items.slice(1));
  if (index === labelCount - 1 && items.length > labelCount) return joinList_(items.slice(index));
  return valueOrDash_(items[index]);
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
    if (SHEETS[k] === SHEETS.rendered) return;
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
  if (headers.length && sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

function personName_(person) {
  if (!person) return '';
  return [person.prenom || '', person.nom || ''].join(' ').trim();
}

function joinList_(items) {
  const normalized = normalizeArrayItems_(items).map((item) => String(item || '').trim()).filter(Boolean);
  return normalized.length ? normalized.join('\n') : '-';
}

function valueOrDash_(value) {
  const text = String(value || '').trim();
  return text || '-';
}

function firstNamedValue_(namedValues, key) {
  const value = namedValues[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDateForReport_(value) {
  if (!value) return '-';
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  }
  return String(value);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
