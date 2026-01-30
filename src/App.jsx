import { useEffect, useMemo, useState } from "react";

const API = "https://esnaf-takip-backend.onrender.com";
const KATEGORILER = ["Ciro/Satış", "Mutfak/Gıda", "Elektrik", "Su/Doğalgaz", "Kira", "Maaş", "Mal Alımı", "Diğer"];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({ title: "", amount: "", type: "income", category: "Ciro/Satış" });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/transactions`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) setItems(await res.json());
    } catch (err) { console.error("Yükleme Hatası:", err); }
  };

  useEffect(() => { loadData(); }, [token]);

  const stats = useMemo(() => {
    const income = items.filter(x => x.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
    const expense = items.filter(x => x.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
    const catData = KATEGORILER.map(cat => ({
      name: cat,
      total: items.filter(x => x.category === cat).reduce((a, b) => a + Number(b.amount), 0)
    })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);
    return { income, expense, balance: income - expense, catData };
  }, [items]);

  const filteredItems = items.filter(item => {
    if (filterType === "all") return true;
    return item.type === filterType;
  }).slice().reverse();

  const handleAdd = async () => {
    if(!form.title || !form.amount) { alert("Lütfen tüm alanları doldurun!"); return; }
    try {
      const res = await fetch(`${API}/transactions`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}, 
        body: JSON.stringify({...form, amount: Number(form.amount)}) 
      });
      if(res.ok) {
        setForm({title: "", amount: "", type: "income", category: "Ciro/Satış"});
        loadData();
      }
    } catch (err) { alert("Ekleme hatası oluştu!"); }
  };

  if (!token) return <Login setToken={setToken} isMobile={isMobile} />;

  return (
    <div style={{...layoutStyle, flexDirection: isMobile ? 'column' : 'row'}}>
      {/* Sidebar / Menü */}
      <div style={{...sidebarStyle, width: isMobile ? '100%' : '260px', flexDirection: isMobile ? 'row' : 'column', position: isMobile ? 'sticky' : 'fixed'}}>
        {!isMobile && <div style={logoStyle}>ESNAF<span style={{color:'#27ae60'}}>KASA</span></div>}
        <div style={activeTab === "dashboard" ? activeNavItem : navItemStyle} onClick={() => setActiveTab("dashboard")}>📊 Panel</div>
        <div style={activeTab === "muhasebe" ? activeNavItem : navItemStyle} onClick={() => setActiveTab("muhasebe")}>💰 Kasa</div>
        <div style={logoutStyle} onClick={() => {localStorage.clear(); window.location.reload();}}>{isMobile ? "Çıkış" : "Oturumu Kapat 🚪"}</div>
      </div>

      {/* Ana İçerik */}
      <div style={{...mainStyle, marginLeft: isMobile ? '0' : '260px'}}>
        {activeTab === "dashboard" ? (
          <div>
            <h2 style={titleStyle}>Genel Durum 👋</h2>
            <div style={statsGrid}>
              <div style={{...cardStyle, borderTop: '4px solid #10b981'}}>
                <div style={labelStyle}>GELİR</div>
                <div style={{fontSize: '24px', fontWeight: '800', color: '#10b981'}}>{stats.income.toLocaleString()} ₺</div>
              </div>
              <div style={{...cardStyle, borderTop: '4px solid #ef4444'}}>
                <div style={labelStyle}>GİDER</div>
                <div style={{fontSize: '24px', fontWeight: '800', color: '#ef4444'}}>{stats.expense.toLocaleString()} ₺</div>
              </div>
              <div style={{...cardStyle, borderTop: '4px solid #3b82f6'}}>
                <div style={labelStyle}>NET KASA</div>
                <div style={{fontSize: '24px', fontWeight: '800', color: '#3b82f6'}}>{stats.balance.toLocaleString()} ₺</div>
              </div>
            </div>

            <div style={{...cardStyle, marginTop: '20px'}}>
              <h4 style={{marginTop: 0}}>Harcama Kalemleri</h4>
              {stats.catData.length === 0 ? <p style={{color:'#94a3b8', fontSize:'13px'}}>Henüz veri yok.</p> : 
                stats.catData.map(cat => (
                  <div key={cat.name} style={{marginBottom: '15px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'5px'}}>
                      <span>{cat.name}</span>
                      <span style={{fontWeight:'bold'}}>{cat.total.toLocaleString()} ₺</span>
                    </div>
                    <div style={progressBase}><div style={{...progressFill, width: `${(cat.total / (stats.expense || 1)) * 100}%`}}></div></div>
                  </div>
                ))
              }
            </div>
          </div>
        ) : (
          <div>
            <h2 style={titleStyle}>Kasa Defteri</h2>
            {/* İşlem Ekleme Formu */}
            <div style={cardStyle}>
              <h4 style={{marginTop:0, marginBottom:'15px', fontSize:'14px'}}>Yeni İşlem Ekle</h4>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <input placeholder="İşlem adı (Örn: Kira)" style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <div style={{display:'flex', gap:'10px'}}>
                  <input type="number" placeholder="Tutar" style={{...inputStyle, flex:2}} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                  <select style={{...inputStyle, flex:1}} value={form.type} onChange={e => setForm({...form, type: e.target.value, category: e.target.value === 'income' ? 'Ciro/Satış' : 'Mutfak/Gıda'})}>
                    <option value="income">GELİR (+)</option>
                    <option value="expense">GİDER (-)</option>
                  </select>
                </div>
                <select style={inputStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {KATEGORILER.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <button style={saveBtn} onClick={handleAdd}>KAYDET VE EKLE</button>
              </div>
            </div>

            {/* Filtreleme ve Liste */}
            <div style={{...cardStyle, padding: 0}}>
              <div style={filterBar}>
                <button style={filterType === "all" ? activeFilter : filterBtn} onClick={() => setFilterType("all")}>Hepsi</button>
                <button style={filterType === "income" ? activeFilter : filterBtn} onClick={() => setFilterType("income")}>Gelirler</button>
                <button style={filterType === "expense" ? activeFilter : filterBtn} onClick={() => setFilterType("expense")}>Giderler</button>
              </div>
              <div style={{overflowX: 'auto'}}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderRow}>
                      <th style={{padding:'15px'}}>AÇIKLAMA / TARİH</th>
                      <th style={{textAlign: 'right', paddingRight:'20px'}}>TUTAR</th>
                      <th style={{textAlign: 'center'}}>İŞLEM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} style={tableRow}>
                        <td style={{padding: '12px 15px'}}>
                          <div style={{fontWeight: '700', fontSize:'14px'}}>{item.title}</div>
                          <div style={{fontSize:'11px', color:'#94a3b8'}}>{item.category} • {new Date(item.created_at || Date.now()).toLocaleDateString('tr-TR')}</div>
                        </td>
                        <td style={{textAlign: 'right', fontWeight: '800', color: item.type === 'income' ? '#10b981' : '#ef4444', paddingRight:'20px'}}>
                          {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} ₺
                        </td>
                        <td style={{textAlign: 'center'}}>
                          <button onClick={async () => { if(confirm("Silinsin mi?")) { await fetch(`${API}/transactions/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); loadData(); } }} 
                          style={deleteBtn}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// STİLLER (Responsive & Temiz)
