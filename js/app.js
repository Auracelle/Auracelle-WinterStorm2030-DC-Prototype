// v6.3 — UNIVERSAL TOOLTIP ENGINE
// One fixed-position tooltip appended to <body>, driven by data-tip="..." attributes
// anywhere in the page. Being a body-level, position:fixed element (not a descendant of
// any scrollable container) means it can never be clipped by an ancestor's overflow —
// which is exactly what was hiding the nav-tab tooltips under .nav's overflow-x:auto.
(function initGlobalTooltip(){
  const tip = document.createElement('div');
  tip.id = 'globalTooltip';
  document.body.appendChild(tip);
  let currentTarget = null;

  function positionTip(el){
    const r = el.getBoundingClientRect();
    tip.style.left = '0px'; tip.style.top = '0px'; // reset before measuring
    const tw = tip.offsetWidth || 320;
    const th = tip.offsetHeight || 80;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    let top = r.bottom + 10;
    if (top + th > window.innerHeight - 8) top = r.top - th - 10;
    if (top < 8) top = 8;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function showTip(el){
    const text = el.getAttribute('data-tip');
    if(!text) return;
    tip.textContent = text;
    tip.style.display = 'block';
    positionTip(el);
    currentTarget = el;
  }
  function hideTip(){
    tip.style.display = 'none';
    currentTarget = null;
  }
  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-tip]');
    if(el) showTip(el);
  });
  document.addEventListener('mouseout', e => {
    const el = e.target.closest('[data-tip]');
    if(el && (!e.relatedTarget || !el.contains(e.relatedTarget))) hideTip();
  });
  document.addEventListener('focusin', e => {
    const el = e.target.closest('[data-tip]');
    if(el) showTip(el);
  });
  document.addEventListener('focusout', hideTip);
  document.addEventListener('scroll', () => { if(currentTarget) positionTip(currentTarget); }, true);
  window.addEventListener('resize', hideTip);
})();

// v6.2 — DISRUPTIVE CAPABILITIES TEAM ACCESS CODE
// A second access code that grants a restricted view: only the tabs relevant
// to Jesse/Kelly's Disruptive Capabilities workstream are shown. Edit
// TEAM_ACCESS_CODE and TEAM_ALLOWED_TABS below to change the code or the tab
// set before sharing.
const TEAM_ACCESS_CODE = 'DisruptiveCap-2030';
const TEAM_ALLOWED_TABS = ['overview', 'capgap', 'capcards', 'govlab', 'analytics', 'tracking', 'osint'];
let restrictedTeamMode = false;

function doLogin(){
  const u=document.getElementById('loginUser').value.trim();
  const p=document.getElementById('loginPass').value.trim();
  if(u==='SAS219' && p==='WinterStorm2030!'){
    restrictedTeamMode = false;
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('landingScreen').style.display='block';
  } else if(p===TEAM_ACCESS_CODE){
    restrictedTeamMode = true;
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('landingScreen').style.display='block';
  } else { document.getElementById('loginError').style.display='block'; }
}
function enterInstrument(){
  document.getElementById('landingScreen').style.display='none';
  document.getElementById('mainHeader').style.display='flex';
  document.getElementById('mainNav').style.display='flex';
  document.getElementById('mainContent').style.display='block';
  document.getElementById('mainFooter').style.display='block';
  initApp();
  if(restrictedTeamMode) applyTeamRestriction();
}

function applyTeamRestriction(){
  document.getElementById('modeToggle').style.display = 'none';
  document.body.classList.remove('mode-dm');
  let firstAllowedBtn = null;
  document.querySelectorAll('.nav-tab').forEach(btn => {
    const t = btn.getAttribute('data-tab');
    if(TEAM_ALLOWED_TABS.includes(t)){
      if(!firstAllowedBtn) firstAllowedBtn = btn;
    } else {
      btn.style.display = 'none';
    }
  });
  const badge = document.createElement('div');
  badge.style.cssText = 'background:var(--brass);color:#000;font-family:var(--font-m);font-size:12px;letter-spacing:1px;padding:4px 14px;text-align:center;';
  badge.textContent = 'DISRUPTIVE CAPABILITIES TEAM VIEW — LIMITED TAB ACCESS';
  document.getElementById('mainNav').insertAdjacentElement('beforebegin', badge);
  if(firstAllowedBtn) showTab(firstAllowedBtn.getAttribute('data-tab'), firstAllowedBtn);
}

// ══════════════════════════════════════════════════════════
// v3.7 — OSINT FEED (GDELT Project, no LLM API, no key required)
// ══════════════════════════════════════════════════════════
let osintArticles = [];
let article4Log = [];
let calibLog = [];
let pendingConcSource = null;
let currentTheatre = 'arctic';

const THEATRE_PRESETS = {
  arctic: 'Arctic Svalbard Greenland NATO Russia',
  hormuz: 'Strait of Hormuz Iran IRGC tanker seizure',
  custom: ''
};

function onTheatreChange(){
  currentTheatre = document.getElementById('osintTheatre').value;
  if(currentTheatre !== 'custom'){
    document.getElementById('osintQuery').value = THEATRE_PRESETS[currentTheatre];
  }
}

const OSINT_FALLBACK = [
  { title:'Norway tracks unidentified vessel activity near Svalbard fishing protection zone', domain:'highnorthnews.com', seendate:'20260703T090000Z', tone:-3.2 },
  { title:'Denmark reviews Greenland infrastructure investment offers amid sovereignty debate', domain:'arctictoday.com', seendate:'20260705T140000Z', tone:-1.8 },
  { title:'NATO allies discuss undersea cable protection after Baltic incidents', domain:'reuters.com', seendate:'20260706T110000Z', tone:-4.1 },
  { title:'Finland and Sweden expand joint Arctic surveillance cooperation', domain:'defensenews.com', seendate:'20260708T083000Z', tone:2.1 },
  { title:'China-flagged research vessel logged near Northern Sea Route, draws Nordic attention', domain:'thebarentsobserver.com', seendate:'20260709T160000Z', tone:-2.6 }
];
const OSINT_FALLBACK_HORMUZ = [
  { title:'IRGC boards and briefly detains commercial tanker transiting Strait of Hormuz', domain:'reuters.com', seendate:'20260702T070000Z', tone:-6.1 },
  { title:'GPS spoofing incidents reported by multiple vessels near Hormuz shipping lanes', domain:'maritime-executive.com', seendate:'20260704T120000Z', tone:-4.4 },
  { title:'US Navy escorts flagged tankers through Strait of Hormuz amid rising tension', domain:'defensenews.com', seendate:'20260706T090000Z', tone:-3.8 },
  { title:'Iran conducts naval exercise near Strait of Hormuz, warns of closure threat', domain:'aljazeera.com', seendate:'20260708T150000Z', tone:-5.2 },
  { title:'Tanker insurance rates spike after second seizure incident near Hormuz this month', domain:'lloydslist.com', seendate:'20260710T110000Z', tone:-2.9 }
];

async function fetchOSINT(){
  const q = document.getElementById('osintQuery').value.trim() || 'Arctic Svalbard Greenland NATO Russia';
  const span = document.getElementById('osintTimespan').value;
  const theatre = currentTheatre;
  const statusEl = document.getElementById('osintStatus');
  statusEl.textContent = 'Pulling live events from GDELT…';
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&maxrecords=15&format=json&timespan=${span}`;
  try{
    const resp = await fetch(url);
    if(!resp.ok) throw new Error('non-200');
    const data = await resp.json();
    osintArticles = (data.articles || []).map(a=>({ title:a.title, domain:a.domain, seendate:a.seendate, url:a.url, tone: a.tone !== undefined ? a.tone : null, theatre }));
    if(!osintArticles.length) throw new Error('empty');
    statusEl.textContent = `Live pull — ${osintArticles.length} articles from GDELT, last ${span}, theatre: ${theatre}. No AI model involved.`;
  }catch(e){
    osintArticles = (theatre==='hormuz' ? OSINT_FALLBACK_HORMUZ : OSINT_FALLBACK).map(a=>({...a, theatre}));
    statusEl.textContent = `Live GDELT pull unavailable in this environment (network/CORS) — showing ${osintArticles.length} cached sample events (${theatre}) so the workflow below is still testable. On your own network this pulls live.`;
  }
  renderOSINTFeed();
}

function renderOSINTFeed(){
  const c = document.getElementById('osintFeed');
  if(!osintArticles.length){ c.innerHTML='<div style="color:var(--text-faint);font-family:var(--font-m);font-size: 16px;text-align:center;padding:20px;">No feed pulled yet. Click "Pull Feed" above.</div>'; return; }
  c.innerHTML = osintArticles.map((a,i)=>{
    const toneTag = a.tone===null ? '' : (a.tone < -2 ? '<span class="tag tag-flare">NEGATIVE TONE</span>' : a.tone > 2 ? '<span class="tag tag-beacon">POSITIVE TONE</span>' : '<span class="tag tag-brass">NEUTRAL</span>');
    const theatreTag = a.theatre==='hormuz' ? '<span class="tag tag-brass">HORMUZ</span>' : '<span class="tag tag-beacon">ARCTIC</span>';
    const actions = a.theatre==='hormuz'
      ? `<button class="btn btn-ghost" style="padding:6px 12px;font-size:13px;" onclick="tagAsCalibration(${i})">→ Calibration Log</button>`
      : `<button class="btn btn-ghost" style="padding:6px 12px;font-size:13px;" onclick="tagAsConcession(${i})">→ Concession</button>
        <button class="btn btn-flare" style="padding:6px 12px;font-size:13px;" onclick="tagAsArticle4(${i})">→ Article 4 Log</button>`;
    return `<div class="log-entry">
      <div class="log-time">${(a.seendate||'').slice(0,8)} — ${a.domain||'unknown source'} ${theatreTag} ${toneTag}</div>
      <div style="margin:6px 0;font-family:var(--font-b);font-size: 17px;color:var(--vellum);">${a.url ? `<a href="${a.url}" target="_blank" style="color:var(--vellum);">${a.title}</a>` : a.title}</div>
      <div class="flex-row" style="gap:8px;margin-top:6px;">${actions}</div>
    </div>`;
  }).join('');
}

function tagAsCalibration(i){
  const a = osintArticles[i];
  const violation = prompt('Grey-zone violation type for this Hormuz event? (e.g. Unsafe Interference, Unauthorized Inspection, Navigation Obstruction, Tampering, Discriminatory Access Restriction, Data Denial, Coercive Maintenance Disruption)', 'Unsafe Interference');
  if(violation===null) return;
  calibLog.unshift({ time:new Date().toLocaleTimeString(), title:a.title, domain:a.domain, url:a.url||'', violation, source:'REAL', tone:a.tone, seendate:a.seendate||'' });
  renderCalibLog();
}

function renderCalibLog(){
  document.getElementById('calibCount').textContent = `${calibLog.length} event${calibLog.length===1?'':'s'}`;
  renderCalibAnalysis();
  const c = document.getElementById('calibLog');
  if(!calibLog.length){ c.innerHTML='<div style="color:var(--text-faint);font-family:var(--font-m);font-size: 16px;text-align:center;padding:20px;">No Hormuz calibration events tagged yet. Set Theatre to "Strait of Hormuz" above and pull a feed.</div>'; return; }
  c.innerHTML = calibLog.map(e=>`<div class="log-entry">
      <div class="log-time">${e.time} — ${e.domain} — <span class="tag tag-brass">${e.violation}</span>${provBadge(e.source)}</div>
      <div style="margin:5px 0;font-family:var(--font-b);font-size: 17px;color:var(--vellum);">${e.url ? `<a href="${e.url}" target="_blank" style="color:var(--vellum);">${e.title}</a>` : e.title}</div>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════════
// v3.12 — AUTOMATIC CALIBRATION ANALYSIS
// Runs automatically every time an event is tagged — no button to press.
// Honest scope: this analyzes what the tool actually has (GDELT tone +
// real timestamps + violation taxonomy). It does NOT track tanker
// rerouting or insurance rates — those need AIS/Lloyd's-type data feeds
// this build deliberately doesn't call. Labeled as a tone/frequency
// proxy for escalation timing, not a claim of tracking those directly.
// ══════════════════════════════════════════════════════════
function renderCalibAnalysis(){
  const el = document.getElementById('calibAnalysis');
  if(!el) return;
  if(calibLog.length < 2){
    el.innerHTML = `<div style="color:var(--text-faint);font-family:var(--font-m);font-size: 15px;">Tag at least 2 Hormuz events to generate an automatic trend read.</div>`;
    return;
  }
  // chronological order by real GDELT seendate where available
  const sorted = [...calibLog].filter(e=>e.seendate).sort((a,b)=>a.seendate.localeCompare(b.seendate));
  const withTone = sorted.filter(e=>e.tone!==null && e.tone!==undefined);

  // violation-type distribution
  const dist = {};
  calibLog.forEach(e=>{ dist[e.violation] = (dist[e.violation]||0)+1; });
  const distStr = Object.entries(dist).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} (${v})`).join(' · ');

  // escalation/de-escalation proxy: compare mean tone of earlier half vs later half
  let trendHtml = 'Not enough dated/tone-scored events for a trend read yet.';
  if(withTone.length >= 2){
    const mid = Math.floor(withTone.length/2);
    const early = withTone.slice(0, Math.max(mid,1));
    const late = withTone.slice(mid);
    const avg = arr => arr.reduce((s,e)=>s+e.tone,0)/arr.length;
    const earlyAvg = avg(early), lateAvg = avg(late);
    const delta = lateAvg - earlyAvg;
    const dir = delta < -0.5 ? 'ESCALATING (tone trending more negative)' : delta > 0.5 ? 'DE-ESCALATING (tone trending less negative)' : 'STABLE (little net tone movement)';
    const dirColor = delta < -0.5 ? 'var(--flare)' : delta > 0.5 ? 'var(--beacon)' : 'var(--brass)';
    trendHtml = `<span style="color:${dirColor};font-weight:600;">${dir}</span> — mean GDELT tone moved from ${earlyAvg.toFixed(1)} to ${lateAvg.toFixed(1)} across ${withTone.length} dated/tone-scored events.`;
  }

  // event cadence: avg hours between consecutive dated events, as an escalation-velocity proxy
  let cadenceHtml = 'Not enough dated events for a cadence read yet.';
  const dated = sorted.filter(e=>e.seendate && e.seendate.length>=8);
  if(dated.length >= 2){
    const parseGdelt = s => new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.length>8?s.slice(9,11):'00'}:00:00Z`);
    let gaps = [];
    for(let i=1;i<dated.length;i++){ gaps.push((parseGdelt(dated[i].seendate) - parseGdelt(dated[i-1].seendate))/3600000); }
    const avgGap = gaps.reduce((s,g)=>s+g,0)/gaps.length;
    cadenceHtml = `Average ${avgGap.toFixed(1)} hours between consecutive tagged events (n=${dated.length}). Shorter gaps over time would suggest accelerating friction; this is a frequency proxy, not a confirmed causal escalation signal.`;
  }

  el.innerHTML = `
    <div style="margin-bottom:10px;"><span class="field-label" style="display:inline;">Violation mix</span><div style="font-size:15px;color:var(--text-dim);margin-top:4px;">${distStr}</div></div>
    <div style="margin-bottom:10px;"><span class="field-label" style="display:inline;">Tone trend (escalation/de-escalation proxy)</span><div style="font-size:15px;margin-top:4px;">${trendHtml}</div></div>
    <div><span class="field-label" style="display:inline;">Event cadence (frequency proxy)</span><div style="font-size:15px;color:var(--text-dim);margin-top:4px;">${cadenceHtml}</div></div>
  `;
}

