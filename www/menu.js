/* Пасека: главное меню, экраны, профиль, рейтинг, задания, достижения, обновления, жизненный цикл приложения */
(function(){
'use strict';
const R=id=>document.getElementById(id),CP=(window.Capacitor&&window.Capacitor.Plugins)||{},V=/__/.test(CFG.VERSION)?'1.1.0':CFG.VERSION;
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lvl=()=>1+Math.floor(Math.log(1+S.tot/100)*2),lvAt=n=>100*(Math.exp((n-1)/2)-1);
const dk=d=>{d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const openUrl=u=>{try{if(CP.Browser)return CP.Browser.open({url:u})}catch(e){}window.open(u,'_blank')};
S.db=S.db||{last:'',s:0};S.ac=S.ach.length;

/* ---------- навигация ---------- */
const stack=[];
function mkScr(id,title,ic){const s=el('div','scr',`<div class="sh"><button class="bk">‹</button><span>${ic} ${title}</span></div><div class="sb"></div>`);s.id='s_'+id;s.querySelector('.bk').onclick=back;document.body.appendChild(s);return s.querySelector('.sb')}
const isOn=id=>R('s_'+id).classList.contains('on');
function openScr(id){const s=R('s_'+id);if(!s||s.classList.contains('on'))return;s.style.zIndex=30+stack.length;s.classList.add('on');stack.push(id);sfx('tap');if(id=='log')S.seenV=V;if(id=='ny')nyOpen();if(id=='top')loadTop();if(id=='prof')fillProf();uiX()}
function back(){const id=stack.pop();if(id){R('s_'+id).classList.remove('on');sfx('tap');if(id=='ny')nyClose()}}
const showMenu=()=>{while(stack.length)back();R('menu').classList.add('on');uiX()};
const play=()=>{R('menu').classList.remove('on');sfx('tap');if(!S.tut)startTut()};
window.openScr=openScr;
const put=(sb,e)=>{e.classList.add('on');sb.appendChild(e)},sec=t=>el('div','sec',t);

/* ---------- магазин: яйца, бонусы, скины ---------- */
const BON=[['pot','🧪','Зелье скорости','Все пчёлы быстрее ×1.8 · 60 с',60,0],['rain','🌧','Нектарный дождь','Цветы растут ×3 · 90 с',90,1],['wind','💨','Турбо-крылья','Пчёлы быстрее ×1.5 · 90 с',90,1],['rush','🤑','Золотая лихорадка','Мёд дороже ×2 · 60 с',60,3],['swarm','🐝','Рой-помощник','Пчёлы несут ×2 · 60 с',60,3]];
const bcost=m=>Math.max(100,Math.floor(S.tot*.006))*m,tmp=el('div');
const BC2=BON.map(b=>{const c=mkc(tmp,b[1],b[2]);c.dd.textContent=b[3];c.e.onclick=()=>{const p=b[0]=='pot'?100:bcost(b[5]);if(S.coins<p)return sfx('no');S.coins-=p;if(b[0]=='pot')potT=60;else{E={k:b[0],n:b[1]+' '+b[2],x:'',t:b[4],d:b[4]};evT=Math.max(evT,b[4]+45)}stat('bon',1);sfx('buy');note(b[1]+' '+b[2]+' — '+b[4]+' с!')};return c});
R('shop').querySelectorAll('.card').forEach(c=>{});
const potImg={pot:0,rain:160,wind:60,rush:280,swarm:210};
EG.e.querySelector('span').innerHTML="<img class='bi' src='img/items/egg.svg' alt=''>";
BON.forEach((b,i)=>{BC2[i].e.querySelector('span').innerHTML=`<img class='bi' src='img/items/potion.svg' alt='' style='filter:hue-rotate(${potImg[b[0]]}deg)'>`});
R('shop').prepend(EG.e,...BC2.map(c=>c.e));
/* премиум-магазин за 💎 (реальные платежи не подключены — нужен Google Play) */
const GM=[
 ['pack','Набор пасечника',30,()=>`+${fmt(base()*20)} 🪙, +${fmt(200*(S.bees+2))} 🍯 и 2 бесплатных яйца`,()=>{S.coins+=base()*20;S.honey+=200*(S.bees+2);S.fe+=2},()=>0],
 ['chest','Золотой сундук',100,()=>`+${fmt(base()*100)} 🪙 и +${fmt(1000*(S.bees+2))} 🍯`,()=>{S.coins+=base()*100;S.honey+=1000*(S.bees+2)},()=>0],
 ['egg','Эксклюзивная пчела',60,()=>'Гарантированно легендарная или мифическая пчела. Нужно место в улье.',()=>hatch(4),()=>S.bees>=hcap()?'Нужен улей':0],
 ['gift','Скин «Радужная пчела»',120,()=>'Радужное оформление пчёл со свечением',()=>{S.own.push('b5')},()=>S.own.includes('b5')?'Куплено':0],
 ['hive','Улей «Золотой дворец»',80,()=>'Золотое оформление ульев с красной крышей',()=>{S.own.push('h4')},()=>S.own.includes('h4')?'Куплено':0],
 ['potion','Премиум-бустер',40,()=>'Золотая лихорадка: мёд ×2 на 3 минуты',()=>{E={k:'rush',n:'🤑 Золотая лихорадка',x:'',t:180,d:180};evT=Math.max(evT,225)},()=>0]];
const prem=el('div','pg on');
const GC=GM.map(g=>{const c=mkc(prem,`<img class='bi' src='img/items/${g[0]}.svg' alt=''>`,g[1]);c.e.onclick=()=>{const l=g[5]();if(l||(S.gem||0)<g[2])return sfx('no');S.gem-=g[2];g[4]();sfx('gold');note('💎 Куплено: '+g[1]);save()};return c});
let sb=mkScr('shop','Магазин','🛍');
const TABS=[['don','💎','Донат'],['upg','⬆️','Улучшения'],['reg','🛍','Магазин'],['skn','🎨','Скины'],['bee','🐝','Пчёлы'],['hiv','🏠','Ульи']],tb=el('div','tabs2');
TABS.forEach(([k,i,n])=>{const b=el('button',0,i+' '+n);b.dataset.k=k;b.onclick=()=>{sb.dataset.tab=k;[...tb.children].forEach(x=>x.classList.toggle('on',x.dataset.k==k));sb.scrollTop=0;sfx('tap')};tb.append(b)});sb.append(tb);
const note0=el('div','nc','<small>💎 зарабатываются в игре · оплата деньгами пока не подключена</small>');note0.dataset.t='don';prem.prepend(note0);
GC.forEach(c=>c.e.dataset.t='don');BC2.forEach(c=>c.e.dataset.t='reg');EG.e.dataset.t='bee';
R('shop').querySelectorAll(':scope>.sec').forEach(x=>x.remove());SK.forEach(s=>{s.e.dataset.t=s.key=='bs'?'skn':'hiv'});
UP.forEach(u=>{u.e.dataset.t=u.k=='bees'?'bee':(u.k=='hives'||u.k=='hx')?'hiv':'upg'});
sb.append(prem);put(sb,R('shop'));put(sb,R('cards'));tb.children[1].click();
sb=mkScr('col','Коллекция пчёл','🐝');put(sb,R('bz'));sb.append(sec('🎨 Мои скины'));
const SIMG={rad:'bees/skin_rad',city:'items/hive_city'},MY=[],myg=el('div','pg on'),myn=el('div','nc','<small>Пока нет скинов. Загляни в магазин → «Скины» и «Ульи».</small>');
[['bs',BS],['hs',HS]].forEach(([key,defs])=>Object.entries(defs).forEach(([id,v])=>{if(id=='b0'||id=='h0')return;const c=mkc(myg,SIMG[id]?`<img class='bi' src='img/${SIMG[id]}.svg' alt=''>`:`<i class='sw' style='background:linear-gradient(135deg,${v.c||v.t} 50%,${v.s||v.l} 50%)'></i>`,v.n);c.dd.textContent=v.ds;c.e.onclick=()=>{if(!S.own.includes(id))return sfx('no');S[key]=S[key]==id?(key=='bs'?'b0':'h0'):id;sfx('tap')};MY.push({id,key,c})}));
sb.append(myn,myg);
function updMy(){let n=0;MY.forEach(m=>{const ow=S.own.includes(m.id);if(ow)n++;m.c.e.style.display=ow?'':'none';m.c.bb.textContent=S[m.key]==m.id?'✓ Надето · снять':'Надеть'});myn.style.display=n?'none':''}
sb=mkScr('hive','Локации и королевы','🗺');sb.append(sec('👑 Королевы'));put(sb,R('qn'));sb.append(sec('🌍 Локации'));put(sb,R('lc'));
sb=mkScr('set','Настройки','⚙️');put(sb,R('set'));
const mb2=(t,f)=>{const b=el('button','tg',t);b.onclick=f;return b};
row('ℹ️ Версия '+V,mb2('Проверить',()=>chkUpd(true)));row('💬 Telegram',mb2('Открыть',()=>openUrl(CFG.TG)));row('🎓 Обучение',mb2('Пройти',()=>startTut()));const ORI={auto:'Авто',portrait:'Вертикально',landscape:'Горизонтально'};const ob=mb2(ORI[S.ori]||'Авто',()=>{const k=Object.keys(ORI);S.ori=k[(k.indexOf(S.ori)+1)%3];ob.textContent=ORI[S.ori];applyOri();save();note('📱 Ориентация: '+ORI[S.ori])});row('📱 Ориентация экрана',ob);{const mv=el('input');mv.type='range';mv.min=0;mv.max=1;mv.step=.05;mv.value=S.mvol==null?.7:S.mvol;mv.oninput=()=>{S.mvol=+mv.value};mv.onchange=()=>sfx('pop');row('🎵 Громкость музыки',mv)}row('📰 Журнал обновлений',mb2('Открыть',()=>openScr('log')));
const bk=el('textarea');bk.rows=3;bk.placeholder='Код сохранения: вставь сюда и нажми «Загрузить»';bk.style.cssText='width:100%;box-sizing:border-box;border:2px solid var(--bd);border-radius:10px;padding:8px;background:var(--card);color:var(--fg);font-size:12px';
row('💾 Резервная копия',mb2('Копировать код',()=>{save();const c='PSK1:'+btoa(unescape(encodeURIComponent(JSON.stringify(S))));bk.value=c;const man=()=>{bk.select();note('Выдели код и скопируй его вручную')};try{navigator.clipboard.writeText(c).then(()=>note('✅ Код скопирован — сохрани его в заметки'),man)}catch(e){man()}}));
row('📥 Из резервной копии',mb2('Загрузить',()=>{try{const r=bk.value.trim(),o=JSON.parse(r[0]=='{'?r:decodeURIComponent(escape(atob(r.replace(/\s+/g,'').replace(/^PSK1:/,'')))));if(!o||typeof o!='object'||!('coins' in o))throw 0;Object.assign(S,o);if(!Array.isArray(S.own))S.own=['b0','h0'];S.hives=Math.max(1,Math.min(6,S.hives|0));S.bees=Math.max(1,Math.min(S.bees|0,hcap()));bees=[];for(let i=0;i<S.bees;i++)addBee();FL.forEach(f=>f.n=nmax());G=null;save();sync(true);bk.value='';note('✅ Прогресс загружен!')}catch(e){note('❌ Неверный код')}}));
R('set').appendChild(bk);
sb=mkScr('adm','Админ','🛠');put(sb,R('adm'));

/* ---------- профиль ---------- */
const AVI=BT.map((_,i)=>'bee_'+i);
const avHtml=a=>/^(bee|skin)_\w+$/.test(a)?`<img class="avi" src="img/bees/${a}.svg" alt="">`:(!a||a=='🐝'?'<img class="avi" src="img/bees/bee_0.svg" alt="">':esc(a));
sb=mkScr('prof','Профиль','👤');
sb.innerHTML=`<div class="pcard"><div class="av" id="pav"></div><input id="pnick" maxlength="16" placeholder="Никнейм"><button class="tg" id="psave">Сохранить</button></div><div class="avs" id="pavs"></div><div><div id="plv" style="font-weight:800;margin-bottom:4px"></div><div class="bar"><i id="pbar"></i></div></div><div class="stg" id="pst"></div>`;
const avb=AVI.map((a,i)=>{const b=el('button',0,`<img class="avi" src="img/bees/${a}.svg" alt="">`);b.onclick=()=>{if(!S.col[i])return note('Найди эту пчелу в яйцах, чтобы выбрать аватар');S.av=a;sync(true);sfx('tap');uiX()};R('pavs').append(b);return b});
R('psave').onclick=()=>{const v=R('pnick').value.replace(/[<>&"']/g,'').trim().slice(0,16);if(v.length<2)return note('Ник: минимум 2 символа');S.nick=v;save();sync(true);sfx('buy');note('✅ Ник сохранён: '+v)};
const fillProf=()=>{R('pnick').value=S.nick};
function updProf(){const L=lvl(),a=lvAt(L),b=lvAt(L+1),p=Math.max(0,Math.min(1,(S.tot-a)/(b-a)));R('pav').innerHTML=avHtml(S.av);avb.forEach((x,i)=>{x.classList.toggle('on',AVI[i]==S.av||(i==0&&S.av=='🐝'));x.classList.toggle('lk',!S.col[i])});
 R('plv').textContent=`⭐ Уровень ${L} · до следующего ${Math.round(p*100)}%`;R('pbar').style.width=p*100+'%';
 const d=new Date(S.t0),days=Math.floor((Date.now()-S.t0)/864e5)+1,st=[['🍯 Мёд сейчас',fmt(S.honey)],['🪙 Монеты',fmt(S.coins)],['🍯 Всего собрано',fmt(S.hc)],['🪙 Всего заработано',fmt(S.tot)],['🐝 Пчёл',S.bees],['🏠 Ульев',S.hives],['📅 Начало игры',d.toLocaleDateString()],['🗓 Дней в игре',days],['🎖 Достижений',S.ach.length+'/'+ACH.length],['🌼 Тапов по цветам',fmt(S.st.tap||0)],['🔄 Перерождений',S.rb||0],['✨ Бонус дохода','×'+(1.2**(S.rb||0)*(1+.02*S.ach.length)).toFixed(2)]];
 const h=st.map(x=>`<div>${x[0]}<b>${x[1]}</b></div>`).join('');if(R('pst')._h!==h){R('pst')._h=h;R('pst').innerHTML=h}}

/* ---------- общий рейтинг (Supabase) ---------- */
const sbOK=()=>CFG.SB_URL&&CFG.SB_KEY&&!/__/.test(CFG.SB_URL+CFG.SB_KEY);
async function sbf(path,o){o=o||{};const c=new AbortController(),t=setTimeout(()=>c.abort(),8000);try{return await fetch(CFG.SB_URL+'/rest/v1/'+path,{...o,headers:{apikey:CFG.SB_KEY,Authorization:'Bearer '+CFG.SB_KEY,'Content-Type':'application/json',...(o.headers||{})},signal:c.signal})}finally{clearTimeout(t)}}
let lastSync='';
async function sync(force){if(!sbOK())return;const d={id:S.pid,nick:S.nick,av:S.av,honey:Math.floor(S.hc),coins:Math.floor(S.tot),level:lvl()},k=JSON.stringify(d);if(!force&&k==lastSync)return;try{const r=await sbf('players?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({...d,updated_at:new Date().toISOString()})});if(r.ok)lastSync=k}catch(e){}}
let tk='honey';const TC={honey:['honey','🍯 Мёд'],coins:['coins','🪙 Монеты'],level:['level','⭐ Уровень']};
sb=mkScr('top','Топ игроков','🏆');
sb.innerHTML=`<div class="seg" id="tseg"></div><div id="tme" class="tr me" style="display:none"></div><div id="tl" style="display:flex;flex-direction:column;gap:8px"></div>`;
Object.keys(TC).forEach(k=>{const b=el('button',k==tk?'on':'',TC[k][1]);b.dataset.k=k;b.onclick=()=>{tk=k;[...R('tseg').children].forEach(x=>x.classList.toggle('on',x.dataset.k==k));loadTop()};R('tseg').append(b)});
async function loadTop(){const box=R('tl'),me=R('tme');me.style.display='none';
 if(!sbOK()){const rc=[['🍯 Всего собрано мёда',fmt(S.hc)],['🪙 Всего заработано',fmt(S.tot)],['⭐ Уровень',lvl()],['🔄 Перерождений',S.rb||0],['🎖 Достижений',S.ach.length+'/'+ACH.length]];
  box.innerHTML='<div class="nc">🏅 Твои рекорды<br><small>Общий рейтинг игроков не подключён, поэтому здесь только твои результаты на этом телефоне.</small></div>'+rc.map(r=>`<div class="tr"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');return}
 box.innerHTML='<div class="nc">Загрузка…</div>';await sync(true);
 try{const c=TC[tk][0],r=await sbf(`players?select=id,nick,av,${c}&order=${c}.desc,updated_at.asc&limit=10`);if(!r.ok)throw 0;const a=await r.json();
  box.innerHTML=a.length?a.map((p,i)=>`<div class="tr${p.id==S.pid?' me':''}"><span class="rk">${['🥇','🥈','🥉'][i]||i+1}</span><span>${avHtml(p.av||'bee_0')} ${esc(p.nick)}</span><b>${fmt(p[c])}</b></div>`).join(''):'<div class="nc">Пока никого нет — стань первым!</div>';
  const mv=tk=='honey'?Math.floor(S.hc):tk=='coins'?Math.floor(S.tot):lvl(),r2=await sbf(`players?select=id&${c}=gt.${mv}&limit=1`,{headers:{Prefer:'count=exact'}}),n=parseInt((r2.headers.get('content-range')||'').split('/')[1]);
  if(!isNaN(n)){me.innerHTML=`<span class="rk">#${n+1}</span><span>${avHtml(S.av)} ${esc(S.nick)} (вы)</span><b>${fmt(mv)}</b>`;me.style.display='flex'}
 }catch(e){box.innerHTML='<div class="nc">😕 Нет связи с сервером. Попробуйте позже.</div>'}}
setInterval(()=>sync(false),60000);setTimeout(()=>sync(true),3000);

/* ---------- достижения, ежедневный бонус, задания ---------- */
const SV={hc:()=>S.hc,sold:()=>S.st.sold||0,buy:()=>S.st.buy||0,tap:()=>S.st.tap||0,gold:()=>S.st.gold||0,up:()=>S.st.up||0,bon:()=>S.st.bon||0,hv:()=>S.hives,loc:()=>S.ul.reduce((a,b)=>a+(b?1:0),0),col:()=>S.col.reduce((a,b)=>a+(b?1:0),0),lvl:()=>lvl(),q:()=>S.q.reduce((a,b)=>a+b,0),rb:()=>S.rb||0,locv:()=>S.st.locv||0,sec:()=>S.st.sec||0,mr:()=>S.st.mr||0};
const ACH=[['hc1','🍯','Первые капли','hc',100],['hc2','🍯','Медовая река','hc',1e4],['hc3','🍯','Медовое море','hc',1e6],['hc4','🍯','Медовый океан','hc',1e9],['sd1','💰','Торговец','sold',500],['sd2','💰','Купец','sold',5e4],['by1','🐝','Новый друг','buy',3],['by2','🐝','Целый рой','buy',25],['hv1','🏠','Второй дом','hv',2],['hv2','🏰','Пасечный магнат','hv',6],['lc1','🌍','Путешественник','loc',2],['lc2','🗺','Исследователь','loc',4],['cl1','📖','Коллекционер','col',4],['cl2','📚','Все пчёлы','col',11],['gd1','🌟','Золотая рука','gold',1],['gd2','🌟','Охотник за золотом','gold',20],['lv1','⭐','Уровень 5','lvl',5],['lv2','⭐','Уровень 15','lvl',15],['lv3','⭐','Уровень 30','lvl',30],['qn1','👑','Королевский двор','q',10],['qn2','👑','Императрица','q',50],['up1','⬆️','Мастер улучшений','up',25],['rb1','🔄','Перерождение','rb',1],['rb2','🔥','Феникс','rb',5],['rb3','🔄','Десять жизней','rb',10],['rb4','👑','Мастер возрождения','rb',15],['sc1','🔍','Находчик','sec',1],['sc2','🔍','Кладоискатель','sec',10],['mr1','🛒','Выгодная сделка','mr',1],['mr2','🛒','Постоянный клиент','mr',5],['ex1','🪐','Покоритель космоса','loc',5],['ex2','☢️','Радиоактивный путь','loc',6]];
const base=()=>Math.max(100,Math.floor(S.tot*.01));window.baseG=base;
const DR=[['🪙',()=>{const c=base();S.coins+=c;return fmt(c)+' 🪙'}],['🍯',()=>{const h=50*(S.bees+2);S.honey+=h;return fmt(h)+' 🍯'}],['🥚',()=>{S.fe++;return 'бесплатное яйцо 🥚'}],['🪙',()=>{const c=base()*2;S.coins+=c;S.gem+=5;return fmt(c)+' 🪙 и 5 💎'}],['🍯',()=>{const h=150*(S.bees+2);S.honey+=h;return fmt(h)+' 🍯'}],['🪙',()=>{const c=base()*4;S.coins+=c;return fmt(c)+' 🪙'}],['🎁',()=>{S.gem+=20;if(S.bees<hcap()){hatch(3);return 'эпическая пчела и 20 💎'}const c=base()*10;S.coins+=c;return fmt(c)+' 🪙 и 20 💎'}]];
const QP=[['🍯','Собери {g} мёда','hc',()=>Math.max(50,Math.floor(S.tot*.003))],['💰','Продай {g} мёда','sold',()=>Math.max(40,Math.floor(S.tot*.002))],['🌼','Тапни по цветам {g} раз','tap',()=>25],['🌟','Поймай золотой цветок','gold',()=>1],['⬆️','Купи улучшений: {g}','up',()=>2],['🐝','Купи пчелу или яйцо','buy',()=>1],['⚡','Купи бонус в магазине','bon',()=>1],['🧭','Посети другую локацию','locv',()=>1],['🔍','Найди секретную находку','sec',()=>1]];
function rollQ(){const t=dk();if(S.dq&&S.dq.d==t)return;const p=QP.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,3);S.dq={d:t,p,g:p.map(i=>QP[i][3]()),b:p.map(i=>SV[QP[i][2]]()),c:[0,0,0]}}
const qv=i=>Math.max(0,Math.min(S.dq.g[i],SV[QP[S.dq.p[i]][2]]()-S.dq.b[i])),qdone=i=>qv(i)>=S.dq.g[i];
const dayIdx=()=>{const t=dk(),y=dk(new Date(Date.now()-864e5));return S.db.last==t?-1:S.db.last==y?S.db.s%7:0};
function claimDay(){const i=dayIdx();if(i<0)return sfx('no');const y=dk(new Date(Date.now()-864e5));S.db.s=S.db.last==y?S.db.s+1:1;S.db.last=dk();bpXp(20);const m=DR[i][1]();sfx('gold');note('🎁 День '+(i+1)+': '+m);save()}
function chkAch(q){ACH.forEach(a=>{if(!S.ach.includes(a[0])&&SV[a[3]]()>=a[4]){S.ach.push(a[0]);S.ac=S.ach.length;S.gem+=5;if(!q)bpXp(15);if(!q){note('🎖 '+a[2]+' — +2% к цене мёда и 5 💎');sfx('gold')}}})}
sb=mkScr('ach','Достижения','🎖');
sb.innerHTML=`<div class="sec">🎁 Ежедневный бонус</div><div class="days" id="dd"></div><button class="tg" id="dbtn" style="padding:12px;font-size:16px"></button><div class="sec">📋 Задания дня</div><div id="dq" style="display:flex;flex-direction:column;gap:8px"></div><div class="sec" id="ash"></div><div id="da" style="display:flex;flex-direction:column;gap:8px"></div>`;
DR.forEach((d,i)=>R('dd').append(el('div','',`<span>${d[0]}</span>День ${i+1}`)));R('dbtn').onclick=claimDay;
const QR=[0,1,2].map(i=>{const r=el('div','ac',`<span class="i"></span><div class="t"></div><button>Забрать</button>`);r.querySelector('button').onclick=()=>{if(S.dq.c[i]||!qdone(i))return sfx('no');S.dq.c[i]=1;const c=base();S.coins+=c;S.gem+=2;bpXp(10);sfx('buy');note('📋 Задание выполнено: +'+fmt(c)+' 🪙 и 2 💎')};R('dq').append(r);return r});
const AR=ACH.map(a=>{const r=el('div','ac',`<span class="i">${a[1]}</span><div class="t"></div>`);R('da').append(r);return r});
function updAch(){const cur=dayIdx(),b=R('dbtn');[...R('dd').children].forEach((c,i)=>{c.className=cur<0?(i==(S.db.s-1)%7?'cur':i<(S.db.s-1)%7?'done':''):(i==cur?'cur':i<cur?'done':'')});
 if(cur>=0){b.disabled=false;b.textContent='🎁 Забрать награду дня '+(cur+1)}else{const n=new Date(),ms=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1)-n,s=Math.floor(ms/1000);b.disabled=true;b.textContent='⏳ Следующая награда через '+String(s/3600|0).padStart(2,'0')+':'+String(s/60%60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
 QR.forEach((r,i)=>{const q=QP[S.dq.p[i]],g=S.dq.g[i],ok=qdone(i),bt=r.querySelector('button');r.classList.toggle('ok',!!S.dq.c[i]);r.children[0].textContent=q[0];r.children[1].innerHTML=q[1].replace('{g}',fmt(g))+`<small>${fmt(qv(i))} / ${fmt(g)} · награда ${fmt(base())} 🪙</small>`;bt.disabled=!ok||!!S.dq.c[i];bt.textContent=S.dq.c[i]?'✓':'Забрать'});
 R('ash').textContent=`🎖 Достижения: ${S.ach.length}/${ACH.length} · бонус к цене мёда +${S.ach.length*2}%`;
 ACH.forEach((a,i)=>{const ok=S.ach.includes(a[0]),v=Math.min(a[4],SV[a[3]]());AR[i].classList.toggle('ok',ok);AR[i].children[1].innerHTML=`${a[2]}${ok?' ✓':''}<small>${fmt(v)} / ${fmt(a[4])}</small>`;AR[i].style.opacity=ok?1:.8})}

/* ---------- перерождение, обучение, журнал обновлений ---------- */
const RBC=mkc(el('div'),'🔄','Перерождение'),RMAX=Math.max(1,+CFG.REB_MAX||15),rbReady=()=>S.hives>=6&&S.fl>=flcap()&&(S.rb||0)<RMAX;let rbArm=0;
sb=mkScr('rb','Перерождение','🔄');sb.append(el('div','nc','<b>Что сбросится:</b> монеты, мёд, пчёлы, ульи, улучшения, королевы, особые ульи торговца, локация.<br><b>Что сохранится:</b> скины, коллекция пчёл, достижения, статистика, ник, 💎 и бонус дохода.<br><b>Лимит:</b> '+RMAX+' перерождений (в будущем обновлении лимит вырастет).<br><b>Что получишь:</b> доход ×1.2 за каждое перерождение, +3 места под цветы и +1 место в каждом улье.'),RBC.e);
RBC.e.onclick=()=>{if(!rbReady())return sfx('no');if(!rbArm){rbArm=1;note('Нажми ещё раз, чтобы переродиться');setTimeout(()=>rbArm=0,4000);return}rbArm=0;rebirth()};
function rebirth(){if((S.rb||0)>=RMAX)return note('Достигнут лимит перерождений: '+RMAX);S.rb=(S.rb||0)+1;Object.assign(S,{coins:20,honey:0,bees:1,hives:1,spd:0,cap:0,price:0,nec:0,fl:0,auto:0,hx:0,spd2:0,hy:0,qk:0,lck:0,mhv:[0,0,0,0,0,0],mrb:[0,0],q:[0,0,0,0,0,0],loc:0,egg:0,bty:[]});bees=[];addBee(0);FL.forEach(f=>f.n=3);G=null;E=null;potT=0;MAN.acc=0;MAN.st='idle';MAN.load=0;S.gem+=25;bpXp(25);save();sync(true);sfx('gold');note('🔄 Перерождение №'+S.rb+'! Доход ×'+(1.2**S.rb).toFixed(2))}
const TUT=[['👋','Добро пожаловать на пасеку!','Ты пчеловод. Пчёлки сами собирают нектар и носят мёд в улей.'],['🌼','Тапай по цветам','Тап по цветку — ты сам собираешь нектар. Пустые цветки (почки) отрастают со временем.'],['🍯','Продавай мёд','Нажми на лавку или на кнопку «Продать» сверху — мёд превратится в монеты 🪙.'],['⬆️','Покупай улучшения','Кнопки внизу: 🛍 магазин и улучшения, 🐝 коллекция, 🗺 локации и королевы, 🎖 задания.'],['🧑‍🌾','Пасечник-помощник','Купи «Помощник в лавке» — человечек сам будет ходить к ульям и продавать мёд.'],['🧪','Зелья и яйца','В магазине: яйца с редкими пчёлами и зелье скорости за 100 монет — пчёлы летают быстрее минуту.'],['🌟','Золотой цветок','Лови золотой цветок — большой бонус! Иногда случаются события.'],['🌙','День и ночь','Ночью пчёлы медленнее и цветы растут хуже, зато мёд дороже. «Ночные фонари» сглаживают ночь. Осу гони тапом, пока она не украла мёд!'],['🛡','Battle Pass','Выполняй задания и играй: опыт открывает награды сезона. Сезон длится 28 дней.'],['🔄','Перерождение','Когда прокачаешь всё до максимума, переродись: начнёшь сначала, но доход будет ×1.2 навсегда.']];
function startTut(){if(R('tu'))return;let i=0;const m=el('div','',`<div><div id="tue" style="font-size:54px"></div><h2 id="tut"></h2><p id="tup"></p><div id="tud" style="margin-bottom:6px;letter-spacing:3px"></div><button id="tun"></button><button class="l" id="tus">Пропустить</button></div>`);m.id='tu';document.body.appendChild(m);
 const draw=()=>{const s=TUT[i];R('tue').textContent=s[0];R('tut').textContent=s[1];R('tup').textContent=s[2];R('tud').textContent=TUT.map((_,k)=>k==i?'●':'○').join(' ');R('tun').textContent=i<TUT.length-1?'Далее ›':'Поехали! 🐝'},end=()=>{S.tut=1;S.seenV=V;save();m.remove();sfx('buy')};
 R('tun').onclick=()=>{sfx('tap');if(i<TUT.length-1){i++;draw()}else end()};R('tus').onclick=end;draw()}
const LOG=[['1.6.0',['🛒 Странствующий торговец: два особых улья (+4 места для пчёл)','🪐 Новые локации: Космос и Радиационное поле','🎨 Радиационный скин для пчёл и городской улей (смотри «Коллекция → Мои скины»)','🛍 Магазин на вкладках: Донат, Улучшения, Магазин, Скины, Пчёлы, Ульи','🔍 Секретные находки на поле, новые задания и достижения','🔄 Лимит перерождений: 15','🎵 Музыка и звуковые эффекты настраиваются отдельно','🛠 Исправлены: «NaNc» у событий, наложения текста на главном экране, кнопки справа на поле']],['1.5.0',['🎄 Новогоднее событие с 1 декабря: адвент-календарь на 31 день, ёлка, пчёлки-эльфы','🧝 Новые пчёлы: Эльф (эпическая) и Дед Мороз (легендарная)','⏳ Отсчёт до открытия календаря и до Нового года по проверенному времени','🎆 1 января: поздравление, фейерверки, конфетти и подарок','📱 В настройках можно выбрать ориентацию экрана','🛠 Больше возможностей в админ-панели']],['1.4.0',['🛡 Battle Pass: 30 уровней, бесплатная и премиум-линия, сезоны по 28 дней','🌗 День и ночь, счётчик дней, светлячки, звёзды, ночные фонари','🐝💢 Осы-налётчики, засуха и гроза: игра стала сложнее','📱 Новый HUD как на макете и поворот экрана (горизонтальный режим)','💰 Все цены выросли примерно на 50%']],['1.3.0',['🏠 Новый главный экран: профиль, уровень, задание, ежедневный бонус','🐝 11 видов пчёл с настоящими картинками и редкостями, красивое открытие редких пчёл','📖 Страница «Коллекция пчёл» с силуэтами ещё не найденных','🛍 Единый магазин: премиум 💎 сверху, обычные товары, улучшения внизу','💎 Премиум-валюта: даётся за достижения, задания, бонусы и перерождения','👤 Аватары-пчёлы вместо смайликов','🔐 Постоянная подпись APK: обновления ставятся поверх старой версии']],['1.2.0',['🔄 Перерождение: когда всё прокачано — начни заново с доходом ×1.2 навсегда','🧪 Зелье скорости: 100 монет — пчёлы быстрее на 1 минуту','⬆️ 4 новых улучшения: Реактивные крылья, Густой мёд, Быстрый сбор, Удача пасечника','🧑‍🌾 Пасечник-человечек ходит за мёдом и продаёт его в лавке','🎓 Обучение для новичков и журнал обновлений','🏅 Без базы рейтинга показываются твои личные рекорды','💾 Резервная копия прогресса (Настройки) — можно перенести игру на другой телефон']],['1.1.0',['🏠 Главное меню и отдельные экраны','👤 Профиль с аватаром и статистикой','🏆 Общий рейтинг (по желанию)','🎁 Ежедневный бонус, задания дня и 22 достижения','🔊 Музыка замолкает при сворачивании игры','📲 Проверка обновлений']],['1.0.0',['👑 Королевы пчёл и 🌍 4 локации','🐝 Редкие пчёлы, яйца и коллекция','✨ События и золотой цветок','🎨 Скины пчёл и ульев']]];
sb=mkScr('log','Что нового','📰');LOG.forEach(([v,a])=>sb.append(el('div','nc',`<b style="font-size:17px">v${v}${v==V?' · новая':''}</b><ul style="text-align:left;margin:8px 0 0;padding-left:20px;font-weight:600">${a.map(x=>`<li>${x}</li>`).join('')}</ul>`)));
if(!S.tut&&(S.tot>25||S.bees>1))S.tut=1;if(!S.tut)S.seenV=V;if(S.tut&&S.seenV!=V)setTimeout(()=>openScr('log'),700);

/* ---------- Battle Pass ---------- */
const BPS=[['Летний мёд','☀️'],['Осенний урожай','🍂'],['Зимняя сказка','❄️'],['Весенний цвет','🌸']],BPL=30,SEAS=28,EP=Date.UTC(2026,0,1);
const seasonIdx=()=>Math.floor((Date.now()-EP)/864e5/SEAS),seasonLeft=()=>Math.max(0,EP+(seasonIdx()+1)*SEAS*864e5-Date.now());
function bpInit(){const s=seasonIdx();if(!S.bp||S.bp.s!==s)S.bp={s,xp:0,f:[],p:[],prem:0,d:0}}
const bpNeed=l=>80+20*l,bpLv=()=>{let x=S.bp.xp,l=0;while(l<BPL&&x>=bpNeed(l)){x-=bpNeed(l);l++}return[l,l>=BPL?0:x]};
function bpXp(n){bpInit();S.bp.xp+=n}
window.bpXp=bpXp;window.bpD=()=>{bpInit();S.bp.d=(S.bp.d||0)+1;if(S.bp.d%10==0)S.bp.xp+=1};
const SKB=['b1','b2','b3','b4'],SKH=['h1','h2','h3','h4'];
const bpR=(tr,l)=>{const b=base(),s=(((seasonIdx()%4)+4)%4),g=n=>['💎',n+' 💎',()=>{S.gem+=n}];
 if(!tr){if(l==30)return['🎁','20 💎 и яйцо',()=>{S.gem+=20;S.fe++}];if(l%10==0)return['🥚','Яйцо',()=>{S.fe++}];if(l%5==0)return g(l/5*2);
  return l%2?['🪙',fmt(b*(1+l*.4))+' 🪙',()=>{S.coins+=b*(1+l*.4)}]:['🍯',fmt(30*(S.bees+2)*(1+l*.2))+' 🍯',()=>{S.honey+=30*(S.bees+2)*(1+l*.2)}]}
 if(l==30)return['👑','Мифическая пчела и 60 💎',()=>{S.gem+=60;if(S.bees<hcap())hatch(5);else S.fe+=3}];
 if(l==10||l==20){const id=(l==10?SKB:SKH)[s],nm=(l==10?BS:HS)[id].n;return['🎨','Скин «'+nm+'»',()=>{if(S.own.includes(id))S.gem+=30;else S.own.push(id)}]}
 if(l%5==0)return g(l/5*4+4);if(l%3==0)return['🥚','Яйцо ×2',()=>{S.fe+=2}];
 return['🪙',fmt(b*(2+l*.8))+' 🪙',()=>{S.coins+=b*(2+l*.8)}]};
function bpClaim(tr,l){bpInit();const a=tr?S.bp.p:S.bp.f;if(bpLv()[0]<l||a.includes(l)||(tr&&!S.bp.prem))return sfx('no');a.push(l);const r=bpR(tr,l);r[2]();sfx('gold');note('🛡 Уровень '+l+': '+r[1]);save()}
sb=mkScr('bp','Battle Pass','🛡');
sb.innerHTML=`<div class="nc" id="bph"></div><div class="xp" style="height:20px"><i id="bpb"></i><span id="bpx" style="line-height:20px;font-size:12px"></span></div><button class="tg" id="bpp" style="padding:12px;font-size:15px"></button><div class="nc"><small>Опыт даётся: каждые 10 сборов мёда пчёлами, задания дня (+10), ежедневный бонус (+20), достижения (+15), улучшения (+3), прогнанная оса (+3), перерождение (+25).</small></div><div class="bpt" id="bpt"><div class="bph"><span>Бесплатно</span><span></span><span>👑 Премиум</span></div></div>`;
R('bpp').onclick=()=>{bpInit();if(S.bp.prem)return;if((S.gem||0)<150)return sfx('no');S.gem-=150;S.bp.prem=1;sfx('gold');note('👑 Премиум Battle Pass открыт!')};
const BPC=[];for(let l=1;l<=BPL;l++){const r=el('div','bpr',`<div class="bpc"></div><div class="bpl">${l}</div><div class="bpc"></div>`);[0,2].forEach((ci,tr)=>{const c=r.children[ci];c.onclick=()=>bpClaim(tr,l);BPC.push([c,tr,l])});R('bpt').append(r)}
function updBp(){bpInit();const bl=bpLv(),s=(((S.bp.s%4)+4)%4),d=Math.max(0,Math.ceil(seasonLeft()/864e5));
 R('bph').innerHTML=`<b style="font-size:17px">${BPS[s][1]} Сезон: ${BPS[s][0]}</b><br><small>Осталось дней: ${d} · Уровень ${bl[0]} / ${BPL}</small>`;R('bpb').style.width=(bl[0]>=BPL?100:bl[1]/bpNeed(bl[0])*100)+'%';R('bpx').textContent=bl[0]>=BPL?'Максимум!':bl[1]+' / '+bpNeed(bl[0])+' опыта';
 const pb=R('bpp');pb.disabled=!!S.bp.prem;pb.textContent=S.bp.prem?'👑 Премиум активен':'Открыть премиум за 150 💎';
 BPC.forEach(([c,tr,l])=>{const r=bpR(tr,l),got=(tr?S.bp.p:S.bp.f).includes(l),ok=bl[0]>=l&&(!tr||S.bp.prem),h=`<span>${r[0]}</span><small>${r[1]}</small>${got?'<i>✓</i>':''}${tr&&!S.bp.prem?'<i>🔒</i>':''}`;c.className='bpc '+(got?'got':ok?'ok':'lock')+(tr?' pr':'');if(c._h!==h){c._h=h;c.innerHTML=h}});
 [...R('bpt').querySelectorAll('.bpl')].forEach((x,i)=>x.classList.toggle('on',bl[0]>=i+1))}

/* ---------- главное меню (по макету) и панель в игре ---------- */
const mn=el('div','',`<div class="mt"><div class="pc" id="mpc"><div class="pav" id="mav"></div><div class="pin"><b id="mnick"></b><small id="mlv"></small><div class="xp"><i id="mxp"></i><span id="mxt"></span></div></div></div><div class="cur"><div class="pill">🍯 <b id="mh"></b></div><div class="pill">🪙 <b id="mc"></b></div><div class="pill">💎 <b id="mgm"></b></div></div></div>
<img class="hero" src="img/bees/skin_royal.svg" alt=""><div class="plank">ПАСЕКА</div>
<div class="r2"><button class="qcard" id="mq"><span>📜</span><div><small>Активное задание:</small><b id="mqt"></b><div class="xp"><i id="mqb"></i><span id="mqn"></span></div></div></button><button class="dcard" id="md"><i class="bdg" id="mdb">!</i><span>🎁</span>Ежедневный бонус</button></div>
<button class="play" id="mplay">▶ Играть</button>
<button class="wide" id="mshop"><span>🛍</span><div><b>Магазин</b><small>Покупки • Улучшения • Скины</small></div><em>›</em></button>
<button class="bpb" id="mbp"><span>🛡</span><div><b>Battle <i>Pass</i></b><small id="mbs"></small><div class="xp"><i id="mbb"></i><span id="mbn"></span></div></div><em>›</em></button><button class="nyent" id="mny"><span>🎄</span><div><b>Новогодний ивент</b><small id="mnys"></small></div><em>›</em></button><div class="mg" id="mg"></div><div class="ver">Версия ${V}</div>`);
mn.id='menu';mn.className='on';document.body.appendChild(mn);R('mplay').onclick=play;R('mshop').onclick=()=>openScr('shop');R('mbp').onclick=()=>openScr('bp');R('mny').onclick=()=>openScr('ny');R('mq').onclick=R('md').onclick=()=>openScr('ach');
[['col','<img class="ti" src="img/bees/bee_0.svg" alt="">','Коллекция пчёл'],['rb','🔄','Перерождение'],['prof','👤','Профиль'],['ach','🏆','Достижения','bAch'],['log','📰','Что нового'],['set','⚙️','Настройки']].forEach(([k,i,t,id])=>{const b=el('button','mb',`<span>${i}</span>${t}<i class="dot"></i>`);if(id)b.id=id;b.onclick=()=>openScr(k);R('mg').append(b)});
function updMenu(){const L=lvl(),a=lvAt(L),b=lvAt(L+1),p=Math.max(0,Math.min(1,(S.tot-a)/(b-a)));
 R('mav').innerHTML=avHtml(S.av);R('mnick').textContent=S.nick;R('mlv').textContent='Уровень '+L;R('mxp').style.width=p*100+'%';R('mxt').textContent=fmt(Math.max(0,S.tot-a))+' / '+fmt(b-a);
 R('mh').textContent=fmt(Math.floor(S.honey));R('mc').textContent=fmt(Math.floor(S.coins));R('mgm').textContent=fmt(S.gem||0);
 const qi=[0,1,2].find(i=>!S.dq.c[i]);if(qi==null){R('mqt').textContent='Все задания выполнены!';R('mqb').style.width='100%';R('mqn').textContent='✓'}else{const q=QP[S.dq.p[qi]],g=S.dq.g[qi];R('mqt').textContent=q[1].replace('{g}',fmt(g));R('mqb').style.width=qv(qi)/g*100+'%';R('mqn').textContent=fmt(qv(qi))+' / '+fmt(g)}
 const ok=dayIdx()>=0;R('mdb').style.display=ok?'flex':'none';bpInit();const bl=bpLv();R('mbs').textContent='Сезон: '+BPS[(((S.bp.s%4)+4)%4)][0];R('mbb').style.width=bl[0]/BPL*100+'%';R('mbn').textContent='Ур. '+bl[0]+' / '+BPL}
window.revealBee=function(t,nw){const b=BT[t];if(R('rv'))R('rv').remove();const m=el('div','',`<div class="rvb"><div class="rays"></div><img src="img/bees/bee_${t}.svg" alt=""><h2>${nw?'🆕 Новая пчела!':'Пчела вылупилась!'}</h2><b style="color:${b.rc}">${b.r}</b><div>${esc(b.n)} · ×${b.m} мёда</div><small>Нажми, чтобы закрыть</small></div>`);m.id='rv';m.style.setProperty('--c',b.rc);document.body.appendChild(m);sfx('gold');m.onclick=()=>m.remove();setTimeout(()=>m.parentNode&&m.remove(),5000)};
R('top').remove();
const hud=el('div','',`<button class="hp" id="hpc"><div class="pav" id="hav"></div><div class="pin"><b id="hnick"></b><small id="hlv"></small><div class="xp"><i id="hxp"></i><span id="hxt"></span></div></div></button>
<div class="hcur"><div class="pill" id="pHn">🍯 <b id="hn"></b></div><div class="pill">🪙 <b id="cn"></b></div><div class="pill">💎 <b id="hgm"></b></div></div>
<div class="hrow"><button class="hbonus" id="hbn"><span>🎁</span><b id="hbt"></b></button><button class="hsell" id="sell">Продать</button><button class="hq" id="hqt"><small>Задание:</small><b id="hqx"></b><div class="xp"><i id="hqb"></i><span id="hqn"></span></div></button></div>
<div class="hdn" id="hdn"></div><div class="hr"><button class="hbp" id="hbp"><span>🛡</span><small id="hbs"></small></button><button class="hbp hmp" id="hmp"><span>🗺</span><small>Локации</small></button></div>`);
hud.id='hud';R('cw').append(hud);R('sell').onclick=sell;R('hpc').onclick=()=>openScr('prof');R('hbn').onclick=R('hqt').onclick=()=>openScr('ach');R('hbp').onclick=()=>openScr('bp');R('hmp').onclick=()=>openScr('hive');{const b=el('button','hbp hny','<span>🎄</span><small id="hns"></small>');b.id='hny';b.onclick=()=>openScr('ny');R('hmp').after(b)}{const b=el('button','hbp hmr','<span>🛒</span><small id="hms"></small>');b.id='hmr';b.style.display='none';b.onclick=()=>showMerchant();R('hmp').after(b)}
let ap=0,at=0;R('pHn').onclick=()=>{const n=performance.now();ap=n-at<1500?ap+1:1;at=n;if(ap>=5){ap=0;openScr('adm')}};
function updHud(){const L=lvl(),a=lvAt(L),b=lvAt(L+1),p=Math.max(0,Math.min(1,(S.tot-a)/(b-a)));
 R('hav').innerHTML=avHtml(S.av);R('hnick').textContent=S.nick;R('hlv').textContent='Уровень '+L;R('hxp').style.width=p*100+'%';R('hxt').textContent=fmt(Math.max(0,S.tot-a))+' / '+fmt(b-a);R('hgm').textContent=fmt(S.gem||0);
 const qi=[0,1,2].find(i=>!S.dq.c[i]);if(qi==null){R('hqx').textContent='Все выполнены!';R('hqb').style.width='100%';R('hqn').textContent='✓'}else{const q=QP[S.dq.p[qi]],g=S.dq.g[qi];R('hqx').textContent=q[1].replace('{g}',fmt(g));R('hqb').style.width=qv(qi)/g*100+'%';R('hqn').textContent=fmt(qv(qi))+' / '+fmt(g)}
 const ok=dayIdx()>=0;R('hbn').classList.toggle('ok',ok);if(ok)R('hbt').textContent='Забрать!';else{const n=new Date(),s=Math.floor((new Date(n.getFullYear(),n.getMonth(),n.getDate()+1)-n)/1000);R('hbt').textContent=String(s/3600|0).padStart(2,'0')+':'+String(s/60%60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
 bpInit();const sl=seasonLeft();R('hbs').textContent=Math.floor(sl/864e5)+'д '+Math.floor(sl/36e5%24)+'ч · '+bpLv()[0]+'/'+BPL;
 const p2=ph(),hh=Math.floor(p2*24),mm=Math.floor(p2*1440%60),l=lite(),ic=l>.6?'☀️':l>.3?(p2<.5?'🌅':'🌇'):'🌙',dn=nDark();
 R('hdn').textContent=`${ic} День ${1+Math.floor(S.gt/DAYLEN)} · ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}${dn>.15?' · ночь −'+Math.round(nPen()*100)+'%':''}`}
const gb=el('div');gb.id='gb';[['menu','🏠','Главная'],['shop','🛍','Магазин'],['col','🐝','Пчёлы'],['rb','🔄','Перерожд.'],['ach','🏆','Достиж.'],['log','📰','Новости']].forEach(([k,i,t])=>{const b=el('button',0,`<span>${i}</span><small>${t}</small>`);b.onclick=()=>k=='menu'?showMenu():openScr(k);gb.append(b)});R('app').insertBefore(gb,R('tabs'));
UP.forEach(u=>{const c0=u.c;u.c=()=>{const v=c0();return v===1/0?v:v*1.5}});document.body.appendChild(R('nt'));

/* ---------- Новогоднее событие (1 декабря 2026 — 1 января 2027) ---------- */
const NY_START=new Date(2026,11,1).getTime(),NY_END=new Date(2027,0,1).getTime(),NY_OFF=new Date(2027,0,2).getTime();
const TT={base:0,perf:0,ok:0};let NYT=null,nyTick=0,nyLast='',finShown=0;
/* проверенное сетевое время: сдвиг часов на телефоне не помогает открыть будущие дни */
async function syncTime(){const src=[['https://worldtimeapi.org/api/timezone/Etc/UTC',j=>j.unixtime*1000],['https://timeapi.io/api/Time/current/zone?timeZone=UTC',j=>Date.parse(String(j.dateTime).slice(0,23)+'Z')]];
 for(const [u,f] of src){try{const c=new AbortController(),tm=setTimeout(()=>c.abort(),6000),r=await fetch(u,{cache:'no-store',signal:c.signal});clearTimeout(tm);const ms=f(await r.json());if(ms>1.7e12){TT.base=ms;TT.perf=performance.now();TT.ok=1;return}}catch(e){}}}
const tnow=()=>TT.ok?TT.base+(performance.now()-TT.perf):Math.max(Date.now(),S.ny.maxT||0);
setTimeout(syncTime,800);setInterval(syncTime,6e5);document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncTime()});
function nyState(){if(NYT)return NYT.mode=='finale'?{mode:'finale',day:31}:{mode:'open',day:NYT.day};const t=tnow();if(t<NY_START)return{mode:'before',day:0};if(t<NY_END)return{mode:'open',day:Math.min(31,new Date(t).getDate())};return{mode:t<NY_OFF?'finale':'ended',day:31}}
const own=id=>{if(!S.own.includes(id))S.own.push(id)};
function giveBee(t){S.bees++;addBee(t);const nw=!S.col[t];S.col[t]=1;setTimeout(()=>revealBee(t,nw),250)}
const NYS=[['h',100],['c',3],['g',10],['e',1],['p',120],['c',4],['h',200],['c',5],['h',300],['bee',11],['e',2],['g',20],['c',6],['hs','hny'],['h',600],['p',180],['e',2],['g',25],['c',8],['sk','ny1'],['h',1000],['egg',3],['g',30],['chest',0],['sk','ny2'],['c',10],['e',3],['h',3000],['g',50],['c',30],['bee',12]];
function nyR(d){const [k,v]=NYS[d-1],b=base(),hv=v*(S.bees+2);
 switch(k){case'h':return['🍯',fmt(hv)+' мёда',()=>{S.honey+=hv}];case'c':return['🪙',fmt(b*v)+' монет',()=>{S.coins+=b*v}];case'g':return['💎',v+' 💎',()=>{S.gem+=v}];
 case'e':return['🥚','бесплатные яйца ×'+v,()=>{S.fe+=v}];case'p':return['🧪','зелье скорости '+v+' с',()=>{potT=Math.max(potT,v)}];
 case'sk':return['🎨','скин «'+BS[v].n+'»',()=>own(v)];case'hs':return['🏠','улей «'+HS[v].n+'»',()=>own(v)];case'egg':return['🥚','эпическая пчела из яйца',()=>hatch(3)];
 case'chest':return['🎁','новогодний сундук: монеты, мёд и 40 💎',()=>{S.coins+=b*20;S.honey+=1500*(S.bees+2);S.gem+=40}];
 default:return['🐝',BT[v].n+' ('+BT[v].r+')',()=>giveBee(v)]}}
function nyClaim(d){const st=nyState();if(st.mode!='open'||d>st.day)return sfx('no');const r=nyR(d),m=NYS[d-1];
 if(NYT){if(NYT.c.includes(d))return note('ТЕСТ: уже открыт · '+r[1]);NYT.c.push(d);sfx('gold');note('🧪 ТЕСТ (награда не выдана): '+r[1]);if(m[0]=='bee')revealBee(m[1],true);fireworks(1500,14);return nyRender()}
 if(S.ny.c.includes(d))return note('Подарок дня '+d+' уже получен: '+r[1]);
 if(!TT.ok){syncTime();return note('🌐 Нужен интернет, чтобы проверить дату')}
 S.ny.c.push(d);r[2]();sfx('gold');note('🎄 День '+d+': '+r[1]);bpXp(5);save();nyRender();fireworks(1500,14)}
function nyCell(d){const st=nyState(),got=(NYT?NYT.c:S.ny.c).includes(d);if(st.mode!='open'||d>st.day)return note(st.mode=='open'?'🔒 Откроется '+d+' декабря':'🔒 Календарь ещё закрыт');if(got)return note('Получено: '+nyR(d)[1]);nyClaim(d)}
/* фейерверк и конфетти (лёгкий canvas, живёт только пока играет) */
let fwOn=0;
function fireworks(ms,n){if(fwOn)return;fwOn=1;const low=(navigator.hardwareConcurrency||8)<=4,cv=el('canvas');cv.id='fw';cv.width=innerWidth;cv.height=innerHeight;document.body.appendChild(cv);const c=cv.getContext('2d'),P=[],t0=performance.now(),CL=['#ff4d4d','#ffd54a','#6ee7ff','#7bff7b','#ff8aff'];let last=t0,nb=0;n=low?Math.min(n||40,24):(n||40);
 (function f(now){const dt=Math.min(.05,(now-last)/1000);last=now;c.clearRect(0,0,cv.width,cv.height);const e=now-t0;
  if(e<ms-1500){nb-=dt;if(nb<=0&&P.length<350){const x=Math.random()*cv.width*.8+cv.width*.1,y=Math.random()*cv.height*.4+40,col=CL[Math.random()*5|0];for(let i=0;i<n;i++){const a=Math.random()*6.283,s=60+Math.random()*140;P.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c:col,k:0})}nb=.5}
   for(let i=0;i<(low?2:4);i++)P.push({x:Math.random()*cv.width,y:-10,vx:(Math.random()-.5)*60,vy:60+Math.random()*80,l:1.8,c:CL[Math.random()*5|0],k:1,r:Math.random()*6})}
  for(let i=P.length-1;i>=0;i--){const p=P[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.k?10:120)*dt;p.l-=dt*(p.k?.5:.8);if(p.l<=0||p.y>cv.height+20){P.splice(i,1);continue}c.globalAlpha=Math.min(1,p.l);c.fillStyle=p.c;if(p.k){c.save();c.translate(p.x,p.y);c.rotate(p.r+=dt*6);c.fillRect(-3,-2,6,4);c.restore()}else{c.beginPath();c.arc(p.x,p.y,2.2,0,7);c.fill()}}
  c.globalAlpha=1;if(e<ms||P.length)requestAnimationFrame(f);else{cv.remove();fwOn=0}})(t0)}
function finale(preview){if(finShown&&!preview)return;finShown=1;fireworks(9000,40);const m=el('div','',`<div><div style="font-size:60px">🎆</div><h2>С Новым годом!</h2><p>Адвент-календарь завершён. Спасибо, что был с пасекой весь декабрь! Держи праздничный подарок: 100 💎, монеты, мёд и 3 яйца.</p><button id="fbtn">Забрать подарок</button></div>`);m.id='fn';document.body.appendChild(m);
 R('fbtn').onclick=()=>{if(preview)note('🧪 ТЕСТ: подарок не выдан');else if(!S.ny.fin){S.ny.fin=1;S.gem+=100;S.coins+=base()*50;S.honey+=2000*(S.bees+2);S.fe+=3;sfx('gold');note('🎁 Новогодний подарок получен!');save()}m.remove()}}
/* события владельца для ВСЕХ игроков: файл events.json в репозитории */
async function pollEvents(){if(!TT.ok)return;const url=CFG.EVENTS_URL||(/__/.test(CFG.REPO)?'':'https://raw.githubusercontent.com/'+CFG.REPO+'/main/events.json');if(!url)return;
 try{const r=await fetch(url+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const j=await r.json(),t=tnow();for(const e of j.events||[]){if(!e.id||S.evSeen.includes(e.id))continue;if(e.pid&&e.pid!==S.pid)continue;if(e.nick&&String(e.nick).toLowerCase()!==String(S.nick).toLowerCase())continue;if(t>=Date.parse(e.from||0)&&t<=Date.parse(e.to||'2100-01-01T00:00:00Z')){runEvent(e,false);S.evSeen.push(e.id);if(S.evSeen.length>60)S.evSeen.shift();save();break}}}catch(x){}}
function runEvent(e,test){const rw=[];if(!test){if(+e.coins){S.coins+=+e.coins;rw.push(fmt(+e.coins)+' 🪙')}if(+e.honey){S.honey+=+e.honey;rw.push(fmt(+e.honey)+' 🍯')}if(+e.gems){S.gem+=+e.gems;rw.push(+e.gems+' 💎')}if(+e.eggs){S.fe+=+e.eggs;rw.push(+e.eggs+' 🥚')}if(e.skin&&(BS[e.skin]||HS[e.skin])){own(e.skin);rw.push('скин')}if(e.bee!=null&&BT[e.bee]){giveBee(+e.bee);rw.push(BT[e.bee].n)}if(+e.level){S.tot=Math.max(S.tot,lvAt(+e.level));rw.push('уровень '+e.level)}if(e.rebirths!=null){S.rb=+e.rebirths;rw.push('перерождений: '+e.rebirths)}if(+e.hive){giveHive(+e.hive);rw.push('особый улей')}if(e.ach&&!S.ach.includes(e.ach)){S.ach.push(e.ach);S.ac=S.ach.length;rw.push('достижение')}if(e.mult){S.gm={x:+e.mult.x||2,t:(+e.mult.min||10)*60};rw.push('доход ×'+(e.mult.x||2))}}
 if(e.fx)fireworks(e.fx=='confetti'?6000:8000,e.fx=='confetti'?10:40);const m=el('div','',`<div><div style="font-size:54px">${esc(e.icon||'🎁')}</div><h2>${esc(e.title||'Сюрприз от владельца!')}</h2><p>${esc(e.text||'')}${rw.length?'<br><b>'+esc(rw.join(' · '))+'</b>':''}${test?'<br><small>ТЕСТ: награда не выдана</small>':''}</p><button id="evb">Ура!</button></div>`);m.id='fn';document.body.appendChild(m);R('evb').onclick=()=>m.remove();sfx('gold')}
setTimeout(pollEvents,4000);setInterval(pollEvents,3e5);
/* экран события */
const nyS=el('div','scr nyscr',`<button class="nyb" id="nyback">‹</button><div class="nysc" id="nyc"></div>`);nyS.id='s_ny';document.body.appendChild(nyS);R('nyback').onclick=back;
const fmtT=ms=>{ms=Math.max(0,ms);const s=Math.floor(ms/1000);return Math.floor(s/86400)+'д '+String(Math.floor(s/3600)%24).padStart(2,'0')+'ч '+String(Math.floor(s/60)%60).padStart(2,'0')+'м '+String(s%60).padStart(2,'0')+'с'};
function nyOpen(){syncTime();R('nyc').innerHTML=`<div class="nyw"><div class="nytree"><img class="tre" src="img/ny/tree.svg" alt=""><img class="nfb a1" src="img/bees/bee_11.svg" alt=""><span class="nfb a2"><img src="img/bees/bee_11.svg" alt=""><img class="gf" src="img/items/gift.svg" alt=""></span><img class="nfb a3" src="img/bees/bee_11.svg" alt=""><span class="nfb a4"><img src="img/bees/bee_11.svg" alt=""><img class="gf" src="img/items/gift.svg" alt=""></span><div class="nyplank"><small id="nyt1"></small><b id="nyt2"></b></div></div>
<div class="nycal"><div class="nyhead"><span style="color:#ffd54a">Адвент</span><br>календарь</div><div class="nyg" id="nyg"></div></div>
<div class="nyinfo"><img src="img/ny/tree.svg" alt=""><div><b>Новогодний ивент!</b><span>С 1 декабря по 1 января<br>Открывай подарки каждый день!</span></div></div>
<div class="nyb2"><div class="nyh">Новые пчёлы</div><div class="nyr" id="nyr0"></div><div class="nyr" id="nyr1"></div></div></div>`;
 const g=R('nyg');for(let d=1;d<=31;d++){const c=el('button','nyd'+(d==31?' sp':''),d==31?'31 · 🎅 Особая награда':`<span>${d}</span>`);c.onclick=()=>nyCell(d);g.append(c)}
 nyLast='';nyRender();nyUpd();nyTick=setInterval(nyUpd,1000)}
function nyClose(){clearInterval(nyTick);R('nyc').innerHTML=''}
function nyRender(){const g=R('nyg');if(!g)return;const st=nyState(),got=NYT?NYT.c:S.ny.c;[...g.children].forEach((c,i)=>{const d=i+1,gt=got.includes(d),open=st.mode=='open'&&d<=st.day;c.className='nyd'+(d==31?' sp':'')+(gt?' got':open?(d==st.day?' today':' ok'):' lock')});
 [[11,'Эльф'],[12,'Дед Мороз']].forEach(([id,n],i)=>{const h=R('nyr'+i),has=S.col[id];h.className='nyr'+(has?' own':'');h.innerHTML=`<img src="img/bees/bee_${id}.svg" alt="" style="${has?'':'filter:brightness(0) opacity(.55)'}"><div><b>${n}</b><small>${BT[id].r} · ×${BT[id].m} мёда</small></div><em>${has?'✅':'🔒'}</em>`})}
function nyUpd(){const st=nyState(),t=tnow(),k=st.mode+st.day+(NYT?'T':'')+(S.ny.c.length);if(k!==nyLast){nyLast=k;nyRender()}
 const a=R('nyt1'),b=R('nyt2');if(!a)return;
 if(st.mode=='before'){a.textContent='До открытия адвент-календаря:';b.textContent=fmtT(NY_START-t)}else if(st.mode=='open'){a.textContent=(NYT?'🧪 ТЕСТ · ':'')+'До Нового года:'+(TT.ok?'':' (проверка даты…)');b.textContent=fmtT(NY_END-t)}else if(st.mode=='finale'){a.textContent='🎆 С Новым годом!';b.textContent='Календарь завершён'}else{a.textContent='Событие завершено';b.textContent='Спасибо, что играл!'}}
function nyUi(){const st=nyState(),t=tnow(),vis=st.mode!='ended';R('mny').style.display=vis?'flex':'none';const h=R('hny');if(h)h.style.display=vis?'flex':'none';
 const s=st.mode=='before'?'Календарь откроется через '+fmtT(NY_START-t).split(' ').slice(0,2).join(' '):st.mode=='open'?(NYT?'🧪 ТЕСТ · ':'')+'Открыт! День '+st.day+' из 31':'С Новым годом!';
 R('mnys').textContent=s;if(h)R('hns').textContent=st.mode=='before'?fmtT(NY_START-t).split(' ')[0]+' '+fmtT(NY_START-t).split(' ')[1]:'День '+(st.day||'');
 if(!NYT&&TT.ok&&!S.ny.fin&&!finShown&&(st.mode=='finale'||(st.mode=='ended'&&t<NY_END+7*864e5)))finale();S.ny.maxT=Math.max(S.ny.maxT||0,TT.ok?t:0)}
/* ориентация экрана (Android/Capacitor) */
function applyOri(){const m=S.ori||'auto',SO=CP.ScreenOrientation;try{if(SO){if(m=='auto')SO.unlock();else SO.lock({orientation:m})}else if(screen.orientation&&screen.orientation.lock){if(m=='auto')screen.orientation.unlock();else screen.orientation.lock(m).catch(()=>{})}}catch(e){}}

/* ---------- Странствующий торговец ---------- */
const SPN=['','Кристальный улей','Вулканический улей'],MR={t:150+Math.random()*60,open:0};
const mrPrice=i=>Math.max(5e6,base()*(i==1?120:260))*Math.pow(2.2,S.mrb[i-1]||0);
function giveHive(i){let idx;if(S.hives<6){idx=S.hives;S.hives++}else idx=S.mhv.slice(0,6).findIndex(x=>!x);if(idx>=0&&idx<6)S.mhv[idx]=i}
function mrCan(i){if((S.mrb[i-1]||0)>=3)return'Максимум (3)';if(S.hives>=6&&!S.mhv.slice(0,6).some(x=>!x))return'Все ульи уже особые';return 0}
function mrBuy(i){const why=mrCan(i);if(why)return note('🛒 '+why);const p=mrPrice(i);if(S.coins<p){sfx('no');return note('Не хватает монет: нужно '+fmt(p)+' 🪙')}
 S.coins-=p;giveHive(i);S.mrb[i-1]=(S.mrb[i-1]||0)+1;stat('mr',1);bpXp(10);sfx('gold');note('🛒 Куплен: '+SPN[i]+'! +4 места для пчёл');save();mrRender()}
function showMerchant(){if(R('mr'))R('mr').remove();const m=el('div','',`<div class="mrb"><div class="mrt"><img class="mrimg" src="img/items/merchant.svg" alt=""><div><b>Странствующий торговец</b><small id="mrs"></small></div><button class="x" id="mrx">✕</button></div><div class="mro" id="mro"></div><small class="mrh">Особый улей даёт +4 места для пчёл. Кристальный: пчёлы улья быстрее ×1.25. Вулканический: мёда с рейса ×1.5. Если все 6 мест заняты, обычный улей заменяется особым.</small></div>`);m.id='mr';document.body.appendChild(m);R('mrx').onclick=()=>m.remove();m.onclick=e=>{if(e.target==m)m.remove()};mrRender()}
function mrRender(){const o=R('mro');if(!o)return;o.innerHTML=[1,2].map(i=>{const why=mrCan(i),p=mrPrice(i);return `<div class="mrc c${i}"><img src="img/items/hive_${i==1?'crystal':'volcano'}.svg" alt=""><b>${SPN[i]}</b><small>${i==1?'Скорость пчёл ×1.25':'Мёд с рейса ×1.5'} · +4 места</small><button data-i="${i}" ${why?'disabled':''}>${why||fmt(p)+' 🪙'}</button><em>Куплено: ${S.mrb[i-1]||0}/3</em></div>`}).join('');o.querySelectorAll('button').forEach(b=>b.onclick=()=>mrBuy(+b.dataset.i));mrTime()}
function mrTime(){const s=R('mrs');if(s)s.textContent=MR.open>0?'Уходит через '+Math.floor(MR.open/60)+':'+String(MR.open%60).padStart(2,'0'):'Торговец ушёл'}
setInterval(()=>{if(document.hidden||bg)return;const c=R('hmr');if(MR.open>0){MR.open--;if(MR.open<=0){note('🛒 Торговец ушёл. Он вернётся позже!');MR.t=420+Math.random()*300;const m=R('mr');if(m)m.remove()}}else if(S.tot>100){MR.t--;if(MR.t<=0){MR.open=240;sfx('gold');note('🛒 Торговец прибыл! Особые ульи ждут тебя');if(!S.mrseen){S.mrseen=1;showMerchant()}}}
 if(c){c.style.display=MR.open>0?'flex':'none';const x=R('hms');if(x)x.textContent=Math.floor(MR.open/60)+':'+String(MR.open%60).padStart(2,'0')}mrTime()},1000);

/* ---------- обновления ---------- */
function cmp(a,b){const x=String(a).split('.').map(n=>parseInt(n)||0),y=String(b).split('.').map(n=>parseInt(n)||0);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0?1:-1}return 0}
function showUpd(j,force){if(R('um'))return;const m=el('div','',`<div><h2>🐝 Доступно новое обновление!</h2><p>Вышла новая версия игры Пасека! Обнови игру, чтобы получить новые функции и исправления.</p><button id="ud">Скачать обновление</button>${force?'':'<button class="l" id="ul">Позже</button>'}</div>`);m.id='um';document.body.appendChild(m);
 R('ud').onclick=()=>openUrl(j.url||CFG.TG);if(!force)R('ul').onclick=()=>{S.updSkip=j.latest;S.updAt=Date.now();save();m.remove()}}
async function chkUpd(manual){const url=CFG.UPDATE_URL||(/__/.test(CFG.REPO)?'':'https://raw.githubusercontent.com/'+CFG.REPO+'/main/version.json');if(!url){if(manual)note('Адрес обновлений не настроен');return}
 try{const c=new AbortController(),t=setTimeout(()=>c.abort(),6000),r=await fetch(url+'?t='+Date.now(),{cache:'no-store',signal:c.signal});clearTimeout(t);if(!r.ok)throw 0;const j=await r.json();
  if(cmp(j.latest,V)<=0){if(manual)note('У вас последняя версия '+V+' ✅');return}
  const force=j.force===true||(j.min&&cmp(j.min,V)>0);if(!manual&&!force&&S.updSkip==j.latest&&Date.now()-(S.updAt||0)<864e5)return;showUpd(j,force)}catch(e){if(manual)note('Нет связи, попробуйте позже')}}
setTimeout(()=>chkUpd(false),2500);

/* ---------- обновление интерфейса (вызывается из игры 5 раз в секунду) ---------- */
rollQ();chkAch(true);
window.uiX=function(){const L=lvl();if(S.lv==null)S.lv=L;if(L>S.lv){S.lv=L;S.gem+=1;note('⭐ Новый уровень: '+L+'!');sfx('gold')}
 rollQ();chkAch(false);updMenu();updHud();nyUi();if(isOn('bp'))updBp();GM.forEach((g,i)=>{const l=g[5]();GC[i].dd.textContent=g[3]();GC[i].bb.textContent=l==='Куплено'?'✓ Куплено':l||g[2]+' 💎';GC[i].e.classList.toggle('no',!!l||(S.gem||0)<g[2])});
 {const ok=rbReady();RBC.dd.textContent=ok?`Всё на максимуме! Станет: доход ×${(1.2**((S.rb||0)+1)).toFixed(2)}, +3 цветка, +1 место в улье`:`Нужно: 6 ульев и цветы на максимум (${nf()}/${6+flcap()}). Сейчас доход ×${(1.2**(S.rb||0)).toFixed(2)}`;RBC.bb.textContent=ok?'Переродиться':'🔒 Пока нельзя';RBC.e.classList.toggle('no',!ok);if((S.rb||0)>=RMAX){RBC.dd.textContent='Достигнут лимит: '+RMAX+' из '+RMAX+'. Следующее перерождение появится в будущем обновлении.';RBC.bb.textContent='✓ Максимум'}}
 R('bAch').classList.toggle('nt',dayIdx()>=0||[0,1,2].some(i=>!S.dq.c[i]&&qdone(i)));
 BON.forEach((b,i)=>{const p=b[0]=='pot'?100:bcost(b[5]);BC2[i].bb.textContent=fmt(p)+' 🪙';BC2[i].e.classList.toggle('no',S.coins<p)});
 if(isOn('col'))updMy();if(isOn('prof'))updProf();if(isOn('ach'))updAch()};

/* ---------- жизненный цикл Android: музыка и кнопка «назад» ---------- */
if(CP.App){const A=CP.App;
 A.addListener('appStateChange',s=>{if(s.isActive)audioOn();else{audioOff();save()}});
 A.addListener('pause',()=>{audioOff();save()});A.addListener('resume',audioOn);
 A.addListener('backButton',()=>{if(stack.length)back();else if(!R('menu').classList.contains('on'))showMenu();else A.exitApp()})}
document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
/* ---------- расширенная админ-панель ---------- */
{const H=t=>TL.appendChild(el('div','sec',t)),S2=h=>{const s=el('select',0,h);s.style.cssText='max-width:58%;padding:6px;border-radius:8px;border:2px solid var(--bd);background:var(--card);color:var(--fg)';return s},I2=ph=>{const i=el('input');i.placeholder=ph;i.style.cssText='width:130px;padding:6px;border-radius:8px;border:2px solid var(--bd);background:var(--card);color:var(--fg)';return i};
 H('🧰 Админ-инструменты');
 rowA('💎 Кристаллы',[10,100,1000,10000].map(v=>mk('+'+v,()=>{S.gem=(S.gem||0)+v})).concat([mk('0',()=>{S.gem=0})]));
 rowA('🥚 Бесплатные яйца',[1,10,50].map(v=>mk('+'+v,()=>{S.fe+=v})));
 const sb2=S2(BT.map((b,i)=>`<option value="${i}">${i}. ${b.n} (${b.r})</option>`).join(''));rowA('🐝 Выдать пчелу',[sb2,mk('Выдать',()=>giveBee(+sb2.value))]);
 const sk=S2(Object.keys(BS).map(k=>`<option value="${k}">Пчела: ${BS[k].n}</option>`).join('')+Object.keys(HS).map(k=>`<option value="${k}">Улей: ${HS[k].n}</option>`).join(''));
 rowA('🎨 Выдать скин',[sk,mk('Выдать',()=>own(sk.value)),mk('Все',()=>{Object.keys(BS).concat(Object.keys(HS)).forEach(own)})]);
 rowA('🛡 Battle Pass',[mk('+100 XP',()=>bpXp(100)),mk('+1000',()=>bpXp(1000)),mk('Премиум ✓',()=>{bpInit();S.bp.prem=1}),mk('Сброс',()=>{S.bp=null;bpInit()})]);
 rowA('⚡ События',EV.map(e=>mk(e.n.split(' ')[0]+' '+e.k,()=>{E={...e,t:e.d}})).concat([mk('🐝💢 Оса',()=>{S.tot=Math.max(S.tot,400);wT=0}),mk('Снять',()=>{E=null;potT=0})]));
 rowA('🌗 Время суток',[['🌅',.27],['☀️',.5],['🌇',.73],['🌙',0]].map(([i,p])=>mk(i,()=>{S.gt=p*DAYLEN})).concat([mk('День +1',()=>{S.gt+=DAYLEN})]));
 rowA('🎁 Ежедневный бонус',[mk('Сбросить',()=>{S.db={last:'',s:0}})]);
 H('🎄 Новый год: тест календаря (только для меня)');
 const ni=I2('Ник из профиля'),ds=S2(Array.from({length:31},(_,i)=>`<option value="${i+1}">День ${i+1}</option>`).join(''));
 rowA('Ник владельца',[ni,ds,mk('Открыть тест',()=>{if(ni.value.trim().toLowerCase()!==String(S.nick).toLowerCase())return note('❌ Ник не совпадает с ником в профиле');NYT={day:+ds.value,mode:'open',c:[]};note('🧪 Тест открыт. Пока игра не перезапущена; после перезахода календарь снова закрыт до 1 декабря');openScr('ny')})]);
 rowA('Управление тестом',[mk('Сменить день',()=>{if(NYT){NYT.day=+ds.value;nyLast=''}}),mk('Финал 1 янв',()=>{if(NYT){NYT.mode='finale'}finale(true)}),mk('Выйти из теста',()=>{NYT=null;nyLast=''})]);
 H('📣 События и эффекты (у меня; для всех — файл events.json)');
 rowA('Эффекты',[mk('🎆 Фейерверк',()=>fireworks(8000,40)),mk('🎊 Конфетти',()=>fireworks(6000,10)),mk('Окно события',()=>runEvent({title:'Сюрприз!',text:'Так увидят игроки событие из events.json',icon:'🎁',fx:'fireworks'},true))]);
 H('👤 Игрок, достижения, торговец, находки');
 const lvI=I2('Уровень'),rbI=I2('Кол-во'),ac=S2(ACH.map(a=>`<option value="${a[0]}">${a[2]}</option>`).join(''));
 rowA('Уровень',[lvI,mk('Задать',()=>{S.tot=lvAt(Math.max(1,+lvI.value|0))+1})]);
 rowA('Перерождения',[rbI,mk('Задать',()=>{S.rb=Math.max(0,+rbI.value|0)}),mk('+1',()=>{S.rb=(S.rb||0)+1})]);
 rowA('Достижение',[ac,mk('Выдать',()=>{if(!S.ach.includes(ac.value)){S.ach.push(ac.value);S.ac=S.ach.length}}),mk('Все',()=>{ACH.forEach(a=>{if(!S.ach.includes(a[0]))S.ach.push(a[0])});S.ac=S.ach.length})]);
 rowA('Торговец',[mk('Кристальный улей',()=>giveHive(1)),mk('Вулканический улей',()=>giveHive(2)),mk('Позвать',()=>{MR.open=240;showMerchant()}),mk('Прогнать',()=>{MR.open=0;MR.t=600})]);
 rowA('Находки и доход',[mk('✨ Находка',()=>{SEC=null;sT=0}),mk('×2 · 10 мин',()=>{S.gm={x:2,t:600}}),mk('×5 · 5 мин',()=>{S.gm={x:5,t:300}}),mk('Снять ×',()=>{S.gm=null}),mk('Все локации',()=>{S.ul=[1,1,1,1,1,1]})]);
 H('📨 Выдача по нику и объявления: готовый JSON для events.json');
 const tn=I2('Ник или pid'),nc=I2('Монеты'),ng=I2('💎'),nt=I2('Заголовок'),nx=I2('Текст'),jb=S2(BT.map((b,i)=>`<option value="${i}">${b.n}</option>`).join('')),jsk=S2('<option value="">— скин —</option>'+Object.keys(BS).concat(Object.keys(HS)).map(k=>`<option value="${k}">${k}</option>`).join('')),out=el('textarea');let wBee=null;
 out.rows=6;out.style.cssText='width:100%;box-sizing:border-box;font-size:11px;border:2px solid var(--bd);border-radius:8px;padding:6px;background:var(--card);color:var(--fg)';
 const mkEv=()=>{const e={id:'adm-'+Date.now(),from:new Date().toISOString(),to:new Date(Date.now()+30*864e5).toISOString(),title:nt.value||'Сюрприз от владельца!',text:nx.value||'',icon:'🎁',fx:'confetti'},v=tn.value.trim();if(v){if(/^[0-9a-f-]{30,}$/i.test(v))e.pid=v;else e.nick=v}if(+nc.value)e.coins=+nc.value;if(+ng.value)e.gems=+ng.value;if(jsk.value)e.skin=jsk.value;if(wBee!=null)e.bee=wBee;return e};
 rowA('Кому и что',[tn,nc,ng]);rowA('Текст',[nt,nx]);rowA('Пчела / скин',[jb,mk('+ пчела',()=>{wBee=+jb.value}),mk('без пчелы',()=>{wBee=null}),jsk]);
 rowA('JSON',[mk('Собрать',()=>{out.value=JSON.stringify({events:[mkEv()]},null,1)}),mk('Копировать',()=>{out.value=JSON.stringify({events:[mkEv()]},null,1);try{navigator.clipboard.writeText(out.value)}catch(e){out.select()}}),mk('Проверить у себя',()=>runEvent(mkEv(),true)),mk('История действий',()=>{out.value=(S.alog||[]).slice(-30).join('\n')})]);TL.appendChild(out);
 TL.appendChild(el('div','nc','<small>Чтобы запустить событие у ВСЕХ игроков, добавь его в файл events.json в репозитории GitHub (пример в README). Игроки получат его при следующем входе в игру с интернетом, один раз.</small>'))}

/* ---------- экран загрузки ---------- */
{const ld=R('ld');if(ld){const TIPS=['Тапай по цветам и продавай мёд в лавке','Королева ускоряет пчёл своего улья','Ночью пчёлы медленнее, зато мёд дороже','Лови золотой цветок и секретные находки ✨','Прогоняй ос тапом, пока они не украли мёд','Заходи за ежедневным бонусом каждый день','Странствующий торговец продаёт особые ульи','В Battle Pass награды за каждый уровень'],imgs=[];for(let i=0;i<13;i++)imgs.push('img/bees/bee_'+i+'.svg');['skin_royal','skin_rad'].forEach(n=>imgs.push('img/bees/'+n+'.svg'));['egg','potion','gem','chest','gift','hive','pack','merchant','hive_crystal','hive_volcano','hive_city'].forEach(n=>imgs.push('img/items/'+n+'.svg'));imgs.push('img/ny/tree.svg');
 let n=0,ti=0,done=0;const f=R('ldf'),tx=R('ldn'),h=R('ldh'),t0=performance.now(),hi=setInterval(()=>{h.textContent=TIPS[++ti%TIPS.length]},1800);h.textContent=TIPS[0];
 const fin=()=>{if(done)return;done=1;setTimeout(()=>{ld.classList.add('off');setTimeout(()=>{ld.remove();clearInterval(hi)},500)},Math.max(0,1400-(performance.now()-t0)))};
 imgs.forEach(u=>{const i=new Image();i.onload=i.onerror=()=>{n++;const p=Math.round(n/imgs.length*100);f.style.width=p+'%';tx.textContent='Загрузка… '+p+'%';if(n>=imgs.length)fin()};i.src=u});setTimeout(fin,8000)}}
applyOri();uiX();
})();
