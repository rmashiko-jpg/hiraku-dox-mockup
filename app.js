/* =========================================================
   株式会社ひらく様 DoX業務基盤 モックアップ — アプリ本体
   バニラJS SPA / 全画面で単一データストアを共有 / localStorage保存
   ========================================================= */
(function () {
  'use strict';
  const LS_KEY = 'hiraku-dox-mock-v1';
  const LS_UI = 'hiraku-dox-mock-ui-v1';
  const TODAY = window.DEMO_TODAY;

  // ---------- state ----------
  let S = load() || window.buildSeed();
  const UI = Object.assign({
    view: 'dash', role: 'kanri', store: 'all', assignee: 'all',
    drawer: null, q: '', searchOpen: false, notifOpen: false,
    f: {}, sel: {}, sort: {}, baScenario: 0, baStep: 0, p17tab: 'trace', traceId: 'K004', guideSeen: false, hl: null,
  }, loadUI());
  UI.drawer = null; UI.searchOpen = false; UI.notifOpen = false; UI.q = '';

  function load() { try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function loadUI() { try { const s = localStorage.getItem(LS_UI); return s ? JSON.parse(s) : {}; } catch (e) { return {}; } }
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
    try { localStorage.setItem(LS_UI, JSON.stringify({ view: UI.view, role: UI.role, guideSeen: UI.guideSeen, traceId: UI.traceId })); } catch (e) {}
  }

  // ---------- constants ----------
  const ROLES = {
    exec: { label: '経営者', user: 'u01', dept: null },
    kanri: { label: '管理課', user: 'u02', dept: '管理課' },
    chukai: { label: '仲介店舗（西口店）', user: 'u04', dept: '仲介' },
    keiri: { label: '経理', user: 'u07', dept: '経理' },
  };
  const ROLE_ORDER = ['exec', 'kanri', 'chukai', 'keiri'];
  // 権限（仮仕様：部門・店舗ごとの権限/承認者は要確認）
  const PERM = {
    units:       { exec: 'VEA', kanri: 'VEA', chukai: 'V',  keiri: 'V' },
    inquiries:   { exec: 'VEA', kanri: 'V',   chukai: 'VEA', keiri: '' },
    contracts:   { exec: 'VEA', kanri: 'VE',  chukai: 'VE', keiri: 'V' },
    settlements: { exec: 'VEA', kanri: 'V',   chukai: 'V',  keiri: 'VEA' },
    logs:        { exec: 'VA',  kanri: 'V',   chukai: 'V',  keiri: 'V' },
    trash:       { exec: 'VEA', kanri: 'V',   chukai: 'V',  keiri: 'V' },
  };
  const MOD_LABEL = { units: '空室・募集', inquiries: '反響・追客', contracts: '申込・契約', settlements: '入出金・精算', logs: '変更履歴', trash: '論理削除の復元' };
  const can = (mod, p) => (PERM[mod][UI.role] || '').includes(p);
  const me = () => ROLES[UI.role].user;

  const UNIT_ST = ['募集中', '申込中', '契約済', '募集停止', '確認待ち'];
  const INQ_ST = ['新規反響', '初回対応済', '内見予定', '追客中', '申込', '成約', '失注'];
  const INQ_ACTIVE = ['新規反響', '初回対応済', '内見予定', '追客中'];
  const CON_ST = ['審査中', '契約準備中', '契約手続中', '完了', 'キャンセル'];
  const CK = [['app', '申込書'], ['screening', '審査'], ['juji', '重要事項説明'], ['contract', '契約書'], ['invoice', '請求書'], ['payment', '入金'], ['docs', '関連書類']];
  const CK_L = Object.fromEntries(CK);
  const MEDIA = [['suumo', 'SUUMO'], ['athome', 'アットホーム'], ['pitat', 'ピタットハウス']];
  const CONFIRM_DAYS = 7;

  // ---------- helpers ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const yen = (n) => (n === null || n === undefined || n === '') ? '—' : '¥' + Number(n).toLocaleString('ja-JP');
  const num = (n) => Number(n || 0).toLocaleString('ja-JP');
  const addDays = (iso, n) => { const x = new Date(iso + 'T00:00:00'); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const diffDays = (a, b) => Math.round((new Date(a + 'T00:00:00') - new Date(b + 'T00:00:00')) / 86400000);
  const md = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${+m}/${+d}`; };
  const ymd = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${y}/${m}/${d}`; };
  const nowStamp = () => { const n = new Date(); return TODAY + ' ' + String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'); };
  const W = ['日', '月', '火', '水', '木', '金', '土'];
  const wd = (iso) => W[new Date(iso + 'T00:00:00').getDay()];
  const byId = (arr, id) => arr.find((x) => x.id === id);
  const user = (id) => id === 'system' ? { name: 'システム（自動）', dept: '—' } : (byId(S.users, id) || { name: '—', dept: '' });
  const uname = (id) => user(id).name;
  const unit = (id) => byId(S.units, id);
  const prop = (id) => byId(S.properties, id);
  const cust = (id) => byId(S.customers, id);
  const inq = (id) => byId(S.inquiries, id);
  const app = (id) => byId(S.applications, id);
  const con = (id) => byId(S.contracts, id);
  const stl = (id) => byId(S.settlements, id);
  const company = (id) => byId(S.companies, id);
  const unitName = (u) => { if (typeof u === 'string') u = unit(u); if (!u) return '—'; const p = prop(u.propertyId); return `${p.name} ${u.room}`; };
  const unitMgmt = (u) => company(prop(u.propertyId).mgmtId);
  const isOwn = (u) => unitMgmt(u).own;
  const conApp = (c) => app(c.applicationId);
  const conUnit = (c) => unit(conApp(c).unitId);
  const conCust = (c) => cust(conApp(c).customerId);
  const stlCon = (s) => con(s.contractId);
  const stlForCon = (cid) => S.settlements.find((s) => s.contractId === cid && !s.deleted);
  const nextId = (k, prefix, pad) => prefix + String(S.seq[k]++).padStart(pad, '0');
  const adTxt = (a) => (a === 0 ? 'なし' : Number(a).toFixed(1) + 'ヶ月');
  const confirmDue = (u) => addDays(u.lastConfirmed, CONFIRM_DAYS);
  const confirmOver = (u) => ['募集中', '確認待ち'].includes(u.status) && confirmDue(u) < TODAY;
  const storeOfUser = (uid) => user(uid).storeId;

  function traceOf(entity, id) {
    if (entity === 'unit') return { unitId: id };
    if (entity === 'inquiry') { const i = inq(id); return { unitId: i.unitId, inquiryId: id }; }
    if (entity === 'contract') { const c = con(id); const a = conApp(c); return { unitId: a.unitId, inquiryId: a.inquiryId, contractId: id }; }
    if (entity === 'settlement') { const s = stl(id); const c = stlCon(s); const a = conApp(c); return { unitId: a.unitId, inquiryId: a.inquiryId, contractId: c.id, settlementId: id }; }
    return {};
  }
  function log(entity, id, action, field, before, after, by) {
    S.logs.push({ at: nowStamp(), userId: by || me(), entity, entityId: id, action, field: field || '', before: before ?? '', after: after ?? '', trace: traceOf(entity, id) });
  }
  function addTask(kind, title, dept, assigneeId, due, refType, refId) {
    const ex = S.tasks.find((t) => t.status === 'open' && t.kind === kind && t.ref.type === refType && t.ref.id === refId);
    if (ex) { ex.due = due; ex.title = title; ex.assigneeId = assigneeId; return ex; }
    const t = { id: nextId('task', 't', 3), kind, title, dept, assigneeId, due, status: 'open', ref: { type: refType, id: refId }, auto: kind !== 'manual', createdAt: nowStamp(), doneAt: null };
    S.tasks.push(t);
    log('task', t.id, 'タスク自動生成', '', '', title, 'system');
    S.logs[S.logs.length - 1].trace = traceOf(refType, refId);
    return t;
  }
  function closeTasks(filterFn, status) {
    let n = 0;
    S.tasks.forEach((t) => { if (t.status === 'open' && filterFn(t)) { t.status = status || 'done'; t.doneAt = nowStamp(); n++; } });
    return n;
  }
  const refTasks = (type, id) => S.tasks.filter((t) => t.ref.type === type && t.ref.id === id);

  // ---------- derived (KPI / alerts) ----------
  function storeOfTask(t) {
    const r = t.ref;
    if (r.type === 'unit') { const u = unit(r.id); return u ? prop(u.propertyId).storeId : null; }
    if (r.type === 'inquiry') { const i = inq(r.id); return i ? storeOfUser(i.agentId) : null; }
    if (r.type === 'contract') { const c = con(r.id); return c ? storeOfUser(conApp(c).agentId) : null; }
    if (r.type === 'settlement') { const s = stl(r.id); return s ? storeOfUser(conApp(stlCon(s)).agentId) : null; }
    return null;
  }
  const storeMatchUnit = (u) => UI.store === 'all' || prop(u.propertyId).storeId === UI.store;
  const storeMatchAgent = (uid) => UI.store === 'all' || storeOfUser(uid) === UI.store;
  const liveUnits = () => S.units.filter((u) => !u.deleted);
  const liveInq = () => S.inquiries.filter((i) => !i.deleted);
  const liveCon = () => S.contracts.filter((c) => !c.deleted);
  const liveStl = () => S.settlements.filter((s) => !s.deleted);
  const unfollowed = (i) => INQ_ACTIVE.includes(i.status) && (!i.nextFollow || i.nextFollow <= TODAY);
  const payOver = (s) => s.payStatus === '入金待ち' && s.payDue && s.payDue < TODAY;
  const payWaiting = (s) => s.payStatus === '入金待ち' || s.payStatus === '未請求';
  function docShort(c) { return ['審査中', '契約準備中', '契約手続中'].includes(c.status) && (Object.values(c.checklist).includes('back') || (diffDays(c.startDate, TODAY) <= 7 && c.checklist.docs !== 'done')); }

  function kpis() {
    const us = liveUnits().filter(storeMatchUnit);
    const cs = liveCon().filter((c) => storeMatchAgent(conApp(c).agentId));
    const is = liveInq().filter((i) => storeMatchAgent(i.agentId));
    const ss = liveStl().filter((s) => storeMatchAgent(conApp(stlCon(s)).agentId));
    return {
      recruiting: us.filter((u) => u.status === '募集中').length,
      applying: cs.filter((c) => ['審査中', '契約準備中'].includes(c.status)).length,
      contracting: cs.filter((c) => c.status === '契約手続中').length,
      unfollowed: is.filter(unfollowed).length,
      payWait: ss.filter(payWaiting).length,
    };
  }
  function alerts() {
    const us = liveUnits().filter(storeMatchUnit);
    const is = liveInq().filter((i) => storeMatchAgent(i.agentId));
    const cs = liveCon().filter((c) => storeMatchAgent(conApp(c).agentId));
    const ss = liveStl().filter((s) => storeMatchAgent(conApp(stlCon(s)).agentId));
    return [
      { key: 'confirm', label: '募集確認期限超過', desc: `最終空室確認から${CONFIRM_DAYS}日超過`, cls: 'p-amber', ic: '⌛', items: us.filter(confirmOver).map((u) => ({ t: unitName(u), s: `最終確認 ${md(u.lastConfirmed)}（${diffDays(TODAY, u.lastConfirmed)}日前）`, go: () => openDrawer('unit', u.id) })), view: 'units', roles: ['exec', 'kanri'] },
      { key: 'follow', label: '追客遅延', desc: '次回追客日を過ぎて未対応', cls: 'p-red', ic: '☎', items: is.filter((i) => INQ_ACTIVE.includes(i.status) && i.nextFollow && i.nextFollow < TODAY).map((i) => ({ t: cust(i.customerId).name + ' 様', s: `予定 ${md(i.nextFollow)}・担当 ${uname(i.agentId)}`, go: () => openDrawer('inquiry', i.id) })), view: 'inquiries', roles: ['exec', 'chukai'] },
      { key: 'docs', label: '書類不足・差戻し', desc: '差戻し中、または契約開始7日前で書類未完', cls: 'p-red', ic: '!', items: cs.filter(docShort).map((c) => ({ t: `${c.id} ${conCust(c).name} 様`, s: Object.entries(c.checklist).filter(([k, v]) => v === 'back').map(([k]) => CK_L[k] + ' 差戻し').join('・') || `契約開始 ${md(c.startDate)}・関連書類未完`, go: () => openDrawer('contract', c.id) })), view: 'contracts', roles: ['exec', 'chukai', 'kanri'] },
      { key: 'pay', label: '入金期限超過', desc: '入金期日を過ぎて未確認', cls: 'p-red', ic: '¥', items: ss.filter(payOver).map((s) => ({ t: `${s.contractId} ${conCust(stlCon(s)).name} 様`, s: `期日 ${md(s.payDue)}・${yen(s.billAmount)}`, go: () => openDrawer('settlement', s.id) })), view: 'settlements', roles: ['exec', 'keiri', 'chukai'] },
    ];
  }
  function roleTasks(includeDone) {
    const dept = ROLES[UI.role].dept;
    return S.tasks.filter((t) => (includeDone || t.status === 'open') && (!dept || t.dept === dept))
      .filter((t) => UI.store === 'all' || storeOfTask(t) === UI.store || (t.dept !== '仲介' && storeOfTask(t) === null))
      .filter((t) => UI.assignee === 'all' || t.assigneeId === UI.assignee)
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'open' ? -1 : 1) || a.due.localeCompare(b.due));
  }
  const openTaskCount = (dept) => S.tasks.filter((t) => t.status === 'open' && (!dept || t.dept === dept) && t.due <= TODAY).length;

  // ---------- toast ----------
  function toast(title, lines, link) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast' + (link ? ' link' : '');
    el.innerHTML = `<div class="tt">${esc(title)}</div>` + (lines && lines.length ? `<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '');
    root.appendChild(el);
    while (root.children.length > 3) root.firstChild.remove();
    setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, link ? 6000 : 3200);
  }
  function commit(title, lines, link) { save(); render(); if (title) toast(title, lines, link); }

  // =========================================================
  //  DOMAIN ACTIONS
  // =========================================================
  function setUnitStatus(uid, st, opts) {
    opts = opts || {};
    const u = unit(uid); const before = u.status; if (before === st) return [];
    const fx = [];
    u.status = st;
    log('unit', uid, '状態変更', '募集状態', before, st, opts.by);
    const asg = u.assigneeId;
    if (['申込中', '契約済', '募集停止'].includes(st)) {
      let any = false;
      MEDIA.forEach(([k]) => { if (['掲載中', '更新待ち'].includes(u.listings[k])) { u.listings[k] = '停止確認待ち'; any = true; } });
      if (any) {
        addTask('listing-stop', `掲載停止確認：${unitName(u)}（${st}）`, '管理課', asg, addDays(TODAY, st === '申込中' ? 0 : 1), 'unit', uid);
        fx.push('ポータル掲載を「停止確認待ち」に変更（デモ連携）', `管理課 ${uname(asg)} に「掲載停止確認」タスクを生成`);
      }
      closeTasks((t) => t.ref.type === 'unit' && t.ref.id === uid && ['listing-start', 'listing-update', 'relist-judge'].includes(t.kind));
    }
    if (st === '募集中') {
      let any = false;
      MEDIA.forEach(([k]) => { if (['停止', '停止確認待ち'].includes(u.listings[k])) { u.listings[k] = '更新待ち'; any = true; } });
      if (any) { addTask('listing-start', `掲載再開：${unitName(u)}（条件確認のうえ再掲載）`, '管理課', asg, TODAY, 'unit', uid); fx.push('掲載状態を「更新待ち」に変更し、掲載再開タスクを生成'); }
      closeTasks((t) => t.ref.type === 'unit' && t.ref.id === uid && ['listing-stop', 'relist-judge', 'ext-check'].includes(t.kind));
      u.lastConfirmed = TODAY;
      fx.push('仲介店舗の募集物件一覧・反響登録の物件候補に表示');
    }
    if (before === '募集中' && st !== '募集中') fx.push('仲介店舗の募集物件一覧から提案対象外に変更');
    if (st === '確認待ち') closeTasks((t) => t.ref.type === 'unit' && t.ref.id === uid && t.kind === 'listing-start');
    return fx;
  }

  const A = {}; // exposed actions
  window.App = A;

  A.go = (v, extra) => { UI.view = v; UI.drawer = null; UI.searchOpen = false; UI.notifOpen = false; if (extra) { UI.f.alert = ''; Object.assign(UI.f, extra); } save(); render(); window.scrollTo(0, 0); };
  A.role = (r) => { UI.role = r; UI.assignee = 'all'; UI.notifOpen = false; save(); render(); toast(`${ROLES[r].label}に切り替えました`, [`ログイン：${uname(ROLES[r].user)}（デモ）`]); };
  A.store = (v) => { UI.store = v; render(); };
  A.assignee = (v) => { UI.assignee = v; render(); };
  A.reset = () => {
    confirmModal('デモを初期状態に戻す', 'すべての操作内容（登録・変更・履歴）を破棄し、初期の架空データに戻します。よろしいですか？', 'リセットする', () => {
      S = window.buildSeed(); UI.drawer = null; UI.f = {}; UI.sel = {}; UI.baStep = 0; save(); render(); toast('デモデータを初期化しました');
    });
  };
  A.closeDrawer = () => { UI.drawer = null; render(); };
  A.f = (k, v) => { UI.f[k] = v; render(); };
  A.sort = (tbl, key) => { const s = UI.sort[tbl] || {}; UI.sort[tbl] = { key, dir: s.key === key && s.dir === 1 ? -1 : 1 }; render(); };
  A.toggleSearch = (b) => { UI.searchOpen = b; renderSearchDD(); };
  A.q = (v) => { UI.q = v; UI.searchOpen = true; renderSearchDD(); };
  A.notif = () => { UI.notifOpen = !UI.notifOpen; renderHeader(); };
  A.open = (type, id) => openDrawer(type, id);
  A.openTask = (tid) => { const t = byId(S.tasks, tid); UI.notifOpen = false; const v = { unit: 'units', inquiry: 'inquiries', contract: 'contracts', settlement: 'settlements' }[t.ref.type]; UI.view = v; openDrawer(t.ref.type, t.ref.id); };

  A.taskDone = (tid) => {
    const t = byId(S.tasks, tid);
    if (t.status === 'open') { t.status = 'done'; t.doneAt = nowStamp(); log('task', tid, 'タスク完了', '状態', '未対応', '完了'); S.logs[S.logs.length - 1].trace = traceOf(t.ref.type, t.ref.id);
      if (t.kind === 'listing-stop') { const u = unit(t.ref.id); if (u) MEDIA.forEach(([k]) => { if (u.listings[k] === '停止確認待ち') u.listings[k] = '停止'; }); }
      if (t.kind === 'listing-start' || t.kind === 'listing-update') { const u = unit(t.ref.id); if (u) MEDIA.forEach(([k]) => { if (u.listings[k] === '更新待ち') u.listings[k] = '掲載中'; }); }
      commit('タスクを完了しました', t.kind.startsWith('listing') ? ['掲載状態も更新しました（デモ連携）'] : null);
    } else { t.status = 'open'; t.doneAt = null; log('task', tid, 'タスク再開', '状態', '完了', '未対応'); commit('タスクを未対応に戻しました'); }
  };

  // ----- units -----
  A.unitStatus = (uid, st) => {
    if (!can('units', 'E')) return denied();
    const u = unit(uid);
    const fx = setUnitStatus(uid, st);
    UI.hl = uid;
    commit(`${unitName(u)}：${st} に変更`, fx, true);
  };
  A.confirmUnits = (ids) => {
    if (!can('units', 'E')) return denied();
    ids = ids || Object.keys(UI.sel.units || {}).filter((k) => UI.sel.units[k]);
    if (!ids.length) return toast('物件を選択してください');
    ids.forEach((id) => { const u = unit(id); const b = u.lastConfirmed; u.lastConfirmed = TODAY; log('unit', id, '空室確認', '最終空室確認日', ymd(b), ymd(TODAY)); });
    UI.sel.units = {};
    commit(`${ids.length}件を「確認済み」に登録`, [`最終空室確認日を${md(TODAY)}に更新`, `次回確認期限：${md(addDays(TODAY, CONFIRM_DAYS))}`]);
  };
  A.bulkAssignee = () => {
    if (!can('units', 'E')) return denied();
    const v = document.getElementById('bulk-asg').value;
    const ids = Object.keys(UI.sel.units || {}).filter((k) => UI.sel.units[k]);
    if (!ids.length) return toast('物件を選択してください');
    ids.forEach((id) => { const u = unit(id); const b = u.assigneeId; if (b !== v) { u.assigneeId = v; log('unit', id, '担当者変更', '担当者', uname(b), uname(v)); S.tasks.filter((t) => t.status === 'open' && t.ref.type === 'unit' && t.ref.id === id).forEach((t) => (t.assigneeId = v)); } });
    UI.sel.units = {};
    commit(`${ids.length}件の担当者を${uname(v)}に変更`, ['未対応タスクも新担当へ引継ぎ', '過去の履歴は変更者・日時付きで保持']);
  };
  A.selUnit = (id, v) => { UI.sel.units = UI.sel.units || {}; UI.sel.units[id] = v; render(); };
  A.selAllUnits = (v, ids) => { UI.sel.units = {}; if (v) ids.split(',').forEach((i) => (UI.sel.units[i] = true)); render(); };
  A.cycleListing = (uid, key) => {
    if (!can('units', 'E')) return denied();
    const u = unit(uid); const b = u.listings[key];
    const next = { '掲載中': '停止', '停止': '未掲載', '未掲載': '掲載中', '停止確認待ち': '停止', '更新待ち': '掲載中' }[b];
    u.listings[key] = next;
    log('unit', uid, '掲載状態変更（デモ連携）', MEDIA.find((m) => m[0] === key)[1], b, next);
    if (!MEDIA.some(([k]) => u.listings[k] === '停止確認待ち')) closeTasks((t) => t.kind === 'listing-stop' && t.ref.id === uid);
    if (!MEDIA.some(([k]) => u.listings[k] === '更新待ち')) closeTasks((t) => ['listing-start', 'listing-update'].includes(t.kind) && t.ref.id === uid);
    commit(`${MEDIA.find((m) => m[0] === key)[1]}：${b} → ${next}`, ['※実際の媒体は更新されません（デモ連携／仕様要確認）']);
  };
  A.editUnit = (uid) => {
    if (!can('units', 'E')) return denied();
    const u = unit(uid);
    modal(`募集条件の変更：${unitName(u)}`, `
      <div class="form">
        <div><label>家賃（円）<span class="req">*</span></label><input id="fu-rent" type="number" value="${u.rent}"></div>
        <div><label>共益費（円）</label><input id="fu-fee" type="number" value="${u.fee}"></div>
        <div><label>AD（ヶ月）</label><input id="fu-ad" type="number" step="0.5" value="${u.ad}"></div>
        <div><label>入居可能日</label><input id="fu-av" type="date" value="${u.availableDate}"></div>
        <div class="full"><label>メモ<span class="opt">任意</span></label><input id="fu-note" type="text" value="${esc(u.note)}"></div>
      </div>
      <div class="note" style="margin-top:12px">変更前後の値・変更者・日時が履歴に残ります。掲載中の媒体は「更新待ち」になり、管理課に掲載更新タスクを生成します（媒体の実更新はしません）。</div>`,
      '保存する', () => {
        const nv = { rent: +val('fu-rent'), fee: +val('fu-fee'), ad: +val('fu-ad'), availableDate: val('fu-av'), note: val('fu-note') };
        if (!nv.rent) return '家賃を入力してください';
        const lbl = { rent: '家賃', fee: '共益費', ad: 'AD', availableDate: '入居可能日', note: 'メモ' };
        const fmt = { rent: num, fee: num, ad: adTxt, availableDate: ymd, note: (x) => x };
        const ch = [];
        Object.keys(nv).forEach((k) => { if (String(nv[k]) !== String(u[k])) { log('unit', uid, '募集条件変更', lbl[k], fmt[k](u[k]), fmt[k](nv[k])); ch.push(`${lbl[k]}：${fmt[k](u[k])} → ${fmt[k](nv[k])}`); u[k] = nv[k]; } });
        if (!ch.length) return null;
        const condChanged = ch.some((c) => /^(家賃|共益費|AD|入居可能日)/.test(c));
        if (condChanged && MEDIA.some(([k]) => u.listings[k] === '掲載中')) {
          MEDIA.forEach(([k]) => { if (u.listings[k] === '掲載中') u.listings[k] = '更新待ち'; });
          addTask('listing-update', `掲載情報更新：${unitName(u)}（募集条件変更）`, '管理課', u.assigneeId, TODAY, 'unit', uid);
          ch.push('掲載媒体を「更新待ち」にし、掲載更新タスクを生成');
        }
        UI.hl = uid; commit('募集条件を変更しました', ch, true);
      });
  };
  A.deleteRecord = (type, id) => {
    const mod = type === 'unit' ? 'units' : 'inquiries';
    if (!can(mod, 'E')) return denied();
    const name = type === 'unit' ? unitName(id) : cust(inq(id).customerId).name + ' 様の反響';
    modal('論理削除の確認', `
      <div class="note amber">「${esc(name)}」を一覧から非表示にします。データは削除されず「情報基盤 &gt; 論理削除」に残り、<b>経営者権限で復元</b>できます（誤操作防止のデモ表現）。</div>
      <div class="form" style="margin-top:12px"><div class="full"><label>削除理由<span class="req">*</span></label><input id="del-r" type="text" placeholder="例：重複登録のため"></div>
      <div class="full"><label>確認のため「削除」と入力<span class="req">*</span></label><input id="del-c" type="text"></div></div>`,
      '論理削除する', () => {
        if (!val('del-r')) return '削除理由を入力してください';
        if (val('del-c') !== '削除') return '確認欄に「削除」と入力してください';
        const rec = type === 'unit' ? unit(id) : inq(id);
        rec.deleted = true; rec.deletedAt = nowStamp(); rec.deletedBy = me(); rec.deleteReason = val('del-r');
        log(type, id, '論理削除', '状態', '有効', '削除済（' + val('del-r') + '）');
        if (type === 'unit') closeTasks((t) => t.ref.type === 'unit' && t.ref.id === id, 'cancel');
        else closeTasks((t) => t.ref.type === 'inquiry' && t.ref.id === id, 'cancel');
        UI.drawer = null; commit('論理削除しました', ['関連する未対応タスクは取消済みに変更', '情報基盤画面から復元できます']);
      }, 'warn');
  };
  A.restore = (type, id) => {
    if (!can('trash', 'A')) return denied('復元には経営者（承認権限）が必要です');
    const rec = type === 'unit' ? unit(id) : inq(id); rec.deleted = false;
    log(type, id, '復元', '状態', '削除済', '有効');
    commit('復元しました');
  };
  A.csvImport = () => {
    if (!can('units', 'E')) return denied();
    const diffs = S.extFeed.map((f, i) => ({ ...f, i, u: unit(f.unitId) })).filter((f) => f.u && !f.u.deleted && String(f.u[f.field]) !== String(f.value));
    const fmtv = (f, v) => f.field === 'rent' || f.field === 'fee' ? yen(v) : f.field === 'ad' ? adTxt(v) : f.field === 'availableDate' ? ymd(v) : v;
    modal('外部情報との差分確認（CSV取込デモ）', `
      <div class="note amber" style="margin-bottom:12px"><b>デモ連携／仕様要確認</b>　元付・業者間サイトから取得したCSVを想定した擬似データです。実際の取得方式（API／CSV／手動取込）は各サービスの仕様・利用規約の確認後に決定します。</div>
      ${diffs.length ? `<table class="tbl"><thead><tr><th><input type="checkbox" checked onchange="document.querySelectorAll('.dfx').forEach(x=>x.checked=this.checked)"></th><th>物件</th><th>管理会社</th><th>項目</th><th>現在値</th><th>外部情報</th><th>取得元</th></tr></thead><tbody>
      ${diffs.map((f) => `<tr><td><input type="checkbox" class="dfx" value="${f.i}" checked></td><td>${esc(unitName(f.u))}</td><td class="small">${esc(unitMgmt(f.u).name)}</td><td>${f.label}</td><td class="diff"><span class="b">${esc(fmtv(f, f.u[f.field]))}</span></td><td class="diff"><span class="a">${esc(fmtv(f, f.value))}</span>${f.memo ? `<div class="small muted">${esc(f.memo)}</div>` : ''}</td><td class="small muted">${esc(f.source)}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty">差分はありません（すべて反映済み）</div>'}`,
      diffs.length ? '選択した差分を反映' : null, () => {
        const sel = [...document.querySelectorAll('.dfx:checked')].map((x) => +x.value);
        if (!sel.length) return '反映する差分を選択してください';
        const fx = [];
        sel.forEach((i) => {
          const f = S.extFeed[i]; const u = unit(f.unitId);
          if (f.field === 'status') { const r = setUnitStatus(u.id, f.value); fx.push(`${unitName(u)}：${f.value}（${f.memo || ''}）`, ...r); }
          else { log('unit', u.id, 'CSV取込（デモ）', f.label, fmtv(f, u[f.field]), fmtv(f, f.value)); u[f.field] = f.value; fx.push(`${unitName(u)}：${f.label}を更新`);
            if (MEDIA.some(([k]) => u.listings[k] === '掲載中')) { MEDIA.forEach(([k]) => { if (u.listings[k] === '掲載中') u.listings[k] = '更新待ち'; }); addTask('listing-update', `掲載情報更新：${unitName(u)}（外部情報の変更）`, '管理課', u.assigneeId, TODAY, 'unit', u.id); } }
          u.lastConfirmed = TODAY;
        });
        commit(`${sel.length}件の差分を反映しました`, fx.slice(0, 6), true);
      }, null, true);
  };

  // ----- inquiries -----
  A.newInquiry = (unitId) => {
    if (!can('inquiries', 'E')) return denied('反響登録は仲介店舗・経営者の権限です。ロールを切り替えてください');
    const cand = liveUnits().filter((u) => u.status === '募集中');
    const agents = S.users.filter((u) => u.dept === '仲介');
    modal('反響登録', `
      <div class="form">
        <div><label>顧客名<span class="req">*</span></label><input id="fi-name" type="text" placeholder="例：山口 花子"></div>
        <div><label>電話番号<span class="opt">任意</span></label><input id="fi-tel" type="text" placeholder="090-0000-0000"></div>
        <div><label>流入媒体<span class="req">*</span></label><select id="fi-media">${['SUUMO', 'アットホーム', 'ピタットハウス', "HOME'S", '来店', '電話'].map((m) => `<option>${m}</option>`).join('')}</select></div>
        <div><label>担当者<span class="req">*</span></label><select id="fi-agent">${agents.map((a) => `<option value="${a.id}" ${a.id === (UI.role === 'chukai' ? me() : 'u04') ? 'selected' : ''}>${a.name}（${a.title}）</option>`).join('')}</select></div>
        <div class="full"><label>対象物件（募集中のみ表示＝管理課の最新状態）<span class="req">*</span></label><select id="fi-unit">${cand.map((u) => `<option value="${u.id}" ${u.id === unitId ? 'selected' : ''}>${esc(unitName(u))}｜${u.layout}｜${yen(u.rent)}</option>`).join('')}</select></div>
        <div><label>希望家賃（上限）<span class="opt">任意</span></label><input id="fi-budget" type="number" placeholder="80000"></div>
        <div><label>希望エリア<span class="opt">任意</span></label><input id="fi-area" type="text" placeholder="青葉区"></div>
        <div><label>希望間取り<span class="opt">任意</span></label><input id="fi-layout" type="text" placeholder="1LDK"></div>
        <div><label>入居希望日<span class="opt">任意</span></label><input id="fi-move" type="date"></div>
        <div class="full"><label>特記事項<span class="opt">任意</span></label><input id="fi-note" type="text"></div>
      </div>
      <div class="note" style="margin-top:12px">必須は4項目のみ。登録すると担当者に「初回対応」タスク（期限：本日）が自動生成されます。<br><span class="tag-demo">デモ連携／仕様要確認</span> ポータル反響の自動取込（ノマドクラウド代替）は仕様確認後に設計します。</div>`,
      '登録する', () => {
        if (!val('fi-name')) return '顧客名を入力してください';
        if (!val('fi-unit')) return '対象物件を選択してください';
        const cid = nextId('customer', 'c', 2);
        S.customers.push({ id: cid, name: val('fi-name'), tel: val('fi-tel'), email: '', budget: +val('fi-budget') || null, area: val('fi-area'), layout: val('fi-layout'), moveIn: val('fi-move') || null, note: val('fi-note'), deleted: false });
        const iid = nextId('inquiry', 'i', 2);
        const agent = val('fi-agent');
        S.inquiries.push({ id: iid, customerId: cid, unitId: val('fi-unit'), media: val('fi-media'), date: TODAY, agentId: agent, status: '新規反響', nextFollow: null, history: [{ at: nowStamp(), type: '反響', content: `${val('fi-media')}から問合せ（手動登録）`, userId: me() }], lostReason: '', deleted: false });
        log('inquiry', iid, '反響登録', '', '', `${val('fi-name')} 様／${unitName(val('fi-unit'))}`);
        addTask('first', `初回対応：${val('fi-name')} 様（${val('fi-media')}反響）`, '仲介', agent, TODAY, 'inquiry', iid);
        UI.view = 'inquiries'; UI.hl = iid; UI.drawer = { type: 'inquiry', id: iid };
        commit('反響を登録しました', [`${uname(agent)} に「初回対応」タスクを生成（期限：本日）`, 'ダッシュボードの未追客件数に反映'], true);
      });
  };
  A.inqStatus = (iid, st) => {
    if (!can('inquiries', 'E')) return denied();
    const i = inq(iid); const b = i.status; if (b === st) return;
    if (st === '申込') return A.registerApp(iid);
    if (st === '成約') return toast('「成約」は契約完了時に自動で設定されます');
    i.status = st; log('inquiry', iid, 'ステータス変更', '進捗', b, st);
    const fx = [];
    if (st === '失注') { const n = closeTasks((t) => t.ref.type === 'inquiry' && t.ref.id === iid, 'cancel'); i.nextFollow = null; if (n) fx.push(`関連タスク${n}件を取消`); }
    if (b === '新規反響') { closeTasks((t) => t.kind === 'first' && t.ref.id === iid); fx.push('初回対応タスクを完了'); }
    commit(`進捗を「${st}」に変更`, fx);
  };
  A.addActivity = (iid) => {
    if (!can('inquiries', 'E')) return denied();
    const i = inq(iid);
    const type = val('act-type'), content = val('act-content'), next = val('act-next');
    if (!content) return toast('対応内容を入力してください');
    i.history.push({ at: nowStamp(), type, content, userId: me() });
    log('inquiry', iid, '対応履歴追加', type, '', content);
    const fx = [];
    if (i.status === '新規反響') { i.status = '初回対応済'; log('inquiry', iid, 'ステータス変更', '進捗', '新規反響', '初回対応済'); fx.push('進捗を「初回対応済」に自動更新'); }
    if (type === '案内' && i.status === '内見予定') { i.status = '追客中'; log('inquiry', iid, 'ステータス変更', '進捗', '内見予定', '追客中'); fx.push('進捗を「追客中」に自動更新'); }
    closeTasks((t) => t.ref.type === 'inquiry' && t.ref.id === iid && ['first', 'follow'].includes(t.kind));
    if (next) {
      const b = i.nextFollow; i.nextFollow = next; log('inquiry', iid, '次回追客日設定', '次回追客日', ymd(b), ymd(next));
      addTask('follow', `追客：${cust(i.customerId).name} 様（${content.slice(0, 18)}${content.length > 18 ? '…' : ''}）`, '仲介', i.agentId, next, 'inquiry', iid);
      fx.push(`${uname(i.agentId)} に追客タスクを生成（期限：${md(next)}）`, 'ダッシュボードの本日のタスク・未追客件数に反映');
    } else { i.nextFollow = null; fx.push('次回追客日が未設定のため「未追客」として集計されます'); }
    commit('対応履歴を登録しました', fx, true);
  };
  A.editCustomer = (cid) => {
    if (!can('inquiries', 'E')) return denied();
    const c = cust(cid);
    modal(`顧客情報の編集：${c.name} 様`, `<div class="form">
      <div><label>顧客名</label><input id="fc-name" value="${esc(c.name)}"></div><div><label>電話番号</label><input id="fc-tel" value="${esc(c.tel)}"></div>
      <div><label>希望家賃（上限）</label><input id="fc-budget" type="number" value="${c.budget || ''}"></div><div><label>希望エリア</label><input id="fc-area" value="${esc(c.area)}"></div>
      <div><label>希望間取り</label><input id="fc-layout" value="${esc(c.layout)}"></div><div><label>入居希望日</label><input id="fc-move" type="date" value="${c.moveIn || ''}"></div>
      <div class="full"><label>特記事項</label><textarea id="fc-note">${esc(c.note)}</textarea></div></div>`, '保存する', () => {
      const nv = { name: val('fc-name'), tel: val('fc-tel'), budget: +val('fc-budget') || null, area: val('fc-area'), layout: val('fc-layout'), moveIn: val('fc-move') || null, note: val('fc-note') };
      const lbl = { name: '顧客名', tel: '電話番号', budget: '希望家賃', area: '希望エリア', layout: '希望間取り', moveIn: '入居希望日', note: '特記事項' };
      const iid = S.inquiries.find((i) => i.customerId === cid)?.id;
      let n = 0;
      Object.keys(nv).forEach((k) => { if (String(nv[k] ?? '') !== String(c[k] ?? '')) { if (iid) log('inquiry', iid, '顧客情報変更', lbl[k], c[k] ?? '', nv[k] ?? ''); c[k] = nv[k]; n++; } });
      commit(n ? '顧客情報を更新しました' : '変更はありません', n ? ['申込・契約・精算画面の顧客名にも反映'] : null);
    });
  };
  A.registerApp = (iid) => {
    if (!can('inquiries', 'E')) return denied();
    const i = inq(iid); const c = cust(i.customerId); const u = unit(i.unitId); const p = prop(u.propertyId); const mc = unitMgmt(u);
    const existing = liveCon().find((k) => conApp(k).unitId === u.id && !['完了', 'キャンセル'].includes(k.status));
    if (existing) return modal('申込登録できません', `<div class="note amber">${esc(unitName(u))} は既に申込（${existing.id}／${esc(conCust(existing).name)} 様）が進行中です。<br>二番手申込の扱いは<b>仕様要確認</b>のため、本デモでは登録不可としています。</div>`, null);
    if (!['募集中', '確認待ち'].includes(u.status)) return modal('申込登録できません', `<div class="note amber">${esc(unitName(u))} の募集状態が「${u.status}」です。管理課に募集状態をご確認ください。</div>`, null);
    modal('申込登録（反響から情報を引継ぎ）', `
      <div class="inherit"><div class="bold" style="margin-bottom:6px">▼ 自動で引き継がれる情報（再入力不要）</div>
        <dl class="kv2" style="margin:0"><dt>契約者</dt><dd>${esc(c.name)} 様</dd><dt>連絡先</dt><dd>${esc(c.tel || '—')}</dd>
        <dt>物件・号室</dt><dd>${esc(unitName(u))}</dd><dt>間取り</dt><dd>${u.layout}／${u.area}㎡</dd>
        <dt>家賃・共益費</dt><dd>${yen(u.rent)}／${yen(u.fee)}</dd><dt>AD</dt><dd>${adTxt(u.ad)}</dd>
        <dt>管理会社</dt><dd>${esc(mc.name)} ${mc.own ? '<span class="pill p-teal">自社管理</span>' : '<span class="pill p-amber">他社管理</span>'}</dd><dt>担当者</dt><dd>${esc(uname(i.agentId))}</dd>
        <dt>流入媒体</dt><dd>${esc(i.media)}</dd><dt>反響日</dt><dd>${ymd(i.date)}</dd></dl></div>
      <div class="form" style="margin-top:12px">
        <div><label>申込日<span class="req">*</span></label><input id="fa-date" type="date" value="${TODAY}"></div>
        <div><label>契約開始日（予定）<span class="req">*</span></label><input id="fa-start" type="date" value="${u.availableDate > TODAY ? u.availableDate : addDays(TODAY, 20)}"></div>
      </div>
      <div class="note" style="margin-top:12px">登録すると：①申込・契約案件を作成（審査中）　②物件を「申込中」に変更 → <b>管理課に掲載停止確認タスク</b>　③反響の進捗を「申込」に変更し追客タスクを完了</div>`,
      '申込を登録する', () => {
        if (!val('fa-start')) return '契約開始日を入力してください';
        const aid = nextId('app', 'A', 3);
        S.applications.push({ id: aid, inquiryId: iid, customerId: c.id, unitId: u.id, agentId: i.agentId, appliedAt: val('fa-date') });
        const kid = nextId('contract', 'K', 3);
        S.contracts.push({ id: kid, applicationId: aid, startDate: val('fa-start'), status: '審査中', checklist: { app: 'done', screening: 'todo', juji: 'todo', contract: 'todo', invoice: 'todo', payment: 'todo', docs: 'todo' }, backReason: {}, cancelReason: '', deleted: false });
        const b = i.status; i.status = '申込'; i.nextFollow = null;
        i.history.push({ at: nowStamp(), type: '申込', content: `申込受付（${kid}）`, userId: me() });
        log('contract', kid, '申込登録', '', '', '審査中');
        log('inquiry', iid, 'ステータス変更', '進捗', b, '申込');
        closeTasks((t) => t.ref.type === 'inquiry' && t.ref.id === iid);
        const fx = setUnitStatus(u.id, '申込中');
        u.note = `申込受付済（${kid}）`;
        UI.view = 'contracts'; UI.hl = kid; UI.drawer = { type: 'contract', id: kid };
        commit(`申込 ${kid} を登録しました`, ['顧客・物件・担当者・条件を引継ぎ', ...fx, '反響の進捗を「申込」に変更'], true);
      });
  };

  // ----- contracts -----
  function recomputeContract(c) {
    if (['キャンセル'].includes(c.status)) return [];
    const ck = c.checklist; const b = c.status; let st;
    const all = Object.values(ck).every((v) => v === 'done');
    if (all) st = '完了';
    else if (ck.screening !== 'done') st = '審査中';
    else if (ck.juji === 'todo' && ck.contract === 'todo') st = '契約準備中';
    else st = '契約手続中';
    const fx = [];
    if (st !== b) {
      c.status = st; log('contract', c.id, 'ステータス自動更新', '進捗', b, st, 'system');
      fx.push(`進捗を「${st}」に自動更新`);
      if (st === '完了') {
        const a = conApp(c); fx.push(...setUnitStatus(a.unitId, '契約済', { by: 'system' }));
        const i = inq(a.inquiryId); if (i) { const ib = i.status; i.status = '成約'; log('inquiry', i.id, 'ステータス自動更新', '進捗', ib, '成約', 'system'); fx.push('反響の進捗を「成約」に更新'); }
        closeTasks((t) => t.ref.type === 'contract' && t.ref.id === c.id);
      }
    }
    return fx;
  }
  A.check = (kid, key) => {
    if (!can('contracts', 'E')) return denied('申込・契約チェックは仲介店舗・管理課の権限です');
    const c = con(kid);
    if (c.status === 'キャンセル' || c.status === '完了') return toast('この案件は編集できません（' + c.status + '）');
    if (key === 'payment') return toast('「入金」は経理が入出金・精算画面で入金確認すると自動でチェックされます');
    const b = c.checklist[key]; const nv = b === 'done' ? 'todo' : 'done';
    if (key !== 'app' && key !== 'screening' && nv === 'done' && c.checklist.screening !== 'done') return toast('審査が完了していません');
    c.checklist[key] = nv;
    log('contract', kid, 'チェック更新', CK_L[key], b === 'done' ? '済' : b === 'back' ? '差戻し' : '未', nv === 'done' ? '済' : '未');
    const fx = [];
    if (b === 'back') { delete c.backReason[key]; if (!Object.values(c.checklist).includes('back')) closeTasks((t) => t.kind === 'doc-back' && t.ref.id === kid); fx.push('差戻し対応タスクを完了'); }
    if (key === 'invoice' && nv === 'done') fx.push(...createSettlement(c));
    fx.push(...recomputeContract(c));
    UI.hl = kid; commit(`${CK_L[key]}：${nv === 'done' ? '済' : '未'}`, fx, fx.length > 0);
  };
  function createSettlement(c) {
    if (stlForCon(c.id)) return ['既存の精算レコードを更新対象として経理へ通知'];
    const u = conUnit(c); const mc = unitMgmt(u); const a = conApp(c);
    const initial = Math.round((u.rent + u.fee) * 4 / 1000) * 1000;
    const broker = Math.round(u.rent * 1.1);
    const ad = Math.round(u.rent * u.ad);
    const sid = nextId('settlement', 'S', 3);
    const s = { id: sid, contractId: c.id, initialCost: initial, brokerFee: broker, ad, adPayOther: 0, billAmount: initial, remitAmount: mc.own ? 0 : initial - broker - ad,
      payDue: addDays(c.startDate, -5) > TODAY ? addDays(c.startDate, -5) : addDays(TODAY, 5), payConfirmed: null, payStatus: '未請求', accountingChecked: false,
      remitTo: mc.own ? '（オーナー送金は賃貸革命で処理）' : mc.name, remitDue: mc.own ? null : addDays(c.startDate, 10), remittedAt: null, remitStatus: mc.own ? '対象外' : '未送金',
      attachInvoice: true, attachStatement: false, deleted: false };
    S.settlements.push(s);
    log('settlement', sid, '精算レコード生成', '', '', '請求書登録により自動生成', 'system');
    addTask('acct-check', `経理確認：${c.id} ${conCust(c).name} 様 請求内容・入金期日`, '経理', 'u07', TODAY, 'settlement', sid);
    return [`精算レコード ${sid} を自動生成（契約・物件・管理会社を引継ぎ）`, '経理 遠藤 に「経理確認」タスクを生成'];
  }
  A.backDoc = (kid, key) => {
    if (!can('contracts', 'E')) return denied();
    const c = con(kid);
    modal(`書類差戻し：${CK_L[key]}`, `<div class="form"><div class="full"><label>差戻し理由<span class="req">*</span></label><input id="fb-r" type="text" placeholder="例：保証会社書類の記載漏れ"></div></div>`, '差戻しにする', () => {
      if (!val('fb-r')) return '理由を入力してください';
      const b = c.checklist[key]; c.checklist[key] = 'back'; c.backReason[key] = val('fb-r');
      log('contract', kid, '書類差戻し', CK_L[key], b === 'done' ? '済' : '未', '差戻し（' + val('fb-r') + '）');
      const ag = conApp(c).agentId;
      addTask('doc-back', `書類差戻し対応：${CK_L[key]}（${kid} ${conCust(c).name} 様）`, '仲介', ag, addDays(TODAY, 1), 'contract', kid);
      const fx = recomputeContract(c);
      commit('差戻しを登録しました', [`担当 ${uname(ag)} に差戻し対応タスクを生成`, 'ダッシュボードの「書類不足」アラートに表示', ...fx], true);
    }, 'warn');
  };
  A.editContract = (kid) => {
    if (!can('contracts', 'E')) return denied();
    const c = con(kid);
    modal(`契約情報の編集：${kid}`, `<div class="form"><div><label>契約開始日</label><input id="fk-start" type="date" value="${c.startDate}"></div>
      <div><label>担当者</label><select id="fk-agent">${S.users.filter((u) => u.dept === '仲介').map((u) => `<option value="${u.id}" ${u.id === conApp(c).agentId ? 'selected' : ''}>${u.name}</option>`).join('')}</select></div></div>
      <div class="note" style="margin-top:10px">担当者を変更しても、過去の対応履歴・変更履歴は元の担当者名のまま保持されます。</div>`, '保存する', () => {
      const a = conApp(c); const fx = [];
      if (val('fk-start') !== c.startDate) { log('contract', kid, '契約条件変更', '契約開始日', ymd(c.startDate), ymd(val('fk-start'))); c.startDate = val('fk-start'); fx.push('契約開始日を変更'); }
      if (val('fk-agent') !== a.agentId) { log('contract', kid, '担当者変更', '担当者', uname(a.agentId), uname(val('fk-agent'))); a.agentId = val('fk-agent'); S.tasks.filter((t) => t.status === 'open' && t.ref.type === 'contract' && t.ref.id === kid).forEach((t) => (t.assigneeId = a.agentId)); fx.push('担当者を変更（未対応タスクも引継ぎ）'); }
      commit(fx.length ? '契約情報を更新しました' : '変更はありません', fx);
    });
  };
  A.cancelContract = (kid) => {
    if (!can('contracts', 'E')) return denied();
    const c = con(kid); const u = conUnit(c);
    modal(`申込キャンセル：${kid}`, `
      <div class="note amber"><b>キャンセル時の動き（仮仕様）</b><br>・物件は<b>自動で再募集しません</b>。「確認待ち」にして管理課へ募集再開判断タスクを生成します<br>・案件の未対応タスクは取消、精算がある場合は経理へキャンセル精算確認タスクを生成します<br>・募集再開の判断権限は<b>要確認</b>事項です</div>
      <div class="form" style="margin-top:12px"><div class="full"><label>キャンセル理由<span class="req">*</span></label><input id="fx-r" type="text" placeholder="例：申込者都合（転勤取りやめ）"></div></div>`,
      'キャンセルを確定', () => {
        if (!val('fx-r')) return '理由を入力してください';
        const b = c.status; c.status = 'キャンセル'; c.cancelReason = val('fx-r');
        log('contract', kid, 'キャンセル', '進捗', b, 'キャンセル（' + val('fx-r') + '）');
        const fx = [];
        const n = closeTasks((t) => t.ref.type === 'contract' && t.ref.id === kid, 'cancel'); if (n) fx.push(`案件の未対応タスク${n}件を取消`);
        fx.push(...setUnitStatus(u.id, '確認待ち', { by: 'system' }));
        u.note = `申込キャンセル（${kid}）。募集再開は管理課判断待ち`;
        addTask('relist-judge', `募集再開判断：${unitName(u)}（申込キャンセル）`, '管理課', u.assigneeId, TODAY, 'unit', u.id);
        fx.push(`物件を「確認待ち」に変更（自動再募集はしない）`, `管理課 ${uname(u.assigneeId)} に募集再開判断タスクを生成`);
        const s = stlForCon(kid);
        if (s) { const pb = s.payStatus; s.payStatus = 'キャンセル'; log('settlement', s.id, 'キャンセル連動', '入金ステータス', pb, 'キャンセル', 'system'); closeTasks((t) => t.ref.type === 'settlement' && t.ref.id === s.id, 'cancel');
          addTask('cancel-settle', `キャンセル精算確認：${kid}（返金・請求取消の要否）`, '経理', 'u07', addDays(TODAY, 1), 'settlement', s.id); fx.push('経理にキャンセル精算確認タスクを生成'); }
        const i = inq(conApp(c).inquiryId); if (i) { const ib = i.status; i.status = '追客中'; i.nextFollow = addDays(TODAY, 3); log('inquiry', i.id, 'ステータス変更', '進捗', ib, '追客中', 'system'); addTask('follow', `追客：${cust(i.customerId).name} 様（キャンセル後の再提案）`, '仲介', i.agentId, i.nextFollow, 'inquiry', i.id); fx.push('反響を「追客中」に戻し再提案タスクを生成'); }
        commit(`${kid} をキャンセルしました`, fx, true);
      }, 'warn');
  };

  // ----- settlements -----
  A.acctCheck = (sid) => {
    if (!can('settlements', 'E')) return denied('経理確認は経理の権限です。ロールを「経理」に切り替えてください');
    const s = stl(sid);
    if (!s.attachInvoice) return toast('請求書が未添付です');
    s.accountingChecked = true; const b = s.payStatus; if (s.payStatus === '未請求') s.payStatus = '入金待ち';
    log('settlement', sid, '経理確認', '経理確認', '未', '済'); if (b !== s.payStatus) log('settlement', sid, 'ステータス変更', '入金ステータス', b, s.payStatus);
    closeTasks((t) => t.kind === 'acct-check' && t.ref.id === sid);
    addTask('pay-confirm', `入金確認：${s.contractId} ${conCust(stlCon(s)).name} 様（期日 ${md(s.payDue)}）`, '経理', 'u07', s.payDue, 'settlement', sid);
    commit('経理確認を完了しました', ['入金ステータスを「入金待ち」に変更', `入金確認タスクを生成（期日：${md(s.payDue)}）`], true);
  };
  A.payConfirm = (sid) => {
    if (!can('settlements', 'E')) return denied('入金確認は経理の権限です');
    const s = stl(sid); const c = stlCon(s);
    modal(`入金確認：${s.contractId}`, `<div class="form"><div><label>入金確認日</label><input id="fp-d" type="date" value="${TODAY}"></div><div><label>入金額</label><input id="fp-a" type="number" value="${s.billAmount}"></div></div>
      <div class="note" style="margin-top:10px"><span class="tag-demo">デモ連携／仕様要確認</span> 銀行明細との自動消込は連携条件の確認後に検討します。本デモでは手動確認です。</div>`, '入金済にする', () => {
      const amt = +val('fp-a'); const fx = [];
      const b = s.payStatus; s.payStatus = '入金済'; s.payConfirmed = val('fp-d');
      log('settlement', sid, '入金確認', '入金ステータス', b, '入金済');
      if (amt !== s.billAmount) { log('settlement', sid, '入金差異', '入金額', num(s.billAmount), num(amt)); fx.push(`請求額との差異 ${yen(amt - s.billAmount)}：要確認（部分入金の扱いは仕様要確認）`); }
      closeTasks((t) => t.ref.id === sid && ['pay-confirm', 'acct-check'].includes(t.kind));
      if (c.status !== 'キャンセル') { const pb = c.checklist.payment; c.checklist.payment = 'done'; log('contract', c.id, 'チェック更新（経理連動）', '入金', pb === 'done' ? '済' : '未', '済', 'system'); fx.push(`契約 ${c.id} の「入金」チェックを自動で済に`); fx.push(...recomputeContract(c)); }
      if (s.remitStatus === '未送金') { s.remitStatus = '送金予定'; addTask('remit', `送金：${s.remitTo} へ ${s.contractId} 精算分`, '経理', 'u07', s.remitDue || addDays(TODAY, 7), 'settlement', sid); fx.push('他社管理物件のため送金タスクを生成'); }
      else if (s.remitStatus === '送金予定') { const t = S.tasks.find((t) => t.status === 'open' && t.kind === 'remit' && t.ref.id === sid); if (t) t.title = t.title.replace('（入金確認後）', ''); }
      commit('入金を確認しました', fx, true);
    });
  };
  A.remitDone = (sid) => {
    if (!can('settlements', 'E')) return denied();
    const s = stl(sid);
    if (s.payStatus !== '入金済') return toast('入金確認前のため送金できません（相殺・先払いの扱いは要確認）');
    const b = s.remitStatus; s.remitStatus = '送金済'; s.remittedAt = TODAY;
    log('settlement', sid, '送金登録', '送金ステータス', b, '送金済');
    closeTasks((t) => t.kind === 'remit' && t.ref.id === sid);
    commit('送金済に更新しました', [`${s.remitTo} へ ${yen(s.remitAmount)}（送金日 ${md(TODAY)}）`]);
  };
  A.toggleAttach = (sid, k) => {
    if (!can('settlements', 'E') && !can('contracts', 'E')) return denied();
    const s = stl(sid); const b = s[k]; s[k] = !b;
    log('settlement', sid, '添付状態変更', k === 'attachInvoice' ? '請求書' : '精算書', b ? '添付済' : '未添付', s[k] ? '添付済' : '未添付');
    commit((k === 'attachInvoice' ? '請求書' : '精算書') + (s[k] ? 'を添付済にしました' : 'を未添付にしました'), ['※ファイル実体は保存しません（デモ）']);
  };
  A.editSettlement = (sid) => {
    if (!can('settlements', 'E')) return denied();
    const s = stl(sid);
    const F = [['initialCost', '初期費用'], ['brokerFee', '仲介手数料'], ['ad', '自社受領AD'], ['adPayOther', '他社支払AD'], ['billAmount', '請求額'], ['remitAmount', '送金予定額']];
    modal(`金額・期日の編集：${s.contractId}`, `<div class="form">${F.map(([k, l]) => `<div><label>${l}（円）</label><input id="fs-${k}" type="number" value="${s[k]}"></div>`).join('')}
      <div><label>入金期日</label><input id="fs-payDue" type="date" value="${s.payDue || ''}"></div><div><label>送金予定日</label><input id="fs-remitDue" type="date" value="${s.remitDue || ''}"></div></div>
      <div class="note purple" style="margin-top:10px"><b>仮仕様</b>：他社管理物件の精算・相殺・AD計算の正式ルールは未確認です。金額は手入力で保持し、計算式を確定仕様として扱いません。</div>`, '保存する', () => {
      const ch = [];
      F.forEach(([k, l]) => { const v = +val('fs-' + k); if (v !== s[k]) { log('settlement', sid, '金額変更', l, num(s[k]), num(v)); ch.push(`${l}：${num(s[k])} → ${num(v)}`); s[k] = v; } });
      [['payDue', '入金期日'], ['remitDue', '送金予定日']].forEach(([k, l]) => { const v = val('fs-' + k) || null; if (v !== s[k]) { log('settlement', sid, '期日変更', l, ymd(s[k]), ymd(v)); ch.push(`${l}：${ymd(s[k])} → ${ymd(v)}`); s[k] = v;
        const t = S.tasks.find((t) => t.status === 'open' && t.ref.id === sid && (k === 'payDue' ? t.kind === 'pay-confirm' : t.kind === 'remit')); if (t && v) t.due = v; } });
      commit(ch.length ? '精算情報を更新しました' : '変更はありません', ch);
    });
  };

  // ----- manual task -----
  A.newTask = () => {
    const dept = ROLES[UI.role].dept || '管理課';
    modal('タスク登録', `<div class="form">
      <div class="full"><label>タスク内容<span class="req">*</span></label><input id="ft-t" type="text" placeholder="例：オーナーへ募集条件の見直しを提案"></div>
      <div><label>部門</label><select id="ft-d">${['管理課', '仲介', '経理'].map((d) => `<option ${d === dept ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
      <div><label>担当者</label><select id="ft-a">${S.users.filter((u) => u.dept !== '経営').map((u) => `<option value="${u.id}" ${u.id === me() ? 'selected' : ''}>${u.name}（${u.dept}）</option>`).join('')}</select></div>
      <div><label>期限</label><input id="ft-due" type="date" value="${TODAY}"></div>
      <div><label>関連物件<span class="opt">任意</span></label><select id="ft-u"><option value="">—</option>${liveUnits().map((u) => `<option value="${u.id}">${esc(unitName(u))}</option>`).join('')}</select></div></div>`, '登録する', () => {
      if (!val('ft-t')) return 'タスク内容を入力してください';
      const t = { id: nextId('task', 't', 3), kind: 'manual', title: val('ft-t'), dept: val('ft-d'), assigneeId: val('ft-a'), due: val('ft-due'), status: 'open', ref: val('ft-u') ? { type: 'unit', id: val('ft-u') } : { type: 'none', id: '' }, auto: false, createdAt: nowStamp(), doneAt: null };
      S.tasks.push(t); log('task', t.id, 'タスク登録', '', '', t.title);
      commit('タスクを登録しました', [`${uname(t.assigneeId)}（期限 ${md(t.due)}）`]);
    });
  };

  // ----- before/after -----
  A.ba = (i) => { UI.baScenario = i; UI.baStep = 0; render(); };
  A.baStep = (d) => { const max = 5; UI.baStep = Math.max(0, Math.min(max, UI.baStep + d)); render(); };
  A.baSet = (n) => { UI.baStep = n; render(); };
  A.p17 = (t) => { UI.p17tab = t; render(); };
  A.trace = (id) => { UI.traceId = id; save(); render(); };
  A.guide = () => openGuide();

  function denied(msg) { toast('権限がありません（デモ）', [msg || `${ROLES[UI.role].label}ロールでは編集できません。権限は仮仕様です`]); }

  // =========================================================
  //  MODAL / DRAWER infra
  // =========================================================
  const val = (id) => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
  let modalCb = null;
  function modal(title, body, okLabel, onOk, okCls, wide) {
    modalCb = onOk;
    document.getElementById('modal-root').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)App._mc()"><div class="modal ${wide ? 'wide' : ''}">
      <div class="m-h"><h3>${esc(title)}</h3></div><div class="m-b">${body}<div id="m-err" class="small" style="color:var(--red);margin-top:8px"></div></div>
      <div class="m-f"><button class="btn" onclick="App._mc()">${okLabel ? 'キャンセル' : '閉じる'}</button>${okLabel ? `<button class="btn ${okCls === 'warn' ? 'warn' : 'pri'}" onclick="App._mo()">${esc(okLabel)}</button>` : ''}</div></div></div>`;
    const f = document.querySelector('.modal input,.modal select'); if (f) setTimeout(() => f.focus(), 30);
  }
  function confirmModal(title, text, ok, fn) { modal(title, `<div>${esc(text)}</div>`, ok, () => { fn(); }, 'warn'); }
  A._mc = () => { document.getElementById('modal-root').innerHTML = ''; modalCb = null; };
  A._mo = () => { if (!modalCb) return A._mc(); const r = modalCb(); if (typeof r === 'string') { document.getElementById('m-err').textContent = r; return; } A._mc(); };
  function openDrawer(type, id) { UI.drawer = { type, id }; UI.searchOpen = false; UI.notifOpen = false; UI.q = ''; render(); }

  // =========================================================
  //  RENDER
  // =========================================================
  const NAV = [
    ['dash', 'ダッシュボード', '▦', 'P11'],
    ['units', '空室・募集管理', '⌂', 'P12'],
    ['inquiries', '反響・追客管理', '☎', 'P13'],
    ['contracts', '申込・契約進捗', '✓', 'P14'],
    ['settlements', '入出金・精算', '¥', 'P15'],
    ['ba', 'Before／After', '⇄', 'P16'],
    ['base', '情報基盤・権限／履歴', '⛁', 'P17'],
  ];
  function render() {
    const ae = document.activeElement; const fid = ae && ae.id; const pos = ae && ae.selectionStart;
    renderSidebar(); renderHeader(); renderMain(); renderDrawer();
    if (fid) { const e = document.getElementById(fid); if (e && e !== document.activeElement) { e.focus(); try { if (pos != null) e.setSelectionRange(pos, pos); } catch (x) {} } }
    if (UI.hl) { const h = UI.hl; UI.hl = null; setTimeout(() => { const r = document.querySelector(`[data-row="${h}"]`); if (r) { r.classList.add('hl'); r.scrollIntoView({ block: 'nearest' }); } }, 30); }
  }
  function renderSidebar() {
    const dept = ROLES[UI.role].dept;
    const badges = {
      dash: openTaskCount(dept),
      units: liveUnits().filter(confirmOver).length,
      inquiries: liveInq().filter(unfollowed).length,
      contracts: liveCon().filter(docShort).length,
      settlements: liveStl().filter(payOver).length,
    };
    document.getElementById('sidebar').innerHTML = `
      <div class="brand"><div class="logo"><div class="mark">ひ</div><div>ひらく 業務基盤<div style="font-size:10.5px;font-weight:500;color:#9fb0c9">DoX Prototype</div></div></div>
        <div class="sub">物件 → 反響 → 申込 → 契約 → 精算 を一つの流れで</div></div>
      <nav class="nav"><div class="sec">業務画面</div>
        ${NAV.map(([k, l, ic, pg], idx) => (idx === 5 ? '<div class="sec">提案・基盤</div>' : '') + `<button class="${UI.view === k ? 'active' : ''}" onclick="App.go('${k}')"><span class="ic">${ic}</span>${l}${badges[k] ? `<span class="badge">${badges[k]}</span>` : ''}<span class="pg">${pg}</span></button>`).join('')}
      </nav>
      <div class="side-foot">デモ日付：${ymd(TODAY)}（${wd(TODAY)}）<br>データはこのブラウザにのみ保存
        <button onclick="App.guide()">？ デモの進め方・実装範囲</button>
        <button onclick="App.reset()">↺ デモを初期化</button></div>`;
  }
  function renderSearchDD() {
    const box = document.getElementById('search-dd'); if (!box) return;
    let results = [];
    const q = UI.q.trim();
    if (q) {
      const m = (s) => String(s || '').toLowerCase().includes(q.toLowerCase());
      liveUnits().forEach((u) => { if (m(unitName(u)) || m(prop(u.propertyId).address) || m(unitMgmt(u).name)) results.push({ k: '物件', t: unitName(u), s: `${u.status}｜${yen(u.rent)}｜${unitMgmt(u).name}`, go: `App.go('units');App.open('unit','${u.id}')` }); });
      liveInq().forEach((i) => { const c = cust(i.customerId); if (m(c.name) || m(c.tel)) results.push({ k: '顧客', t: c.name + ' 様', s: `${i.status}｜${unitName(i.unitId)}`, go: `App.go('inquiries');App.open('inquiry','${i.id}')` }); });
      liveCon().forEach((c) => { if (m(c.id) || m(conCust(c).name)) results.push({ k: '契約', t: `${c.id} ${conCust(c).name} 様`, s: `${c.status}｜${unitName(conUnit(c))}`, go: `App.go('contracts');App.open('contract','${c.id}')` }); });
      liveStl().forEach((s) => { if (m(s.id) || m(s.remitTo)) results.push({ k: '精算', t: `${s.id}（${s.contractId}）`, s: `${s.payStatus}｜${s.remitTo}`, go: `App.go('settlements');App.open('settlement','${s.id}')` }); });
      results = results.slice(0, 12);
    }
    box.innerHTML = UI.searchOpen && q ? `<div class="dropdown">${results.length ? results.map((r) => `<div class="dd-item" onmousedown="${r.go}"><span class="pill p-navy">${r.k}</span><div><div class="bold">${esc(r.t)}</div><div class="small muted">${esc(r.s)}</div></div></div>`).join('') : '<div class="dd-empty">該当なし</div>'}</div>` : '';
  }
  function renderHeader() {
    const dept = ROLES[UI.role].dept;
    const myTasks = S.tasks.filter((t) => t.status === 'open' && (!dept || t.dept === dept) && t.due <= addDays(TODAY, 1)).sort((a, b) => a.due.localeCompare(b.due));
    const al = alerts().filter((a) => a.roles.includes(UI.role) && a.items.length);
    const ncount = myTasks.filter((t) => t.due <= TODAY).length + al.length;
    document.getElementById('header').innerHTML = `
      <div class="role-switch" title="ロール切替（デモ）">${ROLE_ORDER.map((r) => `<button class="${UI.role === r ? 'active' : ''}" onclick="App.role('${r}')"><span class="dot"></span>${ROLES[r].label}</button>`).join('')}</div>
      <div class="search"><span class="s-ic">⌕</span><input id="gsearch" type="text" placeholder="物件名・顧客名・契約番号で横断検索" value="${esc(UI.q)}" oninput="App.q(this.value)" onfocus="App.toggleSearch(true)" onblur="setTimeout(()=>App.toggleSearch(false),180)">
<div id="search-dd"></div></div>
      <div class="hdr-right">
        <div style="position:relative"><button class="icon-btn" onclick="App.notif()" title="通知">🔔${ncount ? `<span class="cnt">${ncount}</span>` : ''}</button>
          ${UI.notifOpen ? `<div class="notif"><h4>通知（${ROLES[UI.role].label}）</h4>
            ${al.map((a) => `<div class="n-item" onclick="App.go('${a.view}')"><span class="pill ${a.cls}">${a.label}</span> ${a.items.length}件　<span class="muted small">${esc(a.items[0].t)} ほか</span></div>`).join('')}
            ${myTasks.map((t) => `<div class="n-item" onclick="App.openTask('${t.id}')"><span class="due ${t.due < TODAY ? 'over' : t.due === TODAY ? 'today' : ''}">${t.due < TODAY ? '期限超過' : t.due === TODAY ? '本日' : '明日'}</span>　${esc(t.title)}</div>`).join('')}
            ${!al.length && !myTasks.length ? '<div class="empty">新しい通知はありません</div>' : ''}
            <div class="small muted" style="padding:8px 14px">※Slack等への通知配信はデモ連携／仕様要確認</div></div>` : ''}</div>
        <div class="me"><div class="avatar">${uname(me()).slice(0, 1)}</div><div><div class="bold" style="color:var(--ink)">${uname(me())}</div><div>${esc(user(me()).title)}</div></div></div>
      </div>`;
    renderSearchDD();
  }
  function pageHead(pg, title, purpose, actions) {
    return `<div class="page-head"><div><div class="pg-no">${pg}</div><h1>${title}</h1><div class="purpose">${purpose}</div></div><div class="actions">${actions || ''}</div></div>`;
  }
  function renderMain() {
    const m = document.getElementById('main');
    const V = { dash: viewDash, units: viewUnits, inquiries: viewInquiries, contracts: viewContracts, settlements: viewSettlements, ba: viewBA, base: viewBase };
    m.innerHTML = (V[UI.view] || viewDash)();
  }
  const uStPill = (s) => `<span class="pill ${{ '募集中': 'p-teal', '申込中': 'p-blue', '契約済': 'p-green', '募集停止': 'p-gray', '確認待ち': 'p-amber' }[s]}">${s}</span>`;
  const iStPill = (s) => `<span class="pill ${{ '新規反響': 'p-red', '初回対応済': 'p-blue', '内見予定': 'p-navy', '追客中': 'p-amber', '申込': 'p-teal', '成約': 'p-green', '失注': 'p-gray' }[s]}">${s}</span>`;
  const cStPill = (s) => `<span class="pill ${{ '審査中': 'p-amber', '契約準備中': 'p-blue', '契約手続中': 'p-navy', '完了': 'p-green', 'キャンセル': 'p-gray' }[s]}">${s}</span>`;
  const payPill = (s) => { if (payOver(s)) return '<span class="pill p-red">期限超過</span>'; return `<span class="pill ${{ '未請求': 'p-gray', '入金待ち': 'p-amber', '入金済': 'p-green', 'キャンセル': 'p-gray' }[s.payStatus]}">${s.payStatus}</span>`; };
  const remitPill = (s) => `<span class="pill ${{ '未送金': 'p-gray', '送金予定': 'p-amber', '送金済': 'p-green', '対象外': 'p-outline' }[s.remitStatus]}">${s.remitStatus}</span>`;
  const mgmtPill = (u) => isOwn(u) ? '<span class="pill p-teal">自社</span>' : '<span class="pill p-amber">他社</span>';
  const lstCls = { '掲載中': 'on', '停止': 'off', '未掲載': 'none', '停止確認待ち': 'wait', '更新待ち': 'upd' };
  const lstShort = { 'suumo': 'S', 'athome': 'A', 'pitat': 'P' };
  function listingChips(u, clickable) {
    return `<span class="lst">${MEDIA.map(([k, l]) => `<span class="m ${lstCls[u.listings[k]]}" title="${l}：${u.listings[k]}" ${clickable ? `onclick="event.stopPropagation();App.cycleListing('${u.id}','${k}')"` : ''}>${lstShort[k]} ${u.listings[k] === '掲載中' ? '●' : u.listings[k] === '停止確認待ち' ? '停止待' : u.listings[k] === '更新待ち' ? '更新待' : u.listings[k] === '停止' ? '停止' : '—'}</span>`).join('')}</span>`;
  }
  function dueTxt(d) { if (!d) return '<span class="muted">—</span>'; const n = diffDays(d, TODAY); if (n < 0) return `<span class="due over">${md(d)}（${-n}日超過）</span>`; if (n === 0) return `<span class="due today">本日</span>`; return `<span class="due">${md(d)}${n <= 3 ? `（あと${n}日）` : ''}</span>`; }
  function sortRows(tbl, rows, getters) {
    const s = UI.sort[tbl]; if (!s || !getters[s.key]) return rows;
    return rows.slice().sort((a, b) => { const x = getters[s.key](a), y = getters[s.key](b); return (x > y ? 1 : x < y ? -1 : 0) * s.dir; });
  }
  const th = (tbl, key, label, cls) => { const s = UI.sort[tbl]; return `<th class="sortable ${cls || ''}" onclick="App.sort('${tbl}','${key}')">${label}${s && s.key === key ? (s.dir === 1 ? ' ▲' : ' ▼') : ''}</th>`; };
  const deptPill = (d) => `<span class="pill ${{ '管理課': 'p-navy', '仲介': 'p-teal', '経理': 'p-amber' }[d] || 'p-gray'}">${d}</span>`;
  const KIND_L = { 'listing-stop': '掲載停止確認', 'listing-start': '掲載再開', 'listing-update': '掲載更新', first: '初回対応', follow: '追客', 'doc-back': '書類差戻し', 'acct-check': '経理確認', 'pay-confirm': '入金確認', remit: '送金', 'relist-judge': '募集再開判断', 'ext-check': '元付確認', 'cancel-settle': 'キャンセル精算', manual: '手動' };
  function refLabel(t) {
    const r = t.ref;
    if (r.type === 'unit') return unitName(r.id);
    if (r.type === 'inquiry') { const i = inq(r.id); return i ? cust(i.customerId).name + ' 様' : ''; }
    if (r.type === 'contract') return r.id;
    if (r.type === 'settlement') return r.id;
    return '';
  }
  function taskRow(t) {
    const done = t.status !== 'open';
    return `<div class="task ${done ? 'done' : ''}"><div class="chk" onclick="App.taskDone('${t.id}')" title="${done ? '未対応に戻す' : '完了にする'}">${done ? '✓' : ''}</div>
      <div style="min-width:0;flex:1"><div class="t-title" onclick="${t.ref.type !== 'none' ? `App.openTask('${t.id}')` : ''}">${esc(t.title)}</div>
      <div class="t-meta">${deptPill(t.dept)}<span>担当 ${esc(uname(t.assigneeId))}</span>${t.auto ? '<span class="tag-num">自動生成</span>' : ''}<span>${KIND_L[t.kind] || ''}</span>${t.status === 'cancel' ? '<span class="pill p-gray">取消</span>' : ''}</div></div>
      <div class="due">${done ? `<span class="muted">${t.status === 'cancel' ? '取消' : '完了'} ${t.doneAt ? t.doneAt.slice(11) : ''}</span>` : dueTxt(t.due)}</div></div>`;
  }

  // ---------- P11 Dashboard ----------
  function viewDash() {
    const k = kpis(); const al = alerts();
    const tasks = roleTasks(false);
    const doneToday = roleTasks(true).filter((t) => t.status === 'done' && t.doneAt && t.doneAt.startsWith(TODAY));
    const r = UI.role;
    const assignees = S.users.filter((u) => !ROLES[r].dept || u.dept === ROLES[r].dept).filter((u) => u.dept !== '経営');
    const roleMsg = { exec: '全部門・全店舗の状況と未処理を横断で確認できます', kanri: '空室確認・掲載停止・募集再開判断など、管理課のタスクを期限順に表示', chukai: '反響・追客・申込書類など、仲介店舗のタスクを期限順に表示', keiri: '経理確認・入金確認・送金など、経理のタスクを期限順に表示' }[r];
    const recent = S.logs.slice().reverse().filter((l) => l.entity !== 'task').slice(0, 8);
    const KP = [
      ['recruiting', '募集中物件', '室', 'units', '管理課が更新した最新状態', { u_st: '募集中' }],
      ['applying', '申込中', '件', 'contracts', '審査中＋契約準備中', { c_st: 'active' }],
      ['contracting', '契約手続中', '件', 'contracts', '重説・契約書の手続中', { c_st: '契約手続中' }],
      ['unfollowed', '未追客', '件', 'inquiries', '次回追客日なし／本日以前', { i_st: 'unfollowed' }],
      ['payWait', '入金確認待ち', '件', 'settlements', '未請求＋入金待ち', { s_st: 'wait' }],
    ];
    const prevK = window.__prevK || {}; window.__prevK = k;
    // exec: store/department summary
    let execPanel = '';
    if (r === 'exec') {
      const rows = S.stores.map((st) => {
        const is = liveInq().filter((i) => storeOfUser(i.agentId) === st.id);
        const cs = liveCon().filter((c) => storeOfUser(conApp(c).agentId) === st.id);
        const ss = liveStl().filter((s) => storeOfUser(conApp(stlCon(s)).agentId) === st.id && s.payStatus !== 'キャンセル');
        const forecast = cs.filter((c) => !['キャンセル', '完了'].includes(c.status)).reduce((a, c) => { const u = conUnit(c); return a + Math.round(u.rent * 1.1) + Math.round(u.rent * u.ad); }, 0);
        const booked = ss.reduce((a, s) => a + s.brokerFee + s.ad, 0);
        return { st, act: is.filter((i) => INQ_ACTIVE.includes(i.status)).length, unf: is.filter(unfollowed).length, con: cs.filter((c) => !['キャンセル', '完了'].includes(c.status)).length, done: cs.filter((c) => c.status === '完了').length, forecast, booked };
      });
      const deptRows = ['管理課', '仲介', '経理'].map((d) => ({ d, open: S.tasks.filter((t) => t.status === 'open' && t.dept === d).length, over: S.tasks.filter((t) => t.status === 'open' && t.dept === d && t.due < TODAY).length }));
      execPanel = `<div class="grid g2" style="margin-top:14px">
        <div class="card"><div class="card-h"><h3>店舗別 状況・売上見込</h3><span class="tag-demo">デモ数値</span><span class="sub">仲介手数料＋AD（デモデータから集計）</span></div>
          <div class="tbl-wrap"><table class="tbl store-tbl"><thead><tr><th>店舗</th><th>追客中反響</th><th>未追客</th><th>進行中案件</th><th>完了</th><th>売上見込（進行中）</th><th>計上済（精算登録分）</th></tr></thead><tbody>
          ${rows.map((x) => `<tr><td class="bold">${esc(x.st.name)}</td><td>${x.act}</td><td>${x.unf ? `<span class="due over">${x.unf}</span>` : 0}</td><td>${x.con}</td><td>${x.done}</td><td class="num">${yen(x.forecast)}</td><td class="num">${yen(x.booked)}</td></tr>`).join('')}
          </tbody></table></div><div class="small muted" style="padding:8px 16px">※正式な売上・粗利の定義、KGI（例：年度目標）は要確認。実績値ではありません。</div></div>
        <div class="card"><div class="card-h"><h3>部門別 未処理タスク</h3><span class="sub">期限超過を含む</span></div>
          <div class="card-b">${deptRows.map((x) => `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">${deptPill(x.d)}<div style="flex:1;height:10px;background:var(--line-2);border-radius:6px;overflow:hidden"><div style="height:100%;width:${Math.min(100, x.open * 12)}%;background:var(--teal)"></div></div><span class="bold" style="width:46px;text-align:right">${x.open}件</span><span style="width:80px" class="small ${x.over ? 'due over' : 'muted'}">超過 ${x.over}件</span></div>`).join('')}
          <div class="note" style="margin-top:8px">部門ごとの未処理を同じ画面で把握。担当者に聞いて回らなくても、どこで止まっているかが分かります。</div></div></div></div>`;
    }
    return pageHead('P11｜業務ダッシュボード', `${ROLES[r].label}のダッシュボード`, `${ymd(TODAY)}（${wd(TODAY)}）｜${roleMsg}`,
      `<select class="btn" onchange="App.store(this.value)"><option value="all">全店舗</option>${S.stores.map((s) => `<option value="${s.id}" ${UI.store === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
       <select class="btn" onchange="App.assignee(this.value)"><option value="all">全担当者</option>${assignees.map((u) => `<option value="${u.id}" ${UI.assignee === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}</select>
       <button class="btn" onclick="App.newTask()">＋ タスク</button><button class="btn pri" onclick="App.newInquiry()">＋ 反響登録</button>`) + `
      <div class="grid g5">${KP.map(([key, l, unitL, v, s, f]) => `<div class="card kpi ${prevK[key] !== undefined && prevK[key] !== k[key] ? 'flash' : ''}" onclick="App.go('${v}', ${esc(JSON.stringify(f))})"><span class="bar"></span><div class="k-l">${l}</div><div class="k-v">${k[key]}<small>${unitL}</small>${prevK[key] !== undefined && prevK[key] !== k[key] ? `<span class="small" style="color:var(--teal-2);margin-left:6px">${k[key] > prevK[key] ? '▲' : '▼'}${Math.abs(k[key] - prevK[key])}</span>` : ''}</div><div class="k-s">${s}</div></div>`).join('')}</div>
      <div class="small muted" style="margin:6px 2px 14px">※件数は全画面共通のデモデータからリアルタイム集計しています（デモ数値）。カードをクリックすると該当一覧へ移動します。</div>
      <div class="grid g-main">
        <div class="card"><div class="card-h"><h3>本日のタスク</h3><span class="sub">期限順｜${ROLES[r].dept ? ROLES[r].dept + 'のタスク' : '全部門'}</span><div class="r"><span class="pill p-red">超過 ${tasks.filter((t) => t.due < TODAY).length}</span><span class="pill p-amber">本日 ${tasks.filter((t) => t.due === TODAY).length}</span><span class="pill p-outline">今後 ${tasks.filter((t) => t.due > TODAY).length}</span></div></div>
          <div style="max-height:520px;overflow:auto">${tasks.length ? tasks.map(taskRow).join('') : '<div class="empty">未対応のタスクはありません 🎉</div>'}
          ${doneToday.length ? `<div class="sec-t" style="padding:10px 16px 0">本日完了（${doneToday.length}）</div>${doneToday.map(taskRow).join('')}` : ''}</div></div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="card"><div class="card-h"><h3>アラート</h3><span class="sub">クリックで該当一覧へ</span></div>
            ${al.map((a) => `<div class="alert-row" onclick="App.go('${a.view}', ${esc(JSON.stringify({ alert: a.key, u_st: 'all', i_st: 'active' }))})"><div class="a-ic pill ${a.cls}" style="border-radius:8px">${a.ic}</div><div style="min-width:0"><div class="bold">${a.label}</div><div class="small muted">${a.desc}</div>${a.items.slice(0, 2).map((x) => `<div class="small" style="color:var(--ink-2)">・${esc(x.t)}　<span class="muted">${esc(x.s)}</span></div>`).join('')}</div><div class="a-n" style="color:${a.items.length ? 'var(--red)' : 'var(--green)'}">${a.items.length}</div></div>`).join('')}</div>
          <div class="card"><div class="card-h"><h3>${r === 'chukai' ? '管理課・経理からの更新' : '部門をまたいだ最新の更新'}</h3><span class="sub">変更履歴より</span></div>
            ${recent.map((l) => `<div class="feed-item" onclick="App.go('base');App.p17('log')"><div class="fi-t">${l.at.slice(5).replace('-', '/')}</div><div><span class="bold">${esc(uname(l.userId))}</span>　${esc(l.action)}${l.field ? `：${esc(l.field)}` : ''}<div class="small muted">${esc(logTarget(l))}${l.after ? `　→ ${esc(String(l.after).slice(0, 30))}` : ''}</div></div></div>`).join('')}</div>
        </div></div>${execPanel}`;
  }
  function logTarget(l) {
    try {
      if (l.entity === 'unit') return unitName(l.entityId);
      if (l.entity === 'inquiry') return cust(inq(l.entityId).customerId).name + ' 様（反響）';
      if (l.entity === 'contract') return l.entityId + ' ' + conCust(con(l.entityId)).name + ' 様';
      if (l.entity === 'settlement') return l.entityId + '（' + stl(l.entityId).contractId + '）';
      if (l.entity === 'task') return 'タスク ' + l.entityId;
    } catch (e) {}
    return l.entityId;
  }

  // ---------- P12 Units ----------
  function viewUnits() {
    const f = UI.f; const isBroker = UI.role === 'chukai';
    let rows = liveUnits();
    if (f.alert === 'confirm') { rows = rows.filter(confirmOver); }
    const st = f.u_st || (isBroker ? '募集中' : 'all');
    const counts = Object.fromEntries(UNIT_ST.map((s) => [s, liveUnits().filter((u) => u.status === s).length]));
    if (st !== 'all') rows = rows.filter((u) => u.status === st);
    if (f.u_q) { const q = f.u_q.toLowerCase(); rows = rows.filter((u) => (unitName(u) + prop(u.propertyId).address + unitMgmt(u).name).toLowerCase().includes(q)); }
    if (f.u_mg && f.u_mg !== 'all') rows = rows.filter((u) => (f.u_mg === 'own') === isOwn(u));
    if (f.u_as && f.u_as !== 'all') rows = rows.filter((u) => u.assigneeId === f.u_as);
    if (UI.store !== 'all') rows = rows.filter(storeMatchUnit);
    rows = sortRows('units', rows, { name: unitName, rent: (u) => u.rent, ad: (u) => u.ad, avail: (u) => u.availableDate, conf: (u) => u.lastConfirmed, st: (u) => u.status, asg: (u) => u.assigneeId });
    const sel = UI.sel.units || {}; const selN = Object.values(sel).filter(Boolean).length;
    const editable = can('units', 'E');
    const overN = liveUnits().filter(confirmOver).length;
    return pageHead('P12｜空室・募集管理', isBroker ? '募集物件一覧（仲介店舗ビュー）' : '空室・募集管理', isBroker ? '管理課が更新した募集状態がそのまま表示されます。提案・反響登録はここから' : `週次の空室確認と募集更新の漏れを防ぐ｜確認期限は最終確認から${CONFIRM_DAYS}日（デモ設定）`,
      editable ? `<button class="btn" onclick="App.csvImport()">⇪ 外部情報の差分確認 <span class="tag-demo">デモ連携</span></button>` : `<button class="btn pri" onclick="App.newInquiry()">＋ 反響登録</button>`) + `
      ${!isBroker ? `<div class="grid g5" style="margin-bottom:14px">${[['募集中', 'p-teal'], ['申込中', 'p-blue'], ['確認待ち', 'p-amber'], ['募集停止', 'p-gray']].map(([s]) => `<div class="card kpi" onclick="App.f('u_st','${s}')"><span class="bar"></span><div class="k-l">${s}</div><div class="k-v">${counts[s]}<small>室</small></div></div>`).join('')}
        <div class="card kpi" onclick="App.go('units',{alert:'confirm',u_st:'all'})"><span class="bar" style="background:var(--amber)"></span><div class="k-l">確認期限超過</div><div class="k-v" style="color:${overN ? 'var(--red)' : 'var(--green)'}">${overN}<small>室</small></div><div class="k-s">要・空室確認</div></div></div>` : `<div class="note" style="margin-bottom:12px">🔗 この一覧は管理課の空室・募集管理と<b>同じデータ</b>です。管理課が「申込中」「募集停止」に変更すると、提案対象から即時に外れます（Slack連絡・転記不要）。</div>`}
      <div class="card">
        <div class="filters">
          <div class="chips">${['all', ...UNIT_ST].map((s) => `<span class="chip ${st === s ? 'on' : ''}" onclick="App.f('u_st','${s}')">${s === 'all' ? 'すべて' : s}<span class="c">${s === 'all' ? liveUnits().length : counts[s]}</span></span>`).join('')}</div>
          <input type="text" id="u_q" placeholder="物件名・住所・管理会社" value="${esc(f.u_q || '')}" oninput="App.f('u_q',this.value)" style="width:200px">
          <select onchange="App.f('u_mg',this.value)"><option value="all">管理：すべて</option><option value="own" ${f.u_mg === 'own' ? 'selected' : ''}>自社管理</option><option value="other" ${f.u_mg === 'other' ? 'selected' : ''}>他社管理</option></select>
          <select onchange="App.f('u_as',this.value)"><option value="all">担当：すべて</option>${S.users.filter((u) => u.dept === '管理課').map((u) => `<option value="${u.id}" ${f.u_as === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}</select>
          ${f.alert === 'confirm' ? `<span class="pill p-amber">確認期限超過のみ <a href="javascript:App.f('alert','')">×解除</a></span>` : ''}
          <span class="muted small" style="margin-left:auto">${rows.length}件｜掲載：S=SUUMO A=アットホーム P=ピタットハウス <span class="tag-demo">擬似表示</span></span>
        </div>
        ${editable && selN ? `<div class="bulkbar">${selN}件を選択中　<button class="btn sm" onclick="App.confirmUnits()">✓ 確認済みにする（本日）</button>　担当者変更：<select id="bulk-asg">${S.users.filter((u) => u.dept === '管理課').map((u) => `<option value="${u.id}">${u.name}</option>`).join('')}</select><button class="btn sm" onclick="App.bulkAssignee()">変更</button><button class="btn sm" style="margin-left:auto" onclick="App.selAllUnits(false,'')">選択解除</button></div>` : ''}
        <div class="tbl-wrap"><table class="tbl"><thead><tr>${editable ? `<th><input type="checkbox" onchange="App.selAllUnits(this.checked,'${rows.map((u) => u.id).join(',')}')" ${selN && selN === rows.length ? 'checked' : ''}></th>` : ''}
          ${th('units', 'name', '物件名・号室')}<th>管理</th>${th('units', 'rent', '家賃／共益費', 'num')}${th('units', 'ad', 'AD')}${th('units', 'avail', '入居可能日')}${th('units', 'st', '募集状態')}${th('units', 'conf', '最終確認／期限')}<th>掲載状態</th>${th('units', 'asg', '担当')}${isBroker ? '<th></th>' : ''}</tr></thead><tbody>
          ${rows.map((u) => { const over = confirmOver(u); return `<tr class="row ${sel[u.id] ? 'sel' : ''}" data-row="${u.id}" onclick="App.open('unit','${u.id}')">
            ${editable ? `<td onclick="event.stopPropagation()"><input type="checkbox" ${sel[u.id] ? 'checked' : ''} onchange="App.selUnit('${u.id}',this.checked)"></td>` : ''}
            <td><div class="bold">${esc(prop(u.propertyId).name)} <span style="color:var(--teal-2)">${u.room}</span></div><div class="small muted">${u.layout}・${u.area}㎡・${esc(prop(u.propertyId).address.replace('仙台市', ''))}</div></td>
            <td title="${esc(unitMgmt(u).name)}">${mgmtPill(u)}${unitMgmt(u).own ? '' : `<div class="small muted">${esc(unitMgmt(u).name.replace('（架空）', ''))}</div>`}</td>
            <td class="num"><div class="bold">${yen(u.rent)}</div><div class="small muted">${yen(u.fee)}</div></td><td>${adTxt(u.ad)}</td><td>${u.availableDate <= TODAY ? '<span class="pill p-green">即入居</span>' : md(u.availableDate)}</td>
            <td>${uStPill(u.status)}</td>
            <td class="small">${md(u.lastConfirmed)} ／ ${['募集中', '確認待ち'].includes(u.status) ? (over ? `<span class="due over">${md(confirmDue(u))} 超過</span>` : `<span class="muted">${md(confirmDue(u))}</span>`) : '<span class="muted">—</span>'}</td>
            <td>${listingChips(u, editable)}</td><td class="small">${esc(uname(u.assigneeId))}</td>
            ${isBroker ? `<td onclick="event.stopPropagation()">${u.status === '募集中' ? `<button class="btn xs" onclick="App.newInquiry('${u.id}')">反響登録</button>` : ''}</td>` : ''}</tr>`; }).join('') || `<tr><td colspan="12" class="empty">該当する物件はありません</td></tr>`}
          </tbody></table></div></div>
      <div class="note amber" style="margin-top:12px"><b>連携に関する注記</b>　賃貸革命（管理基幹）は継続利用前提で、本画面との連携方式（API／CSV／手動取込）は<b>未確定</b>です。SUUMO・アットホーム・ピタットハウス関連システムへの掲載更新は<b>擬似的な状態表示</b>で、実際の媒体は更新しません。</div>`;
  }

  // ---------- P13 Inquiries ----------
  function viewInquiries() {
    if (!can('inquiries', 'V')) return lockView('反響・追客管理');
    const f = UI.f;
    let rows = liveInq();
    const st = f.i_st || 'active';
    const cnt = (fn) => liveInq().filter(fn).length;
    if (st === 'active') rows = rows.filter((i) => INQ_ACTIVE.includes(i.status));
    else if (st === 'unfollowed') rows = rows.filter(unfollowed);
    else if (st !== 'all') rows = rows.filter((i) => i.status === st);
    if (f.alert === 'follow') rows = rows.filter((i) => INQ_ACTIVE.includes(i.status) && i.nextFollow && i.nextFollow < TODAY);
    if (f.i_q) { const q = f.i_q.toLowerCase(); rows = rows.filter((i) => (cust(i.customerId).name + unitName(i.unitId) + i.media).toLowerCase().includes(q)); }
    if (f.i_ag && f.i_ag !== 'all') rows = rows.filter((i) => i.agentId === f.i_ag);
    if (f.i_md && f.i_md !== 'all') rows = rows.filter((i) => i.media === f.i_md);
    if (UI.store !== 'all') rows = rows.filter((i) => storeMatchAgent(i.agentId));
    rows = sortRows('inq', rows, { date: (i) => i.date, cust: (i) => cust(i.customerId).name, next: (i) => i.nextFollow || '0000', st: (i) => INQ_ST.indexOf(i.status), ag: (i) => i.agentId });
    if (!UI.sort.inq) rows.sort((a, b) => (a.nextFollow || '0000').localeCompare(b.nextFollow || '0000'));
    const chips = [['active', '対応中', cnt((i) => INQ_ACTIVE.includes(i.status))], ['unfollowed', '未追客', cnt(unfollowed)], ...INQ_ST.map((s) => [s, s, cnt((i) => i.status === s)]), ['all', 'すべて', liveInq().length]];
    const medias = [...new Set(S.inquiries.map((i) => i.media))];
    return pageHead('P13｜反響・追客管理', '反響・追客管理', '個人の記憶に頼らず、次の一手を逃さない｜次回追客日を入れると担当者のタスクになります',
      `<button class="btn pri" onclick="App.newInquiry()">＋ 反響登録</button>`) + `
      <div class="card">
        <div class="filters"><div class="chips">${chips.map(([k, l, c]) => `<span class="chip ${st === k ? 'on' : ''}" onclick="App.f('i_st','${k}')">${l}<span class="c">${c}</span></span>`).join('')}</div></div>
        <div class="filters"><input type="text" id="i_q" placeholder="顧客名・物件名" value="${esc(f.i_q || '')}" oninput="App.f('i_q',this.value)" style="width:200px">
          <select onchange="App.f('i_ag',this.value)"><option value="all">担当：すべて</option>${S.users.filter((u) => u.dept === '仲介').map((u) => `<option value="${u.id}" ${f.i_ag === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}</select>
          <select onchange="App.f('i_md',this.value)"><option value="all">媒体：すべて</option>${medias.map((m) => `<option ${f.i_md === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>
          ${f.alert === 'follow' ? `<span class="pill p-red">追客遅延のみ <a href="javascript:App.f('alert','')">×解除</a></span>` : ''}
          <span class="muted small" style="margin-left:auto">${rows.length}件</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>${th('inq', 'date', '問合せ日')}<th>流入媒体</th>${th('inq', 'cust', '顧客')}<th>対象物件</th><th>希望条件</th>${th('inq', 'ag', '担当')}${th('inq', 'st', '進捗')}${th('inq', 'next', '次回追客日')}<th>最終対応</th></tr></thead><tbody>
        ${rows.map((i) => { const c = cust(i.customerId); const u = unit(i.unitId); const last = i.history[i.history.length - 1]; return `<tr class="row" data-row="${i.id}" onclick="App.open('inquiry','${i.id}')">
          <td>${md(i.date)}</td><td><span class="pill p-outline">${esc(i.media)}</span></td><td class="bold">${esc(c.name)} 様</td>
          <td><div>${esc(unitName(u))}</div><div class="small">${uStPill(u.status)}</div></td>
          <td class="small">${c.budget ? '〜' + yen(c.budget) : ''} ${esc(c.area || '')} ${esc(c.layout || '')}</td>
          <td class="small">${esc(uname(i.agentId))}</td><td>${iStPill(i.status)}</td>
          <td>${INQ_ACTIVE.includes(i.status) ? (i.nextFollow ? dueTxt(i.nextFollow) : '<span class="pill p-red">未設定</span>') : '<span class="muted">—</span>'}</td>
          <td class="small muted">${last ? `${last.at.slice(5, 10).replace('-', '/')} ${esc(last.type)}` : ''}</td></tr>`; }).join('') || '<tr><td colspan="9" class="empty">該当する反響はありません</td></tr>'}
        </tbody></table></div></div>
      <div class="note amber" style="margin-top:12px"><b>連携に関する注記</b>　ノマドクラウドの反響取込・チャット・履歴の代替可否と、ポータルからの反響自動取得は<b>検証前提（仕様要確認）</b>です。追客の通知タイミング（例：3日後・5日後）は設定例で、確定仕様ではありません。</div>`;
  }

  // ---------- P14 Contracts ----------
  function viewContracts() {
    const f = UI.f;
    let rows = liveCon();
    const st = f.c_st || 'active';
    const cnt = (fn) => liveCon().filter(fn).length;
    if (st === 'active') rows = rows.filter((c) => ['審査中', '契約準備中'].includes(c.status));
    else if (st === 'open') rows = rows.filter((c) => !['完了', 'キャンセル'].includes(c.status));
    else if (st !== 'all') rows = rows.filter((c) => c.status === st);
    if (f.alert === 'docs') rows = liveCon().filter(docShort);
    if (f.c_q) { const q = f.c_q.toLowerCase(); rows = rows.filter((c) => (c.id + conCust(c).name + unitName(conUnit(c))).toLowerCase().includes(q)); }
    if (UI.store !== 'all') rows = rows.filter((c) => storeMatchAgent(conApp(c).agentId));
    rows = sortRows('con', rows, { id: (c) => c.id, start: (c) => c.startDate, app: (c) => conApp(c).appliedAt, st: (c) => CON_ST.indexOf(c.status) });
    const chips = [['open', '進行中', cnt((c) => !['完了', 'キャンセル'].includes(c.status))], ['active', '申込中（審査・準備）', cnt((c) => ['審査中', '契約準備中'].includes(c.status))], ...CON_ST.map((s) => [s, s, cnt((c) => c.status === s)]), ['all', 'すべて', liveCon().length]];
    return pageHead('P14｜申込・契約進捗管理', '申込・契約進捗', '進捗表のチェックリストを案件ワークフローへ｜書類のチェックで進捗が自動で進み、請求書登録で経理に通知されます', '') + `
      <div class="card">
        <div class="filters"><div class="chips">${chips.map(([k, l, c]) => `<span class="chip ${st === k ? 'on' : ''}" onclick="App.f('c_st','${k}');App.f('alert','')">${l}<span class="c">${c}</span></span>`).join('')}</div>
          <input type="text" id="c_q" placeholder="契約番号・契約者・物件" value="${esc(f.c_q || '')}" oninput="App.f('c_q',this.value)" style="width:200px;margin-left:auto">
          ${f.alert === 'docs' ? `<span class="pill p-red">書類不足のみ <a href="javascript:App.f('alert','')">×解除</a></span>` : ''}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>${th('con', 'id', '案件No')}<th>担当</th><th>物件・号室</th><th>管理</th><th>契約者</th>${th('con', 'app', '申込日')}${th('con', 'start', '契約開始日')}<th>チェックリスト</th>${th('con', 'st', '進捗')}<th>経理</th></tr></thead><tbody>
        ${rows.map((c) => { const a = conApp(c); const u = conUnit(c); const s = stlForCon(c.id); const back = Object.values(c.checklist).includes('back'); return `<tr class="row" data-row="${c.id}" onclick="App.open('contract','${c.id}')">
          <td class="bold">${c.id}</td><td class="small">${esc(uname(a.agentId))}</td><td>${esc(unitName(u))}</td><td>${mgmtPill(u)}</td><td>${esc(conCust(c).name)} 様</td>
          <td>${md(a.appliedAt)}</td><td>${['完了', 'キャンセル'].includes(c.status) ? md(c.startDate) : dueTxt(c.startDate)}</td>
          <td><span class="mini-ck">${CK.map(([k, l]) => `<i class="${c.checklist[k] === 'done' ? 'd' : c.checklist[k] === 'back' ? 'b' : ''}" title="${l}：${c.checklist[k] === 'done' ? '済' : c.checklist[k] === 'back' ? '差戻し' : '未'}"></i>`).join('')}</span> <span class="small muted">${Object.values(c.checklist).filter((v) => v === 'done').length}/7</span>${back ? ' <span class="pill p-red">差戻し</span>' : ''}</td>
          <td>${cStPill(c.status)}</td><td>${s ? payPill(s) : '<span class="muted small">未連携</span>'}</td></tr>`; }).join('') || '<tr><td colspan="10" class="empty">該当する案件はありません</td></tr>'}
        </tbody></table></div></div>
      <div class="note" style="margin-top:12px">チェック順：申込書 → 審査 → 重要事項説明 → 契約書 → 請求書 → 入金（経理の入金確認で自動）→ 関連書類。<b>すべて済で「完了」</b>となり、物件は「契約済」、反響は「成約」に自動更新されます。例外（キャンセル・差戻し・入金遅延・他社管理物件）にも対応。</div>`;
  }

  // ---------- P15 Settlements ----------
  function viewSettlements() {
    const f = UI.f;
    let rows = liveStl();
    const st = f.s_st || 'all';
    const cnt = (fn) => liveStl().filter(fn).length;
    if (st === 'wait') rows = rows.filter(payWaiting);
    else if (st === 'over') rows = rows.filter(payOver);
    else if (st === 'remit') rows = rows.filter((s) => ['未送金', '送金予定'].includes(s.remitStatus) && s.payStatus !== 'キャンセル');
    else if (st === 'check') rows = rows.filter((s) => !s.accountingChecked && s.payStatus !== 'キャンセル');
    else if (st === 'done') rows = rows.filter((s) => s.payStatus === '入金済');
    if (f.alert === 'pay') rows = liveStl().filter(payOver);
    if (f.s_mg && f.s_mg !== 'all') rows = rows.filter((s) => (f.s_mg === 'own') === isOwn(conUnit(stlCon(s))));
    if (UI.store !== 'all') rows = rows.filter((s) => storeMatchAgent(conApp(stlCon(s)).agentId));
    rows = sortRows('stl', rows, { id: (s) => s.id, due: (s) => s.payDue || '9999', bill: (s) => s.billAmount, remit: (s) => s.remitDue || '9999' });
    const tot = (fn) => liveStl().filter((s) => s.payStatus !== 'キャンセル').reduce((a, s) => a + fn(s), 0);
    const chips = [['all', 'すべて', liveStl().length], ['check', '経理確認待ち', cnt((s) => !s.accountingChecked && s.payStatus !== 'キャンセル')], ['wait', '入金確認待ち', cnt(payWaiting)], ['over', '入金期限超過', cnt(payOver)], ['remit', '送金待ち', cnt((s) => ['未送金', '送金予定'].includes(s.remitStatus) && s.payStatus !== 'キャンセル')], ['done', '入金済', cnt((s) => s.payStatus === '入金済')]];
    return pageHead('P15｜入出金・精算管理', '入出金・精算', '契約情報とお金の動きを案件単位でつなぐ｜請求書登録で自動生成された精算レコードを経理が確認します', '') + `
      <div class="grid g5" style="margin-bottom:14px">
        <div class="card kpi" onclick="App.f('s_st','check')"><span class="bar" style="background:var(--amber)"></span><div class="k-l">経理確認待ち</div><div class="k-v">${chips[1][2]}<small>件</small></div></div>
        <div class="card kpi" onclick="App.f('s_st','wait')"><span class="bar"></span><div class="k-l">入金確認待ち</div><div class="k-v">${chips[2][2]}<small>件</small></div></div>
        <div class="card kpi" onclick="App.f('s_st','over')"><span class="bar" style="background:var(--red)"></span><div class="k-l">入金期限超過</div><div class="k-v" style="color:${chips[3][2] ? 'var(--red)' : 'inherit'}">${chips[3][2]}<small>件</small></div></div>
        <div class="card kpi" onclick="App.f('s_st','remit')"><span class="bar"></span><div class="k-l">送金待ち（他社管理）</div><div class="k-v">${chips[4][2]}<small>件</small></div></div>
        <div class="card kpi"><span class="bar" style="background:var(--navy)"></span><div class="k-l">手数料＋AD 計 <span class="tag-demo">デモ数値</span></div><div class="k-v" style="font-size:22px">${yen(tot((s) => s.brokerFee + s.ad))}</div></div></div>
      <div class="card">
        <div class="filters"><div class="chips">${chips.map(([k, l, c]) => `<span class="chip ${st === k ? 'on' : ''}" onclick="App.f('s_st','${k}');App.f('alert','')">${l}<span class="c">${c}</span></span>`).join('')}</div>
          <select onchange="App.f('s_mg',this.value)" style="margin-left:auto"><option value="all">管理：すべて</option><option value="own" ${f.s_mg === 'own' ? 'selected' : ''}>自社管理</option><option value="other" ${f.s_mg === 'other' ? 'selected' : ''}>他社管理</option></select></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr>${th('stl', 'id', '精算No')}<th>契約案件</th><th>物件</th><th>契約者／担当</th><th>管理</th>${th('stl', 'bill', '請求額', 'num')}<th class="num">手数料／AD</th>${th('stl', 'due', '入金期日・状態')}${th('stl', 'remit', '送金（予定額・日）')}<th>添付</th></tr></thead><tbody>
        ${rows.map((s) => { const c = stlCon(s); const u = conUnit(c); return `<tr class="row" data-row="${s.id}" onclick="App.open('settlement','${s.id}')">
          <td class="bold">${s.id}</td><td>${c.id} ${cStPill(c.status)}</td><td class="small">${esc(unitName(u))}</td><td>${esc(conCust(c).name)} 様<div class="small muted">${esc(uname(conApp(c).agentId))}</div></td><td title="${esc(unitMgmt(u).name)}">${mgmtPill(u)}${isOwn(u) ? '' : `<div class="small muted">${esc(unitMgmt(u).name.replace('（架空）', ''))}</div>`}</td>
          <td class="num bold">${yen(s.billAmount)}</td><td class="num small">${yen(s.brokerFee)}<div class="muted">${yen(s.ad)}</div></td>
          <td>${payPill(s)}${!s.accountingChecked && s.payStatus !== 'キャンセル' ? ' <span class="pill p-amber">経理未確認</span>' : ''}<div class="small">${s.payStatus === '入金済' ? `<span class="muted">${md(s.payConfirmed)} 入金確認</span>` : s.payStatus === 'キャンセル' ? '' : '期日 ' + dueTxt(s.payDue)}</div></td>
          <td>${remitPill(s)}<div class="small">${isOwn(u) ? '<span class="muted">オーナー送金は賃貸革命</span>' : `${yen(s.remitAmount)}　${s.remitDue && s.remitStatus !== '送金済' ? dueTxt(s.remitDue) : s.remittedAt ? `<span class="muted">${md(s.remittedAt)} 送金済</span>` : ''}`}</div></td>
          <td class="small">${s.attachInvoice ? '<span class="pill p-green">請求書</span>' : '<span class="pill p-red">請求書未</span>'}<br>${s.attachStatement ? '<span class="pill p-green">精算書</span>' : '<span class="pill p-gray">精算書未</span>'}</td></tr>`; }).join('') || '<tr><td colspan="11" class="empty">該当する精算はありません</td></tr>'}
        </tbody></table></div></div>
      <div class="note purple" style="margin-top:12px"><b>仮仕様・要確認</b>　自社管理物件のオーナー送金は賃貸革命側の処理を前提としています（連携方式未確定）。他社管理物件の精算・相殺・AD計算の正式ルールは未確認のため、送金予定額は<b>架空例の手入力値</b>であり計算仕様ではありません。銀行明細との自動消込も連携条件の確認が必要です。</div>`;
  }

  // ---------- P16 Before/After ----------
  const BA = [
    { name: '空室・募集', icon: '⌂', go: 'units',
      before: [['管理課', '賃貸革命で解約・空室を入力', '賃貸革命', ''], ['管理課', '共有スプレッドシートに同じ内容を転記', 'スプレッドシート', '二重入力・転記ミス'], ['管理課', 'Slackで仲介店舗へ連絡', 'Slack', '投稿が流れて埋もれる'], ['管理課', '約150件を週1回、元付・業者間サイトを巡回して確認', '複数サイト', '他社成約の反映が遅れる'], ['仲介店舗', '各媒体の掲載を個別に停止・更新', 'ポータル各社', '掲載遅延・募集終了物件への反響']],
      after: [['管理課', '物件の募集状態・条件を1か所で更新', '業務基盤', '入力は1回'], ['自動', '仲介店舗の募集一覧・反響登録の候補に即時反映', '業務基盤', '転記・連絡が不要'], ['自動', '掲載停止／更新タスクを管理課に生成', '業務基盤', '対応漏れを防止'], ['管理課', '確認期限超過の物件だけを確認し、外部差分を取込', 'デモ連携', '確認すべき物件が絞られる'], ['経営者', '募集状況と更新漏れをダッシュボードで把握', '業務基盤', '担当者に聞かずに把握']] },
    { name: '追客', icon: '☎', go: 'inquiries',
      before: [['仲介店舗', 'ノマドクラウドで反響を受信', 'ノマドクラウド', ''], ['仲介店舗', '進捗表（反響シート）に転記', 'スプレッドシート', '二重入力'], ['仲介店舗', '次回連絡日は個人のメモ・記憶で管理', '個人メモ', '追客漏れ・属人化'], ['店長', '進捗を口頭やチャットで個別に確認', 'Slack/口頭', '確認の手間'], ['仲介店舗', '担当交代時に経緯が引き継がれない', '—', '顧客対応の質がばらつく']],
      after: [['仲介店舗', '反響を登録（必須4項目）', '業務基盤', '最小入力'], ['自動', '初回対応タスクを担当者に生成', '業務基盤', '初動を逃さない'], ['仲介店舗', '対応履歴と次回追客日を記録', '業務基盤', '記憶に頼らない'], ['自動', '期日にタスク化・遅延はアラート表示', '業務基盤', '追客漏れを可視化'], ['仲介店舗', '「申込登録」で顧客・物件・担当を引継ぎ', '業務基盤', '再入力なしで次工程へ']] },
    { name: '申込・契約', icon: '✓', go: 'contracts',
      before: [['仲介店舗', '申込書を受領し進捗表に行を追加', 'スプレッドシート', '物件・顧客情報を再入力'], ['仲介店舗', 'Slackで申込書を共有', 'Slack', '書類の所在が分散'], ['管理課', '審査・重説・契約書の状況を個別に確認', 'スプレッドシート/口頭', '確認の往復'], ['仲介店舗', '請求書作成後、経理へ別途連絡', 'Slack', '連絡漏れで経理が把握できない'], ['経理', '進捗表を見て契約状況を推測', 'スプレッドシート', '不明入金の追跡']],
      after: [['仲介店舗', '反響から申込を登録（情報は自動引継ぎ）', '業務基盤', '再入力なし'], ['自動', '物件が「申込中」に → 管理課へ掲載停止タスク', '業務基盤', '部門間の連絡が不要'], ['担当者', 'チェックリストを進めると進捗が自動更新', '業務基盤', '次にやることが明確'], ['自動', '請求書登録で精算レコードと経理タスクを生成', '業務基盤', '経理への連絡漏れを防止'], ['全員', '差戻し・キャンセルも履歴付きで共有', '業務基盤', '例外も追える']] },
    { name: '経理精算', icon: '¥', go: 'settlements',
      before: [['仲介店舗', '契約内容を経理用シートに転記', 'スプレッドシート', '三重入力'], ['経理', '請求書・精算書の提出を催促', 'Slack/口頭', '催促の手間'], ['経理', '入金を確認し、どの案件か照合', '銀行/シート', '不明入金の追跡'], ['経理', '他社管理物件の送金額を個別計算', 'Excel', '計算・相殺ルールが属人的'], ['管理課', 'オーナー送金は賃貸革命で別途処理', '賃貸革命', '情報が分断']],
      after: [['自動', '契約の請求書登録で精算レコードを生成', '業務基盤', '転記不要'], ['経理', '添付状態を確認し「経理確認」', '業務基盤', '提出状況が一目で分かる'], ['経理', '入金確認 → 契約の入金チェックに自動反映', '業務基盤', '仲介・管理にも即共有'], ['自動', '他社管理物件は送金タスクを生成', '業務基盤', '送金漏れ防止（計算ルールは要確認）'], ['全員', '金額変更は変更前後の値と更新者を記録', '業務基盤', '確認・監査が容易']] },
  ];
  function viewBA() {
    const sc = BA[UI.baScenario]; const step = UI.baStep;
    const flow = (arr, cls, lim) => arr.map(([who, t, tool, note], i) => `${i ? '<div class="farrow">↓</div>' : ''}<div class="fstep ${i < lim ? 'past' : ''} ${i === lim ? 'on' : ''}"><div class="no">${i + 1}</div><div style="flex:1"><div><span class="small muted">${who}</span><span class="tool">${tool}</span></div><div class="bold">${t}</div>${note ? `<div class="${cls === 'before' ? 'pain' : 'gain'}">${cls === 'before' ? '⚠ ' : '✓ '}${note}</div>` : ''}</div></div>`).join('');
    const lim = step >= 5 ? 99 : step;
    return pageHead('P16｜Before／After 業務改善デモ', 'Before／After：仕事がどう変わるか', '同じ業務を「今」と「業務基盤導入後」で比較｜ステップを進めて変化を確認', `<button class="btn" onclick="App.baSet(0)">↺ 最初から</button><button class="btn" onclick="App.baStep(-1)">◀ 戻る</button><button class="btn pri" onclick="App.baStep(1)">次のステップ ▶</button>`) + `
      <div class="ba-tabs">${BA.map((b, i) => `<button class="chip ${UI.baScenario === i ? 'on' : ''}" style="padding:7px 16px;font-size:13px" onclick="App.ba(${i})">${b.icon} ${b.name}</button>`).join('')}
        <span style="margin-left:auto" class="small muted">ステップ ${Math.min(step + 1, 5)} / 5</span></div>
      <div class="ba-grid">
        <div class="card before"><div class="card-h" style="background:#fffaf0"><h3>Before｜現状</h3><span class="sub">賃貸革命入力 → スプレッドシート転記 → Slack報告 → 別担当が確認・再入力</span></div><div class="card-b flow">${flow(sc.before, 'before', lim)}</div></div>
        <div class="card after"><div class="card-h" style="background:#f2faf9"><h3>After｜導入後</h3><span class="sub">物件・案件情報を更新 → 関連画面へ反映 → 担当者へタスク生成 → 次の対応</span></div><div class="card-b flow">${flow(sc.after, 'after', lim)}</div></div>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card card-b"><div class="bold" style="margin-bottom:6px">構造の変化</div><div style="font-size:13px">「人が入力しないから問題が起きる」のではなく、<b>人が何度も入力・確認しなければならない構造</b>だから漏れが起きる。<br>After では情報が<b>一度の入力で後工程へ流れ</b>、次の担当者には<b>タスクとして届きます</b>。</div>
          <button class="btn pri" style="margin-top:10px" onclick="App.go('${sc.go}')">このシナリオを実画面で試す →</button></div>
        <div class="card card-b"><div class="bold" style="margin-bottom:6px">表示上の注意</div><div class="small" style="color:var(--ink-2)">・工数削減率・削減時間などの効果は<b>実測値がないため表示していません</b>。導入後の実案件検証で計測します。<br>・外部サービス（賃貸革命・ノマドクラウド・ポータル各社）との連携は<b>仕様要確認</b>で、本デモでは擬似表示です。</div></div>
      </div>`;
  }

  // ---------- P17 Base ----------
  function viewBase() {
    const tab = UI.p17tab;
    const tabs = [['trace', '関連トレース（物件→精算）'], ['log', '変更履歴'], ['perm', '部門・権限'], ['trash', '論理削除・誤操作防止']];
    let body = '';
    if (tab === 'trace') body = baseTrace();
    if (tab === 'log') body = baseLog();
    if (tab === 'perm') body = basePerm();
    if (tab === 'trash') body = baseTrash();
    return pageHead('P17｜全社共通情報基盤', '全社共通情報基盤・権限／履歴', '個人シートやチャット履歴に頼らず、担当が変わっても経緯を追える', '') + `
      <div class="note amber" style="margin-bottom:12px">⚠ 本画面は<b>概念デモ</b>です。実際の認証・アクセス制御・監査ログ・バックアップを備えた本番システムではありません。権限設定・承認者・通知タイミングは<b>仮仕様（要確認）</b>です。</div>
      <div class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'active' : ''}" onclick="App.p17('${k}')">${l}</button>`).join('')}</div>${body}`;
  }
  function baseTrace() {
    const cs = liveCon();
    const c = con(UI.traceId) || cs[0];
    const a = conApp(c); const u = unit(a.unitId); const p = prop(u.propertyId); const i = inq(a.inquiryId); const s = stlForCon(c.id);
    const node = (lbl, title, sub, onclick) => `<div class="tnode ${title ? '' : 'empty'}" ${title && onclick ? `onclick="${onclick}"` : ''}><div class="tn-l">${lbl}</div><div class="tn-t">${title ? esc(title) : '未作成'}</div><div class="small muted">${sub || ''}</div></div>`;
    const ar = '<div class="tarrow">→</div>';
    const tl = S.logs.filter((l) => l.trace && (l.trace.contractId === c.id || (l.trace.unitId === u.id && l.at >= (a.appliedAt + ' 00:00')) || (i && l.trace.inquiryId === i.id))).sort((x, y) => y.at.localeCompare(x.at));
    return `<div class="card"><div class="card-h"><h3>案件の関連トレース</h3><span class="sub">IDで関連付けられた情報を一続きで表示</span>
        <div class="r"><select class="btn" onchange="App.trace(this.value)">${cs.map((k) => `<option value="${k.id}" ${k.id === c.id ? 'selected' : ''}>${k.id}｜${esc(conCust(k).name)} 様｜${esc(unitName(conUnit(k)))}｜${k.status}</option>`).join('')}</select></div></div>
      <div class="card-b"><div class="trace">
        ${node('物件 PROPERTY', p.name, `${esc(p.address.replace('仙台市', ''))}<br>${esc(company(p.mgmtId).name)}`, `App.go('units');App.open('unit','${u.id}')`)}${ar}
        ${node('部屋 UNIT', `${u.room}号室`, `${uStPill(u.status)}<br>${yen(u.rent)}・AD ${adTxt(u.ad)}`, `App.go('units');App.open('unit','${u.id}')`)}${ar}
        ${node('反響 INQUIRY', i ? cust(i.customerId).name + ' 様' : '', i ? `${esc(i.media)}・${md(i.date)}<br>${iStPill(i.status)}` : '', i ? `App.go('inquiries');App.open('inquiry','${i.id}')` : '')}${ar}
        ${node('申込 APPLICATION', a.id, `申込日 ${md(a.appliedAt)}<br>担当 ${esc(uname(a.agentId))}`, `App.go('contracts');App.open('contract','${c.id}')`)}${ar}
        ${node('契約 CONTRACT', c.id, `${cStPill(c.status)}<br>開始 ${md(c.startDate)}`, `App.go('contracts');App.open('contract','${c.id}')`)}${ar}
        ${node('精算 SETTLEMENT', s ? s.id : '', s ? `${payPill(s)}<br>${yen(s.billAmount)}` : '請求書登録で自動生成', s ? `App.go('settlements');App.open('settlement','${s.id}')` : '')}
      </div></div></div>
      <div class="card" style="margin-top:14px"><div class="card-h"><h3>この案件に関わる変更履歴</h3><span class="sub">${tl.length}件｜部門・担当者をまたいで時系列表示</span></div><div class="card-b">${logTimeline(tl)}</div></div>`;
  }
  function logTimeline(arr) {
    if (!arr.length) return '<div class="empty">履歴はありません</div>';
    return `<div class="timeline">${arr.map((l) => `<div class="tl"><div class="tl-h">${l.at.replace(/-/g, '/')}　${esc(uname(l.userId))}（${esc(user(l.userId).dept || '')}）</div><div class="tl-b"><span class="bold">${esc(l.action)}</span>${l.field ? `｜${esc(l.field)}` : ''}　<span class="small muted">${esc(logTarget(l))}</span>${l.before !== '' || l.after !== '' ? `<div class="diff">${l.before !== '' ? `<span class="b">${esc(l.before)}</span> → ` : ''}<span class="a">${esc(l.after)}</span></div>` : ''}</div></div>`).join('')}</div>`;
  }
  function baseLog() {
    const f = UI.f;
    let rows = S.logs.slice().reverse();
    if (f.l_e && f.l_e !== 'all') rows = rows.filter((l) => l.entity === f.l_e);
    if (f.l_u && f.l_u !== 'all') rows = rows.filter((l) => l.userId === f.l_u);
    if (f.l_q) { const q = f.l_q.toLowerCase(); rows = rows.filter((l) => (l.action + l.field + l.before + l.after + logTarget(l)).toLowerCase().includes(q)); }
    const EN = { unit: '物件', inquiry: '反響', contract: '契約', settlement: '精算', task: 'タスク' };
    return `<div class="card"><div class="filters"><select onchange="App.f('l_e',this.value)"><option value="all">対象：すべて</option>${Object.entries(EN).map(([k, v]) => `<option value="${k}" ${f.l_e === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select onchange="App.f('l_u',this.value)"><option value="all">更新者：すべて</option><option value="system" ${f.l_u === 'system' ? 'selected' : ''}>システム（自動）</option>${S.users.map((u) => `<option value="${u.id}" ${f.l_u === u.id ? 'selected' : ''}>${u.name}（${u.dept}）</option>`).join('')}</select>
      <input type="text" id="l_q" placeholder="キーワード" value="${esc(f.l_q || '')}" oninput="App.f('l_q',this.value)"><span class="muted small" style="margin-left:auto">${rows.length}件</span></div>
      <div class="tbl-wrap" style="max-height:600px"><table class="tbl"><thead><tr><th>日時</th><th>更新者</th><th>対象</th><th>操作</th><th>項目</th><th>変更前</th><th>変更後</th></tr></thead><tbody>
      ${rows.slice(0, 300).map((l) => `<tr><td class="small">${l.at.replace(/-/g, '/')}</td><td class="small">${esc(uname(l.userId))}</td><td><span class="pill p-outline">${EN[l.entity] || l.entity}</span> <span class="small">${esc(logTarget(l))}</span></td><td>${esc(l.action)}</td><td class="small">${esc(l.field)}</td><td class="diff"><span class="b">${esc(l.before)}</span></td><td class="diff" style="white-space:normal;max-width:280px"><span class="a">${esc(l.after)}</span></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  function basePerm() {
    const mark = (s, p) => s.includes(p) ? '<span class="ok">●</span>' : '<span class="ng">—</span>';
    return `<div class="grid g2"><div class="card"><div class="card-h"><h3>ロール別 権限マトリクス</h3><span class="tag-kari">仮仕様</span><span class="sub">V=閲覧 E=編集 A=承認</span></div>
      <div class="tbl-wrap"><table class="tbl perm"><thead><tr><th>機能</th>${ROLE_ORDER.map((r) => `<th colspan="3" style="${UI.role === r ? 'color:var(--teal-2)' : ''}">${ROLES[r].label}${UI.role === r ? '（現在）' : ''}</th>`).join('')}</tr>
      <tr><th></th>${ROLE_ORDER.map(() => '<th>閲覧</th><th>編集</th><th>承認</th>').join('')}</tr></thead><tbody>
      ${Object.keys(PERM).map((m) => `<tr><td class="bold">${MOD_LABEL[m]}</td>${ROLE_ORDER.map((r) => `<td style="${UI.role === r ? 'background:#eef8f6' : ''}">${mark(PERM[m][r], 'V')}</td><td style="${UI.role === r ? 'background:#eef8f6' : ''}">${mark(PERM[m][r], 'E')}</td><td style="${UI.role === r ? 'background:#eef8f6' : ''}">${mark(PERM[m][r], 'A')}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div><div class="small muted" style="padding:8px 16px">ヘッダーのロール切替で、各画面のボタンの可否が変わります（例：経理ロールでは物件の募集状態を変更できない）。</div></div>
      <div class="card"><div class="card-h"><h3>部門・店舗と担当者</h3><span class="sub">追加店舗名は架空例</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>担当者</th><th>部門</th><th>所属</th><th>未対応タスク</th><th>担当中</th></tr></thead><tbody>
      ${S.users.map((u) => `<tr><td class="bold">${esc(u.name)}</td><td>${deptPill(u.dept)}</td><td class="small">${esc(u.title)}</td><td>${S.tasks.filter((t) => t.status === 'open' && t.assigneeId === u.id).length}件</td><td class="small muted">${u.dept === '管理課' ? liveUnits().filter((x) => x.assigneeId === u.id).length + '室' : u.dept === '仲介' ? liveInq().filter((x) => x.agentId === u.id && INQ_ACTIVE.includes(x.status)).length + '件の反響' : '—'}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="card-b"><div class="bold" style="margin-bottom:4px">担当者変更と履歴の保持</div><div class="small" style="color:var(--ink-2)">空室・募集管理で物件を選んで担当者を変更、または契約詳細の「編集」で担当を変更すると、<b>未対応タスクは新担当へ引き継がれ</b>、<b>過去の履歴は当時の担当者名のまま保持</b>されます。</div>
        <button class="btn sm" style="margin-top:8px" onclick="App.go('units')">空室・募集管理で試す →</button></div></div></div>`;
  }
  function baseTrash() {
    const del = [...S.units.filter((u) => u.deleted).map((u) => ({ type: 'unit', id: u.id, name: unitName(u), r: u })), ...S.inquiries.filter((i) => i.deleted).map((i) => ({ type: 'inquiry', id: i.id, name: cust(i.customerId).name + ' 様の反響', r: i }))];
    return `<div class="card"><div class="card-h"><h3>論理削除されたデータ</h3><span class="sub">削除しても物理的には消さず、理由・削除者・日時を記録</span></div>
      ${del.length ? `<table class="tbl"><thead><tr><th>種別</th><th>対象</th><th>削除日時</th><th>削除者</th><th>理由</th><th></th></tr></thead><tbody>${del.map((d) => `<tr><td>${d.type === 'unit' ? '物件' : '反響'}</td><td class="bold">${esc(d.name)}</td><td class="small">${esc(d.r.deletedAt || '')}</td><td class="small">${esc(uname(d.r.deletedBy))}</td><td class="small">${esc(d.r.deleteReason || '')}</td><td><button class="btn sm" ${can('trash', 'A') ? '' : 'disabled title="経営者のみ復元可能"'} onclick="App.restore('${d.type}','${d.id}')">復元</button></td></tr>`).join('')}</tbody></table>` : '<div class="empty">論理削除されたデータはありません。<br>物件詳細・反響詳細の「論理削除」から試せます（削除理由と確認入力が必須＝誤操作防止）。</div>'}
      <div class="card-b"><div class="note">誤操作防止のデモ表現：①削除前に理由入力と「削除」の確認入力を必須化　②一覧からは非表示にするがデータは保持　③復元は承認権限（経営者）のみ　④すべて変更履歴に記録。<br>実運用でのバックアップ・保管期間・個人情報の扱いは<b>本番設計時に要確認</b>。</div></div></div>`;
  }
  function lockView(name) { return `<div class="card lockbox"><div style="font-size:30px">🔒</div><div class="bold" style="margin:6px 0">${ROLES[UI.role].label}ロールには「${name}」の閲覧権限がありません（仮仕様）</div><div class="small">権限は部門・店舗ごとに設定できる想定です。ロールを切り替えてご確認ください。</div></div>`; }

  // =========================================================
  //  DRAWERS
  // =========================================================
  function renderDrawer() {
    const root = document.getElementById('drawer-root');
    if (!UI.drawer) { root.innerHTML = ''; root.dataset.key = ''; return; }
    const { type, id } = UI.drawer;
    const fn = { unit: drawerUnit, inquiry: drawerInquiry, contract: drawerContract, settlement: drawerSettlement }[type];
    if (!fn) { root.innerHTML = ''; return; }
    const r = fn(id);
    if (!r) { root.innerHTML = ''; return; }
    const sc = root.querySelector('.d-b'); const key = type + ':' + id; const top = sc && root.dataset.key === key ? sc.scrollTop : 0; root.dataset.key = key;
    root.innerHTML = `<div class="drawer-bg" onclick="App.closeDrawer()"></div><div class="drawer"><div class="d-h"><div>${r.h}</div><button class="x" onclick="App.closeDrawer()">×</button></div><div class="d-b">${r.b}</div>${r.f ? `<div class="d-f">${r.f}</div>` : ''}</div>`;
    const sc2 = root.querySelector('.d-b'); if (sc2 && top) sc2.scrollTop = top;
  }
  const entityLogs = (pred) => S.logs.filter(pred).sort((a, b) => b.at.localeCompare(a.at));
  function relTasks(type, id) {
    const ts = refTasks(type, id).sort((a, b) => (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1) || a.due.localeCompare(b.due));
    return ts.length ? ts.map(taskRow).join('') : '<div class="empty">関連タスクはありません</div>';
  }
  function drawerUnit(id) {
    const u = unit(id); if (!u) return null; const p = prop(u.propertyId); const mc = unitMgmt(u); const ed = can('units', 'E');
    const rel = liveCon().filter((c) => conApp(c).unitId === id);
    const ris = liveInq().filter((i) => i.unitId === id);
    return {
      h: `<div class="small muted">物件・部屋｜${esc(p.address)}</div><h2>${esc(p.name)} ${u.room}</h2><div style="margin-top:4px">${uStPill(u.status)} ${mgmtPill(u)} <span class="small muted">${esc(mc.name)}</span></div>`,
      b: `<div class="sec-t">募集状態の変更 ${ed ? '' : '<span class="pill p-gray">閲覧のみ</span>'}</div>
        <div class="chips">${UNIT_ST.map((s) => `<button class="chip ${u.status === s ? 'on' : ''}" ${ed ? `onclick="App.unitStatus('${id}','${s}')"` : 'disabled'}>${s}</button>`).join('')}</div>
        <div class="small muted" style="margin-top:6px">「申込中／契約済／募集停止」にすると掲載停止確認タスクを生成し、仲介店舗の提案対象から外れます。キャンセル後は「確認待ち」で止まり、自動再募集しません。</div>
        <div class="sec-t">募集条件 ${ed ? `<button class="btn xs" onclick="App.editUnit('${id}')">✎ 変更</button>` : ''}</div>
        <dl class="kv2"><dt>家賃</dt><dd class="bold">${yen(u.rent)}</dd><dt>共益費</dt><dd>${yen(u.fee)}</dd><dt>AD</dt><dd>${adTxt(u.ad)}</dd><dt>入居可能日</dt><dd>${ymd(u.availableDate)}</dd>
          <dt>間取り</dt><dd>${u.layout}・${u.area}㎡</dd><dt>担当（管理課）</dt><dd>${esc(uname(u.assigneeId))}</dd>
          <dt>最終空室確認</dt><dd>${ymd(u.lastConfirmed)}</dd><dt>確認期限</dt><dd>${['募集中', '確認待ち'].includes(u.status) ? dueTxt(confirmDue(u)) : '—'}</dd>
          <dt>取得元</dt><dd class="small">${mc.own ? '自社（賃貸革命）<span class="tag-demo">連携方式未確定</span>' : esc(mc.source)}</dd><dt>メモ</dt><dd class="small">${esc(u.note || '—')}</dd></dl>
        <div class="sec-t">掲載状態 <span class="tag-demo">デモ連携／仕様要確認</span></div>
        <div>${MEDIA.map(([k, l]) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="width:110px">${l}</span><span class="m ${lstCls[u.listings[k]]}" style="border-radius:6px;padding:1px 8px;font-size:12px;border:1px solid var(--line)">${u.listings[k]}</span>${ed ? `<button class="btn xs" onclick="App.cycleListing('${id}','${k}')">切替</button>` : ''}</div>`).join('')}
          <div class="small muted">実際の媒体は更新されません。ピタットハウス関連システム経由の一斉更新・各ポータルの連携可否は要確認。</div></div>
        <div class="sec-t">関連する反響・申込</div>
        ${ris.length || rel.length ? `${ris.map((i) => `<div class="feed-item" onclick="App.go('inquiries');App.open('inquiry','${i.id}')">${iStPill(i.status)}<div>${esc(cust(i.customerId).name)} 様<div class="small muted">${esc(i.media)}・${md(i.date)}・担当 ${esc(uname(i.agentId))}</div></div></div>`).join('')}${rel.map((c) => `<div class="feed-item" onclick="App.go('contracts');App.open('contract','${c.id}')">${cStPill(c.status)}<div>${c.id} ${esc(conCust(c).name)} 様<div class="small muted">開始 ${md(c.startDate)}</div></div></div>`).join('')}` : '<div class="empty">なし</div>'}
        <div class="sec-t">関連タスク</div><div class="card">${relTasks('unit', id)}</div>
        <div class="sec-t">変更履歴</div>${logTimeline(entityLogs((l) => l.trace && l.trace.unitId === id && (l.entity === 'unit' || l.action === 'タスク自動生成')))}`,
      f: `${UI.role === 'chukai' && u.status === '募集中' ? `<button class="btn pri" onclick="App.newInquiry('${id}')">この部屋で反響登録</button>` : ''}${ed ? `<button class="btn" onclick="App.confirmUnits(['${id}'])">✓ 本日確認済みにする</button><button class="btn pri" onclick="App.editUnit('${id}')">✎ 募集条件を変更</button><button class="btn warn" style="margin-left:auto" onclick="App.deleteRecord('unit','${id}')">論理削除</button>` : ''}`,
    };
  }
  function drawerInquiry(id) {
    const i = inq(id); if (!i) return null; const c = cust(i.customerId); const u = unit(i.unitId); const ed = can('inquiries', 'E');
    const k = liveCon().find((x) => conApp(x).inquiryId === id);
    const active = INQ_ACTIVE.includes(i.status);
    return {
      h: `<div class="small muted">反響・顧客｜${esc(i.media)}・${ymd(i.date)}</div><h2>${esc(c.name)} 様</h2><div style="margin-top:4px">${iStPill(i.status)} <span class="small muted">担当 ${esc(uname(i.agentId))}</span></div>`,
      b: `<div class="sec-t">進捗ステータス</div>
        <div class="chips">${INQ_ST.map((s) => `<button class="chip ${i.status === s ? 'on' : ''}" ${ed && !['成約'].includes(s) && !['申込', '成約'].includes(i.status) ? `onclick="App.inqStatus('${id}','${s}')"` : 'disabled'}>${s}</button>`).join('')}</div>
        ${['申込', '成約'].includes(i.status) && k ? `<div class="inherit" style="margin-top:8px">申込済：<a href="javascript:App.go('contracts');App.open('contract','${k.id}')">${k.id}（${k.status}）</a> に引き継がれています</div>` : ''}
        <div class="sec-t">顧客情報・希望条件 ${ed ? `<button class="btn xs" onclick="App.editCustomer('${c.id}')">✎ 編集</button>` : ''}</div>
        <dl class="kv2"><dt>電話</dt><dd>${esc(c.tel || '—')}</dd><dt>希望家賃</dt><dd>${c.budget ? '〜' + yen(c.budget) : '—'}</dd><dt>エリア</dt><dd>${esc(c.area || '—')}</dd><dt>間取り</dt><dd>${esc(c.layout || '—')}</dd><dt>入居希望日</dt><dd>${ymd(c.moveIn)}</dd><dt>次回追客日</dt><dd>${active ? (i.nextFollow ? dueTxt(i.nextFollow) : '<span class="pill p-red">未設定</span>') : '—'}</dd></dl>
        ${c.note ? `<div class="note" style="margin-top:8px">特記事項：${esc(c.note)}</div>` : ''}
        <div class="sec-t">対象物件（管理課の最新情報）</div>
        <div class="feed-item card" style="border-radius:10px" onclick="App.go('units');App.open('unit','${u.id}')">${uStPill(u.status)}<div><div class="bold">${esc(unitName(u))}</div><div class="small muted">${u.layout}・${yen(u.rent)}＋${yen(u.fee)}・AD ${adTxt(u.ad)}・${esc(unitMgmt(u).name)}</div></div></div>
        ${u.status !== '募集中' && active ? `<div class="note amber" style="margin-top:6px">この物件は現在「${u.status}」です（管理課が更新）。別物件の提案をご検討ください。</div>` : ''}
        ${ed && active ? `<div class="sec-t">対応を記録</div>
        <div class="form"><div><label>対応種別</label><select id="act-type">${['電話', 'メール', '案内', '提案', '来店', 'LINE等'].map((t) => `<option>${t}</option>`).join('')}</select></div>
          <div><label>次回追客日<span class="opt">設定でタスク化</span></label><input id="act-next" type="date" value="${addDays(TODAY, 3)}"></div>
          <div class="full"><label>対応内容<span class="req">*</span></label><input id="act-content" type="text" placeholder="例：内見の感想を確認。家賃交渉の可否を管理会社に確認する"></div></div>
        <div style="margin-top:8px;display:flex;gap:6px"><button class="btn pri" onclick="App.addActivity('${id}')">対応を登録</button><span class="small muted" style="align-self:center">3日後・5日後などの初期値は設定例（仮仕様）</span></div>` : ''}
        <div class="sec-t">対応履歴</div>
        <div class="timeline">${i.history.slice().reverse().map((h) => `<div class="tl"><div class="tl-h">${h.at.replace(/-/g, '/')}　${esc(uname(h.userId))}</div><div class="tl-b"><span class="pill p-outline">${esc(h.type)}</span> ${esc(h.content)}</div></div>`).join('')}</div>
        <div class="sec-t">関連タスク</div><div class="card">${relTasks('inquiry', id)}</div>
        <div class="sec-t">変更履歴</div>${logTimeline(entityLogs((l) => l.entity === 'inquiry' && l.entityId === id))}`,
      f: ed ? `${active ? `<button class="btn pri" onclick="App.registerApp('${id}')">➜ 申込登録（情報を引継ぎ）</button><button class="btn" onclick="App.inqStatus('${id}','失注')">失注にする</button>` : ''}<button class="btn warn" style="margin-left:auto" onclick="App.deleteRecord('inquiry','${id}')">論理削除</button>` : '',
    };
  }
  function drawerContract(id) {
    const c = con(id); if (!c) return null; const a = conApp(c); const u = conUnit(c); const cu = conCust(c); const s = stlForCon(id); const ed = can('contracts', 'E');
    const locked = ['完了', 'キャンセル'].includes(c.status);
    const nextKey = CK.find(([k]) => c.checklist[k] !== 'done');
    return {
      h: `<div class="small muted">申込・契約案件｜申込 ${a.id}・${ymd(a.appliedAt)}</div><h2>${c.id}　${esc(cu.name)} 様</h2><div style="margin-top:4px">${cStPill(c.status)} ${mgmtPill(u)} <span class="small muted">担当 ${esc(uname(a.agentId))}</span></div>`,
      b: `${c.status === 'キャンセル' ? `<div class="note amber" style="margin-bottom:10px">キャンセル済：${esc(c.cancelReason)}。物件は自動再募集せず、管理課の判断待ちです。</div>` : ''}
        <div class="sec-t">チェックリスト ${ed && !locked ? '<span class="small muted" style="font-weight:400">クリックで 未⇄済／差戻しは下のボタン</span>' : ''}</div>
        <div class="checklist">${CK.map(([k, l]) => { const v = c.checklist[k]; return `<div class="ck ${v === 'done' ? 'done' : v === 'back' ? 'back' : ''} ${k === 'payment' || locked || !ed ? 'lock' : ''} ${nextKey && nextKey[0] === k && !locked ? 'next' : ''}" onclick="App.check('${id}','${k}')"><div class="ck-l">${l}</div><div class="ck-s">${v === 'done' ? '✓' : v === 'back' ? '↩' : '○'}</div>${k === 'payment' ? '<div class="small muted" style="font-size:10px">経理連動</div>' : ''}</div>`; }).join('')}</div>
        ${Object.entries(c.backReason || {}).map(([k, r]) => `<div class="note amber" style="margin-top:8px">↩ ${CK_L[k]} 差戻し：${esc(r)}（再提出後にチェックすると差戻しタスクが完了）</div>`).join('')}
        ${ed && !locked ? `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><span class="small muted" style="align-self:center">書類差戻し：</span>${['app', 'juji', 'contract', 'docs'].map((k) => `<button class="btn xs" onclick="App.backDoc('${id}','${k}')">${CK_L[k]}</button>`).join('')}</div>` : ''}
        ${nextKey && !locked ? `<div class="small" style="margin-top:8px;color:var(--amber)">▶ 次の工程：${nextKey[1]}${nextKey[0] === 'invoice' ? '（チェックで精算レコードと経理タスクを自動生成）' : nextKey[0] === 'payment' ? '（経理の入金確認待ち）' : ''}</div>` : ''}
        <div class="sec-t">契約情報（反響・物件から引継ぎ） ${ed && !locked ? `<button class="btn xs" onclick="App.editContract('${id}')">✎ 編集</button>` : ''}</div>
        <dl class="kv2"><dt>物件・号室</dt><dd><a href="javascript:App.go('units');App.open('unit','${u.id}')">${esc(unitName(u))}</a></dd><dt>管理会社</dt><dd class="small">${esc(unitMgmt(u).name)}</dd>
          <dt>契約者</dt><dd>${esc(cu.name)} 様</dd><dt>連絡先</dt><dd>${esc(cu.tel || '—')}</dd><dt>家賃・共益費</dt><dd>${yen(u.rent)}／${yen(u.fee)}</dd><dt>AD</dt><dd>${adTxt(u.ad)}</dd>
          <dt>申込日</dt><dd>${ymd(a.appliedAt)}</dd><dt>契約開始日</dt><dd>${locked ? ymd(c.startDate) : dueTxt(c.startDate)}</dd><dt>反響</dt><dd><a href="javascript:App.go('inquiries');App.open('inquiry','${a.inquiryId}')">${esc(inq(a.inquiryId)?.media || '')} ${md(inq(a.inquiryId)?.date)}</a></dd><dt>客付</dt><dd>自社（${esc(storeName(a.agentId))}）</dd></dl>
        ${!isOwn(u) ? '<div class="note purple" style="margin-top:8px">他社管理物件：AD受領・送金・相殺の扱いは管理会社ごとに異なる可能性があり、<b>要確認</b>です。</div>' : ''}
        <div class="sec-t">経理連携</div>
        ${s ? `<div class="feed-item card" style="border-radius:10px" onclick="App.go('settlements');App.open('settlement','${s.id}')">${payPill(s)}<div><div class="bold">${s.id}｜請求 ${yen(s.billAmount)}</div><div class="small muted">入金期日 ${md(s.payDue)}・経理確認 ${s.accountingChecked ? '済' : '未'}・送金 ${s.remitStatus}</div></div></div>` : '<div class="empty" style="padding:10px">請求書をチェックすると精算レコードが自動生成され、経理にタスクが届きます</div>'}
        <div class="sec-t">関連タスク</div><div class="card">${relTasks('contract', id)}</div>
        <div class="sec-t">変更履歴</div>${logTimeline(entityLogs((l) => l.trace && l.trace.contractId === id))}`,
      f: ed && !locked ? `<button class="btn warn" onclick="App.cancelContract('${id}')">申込キャンセル</button><button class="btn" style="margin-left:auto" onclick="App.go('base');App.trace('${id}')">関連トレースを見る</button>` : `<button class="btn" onclick="App.go('base');App.trace('${id}')">関連トレースを見る</button>`,
    };
  }
  const storeName = (uid) => (byId(S.stores, storeOfUser(uid)) || {}).name || '';
  function drawerSettlement(id) {
    const s = stl(id); if (!s) return null; const c = stlCon(s); const u = conUnit(c); const ed = can('settlements', 'E'); const own = isOwn(u);
    const cancelled = s.payStatus === 'キャンセル';
    return {
      h: `<div class="small muted">入出金・精算｜契約 ${c.id}</div><h2>${s.id}　${esc(conCust(c).name)} 様</h2><div style="margin-top:4px">${payPill(s)} ${remitPill(s)} ${mgmtPill(u)} ${s.accountingChecked ? '<span class="pill p-green">経理確認済</span>' : '<span class="pill p-amber">経理未確認</span>'}</div>`,
      b: `${cancelled ? '<div class="note amber" style="margin-bottom:10px">契約がキャンセルされました。返金・請求取消の要否を確認してください（運用ルールは要確認）。</div>' : ''}
        <div class="sec-t">契約情報（自動引継ぎ）</div>
        <dl class="kv2"><dt>契約案件</dt><dd><a href="javascript:App.go('contracts');App.open('contract','${c.id}')">${c.id}</a> ${cStPill(c.status)}</dd><dt>物件</dt><dd class="small">${esc(unitName(u))}</dd>
          <dt>契約者</dt><dd>${esc(conCust(c).name)} 様</dd><dt>担当</dt><dd>${esc(uname(conApp(c).agentId))}</dd><dt>管理会社</dt><dd class="small">${esc(unitMgmt(u).name)}</dd><dt>契約開始日</dt><dd>${ymd(c.startDate)}</dd></dl>
        <div class="sec-t">金額 <span class="tag-demo">デモ数値</span> ${ed && !cancelled ? `<button class="btn xs" onclick="App.editSettlement('${id}')">✎ 編集</button>` : ''}</div>
        <dl class="kv2"><dt>初期費用</dt><dd>${yen(s.initialCost)}</dd><dt>請求額</dt><dd class="bold">${yen(s.billAmount)}</dd><dt>仲介手数料</dt><dd>${yen(s.brokerFee)}</dd><dt>自社受領AD</dt><dd>${yen(s.ad)}</dd><dt>他社支払AD</dt><dd>${yen(s.adPayOther)}</dd><dt>送金予定額</dt><dd>${own ? '<span class="muted small">賃貸革命で処理</span>' : yen(s.remitAmount) + ' <span class="tag-kari">仮計算</span>'}</dd></dl>
        ${!own ? '<div class="small muted" style="margin-top:4px">仮計算の例：請求額 − 仲介手数料 − 自社受領AD（相殺ありの場合）。正式な精算・相殺ルールは要確認のため、計算仕様としては扱いません。</div>' : ''}
        <div class="sec-t">入金</div>
        <dl class="kv2"><dt>入金期日</dt><dd>${s.payStatus === '入金済' || cancelled ? ymd(s.payDue) : dueTxt(s.payDue)}</dd><dt>入金確認日</dt><dd>${ymd(s.payConfirmed)}</dd><dt>入金ステータス</dt><dd>${payPill(s)}</dd><dt>経理確認</dt><dd>${s.accountingChecked ? '済' : '未'}</dd></dl>
        <div class="sec-t">送金</div>
        <dl class="kv2"><dt>送金先</dt><dd class="small">${esc(s.remitTo)}</dd><dt>送金予定日</dt><dd>${s.remitDue ? (s.remitStatus === '送金済' ? ymd(s.remitDue) : dueTxt(s.remitDue)) : '—'}</dd><dt>送金済日</dt><dd>${ymd(s.remittedAt)}</dd><dt>送金ステータス</dt><dd>${remitPill(s)}</dd></dl>
        <div class="sec-t">添付書類 <span class="small muted" style="font-weight:400">（ファイル実体は保存しないデモ）</span></div>
        <div style="display:flex;gap:8px"><button class="btn sm" onclick="App.toggleAttach('${id}','attachInvoice')">${s.attachInvoice ? '✓ 請求書 添付済' : '○ 請求書 未添付'}</button><button class="btn sm" onclick="App.toggleAttach('${id}','attachStatement')">${s.attachStatement ? '✓ 精算書 添付済' : '○ 精算書 未添付'}</button></div>
        <div class="sec-t">経理タスク</div><div class="card">${relTasks('settlement', id)}</div>
        <div class="sec-t">変更履歴（変更前後の値・更新者）</div>${logTimeline(entityLogs((l) => l.trace && l.trace.settlementId === id))}`,
      f: ed && !cancelled ? `${!s.accountingChecked ? `<button class="btn pri" onclick="App.acctCheck('${id}')">✓ 経理確認を完了</button>` : ''}${s.accountingChecked && s.payStatus !== '入金済' ? `<button class="btn pri" onclick="App.payConfirm('${id}')">¥ 入金を確認</button>` : ''}${s.payStatus === '入金済' && ['送金予定', '未送金'].includes(s.remitStatus) ? `<button class="btn pri" onclick="App.remitDone('${id}')">➜ 送金済にする</button>` : ''}<button class="btn" style="margin-left:auto" onclick="App.editSettlement('${id}')">✎ 金額・期日を編集</button>`
        : (!ed ? '<span class="small muted">経理ロールで入金確認・送金登録ができます（ヘッダーで切替）</span>' : ''),
    };
  }

  // =========================================================
  //  GUIDE
  // =========================================================
  function openGuide() {
    UI.guideSeen = true; save();
    const steps = [
      ['kanri', '管理課', '空室・募集管理で「フォレスト本町 201」を開き、募集状態を確認（または期限超過物件を選んで「確認済み」に）', "App.role('kanri');App.go('units')"],
      ['chukai', '仲介店舗', 'ロールを仲介店舗に切替。募集物件一覧に管理課の最新状態がそのまま表示される', "App.role('chukai');App.go('units')"],
      ['chukai', '仲介店舗', '「＋反響登録」で顧客と対象物件（募集中のみ）を登録 → 初回対応タスクが生成', "App.role('chukai');App.go('inquiries');App.newInquiry()"],
      ['chukai', '仲介店舗', '反響詳細で対応内容と次回追客日を登録 → ダッシュボードのタスク・未追客件数に反映', "App.role('chukai');App.go('inquiries')"],
      ['chukai', '仲介店舗', '反響詳細の「申込登録」→ 顧客・物件・担当を引継いだ申込を作成。物件は「申込中」に、管理課へ掲載停止タスク', "App.role('chukai');App.go('inquiries')"],
      ['chukai', '仲介店舗', '申込・契約進捗でチェックリスト（審査→重説→契約書）を進める', "App.role('chukai');App.go('contracts')"],
      ['chukai', '仲介店舗', '「請求書」をチェック → 精算レコードと経理確認タスクを自動生成', "App.role('chukai');App.go('contracts')"],
      ['keiri', '経理', 'ロールを経理に切替。入出金・精算で「経理確認」→「入金確認」→（他社管理は）「送金済」', "App.role('keiri');App.go('settlements')"],
      ['exec', '経営者', '情報基盤の関連トレースで、物件→反響→申込→契約→精算と変更履歴を一続きで確認', "App.role('exec');App.go('base');App.p17('trace')"],
      ['chukai', '仲介店舗', '別案件で「申込キャンセル」→ 物件は自動再募集されず「確認待ち」、管理課に判断タスク', "App.role('chukai');App.go('contracts')"],
    ];
    modal('デモの進め方（約5分）と実装範囲', `
      <div class="note" style="margin-bottom:10px"><b>中核メッセージ：</b>情報を探す・転記する・確認する仕事から、顧客対応と成約に集中できる組織へ。<br>主役は「管理課で更新した情報が仲介店舗へ届き、申込・契約を経て経理までつながる」一連の体験です。</div>
      ${steps.map(([r, rl, t, go], i) => `<div class="guide-step"><div class="gs-n">${i + 1}</div><div style="flex:1"><span class="pill ${{ kanri: 'p-navy', chukai: 'p-teal', keiri: 'p-amber', exec: 'p-blue' }[r]}">${rl}</span> ${t}</div><button class="btn xs" onclick="App._mc();${go}">移動</button></div>`).join('')}
      <div class="sec-t" style="margin-top:16px">実装区分</div>
      <table class="impl"><tr><th style="width:110px">区分</th><th>内容</th></tr>
      <tr><td><span class="pill p-green">実装済み</span><br><span class="small muted">ブラウザ内で動作</span></td><td>7画面／ロール切替（4ロール）／横断検索・通知／一覧の検索・フィルタ・ソート／物件・反響・申込・契約・精算の登録・編集・ステータス更新／タスク自動生成・完了／KPI・アラートの実データ集計／変更前後の履歴記録／関連トレース／権限による操作制御／論理削除・復元／ローカル保存・初期化</td></tr>
      <tr><td><span class="pill p-amber">擬似実装</span><br><span class="small muted">デモ連携／仕様要確認</span></td><td>SUUMO・アットホーム・ピタットハウスの掲載状態（表示のみ・実更新なし）／外部情報CSV差分取込（固定の擬似データ）／ポータル反響の自動取込表示／Slack等への通知配信／書類添付（状態のみ）／銀行入金の消込</td></tr>
      <tr><td><span class="pill p-gray">未実装</span><br><span class="small muted">本番設計で要確認</span></td><td>賃貸革命との連携（API/CSV）／ノマドクラウドからのデータ移行／実認証・アクセス制御・監査ログ・バックアップ／他社管理物件の精算・相殺・AD計算の正式ルール／部門・店舗別の承認フロー・通知タイミング／帳票出力</td></tr></table>`, null, null, null, true);
  }

  // ---------- boot ----------
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (document.getElementById('modal-root').innerHTML) A._mc(); else if (UI.drawer) A.closeDrawer(); } });
  document.addEventListener('click', (e) => { if (UI.notifOpen && !e.target.closest('.notif') && !e.target.closest('.icon-btn')) { UI.notifOpen = false; renderHeader(); } });
  render();
  if (!UI.guideSeen) openGuide();
})();