function tagAsConcession(i){
  const a = osintArticles[i];
  const actor = document.getElementById('osintActor').value;
  const type = document.getElementById('osintType').value;
  document.getElementById('triggerActor').value = actor;
  document.getElementById('triggerType').value = type;
  document.getElementById('triggerDesc').value = `[OSINT: ${a.domain}] ${a.title}`;
  pendingConcSource = 'REAL';
  triggerConcession();
  alert(`Tagged into Concession Engine as a real event: "${a.title}"`);
}

function tagAsArticle4(i){
  const a = osintArticles[i];
  article4Log.unshift({ time:new Date().toLocaleTimeString(), title:a.title, domain:a.domain, url:a.url||'', turn:SESSION.turn, source:'REAL', sortTs:Date.now() });
  renderArticle4Log();
  renderEvidenceLedger();
  logAction('human', `Article 4 tag — ${a.title}`);
  addGapEvent('Article 4 Stress Test', a.domain||'OSINT', 0, false);
}

function renderArticle4Log(){
  document.getElementById('article4Count').textContent = `${article4Log.length} event${article4Log.length===1?'':'s'}`;
  const c = document.getElementById('article4Log');
  if(!article4Log.length){ c.innerHTML='<div style="color:var(--text-faint);font-family:var(--font-m);font-size: 16px;text-align:center;padding:20px;">No Article 4 events tagged yet.</div>'; return; }
  c.innerHTML = article4Log.map(e=>`<div class="log-entry escalation">
      <div class="log-time">Turn ${e.turn} — ${e.time} — ${e.domain} ${provBadge(e.source||'ANALYST')}</div>
      <div style="margin:5px 0;font-family:var(--font-b);font-size: 17px;color:var(--vellum);">${e.url ? `<a href="${e.url}" target="_blank" style="color:var(--vellum);">${e.title}</a>` : e.title}</div>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════════
// v4.0 — GOVERNANCE LAB SCORING ENGINE → GOVERNANCE ANALYTICS
// Ported from the Streamlit build's score_document(): keyword-overlap Coverage Score
// against the Washington Treaty's 14 Articles, the grey-zone violation taxonomy, the
// Precedent Library, and the Treaty Architecture provisions. Runs entirely client-side
// on pasted (or .txt-read) text. Every scored document posts into the same Evidence
// Ledger that Article 4 tags feed, mirroring build_evidence_ledger()'s article4_log +
// govlab_docs sources. Closed Arbitration cases aren't tracked as a running list in
// this client-side build, so the Arbitration Ruling ledger row stays a static EXAMPLE.
// ══════════════════════════════════════════════════════════
const TREATY_ARTICLES = [
  {article:"Article 1", summary:"Parties settle disputes by peaceful means; refrain from the threat or use of force.", strength:"STRONG", note:"Clear peaceful-means obligation, but sets no defined grey-zone or hybrid-activity threshold."},
  {article:"Article 2", summary:"Parties contribute to peaceful/friendly international relations; economic collaboration.", strength:"WEAK", note:"Aspirational language (\"will contribute\") with no measurable trigger or enforcement mechanism.", recommendedFix:"Add a defined economic-resilience consultation mechanism — modeled on the Energy Charter Treaty's expedited transit-conciliation process — so \"contribute to economic collaboration\" becomes a triggerable process, not an aspiration.", evidenceKeywords:["concession","economic","energy","narrative"]},
  {article:"Article 3", summary:"Self-help and mutual aid — maintain and develop individual/collective capacity to resist armed attack.", strength:"WEAK", note:"\"Continuous and effective self-help and mutual aid\" is undefined — no minimum capability standard or verification.", recommendedFix:"Add a standing verification body for \"continuous and effective\" self-help — modeled on the Indus Waters Treaty's Permanent Commission — replacing an undefined standard with a periodically verified capability baseline.", evidenceKeywords:["capability","cap gap","domain","infrastructure","icebreaker"]},
  {article:"Article 4", summary:"Consultation whenever territorial integrity, political independence, or security of any Party is threatened.", strength:"WEAK", note:"\"Whenever...is threatened\" sets no defined threshold, timeline, or evidentiary standard for consultation — the core interpretive gap this instrument is built to expose.", recommendedFix:"Replace \"whenever...is threatened\" with the Treaty Architecture's Annex A behavior-based Covered-Incident Catalogue as the defined trigger set, and its Dispute Resolution Sequence timelines (6hr report / 24hr Joint Assessment Team / 72hr preliminary report) as the consultation clock.", evidenceKeywords:["article 4","stress test","consultation"]},
  {article:"Article 5", summary:"Collective defense — an armed attack against one is an attack against all.", strength:"MODERATE", note:"Clear trigger (\"armed attack\") but silent on grey-zone, hybrid, or sub-threshold activity, and sets no evidentiary bar for invocation.", recommendedFix:"Add a graduated-response annex for sub-Article-5 grey-zone activity, modeled on the Treaty Architecture's own No-Aggravation/Standstill Obligation — so contested-but-below-threshold incidents have a defined track short of invoking collective defense.", evidenceKeywords:["arbitration","escalat","exploit"]},
  {article:"Article 6", summary:"Defines the geographic scope of Articles 5/6 (North America, Europe, North Atlantic area).", strength:"STRONG", note:"Geographically precise, but rigid and dated — does not address cyber, space, or seabed domains.", recommendedFix:"Amend the domain scope to explicitly cover cyber, space, and seabed/undersea infrastructure — the 1949 geographic-only definition leaves cable and pipeline tampering outside Article 6/5's scope entirely.", evidenceKeywords:["cable","pipeline","undersea","cyber","fibre","tampering"]},
  {article:"Article 7", summary:"Does not affect, and shall not be interpreted as affecting, UN Charter rights/obligations.", strength:"PROCEDURAL", note:"Clarifies relationship to the UN Charter; not a substantive trigger article."},
  {article:"Article 8", summary:"Parties will not enter international engagements conflicting with this Treaty.", strength:"PROCEDURAL", note:"Non-conflict declaration among Parties' other international engagements."},
  {article:"Article 9", summary:"Establishes the North Atlantic Council and its subsidiary bodies.", strength:"MODERATE", note:"Establishes the Council and a defence committee, but specifies no fast-track or emergency consultation timeline.", recommendedFix:"Add a standing emergency-consultation fast-track to the Council, modeled on the Boundary Waters Treaty's International Joint Commission — catching disputes before they escalate into political crises.", evidenceKeywords:["arbitration","council","consultation","joint verification"]},
  {article:"Article 10", summary:"Accession — any other European state may be invited to accede.", strength:"PROCEDURAL", note:"Accession mechanism."},
  {article:"Article 11", summary:"Ratification in accordance with constitutional processes.", strength:"PROCEDURAL", note:"Ratification mechanism."},
  {article:"Article 12", summary:"After 10 years, Parties may consult on revising the Treaty.", strength:"PROCEDURAL", note:"Review mechanism after 10 years; no standing or triggered review cadence."},
  {article:"Article 13", summary:"After 20 years, a Party may withdraw with one year's notice.", strength:"PROCEDURAL", note:"Withdrawal mechanism."},
  {article:"Article 14", summary:"Deposit of the Treaty; certified copies to signatories.", strength:"PROCEDURAL", note:"Administrative deposit clause."},
];
const GOVLAB_VIOLATION_TYPES = ["Unsafe Maneuvering or Obstruction", "Unauthorized Boarding or Inspection",
  "Navigation/Positioning Data Manipulation", "Tampering with Infrastructure or Control Systems",
  "Coercive Regulatory or Access Measures", "Denial of Emergency Response or Repair Access",
  "Cyber Intrusion or Operational Technology Attack"];
const PRECEDENT_LIBRARY = [
  {treaty:"Boundary Waters Treaty (1909, US-Canada)", focus:"Canals, dams, diversions, navigation, hydropower"},
  {treaty:"Columbia River Treaty (1961, US-Canada)", focus:"Dams, flood control, hydropower"},
  {treaty:"Treaty of Canterbury (1986, UK-France)", focus:"Channel Tunnel"},
  {treaty:"Treaty of Peace and Friendship (1984, Argentina-Chile)", focus:"Beagle Channel, southern straits, navigation"},
  {treaty:"Convention of Mannheim (1868)", focus:"Rhine navigation, ports, inland waterway rules"},
  {treaty:"Indus Waters Treaty (1960, India-Pakistan)", focus:"Dams, hydropower, river infrastructure"},
  {treaty:"UNCLOS (1982), Part XV / Annex VII", focus:"Straits, maritime access, offshore infrastructure"},
  {treaty:"Israel-Jordan Peace Treaty (1994)", focus:"Shared rivers, diversions, water infrastructure, border crossings"},
  {treaty:"Mekong Agreement (1995)", focus:"River development, dams, navigation"},
  {treaty:"Energy Charter Treaty (1994)", focus:"Pipelines, grids, cross-border energy transit"},
  {treaty:"Treaty of Washington (1871, US-UK)", focus:"Neutrality violations, fisheries access, boundary arbitration"},
];
const TREATY_ARCH_PROVISIONS = [
  {provision:"Annex A — Covered-Incident Catalogue", summary:"Behavior-based catalogue: unsafe maneuvering/obstruction, unauthorized boarding/inspection, navigation/positioning data manipulation, tampering with pipelines/cables/control systems, coercive regulatory measures, denial of emergency response, cyber intrusion."},
  {provision:"Article 5 — No-Aggravation / Standstill Obligation", summary:"Prohibits unilateral measures against a disputed asset while a case is pending."},
  {provision:"Dispute Resolution Sequence", summary:"Notice & preservation → joint technical verification → time-bounded consultation → binding arbitration."},
  {provision:"Annex C — Treaty Performance Metrics", summary:"Time from incident to notice; time from notice to joint assessment; % of cases resolved before binding arbitration; recurrence rate by violation type."},
  {provision:"Timeline Benchmarks", summary:"6 hours to report an incident; 24 hours to appoint a Joint Assessment Team; 72 hours for a preliminary safety report."},
];

function extractKeywords(str){
  return [...new Set(str.toLowerCase().replace(/\//g,' ').split(/[^a-z]+/).filter(w=>w.length>5))];
}

function scoreDocumentText(text){
  const lower = text.toLowerCase();

  const articleMatches = TREATY_ARTICLES.map(art => ({...art, hits: extractKeywords(art.summary).filter(kw=>lower.includes(kw)).length}))
    .filter(a=>a.hits>0).sort((a,b)=>b.hits-a.hits);

  const archMatches = TREATY_ARCH_PROVISIONS.map(p => ({...p, hits: extractKeywords(p.summary).filter(kw=>lower.includes(kw)).length}))
    .filter(p=>p.hits>0).sort((a,b)=>b.hits-a.hits);

  const coveredViolations = GOVLAB_VIOLATION_TYPES.filter(v => {
    const terms = v.toLowerCase().replace(/-/g,' ').split(/[^a-z]+/).filter(t=>t.length>4);
    return terms.some(t => lower.includes(t));
  });

  const precedentMatches = PRECEDENT_LIBRARY.map(p => ({...p, hits: extractKeywords(p.focus).filter(kw=>lower.includes(kw)).length}))
    .filter(p=>p.hits>0).sort((a,b)=>b.hits-a.hits);

  const coverageScore = Math.min(100, articleMatches.length*6 + coveredViolations.length*8 + precedentMatches.length*5 + archMatches.length*5);

  const gapFindings = articleMatches.slice(0,4).map(art =>
    `<strong>${art.article}</strong> <span class="tag ${art.strength==='STRONG'?'tag-beacon':art.strength==='WEAK'?'tag-flare':'tag-brass'}">${art.strength}</span> — ${art.note}${art.recommendedFix ? ` <strong style="color:var(--beacon);">Recommended fix:</strong> ${art.recommendedFix}` : ''} <em style="color:var(--text-faint);">Text-overlap only, no live event corroboration in this static build — Confidence: LOW</em>`
  );

  const recommendations = [];
  if(coveredViolations.length){
    recommendations.push(`Consider an addendum clarifying consultation triggers for: ${coveredViolations.slice(0,3).join(', ')} — categories referenced in this document but not explicitly defined as consultation-worthy under current Article 4 language.`);
  } else {
    recommendations.push('No grey-zone violation category vocabulary was detected in this text.');
  }
  recommendations.push('This static build scores against text only — no live GDELT pull or session cross-reference. Use the Streamlit build for live-event corroboration.');

  const workflow = [];
  if(coveredViolations.length){
    workflow.push({label:'Tag a corroborating OSINT event as Article 4', tab:'osint'});
    workflow.push({label:'Open the Negotiation Table to move a case toward Arbitration', tab:'concession'});
  }
  if(archMatches.length){
    workflow.push({label:'Check Treaty Performance Metrics for the matching Annex/Article', tab:'analytics'});
  }
  if(articleMatches.some(a=>a.article==='Article 4' && a.strength==='WEAK')){
    workflow.push({label:'Route this finding into the Article 4 Reform Brief (see Governance Analytics)', tab:'analytics'});
  }
  workflow.push({label:'Review this record in the Evidence Ledger', tab:'analytics'});

  return { articleMatches, archMatches, coveredViolations, precedentMatches, coverageScore, gapFindings, recommendations, workflow };
}

function handleDocSelect(e){
  const f = e.target.files && e.target.files[0];
  if(f) readDocFile(f);
  e.target.value = '';
}

function handleDocDrop(e){
  e.preventDefault();
  document.getElementById('govlabDropzone').style.borderColor = 'var(--line2)';
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if(f) readDocFile(f);
}

let lastUnreadableFile = null;
let pdfjsReady = false;
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  pdfjsReady = true;
}

async function extractPdfText(file, onProgress){
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data: buf}).promise;
  let text = '';
  let ocrPagesUsed = 0;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let pageText = content.items.map(it => it.str).join(' ').trim();

    // v6.1 — Printed/screenshotted webpages and scanned PDFs often have no
    // embedded text layer at all (each page is really just an image). Fall
    // back to in-browser OCR via Tesseract.js for any page that comes back
    // effectively empty, instead of silently giving up.
    if (pageText.length < 20 && window.Tesseract) {
      ocrPagesUsed++;
      if (onProgress) onProgress(i, pdf.numPages, true);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const result = await Tesseract.recognize(canvas, 'eng');
      pageText = (result.data.text || '').trim();
    } else if (onProgress) {
      onProgress(i, pdf.numPages, false);
    }
    text += pageText + '\n\n';
  }
  return { text: text.trim(), ocrPagesUsed, totalPages: pdf.numPages };
}

async function readDocFile(f){
  const titleField = document.getElementById('govlabTitle');
  if(!titleField.value.trim()) titleField.value = f.name.replace(/\.[^.]+$/, '');
  const fb = document.getElementById('govlabUploadFeedback');
  const name = f.name.toLowerCase();

  if(name.endsWith('.txt')){
    lastUnreadableFile = null;
    const reader = new FileReader();
    reader.onload = evt => {
      document.getElementById('govlabText').value = evt.target.result;
      fb.style.display = 'block'; fb.style.color = 'var(--beacon)';
      fb.textContent = `✓ Read "${f.name}" into the document text box below. Click Score Document.`;
    };
    reader.readAsText(f);
  } else if(name.endsWith('.pdf') && pdfjsReady){
    lastUnreadableFile = null;
    fb.style.display = 'block'; fb.style.color = 'var(--brass)';
    fb.textContent = `Extracting text from "${f.name}"…`;
    try {
      const { text, ocrPagesUsed, totalPages } = await extractPdfText(f, (page, total, ocr) => {
        fb.textContent = ocr
          ? `Page ${page} of ${total} has no text layer — running OCR in your browser (this is slower)…`
          : `Extracting text from "${f.name}" — page ${page} of ${total}…`;
      });
      if(!text){
        lastUnreadableFile = f.name;
        fb.style.color = 'var(--flare)';
        fb.textContent = `"${f.name}" produced no extractable text even with OCR (image quality too low, or blank pages) — paste its text into the box below instead.`;
      } else {
        document.getElementById('govlabText').value = text;
        fb.style.color = 'var(--beacon)';
        fb.textContent = ocrPagesUsed > 0
          ? `✓ Extracted text from "${f.name}" (${totalPages} page${totalPages===1?'':'s'}, ${ocrPagesUsed} via OCR — no text layer was present) into the box below. Runs entirely in your browser — nothing is uploaded. Check the text for OCR errors, then click Score Document.`
          : `✓ Extracted text from "${f.name}" (${totalPages} page${totalPages===1?'':'s'}) into the document text box below. Runs entirely in your browser — nothing is uploaded. Click Score Document.`;
      }
    } catch(err){
      lastUnreadableFile = f.name;
      fb.style.color = 'var(--flare)';
      document.getElementById('govlabText').focus();
      fb.textContent = `Couldn't extract text from "${f.name}" (${err.message || 'parse error'}) — paste its text into the box below instead.`;
    }
  } else if(name.endsWith('.docx') && window.mammoth){
    lastUnreadableFile = null;
    fb.style.display = 'block'; fb.style.color = 'var(--brass)';
    fb.textContent = `Extracting text from "${f.name}"…`;
    try {
      const buf = await f.arrayBuffer();
      const result = await mammoth.extractRawText({arrayBuffer: buf});
      const text = (result.value || '').trim();
      if(!text){
        lastUnreadableFile = f.name;
        fb.style.color = 'var(--flare)';
        fb.textContent = `"${f.name}" produced no extractable text — paste its text into the box below instead.`;
      } else {
        document.getElementById('govlabText').value = text;
        fb.style.color = 'var(--beacon)';
        fb.textContent = `✓ Extracted text from "${f.name}" into the document text box below. Runs entirely in your browser — nothing is uploaded. Click Score Document.`;
      }
    } catch(err){
      lastUnreadableFile = f.name;
      fb.style.color = 'var(--flare)';
      document.getElementById('govlabText').focus();
      fb.textContent = `Couldn't extract text from "${f.name}" (${err.message || 'parse error'}) — paste its text into the box below instead.`;
    }
  } else {
    lastUnreadableFile = f.name;
    fb.style.display = 'block'; fb.style.color = 'var(--flare)';
    document.getElementById('govlabText').focus();
    const reason = name.endsWith('.pdf') ? 'the PDF reader library did not load (offline, or blocked by network settings)'
      : name.endsWith('.docx') ? 'the DOCX reader library did not load (offline, or blocked by network settings)'
      : "this static build only reads .txt, .pdf, and .docx";
    fb.textContent = `"${f.name}" selected, but ${reason} — paste its text into the box below (highlighted), then click Score Document.`;
  }
}