const layoutStyle = { display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' };
const sidebarStyle = { backgroundColor: '#1e293b', padding: '15px', color: '#fff', zIndex: 1000, top: 0, boxSizing:'border-box' };
const logoStyle = { fontSize: '20px', fontWeight: '900', marginBottom: '30px', textAlign:'center' };
const mainStyle = { flex: 1, padding: '15px' };
const titleStyle = { margin: '0 0 20px 0', fontSize: '22px', fontWeight:'800', color:'#1e293b' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' };
const cardStyle = { background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '15px' };
const navItemStyle = { padding: '10px', color: '#94a3b8', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', flex: 1, textAlign:'center' };
const activeNavItem = { ...navItemStyle, backgroundColor: '#334155', color: '#38bdf8', fontWeight: '700' };
const logoutStyle = { ...navItemStyle, color: '#f87171' };
const labelStyle = { fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '5px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline:'none', boxSizing:'border-box' };
const saveBtn = { padding: '14px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize:'14px' };
const filterBar = { display: 'flex', gap: '5px', padding: '10px', backgroundColor:'#f8fafc', borderBottom:'1px solid #eee' };
const filterBtn = { flex:1, border:'none', background:'none', padding:'8px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color:'#64748b' };
const activeFilter = { ...filterBtn, background:'#fff', color:'#3b82f6', boxShadow:'0 1px 2px rgba(0,0,0,0.1)', fontWeight:'700' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', minWidth:'350px' };
const tableHeaderRow = { textAlign:'left', fontSize:'11px', color:'#94a3b8', borderBottom:'1px solid #f1f5f9' };
const tableRow = { borderBottom: '1px solid #f1f5f9' };
const deleteBtn = { border: 'none', background: 'none', cursor: 'pointer', fontSize:'16px', padding:'10px' };
const progressBase = { width:'100%', height:'6px', backgroundColor:'#e2e8f0', borderRadius:'10px' };
const progressFill = { height:'100%', backgroundColor:'#3b82f6', borderRadius:'10px' };

function Login({ setToken, isMobile }) {
    const [isReg, setIsReg] = useState(false);
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const handleAuth = async () => {
      const path = isReg ? "/auth/register" : "/auth/login";
      const body = isReg ? JSON.stringify({email, password: pass}) : new URLSearchParams({username: email, password: pass});
      const res = await fetch(API + path, { method: 'POST', body, headers: isReg ? {'Content-Type': 'application/json'} : {} });
      const data = await res.json();
      if(res.ok) {
        if(isReg) { alert("Hesap açıldı! Giriş yapabilirsiniz."); setIsReg(false); }
        else { setToken(data.access_token); localStorage.setItem("token", data.access_token); }
      } else alert(data.detail || "Hata!");
    };
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: '20px'}}>
        <div style={{background: '#fff', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '340px', boxSizing:'border-box'}}>
          <h2 style={{textAlign: 'center', marginBottom: '25px'}}>{isReg ? "Yeni Hesap" : "Dükkan Girişi"}</h2>
          <input placeholder="E-posta" style={{...inputStyle, width:'100%', marginBottom:'10px'}} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Şifre" style={{...inputStyle, width:'100%', marginBottom:'20px'}} onChange={e => setPass(e.target.value)} />
          <button style={{...saveBtn, width:'100%'}} onClick={handleAuth}>{isReg ? "Kayıt Ol" : "Giriş Yap"}</button>
          <p style={{textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b', cursor: 'pointer'}} onClick={() => setIsReg(!isReg)}>
            {isReg ? "Giriş yap" : "Yeni dükkan aç"}
          </p>
        </div>
      </div>
    );
}
