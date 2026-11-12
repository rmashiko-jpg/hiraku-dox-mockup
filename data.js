/* =========================================================
   株式会社ひらく様 DoX業務基盤 モックアップ — 初期データ
   ※すべて架空データ（物件・人物・取引・金額は実在しません）
   ========================================================= */
window.DEMO_TODAY = '2026-11-12';

window.buildSeed = function () {
  const T = new Date(DEMO_TODAY + 'T00:00:00');
  const d = (off) => {
    if (off === null || off === undefined) return null;
    const x = new Date(T); x.setDate(x.getDate() + off);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  };
  const dt = (off, hm) => d(off) + ' ' + hm;

  const stores = [
    { id: 's1', name: '西口店' },
    { id: 's2', name: '泉中央店（架空例）' },
  ];

  const users = [
    { id: 'u01', name: '高橋 誠', dept: '経営', role: 'exec', storeId: null, title: '代表取締役' },
    { id: 'u02', name: '青木 由佳', dept: '管理課', role: 'kanri', storeId: null, title: '管理課' },
    { id: 'u03', name: '森田 翔', dept: '管理課', role: 'kanri', storeId: null, title: '管理課' },
    { id: 'u04', name: '小野 拓海', dept: '仲介', role: 'chukai', storeId: 's1', title: '西口店 仲介' },
    { id: 'u05', name: '菅原 彩', dept: '仲介', role: 'chukai', storeId: 's1', title: '西口店 仲介' },
    { id: 'u06', name: '千葉 健太', dept: '仲介', role: 'chukai', storeId: 's2', title: '泉中央店（架空例）仲介' },
    { id: 'u07', name: '遠藤 真理', dept: '経理', role: 'keiri', storeId: null, title: '経理' },
  ];

  const companies = [
    { id: 'own', name: '自社管理', own: true },
    { id: 'mc1', name: '杜の都不動産管理（架空）', own: false, source: '業者間サイトA' },
    { id: 'mc2', name: '青葉ハウジング（架空）', own: false, source: '元付サイトB' },
    { id: 'mc3', name: 'みちのく住宅サービス（架空）', own: false, source: '業者間サイトA' },
    { id: 'mc4', name: '広瀬エステート（架空）', own: false, source: '元付FAX/電話' },
  ];

  const P = (id, name, addr, mc, storeId) => ({ id, name, address: '仙台市' + addr, mgmtId: mc, storeId: storeId || 's1', deleted: false });
  const properties = [
    P('p01', 'フォレスト本町', '青葉区本町2丁目', 'own'),
    P('p02', 'メゾン北四番丁', '青葉区北四番丁', 'own'),
    P('p03', 'グランディール五橋', '青葉区五橋1丁目', 'mc1'),
    P('p04', 'リバーサイド花壇', '青葉区花壇', 'mc2'),
    P('p05', 'コンフォート上杉', '青葉区上杉3丁目', 'own'),
    P('p06', 'ヴィラ八幡', '青葉区八幡2丁目', 'mc3'),
    P('p07', 'アーバン榴岡', '宮城野区榴岡4丁目', 'own'),
    P('p08', 'シエル宮城野', '宮城野区宮城野1丁目', 'mc1'),
    P('p09', 'パークサイド連坊', '若林区連坊小路', 'own'),
    P('p10', 'ルミエール長町', '太白区長町5丁目', 'mc4'),
    P('p11', 'カーサ泉中央', '泉区泉中央1丁目', 'own', 's2'),
    P('p12', 'ハイツ将監', '泉区将監3丁目', 'mc2', 's2'),
    P('p13', 'エスポワール小田原', '青葉区小田原', 'mc1'),
    P('p14', 'ソレイユ木町通', '青葉区木町通', 'mc3'),
    P('p15', 'ステラ二日町', '青葉区二日町', 'own'),
    P('p16', 'ブランシェ荒町', '若林区荒町', 'mc4'),
    P('p17', 'オーク卸町', '若林区卸町', 'own'),
    P('p18', 'ノース八乙女', '泉区八乙女中央', 'own', 's2'),
    P('p19', 'サンライズ中山', '青葉区中山', 'mc1'),
    P('p20', 'レジデンス原ノ町', '宮城野区原町', 'own'),
    P('p21', 'フルール富沢', '太白区富沢', 'mc2', 's2'),
    P('p22', 'グリーンヒル旭ケ丘', '青葉区旭ケ丘', 'own'),
    P('p23', 'ラ・ポルタ錦町', '青葉区錦町', 'mc3'),
    P('p24', 'テラス東照宮', '青葉区東照宮', 'own'),
  ];

  const LM = { o: '掲載中', s: '停止', n: '未掲載', w: '停止確認待ち', u: '更新待ち' };
  const Un = (id, pid, room, layout, area, rent, fee, ad, avail, status, conf, asg, lst, note) => ({
    id, propertyId: pid, room, layout, area, rent, fee, ad, availableDate: d(avail), status,
    lastConfirmed: d(conf), assigneeId: asg,
    listings: { suumo: LM[lst[0]], athome: LM[lst[1]], pitat: LM[lst[2]] },
    note: note || '', deleted: false,
  });
  const units = [
    Un('r01', 'p01', '201', '1K', 25.1, 62000, 5000, 1.0, -10, '募集中', -3, 'u02', 'ooo'),
    Un('r02', 'p01', '305', '1LDK', 40.2, 89000, 6000, 1.0, 20, '募集中', -9, 'u02', 'ooo'),
    Un('r03', 'p02', '102', '1K', 22.0, 52000, 3000, 0.5, 0, '募集中', -2, 'u03', 'oon'),
    Un('r04', 'p03', '403', '2LDK', 55.3, 118000, 8000, 2.0, 30, '申込中', -1, 'u02', 'www', '申込受付済（審査中）'),
    Un('r05', 'p03', '108', '1DK', 30.0, 68000, 4000, 1.0, -5, '募集中', -12, 'u03', 'ooo'),
    Un('r06', 'p04', '202', '1LDK', 38.5, 82000, 5000, 1.0, 14, '募集中', -4, 'u03', 'oon'),
    Un('r07', 'p05', '101', '1K', 24.0, 58000, 3000, 1.0, 5, '申込中', -6, 'u02', 'sss'),
    Un('r08', 'p05', '303', '2DK', 45.0, 75000, 5000, 0.5, -20, '募集中', -8, 'u02', 'ooo'),
    Un('r09', 'p06', '201', '1K', 21.5, 49000, 3000, 2.0, 0, '募集中', -1, 'u03', 'oon'),
    Un('r10', 'p07', '501', '2LDK', 60.1, 125000, 10000, 1.0, 45, '募集中', -2, 'u02', 'ooo'),
    Un('r11', 'p07', '205', '1LDK', 36.0, 78000, 5000, 1.0, 10, '申込中', -5, 'u02', 'sss'),
    Un('r12', 'p08', '302', '1K', 23.0, 54000, 4000, 1.0, -3, '確認待ち', -15, 'u03', 'oon', '元付で他社成約の可能性あり'),
    Un('r13', 'p09', '103', '1R', 19.8, 43000, 2000, 0.0, 0, '募集中', -10, 'u03', 'onn'),
    Un('r14', 'p10', '402', '2LDK', 58.0, 98000, 6000, 2.0, 25, '申込中', -3, 'u02', 'sss'),
    Un('r15', 'p11', '101', '1LDK', 42.0, 72000, 4000, 1.0, 7, '募集中', -4, 'u03', 'ooo'),
    Un('r16', 'p11', '208', '2LDK', 55.0, 88000, 5000, 1.0, -30, '募集停止', -20, 'u03', 'sss', 'オーナー意向により一時停止'),
    Un('r17', 'p12', '105', '1K', 24.5, 46000, 3000, 1.0, 0, '募集中', -6, 'u02', 'oon'),
    Un('r18', 'p13', '301', '1K', 26.0, 60000, 4000, 1.0, -40, '契約済', -25, 'u02', 'sss'),
    Un('r19', 'p14', '202', '1DK', 31.0, 65000, 4000, 1.5, 3, '募集中', -11, 'u03', 'ooo'),
    Un('r20', 'p15', '401', '1LDK', 41.0, 92000, 6000, 1.0, 15, '募集中', -2, 'u02', 'ooo'),
    Un('r21', 'p15', '102', '1K', 23.5, 59000, 4000, 1.0, -50, '契約済', -30, 'u02', 'sss'),
    Un('r22', 'p16', '203', '2DK', 46.0, 70000, 4000, 2.0, 0, '確認待ち', -9, 'u03', 'sss', '申込キャンセル。募集再開は管理課判断待ち'),
    Un('r23', 'p17', '105', '1K', 22.5, 47000, 3000, 0.5, 0, '募集中', -1, 'u03', 'oon'),
    Un('r24', 'p18', '302', '3LDK', 72.0, 110000, 8000, 1.0, 60, '募集中', -5, 'u03', 'ooo'),
    Un('r25', 'p19', '201', '1LDK', 39.0, 76000, 5000, 2.0, 10, '確認待ち', -14, 'u02', 'ooo', '元付で条件変更の連絡あり（未確認）'),
    Un('r26', 'p20', '106', '1K', 21.0, 45000, 3000, 1.0, -15, '募集停止', -18, 'u02', 'sss', '原状回復工事中'),
    Un('r27', 'p21', '303', '2LDK', 57.0, 95000, 6000, 1.5, 20, '募集中', -3, 'u03', 'oon'),
    Un('r28', 'p22', '201', '2DK', 48.0, 66000, 3000, 1.0, -7, '募集中', -8, 'u02', 'onn'),
    Un('r29', 'p23', '502', '1LDK', 43.0, 99000, 7000, 2.0, 5, '募集中', -2, 'u03', 'ooo'),
    Un('r30', 'p24', '101', '1K', 25.0, 61000, 4000, 1.0, 0, '募集中', -4, 'u02', 'ooo'),
  ];

  const Cu = (id, name, tel, budget, area, layout, moveIn, note) => ({ id, name, tel, email: id + '@example.com', budget, area, layout, moveIn: d(moveIn), note, deleted: false });
  const customers = [
    Cu('c01', '佐藤 美咲', '090-0000-1101', 65000, '青葉区', '1K', 30, '駅徒歩10分以内希望'),
    Cu('c02', '鈴木 大輔', '090-0000-1102', 130000, '宮城野区', '2LDK', 45, 'ファミリー。駐車場1台必要'),
    Cu('c03', '伊藤 遥', '090-0000-1103', 85000, '青葉区', '1LDK', 20, 'ペット可（小型犬）を優先'),
    Cu('c04', '渡辺 翔太', '090-0000-1104', 95000, '青葉区', '1LDK', 25, '在宅勤務のため2口コンロ・ネット無料希望'),
    Cu('c05', '山本 千尋', '090-0000-1105', 75000, '泉区', '1LDK', 15, '実家が泉区。通勤は地下鉄'),
    Cu('c06', '中村 拓也', '090-0000-1106', 115000, '泉区', '3LDK', 60, '子ども2人。学区重視'),
    Cu('c07', '小林 優子', '090-0000-1107', 125000, '青葉区', '2LDK', 30, '法人契約の可能性あり'),
    Cu('c08', '加藤 亮', '090-0000-1108', 60000, '青葉区', '1K', 5, '学生（保証人：父）'),
    Cu('c09', '吉田 沙織', '090-0000-1109', 80000, '宮城野区', '1LDK', 10, '転勤。会社指定の保証会社'),
    Cu('c10', '山田 健', '090-0000-1110', 100000, '太白区', '2LDK', 3, '新婚世帯'),
    Cu('c11', '佐々木 明', '090-0000-1111', 62000, '青葉区', '1K', -35, ''),
    Cu('c12', '松本 恵', '090-0000-1112', 60000, '青葉区', '1K', -45, ''),
    Cu('c13', '井上 直樹', '090-0000-1113', 72000, '若林区', '2DK', 30, '転勤取りやめで一度キャンセル。再提案の余地あり'),
    Cu('c14', '木村 舞', '090-0000-1114', 100000, '青葉区', '1LDK', 40, '内見済み。他社物件と比較中'),
    Cu('c15', '林 健二', '090-0000-1115', 50000, '青葉区', '1K', 10, ''),
    Cu('c16', '清水 結衣', '090-0000-1116', 100000, '太白区', '2LDK', 50, '初回反響（ポータル経由）'),
  ];

  const H = (off, hm, type, content, userId) => ({ at: dt(off, hm), type, content, userId });
  const In = (id, cid, rid, media, date, agent, status, next, history, lost) => ({ id, customerId: cid, unitId: rid, media, date: d(date), agentId: agent, status, nextFollow: d(next), history: history || [], lostReason: lost || '', deleted: false });
  const inquiries = [
    In('i01', 'c01', 'r01', 'SUUMO', -1, 'u04', '新規反響', null, [H(-1, '18:42', '反響', 'SUUMOから問合せ（自動取込：デモ）', 'u04')]),
    In('i02', 'c02', 'r10', 'アットホーム', -2, 'u05', '初回対応済', 0, [H(-2, '11:05', '反響', 'アットホームから問合せ', 'u05'), H(-2, '13:20', '電話', '希望条件をヒアリング。駐車場の空き確認後に連絡', 'u05')]),
    In('i03', 'c03', 'r06', 'ピタットハウス', -5, 'u04', '内見予定', 1, [H(-5, '10:00', '反響', 'ピタットハウスHPから問合せ', 'u04'), H(-4, '15:30', 'メール', '類似物件2件を提案', 'u04'), H(-3, '17:00', '電話', '11/13 14時に内見予定', 'u04')]),
    In('i04', 'c04', 'r20', 'SUUMO', -8, 'u04', '追客中', -2, [H(-8, '09:40', '反響', 'SUUMOから問合せ', 'u04'), H(-6, '14:00', '案内', '内見実施。前向きだが家賃交渉の希望', 'u04')]),
    In('i05', 'c05', 'r15', "HOME'S", -6, 'u06', '追客中', -1, [H(-6, '12:10', '反響', "HOME'Sから問合せ", 'u06'), H(-4, '16:45', '提案', '泉中央エリアで3件提案', 'u06')]),
    In('i06', 'c06', 'r24', '来店', -3, 'u06', '内見予定', 2, [H(-3, '13:00', '来店', '来店。学区条件を確認', 'u06')]),
    In('i07', 'c07', 'r04', 'SUUMO', -12, 'u04', '申込', null, [H(-12, '10:20', '反響', 'SUUMOから問合せ', 'u04'), H(-5, '11:00', '案内', '内見実施', 'u04'), H(-2, '17:30', '申込', '申込受付', 'u04')]),
    In('i08', 'c08', 'r07', 'アットホーム', -20, 'u05', '申込', null, [H(-20, '19:00', '反響', 'アットホームから問合せ', 'u05'), H(-8, '15:00', '申込', '申込受付', 'u05')]),
    In('i09', 'c09', 'r11', 'ピタットハウス', -25, 'u04', '申込', null, [H(-25, '09:00', '反響', 'ピタットハウスHPから問合せ', 'u04'), H(-12, '14:00', '申込', '申込受付', 'u04')]),
    In('i10', 'c10', 'r14', 'SUUMO', -30, 'u05', '申込', null, [H(-30, '20:15', '反響', 'SUUMOから問合せ', 'u05'), H(-18, '13:00', '申込', '申込受付', 'u05')]),
    In('i11', 'c11', 'r18', 'アットホーム', -55, 'u04', '成約', null, [H(-55, '10:00', '反響', 'アットホームから問合せ', 'u04'), H(-50, '16:00', '申込', '申込受付', 'u04')]),
    In('i12', 'c12', 'r21', 'SUUMO', -70, 'u05', '成約', null, [H(-70, '11:00', '反響', 'SUUMOから問合せ', 'u05'), H(-60, '15:00', '申込', '申込受付', 'u05')]),
    In('i13', 'c13', 'r22', '電話', -18, 'u04', '追客中', 3, [H(-18, '09:30', '反響', '電話問合せ', 'u04'), H(-15, '12:00', '申込', '申込受付', 'u04'), H(-4, '10:00', 'キャンセル', '申込キャンセル（転勤取りやめ）。条件再ヒアリング予定', 'u04')]),
    In('i14', 'c14', 'r29', 'SUUMO', -10, 'u05', '追客中', null, [H(-10, '18:00', '反響', 'SUUMOから問合せ', 'u05'), H(-7, '11:00', '案内', '内見実施。他社物件と比較中', 'u05')]),
    In('i15', 'c15', 'r09', 'アットホーム', -15, 'u04', '失注', null, [H(-15, '10:30', '反響', 'アットホームから問合せ', 'u04'), H(-9, '13:00', '電話', '他社で決定とのこと', 'u04')], '他社で成約'),
    In('i16', 'c16', 'r27', 'ピタットハウス', 0, 'u05', '新規反響', null, [H(0, '08:55', '反響', 'ピタットハウスHPから問合せ（自動取込：デモ）', 'u05')]),
  ];

  const CL = (s) => { const k = ['app', 'screening', 'juji', 'contract', 'invoice', 'payment', 'docs']; const m = { d: 'done', t: 'todo', b: 'back' }; const o = {}; k.forEach((x, i) => o[x] = m[s[i]]); return o; };
  const applications = [
    { id: 'A001', inquiryId: 'i07', customerId: 'c07', unitId: 'r04', agentId: 'u04', appliedAt: d(-2) },
    { id: 'A002', inquiryId: 'i08', customerId: 'c08', unitId: 'r07', agentId: 'u05', appliedAt: d(-8) },
    { id: 'A003', inquiryId: 'i09', customerId: 'c09', unitId: 'r11', agentId: 'u04', appliedAt: d(-12) },
    { id: 'A004', inquiryId: 'i10', customerId: 'c10', unitId: 'r14', agentId: 'u05', appliedAt: d(-18) },
    { id: 'A005', inquiryId: 'i11', customerId: 'c11', unitId: 'r18', agentId: 'u04', appliedAt: d(-50) },
    { id: 'A006', inquiryId: 'i12', customerId: 'c12', unitId: 'r21', agentId: 'u05', appliedAt: d(-60) },
    { id: 'A007', inquiryId: 'i13', customerId: 'c13', unitId: 'r22', agentId: 'u04', appliedAt: d(-15) },
  ];
  const Co = (id, appId, start, status, cl, extra) => Object.assign({ id, applicationId: appId, startDate: d(start), status, checklist: CL(cl), backReason: {}, cancelReason: '', deleted: false }, extra || {});
  const contracts = [
    Co('K001', 'A001', 25, '審査中', 'dtttttt'),
    Co('K002', 'A002', 10, '契約準備中', 'ddttttt'),
    Co('K003', 'A003', 8, '契約手続中', 'dddbttt', { backReason: { contract: '契約書の署名・押印漏れ（借主）' } }),
    Co('K004', 'A004', 3, '契約手続中', 'ddddd tt'.replace(' ', '')),
    Co('K005', 'A005', -35, '完了', 'ddddddd'),
    Co('K006', 'A006', -45, '完了', 'ddddddd'),
    Co('K007', 'A007', 5, 'キャンセル', 'ddttttt', { cancelReason: '申込者都合（転勤取りやめ）' }),
  ];

  const settlements = [
    { id: 'S004', contractId: 'K004', initialCost: 392000, brokerFee: 107800, ad: 196000, adPayOther: 0, billAmount: 392000, remitAmount: 88200,
      payDue: d(-1), payConfirmed: null, payStatus: '入金待ち', accountingChecked: true,
      remitTo: '広瀬エステート（架空）', remitDue: d(5), remittedAt: null, remitStatus: '送金予定', attachInvoice: true, attachStatement: false, deleted: false },
    { id: 'S005', contractId: 'K005', initialCost: 240000, brokerFee: 66000, ad: 60000, adPayOther: 0, billAmount: 240000, remitAmount: 114000,
      payDue: d(-42), payConfirmed: d(-41), payStatus: '入金済', accountingChecked: true,
      remitTo: '杜の都不動産管理（架空）', remitDue: d(2), remittedAt: null, remitStatus: '送金予定', attachInvoice: true, attachStatement: true, deleted: false },
    { id: 'S006', contractId: 'K006', initialCost: 236000, brokerFee: 64900, ad: 59000, adPayOther: 0, billAmount: 236000, remitAmount: 0,
      payDue: d(-52), payConfirmed: d(-52), payStatus: '入金済', accountingChecked: true,
      remitTo: '（オーナー送金は賃貸革命で処理）', remitDue: null, remittedAt: null, remitStatus: '対象外', attachInvoice: true, attachStatement: true, deleted: false },
  ];

  const Tk = (id, kind, title, dept, asg, due, refType, refId, status) => ({ id, kind, title, dept, assigneeId: asg, due: d(due), status: status || 'open', ref: { type: refType, id: refId }, auto: kind !== 'manual', createdAt: dt(Math.min(due, 0) - 1, '09:00'), doneAt: null });
  const tasks = [
    Tk('t001', 'listing-stop', '掲載停止確認：グランディール五橋 403（申込受付）', '管理課', 'u02', 0, 'unit', 'r04'),
    Tk('t002', 'first', '初回対応：佐藤 美咲 様（SUUMO反響）', '仲介', 'u04', 0, 'inquiry', 'i01'),
    Tk('t003', 'first', '初回対応：清水 結衣 様（ピタットハウス反響）', '仲介', 'u05', 0, 'inquiry', 'i16'),
    Tk('t004', 'follow', '追客：鈴木 大輔 様（駐車場空き確認の連絡）', '仲介', 'u05', 0, 'inquiry', 'i02'),
    Tk('t005', 'follow', '追客：伊藤 遥 様（内見フォロー）', '仲介', 'u04', 1, 'inquiry', 'i03'),
    Tk('t006', 'follow', '追客：渡辺 翔太 様（家賃交渉の回答）', '仲介', 'u04', -2, 'inquiry', 'i04'),
    Tk('t007', 'follow', '追客：山本 千尋 様（提案物件の感想確認）', '仲介', 'u06', -1, 'inquiry', 'i05'),
    Tk('t008', 'follow', '追客：中村 拓也 様（内見日程）', '仲介', 'u06', 2, 'inquiry', 'i06'),
    Tk('t009', 'follow', '追客：井上 直樹 様（キャンセル後の再提案）', '仲介', 'u04', 3, 'inquiry', 'i13'),
    Tk('t010', 'doc-back', '書類差戻し対応：契約書（K003 吉田 沙織 様）', '仲介', 'u04', 0, 'contract', 'K003'),
    Tk('t011', 'pay-confirm', '入金確認：K004 山田 健 様（期日超過）', '経理', 'u07', -1, 'settlement', 'S004'),
    Tk('t012', 'remit', '送金：杜の都不動産管理（架空）へ K005 精算分', '経理', 'u07', 2, 'settlement', 'S005'),
    Tk('t013', 'relist-judge', '募集再開判断：ブランシェ荒町 203（申込キャンセル）', '管理課', 'u03', 0, 'unit', 'r22'),
    Tk('t014', 'ext-check', '元付確認：シエル宮城野 302（他社成約の可能性）', '管理課', 'u03', -1, 'unit', 'r12'),
    Tk('t015', 'manual', 'オーナー報告：サンライズ中山 201 条件変更の確認', '管理課', 'u02', 1, 'unit', 'r25'),
    Tk('t016', 'remit', '送金：広瀬エステート（架空）へ K004 精算分（入金確認後）', '経理', 'u07', 5, 'settlement', 'S004'),
  ];

  const Lg = (off, hm, userId, entity, entityId, action, field, before, after, trace) => ({ at: dt(off, hm), userId, entity, entityId, action, field: field || '', before: before ?? '', after: after ?? '', trace: trace || {} });
  const logs = [
    Lg(-60, '15:10', 'u05', 'contract', 'K006', '申込登録', '', '', '審査中', { unitId: 'r21', inquiryId: 'i12', contractId: 'K006' }),
    Lg(-52, '10:00', 'u07', 'settlement', 'S006', '入金確認', '入金ステータス', '入金待ち', '入金済', { unitId: 'r21', contractId: 'K006', settlementId: 'S006' }),
    Lg(-45, '17:00', 'u05', 'contract', 'K006', 'ステータス変更', '進捗', '契約手続中', '完了', { unitId: 'r21', contractId: 'K006' }),
    Lg(-50, '16:05', 'u04', 'contract', 'K005', '申込登録', '', '', '審査中', { unitId: 'r18', inquiryId: 'i11', contractId: 'K005' }),
    Lg(-41, '11:20', 'u07', 'settlement', 'S005', '入金確認', '入金ステータス', '入金待ち', '入金済', { unitId: 'r18', contractId: 'K005', settlementId: 'S005' }),
    Lg(-35, '18:00', 'u04', 'contract', 'K005', 'ステータス変更', '進捗', '契約手続中', '完了', { unitId: 'r18', contractId: 'K005' }),
    Lg(-18, '13:05', 'u05', 'contract', 'K004', '申込登録', '', '', '審査中', { unitId: 'r14', inquiryId: 'i10', contractId: 'K004' }),
    Lg(-15, '12:10', 'u04', 'contract', 'K007', '申込登録', '', '', '審査中', { unitId: 'r22', inquiryId: 'i13', contractId: 'K007' }),
    Lg(-12, '14:10', 'u04', 'contract', 'K003', '申込登録', '', '', '審査中', { unitId: 'r11', inquiryId: 'i09', contractId: 'K003' }),
    Lg(-9, '10:30', 'u02', 'unit', 'r22', '募集条件変更', '家賃', '72,000', '70,000', { unitId: 'r22' }),
    Lg(-8, '15:05', 'u05', 'contract', 'K002', '申込登録', '', '', '審査中', { unitId: 'r07', inquiryId: 'i08', contractId: 'K002' }),
    Lg(-6, '16:00', 'u05', 'contract', 'K004', 'チェック更新', '請求書', '未', '済', { unitId: 'r14', contractId: 'K004' }),
    Lg(-6, '16:00', 'system', 'settlement', 'S004', '精算レコード生成', '', '', '請求書登録により自動生成', { unitId: 'r14', contractId: 'K004', settlementId: 'S004' }),
    Lg(-5, '17:40', 'u07', 'settlement', 'S004', '経理確認', '経理確認', '未', '済', { unitId: 'r14', contractId: 'K004', settlementId: 'S004' }),
    Lg(-4, '10:05', 'u04', 'contract', 'K007', 'キャンセル', '進捗', '契約準備中', 'キャンセル', { unitId: 'r22', inquiryId: 'i13', contractId: 'K007' }),
    Lg(-4, '10:05', 'system', 'unit', 'r22', '状態変更', '募集状態', '申込中', '確認待ち', { unitId: 'r22', contractId: 'K007' }),
    Lg(-3, '11:30', 'u04', 'contract', 'K003', '書類差戻し', '契約書', '未', '差戻し', { unitId: 'r11', contractId: 'K003' }),
    Lg(-2, '17:35', 'u04', 'contract', 'K001', '申込登録', '', '', '審査中', { unitId: 'r04', inquiryId: 'i07', contractId: 'K001' }),
    Lg(-2, '17:35', 'system', 'unit', 'r04', '状態変更', '募集状態', '募集中', '申込中', { unitId: 'r04', contractId: 'K001' }),
    Lg(-1, '09:15', 'u02', 'unit', 'r01', '空室確認', '最終空室確認日', '', d(-3), { unitId: 'r01' }),
  ];

  // 外部情報（CSV取込デモ）— 元付/業者間サイトから取得した想定の差分データ
  const extFeed = [
    { unitId: 'r05', field: 'rent', label: '家賃', value: 66000, source: '業者間サイトA（CSV）' },
    { unitId: 'r12', field: 'status', label: '募集状態', value: '募集停止', source: '業者間サイトA（CSV）', memo: '他社で成約済' },
    { unitId: 'r19', field: 'ad', label: 'AD', value: 2.0, source: '業者間サイトA（CSV）' },
    { unitId: 'r27', field: 'availableDate', label: '入居可能日', value: d(30), source: '元付サイトB（CSV）' },
    { unitId: 'r09', field: 'fee', label: '共益費', value: 3500, source: '業者間サイトA（CSV）' },
  ];

  return { stores, users, companies, properties, units, customers, inquiries, applications, contracts, settlements, tasks, logs, extFeed,
    seq: { task: 17, inquiry: 17, customer: 17, app: 8, contract: 8, settlement: 7 } };
};