function scoreGovlabDocument(){
  const title = (document.getElementById('govlabTitle').value || '').trim() || 'Untitled document';
  const text = document.getElementById('govlabText').value || '';
  const liveQuery = (document.getElementById('govlabLiveQuery').value || '').trim();
  const fb = document.getElementById('govlabUploadFeedback');
  if(!text.trim()){
    fb.style.display = 'block'; fb.style.color = 'var(--flare)';
    fb.textContent = lastUnreadableFile
      ? `"${lastUnreadableFile}" couldn't be read automatically (PDF/DOCX) — paste its text into the box above, then click Score Document again.`
      : 'Provide document text first — paste it into the "Document text" box above, or drop/select a .txt file (which auto-fills it), then click Score Document.';
    document.getElementById('govlabText').focus();
    return;
  }
  const result = scoreDocumentText(text);
  const doc = { id: `doc_${Date.now()}`, title, time:new Date().toLocaleTimeString(), turn:SESSION.turn, liveQuery,
    source: liveQuery ? 'CACHED' : 'ANALYST', sortTs:Date.now(), ...result };
  govlabDocs.unshift(doc);
  renderGovlabDocs();
  renderEvidenceLedger();
  renderScoreResult(doc);
  renderScoreLog();
  logAction('human', `Governance Lab — scored "${title}"`);

  fb.style.display = 'block'; fb.style.color = 'var(--beacon)';
  fb.textContent = `✓ Scored "${title}" — Coverage Score ${result.coverageScore}/100 — see Governance Analytics → Evidence Ledger.`;
}

