import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

/* ─── LOCAL STORAGE HELPERS ──────────────────────────────────── */
const KEYS = { tx: "ammi_tx", budget: "ammi_budget", funds: "ammi_funds" };

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function lsSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

/* ─── SEED DATA ──────────────────────────────────────────────── */
const SEED_TX = [
  { id:1,  date:"2025-01-05", type:"income",  category:"Diezmos",         fund:"General",      desc:"Diezmos servicio domingo",     amount:4200, method:"Efectivo" },
  { id:2,  date:"2025-01-05", type:"income",  category:"Ofrendas",        fund:"General",      desc:"Ofrenda servicio domingo",     amount:1850, method:"Efectivo" },
  { id:3,  date:"2025-01-08", type:"income",  category:"Online",          fund:"General",      desc:"Pushpay – semana",             amount:920,  method:"Digital" },
  { id:4,  date:"2025-01-10", type:"expense", category:"Renta/Utilities", fund:"General",      desc:"Renta local Enero",            amount:3200, method:"Cheque" },
  { id:5,  date:"2025-01-12", type:"income",  category:"Diezmos",         fund:"General",      desc:"Diezmos miércoles",            amount:980,  method:"Efectivo" },
  { id:6,  date:"2025-01-15", type:"expense", category:"Ministerio Niños",fund:"General",      desc:"Materiales Kids Church",       amount:340,  method:"Tarjeta" },
  { id:7,  date:"2025-01-19", type:"income",  category:"Misiones",        fund:"Misiones",     desc:"Ofrenda especial misiones",    amount:2100, method:"Efectivo" },
  { id:8,  date:"2025-01-22", type:"expense", category:"Sonido/Media",    fund:"General",      desc:"Equipos de sonido",            amount:750,  method:"Tarjeta" },
  { id:9,  date:"2025-01-26", type:"income",  category:"Diezmos",         fund:"General",      desc:"Diezmos domingo",              amount:5100, method:"Efectivo" },
  { id:10, date:"2025-01-26", type:"income",  category:"Construccion",    fund:"Construcción", desc:"Fondo construcción",           amount:3000, method:"Cheque" },
  { id:11, date:"2025-02-02", type:"income",  category:"Diezmos",         fund:"General",      desc:"Diezmos domingo",              amount:4750, method:"Efectivo" },
  { id:12, date:"2025-02-05", type:"expense", category:"Salarios",        fund:"General",      desc:"Pago personal pastoral",       amount:5500, method:"Transferencia" },
  { id:13, date:"2025-02-09", type:"income",  category:"Online",          fund:"General",      desc:"Tithe.ly – semana",            amount:1240, method:"Digital" },
  { id:14, date:"2025-02-16", type:"income",  category:"Diezmos",         fund:"General",      desc:"Diezmos domingo",              amount:4900, method:"Efectivo" },
  { id:15, date:"2025-02-20", type:"expense", category:"Renta/Utilities", fund:"General",      desc:"Electricidad + Internet",      amount:480,  method:"ACH" },
  { id:16, date:"2025-03-02", type:"income",  category:"Diezmos",         fund:"General",      desc:"Diezmos domingo",              amount:5200, method:"Efectivo" },
  { id:17, date:"2025-03-05", type:"expense", category:"Salarios",        fund:"General",      desc:"Pago personal pastoral",       amount:5500, method:"Transferencia" },
  { id:18, date:"2025-03-09", type:"income",  category:"Ofrendas",        fund:"General",      desc:"Ofrenda especial",             amount:2200, method:"Efectivo" },
  { id:19, date:"2025-03-16", type:"income",  category:"Misiones",        fund:"Misiones",     desc:"Campaña Guatemala",            amount:4500, method:"Cheque" },
  { id:20, date:"2025-03-20", type:"expense", category:"Eventos",         fund:"General",      desc:"Retiro de jóvenes",            amount:1200, method:"Tarjeta" },
];

const SEED_BUDGET = [
  { category:"Salarios",          budgeted:6000, fund:"General" },
  { category:"Renta/Utilities",   budgeted:4000, fund:"General" },
  { category:"Ministerio Niños",  budgeted:500,  fund:"General" },
  { category:"Sonido/Media",      budgeted:800,  fund:"General" },
  { category:"Eventos",           budgeted:1500, fund:"General" },
  { category:"Misiones",          budgeted:3000, fund:"Misiones" },
  { category:"Construccion",      budgeted:5000, fund:"Construcción" },
];

const SEED_FUNDS = [
  { name:"General",      color:"#D4A843", description:"Operaciones generales" },
  { name:"Misiones",     color:"#4A90D9", description:"Proyectos misioneros" },
  { name:"Construcción", color:"#7BC67E", description:"Fondo edificio propio" },
  { name:"Emergencias",  color:"#E88C5A", description:"Reserva urgente" },
];

