import { useState, useRef, useEffect } from "react";

// ══════════════════════════════════════════════════════
// ⚠️  REMPLACE ICI ta clé Groq (gsk_...)
const GROQ_API_KEY = "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";
// ══════════════════════════════════════════════════════

const INIT = {
  nom: "Le Petit Bistrot",
  budgetMensuel: 20000,
  ca: 18750,
  caPrev: 16667,
  depenses: [
    { id: 1, label: "Viandes", fournisseur: "Maison Boucher", montant: 1250, categorie: "alimentaire", date: "2026-04-02" },
    { id: 2, label: "Produits laitiers", fournisseur: "Lactalis", montant: 980, categorie: "alimentaire", date: "2026-04-03" },
    { id: 3, label: "Boissons", fournisseur: "Boissons Services", montant: 870, categorie: "boissons", date: "2026-04-04" },
    { id: 4, label: "Loyer", fournisseur: "SCI Immo", montant: 4500, categorie: "charges", date: "2026-04-01" },
    { id: 5, label: "Électricité", fournisseur: "EDF", montant: 620, categorie: "charges", date: "2026-04-05" },
    { id: 6, label: "Légumes & fruits", fournisseur: "Primeurs Martin", montant: 540, categorie: "alimentaire", date: "2026-04-06" },
  ],
  employes: [
    { id: 1, nom: "Sophie Martin", poste: "Chef cuisinière", salaire: 2800, statut: "CDI" },
    { id: 2, nom: "Lucas Bernard", poste: "Serveur", salaire: 1850, statut: "CDI" },
    { id: 3, nom: "Emma Dubois", poste: "Serveuse", salaire: 1850, statut: "CDI" },
    { id: 4, nom: "Antoine Leroy", poste: "Plongeur", salaire: 1600, statut: "CDD" },
  ],
  semaine: [
    { jour: "Lun", ca: 8200, dep: 3100, marge: 5100 },
    { jour: "Mar", ca: 9400, dep: 3800, marge: 5600 },
    { jour: "Mer", ca: 11200, dep: 4200, marge: 7000 },
    { jour: "Jeu", ca: 13800, dep: 4900, marge: 8900 },
    { jour: "Ven", ca: 15600, dep: 5200, marge: 10400 },
    { jour: "Sam", ca: 18200, dep: 5800, marge: 12400 },
    { jour: "Dim", ca: 15100, dep: 5100, marge: 10000 },
  ],
  plats: [
    { nom: "Entrecôte frites", prix: 22, cout: 8.5, ventes: 142 },
    { nom: "Salade César", prix: 14, cout: 3.2, ventes: 98 },
    { nom: "Moules marinières", prix: 18, cout: 6.1, ventes: 87 },
    { nom: "Tarte Tatin", prix: 9, cout: 2.4, ventes: 124 },
    { nom: "Steak tartare", prix: 24, cout: 9.8, ventes: 76 },
  ],
};

const CATS = {
  alimentaire: { label: "Achats alimentaires", color: "#22C55E", bg: "#22C55E15" },
  boissons: { label: "Boissons", color: "#F59E0B", bg: "#F59E0B15" },
  charges: { label: "Charges fixes", color: "#8B5CF6", bg: "#8B5CF615" },
  salaires: { label: "Salaires", color: "#3B82F6", bg: "#3B82F615" },
  autres: { label: "Autres", color: "#6B7280", bg: "#6B728015" },
};

const euro = n => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const pct = (a, b) => b === 0 ? 0 : Math.round((a / b) * 100);

// ── Donut Chart ───────────────────────────────────────
function DonutChart({ data, total }) {
  const size = 180, cx = 90, cy = 90, r = 65, stroke = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map(d => {
    const pctVal = d.value / total;
    const slice = { ...d, pctVal, offset };
    offset += pctVal;
    return slice;
  });
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.pctVal * circ} ${circ}`} strokeDashoffset={-s.offset * circ} />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#1A1A2E" }}>{euro(total)}</div>
        <div style={{ fontSize: 11, color: "#9CA3AF" }}>Total</div>
      </div>
    </div>
  );
}

// ── Line Chart ────────────────────────────────────────
function LineChart({ data }) {
  const W = 100, H = 120, pad = 10;
  const keys = ["ca", "dep", "marge"];
  const colors = { ca: "#22C55E", dep: "#EF4444", marge: "#F59E0B" };
  const maxVal = Math.max(...data.flatMap(d => [d.ca, d.dep, d.marge]));
  const x = i => pad + (i / (data.length - 1)) * (W - pad * 2);
  const y = v => H - pad - ((v / maxVal) * (H - pad * 2));
  const path = key => data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[key])}`).join(" ");
  const area = key => `${path(key)} L${x(data.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 160, overflow: "visible" }}>
      <defs>
        {keys.map(k => (
          <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[k]} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colors[k]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {keys.map(k => <path key={`a${k}`} d={area(k)} fill={`url(#grad-${k})`} />)}
      {keys.map(k => <path key={`l${k}`} d={path(k)} fill="none" stroke={colors[k]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />)}
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={H} textAnchor="middle" fontSize="5" fill="#9CA3AF">{d.jour}</text>
      ))}
    </svg>
  );
}