// v6.0 — RESET FORM + SCORED DOCUMENTS LOG
function resetGovlabForm(){
  document.getElementById('govlabTitle').value = '';
  document.getElementById('govlabText').value = '';
  document.getElementById('govlabLiveQuery').value = '';
  document.getElementById('govlabScoreResult').style.display = 'none';
  document.getElementById('govlabScoreResult').innerHTML = '';
  const fb = document.getElementById('govlabUploadFeedback');
  fb.style.display = 'none'; fb.textContent = '';
  lastUnreadableFile = null;
  document.getElementById('govlabTitle').focus();
}

function renderScoreLog(){
  document.getElementById('govlabLogCount').textContent = `${govlabDocs.length} scored this session`;
  const c = document.getElementById('govlabScoreLog');
  if(!govlabDocs.length){
    c.innerHTML = '<div style="background:var(--panel);padding:18px;color:var(--text-faint);font-size:15px;text-align:center;">No documents scored yet this session.</div>';
    return;
  }
  c.innerHTML = govlabDocs.map(d => `<div style="background:var(--panel);padding:14px 18px;cursor:pointer;" onclick="reopenScoreLogEntry('${d.id}')">
      <div class="flex-between">
        <div><span class="tag tag-brass">Turn ${d.turn} — ${d.time}</span> <strong style="font-family:var(--font-d);font-size:17px;margin-left:10px;color:var(--vellum);">${d.title}</strong></div>
        <span class="tag ${d.coverageScore>=60?'tag-beacon':d.coverageScore>=30?'tag-brass':'tag-flare'}">${d.coverageScore}/100 →</span>
      </div>
    </div>`).join('');
}

function reopenScoreLogEntry(id){
  const doc = govlabDocs.find(d => d.id === id);
  if(!doc) return;
  renderScoreResult(doc);
  document.getElementById('govlabScoreResult').scrollIntoView({behavior:'smooth', block:'start'});
}

function renderScoreResult(d){
  const el = document.getElementById('govlabScoreResult');
  el.style.display = 'block';
  const scoreColor = d.coverageScore>=60 ? 'var(--beacon)' : d.coverageScore>=30 ? 'var(--brass)' : 'var(--flare)';
  el.innerHTML = `
    <div class="panel mb20" style="border-top:3px solid ${scoreColor};">
      <div class="panel-head"><div class="panel-title">Scored — ${d.title}</div><div class="panel-meta">Turn ${d.turn} — ${d.time}</div></div>
      <div class="grid-2 mb16">
        <div style="text-align:center;padding:16px 0;">
          <div style="font-family:var(--font-d);font-size:52px;font-weight:700;color:${scoreColor};">${d.coverageScore}</div>
          <div style="font-size:14px;color:var(--text-faint);letter-spacing:1px;">/ 100 <span class="info-tip" data-tip="Formula: (Article Matches × 6) + (Violation Categories × 8) + (Precedent Alignment × 5) + (Treaty Architecture × 5), capped at 100. A lexical overlap measure, not a legal or policy judgment.">COVERAGE SCORE ⓘ</span></div>
          <div style="font-size:13px;color:var(--text-faint);margin-top:8px;">Text overlap, not policy strength — a long loosely-drafted document can score higher than a short precise one.</div>
        </div>
        <div>
          <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--line2);"><span class="info-tip" style="color:var(--text-dim);" data-tip="How many of the North Atlantic Treaty's 14 Articles share vocabulary with this document. Each match is scored 6 points toward Coverage Score.">Article Matches ⓘ</span><strong style="color:var(--vellum);">${d.articleMatches.length}</strong></div>
          <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--line2);"><span class="info-tip" style="color:var(--text-dim);" data-tip="How many of the 7 grey-zone violation categories (unsafe maneuvering, cyber intrusion, tampering with infrastructure, etc.) are referenced in this document's text. Each category is scored 8 points toward Coverage Score.">Violation Categories ⓘ</span><strong style="color:var(--vellum);">${d.coveredViolations.length}</strong></div>
          <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--line2);"><span class="info-tip" style="color:var(--text-dim);" data-tip="How many of the 11 Precedent Library treaties (Boundary Waters, Indus Waters, Treaty of Washington 1871, etc.) share subject-matter vocabulary with this document. Each alignment is scored 5 points toward Coverage Score. Note: if the scored document is itself a library entry, it will trivially match itself here — read Article Matches, Violation Categories, and Treaty Architecture instead.">Precedent Alignment ⓘ</span><strong style="color:var(--vellum);">${d.precedentMatches.length}</strong></div>
          <div class="flex-between" style="padding:8px 0;"><span class="info-tip" style="color:var(--text-dim);" data-tip="How many of the 5 Treaty Architecture for Critical Maritime Infrastructure provisions (Covered-Incident Catalogue, Dispute Resolution Sequence, etc.) share vocabulary with this document. Each match is scored 5 points toward Coverage Score.">Treaty Architecture ⓘ</span><strong style="color:var(--vellum);">${d.archMatches.length}</strong></div>
        </div>
      </div>
      ${d.coveredViolations.length ? `<div class="mb16"><div class="field-label" style="margin-bottom:8px;">Grey-Zone Categories Referenced</div>${d.coveredViolations.map(v=>`<span class="tag tag-brass" style="margin:0 6px 6px 0;">${v}</span>`).join('')}</div>` : ''}
      ${d.precedentMatches.length ? `<div class="mb16"><div class="field-label" style="margin-bottom:8px;">Precedent Library Alignment</div><div style="font-size:15px;color:var(--text-dim);">${d.precedentMatches.map(p=>`${p.treaty} (${p.hits})`).join(' · ')}</div></div>` : ''}
      <div class="field-label" style="margin-bottom:8px;">Article Strength Findings — hand-authored, independent of Coverage Score</div>
      <div style="display:grid;gap:10px;margin-bottom:16px;">${d.gapFindings.map(g=>`<div style="font-size:15px;color:var(--text-dim);line-height:1.6;padding:10px 14px;background:rgba(0,0,0,.2);border-radius:6px;">${g}</div>`).join('') || '<div style="color:var(--text-faint);font-size:15px;">No Article matches found.</div>'}</div>
      <div class="field-label" style="margin-bottom:8px;">Recommendations</div>
      <div style="display:grid;gap:8px;margin-bottom:16px;">${d.recommendations.map(r=>`<div style="font-size:15px;color:var(--text-dim);">→ ${r}</div>`).join('')}</div>
      <div class="field-label" style="margin-bottom:8px;">Actionable Next Steps — Governance Outcome</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">${(d.workflow||[]).map(w=>`<button class="btn btn-ghost" onclick="showTab('${w.tab}', document.querySelector('.nav-tab[onclick*=${w.tab}]'))">${w.label} →</button>`).join('')}</div>
    </div>`;
  el.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function renderReferenceLibrary(){
  document.getElementById('refArticlesBody').innerHTML = TREATY_ARTICLES.map(a =>
    `<tr><td><strong>${a.article}</strong></td><td style="color:var(--text-dim);font-size:16px;">${a.summary}</td><td><span class="tag ${a.strength==='STRONG'?'tag-beacon':a.strength==='WEAK'?'tag-flare':'tag-brass'}">${a.strength}</span></td><td style="color:var(--text-dim);font-size:15px;">${a.recommendedFix || '—'}</td></tr>`
  ).join('');
  document.getElementById('refPrecedentBody').innerHTML = PRECEDENT_LIBRARY.map(p =>
    `<tr><td><strong>${p.treaty}</strong></td><td style="color:var(--text-dim);font-size:16px;">${p.focus}</td></tr>`
  ).join('');
  document.getElementById('refArchBody').innerHTML = TREATY_ARCH_PROVISIONS.map(p =>
    `<tr><td><strong>${p.provision}</strong></td><td style="color:var(--text-dim);font-size:16px;">${p.summary}</td></tr>`
  ).join('');
}

// ══════════════════════════════════════════════════════════
// v5.0 — END GAME → NATO TREATY 1949 SHORTCOMINGS SYNOPSIS
// Cross-references each Article's hand-authored recommendedFix against this
// session's own evidence (Article 4 Log — which already includes Arbitration
// rulings, see issueArbitrationRuling — plus the Gap Event Log and any scored
// Governance Lab documents). A recommendation only carries an evidence count
// alongside it; it's never presented as a bare assertion.
// ══════════════════════════════════════════════════════════
function endGame(){
  showTab('analytics', document.querySelector('.nav-tab[onclick*=analytics]'));
  setTimeout(showShortcomingsReport, 50);
}

function generateShortcomingsReport(){
  const evidenceText = [
    ...article4Log.map(e => `${e.title} ${e.domain}`),
    ...gapEvents.map(e => `${e.type} ${e.domain}`),
    ...govlabDocs.map(d => `${d.title} ${d.coveredViolations.join(' ')}`),
  ].join(' | ').toLowerCase();

  const candidates = TREATY_ARTICLES.filter(a => a.recommendedFix).map(a => {
    const count = a.evidenceKeywords.filter(kw => evidenceText.includes(kw.toLowerCase())).length
      + (a.article === 'Article 4' ? article4Log.filter(e => e.source !== 'ARBITRATION').length : 0)
      + (a.article === 'Article 5' ? article4Log.filter(e => e.source === 'ARBITRATION').length : 0);
    return { ...a, evidenceCount: count };
  }).sort((a,b) => b.evidenceCount - a.evidenceCount);

  return { candidates, generatedAt: new Date().toLocaleString(), turn: SESSION.turn,
    totalLogEntries: article4Log.length + gapEvents.length + govlabDocs.length };
}

function showShortcomingsReport(){
  const report = generateShortcomingsReport();
  window._lastShortcomingsReport = report;
  const el = document.getElementById('shortcomingsReport');
  document.getElementById('shortcomingsExportBtn').style.display = 'inline-block';
  el.innerHTML = `
    <div style="font-size:14px;color:var(--text-faint);margin-bottom:14px;">Generated ${report.generatedAt} — Turn ${report.turn} — ${report.totalLogEntries} session log entr${report.totalLogEntries===1?'y':'ies'} considered as evidence.</div>
    <div style="display:grid;gap:14px;">
      ${report.candidates.map(a => `
        <div style="padding:16px;background:rgba(0,0,0,.2);border-radius:6px;border-left:3px solid ${a.evidenceCount>0?'var(--flare)':'var(--line2)'};">
          <div class="flex-between mb8">
            <div><strong style="font-family:var(--font-d);font-size:18px;color:var(--vellum);">${a.article}</strong> <span class="tag ${a.strength==='STRONG'?'tag-beacon':a.strength==='WEAK'?'tag-flare':'tag-brass'}" style="margin-left:8px;">${a.strength}</span></div>
            <span class="tag ${a.evidenceCount>0?'tag-flare':''}" style="${a.evidenceCount===0?'background:transparent;border:1px solid var(--line2);color:var(--text-faint);':''}">${a.evidenceCount} session event${a.evidenceCount===1?'':'s'}</span>
          </div>
          <div style="font-size:15px;color:var(--text-dim);margin-bottom:8px;"><strong>Current text:</strong> ${a.summary}</div>
          <div style="font-size:15px;color:var(--text-dim);margin-bottom:8px;"><strong>Shortfall:</strong> ${a.note}</div>
          <div style="font-size:15px;color:var(--beacon);"><strong>Recommended change:</strong> ${a.recommendedFix}</div>
        </div>`).join('')}
    </div>
    <div style="font-size:13px;color:var(--text-faint);margin-top:14px;">Evidence counts are lexical — keyword matches against this session's Article 4 Log, Gap Event Log, and scored Governance Lab documents, not a legal judgment. Zero session events means the shortfall is still real (it's the tool's static analysis) but nothing in this session specifically tested it yet.</div>`;
  el.scrollIntoView({behavior:'smooth', block:'start'});
}

function exportShortcomingsReport(){
  const report = window._lastShortcomingsReport || generateShortcomingsReport();
  const lines = [
    '# NATO Treaty 1949 — Shortcomings & Recommended Changes',
    `Generated ${report.generatedAt} — WinterStorm2030 Turn ${report.turn}`,
    `${report.totalLogEntries} session log entries considered as evidence.`,
    '',
    ...report.candidates.flatMap(a => [
      `## ${a.article} [${a.strength}] — ${a.evidenceCount} session event(s)`,
      `**Current text:** ${a.summary}`,
      `**Shortfall:** ${a.note}`,
      `**Recommended change:** ${a.recommendedFix}`,
      '',
    ]),
  ].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lines], {type:'text/markdown'}));
  a.download = `winterstorm2030_nato1949_shortcomings_turn${report.turn}.md`;
  a.click();
}

