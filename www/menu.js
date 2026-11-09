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
function openScr(id){const s=R('s_'+id);if(!s||s.classList.contains('on'))return;s.style.zIndex=30+stack.length;s.classList.add('on');stack.push(id);sfx('tap');if(id=='log')S.seenV=V;if(id=='top')loadTop();if(id=='prof')fillProf();uiX()}
function back(){const id=stack.pop();if(id){R('s_'+id).classList.remove('on');sfx('tap')}}
const showMenu=()=>{while(stack.length)back();R('menu').classList.add('on');uiX()};
const play=()=>{R('menu').classList.remove('on');sfx('tap');if(!S.tut)startTut()};
window.openScr=openScr;
const put=(sb,e)=>{e.classList.add('on');sb.appendChild(e)},sec=t=>el('div','sec',t);

/* ---------- магазин: яйца, бонусы, скины ---------- */
const BON=[['pot','🧪','Зелье скорости','Все пчёлы быстрее ×1.8 · 60 с',60,0],['rain','🌧','Нектарный дождь','Цветы растут ×3 · 90 с',90,1],['wind','💨','Турбо-крылья','Пчёлы быстрее ×1.5 · 90 с',90,1],['rush','🤑','Золотая лихорадка','Мёд дороже ×2 · 60 с',60,3],['swarm','🐝','Рой-помощник','Пчёлы несут ×2 · 60 с',60,3]];
const bcost=m=>Math.max(100,Math.floor(S.tot*.004))*m,tmp=el('div');
const BC2=BON.map(b=>{const c=mkc(tmp,b[1],b[2]);c.dd.textContent=b[3];c.e.onclick=()=>{const p=b[0]=='pot'?100:bcost(b[5]);if(S.coins<p)return sfx('no');S.coins-=p;if(b[0]=='pot')potT=60;else{E={k:b[0],n:b[1]+' '+b[2],x:'',t:b[4],d:b[4]};evT=Math.max(evT,b[4]+45)}stat('bon',1);sfx('buy');note(b[1]+' '+b[2]+' — '+b[4]+' с!')};return c});
R('shop').querySelectorAll('.card').forEach(c=>{});
const potImg={pot:0,rain:160,wind:60,rush:280,swarm:210};
EG.e.querySelector('span').innerHTML="<img class='bi' src='img/items/egg.svg' alt=''>";
BON.forEach((b,i)=>{BC2[i].e.querySelector('span').innerHTML=`<img class='bi' src='img/items/potion.svg' alt='' style='filter:hue-rotate(${potImg[b[0]]}deg)'>`});
R('shop').prepend(sec('🥚 Новые пчёлы'),EG.e,sec('🧪 Бустеры и ускорители'),...BC2.map(c=>c.e));
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
sb.append(sec('💎 Премиум-магазин'),el('div','nc','<small>Премиум-валюта 💎 зарабатывается в игре: достижения, задания, ежедневный бонус, уровни и перерождения. Покупка 💎 за реальные деньги пока не подключена: для неё нужна учётная запись Google Play.</small>'),prem,sec('🛍 Обычный магазин'));put(sb,R('shop'));
const upS=sec('⬆️ Улучшения');upS.id='sh_up';sb.append(upS);put(sb,R('cards'));
sb=mkScr('col','Коллекция пчёл','🐝');put(sb,R('bz'));
sb=mkScr('hive','Локации и королевы','🗺');sb.append(sec('👑 Королевы'));put(sb,R('qn'));sb.append(sec('🌍 Локации'));put(sb,R('lc'));
sb=mkScr('set','Настройки','⚙️');put(sb,R('set'));
const mb2=(t,f)=>{const b=el('button','tg',t);b.onclick=f;return b};
row('ℹ️ Версия '+V,mb2('Проверить',()=>chkUpd(true)));row('💬 Telegram',mb2('Открыть',()=>openUrl(CFG.TG)));row('🎓 Обучение',mb2('Пройти',()=>startTut()));row('📰 Журнал обновлений',mb2('Открыть',()=>openScr('log')));
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
const SV={hc:()=>S.hc,sold:()=>S.st.sold||0,buy:()=>S.st.buy||0,tap:()=>S.st.tap||0,gold:()=>S.st.gold||0,up:()=>S.st.up||0,bon:()=>S.st.bon||0,hv:()=>S.hives,loc:()=>S.ul.reduce((a,b)=>a+(b?1:0),0),col:()=>S.col.reduce((a,b)=>a+(b?1:0),0),lvl:()=>lvl(),q:()=>S.q.reduce((a,b)=>a+b,0),rb:()=>S.rb||0};
const ACH=[['hc1','🍯','Первые капли','hc',100],['hc2','🍯','Медовая река','hc',1e4],['hc3','🍯','Медовое море','hc',1e6],['hc4','🍯','Медовый океан','hc',1e9],['sd1','💰','Торговец','sold',500],['sd2','💰','Купец','sold',5e4],['by1','🐝','Новый друг','buy',3],['by2','🐝','Целый рой','buy',25],['hv1','🏠','Второй дом','hv',2],['hv2','🏰','Пасечный магнат','hv',6],['lc1','🌍','Путешественник','loc',2],['lc2','🗺','Исследователь','loc',4],['cl1','📖','Коллекционер','col',4],['cl2','📚','Все пчёлы','col',11],['gd1','🌟','Золотая рука','gold',1],['gd2','🌟','Охотник за золотом','gold',20],['lv1','⭐','Уровень 5','lvl',5],['lv2','⭐','Уровень 15','lvl',15],['lv3','⭐','Уровень 30','lvl',30],['qn1','👑','Королевский двор','q',10],['qn2','👑','Императрица','q',50],['up1','⬆️','Мастер улучшений','up',25],['rb1','🔄','Перерождение','rb',1],['rb2','🔥','Феникс','rb',5]];
const base=()=>Math.max(100,Math.floor(S.tot*.01));
const DR=[['🪙',()=>{const c=base();S.coins+=c;return fmt(c)+' 🪙'}],['🍯',()=>{const h=50*(S.bees+2);S.honey+=h;return fmt(h)+' 🍯'}],['🥚',()=>{S.fe++;return 'бесплатное яйцо 🥚'}],['🪙',()=>{const c=base()*2;S.coins+=c;S.gem+=5;return fmt(c)+' 🪙 и 5 💎'}],['🍯',()=>{const h=150*(S.bees+2);S.honey+=h;return fmt(h)+' 🍯'}],['🪙',()=>{const c=base()*4;S.coins+=c;return fmt(c)+' 🪙'}],['🎁',()=>{S.gem+=20;if(S.bees<hcap()){hatch(3);return 'эпическая пчела и 20 💎'}const c=base()*10;S.coins+=c;return fmt(c)+' 🪙 и 20 💎'}]];
const QP=[['🍯','Собери {g} мёда','hc',()=>Math.max(50,Math.floor(S.tot*.003))],['💰','Продай {g} мёда','sold',()=>Math.max(40,Math.floor(S.tot*.002))],['🌼','Тапни по цветам {g} раз','tap',()=>25],['🌟','Поймай золотой цветок','gold',()=>1],['⬆️','Купи улучшений: {g}','up',()=>2],['🐝','Купи пчелу или яйцо','buy',()=>1],['⚡','Купи бонус в магазине','bon',()=>1]];
function rollQ(){const t=dk();if(S.dq&&S.dq.d==t)return;const p=QP.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,3);S.dq={d:t,p,g:p.map(i=>QP[i][3]()),b:p.map(i=>SV[QP[i][2]]()),c:[0,0,0]}}
const qv=i=>Math.max(0,Math.min(S.dq.g[i],SV[QP[S.dq.p[i]][2]]()-S.dq.b[i])),qdone=i=>qv(i)>=S.dq.g[i];
const dayIdx=()=>{const t=dk(),y=dk(new Date(Date.now()-864e5));return S.db.last==t?-1:S.db.last==y?S.db.s%7:0};
function claimDay(){const i=dayIdx();if(i<0)return sfx('no');const y=dk(new Date(Date.now()-864e5));S.db.s=S.db.last==y?S.db.s+1:1;S.db.last=dk();const m=DR[i][1]();sfx('gold');note('🎁 День '+(i+1)+': '+m);save()}
function chkAch(q){ACH.forEach(a=>{if(!S.ach.includes(a[0])&&SV[a[3]]()>=a[4]){S.ach.push(a[0]);S.ac=S.ach.length;S.gem+=5;if(!q){note('🎖 '+a[2]+' — +2% к цене мёда и 5 💎');sfx('gold')}}})}
sb=mkScr('ach','Достижения','🎖');
sb.innerHTML=`<div class="sec">🎁 Ежедневный бонус</div><div class="days" id="dd"></div><button class="tg" id="dbtn" style="padding:12px;font-size:16px"></button><div class="sec">📋 Задания дня</div><div id="dq" style="display:flex;flex-direction:column;gap:8px"></div><div class="sec" id="ash"></div><div id="da" style="display:flex;flex-direction:column;gap:8px"></div>`;
DR.forEach((d,i)=>R('dd').append(el('div','',`<span>${d[0]}</span>День ${i+1}`)));R('dbtn').onclick=claimDay;
const QR=[0,1,2].map(i=>{const r=el('div','ac',`<span class="i"></span><div class="t"></div><button>Забрать</button>`);r.querySelector('button').onclick=()=>{if(S.dq.c[i]||!qdone(i))return sfx('no');S.dq.c[i]=1;const c=base();S.coins+=c;S.gem+=2;sfx('buy');note('📋 Задание выполнено: +'+fmt(c)+' 🪙 и 2 💎')};R('dq').append(r);return r});
const AR=ACH.map(a=>{const r=el('div','ac',`<span class="i">${a[1]}</span><div class="t"></div>`);R('da').append(r);return r});
function updAch(){const cur=dayIdx(),b=R('dbtn');[...R('dd').children].forEach((c,i)=>{c.className=cur<0?(i==(S.db.s-1)%7?'cur':i<(S.db.s-1)%7?'done':''):(i==cur?'cur':i<cur?'done':'')});
 if(cur>=0){b.disabled=false;b.textContent='🎁 Забрать награду дня '+(cur+1)}else{const n=new Date(),ms=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1)-n,s=Math.floor(ms/1000);b.disabled=true;b.textContent='⏳ Следующая награда через '+String(s/3600|0).padStart(2,'0')+':'+String(s/60%60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
 QR.forEach((r,i)=>{const q=QP[S.dq.p[i]],g=S.dq.g[i],ok=qdone(i),bt=r.querySelector('button');r.classList.toggle('ok',!!S.dq.c[i]);r.children[0].textContent=q[0];r.children[1].innerHTML=q[1].replace('{g}',fmt(g))+`<small>${fmt(qv(i))} / ${fmt(g)} · награда ${fmt(base())} 🪙</small>`;bt.disabled=!ok||!!S.dq.c[i];bt.textContent=S.dq.c[i]?'✓':'Забрать'});
 R('ash').textContent=`🎖 Достижения: ${S.ach.length}/${ACH.length} · бонус к цене мёда +${S.ach.length*2}%`;
 ACH.forEach((a,i)=>{const ok=S.ach.includes(a[0]),v=Math.min(a[4],SV[a[3]]());AR[i].classList.toggle('ok',ok);AR[i].children[1].innerHTML=`${a[2]}${ok?' ✓':''}<small>${fmt(v)} / ${fmt(a[4])}</small>`;AR[i].style.opacity=ok?1:.8})}

/* ---------- перерождение, обучение, журнал обновлений ---------- */
const RBC=mkc(el('div'),'🔄','Перерождение'),rbReady=()=>S.hives>=6&&S.fl>=flcap();let rbArm=0;
sb=mkScr('rb','Перерождение','🔄');sb.append(el('div','nc','<b>Что сбросится:</b> монеты, мёд, пчёлы, ульи, улучшения, королевы, локация.<br><b>Что сохранится:</b> скины, коллекция пчёл, достижения, статистика, ник, 💎 и бонус дохода.<br><b>Что получишь:</b> доход ×1.2 за каждое перерождение, +3 места под цветы и +1 место в каждом улье.'),RBC.e);
RBC.e.onclick=()=>{if(!rbReady())return sfx('no');if(!rbArm){rbArm=1;note('Нажми ещё раз, чтобы переродиться');setTimeout(()=>rbArm=0,4000);return}rbArm=0;rebirth()};
function rebirth(){S.rb=(S.rb||0)+1;Object.assign(S,{coins:20,honey:0,bees:1,hives:1,spd:0,cap:0,price:0,nec:0,fl:0,auto:0,hx:0,spd2:0,hy:0,qk:0,lck:0,q:[0,0,0,0,0,0],loc:0,egg:0,bty:[]});bees=[];addBee(0);FL.forEach(f=>f.n=3);G=null;E=null;potT=0;MAN.acc=0;MAN.st='idle';MAN.load=0;S.gem+=25;save();sync(true);sfx('gold');note('🔄 Перерождение №'+S.rb+'! Доход ×'+(1.2**S.rb).toFixed(2))}
const TUT=[['👋','Добро пожаловать на пасеку!','Ты пчеловод. Пчёлки сами собирают нектар и носят мёд в улей.'],['🌼','Тапай по цветам','Тап по цветку — ты сам собираешь нектар. Пустые цветки (почки) отрастают со временем.'],['🍯','Продавай мёд','Нажми на лавку или на кнопку «Продать» сверху — мёд превратится в монеты 🪙.'],['⬆️','Покупай улучшения','Кнопки внизу: 🛍 магазин и улучшения, 🐝 коллекция, 🗺 локации и королевы, 🎖 задания.'],['🧑‍🌾','Пасечник-помощник','Купи «Помощник в лавке» — человечек сам будет ходить к ульям и продавать мёд.'],['🧪','Зелья и яйца','В магазине: яйца с редкими пчёлами и зелье скорости за 100 монет — пчёлы летают быстрее минуту.'],['🌟','Золотой цветок','Лови золотой цветок — большой бонус! Иногда случаются события.'],['🔄','Перерождение','Когда прокачаешь всё до максимума, переродись: начнёшь сначала, но доход будет ×1.2 навсегда.']];
function startTut(){if(R('tu'))return;let i=0;const m=el('div','',`<div><div id="tue" style="font-size:54px"></div><h2 id="tut"></h2><p id="tup"></p><div id="tud" style="margin-bottom:6px;letter-spacing:3px"></div><button id="tun"></button><button class="l" id="tus">Пропустить</button></div>`);m.id='tu';document.body.appendChild(m);
 const draw=()=>{const s=TUT[i];R('tue').textContent=s[0];R('tut').textContent=s[1];R('tup').textContent=s[2];R('tud').textContent=TUT.map((_,k)=>k==i?'●':'○').join(' ');R('tun').textContent=i<TUT.length-1?'Далее ›':'Поехали! 🐝'},end=()=>{S.tut=1;S.seenV=V;save();m.remove();sfx('buy')};
 R('tun').onclick=()=>{sfx('tap');if(i<TUT.length-1){i++;draw()}else end()};R('tus').onclick=end;draw()}
const LOG=[['1.3.0',['🏠 Новый главный экран: профиль, уровень, задание, ежедневный бонус','🐝 11 видов пчёл с настоящими картинками и редкостями, красивое открытие редких пчёл','📖 Страница «Коллекция пчёл» с силуэтами ещё не найденных','🛍 Единый магазин: премиум 💎 сверху, обычные товары, улучшения внизу','💎 Премиум-валюта: даётся за достижения, задания, бонусы и перерождения','👤 Аватары-пчёлы вместо смайликов','🔐 Постоянная подпись APK: обновления ставятся поверх старой версии']],['1.2.0',['🔄 Перерождение: когда всё прокачано — начни заново с доходом ×1.2 навсегда','🧪 Зелье скорости: 100 монет — пчёлы быстрее на 1 минуту','⬆️ 4 новых улучшения: Реактивные крылья, Густой мёд, Быстрый сбор, Удача пасечника','🧑‍🌾 Пасечник-человечек ходит за мёдом и продаёт его в лавке','🎓 Обучение для новичков и журнал обновлений','🏅 Без базы рейтинга показываются твои личные рекорды','💾 Резервная копия прогресса (Настройки) — можно перенести игру на другой телефон']],['1.1.0',['🏠 Главное меню и отдельные экраны','👤 Профиль с аватаром и статистикой','🏆 Общий рейтинг (по желанию)','🎁 Ежедневный бонус, задания дня и 22 достижения','🔊 Музыка замолкает при сворачивании игры','📲 Проверка обновлений']],['1.0.0',['👑 Королевы пчёл и 🌍 4 локации','🐝 Редкие пчёлы, яйца и коллекция','✨ События и золотой цветок','🎨 Скины пчёл и ульев']]];
sb=mkScr('log','Что нового','📰');LOG.forEach(([v,a])=>sb.append(el('div','nc',`<b style="font-size:17px">v${v}${v==V?' · новая':''}</b><ul style="text-align:left;margin:8px 0 0;padding-left:20px;font-weight:600">${a.map(x=>`<li>${x}</li>`).join('')}</ul>`)));
if(!S.tut&&(S.tot>25||S.bees>1))S.tut=1;if(!S.tut)S.seenV=V;if(S.tut&&S.seenV!=V)setTimeout(()=>openScr('log'),700);

/* ---------- главное меню (по макету) и панель в игре ---------- */
const mn=el('div','',`<div class="mt"><div class="pc" id="mpc"><div class="pav" id="mav"></div><div class="pin"><b id="mnick"></b><small id="mlv"></small><div class="xp"><i id="mxp"></i><span id="mxt"></span></div></div></div><div class="cur"><div class="pill">🍯 <b id="mh"></b></div><div class="pill">🪙 <b id="mc"></b></div><div class="pill">💎 <b id="mgm"></b></div></div></div>
<img class="hero" src="img/bees/skin_royal.svg" alt=""><div class="plank">ПАСЕКА</div>
<div class="r2"><button class="qcard" id="mq"><span>📜</span><div><small>Активное задание:</small><b id="mqt"></b><div class="xp"><i id="mqb"></i><span id="mqn"></span></div></div></button><button class="dcard" id="md"><i class="bdg" id="mdb">!</i><span>🎁</span>Ежедневный бонус</button></div>
<button class="play" id="mplay">▶ Играть</button>
<button class="wide" id="mshop"><span>🛍</span><div><b>Магазин</b><small>Покупки • Улучшения • Скины</small></div><em>›</em></button>
<div class="mg" id="mg"></div><div class="ver">Версия ${V}</div>`);
mn.id='menu';mn.className='on';document.body.appendChild(mn);R('mplay').onclick=play;R('mshop').onclick=()=>openScr('shop');R('mq').onclick=R('md').onclick=()=>openScr('ach');
[['col','<img class="ti" src="img/bees/bee_0.svg" alt="">','Коллекция пчёл'],['rb','🔄','Перерождение'],['prof','👤','Профиль'],['ach','🏆','Достижения','bAch'],['log','📰','Что нового'],['set','⚙️','Настройки']].forEach(([k,i,t,id])=>{const b=el('button','mb',`<span>${i}</span>${t}<i class="dot"></i>`);if(id)b.id=id;b.onclick=()=>openScr(k);R('mg').append(b)});
function updMenu(){const L=lvl(),a=lvAt(L),b=lvAt(L+1),p=Math.max(0,Math.min(1,(S.tot-a)/(b-a)));
 R('mav').innerHTML=avHtml(S.av);R('mnick').textContent=S.nick;R('mlv').textContent='Уровень '+L;R('mxp').style.width=p*100+'%';R('mxt').textContent=fmt(Math.max(0,S.tot-a))+' / '+fmt(b-a);
 R('mh').textContent=fmt(Math.floor(S.honey));R('mc').textContent=fmt(Math.floor(S.coins));R('mgm').textContent=fmt(S.gem||0);
 const qi=[0,1,2].find(i=>!S.dq.c[i]);if(qi==null){R('mqt').textContent='Все задания выполнены!';R('mqb').style.width='100%';R('mqn').textContent='✓'}else{const q=QP[S.dq.p[qi]],g=S.dq.g[qi];R('mqt').textContent=q[1].replace('{g}',fmt(g));R('mqb').style.width=qv(qi)/g*100+'%';R('mqn').textContent=fmt(qv(qi))+' / '+fmt(g)}
 const ok=dayIdx()>=0;R('mdb').style.display=ok?'flex':'none'}
window.revealBee=function(t,nw){const b=BT[t];if(R('rv'))R('rv').remove();const m=el('div','',`<div class="rvb"><div class="rays"></div><img src="img/bees/bee_${t}.svg" alt=""><h2>${nw?'🆕 Новая пчела!':'Пчела вылупилась!'}</h2><b style="color:${b.rc}">${b.r}</b><div>${esc(b.n)} · ×${b.m} мёда</div><small>Нажми, чтобы закрыть</small></div>`);m.id='rv';m.style.setProperty('--c',b.rc);document.body.appendChild(m);sfx('gold');m.onclick=()=>m.remove();setTimeout(()=>m.parentNode&&m.remove(),5000)};
const gb=el('div');gb.id='gb';[['menu','🏠'],['shop','🛍'],['col','🐝'],['hive','🗺'],['ach','🎖']].forEach(([k,i])=>{const b=el('button',0,i);b.onclick=()=>k=='menu'?showMenu():openScr(k);gb.append(b)});R('app').insertBefore(gb,R('tabs'));document.body.appendChild(R('nt'));

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
 rollQ();chkAch(false);updMenu();GM.forEach((g,i)=>{const l=g[5]();GC[i].dd.textContent=g[3]();GC[i].bb.textContent=l==='Куплено'?'✓ Куплено':l||g[2]+' 💎';GC[i].e.classList.toggle('no',!!l||(S.gem||0)<g[2])});
 {const ok=rbReady();RBC.dd.textContent=ok?`Всё на максимуме! Станет: доход ×${(1.2**((S.rb||0)+1)).toFixed(2)}, +3 цветка, +1 место в улье`:`Нужно: 6 ульев и цветы на максимум (${nf()}/${6+flcap()}). Сейчас доход ×${(1.2**(S.rb||0)).toFixed(2)}`;RBC.bb.textContent=ok?'Переродиться':'🔒 Пока нельзя';RBC.e.classList.toggle('no',!ok)}
 R('bAch').classList.toggle('nt',dayIdx()>=0||[0,1,2].some(i=>!S.dq.c[i]&&qdone(i)));
 BON.forEach((b,i)=>{const p=b[0]=='pot'?100:bcost(b[5]);BC2[i].bb.textContent=fmt(p)+' 🪙';BC2[i].e.classList.toggle('no',S.coins<p)});
 if(isOn('prof'))updProf();if(isOn('ach'))updAch()};

/* ---------- жизненный цикл Android: музыка и кнопка «назад» ---------- */
if(CP.App){const A=CP.App;
 A.addListener('appStateChange',s=>{if(s.isActive)audioOn();else{audioOff();save()}});
 A.addListener('pause',()=>{audioOff();save()});A.addListener('resume',audioOn);
 A.addListener('backButton',()=>{if(stack.length)back();else if(!R('menu').classList.contains('on'))showMenu();else A.exitApp()})}
document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
uiX();
})();