// ── AI Panel ──────────────────────────────────────────
function AIPanel({ state, onClose }) {
  const [msgs, setMsgs] = useState([
    { role: "assistant", text: `Bonjour ! Je suis votre analyste financier IA pour **${state.nom}**. Posez-moi n'importe quelle question sur vos finances.` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const totalDep = state.depenses.reduce((s, d) => s + d.montant, 0);
  const totalSal = state.employes.reduce((s, e) => s + e.salaire, 0);

  const suggestions = [
    "Où puis-je économiser ?",
    "Quel est mon plat le plus rentable ?",
    "Analyse mes dépenses fournisseurs",
    "Suis-je dans mon budget ?",
  ];

  const send = async (msgText) => {
    const msg = msgText || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMsgs(m => [...m, { role: "user", text: msg }]);
    setLoading(true);

    const systemPrompt = `Tu es un analyste financier expert pour le restaurant "${state.nom}".
Données financières actuelles :
- Chiffre d'affaires : ${state.ca}€
- Budget mensuel : ${state.budgetMensuel}€
- Total dépenses : ${totalDep}€
- Masse salariale : ${totalSal}€
- Nombre d'employés : ${state.employes.length}
- Dépenses détail : ${state.depenses.map(d => `${d.label} ${d.montant}€ (${d.fournisseur})`).join(", ")}
- Plats : ${state.plats.map(p => `${p.nom} prix ${p.prix}€ coût ${p.cout}€ marge ${Math.round(((p.prix - p.cout) / p.prix) * 100)}%`).join(", ")}
Réponds toujours en français. Sois concis, professionnel et utilise des chiffres précis. Maximum 4 phrases.`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [
            { role: "system", content: systemPrompt },
            ...msgs.filter((m, i) => i > 0).map(m => ({ role: m.role, content: m.text })),
            { role: "user", content: msg },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Erreur API");
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu répondre.";
      setMsgs(m => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "assistant", text: `❌ Erreur : ${e.message}. Vérifiez votre clé Groq.` }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: 440, height: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1A1A2E" }}>✦ Assistant IA</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Analyse financière en temps réel • Groq LLaMA 3</div>
          </div>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Suggestions */}
        {msgs.length === 1 && (
          <div style={{ padding: "12px 24px 0", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => send(s)} style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 20, padding: "6px 12px", fontSize: 12, color: "#F97316", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>{s}</button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "85%",
                background: m.role === "user" ? "#F97316" : "#F9FAFB",
                color: m.role === "user" ? "#fff" : "#1A1A2E",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "12px 16px", fontSize: 13, lineHeight: 1.6,
                border: m.role === "assistant" ? "1px solid #E5E7EB" : "none",
                fontWeight: m.role === "user" ? 600 : 400,
              }}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 5, padding: "12px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "18px 18px 18px 4px", width: "fit-content" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#F97316", animation: `pulse 1.2s ease-in-out ${i * 0.3}s infinite` }} />)}
            </div>
          )}
          <div ref={ref} />
        </div>

        {/* Input */}
        <div style={{ padding: "12px 24px 24px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Votre question financière..."
            style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 12, padding: "11px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <button onClick={() => send()} disabled={loading}
            style={{ background: "#F97316", color: "#fff", border: "none", borderRadius: 12, padding: "11px 16px", cursor: "pointer", fontSize: 16, opacity: loading ? 0.5 : 1 }}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────
export default function BistroPilot() {
  const [page, setPage] = useState("dashboard");
  const [state, setState] = useState(INIT);
  const [showAI, setShowAI] = useState(false);
  const [showAddDep, setShowAddDep] = useState(false);
  const [newDep, setNewDep] = useState({ label: "", fournisseur: "", montant: "", categorie: "alimentaire" });

  const totalDep = state.depenses.reduce((s, d) => s + d.montant, 0);
  const totalSal = state.employes.reduce((s, e) => s + e.salaire, 0);
  const totalCharges = totalDep + totalSal;
  const marge = state.ca - totalCharges;
  const margePct = pct(marge, state.ca);
  const caEvol = pct(state.ca - state.caPrev, state.caPrev);

  const donutData = [
    { label: "Achats alim.", color: "#22C55E", value: state.depenses.filter(d => d.categorie === "alimentaire").reduce((s, d) => s + d.montant, 0) },
    { label: "Boissons", color: "#F59E0B", value: state.depenses.filter(d => d.categorie === "boissons").reduce((s, d) => s + d.montant, 0) },
    { label: "Charges fixes", color: "#8B5CF6", value: state.depenses.filter(d => d.categorie === "charges").reduce((s, d) => s + d.montant, 0) },
    { label: "Salaires", color: "#3B82F6", value: totalSal },
  ].filter(d => d.value > 0);

  const addDep = () => {
    if (!newDep.label || !newDep.montant) return;
    setState(s => ({ ...s, depenses: [...s.depenses, { id: Date.now(), ...newDep, montant: parseFloat(newDep.montant), date: new Date().toISOString().split("T")[0] }] }));
    setNewDep({ label: "", fournisseur: "", montant: "", categorie: "alimentaire" });
    setShowAddDep(false);
  };

  const nav = [
    { id: "dashboard", icon: "⊞", label: "Tableau de bord" },
    { id: "depenses", icon: "💸", label: "Dépenses" },
    { id: "recettes", icon: "📈", label: "Recettes" },
    { id: "equipe", icon: "👥", label: "Équipe" },
    { id: "plats", icon: "🍽️", label: "Plats & Marges" },
    { id: "budget", icon: "🎯", label: "Budget" },
    { id: "rapports", icon: "📋", label: "Rapports" },
  ];

  const Card = ({ children, style = {} }) => (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #F3F4F6", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", ...style }}>{children}</div>
  );

  const KPICard = ({ label, value, evol, icon, color }) => (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#1A1A2E", letterSpacing: "-1px" }}>{value}</div>
          <div style={{ fontSize: 12, color: evol >= 0 ? "#22C55E" : "#EF4444", marginTop: 4, fontWeight: 600 }}>
            {evol >= 0 ? "↑" : "↓"} {Math.abs(evol)}% vs semaine préc.
          </div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
      </div>
    </Card>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F8F9FC", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 240, background: "#1A1A2E", display: "flex", flexDirection: "column", padding: "24px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, padding: "0 8px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #F97316, #FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🍽️</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: "#fff" }}>Bistro<span style={{ color: "#F97316" }}>Pilot</span></div>
            <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: 0.5 }}>Gestion IA</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: page === n.id ? "#F97316" : "transparent",
              color: page === n.id ? "#fff" : "#9CA3AF",
              fontSize: 13, fontWeight: page === n.id ? 700 : 500,
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        <button onClick={() => setShowAI(true)} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
          borderRadius: 12, border: "1px solid #F97316", cursor: "pointer",
          background: "#F9731615", color: "#F97316", fontFamily: "inherit",
          fontSize: 13, fontWeight: 700, marginBottom: 16, width: "100%",
        }}>
          <span>✦</span> Assistant IA
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderTop: "1px solid #2D2D44" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #F97316, #FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍳</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{state.nom}</div>
            <div style={{ fontSize: 10, color: "#6B7280" }}>Admin</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1A1A2E", margin: 0, letterSpacing: "-0.5px" }}>
              {page === "dashboard" ? "Bonjour, Chef ! 👋" : nav.find(n => n.id === page)?.label}
            </h1>
            <p style={{ color: "#9CA3AF", margin: "4px 0 0", fontSize: 14 }}>
              {page === "dashboard" ? "Voici ce qui se passe dans votre restaurant aujourd'hui." : `Gérez vos ${nav.find(n => n.id === page)?.label?.toLowerCase()}`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "8px 16px", fontSize: 13, color: "#374151" }}>
              📅 Avril 2026
            </div>
            <button onClick={() => setShowAddDep(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#1A1A2E", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              + Nouvelle dépense
            </button>
          </div>
        </div>

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <KPICard label="Chiffre d'affaires" value={euro(state.ca)} evol={caEvol} icon="📈" color="#22C55E" />
              <KPICard label="Dépenses totales" value={euro(totalDep)} evol={8.3} icon="💼" color="#EF4444" />
              <KPICard label="Marge brute" value={euro(marge)} evol={14.8} icon="💰" color="#F59E0B" />
              <KPICard label="Marge brute %" value={`${margePct}%`} evol={1.8} icon="%" color="#8B5CF6" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1A1A2E" }}>Évolution des performances</div>
                  <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "5px 12px", fontSize: 12 }}>Cette semaine</div>
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  {[{ c: "#22C55E", l: "Chiffre d'affaires" }, { c: "#EF4444", l: "Dépenses" }, { c: "#F59E0B", l: "Marge brute" }].map((x, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280" }}>
                      <div style={{ width: 24, height: 3, borderRadius: 2, background: x.c }} />{x.l}
                    </div>
                  ))}
                </div>
                <LineChart data={state.semaine} />
              </Card>

              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1A1A2E" }}>Répartition des dépenses</div>
                  <span style={{ fontSize: 12, color: "#F97316", cursor: "pointer" }} onClick={() => setPage("depenses")}>Voir le détail →</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <DonutChart data={donutData} total={totalCharges} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    {donutData.map((d, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                          <span style={{ fontSize: 12, color: "#374151" }}>{d.label}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{euro(d.value)} ({pct(d.value, totalCharges)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1A1A2E" }}>⭐ Top dépenses</div>
                  <span style={{ fontSize: 12, color: "#F97316", cursor: "pointer" }} onClick={() => setPage("depenses")}>Voir toutes →</span>
                </div>
                {state.depenses.slice(0, 4).map((d, i) => {
                  const cat = CATS[d.categorie] || CATS.autres;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < 3 ? "1px solid #F9FAFB" : "none" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {d.categorie === "alimentaire" ? "🥩" : d.categorie === "boissons" ? "🍷" : "🏠"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{d.label}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>Fournisseur : {d.fournisseur || "—"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{euro(d.montant)}</div>
                        <div style={{ fontSize: 12, color: "#EF4444", fontWeight: 600 }}>{pct(d.montant, totalDep)}%</div>
                      </div>
                    </div>
                  );
                })}
              </Card>

              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>Budget vs Réalisé</div>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>Avril 2026</span>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>Budget mensuel</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{euro(state.budgetMensuel)}</span>
                  </div>
                  <div style={{ height: 10, background: "#F3F4F6", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 10, background: "linear-gradient(90deg, #22C55E, #86EFAC)", width: `${pct(totalCharges, state.budgetMensuel)}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>Réalisé : {euro(totalCharges)}</span>
                    <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>{pct(totalCharges, state.budgetMensuel)}%</span>
                  </div>
                </div>
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#15803D" }}>Bonne nouvelle !</div>
                    <div style={{ fontSize: 12, color: "#16A34A" }}>Vous êtes dans les limites de votre budget.</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* DÉPENSES */}
        {page === "depenses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {Object.entries(CATS).slice(0, 4).map(([k, v]) => {
                const total = k === "salaires" ? totalSal : state.depenses.filter(d => d.categorie === k).reduce((s, d) => s + d.montant, 0);
                return total > 0 ? (
                  <Card key={k} style={{ borderLeft: `4px solid ${v.color}` }}>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>{v.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#1A1A2E" }}>{euro(total)}</div>
                  </Card>
                ) : null;
              })}
            </div>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
                    {["Dépense", "Fournisseur", "Catégorie", "Date", "Montant", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.depenses.map((d) => {
                    const cat = CATS[d.categorie] || CATS.autres;
                    return (
                      <tr key={d.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                        <td style={{ padding: "12px", fontWeight: 700, fontSize: 14 }}>{d.label}</td>
                        <td style={{ padding: "12px", fontSize: 13, color: "#6B7280" }}>{d.fournisseur || "—"}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ background: cat.bg, color: cat.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{cat.label}</span>
                        </td>
                        <td style={{ padding: "12px", fontSize: 13, color: "#6B7280" }}>{d.date}</td>
                        <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#EF4444" }}>-{euro(d.montant)}</td>
                        <td style={{ padding: "12px" }}>
                          <button onClick={() => setState(s => ({ ...s, depenses: s.depenses.filter(x => x.id !== d.id) }))}
                            style={{ background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ÉQUIPE */}
        {page === "equipe" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
            {state.employes.map(emp => (
              <Card key={emp.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #F97316, #FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff" }}>
                    {emp.nom.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{emp.nom}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{emp.poste}</div>
                  </div>
                  <span style={{ marginLeft: "auto", background: emp.statut === "CDI" ? "#F0FDF4" : "#FFFBEB", color: emp.statut === "CDI" ? "#16A34A" : "#D97706", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{emp.statut}</span>
                </div>
                <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>Salaire mensuel</span>
                  <span style={{ fontSize: 20, fontWeight: 900 }}>{euro(emp.salaire)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* PLATS */}
        {page === "plats" && (
          <Card>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
                  {["Plat", "Prix vente", "Coût", "Marge %", "Ventes", "Bénéfice total"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.plats.sort((a, b) => ((b.prix - b.cout) / b.prix) - ((a.prix - a.cout) / a.prix)).map((p, i) => {
                  const m = ((p.prix - p.cout) / p.prix) * 100;
                  const color = m > 60 ? "#22C55E" : m > 40 ? "#F59E0B" : "#EF4444";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                      <td style={{ padding: "14px 12px", fontWeight: 700, fontSize: 14 }}>🍽️ {p.nom}</td>
                      <td style={{ padding: "14px 12px", fontSize: 13 }}>{p.prix}€</td>
                      <td style={{ padding: "14px 12px", fontSize: 13, color: "#6B7280" }}>{p.cout}€</td>
                      <td style={{ padding: "14px 12px" }}>
                        <span style={{ background: color + "15", color, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{Math.round(m)}%</span>
                      </td>
                      <td style={{ padding: "14px 12px", fontSize: 13 }}>{p.ventes}</td>
                      <td style={{ padding: "14px 12px", fontWeight: 800, fontSize: 15, color: "#22C55E" }}>{euro((p.prix - p.cout) * p.ventes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}

        {/* BUDGET */}
        {page === "budget" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Objectif mensuel</div>
              <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-1px", marginBottom: 4 }}>{euro(state.budgetMensuel)}</div>
              <div style={{ height: 12, background: "#F3F4F6", borderRadius: 12, overflow: "hidden", margin: "16px 0 8px" }}>
                <div style={{ height: "100%", borderRadius: 12, background: "linear-gradient(90deg, #22C55E, #86EFAC)", width: `${pct(totalCharges, state.budgetMensuel)}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#6B7280" }}>Dépensé : {euro(totalCharges)}</span>
                <span style={{ fontWeight: 700, color: "#22C55E" }}>{pct(totalCharges, state.budgetMensuel)}% utilisé</span>
              </div>
            </Card>
            <Card>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Reste à dépenser</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: state.budgetMensuel - totalCharges >= 0 ? "#22C55E" : "#EF4444", letterSpacing: "-1px" }}>
                {euro(state.budgetMensuel - totalCharges)}
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 12 }}>
                {state.budgetMensuel - totalCharges >= 0 ? "✅ Dans les limites du budget" : "⚠️ Budget dépassé !"}
              </div>
            </Card>
          </div>
        )}

        {/* RECETTES */}
        {page === "recettes" && (
          <Card>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20 }}>Évolution du chiffre d'affaires</div>
            <LineChart data={state.semaine} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: 16 }}>
              {state.semaine.map((d, i) => (
                <div key={i} style={{ textAlign: "center", background: "#F9FAFB", borderRadius: 10, padding: "10px 0" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{d.jour}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#22C55E" }}>{euro(d.ca)}</div>
                  <div style={{ fontSize: 11, color: "#EF4444" }}>-{euro(d.dep)}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* RAPPORTS */}
        {page === "rapports" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {[
              { title: "Rapport mensuel", desc: "Synthèse complète d'avril 2026", icon: "📊" },
              { title: "Rapport fiscal", desc: "Données pour la comptabilité", icon: "📋" },
              { title: "Rapport RH", desc: "Masse salariale et contrats", icon: "👥" },
              { title: "Rapport fournisseurs", desc: "Analyse des achats", icon: "🏪" },
            ].map((r, i) => (
              <Card key={i} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{r.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{r.title}</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF" }}>{r.desc}</div>
                  </div>
                  <div style={{ marginLeft: "auto", color: "#F97316", fontSize: 20 }}>→</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal dépense */}
      {showAddDep && (
        <div onClick={() => setShowAddDep(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 32, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 24 }}>Nouvelle dépense</div>
            {[{ ph: "Nom de la dépense", key: "label" }, { ph: "Fournisseur", key: "fournisseur" }, { ph: "Montant (€)", key: "montant", type: "number" }].map(f => (
              <input key={f.key} type={f.type || "text"} placeholder={f.ph} value={newDep[f.key]}
                onChange={e => setNewDep(s => ({ ...s, [f.key]: e.target.value }))}
                style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 12 }} />
            ))}
            <select value={newDep.categorie} onChange={e => setNewDep(s => ({ ...s, categorie: e.target.value }))}
              style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 20, background: "#fff" }}>
              {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddDep(false)} style={{ flex: 1, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
              <button onClick={addDep} style={{ flex: 2, background: "#1A1A2E", color: "#fff", border: "none", borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {showAI && <AIPanel state={state} onClose={() => setShowAI(false)} />}
    </div>
  );
}