let govlabDocs = [];

function renderGovlabDocs(){
  document.getElementById('govlabDocCount').textContent = `3 integrated · ${govlabDocs.length} scored this session`;
  const kb = document.getElementById('govlabKnowledgeBase');
  const dynamicEntries = govlabDocs.map(d => `<div style="background:var(--panel);padding:18px;">
      <div class="flex-between mb8"><div><span class="tag tag-brass">Scored // Turn ${d.turn} — ${d.time}</span> <strong style="font-family:var(--font-d);font-size: 19px;margin-left:10px;color:var(--vellum);">${d.title}</strong></div><span class="tag ${d.coverageScore>=60?'tag-beacon':d.coverageScore>=30?'tag-brass':'tag-flare'}">${d.coverageScore}/100</span></div>
      <div style="font-size: 18px;color:var(--text-dim);line-height:1.6;">${d.articleMatches.length} Article match(es), ${d.coveredViolations.length} violation categor${d.coveredViolations.length===1?'y':'ies'}, ${d.precedentMatches.length} precedent alignment(s). ${d.liveQuery ? `Live event context requested: "${d.liveQuery}" — cached placeholder, not a live pull in this static build.` : 'No live event context attached.'}</div>
    </div>`).join('');
  kb.innerHTML = dynamicEntries + `
      <div style="background:var(--panel);padding:18px;">
        <div class="flex-between mb8"><div><span class="tag tag-beacon">Treaty // 1920</span> <strong style="font-family:var(--font-d);font-size: 19px;margin-left:10px;color:var(--vellum);">Svalbard Treaty</strong></div><span class="tag tag-beacon">INTEGRATED</span></div>
        <div style="font-size: 18px;color:var(--text-dim);line-height:1.6;">Norway sovereignty + 46-state access rights including Russia. Article 9 demilitarisation creates governance ambiguity.</div>
      </div>
      <div style="background:var(--panel);padding:18px;">
        <div class="flex-between mb8"><div><span class="tag tag-brass">Treaty // 2021</span> <strong style="font-family:var(--font-d);font-size: 19px;margin-left:10px;color:var(--vellum);">CAOFA</strong></div><span class="tag tag-beacon">INTEGRATED</span></div>
        <div style="font-size: 18px;color:var(--text-dim);line-height:1.6;">5 years in force. Russia, China, US all participating. Model for narrowly scoped multilateral governance.</div>
      </div>
      <div style="background:var(--panel);padding:18px;">
        <div class="flex-between mb8"><div><span class="tag tag-flare">Institution // 2025</span> <strong style="font-family:var(--font-d);font-size: 19px;margin-left:10px;color:var(--vellum);">NATO Mainsail / CMRE</strong></div><span class="tag tag-beacon">INTEGRATED</span></div>
        <div style="font-size: 18px;color:var(--text-dim);line-height:1.6;">AI-enabled maritime domain awareness. Flags anomalous vessel trajectories near undersea infrastructure. Informs the Undersea Surveillance capability domain.</div>
      </div>`;
}

function renderEvidenceLedger(){
  const combined = [
    ...article4Log.map(e => ({ turn:e.turn, type:'Article 4 Tag', desc:e.title, source:e.domain, status:e.source||'ANALYST', sortTs:e.sortTs||0 })),
    ...govlabDocs.map(d => ({ turn:d.turn, type: d.liveQuery ? 'Governance Lab Live Query' : 'Governance Lab Document', desc: `"${d.title}" — Coverage Score ${d.coverageScore}/100${d.liveQuery ? ` — query "${d.liveQuery}"` : ''}`, source: d.liveQuery ? 'GDELT (cached)' : 'Governance Lab', status:d.source, sortTs:d.sortTs||0 })),
  ].sort((a,b) => b.sortTs - a.sortTs);

  document.getElementById('evidenceLedgerCount').textContent = `${combined.length} session-logged record${combined.length===1?'':'s'}`;
  const body = document.getElementById('evidenceLedgerBody');
  if(!combined.length){
    body.innerHTML = '<tr id="evidenceLedgerEmptyRow"><td colspan="5" style="color:var(--text-faint);text-align:center;padding:16px;">No session-logged records yet — score a document in Governance Lab, or tag an OSINT event as Article 4 on the OSINT Feed tab.</td></tr>';
    return;
  }
  body.innerHTML = combined.map(r => `<tr><td>${r.turn}</td><td>${r.type}</td><td style="color:var(--text-dim);">${r.desc}</td><td>${r.source}</td><td>${provBadge(r.status)}</td></tr>`).join('');
}

// ══════════════════════════════════════════════════════════
// v4.0 — DECISION VELOCITY (ported from Streamlit compute_decision_velocity())
// Supports the "WinterStorm2030 helps NATO act faster" positioning with a real
// number, not an assertion — derived from this session's own actionLog timestamps.
// ══════════════════════════════════════════════════════════
let actionLog = [];
function logAction(kind, label){
  actionLog.push({ts:Date.now(), kind, label});
  renderDecisionVelocity();
}
function computeDecisionVelocity(){
  const responseTimes = [];
  for(let i=0;i<actionLog.length;i++){
    if(actionLog[i].kind==='ai'){
      for(let j=i+1;j<actionLog.length;j++){
        if(actionLog[j].kind==='human'){ responseTimes.push((actionLog[j].ts-actionLog[i].ts)/1000); break; }
        if(actionLog[j].kind==='ai') break;
      }
    }
  }
  const tempos = [];
  for(let i=1;i<actionLog.length;i++) tempos.push((actionLog[i].ts-actionLog[i-1].ts)/1000);
  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
  return { avgResponse: avg(responseTimes), avgTempo: avg(tempos), nResponses: responseTimes.length, nActions: actionLog.length };
}
function formatDurationJS(sec){
  if(sec===null || sec===undefined) return '—';
  if(sec<60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec/60), s = Math.round(sec%60);
  if(m<60) return `${m}m ${s}s`;
  return `${Math.floor(m/60)}h ${m%60}m`;
}
function renderDecisionVelocity(){
  const el = document.getElementById('decisionVelocityPanel');
  if(!el) return;
  const dv = computeDecisionVelocity();
  document.getElementById('dvResponse').textContent = formatDurationJS(dv.avgResponse);
  document.getElementById('dvTempo').textContent = formatDurationJS(dv.avgTempo);
  document.getElementById('dvCount').textContent = `${dv.nResponses} of ${dv.nActions}`;
  document.getElementById('dvNote').style.display = dv.nResponses<2 ? 'block' : 'none';
}

document.getElementById('loginPass').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });

function showTab(name, el){
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  if(el) el.classList.add('active');
  document.getElementById('chartHero').style.display = (name==='overview') ? 'block' : 'none';
}

// ══════════════════════════════════════════════════════════
// v3.6 — DECISION-MAKER / DECISION-SUPPORT ROLE SPLIT
// DM: breadth — Scenario, Overview, Actors, Concession Engine, Cap Gap composite, Live Tracking
// DS: full depth — adds Cognitive Warfare, Narrative Analysis, Governance Lab, per-domain Cap Gap tools
// ══════════════════════════════════════════════════════════
let CURRENT_MODE = 'ds';
function setMode(mode){
  CURRENT_MODE = mode;
  document.body.classList.toggle('mode-dm', mode==='dm');
  document.getElementById('modeBtnDM').classList.toggle('active', mode==='dm');
  document.getElementById('modeBtnDS').classList.toggle('active', mode==='ds');
  // if a Decision-Support-only tab is active when switching to DM, fall back to Overview
  if(mode==='dm'){
    const active = document.querySelector('.tab-content.active');
    if(active && ['tab-cogwar','tab-narrative','tab-govlab','tab-capcards','tab-analytics'].includes(active.id)){
      showTab('overview', document.querySelector('.nav-tab[onclick*="overview"]'));
    }
  }
  addGapEvent('Mode Switch', mode==='dm' ? 'Decision-Maker (breadth)' : 'Decision-Support (depth)', 0, false);
}

function initApp(){ renderActorThresholds(); renderCapDomains(); recomputeMasterGap(); updateSessionBar(); initTilt(); renderGovlabDocs(); renderEvidenceLedger(); renderReferenceLibrary(); renderDecisionVelocity(); renderScoreLog(); }

// ══════════════════════════════════════════════════════════
// v3.11 — PROVENANCE TAGGING
// Every logged event carries a source: REAL (OSINT-pulled), SIMULATED (Agentic AI-
// generated), ANALYST (manually entered), or ARBITRATION (tribunal-ruled, AI-assisted).
// This is what makes the Article 4 log defensible as evidence rather than a mixed bag.
// ══════════════════════════════════════════════════════════
const PROV_STYLE = {
  REAL:        { label:'REAL — OSINT',        tag:'tag-beacon' },
  SIMULATED:   { label:'SIMULATED — AI',       tag:'tag-flare'  },
  ANALYST:     { label:'ANALYST — MANUAL',     tag:'tag-brass'  },
  ARBITRATION: { label:'ARBITRATION RULING',   tag:'tag-violet' },
  CACHED:      { label:'CACHED — NOT LIVE',    tag:'tag-brass'  }
};
function provBadge(source){
  const p = PROV_STYLE[source] || PROV_STYLE.ANALYST;
  return `<span class="tag ${p.tag}" style="margin-left:6px;">${p.label}</span>`;
}

// ══════════════════════════════════════════════════════════
// v3.9 — MOUSE-TILT PARALLAX (ported from Orion depth-effects reference)
// ══════════════════════════════════════════════════════════
function handleTilt(e){
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const px = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1..1
  const py = ((e.clientY - r.top) / r.height - 0.5) * 2;   // -1..1
  el.style.transform = `perspective(1000px) rotateX(${(-py*6).toFixed(2)}deg) rotateY(${(px*8).toFixed(2)}deg) translateZ(4px)`;
}
function resetTilt(e){
  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
}
function initTilt(){
  document.querySelectorAll('.tilt-card').forEach(el=>{
    if(el.dataset.tiltBound) return;
    el.dataset.tiltBound = '1';
    el.addEventListener('mousemove', handleTilt);
    el.addEventListener('mouseleave', resetTilt);
  });
}
// bind immediately for the login card, which exists before initApp() runs
document.addEventListener('DOMContentLoaded', initTilt);

// ══════════════════════════════════════════════════════════
// v3.4 SESSION ENGINE — shared state across all tabs
// ══════════════════════════════════════════════════════════
const SESSION = { turn:1, doctrine:'rus', winWinActive:false, treatyConcessionLogged:false };
let concessionModifier = 0;   // driven by Concession Engine (tab 03)
let narrativeModifier   = 0;  // driven by Cognitive Warfare + Narrative Analysis (tabs 04/06)
const DOCTRINE_LABEL = { rus:'🇷🇺 Narrative-First', prc:'🇨🇳 Platform-First', hybrid:'⬡ Compound Hybrid' };

function recomputeMasterGap(){
  const domainAvg = Math.round(capDomains.reduce((s,d)=>s+d.gap,0)/capDomains.length);
  const gap = Math.max(0, Math.min(100, domainAvg + concessionModifier + narrativeModifier));
  updateGap(gap);
  checkWinWinCondition(gap);
  return gap;
}

function advanceTurn(source){
  SESSION.turn++;
  updateSessionBar();
  addGapEvent('Turn Advance', source||'Session', 0, false);
}

function setDoctrine(key){
  if(!DOCTRINE_LABEL[key]) return;
  SESSION.doctrine = key;
  updateSessionBar();
}

