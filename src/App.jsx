import { useEffect, useMemo, useState } from "react";

// Sadece burayı düzelttik, artık hata vermeyecek
const API = "https://esnaf-takip-backend.onrender.com";
const KATEGORILER = ["Ciro/Satış", "Mutfak/Gıda", "Elektrik", "Su/Doğalgaz", "Kira", "Maaş", "Mal Alımı", "Diğer"];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({ title: "", amount: "", type: "income", category: "Ciro/Satış" });

  const loadData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/transactions`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) setItems(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [token]);

  const stats = useMemo(() => {
    const income = items.filter(x => x.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = items.filter(x => x.type === 'expense').reduce((a, b) => a + b.amount, 0);
    
    const catData = KATEGORILER.map(cat => ({
      name: cat,
      total: items.filter(x => x.category === cat).reduce((a, b) => a + b.amount, 0)
    })).filter(x => x.total > 0);

    return { income, expense, balance: income - expense, catData };
  }, [items]);

  const filteredItems = items.filter(item => {
    if (filterType === "all") return true;
    return item.type === filterType;
  }).slice().reverse();

  if (!token) return <Login setToken={setToken} />;

  return (
    <div style={layoutStyle}>
      <div style={sidebarStyle}>
        <div style={{fontSize: '22px', fontWeight: '900', marginBottom: '30px', letterSpacing: '-1px'}}>
          ESNAF<span style={{color:'#27ae60'}}>KASA</span>
        </div>
        <div style={activeTab === "dashboard" ? activeNavItem : navItemStyle} onClick={() => setActiveTab("dashboard")}>📊 Gösterge Paneli</div>
        <div style={activeTab === "muhasebe" ? activeNavItem : navItemStyle} onClick={() => setActiveTab("muhasebe")}>💰 Kasa Defteri</div>
        <div style={{marginTop: 'auto', cursor: 'pointer', color: '#ff7675', fontSize: '14px'}} onClick={() => {localStorage.clear(); window.location.reload();}}>Oturumu Kapat 🚪</div>
      </div>

      <div style={mainStyle}>
        {activeTab === "dashboard" ? (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
               <h2 style={{margin:0}}>Hoş Geldiniz 👋</h2>
               <button onClick={loadData} style={refreshBtn}>Yenile</button>
            </div>
            
            <div style={statsGrid}>
              <div style={{...cardStyle, borderLeft: '6px solid #10b981'}}>
                <small style={labelStyle}>TOPLAM TAHSİLAT</small>
                <div style={{fontSize: '28px', fontWeight: '800', color: '#10b981'}}>{stats.income.toLocaleString()} ₺</div>
              </div>
              <div style={{...cardStyle, borderLeft: '6px solid #ef4444'}}>
                <small style={labelStyle}>TOPLAM ÖDEME</small>
                <div style={{fontSize: '28px', fontWeight: '800', color: '#ef4444'}}>{stats.expense.toLocaleString()} ₺</div>
              </div>
              <div style={{...cardStyle, backgroundColor: '#1e293b', color: '#fff'}}>
                <small style={{...labelStyle, color: '#94a3b8'}}>NET KASA</small>
                <div style={{fontSize: '28px', fontWeight: '800'}}>{stats.balance.toLocaleString()} ₺</div>
              </div>
            </div>

            <div style={{...cardStyle, marginTop: '25px'}}>
              <h4 style={{marginTop: 0}}>Kategori Bazlı Harcama Dağılımı</h4>
              {stats.catData.map(cat => (
                <div key={cat.name} style={{marginBottom: '15px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'5px'}}>
                    <span>{cat.name}</span>
                    <span style={{fontWeight:'bold'}}>{cat.total.toLocaleString()} ₺</span>
                  </div>
                  <div style={{width:'100%', height:'8px', backgroundColor:'#f1f2f6', borderRadius:'10px'}}>
                    <div style={{
                      width: `${Math.min((cat.total / (stats.income || 1)) * 100, 100)}%`,
                      height:'100%', backgroundColor:'#3498db', borderRadius:'10px', transition: 'width 0.5s'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{marginBottom: '20px'}}>Kasa Defteri</h2>
            
            <div style={cardStyle}>
              <div style={formRow}>
                <input placeholder="İşlem adı..." style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <input type="number" placeholder="Tutar" style={inputStyle} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                <select style={inputStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {KATEGORILER.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <select style={{...inputStyle, fontWeight:'bold'}} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="income" style={{color:'green'}}>GELİR (+)</option>
                  <option value="expense" style={{color:'red'}}>GİDER (-)</option>
                </select>
                <button style={saveBtn} onClick={async () => {
                  if(!form.title || !form.amount) return;
                  await fetch(`${API}/transactions`, { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}, 
                    body: JSON.stringify({...form, amount: Number(form.amount)}) 
                  });
                  setForm({title: "", amount: "", type: "income", category: "Ciro/Satış"});
                  loadData();
                }}>Ekle</button>
              </div>
            </div>

            <div style={{...cardStyle, padding: 0}}>
              <div style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', gap:'10px'}}>
                <button style={filterType === "all" ? activeFilter : filterBtn} onClick={() => setFilterType("all")}>Hepsi</button>
                <button style={filterType === "income" ? activeFilter : filterBtn} onClick={() => setFilterType("income")}>Sadece Gelirler</button>
                <button style={filterType === "expense" ? activeFilter : filterBtn} onClick={() => setFilterType("expense")}>Sadece Giderler</button>
              </div>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{textAlign:'left', fontSize:'12px', color:'#7f8c8d', borderBottom:'1px solid #eee'}}>
                    <th style={{padding:'15px'}}>TARİH</th>
                    <th>AÇIKLAMA / KATEGORİ</th>
                    <th style={{textAlign: 'right', paddingRight:'20px'}}>TUTAR</th>
                    <th style={{textAlign: 'center'}}>İŞLEM</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} style={tableRowStyle}>
                      <td style={{padding: '15px', fontSize: '12px'}}>{new Date(item.created_at || Date.now()).toLocaleDateString()}</td>
                      <td>
                        <div style={{fontWeight: '600'}}>{item.title}</div>
                        <span style={catTag}>{item.category}</span>
                      </td>
                      <td style={{textAlign: 'right', fontWeight: '800', color: item.type === 'income' ? '#27ae60' : '#c0392b', paddingRight:'20px'}}>
                        {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} ₺
                      </td>
                      <td style={{textAlign: 'center'}}>
                        <button onClick={async () => { if(confirm("Kaydı siliyorsunuz?")) { await fetch(`${API}/transactions/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); loadData(); } }} 
                        style={{border: 'none', background: 'none', cursor: 'pointer', opacity: 0.5}}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// STİLLER