const CATS_IN  = ["Diezmos","Ofrendas","Misiones","Construccion","Online","Donación Especial","Otro"];
const CATS_OUT = ["Salarios","Renta/Utilities","Ministerio Niños","Sonido/Media","Eventos","Misiones","Construccion","Suministros","Otro"];
const METHODS  = ["Efectivo","Cheque","Tarjeta","Digital","Transferencia","ACH","Zelle","Pushpay"];
const MONTHS   = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const fmt  = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(n||0);
const fmtS = n => n>=1000?`$${(n/1000).toFixed(1)}k`:fmt(n);

/* ── Icon helper ── */
const IC = {
  dashboard: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
  tx:        "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  budget:    "M18 20V10M12 20V4M6 20v-6",
  funds:     "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 6v6l4 2",
  report:    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zm0 0v6h6M16 13H8M16 17H8",
  plus:      "M12 5v14M5 12h14",
  x:         "M18 6L6 18M6 6l12 12",
  trash:     "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
};
function Ico({ k, s=16, c="currentColor" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={IC[k]}/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [tab,   setTab]   = useState("dashboard");
  const [txs,   setTxs]   = useState(() => lsGet(KEYS.tx, SEED_TX));
  const [bgt,   setBgt]   = useState(() => lsGet(KEYS.budget, SEED_BUDGET));
  const [fnds,  setFnds]  = useState(() => lsGet(KEYS.funds, SEED_FUNDS));
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(null);

  const addTx = useCallback(tx => {
    const next = [{ ...tx, id: Date.now() }, ...txs];
    setTxs(next);
    lsSet(KEYS.tx, next);
    setToast("✓  Transacción registrada");
    setTimeout(() => setToast(null), 3000);
  }, [txs]);

  const delTx = useCallback(id => {
    const next = txs.filter(t => t.id !== id);
    setTxs(next);
    lsSet(KEYS.tx, next);
    setToast("Transacción eliminada");
    setTimeout(() => setToast(null), 3000);
  }, [txs]);

  const NAV = [
    { id:"dashboard", ic:"dashboard", label:"Dashboard"      },
    { id:"tx",        ic:"tx",        label:"Transacciones"  },
    { id:"budget",    ic:"budget",    label:"Presupuesto"    },
    { id:"funds",     ic:"funds",     label:"Fondos"         },
    { id:"reports",   ic:"report",    label:"Reportes"       },
  ];

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#07101f"}}>

      {/* ── SIDEBAR ── */}
      <aside style={{width:210,flexShrink:0,background:"#0b1726",
        borderRight:"1px solid #18293f",display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{padding:"24px 18px 18px",borderBottom:"1px solid #18293f"}}>
          <div style={{width:44,height:44,borderRadius:13,
            background:"linear-gradient(135deg,#D4A843,#a87928)",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 0 20px #D4A84355",marginBottom:12,fontSize:22}}>✝</div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:16,
            fontWeight:700,color:"#D4A843",lineHeight:1.2}}>Iglesia Ammi</div>
          <div style={{fontSize:10,color:"#3d5070",marginTop:2,
            letterSpacing:"0.1em",textTransform:"uppercase"}}>Atlanta · Finanzas</div>
        </div>
        <nav style={{flex:1,padding:"14px 10px"}}>
          {NAV.map(n => {
            const on = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{
                width:"100%",display:"flex",alignItems:"center",gap:9,
                padding:"9px 11px",marginBottom:3,borderRadius:9,border:"none",
                cursor:"pointer",background:on?"rgba(212,168,67,.14)":"transparent",
                color:on?"#D4A843":"#4a607e",
                borderLeft:`2px solid ${on?"#D4A843":"transparent"}`,
                transition:"all .15s",textAlign:"left",
              }}>
                <Ico k={n.ic} s={15} c={on?"#D4A843":"#4a607e"}/>
                <span style={{fontSize:13,fontWeight:on?600:400}}>{n.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{padding:"12px 18px",borderTop:"1px solid #18293f"}}>
          <div style={{fontSize:9,color:"#263850",lineHeight:1.7}}>
            Sistema Financiero v2.0<br/>© 2025 Iglesia Ammi Atlanta
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{flexShrink:0,background:"rgba(7,16,31,.95)",backdropFilter:"blur(10px)",
          borderBottom:"1px solid #18293f",padding:"12px 28px",
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:15,color:"#8aa0c0"}}>
            {NAV.find(n => n.id === tab)?.label}
          </div>
          <button onClick={() => setModal(true)} style={{
            display:"flex",alignItems:"center",gap:7,padding:"8px 18px",
            background:"linear-gradient(135deg,#D4A843,#a87928)",color:"#07101f",
            border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,
            boxShadow:"0 4px 14px #D4A84350",
          }}>
            <Ico k="plus" s={13} c="#07101f"/> Nueva Transacción
          </button>
        </div>

        {/* Page */}
        <main style={{flex:1,overflowY:"auto",padding:"28px 28px 40px"}}>
          {tab==="dashboard" && <Dashboard txs={txs} bgt={bgt} fnds={fnds}/>}
          {tab==="tx"        && <Transactions txs={txs} onDel={delTx} onAdd={() => setModal(true)}/>}
          {tab==="budget"    && <BudgetView txs={txs} bgt={bgt}/>}
          {tab==="funds"     && <FundsView txs={txs} fnds={fnds}/>}
          {tab==="reports"   && <Reports txs={txs}/>}
        </main>
      </div>

      {modal && <AddModal onClose={() => setModal(false)} onSave={addTx} fnds={fnds}/>}
      {toast && (
        <div style={{position:"fixed",bottom:24,right:24,zIndex:999,
          background:"linear-gradient(135deg,#D4A843,#a87928)",
          color:"#07101f",padding:"11px 20px",borderRadius:9,
          fontWeight:700,fontSize:13,boxShadow:"0 8px 24px #D4A84350",
          animation:"fadeUp .3s ease"}}>
          {toast}
          <style>{`@keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        </div>
      )}
    </div>
  );
}

/* ─── DASHBOARD ───────────────────────────────────────────────── */
function Dashboard({ txs, bgt, fnds }) {
  const inc   = txs.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0);
  const exp   = txs.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0);
  const bal   = inc-exp;
  const now   = new Date();
  const mInc  = txs.filter(t=>t.type==="income"&&new Date(t.date).getMonth()===now.getMonth()).reduce((a,t)=>a+t.amount,0);

  const monthly = MONTHS.map((m,i)=>({
    mes:m,
    Ingresos:txs.filter(t=>t.type==="income" &&new Date(t.date).getMonth()===i).reduce((a,t)=>a+t.amount,0),
    Gastos:  txs.filter(t=>t.type==="expense"&&new Date(t.date).getMonth()===i).reduce((a,t)=>a+t.amount,0),
  })).filter(m=>m.Ingresos>0||m.Gastos>0);

  const pie = fnds.map(f=>({
    name:f.name, color:f.color,
    value:txs.filter(t=>t.type==="income"&&t.fund===f.name).reduce((a,t)=>a+t.amount,0)
  })).filter(f=>f.value>0);

  const topCats = CATS_IN.map(c=>({
    name:c,value:txs.filter(t=>t.type==="income"&&t.category===c).reduce((a,t)=>a+t.amount,0)
  })).filter(c=>c.value>0).sort((a,b)=>b.value-a.value).slice(0,5);

  const recent = [...txs].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,7);
  const tt = {background:"#0e1d35",border:"1px solid #2a3a5c",borderRadius:8,fontSize:12,color:"#c8d4e8"};

  const kpis = [
    {l:"Balance General", v:fmt(bal),  sub:"Todos los fondos",   accent:"#D4A843",icon:"✝"},
    {l:"Total Ingresos",  v:fmt(inc),  sub:"Historial completo", accent:"#7BC67E",icon:"↑"},
    {l:"Total Gastos",    v:fmt(exp),  sub:"Historial completo", accent:"#E8705A",icon:"↓"},
    {l:"Este Mes",        v:fmt(mInc), sub:MONTHS[now.getMonth()],accent:"#4A90D9",icon:"◎"},
  ];

  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        {kpis.map((k,i)=>(
          <div key={i} style={{background:"#0b1726",border:`1px solid ${k.accent}28`,
            borderRadius:15,padding:"18px 20px",position:"relative",overflow:"hidden",
            boxShadow:`0 6px 24px #0005`}}>
            <div style={{position:"absolute",top:-14,right:-14,width:58,height:58,
              borderRadius:"50%",background:k.accent,opacity:.08}}/>
            <div style={{fontSize:20,marginBottom:6}}>{k.icon}</div>
            <div style={{fontSize:10,color:"#3d5070",letterSpacing:".1em",
              textTransform:"uppercase",marginBottom:3}}>{k.l}</div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:22,
              fontWeight:700,color:k.accent,lineHeight:1.1,marginBottom:3}}>{k.v}</div>
            <div style={{fontSize:10,color:"#2d4060"}}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:14,marginBottom:14}}>
        <Card title="Ingresos vs Gastos por Mes">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={monthly} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#18293f"/>
              <XAxis dataKey="mes" tick={{fill:"#4a607e",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#4a607e",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={fmtS}/>
              <Tooltip contentStyle={tt} formatter={v=>fmt(v)}/>
              <Bar dataKey="Ingresos" fill="#D4A843" radius={[4,4,0,0]}/>
              <Bar dataKey="Gastos"   fill="#E8705A" radius={[4,4,0,0]}/>
              <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:10,color:"#4a607e"}}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Distribución por Fondo">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={pie} cx="50%" cy="48%" innerRadius={52} outerRadius={80}
                dataKey="value" paddingAngle={3}>
                {pie.map((f,i)=><Cell key={i} fill={f.color}/>)}
              </Pie>
              <Tooltip contentStyle={tt} formatter={v=>fmt(v)}/>
              <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:10,color:"#4a607e"}}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:14}}>
        <Card title="Transacciones Recientes">
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Fecha","Descripción","Categoría","Monto"].map(h=>(
              <th key={h} style={{fontSize:9,color:"#344e6a",fontWeight:600,padding:"5px 10px",
                borderBottom:"1px solid #18293f",textTransform:"uppercase",
                letterSpacing:".08em",textAlign:"left"}}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {recent.map(tx=>(
                <tr key={tx.id} style={{borderBottom:"1px solid #0e1d2f"}}>
                  <td style={{fontSize:11,color:"#4a607e",padding:"8px 10px",whiteSpace:"nowrap"}}>{tx.date.slice(5)}</td>
                  <td style={{fontSize:12,color:"#b0c0d8",padding:"8px 10px",maxWidth:160,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.desc}</td>
                  <td style={{padding:"8px 10px"}}>
                    <span style={{fontSize:9,background:"#142035",color:"#5a7ea0",
                      borderRadius:4,padding:"2px 7px"}}>{tx.category}</span>
                  </td>
                  <td style={{fontSize:12,fontWeight:600,padding:"8px 10px",textAlign:"right",
                    whiteSpace:"nowrap",color:tx.type==="income"?"#7BC67E":"#E8705A"}}>
                    {tx.type==="income"?"+":"-"}{fmt(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Top Categorías de Ingreso">
          <div style={{display:"flex",flexDirection:"column",gap:11,paddingTop:4}}>
            {topCats.map((c,i)=>{
              const pct = Math.round((c.value/inc)*100);
              return (
                <div key={i}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:"#8aa0c0"}}>{c.name}</span>
                    <span style={{fontSize:12,fontWeight:600,color:"#D4A843"}}>{fmtS(c.value)}</span>
                  </div>
                  <div style={{height:5,background:"#18293f",borderRadius:10,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,borderRadius:10,
                      background:"linear-gradient(90deg,#D4A843,#f0c655)"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ─── TRANSACTIONS ────────────────────────────────────────────── */
function Transactions({ txs, onDel, onAdd }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(0);
  const PER = 14;

  const list = useMemo(()=>{
    let t=[...txs].sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(filter!=="all") t=t.filter(x=>x.type===filter);
    if(search){const q=search.toLowerCase();t=t.filter(x=>x.desc.toLowerCase().includes(q)||x.category.toLowerCase().includes(q)||x.fund.toLowerCase().includes(q));}
    return t;
  },[txs,filter,search]);

  const pages = Math.ceil(list.length/PER);
  const paged = list.slice(page*PER,(page+1)*PER);

  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <H1 title="Transacciones" sub={`${list.length} registros`}/>
        <button onClick={onAdd} style={{
          display:"flex",alignItems:"center",gap:7,padding:"9px 18px",
          background:"linear-gradient(135deg,#D4A843,#a87928)",color:"#07101f",
          border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,
          boxShadow:"0 4px 14px #D4A84350"}}>
          <Ico k="plus" s={13} c="#07101f"/> Nueva
        </button>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        {[["all","Todos"],["income","Ingresos"],["expense","Gastos"]].map(([v,l])=>(
          <button key={v} onClick={()=>{setFilter(v);setPage(0);}} style={{
            padding:"6px 14px",borderRadius:7,
            border:`1px solid ${filter===v?"#D4A843":"#1e3050"}`,
            background:filter===v?"rgba(212,168,67,.13)":"transparent",
            color:filter===v?"#D4A843":"#4a607e",cursor:"pointer",fontSize:12,fontWeight:500,
          }}>{l}</button>
        ))}
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}
          placeholder="Buscar…" style={{marginLeft:"auto",padding:"7px 13px",borderRadius:7,
            border:"1px solid #1e3050",background:"#0b1726",color:"#b0c0d8",fontSize:12,outline:"none",width:200}}/>
      </div>

      <div style={{background:"#0b1726",border:"1px solid #18293f",borderRadius:14,overflow:"hidden",marginBottom:14}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#091420"}}>
              {["Fecha","Descripción","Categoría","Fondo","Método","Monto",""].map(h=>(
                <th key={h} style={{textAlign:h==="Monto"?"right":"left",fontSize:9,color:"#344e6a",
                  fontWeight:600,padding:"10px 13px",borderBottom:"1px solid #18293f",
                  textTransform:"uppercase",letterSpacing:".08em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((tx,i)=>(
              <tr key={tx.id} style={{borderBottom:"1px solid #0e1d2f",
                background:i%2===0?"transparent":"rgba(255,255,255,.013)"}}>
                <td style={{fontSize:11,color:"#4a607e",padding:"10px 13px",whiteSpace:"nowrap"}}>{tx.date}</td>
                <td style={{fontSize:12,color:"#b0c0d8",padding:"10px 13px",maxWidth:200,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.desc}</td>
                <td style={{padding:"10px 13px"}}>
                  <span style={{fontSize:9,background:"#142035",color:"#5a7ea0",
                    borderRadius:4,padding:"2px 7px",whiteSpace:"nowrap"}}>{tx.category}</span>
                </td>
                <td style={{padding:"10px 13px"}}><FBadge name={tx.fund}/></td>
                <td style={{fontSize:10,color:"#3d5070",padding:"10px 13px",whiteSpace:"nowrap"}}>{tx.method}</td>
                <td style={{fontSize:12,fontWeight:600,padding:"10px 13px",textAlign:"right",
                  whiteSpace:"nowrap",color:tx.type==="income"?"#7BC67E":"#E8705A"}}>
                  {tx.type==="income"?"+":"-"}{fmt(tx.amount)}
                </td>
                <td style={{padding:"10px 8px",textAlign:"center"}}>
                  <button onClick={()=>onDel(tx.id)} title="Eliminar"
                    style={{background:"none",border:"none",cursor:"pointer",color:"#2a3a5c",padding:3,borderRadius:4}}
                    onMouseOver={e=>e.currentTarget.style.color="#E8705A"}
                    onMouseOut={e=>e.currentTarget.style.color="#2a3a5c"}>
                    <Ico k="trash" s={12}/>
                  </button>
                </td>
              </tr>
            ))}
            {paged.length===0&&(
              <tr><td colSpan={7} style={{textAlign:"center",padding:36,fontSize:13,color:"#2d4060"}}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages>1&&(
        <div style={{display:"flex",gap:5,justifyContent:"center"}}>
          {Array.from({length:pages},(_,i)=>(
            <button key={i} onClick={()=>setPage(i)} style={{
              width:28,height:28,borderRadius:6,
              border:`1px solid ${page===i?"#D4A843":"#1e3050"}`,
              background:page===i?"rgba(212,168,67,.18)":"transparent",
              color:page===i?"#D4A843":"#4a607e",cursor:"pointer",fontSize:11,
            }}>{i+1}</button>
          ))}
        </div>
      )}
    </>
  );
}

/* ─── BUDGET ──────────────────────────────────────────────────── */
function BudgetView({ txs, bgt }) {
  const rows = bgt.map(b=>{
    const spent=txs.filter(t=>t.type==="expense"&&t.category===b.category).reduce((a,t)=>a+t.amount,0);
    const pct=b.budgeted?Math.min(Math.round((spent/b.budgeted)*100),999):0;
    return{...b,spent,pct,remaining:b.budgeted-spent,over:spent>b.budgeted};
  });
  const totB=bgt.reduce((a,b)=>a+b.budgeted,0);
  const totS=rows.reduce((a,r)=>a+r.spent,0);
  const totP=Math.min(Math.round((totS/totB)*100),100);

  return (
    <>
      <H1 title="Presupuesto" sub="Control presupuestario por categoría"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {[{l:"Total Presupuestado",v:fmt(totB),c:"#4A90D9"},{l:"Total Gastado",v:fmt(totS),c:"#E8705A"},{l:"Disponible",v:fmt(totB-totS),c:"#7BC67E"}].map((s,i)=>(
          <div key={i} style={{background:"#0b1726",border:`1px solid ${s.c}25`,borderRadius:13,padding:"16px 18px"}}>
            <div style={{fontSize:10,color:"#3d5070",textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>{s.l}</div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#0b1726",border:"1px solid #18293f",borderRadius:13,padding:"16px 20px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:12,color:"#8aa0c0",fontWeight:600}}>Progreso General</span>
          <span style={{fontSize:12,fontWeight:700,color:totP>85?"#E8705A":"#D4A843"}}>{totP}%</span>
        </div>
        <div style={{height:8,background:"#18293f",borderRadius:10,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${totP}%`,borderRadius:10,
            background:totP>85?"#E8705A":"linear-gradient(90deg,#D4A843,#7BC67E)"}}/>
        </div>
      </div>
      <div style={{background:"#0b1726",border:"1px solid #18293f",borderRadius:14,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#091420"}}>
            {["Categoría","Fondo","Presupuesto","Gastado","Disponible","Avance"].map(h=>(
              <th key={h} style={{textAlign:"left",fontSize:9,color:"#344e6a",fontWeight:600,
                padding:"10px 14px",borderBottom:"1px solid #18293f",
                textTransform:"uppercase",letterSpacing:".08em"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #0e1d2f"}}>
                <td style={{fontSize:12,color:"#b0c0d8",padding:"11px 14px",fontWeight:500}}>{r.category}</td>
                <td style={{padding:"11px 14px"}}><FBadge name={r.fund}/></td>
                <td style={{fontSize:12,color:"#5a7ea0",padding:"11px 14px"}}>{fmt(r.budgeted)}</td>
                <td style={{fontSize:12,fontWeight:600,color:r.over?"#E8705A":"#8aa0c0",padding:"11px 14px"}}>{fmt(r.spent)}</td>
                <td style={{fontSize:12,fontWeight:600,color:r.remaining>=0?"#7BC67E":"#E8705A",padding:"11px 14px"}}>{fmt(r.remaining)}</td>
                <td style={{padding:"11px 14px",minWidth:130}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{flex:1,height:5,background:"#18293f",borderRadius:10,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(r.pct,100)}%`,borderRadius:10,
                        background:r.over?"#E8705A":r.pct>75?"#D4A843":"#7BC67E"}}/>
                    </div>
                    <span style={{fontSize:10,color:r.over?"#E8705A":"#4a607e",minWidth:28,textAlign:"right"}}>{r.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─── FUNDS ───────────────────────────────────────────────────── */
function FundsView({ txs, fnds }) {
  const data = fnds.map(f=>({
    ...f,
    income:  txs.filter(t=>t.type==="income" &&t.fund===f.name).reduce((a,t)=>a+t.amount,0),
    expenses:txs.filter(t=>t.type==="expense"&&t.fund===f.name).reduce((a,t)=>a+t.amount,0),
    recent: [...txs].filter(t=>t.fund===f.name).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4),
  })).map(f=>({...f,balance:f.income-f.expenses}));

  return (
    <>
      <H1 title="Fondos" sub="Actividad y balance por fondo"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:18}}>
        {data.map((f,i)=>(
          <div key={i} style={{background:"#0b1726",border:`1px solid ${f.color}22`,borderRadius:17,overflow:"hidden"}}>
            <div style={{background:`linear-gradient(135deg,${f.color}18,${f.color}08)`,
              borderBottom:`1px solid ${f.color}20`,padding:"16px 20px",
              display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:9,color:f.color,letterSpacing:".1em",fontWeight:700,
                  textTransform:"uppercase",marginBottom:3}}>FONDO</div>
                <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:20,
                  fontWeight:700,color:"#dde4f0"}}>{f.name}</div>
                <div style={{fontSize:10,color:"#3d5070",marginTop:2}}>{f.description}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:"#3d5070",marginBottom:2}}>Balance</div>
                <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:22,
                  fontWeight:700,color:f.balance>=0?f.color:"#E8705A"}}>{fmt(f.balance)}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"1px solid #0e1d2f"}}>
              {[{l:"Ingresos",v:f.income,c:"#7BC67E"},{l:"Gastos",v:f.expenses,c:"#E8705A"}].map((s,j)=>(
                <div key={j} style={{padding:"10px 20px",borderRight:j===0?"1px solid #0e1d2f":"none"}}>
                  <div style={{fontSize:9,color:"#3d5070",textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>{s.l}</div>
                  <div style={{fontSize:14,fontWeight:700,color:s.c}}>{fmt(s.v)}</div>
                </div>
              ))}
            </div>
            <div>
              {f.recent.length===0
                ?<div style={{padding:"10px 20px",fontSize:11,color:"#2d4060"}}>Sin actividad reciente</div>
                :f.recent.map((tx,j)=>(
                  <div key={j} style={{display:"flex",justifyContent:"space-between",
                    padding:"8px 20px",borderBottom:"1px solid #0a1520",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:11,color:"#8aa0c0"}}>{tx.desc}</div>
                      <div style={{fontSize:9,color:"#2d4060"}}>{tx.date} · {tx.category}</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,whiteSpace:"nowrap",
                      color:tx.type==="income"?"#7BC67E":"#E8705A"}}>
                      {tx.type==="income"?"+":"-"}{fmt(tx.amount)}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── REPORTS ─────────────────────────────────────────────────── */
function Reports({ txs }) {
  const [sel, setSel] = useState(new Date().getMonth());
  const mTxs = txs.filter(t=>new Date(t.date).getMonth()===sel);
  const mInc = mTxs.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0);
  const mExp = mTxs.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0);

  const weekly = [0,1,2,3].map(w=>({
    semana:`S${w+1}`,
    Ingresos:mTxs.filter(t=>t.type==="income" &&Math.floor((new Date(t.date).getDate()-1)/7)===w).reduce((a,t)=>a+t.amount,0),
    Gastos:  mTxs.filter(t=>t.type==="expense"&&Math.floor((new Date(t.date).getDate()-1)/7)===w).reduce((a,t)=>a+t.amount,0),
  }));

  const catBrk=[...new Set(mTxs.map(t=>t.category))].map(c=>({
    name:c,
    inc:mTxs.filter(t=>t.category===c&&t.type==="income").reduce((a,t)=>a+t.amount,0),
    exp:mTxs.filter(t=>t.category===c&&t.type==="expense").reduce((a,t)=>a+t.amount,0),
  }));

  const tt={background:"#0e1d35",border:"1px solid #2a3a5c",borderRadius:8,fontSize:12,color:"#c8d4e8"};

  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
        marginBottom:20,flexWrap:"wrap",gap:10}}>
        <H1 title="Reportes" sub="Análisis financiero mensual"/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {MONTHS.map((m,i)=>(
            <button key={i} onClick={()=>setSel(i)} style={{
              padding:"4px 10px",borderRadius:6,
              border:`1px solid ${sel===i?"#D4A843":"#1e3050"}`,
              background:sel===i?"rgba(212,168,67,.15)":"transparent",
              color:sel===i?"#D4A843":"#4a607e",cursor:"pointer",fontSize:11,
            }}>{m}</button>
          ))}
        </div>
      </div>

      <div style={{background:"linear-gradient(135deg,#0e1d35,#0b1726)",
        border:"1px solid #D4A84325",borderRadius:16,padding:"20px 24px",marginBottom:18,
        display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:11,
            color:"#D4A843",marginBottom:3,letterSpacing:".1em"}}>
            RESUMEN · {MONTHS[sel].toUpperCase()}</div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:32,
            fontWeight:700,color:"#dde4f0"}}>{fmt(mInc-mExp)}</div>
          <div style={{fontSize:11,color:"#3d5070",marginTop:3}}>Balance neto del mes</div>
        </div>
        <div style={{display:"flex",gap:28,flexWrap:"wrap"}}>
          {[{l:"Ingresos",v:mInc,c:"#7BC67E"},{l:"Gastos",v:mExp,c:"#E8705A"},{l:"Movimientos",v:mTxs.length,c:"#4A90D9",raw:true}].map((s,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:"#3d5070",textTransform:"uppercase",
                letterSpacing:".08em",marginBottom:5}}>{s.l}</div>
              <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:20,
                fontWeight:700,color:s.c}}>{s.raw?s.v:fmt(s.v)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:14,marginBottom:14}}>
        <Card title={`Tendencia Semanal — ${MONTHS[sel]}`}>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={weekly}>
              <defs>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={.25}/>
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8705A" stopOpacity={.25}/>
                  <stop offset="95%" stopColor="#E8705A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#18293f"/>
              <XAxis dataKey="semana" tick={{fill:"#4a607e",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#4a607e",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={fmtS}/>
              <Tooltip contentStyle={tt} formatter={v=>fmt(v)}/>
              <Area type="monotone" dataKey="Ingresos" stroke="#D4A843" fill="url(#gi)" strokeWidth={2}/>
              <Area type="monotone" dataKey="Gastos"   stroke="#E8705A" fill="url(#ge)" strokeWidth={2}/>
              <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:10,color:"#4a607e"}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Desglose por Categoría">
          <div style={{maxHeight:190,overflowY:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Categoría","Ingreso","Gasto"].map(h=>(
                <th key={h} style={{textAlign:"left",fontSize:9,color:"#344e6a",fontWeight:600,
                  padding:"4px 8px",borderBottom:"1px solid #18293f",
                  textTransform:"uppercase",letterSpacing:".08em"}}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {catBrk.map((c,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #0e1d2f"}}>
                    <td style={{fontSize:11,color:"#8aa0c0",padding:"7px 8px"}}>{c.name}</td>
                    <td style={{fontSize:11,color:"#7BC67E",padding:"7px 8px",fontWeight:600}}>{c.inc>0?fmt(c.inc):"—"}</td>
                    <td style={{fontSize:11,color:"#E8705A",padding:"7px 8px",fontWeight:600}}>{c.exp>0?fmt(c.exp):"—"}</td>
                  </tr>
                ))}
                {catBrk.length===0&&<tr><td colSpan={3} style={{textAlign:"center",padding:20,fontSize:11,color:"#2d4060"}}>Sin datos</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {mTxs.length>0&&(
        <Card title={`Todas las Transacciones — ${MONTHS[sel]}`}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Fecha","Descripción","Categoría","Fondo","Monto"].map(h=>(
              <th key={h} style={{textAlign:"left",fontSize:9,color:"#344e6a",fontWeight:600,
                padding:"6px 12px",borderBottom:"1px solid #18293f",
                textTransform:"uppercase",letterSpacing:".08em"}}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {[...mTxs].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((tx,i)=>(
                <tr key={i} style={{borderBottom:"1px solid #0e1d2f"}}>
                  <td style={{fontSize:11,color:"#4a607e",padding:"8px 12px",whiteSpace:"nowrap"}}>{tx.date}</td>
                  <td style={{fontSize:12,color:"#b0c0d8",padding:"8px 12px"}}>{tx.desc}</td>
                  <td style={{padding:"8px 12px"}}>
                    <span style={{fontSize:9,background:"#142035",color:"#5a7ea0",borderRadius:4,padding:"2px 7px"}}>{tx.category}</span>
                  </td>
                  <td style={{padding:"8px 12px"}}><FBadge name={tx.fund}/></td>
                  <td style={{fontSize:12,fontWeight:600,padding:"8px 12px",
                    color:tx.type==="income"?"#7BC67E":"#E8705A"}}>
                    {tx.type==="income"?"+":"-"}{fmt(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

/* ─── ADD MODAL ───────────────────────────────────────────────── */
function AddModal({ onClose, onSave, fnds }) {
  const [form, setForm] = useState({
    date:new Date().toISOString().slice(0,10),
    type:"income",category:CATS_IN[0],fund:"General",
    desc:"",amount:"",method:"Efectivo",
  });
  const [busy, setBusy] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const cats = form.type==="income" ? CATS_IN : CATS_OUT;

  const submit = () => {
    if(!form.desc||!form.amount) return;
    setBusy(true);
    onSave({...form,amount:parseFloat(form.amount)});
    setBusy(false);
    onClose();
  };

  const iS = {width:"100%",padding:"8px 11px",borderRadius:7,
    border:"1px solid #1e3050",background:"#091420",color:"#b0c0d8",fontSize:12,outline:"none"};
  const lS = {fontSize:9,color:"#3d5070",textTransform:"uppercase",
    letterSpacing:".08em",display:"block",marginBottom:4,fontWeight:600};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",
      backdropFilter:"blur(5px)",display:"flex",alignItems:"center",
      justifyContent:"center",zIndex:200,padding:20}}>
      <div style={{background:"#0b1d35",border:"1px solid #2a3a5c",borderRadius:18,
        width:"100%",maxWidth:460,boxShadow:"0 24px 60px #0009"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"18px 22px",borderBottom:"1px solid #18293f"}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:18,
              fontWeight:700,color:"#dde4f0"}}>Nueva Transacción</div>
            <div style={{fontSize:10,color:"#3d5070",marginTop:2}}>Registrar ingreso o gasto</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",
            cursor:"pointer",color:"#4a607e",padding:4}}>
            <Ico k="x" s={17}/>
          </button>
        </div>

        <div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:13}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {["income","expense"].map(t=>(
              <button key={t} onClick={()=>{set("type",t);set("category",(t==="income"?CATS_IN:CATS_OUT)[0]);}} style={{
                padding:"10px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,transition:"all .15s",
                border:`1px solid ${form.type===t?(t==="income"?"#7BC67E":"#E8705A"):"#1e3050"}`,
                background:form.type===t?(t==="income"?"rgba(123,198,126,.15)":"rgba(232,112,90,.15)"):"transparent",
                color:form.type===t?(t==="income"?"#7BC67E":"#E8705A"):"#4a607e",
              }}>{t==="income"?"↑  Ingreso":"↓  Gasto"}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={lS}>Fecha</label><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={iS}/></div>
            <div><label style={lS}>Monto ($)</label><input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0.00" style={iS}/></div>
          </div>
          <div><label style={lS}>Descripción</label>
            <input value={form.desc} onChange={e=>set("desc",e.target.value)}
              placeholder="Ej: Diezmos servicio domingo" style={iS}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={lS}>Categoría</label>
              <select value={form.category} onChange={e=>set("category",e.target.value)} style={iS}>
                {cats.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div><label style={lS}>Fondo</label>
              <select value={form.fund} onChange={e=>set("fund",e.target.value)} style={iS}>
                {fnds.map(f=><option key={f.name}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lS}>Método de Pago</label>
            <select value={form.method} onChange={e=>set("method",e.target.value)} style={iS}>
              {METHODS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"flex",gap:8,padding:"14px 22px",borderTop:"1px solid #18293f"}}>
          <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:8,
            border:"1px solid #1e3050",background:"transparent",
            color:"#4a607e",cursor:"pointer",fontSize:12}}>Cancelar</button>
          <button onClick={submit} disabled={busy||!form.desc||!form.amount} style={{
            flex:2,padding:"10px",borderRadius:8,border:"none",
            background:"linear-gradient(135deg,#D4A843,#a87928)",color:"#07101f",
            cursor:"pointer",fontWeight:700,fontSize:12,
            opacity:busy||!form.desc||!form.amount?0.5:1,
            boxShadow:"0 4px 14px #D4A84340",
          }}>{busy?"Guardando…":"Registrar Transacción"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── SHARED ──────────────────────────────────────────────────── */
function H1({ title, sub }) {
  return (
    <div style={{marginBottom:20}}>
      <h1 style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:26,
        fontWeight:700,color:"#dde4f0",lineHeight:1.1}}>{title}</h1>
      {sub&&<p style={{fontSize:11,color:"#3d5070",marginTop:4}}>{sub}</p>}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{background:"#0b1726",border:"1px solid #18293f",borderRadius:14,padding:"16px 18px"}}>
      <div style={{fontSize:9,fontWeight:600,color:"#344e6a",letterSpacing:".1em",
        textTransform:"uppercase",marginBottom:14,paddingBottom:9,
        borderBottom:"1px solid #0e1d2f"}}>{title}</div>
      {children}
    </div>
  );
}

function FBadge({ name }) {
  const map={"General":"#D4A843","Misiones":"#4A90D9","Construcción":"#7BC67E","Emergencias":"#E88C5A"};
  const c=map[name]||"#5a7ea0";
  return <span style={{fontSize:9,borderRadius:4,padding:"2px 8px",fontWeight:600,
    background:`${c}20`,color:c,whiteSpace:"nowrap"}}>{name}</span>;
}