function updateSessionBar(){
  document.getElementById('sb-turn').textContent = SESSION.turn;
  const gapEl = document.getElementById('master-gap-val');
  document.getElementById('sb-capgap').textContent = gapEl ? gapEl.textContent : '—';
  document.getElementById('sb-doctrine').textContent = DOCTRINE_LABEL[SESSION.doctrine];
}

// ══════════════════════════════════════════════════════════
// v3.5 — EXPLICIT END TURN + LIVE AGENTIC AI MOVE
// ══════════════════════════════════════════════════════════
let aiMoveLog = [];
const AI_MOVE_FALLBACK = {
  rus: [
    { title:'Maskirovka — Below-Threshold Vessel Activity', desc:'GRU-linked vessel operates without transponder near the Svalbard EEZ. Attribution deniable; timed to pre-empt Blue Team coordination.', tag:'PROBE', delta:3 },
    { title:'Article 5 Doubt Narrative', desc:'AI-generated content questioning Finnish alliance commitment circulates on Nordic-language channels. Objective: fracture solidarity before formal response.', tag:'EXPLOIT', delta:5 },
    { title:'Reflexive Control — Greenland Friction', desc:'Amplifies US–Greenland adversarial framing to widen the seam already flagged in the Actor Analysis baseline.', tag:'ESCALATE', delta:6 },
    { title:'GRU Signal Interference', desc:'Below-Article-4 signal jamming reported near the GIUK gap. Designed to test, not trigger, collective response.', tag:'PROBE', delta:2 }
  ],
  prc: [
    { title:'Dual-Use Station Activation', desc:'Research/surveillance station near the Polar Connect corridor increases data-collection posture without violating any single treaty provision.', tag:'PROBE', delta:3 },
    { title:'CAOFA Leverage Offer', desc:'Conditional scientific-cooperation support offered in exchange for data-sovereignty concessions — testing whether the moratorium can be repriced.', tag:'EXPLOIT', delta:4 },
    { title:'Platform-Scale Influence Push', desc:'Coordinated content targeting Greenlandic independence sentiment, framed as economic opportunity rather than security narrative.', tag:'ESCALATE', delta:5 },
    { title:'Rare-Earth Investment Conditionality', desc:'Infrastructure financing offer to Greenland quietly conditioned on long-term access rights.', tag:'EXPLOIT', delta:4 }
  ],
  hybrid: [
    { title:'Compound Operation — Cyber + Narrative', desc:'Coincident cyber probe against Nordic C2 systems and a narrative push questioning alliance readiness. Designed to saturate Blue Team attention.', tag:'ESCALATE', delta:7 },
    { title:'Russia–China Narrative Convergence', desc:'Independently-sourced but mutually reinforcing content questioning the legitimacy of NATO Arctic governance mechanisms.', tag:'EXPLOIT', delta:6 }
  ]
};

async function generateAIMove(){
  const scenarioName = getScenarioName();
  const scenarioDesc = (document.getElementById('scenarioDesc')?.value || '').trim();
  const gapNow = document.getElementById('master-gap-val').textContent;
  const dl = DOCTRINE_LABEL[SESSION.doctrine];
  const prompt = `You are the WinterStorm2030 Red Team agentic AI, currently operating under the ${dl} doctrine, in an Arctic High North grey-zone governance wargame (NATO STO SAS-219). Current session: Turn ${SESSION.turn}, NATO Capability Gap ${gapNow}. ${scenarioName ? `Scenario: "${scenarioName}" — ${scenarioDesc}.` : 'No specific scenario has been set; use the Svalbard / GIUK / Greenland theatre generally.'} Generate ONE plausible next move for this turn, consistent with the doctrine and realistic Arctic grey-zone tradecraft (not kinetic conflict — below-Article-5 activity). Return ONLY JSON: {"title":"<short move name, under 8 words>","desc":"<2-3 sentence description of the move and its objective>","tag":"<PROBE|EXPLOIT|ESCALATE|WITHDRAW>","cap_gap_delta":<integer -3 to 10, how much this move should move the NATO Capability Gap>}`;
  let move;
  try{
    const resp = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:400,messages:[{role:'user',content:prompt}]})});
    const data = await resp.json();
    move = JSON.parse(data.content.filter(b=>b.type==='text').map(b=>b.text).join('').replace(/```json|```/g,'').trim());
  }catch(e){
    const pool = AI_MOVE_FALLBACK[SESSION.doctrine] || AI_MOVE_FALLBACK.rus;
    move = pool[(SESSION.turn) % pool.length];
  }
  narrativeModifier += move.cap_gap_delta;
  narrativeModifier = Math.max(-15, Math.min(15, narrativeModifier));
  recomputeMasterGap();

  aiMoveLog.unshift({ turn: SESSION.turn, time:new Date().toLocaleTimeString(), doctrine: dl, ...move });
  renderAIMoveLog();
  logAction('ai', move.title);
  document.getElementById('sb-lastmove').textContent = `${move.tag} — ${move.title}`;
  document.getElementById('aiMoveMeta').textContent = `Last move: Turn ${SESSION.turn}`;
  return move;
}

function renderAIMoveLog(){
  const c = document.getElementById('aiMoveLog');
  if(!c) return;
  if(!aiMoveLog.length){ c.innerHTML='<div style="color:var(--text-faint);font-family:var(--font-m);font-size: 16px;text-align:center;padding:20px;">No AI moves yet. Click "End Turn" in the header to generate Turn 2.</div>'; return; }
  const tagColor = { PROBE:'tag-brass', EXPLOIT:'tag-flare', ESCALATE:'tag-flare', WITHDRAW:'tag-beacon' };
  c.innerHTML = aiMoveLog.map(m=>`<div class="log-entry escalation${m.tag==='ESCALATE'?' pulse-alert':''}">
      <div class="log-time">Turn ${m.turn} — ${m.time} — ${m.doctrine}</div>
      <div style="margin:5px 0;"><span class="tag ${tagColor[m.tag]||'tag-flare'}">${m.tag}</span> <strong style="font-family:var(--font-d);color:var(--vellum);margin-left:6px;">${m.title}</strong>${provBadge('SIMULATED')}</div>
      <div style="font-size: 17px;color:var(--text-dim);">${m.desc}</div>
    </div>`).join('');
}

async function endTurn(){
  const btn = document.getElementById('endTurnBtn');
  const callout = document.getElementById('endTurnCallout');
  if(callout) callout.style.display='none';
  btn.disabled = true; btn.textContent = '⏳ Red Team Moving…';
  try{
    const move = await generateAIMove();
    advanceTurn(`End Turn — Red Team: ${move.title}`);
  } finally {
    btn.disabled = false; btn.textContent = '⏩ End Turn';
  }
}

function checkWinWinCondition(gap){
  const cond = gap < 45 && SESSION.treatyConcessionLogged;
  SESSION.winWinActive = cond;
  document.getElementById('sb-winwin-wrap').style.display = cond ? 'flex' : 'none';
  const banner = document.getElementById('winwinBanner');
  if(cond && banner.style.display==='none'){
    banner.style.display='flex';
    document.getElementById('winwinBannerText').textContent =
      `Composite Cap Gap has fallen to ${gap}% and a Narrative/Legal concession is logged. A cooperative resolution is available on the Contested Table (Concession Engine tab).`;
  } else if(!cond){
    banner.style.display='none';
  }
}

// ── RIPPLE ──
document.addEventListener('click', function(e){
  const btn = e.target.closest('.btn, .action-tile, .intensity-tile, .actor-chip, .concession-card, .trade-cell');
  if(!btn) return;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  ripple.className='ripple-effect';
  ripple.style.width=ripple.style.height=size+'px';
  ripple.style.left=(e.clientX-rect.left-size/2)+'px';
  ripple.style.top=(e.clientY-rect.top-size/2)+'px';
  if(getComputedStyle(btn).position==='static') btn.style.position='relative';
  btn.appendChild(ripple);
  setTimeout(()=>ripple.remove(),600);
});

// ── SCENARIO INPUT ──
let selectedAction=null, selectedActors=[], selectedIntensity='medium';
function selectAction(t){ document.querySelectorAll('.action-tile').forEach(x=>x.classList.remove('selected')); document.getElementById('tile-'+t).classList.add('selected'); selectedAction=t; }
function toggleActor(id){ const c=document.getElementById('chip-'+id); if(c.classList.contains('selected')){c.classList.remove('selected'); selectedActors=selectedActors.filter(a=>a!==id);} else {c.classList.add('selected'); selectedActors.push(id);} }
function selectIntensity(l){ document.querySelectorAll('.intensity-tile').forEach(x=>x.classList.remove('selected')); document.getElementById('int-'+l).classList.add('selected'); selectedIntensity=l; }
function generateScenario(){ document.getElementById('scenarioReady').style.display='block'; document.getElementById('scenarioReady').scrollIntoView({behavior:'smooth'}); }
function loadDemoScenario(){
  document.getElementById('scenarioName').value='GIUK Gap Undersea Cable Interference';
  document.getElementById('scenarioDesc').value='Russian-linked vessel severs Polar Connect subsea cable south of Svalbard. Attribution ambiguous.';
  selectAction('infra');
  ['norway','denmark','iceland','russia'].forEach(a=>{document.getElementById('chip-'+a).classList.add('selected'); if(!selectedActors.includes(a))selectedActors.push(a);});
  selectIntensity('high'); generateScenario();
}

function handleScenarioPreset(){
  const sel = document.getElementById('scenarioName');
  const customField = document.getElementById('scenarioNameCustom');
  if(sel.value === '__custom__'){
    customField.style.display = 'block';
    customField.focus();
  } else {
    customField.style.display = 'none';
    const descField = document.getElementById('scenarioDesc');
    const starters = {
      'Svalbard Article 9 Compliance Dispute': 'Vessel activity in the Svalbard EEZ raises questions about Article 9 demilitarization compliance.',
      'GIUK Gap Undersea Cable Interference': 'Signal interference or physical tampering reported near the GIUK undersea cable corridor.',
      'Northern Sea Route Access Contestation': 'Russian LNG export infrastructure expansion militarizes the Northern Sea Route corridor.',
      'Arctic Pipeline Sabotage': 'Deniable tampering with an Arctic LNG or oil pipeline segment, framed as mechanical failure.',
      'Greenland Sovereignty Friction': 'US-Denmark/Greenland adversarial framing widens amid rare-earth investment conditionality.',
      'Bering Strait Grey-Zone Signal Jamming': 'Below-threshold signal jamming reported near the US-Russia Bering Strait maritime boundary.',
      'Barents Sea Energy Coercion': 'Barents Sea oil and gas leverage used as pressure against Nordic grid interconnection dependence.',
      'Svalbard Fibre Link EEZ Vessel Loitering': 'Unattributed vessel loiters near the Svalbard Fibre Link, paired with a compliance-doubt narrative push.',
      'Arctic Icebreaker Gap Exploitation': 'Dual-use research/surveillance vessel activity increases near the Polar Connect corridor.',
      'Compound Hybrid Arctic Pressure Campaign': 'Coincident cable interference, disinformation push, and energy leverage saturate Blue Team attention.',
    };
    if(!descField.value.trim() && starters[sel.value]) descField.value = starters[sel.value];
  }
}

function getScenarioName(){
  const sel = document.getElementById('scenarioName');
  if(!sel) return '';
  if(sel.value === '__custom__') return (document.getElementById('scenarioNameCustom').value || '').trim();
  return sel.value;
}

// ── ACTOR THRESHOLDS ──
const actorData=[
  {name:'Norway',score:74,cls:'score-stable',note:'Sovereignty + Longyearbyen viability'},
  {name:'Denmark/Greenland',score:55,cls:'score-critical',note:'US adversarial framing — Indigenous rights'},
  {name:'Finland',score:64,cls:'score-medium',note:'Article 5 commitment solidarity'},
  {name:'Sweden',score:60,cls:'score-medium',note:'Historical neutrality reactivation'},
  {name:'Iceland',score:38,cls:'score-high',note:'CD gap — maskirovka vulnerability'},
  {name:'Canada',score:66,cls:'score-medium',note:'Northwest Passage sovereignty — NORAD modernization'},
];
function renderActorThresholds(){
  document.getElementById('actorThresholds').innerHTML = actorData.map(a=>`
    <div class="actor-row">
      <div><div class="actor-row-name">${a.name}</div><div class="actor-row-note">${a.note}</div></div>
      <div class="actor-row-score ${a.cls}">${a.score}</div>
    </div>`).join('');
}