const layoutStyle = { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' };
const sidebarStyle = { width: '260px', backgroundColor: '#0f172a', padding: '30px 20px', color: '#fff', display: 'flex', flexDirection: 'column', position:'fixed', height:'100vh' };
const mainStyle = { flex: 1, padding: '40px', marginLeft: '260px' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' };
const cardStyle = { background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' };
const navItemStyle = { padding: '14px 18px', color: '#94a3b8', cursor: 'pointer', borderRadius: '12px', marginBottom: '8px', transition: '0.3s', fontSize:'15px' };
const activeNavItem = { ...navItemStyle, backgroundColor: '#1e293b', color: '#38bdf8', fontWeight: 'bold' };
const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', flex: 1, fontSize:'14px' };
const saveBtn = { padding: '12px 24px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '900' };
const labelStyle = { display:'block', marginBottom:'8px', fontSize:'11px', fontWeight:'700', letterSpacing:'0.5px' };
const tableRowStyle = { borderBottom: '1px solid #f1f5f9' };
const catTag = { fontSize:'10px', backgroundColor:'#f1f5f9', padding:'2px 8px', borderRadius:'6px', color:'#64748b', textTransform:'uppercase' };
const refreshBtn = { background:'#fff', border:'1px solid #e2e8f0', padding:'8px 15px', borderRadius:'8px', cursor:'pointer', fontSize:'12px' };
const filterBtn = { border:'none', background:'#f1f5f9', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color:'#64748b' };
const activeFilter = { ...filterBtn, background:'#0f172a', color:'#fff' };
const formRow = { display: 'flex', gap: '12px', flexWrap: 'wrap' };

function Login({ setToken }) {
    const [isReg, setIsReg] = useState(false);
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const handleAuth = async () => {
      const path = isReg ? "/auth/register" : "/auth/login";
      const body = isReg ? JSON.stringify({email, password: pass}) : new URLSearchParams({username: email, password: pass});
      const res = await fetch(API + path, { method: 'POST', body, headers: isReg ? {'Content-Type': 'application/json'} : {} });
      const data = await res.json();
      if(res.ok) {
        if(isReg) { alert("Dükkan açıldı! Şimdi giriş yapın."); setIsReg(false); }
        else { setToken(data.access_token); localStorage.setItem("token", data.access_token); }
      } else alert(data.detail || "Hata!");
    };
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a'}}>
        <div style={{background: '#fff', padding: '40px', borderRadius: '24px', width: '350px', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)'}}>
          <h2 style={{textAlign: 'center', marginBottom: '30px', letterSpacing:'-1px'}}>{isReg ? "Yeni Kayıt" : "Yönetici Girişi"}</h2>
          <input placeholder="E-posta" style={{...inputStyle, width:'100%', marginBottom:'10px', display:'block', boxSizing:'border-box'}} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Şifre" style={{...inputStyle, width:'100%', marginBottom:'20px', display:'block', boxSizing:'border-box'}} onChange={e => setPass(e.target.value)} />
          <button style={{...saveBtn, width:'100%'}} onClick={handleAuth}>{isReg ? "Kayıt Ol" : "Giriş Yap"}</button>
          <p style={{textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b', cursor: 'pointer'}} onClick={() => setIsReg(!isReg)}>
            {isReg ? "Giriş ekranına dön" : "Hesabınız yok mu? Yeni dükkan açın"}
          </p>
        </div>
      </div>
    );
}