// ── CONCESSION ──
function selectConcType(t){ ['access','resource','narrative'].forEach(x=>document.getElementById('card-'+x).className='concession-card'); document.getElementById('card-'+t).classList.add('sel-'+t); document.getElementById('triggerType').value=t; }
let concLog=[], concCount=0;
function triggerConcession(){
  const actor=document.getElementById('triggerActor').value, type=document.getElementById('triggerType').value, desc=document.getElementById('triggerDesc').value||'No description provided';
  concCount++; document.getElementById('ov-concessions').textContent=concCount;
  const names={norway:'Norway',denmark:'Denmark/Greenland',finland:'Finland',iceland:'Iceland',canada:'Canada',us:'United States',russia:'Russia',china:'China'};
  const isRed=actor==='russia'||actor==='china';
  const source = pendingConcSource || 'ANALYST';
  pendingConcSource = null;
  concLog.unshift({time:new Date().toLocaleTimeString(),actor:names[actor],type:type.toUpperCase(),desc,isRed,source});
  renderConcLog();
  logAction('human', `Concession — ${names[actor]} ${type}`);

  // v3.4 — Concession Engine now drives the shared Cap Gap composite.
  // Access/Resource concessions move the gap fastest (material); Narrative-Legal
  // moves it least directly but is what the Win-Win condition looks for.
  const typeDelta = { access:4, resource:3, narrative:2 };
  const delta = typeDelta[type] || 3;
  concessionModifier += isRed ? delta : -delta;
  concessionModifier = Math.max(-20, Math.min(20, concessionModifier));
  if(type==='narrative' && !isRed) SESSION.treatyConcessionLogged = true;
  recomputeMasterGap();
  advanceTurn(`${names[actor]} — ${type.toUpperCase()} concession`);

  if(actor==='denmark'&&type==='access'){ setTimeout(()=>{ if(confirm('Deadlock Protocol: Denmark/Greenland Access concession — US adversarial flag active. Open Contested Table?')) openContested(); },300); }
}
function renderConcLog(){
  const c=document.getElementById('concessionLog');
  if(!concLog.length){c.innerHTML='<div style="color:var(--text-faint);font-family:var(--font-m);font-size: 16px;text-align:center;padding:20px;">No concessions triggered yet.</div>';return;}
  c.innerHTML=concLog.map(e=>`<div class="log-entry ${e.isRed?'escalation':'concession'}"><div class="log-time">${e.time} — ${e.actor}</div><div style="margin-bottom:5px;"><span class="tag ${e.type==='ACCESS'?'tag-beacon':e.type==='RESOURCE'?'tag-brass':'tag-violet'}">${e.type}</span> ${e.isRed?'<span class="tag tag-flare">RED TEAM</span>':''}${provBadge(e.source||'ANALYST')}</div><div style="font-size: 17px;color:var(--text-dim);">${e.desc}</div></div>`).join('');
}

// ── CONTESTED ──
const tradeActors=['Norway','Denmark/Greenland','Finland','Iceland','Canada','United States'];
let tradeSelections={};
const escMap={
  svalbard:'RED TEAM — RUSSIA: Article 9 ambiguity cannot be resolved bilaterally. Counter-move: GRU-linked icebreaker enters disputed EEZ. NATO Capability Gap +5%. Mainsail (CMRE) flags anomalous trajectory — attribution MEDIUM. Blue Team window: T+4hrs.',
  article5:'RED TEAM — RUSSIA+CHINA: Article 5 threshold exploited. AI-generated content questioning Finnish commitment. IIC degradation: −8pts. Verdict: EXPLOIT. Cap Gap +7%.',
  caofa:'RED TEAM — CHINA: CAOFA moratorium exploited as leverage. Conditional support for Polar Connect data sovereignty recognition. Warning: narrow scoping being weaponized.',
  minerals:'RED TEAM — CHINA: Greenland mineral access contested three-way. Chinese infrastructure investment offer. Cap Gap +9% NATO. Verdict: ESCALATE.'
};
function openContested(){
  tradeSelections={};
  document.getElementById('tradeRows').innerHTML=tradeActors.map(a=>`<div class="trade-row"><div class="trade-actor-name">${a}</div><div class="trade-cell" onclick="selectTrade(this,'${a}','access')">Access</div><div class="trade-cell" onclick="selectTrade(this,'${a}','resource')">Resource</div><div class="trade-cell" onclick="selectTrade(this,'${a}','narrative')">Narrative/Legal</div></div>`).join('');
  document.getElementById('contestedOverlay').classList.add('active');
  document.getElementById('escalationOutput').classList.remove('active');
}
function closeContested(){ document.getElementById('contestedOverlay').classList.remove('active'); }
function selectTrade(el,actor,type){
  const row=el.parentElement;
  row.querySelectorAll('.trade-cell').forEach(c=>c.classList.remove('selected-trade'));
  el.classList.add('selected-trade');
  tradeSelections[actor]=type;
}
function runEscalation(){
  const art=document.getElementById('disputedArtifact').value;
  document.getElementById('escalationText').textContent=escMap[art]||'RED TEAM — COMPOUND: Concession asymmetry detected. Cap Gap +6%.';
  document.getElementById('escalationOutput').classList.add('active');
  const delta=art==='minerals'?9:art==='article5'?7:5;
  concessionModifier = Math.max(-20, Math.min(20, concessionModifier + delta));
  recomputeMasterGap();
  addGapEvent('Red Escalation', art, delta, true);
}
function logResolution(){
  const art=document.getElementById('disputedArtifact').value;
  const trades = Object.entries(tradeSelections);
  concLog.unshift({time:new Date().toLocaleTimeString(),actor:'Negotiation Table',type:'RESOLUTION',desc:`Resolution — ${art}. Trades: ${trades.map(([a,t])=>`${a}:${t}`).join(', ')||'None'}`,isRed:false,source:'ANALYST'});
  renderConcLog();
  // v3.4 — a narrative/legal trade struck at the Contested Table counts as a treaty-track
  // concession for Win-Win purposes, and any resolution relieves the modifier slightly.
  if(trades.some(([,t])=>t==='narrative')) SESSION.treatyConcessionLogged = true;
  concessionModifier = Math.max(-20, Math.min(20, concessionModifier - 2));
  recomputeMasterGap();
  advanceTurn(`Contested Table — ${art} resolved`);
  closeContested();
}

// ══════════════════════════════════════════════════════════
// v3.10 — ARBITRATION TRACK
// Modeled on Boundary Waters (1909) / Columbia River (1961) / Canterbury (1986):
// standing-commission escalation ladder rather than a single arbitration trigger.
// ══════════════════════════════════════════════════════════
const ARB_STAGES = ['Notification','Joint Verification','Interim Continuity','Time-Limited Conciliation','Binding Arbitration'];
let arbCase = null; // { violation, asset, stage(1-5), log }

function startArbitration(){
  const violation = document.getElementById('arbViolation').value;
  const asset = document.getElementById('arbAsset').value;
  arbCase = { violation, asset, stage: 1, log: [] };
  document.getElementById('arbSetup').style.display='none';
  document.getElementById('arbStartBtn').style.display='none';
  document.getElementById('arbActive').style.display='block';
  logArbEvent(`Case opened — ${violation} against ${asset}. Notification issued to all parties.`);
  renderArbLadder();
  addGapEvent('Arbitration Opened', asset, 0, false);
}

function logArbEvent(text){
  arbCase.log.unshift({ time:new Date().toLocaleTimeString(), text });
  const c = document.getElementById('arbLog');
  c.innerHTML = arbCase.log.map(e=>`<div class="log-entry"><div class="log-time">${e.time}</div><div style="font-size:16px;color:var(--text-dim);">${e.text}</div></div>`).join('');
}

function renderArbLadder(){
  const c = document.getElementById('arbLadder');
  c.innerHTML = ARB_STAGES.map((label,i)=>{
    const n=i+1;
    const cls = n < arbCase.stage ? 'done' : n===arbCase.stage ? 'current' : '';
    return `<div class="arb-stage ${cls}"><div class="arb-stage-dot">${n < arbCase.stage ? '✓' : n}</div><div class="arb-stage-label">${label}</div></div>`;
  }).join('');
  document.getElementById('arbCaseNote').innerHTML = `<strong style="color:var(--vellum);">${arbCase.violation}</strong> — ${arbCase.asset}. Currently at Stage ${arbCase.stage}: <strong style="color:var(--flare);">${ARB_STAGES[arbCase.stage-1]}</strong>.`;
  const atFinal = arbCase.stage === 5;
  document.getElementById('arbAdvanceBtn').style.display = atFinal ? 'none' : 'inline-block';
  document.getElementById('arbRuleBtn').style.display = atFinal ? 'inline-block' : 'none';
}

function advanceArbStage(){
  if(!arbCase || arbCase.stage>=5) return;
  arbCase.stage++;
  const s = arbCase.stage;
  if(s===2){ // Joint Verification — a neutral technical body (Boundary Waters model) establishes facts
    logArbEvent(`Joint Verification convened. Findings consistent with the reported ${arbCase.violation.toLowerCase()} against ${arbCase.asset}.`);
    concessionModifier = Math.max(-20, Math.min(20, concessionModifier + 1));
  } else if(s===3){ // Interim Continuity of Operations — asset stays operational while the case proceeds
    logArbEvent(`Interim Continuity of Operations ordered — ${arbCase.asset} remains operational pending resolution; no unilateral action permitted by either party.`);
    concessionModifier = Math.max(-20, Math.min(20, concessionModifier - 1));
  } else if(s===4){ // Time-Limited Conciliation — Columbia River model: short deadline before compulsory arbitration
    logArbEvent(`Time-Limited Conciliation window opened. If unresolved, the case proceeds automatically to Binding Arbitration.`);
  }
  recomputeMasterGap();
  renderArbLadder();
  addGapEvent('Arbitration Advance', ARB_STAGES[s-1], 0, false);
}

async function issueArbitrationRuling(){
  const btn = document.getElementById('arbRuleBtn');
  btn.disabled = true; btn.textContent = '⏳ Tribunal Deliberating…';
  const prompt = `You are a neutral arbitration tribunal (modeled on the Boundary Waters Treaty International Joint Commission and the 1871 Treaty of Washington's Geneva Tribunal), ruling on a NATO STO SAS-219 High North grey-zone case. Violation type: "${arbCase.violation}". Strategic asset: "${arbCase.asset}". Issue a short binding ruling. Return ONLY JSON: {"ruling":"<FOR BLUE|FOR RED|SPLIT>","summary":"<2-3 sentence ruling, in the voice of a neutral arbitration tribunal>","cap_gap_delta":<integer -10 to 10, negative if the ruling favors Blue/closes the gap>}`;
  let result;
  try{
    const resp = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:400,messages:[{role:'user',content:prompt}]})});
    const data = await resp.json();
    result = JSON.parse(data.content.filter(b=>b.type==='text').map(b=>b.text).join('').replace(/```json|```/g,'').trim());
  }catch(e){
    result = { ruling:'SPLIT', summary:`The Tribunal finds the ${arbCase.violation.toLowerCase()} against ${arbCase.asset} substantiated in part. Continuity of operations is affirmed; the responsible party shall provide notification and access assurances going forward, consistent with the Boundary Waters standing-commission model.`, cap_gap_delta:-4 };
  }
  logArbEvent(`BINDING RULING (${result.ruling}) — ${result.summary}`);
  concessionModifier = Math.max(-20, Math.min(20, concessionModifier + result.cap_gap_delta));
  SESSION.treatyConcessionLogged = true; // a binding ruling is a treaty-track resolution
  recomputeMasterGap();
  article4Log.unshift({ time:new Date().toLocaleTimeString(), title:`Arbitration ruling (${result.ruling}) — ${arbCase.violation} vs ${arbCase.asset}`, domain:'Arbitration Track', url:'', turn:SESSION.turn, source:'ARBITRATION' });
  renderArticle4Log();
  concLog.unshift({time:new Date().toLocaleTimeString(),actor:'Arbitration Tribunal',type:'RESOLUTION',desc:`${result.ruling} — ${arbCase.violation} vs ${arbCase.asset}. ${result.summary}`,isRed:false,source:'ARBITRATION'});
  renderConcLog();
  advanceTurn(`Arbitration Ruling — ${arbCase.violation} vs ${arbCase.asset}`);
  btn.disabled = false; btn.textContent = 'Issue Binding Ruling';
  arbCase = null;
  document.getElementById('arbSetup').style.display='grid';
  document.getElementById('arbStartBtn').style.display='inline-block';
  document.getElementById('arbActive').style.display='none';
}

// ── CAP GAP ──
const capDomains=[
  {name:'Infrastructure & Stockpiles',gap:71,note:'Svalbard / High North logistics deficit'},
  {name:'Industrial Capacity (Icebreakers)',gap:68,note:'Helsinki Shipyard critical'},
  {name:'Command & Communications',gap:58,note:'GIUK Gap coherence under pressure'},
  {name:'Undersea Surveillance',gap:65,note:'Mainsail (CMRE) partially offsets'},
  {name:'Nordic Burden Sharing',gap:58,note:'Sweden/Finland integration ongoing'},
];
function renderCapDomains(){
  document.getElementById('capDomains').innerHTML=capDomains.map((d,i)=>`
    <div class="gauge-wrap">
      <div class="gauge-label"><span>${d.name}</span><span class="val" style="color:${d.gap>65?'var(--flare)':d.gap>55?'var(--brass)':'var(--beacon)'};">${d.gap}%</span></div>
      <div class="gauge-track"><div class="gauge-fill ${d.gap>65?'flare':d.gap>55?'brass':''}" style="width:${d.gap}%"></div></div>
      <div style="font-family:var(--font-m);font-size: 13px;color:var(--text-faint);margin-top:5px;">${d.note}</div>
    </div>`).join('');
}
let gapEvents=[];
function updateGap(v){
  v=Math.max(0,Math.min(100,v));
  document.getElementById('master-gap-val').textContent=v+'%';
  document.getElementById('master-gap-bar').style.width=v+'%';
  document.getElementById('ov-capgap').textContent=v+'%';
  document.getElementById('live-capgap').textContent=v+'%';
  document.getElementById('live-capgap-bar').style.width=v+'%';
  if(document.getElementById('sb-capgap')){
    document.getElementById('sb-capgap').textContent=v+'%';
    checkWinWinCondition(v);
  }
}
function adjustGap(){
  const idx=parseInt(document.getElementById('gapDomainSelect').value), type=document.getElementById('gapAdjType').value, delta=parseInt(document.getElementById('gapDelta').value), isRed=type==='red';
  capDomains[idx].gap=Math.max(0,Math.min(100,capDomains[idx].gap+(isRed?delta:-delta)));
  renderCapDomains();
  const avg=recomputeMasterGap();
  addGapEvent(isRed?'Red Exploit':'Blue Close', capDomains[idx].name, delta, isRed);
  const fb=document.getElementById('gapFeedback'); fb.style.display='block'; fb.style.color=isRed?'var(--flare)':'var(--beacon)';
  fb.textContent=`${isRed?'▲ Widened':'▼ Closed'} — ${capDomains[idx].name}: ${isRed?'+':'-'}${delta}% | Composite: ${avg}%`;
}
function addGapEvent(type,domain,delta,isRed){
  gapEvents.unshift({time:new Date().toLocaleTimeString(),type,domain,delta,isRed});
  document.getElementById('gapEventLog').innerHTML=gapEvents.map(e=>`<div class="log-entry ${e.isRed?'escalation':'resolution'}"><div class="log-time">${e.time} — ${e.type}</div><div style="font-size: 17px;color:var(--text-dim);">${e.domain} | ${e.isRed?'+':'-'}${e.delta}% | Orion Lab: queued</div></div>`).join('');
}
function exportOrion(){
  const data=JSON.stringify({timestamp:new Date().toISOString(),masterGap:document.getElementById('master-gap-val').textContent,domains:capDomains,events:gapEvents,concessions:concLog.length},null,2);
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.download='winterstorm2030_orion_export.json'; a.click();
  addGapEvent('Export','Full session → Orion Lab',0,false);
}

// ── COG WARFARE ──
async function runCogAnalysis(){
  const narrative=document.getElementById('cogNarrativeInput').value, doctrine=document.getElementById('cogDoctrineSelect').value;
  if(!narrative.trim()){alert('Please enter a narrative.');return;}
  document.getElementById('cogWarfareOutput').style.display='block';
  document.getElementById('cogWarfareText').textContent='Processing...';
  setDoctrine(doctrine); // v3.4 — this narrative's doctrine becomes the session's active adversary posture
  const dl=doctrine==='rus'?'Russia Narrative-First':doctrine==='prc'?'China Platform-First':'Compound Hybrid';
  const prompt=`You are the WinterStorm2030 IAIG Cognitive Warfare Engine. Analyse this narrative under the ${dl} doctrine. Return ONLY JSON: {"intent_score":<0-100>,"intent_label":"<HIGH|MEDIUM|LOW>","autonomy_score":<0-100>,"autonomy_label":"<HIGH|MEDIUM|LOW>","interaction_score":<0-100>,"interaction_label":"<HIGH|MEDIUM|LOW>","governance_score":<0-100>,"governance_label":"<HIGH|MEDIUM|LOW>","analysis":"<3-4 sentences>","blue_response":"<1-2 sentences>"}\nNarrative: "${narrative}"`;
  let govScore = 74;
  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
    const data=await resp.json();
    const parsed=JSON.parse(data.content.filter(b=>b.type==='text').map(b=>b.text).join('').replace(/```json|```/g,'').trim());
    [['intent',parsed.intent_score,parsed.intent_label],['auto',parsed.autonomy_score,parsed.autonomy_label],['inter',parsed.interaction_score,parsed.interaction_label],['gov',parsed.governance_score,parsed.governance_label]].forEach(([k,s,l])=>{document.getElementById('cog-'+k+'-val').textContent=`${s}/100 — ${l}`; document.getElementById('cog-'+k+'-bar').style.width=s+'%';});
    document.getElementById('cogWarfareText').innerHTML=`<strong style="color:var(--beacon);">IAIG Assessment:</strong> ${parsed.analysis}<br/><br/><strong style="color:var(--brass);">Blue Team Response:</strong> ${parsed.blue_response}`;
    govScore = parsed.governance_score;
  }catch(e){
    document.getElementById('cog-intent-val').textContent='78/100 — HIGH'; document.getElementById('cog-intent-bar').style.width='78%';
    document.getElementById('cog-auto-val').textContent='82/100 — HIGH'; document.getElementById('cog-auto-bar').style.width='82%';
    document.getElementById('cog-inter-val').textContent='61/100 — MEDIUM'; document.getElementById('cog-inter-bar').style.width='61%';
    document.getElementById('cog-gov-val').textContent='74/100 — HIGH'; document.getElementById('cog-gov-bar').style.width='74%';
    document.getElementById('cogWarfareText').innerHTML='<strong style="color:var(--beacon);">IAIG Assessment (Demo):</strong> High-intent narrative targeting IIC Nordic composite via Svalbard sovereignty ambiguity.<br/><br/><strong style="color:var(--brass);">Blue Team Response:</strong> Joint Nordic attribution statement within T+4hrs.';
    govScore = 74;
  }
  // v3.4 — a high governance-pressure narrative widens the Cap Gap; a low one relieves it.
  narrativeModifier += Math.round((govScore-50)/6);
  narrativeModifier = Math.max(-15, Math.min(15, narrativeModifier));
  recomputeMasterGap();
  advanceTurn(`Cognitive Warfare — ${dl}`);
}

// ── NARRATIVE ──
const exNarr={
  svalbard:"Norwegian military exercises near Svalbard represent a clear violation of the 1920 Treaty's demilitarization provisions.",
  article5:"NATO's Article 5 guarantee has never actually been invoked successfully. Finland's entry into the alliance only makes Helsinki a target.",
  greenland:"Greenland's natural resources belong to the Greenlandic people, not to Denmark or Washington."
};
function setEx(k){ document.getElementById('narrativeInput').value=exNarr[k]; }
async function analyseNarrative(){
  const narrative=document.getElementById('narrativeInput').value;
  if(!narrative.trim()){alert('Please enter a narrative.');return;}
  document.getElementById('narrativeOutput').style.display='block';
  const prompt=`You are WinterStorm2030's IAIG Narrative Analysis Engine. Analyse this narrative. Return ONLY JSON: {"intent":"<HIGH|MEDIUM|LOW>","autonomy":"<HIGH|MEDIUM|LOW>","interaction":"<HIGH|MEDIUM|LOW>","governance":"<HIGH|MEDIUM|LOW>","analysis":"<3 sentences>","foresight":"<2 sentences>"}\nNarrative: "${narrative}"`;
  let govLabel='HIGH';
  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:600,messages:[{role:'user',content:prompt}]})});
    const data=await resp.json();
    const parsed=JSON.parse(data.content.filter(b=>b.type==='text').map(b=>b.text).join('').replace(/```json|```/g,'').trim());
    document.getElementById('narr-intent').textContent=parsed.intent; document.getElementById('narr-auto').textContent=parsed.autonomy;
    document.getElementById('narr-inter').textContent=parsed.interaction; document.getElementById('narr-gov').textContent=parsed.governance;
    document.getElementById('narrativeText').textContent=parsed.analysis; document.getElementById('narrativeForesight').textContent=parsed.foresight;
    govLabel = parsed.governance;
  }catch(e){
    document.getElementById('narr-intent').textContent='HIGH'; document.getElementById('narr-auto').textContent='HIGH';
    document.getElementById('narr-inter').textContent='MEDIUM'; document.getElementById('narr-gov').textContent='HIGH';
    document.getElementById('narrativeText').textContent='Adversarial objective: fracture Nordic alliance solidarity via legal ambiguity. Primary seam: IIC gap between Iceland (42) and Norway (65).';
    document.getElementById('narrativeForesight').textContent='Joint Nordic attribution statement within T+4hrs.';
    govLabel='HIGH';
  }
  // v3.4 — feeds this tab's output into the same shared Cap Gap composite Cognitive Warfare uses
  const labelDelta = { HIGH:4, MEDIUM:1, LOW:-3 };
  narrativeModifier += (labelDelta[govLabel] ?? 2);
  narrativeModifier = Math.max(-15, Math.min(15, narrativeModifier));
  recomputeMasterGap();
  advanceTurn('Narrative Analysis');
}

// ── CLOCK ──
let clockInterval=null, clockSecs=0, trackEvents=[];
function startClock(){ if(clockInterval)return; clockInterval=setInterval(()=>{ clockSecs++; const m=Math.floor(clockSecs/60); document.getElementById('scenarioClock').textContent=`T+${String(Math.floor(clockSecs/3600)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; if(clockSecs%30===0) addTrackEvent(); },1000); }
function stopClock(){ clearInterval(clockInterval); clockInterval=null; }
function resetClock(){ stopClock(); clockSecs=0; document.getElementById('scenarioClock').textContent='T+00:00'; }
function addTrackEvent(){
  const evs=['IIC degradation — Iceland: −2pts.','Governance seam: Norway-Iceland IIC gap widened to 34pts.','CD stabilisation — Finland-Sweden protocol activated.','Kalman filter update: governance trajectory revised.'];
  trackEvents.unshift({time:document.getElementById('scenarioClock').textContent, text:evs[Math.floor(Math.random()*evs.length)]});
  document.getElementById('trackingLog').innerHTML=trackEvents.map(e=>`<div class="log-entry concession"><div class="log-time">${e.time}</div><div style="font-size: 17px;color:var(--text-dim);">${e.text}</div></div>`).join('');
}
