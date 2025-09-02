// Replace your src/App.jsx with this component
// Assumes your backend exposes:
//   GET  /api/products/                -> [{ id, name, sku, stock }]
//   GET  /api/stores/                  -> [{ id, name, client_id }]
//   POST /api/stores/                  -> { id, name, client_id }
//   GET  /api/stores/:id/products/     -> store products + mapping
//   POST /api/stores/:id/sync-products/
//   POST /api/stores/:id/sync-warehouses/
//   POST /api/stores/:id/export-stocks/
// Optional: set VITE_API_BASE_URL in .env to override API host

import { useEffect, useMemo, useState } from "react";

const styles = `
:root {
  --bg: #0b0f14;
  --panel: #111821;
  --panel-2: #0e141b;
  --accent: #ffd54a;
  --accent-2: #ffc107;
  --muted: #8aa0b2;
  --text: #e7eef5;
  --ok: #2ecc71;
  --danger: #ff616d;
  --border: #1e2a37;
  --shadow: 0 10px 30px rgba(0,0,0,.35);
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Inter, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"; }

.app { min-height: 100%; display: grid; grid-template-rows: auto 1fr; background: var(--bg); }
/* Header: всегда на всю ширину и поверх контента */
.header { position: sticky; top: 0; z-index: 50; width: 100vw; backdrop-filter: saturate(1.2) blur(6px); background: linear-gradient(180deg, rgba(17,24,33,.95), rgba(17,24,33,.8)); border-bottom: 1px solid var(--border); }
.header-inner { width: 100%; display: flex; align-items: center; gap: 20px; padding: 14px 24px; }
.brand { display: flex; align-items: center; gap: 12px; font-weight: 700; letter-spacing: .3px; }
.brand .logo { width: 36px; height: 36px; border-radius: 10px; background: radial-gradient(120% 120% at 10% 10%, var(--accent), var(--accent-2)); box-shadow: inset 0 0 0 2px rgba(0,0,0,.2), var(--shadow); }
.brand .title { font-size: 18px; }

.nav { margin-left: auto; display: flex; gap: 6px; background: var(--panel-2); padding: 6px; border-radius: 12px; border: 1px solid var(--border); }
.tab { appearance: none; border: 0; padding: 10px 14px; border-radius: 10px; background: transparent; color: var(--text); cursor: pointer; font-weight: 600; letter-spacing: .2px; transition: background .2s, color .2s, transform .04s ease; }
.tab:hover { background: rgba(255,255,255,.04); }
.tab.active { background: var(--accent); color: #222; }

/* Контент всегда на тёмном фоне */
.container { width: 100%; margin: 22px auto; padding: 0 24px 40px; background: var(--bg); }
.panel { background: linear-gradient(180deg, var(--panel), var(--panel-2)); border: 1px solid var(--border); border-radius: 16px; box-shadow: var(--shadow); overflow: hidden; }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px; border-bottom: 1px solid var(--border); }
.panel-title { font-size: 18px; font-weight: 700; letter-spacing: .3px; }
.panel-actions { display: flex; gap: 10px; align-items: center; }
.btn { appearance: none; border: 1px solid var(--border); background: #121a24; color: #fff; border-radius: 10px; padding: 10px 12px; cursor: pointer; font-weight: 600; }
.btn:hover { filter: brightness(1.08); }
.btn.accent { background: var(--accent); color: #222; border-color: #0000; }
.btn.ghost { background: transparent; }

/* Layout внутри панели товаров: фиксируем высоту и делаем внутренний скролл */
.panel.is-products { max-height: 78vh; display: grid; grid-template-rows: auto 1fr; }
.layout { display: grid; grid-template-columns: 280px 1fr; min-height: 0; }
.sidebar { border-right: 1px solid var(--border); padding: 16px; background: linear-gradient(180deg, #0d141c, #0a1016); }
.sidebar h4 { margin: 0 0 10px; color: var(--muted); text-transform: uppercase; font-size: 12px; letter-spacing: .8px; }
.field { display: grid; gap: 8px; margin-bottom: 14px; }
.label { font-size: 12px; color: var(--muted); letter-spacing: .3px; }
.input { width: 100%; padding: 10px 12px; border: 1px solid var(--border); background: #0c1219; color: #e7eef5; border-radius: 10px; outline: none; box-shadow: inset 0 2px 6px rgba(0,0,0,.25); }
.input::placeholder { color: #6d8296; }
.meta { font-size: 12px; color: var(--muted); }

.content { padding: 0; overflow: hidden; min-height: 0; display: flex; flex-direction: column; }
.table-wrap { flex: 1 1 auto; min-height: 0; overflow: auto; }
.table { width: 100%; border-collapse: separate; border-spacing: 0; }
.table thead th { position: sticky; top: 0; background: #0f1620; color: #b7c7d8; text-align: left; font-size: 12px; letter-spacing: .6px; text-transform: uppercase; padding: 12px; border-bottom: 1px solid var(--border); }
.table tbody td { padding: 12px; border-bottom: 1px solid var(--border); }
.table tbody tr:hover { background: rgba(255,255,255,.03); }
.th-sort { cursor: pointer; user-select: none; }
.badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 999px; font-weight: 700; font-size: 12px; color: #0b2d12; background: linear-gradient(180deg, #b7f3c6, #8ceaa6); border: 1px solid rgba(0,0,0,.05); }
.badge.err { color: #3a0b0b; background: linear-gradient(180deg, #ffd0d5, #ffb1b9); }

.table-skeleton td { height: 44px; position: relative; overflow: hidden; }
.shimmer { position: absolute; inset: 8px; border-radius: 10px; background: linear-gradient(90deg, #0e151e 0%, #172130 50%, #0e151e 100%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { 0% { background-position: 0% 0; } 100% { background-position: 200% 0; } }

.footer { flex: 0 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #0f1620; border-top: 1px solid var(--border); }
.pager { display: flex; gap: 8px; align-items: center; }
.pager .btn { padding: 8px 10px; }
.count { font-size: 12px; color: var(--muted); }
.empty { padding: 40px; text-align: center; color: var(--muted); }
.card { padding: 18px; }
.card h3 { margin: 0 0 8px; }
.card p { margin: 0; color: var(--muted); }

/* OZON panel */
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; padding: 16px; }
.section-card { background: #0f1620; border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
.section-card h4 { margin: 0 0 8px; }
.row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.small { font-size: 12px; color: var(--muted); }
pre.result { max-height: 220px; overflow: auto; background: #0c1219; border: 1px solid var(--border); border-radius: 10px; padding: 10px; }

/* Store products list */
.sp-controls { display: flex; gap: 10px; align-items: center; margin: 10px 0; flex-wrap: wrap; }
.sp-wrap { max-height: 50vh; overflow: auto; border: 1px solid var(--border); border-radius: 12px; }
.sp-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.sp-table thead th { position: sticky; top: 0; background: #0f1620; color: #b7c7d8; padding: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid var(--border); }
.sp-table tbody td { padding: 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
.status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 999px; font-weight: 700; font-size: 12px; }
.status.linked { background: #16331f; color: #9be1af; border: 1px solid #274e31; }
.status.unlinked { background: #341616; color: #ff9aa2; border: 1px solid #5a2222; }
`;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const PRODUCTS_URL = `${API_BASE}/api/products/`;
const STORES_URL = `${API_BASE}/api/stores/`;

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function Header({ tab, setTab, refresh }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="logo" />
          <div className="title">AVTORUS</div>
        </div>
        <div className="nav">
          <button className={`tab ${tab === "products" ? "active" : ""}`} onClick={() => setTab("products")}>Товары</button>
          <button className={`tab ${tab === "ozon" ? "active" : ""}`} onClick={() => setTab("ozon")}>OZON</button>
        </div>
        <div className="panel-actions" style={{ marginLeft: 12 }}>
          <button className="btn" onClick={refresh}>Обновить</button>
        </div>
      </div>
    </header>
  );
}

function ProductsPanel({ products, loading, error, onReload }) {
  const [skuQuery, setSkuQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const debouncedQuery = useDebouncedValue(skuQuery, 250);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let list = Array.isArray(products) ? products : [];
    if (q) list = list.filter((p) => String(p.sku || "").toLowerCase().includes(q));
    list = [...list].sort((a, b) => {
      const va = a?.[sortKey];
      const vb = b?.[sortKey];
      let res = 0;
      if (typeof va === "number" && typeof vb === "number") res = va - vb;
      else res = String(va ?? "").localeCompare(String(vb ?? ""), "ru", { sensitivity: "base" });
      return sortDir === "asc" ? res : -res;
    });
    return list;
  }, [products, debouncedQuery, sortKey, sortDir]);

  useEffect(() => { setPage(1); }, [debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const current = filtered.slice(start, start + pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div className="panel is-products">
      <div className="panel-header">
        <div className="panel-title">Товары</div>
        <div className="panel-actions">
          <button className="btn" onClick={onReload}>Перезагрузить</button>
        </div>
      </div>
      <div className="layout">
        <aside className="sidebar">
          <h4>Фильтр</h4>
          <div className="field">
            <label className="label">Поиск по артикулу (SKU)</label>
            <input className="input" placeholder="Например: AVTORUS|123-456" value={skuQuery} onChange={(e) => setSkuQuery(e.target.value)} />
            <div className="meta">Найдено: {filtered.length}</div>
          </div>
        </aside>
        <section className="content">
          <div className="table-wrap">
            <table className="table" role="table" aria-label="Таблица товаров">
              <thead>
                <tr>
                  <th className="th-sort" onClick={() => toggleSort("name")}>
                    Наименование {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="th-sort" onClick={() => toggleSort("sku")}>
                    Артикул {sortKey === "sku" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="th-sort" onClick={() => toggleSort("stock")}>
                    Остаток {sortKey === "stock" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  [...Array(10)].map((_, i) => (
                    <tr className="table-skeleton" key={i}>
                      <td><div className="shimmer" /></td>
                      <td><div className="shimmer" /></td>
                      <td><div className="shimmer" /></td>
                    </tr>
                  ))
                )}
                {!loading && error && (
                  <tr><td colSpan={3}><span className="badge err">Ошибка</span> {String(error)}</td></tr>
                )}
                {!loading && !error && current.length === 0 && (
                  <tr><td colSpan={3} className="empty">Нет данных</td></tr>
                )}
                {!loading && !error && current.map((p) => (
                  <tr key={p.id ?? p.sku}>
                    <td>{p.name}</td>
                    <td><code>{p.sku}</code></td>
                    <td>
                      {typeof p.stock === "number" ? (
                        <span className="badge" title="Доступный остаток">{p.stock}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="footer">
            <div className="count">Всего: {filtered.length}</div>
            <div className="pager">
              <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</button>
              <div className="meta">Стр. {page} / {totalPages}</div>
              <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Вперёд</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function OzonPanel() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", client_id: "", api_key: "" });
  const [creating, setCreating] = useState(false);

  const [actionState, setActionState] = useState({}); // { [action]: { loading, error, result } }

  // store products
  const [sp, setSp] = useState({ loading: false, error: null, items: [] });
  const [spQuery, setSpQuery] = useState("");
  const [spOnly, setSpOnly] = useState("all"); // all | linked | unlinked

  const fetchStores = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(STORES_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setStores(Array.isArray(json) ? json : []);
      if (Array.isArray(json) && json.length && !activeId) setActiveId(json[0].id);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProducts = async (storeId) => {
    if (!storeId) return;
    setSp((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`${STORES_URL}${storeId}/products/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSp({ loading: false, error: null, items: Array.isArray(json) ? json : [] });
    } catch (e) {
      setSp({ loading: false, error: e.message || String(e), items: [] });
    }
  };

  useEffect(() => { fetchStores(); }, []);
  useEffect(() => { if (activeId) fetchStoreProducts(activeId); }, [activeId]);

  const createStore = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim() || !form.client_id.trim() || !form.api_key.trim()) {
      alert("Заполните все поля: Название, Client ID и API Key");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(STORES_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setStores((s) => [data, ...s]);
      setActiveId(data.id);
      setShowCreate(false);
      setForm({ name: "", client_id: "", api_key: "" });
    } catch (e) {
      alert(`Не удалось создать магазин: ${e.message || e}`);
    } finally {
      setCreating(false);
    }
  };

  const callAction = async (action) => {
    if (!activeId) return;
    setActionState((s) => ({ ...s, [action]: { loading: true, error: null, result: null } }));
    try {
      const url = `${STORES_URL}${activeId}/${action}/`;
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setActionState((s) => ({ ...s, [action]: { loading: false, error: null, result: data } }));
      if (action === "sync_products") fetchStoreProducts(activeId); // обновить список после синка
      if (action === "sync_products") fetchStoreProducts(activeId);
    } catch (e) {
      setActionState((s) => ({ ...s, [action]: { loading: false, error: e.message || String(e), result: null } }));
    }
  };

  const spFiltered = useMemo(() => {
    const q = spQuery.trim().toLowerCase();
    let arr = Array.isArray(sp.items) ? sp.items : [];
    if (spOnly !== "all") {
      const wantLinked = spOnly === "linked";
      arr = arr.filter((it) => Boolean(it.product) === wantLinked);
    }
    if (q) {
      arr = arr.filter((it) => {
        const a = [it.name, it.sku_mp, it.external_id, it?.product?.name, it?.product?.sku];
        return a.some((x) => String(x || "").toLowerCase().includes(q));
      });
    }
    return arr;
  }, [sp.items, spQuery, spOnly]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">OZON</div>
        <div className="panel-actions">
          <button className="btn" onClick={fetchStores}>Обновить магазины</button>
          {!stores.length && (
            <button className="btn accent" onClick={() => setShowCreate(true)}>Создать магазин</button>
          )}
        </div>
      </div>

      {loading && (
        <div className="card small">Загрузка магазинов…</div>
      )}

      {!loading && error && (
        <div className="card"><span className="badge err">Ошибка</span> {String(error)}</div>
      )}

      {!loading && !error && stores.length === 0 && (
        <div className="card">
          <h3>Нет подключённых магазинов</h3>
          <p className="small">Создайте магазин OZON, указав <b>Name</b>, <b>Client ID</b> и <b>API Key</b>.</p>
          <form onSubmit={createStore} style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 520 }}>
            <div className="field">
              <label className="label">Название</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Например: Ozon Main" />
            </div>
            <div className="field">
              <label className="label">Client ID</label>
              <input className="input" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} placeholder="OZON Client ID" />
            </div>
            <div className="field">
              <label className="label">API Key</label>
              <input className="input" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="OZON API Key" />
            </div>
            <div className="row">
              <button className="btn accent" type="submit" disabled={creating}>{creating ? "Создание…" : "Создать магазин"}</button>
            </div>
          </form>
        </div>
      )}

      {!loading && !error && stores.length > 0 && (
        <div>
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div className="row">
              <div className="label" style={{ marginRight: 8 }}>Аккаунт:</div>
              <select className="input" style={{ width: 260 }} value={activeId ?? ""} onChange={(e) => setActiveId(Number(e.target.value))}>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} (ID {s.id})</option>
                ))}
              </select>
            </div>
            <div className="row">
              <button className="btn" onClick={() => setShowCreate((v) => !v)}>{showCreate ? "Скрыть форму" : "Добавить магазин"}</button>
            </div>
          </div>

          {showCreate && (
            <div className="card" style={{ marginTop: -8 }}>
              <h3>Добавить магазин</h3>
              <form onSubmit={createStore} style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 520 }}>
                <div className="field">
                  <label className="label">Название</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Например: Ozon Warehouse" />
                </div>
                <div className="field">
                  <label className="label">Client ID</label>
                  <input className="input" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} placeholder="OZON Client ID" />
                </div>
                <div className="field">
                  <label className="label">API Key</label>
                  <input className="input" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="OZON API Key" />
                </div>
                <div className="row">
                  <button className="btn" type="button" onClick={() => setShowCreate(false)}>Отмена</button>
                  <button className="btn accent" type="submit" disabled={creating}>{creating ? "Создание…" : "Создать"}</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid">
            <div className="section-card">
              <h4>Синхронизация товаров</h4>
              <p className="small">Импорт карточек из OZON (создание/обновление привязок к товарам системы).</p>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn accent" disabled={!activeId || actionState["sync_products"]?.loading} onClick={() => callAction("sync_products")}>{actionState["sync_products"]?.loading ? "Выполняется…" : "Синхронизировать товары"}</button>
                <button className="btn" onClick={() => fetchStoreProducts(activeId)} disabled={!activeId || sp.loading}>Обновить список</button>
              </div>
              {actionState["sync_products"]?.error && <p className="small" style={{ color: "#ff9aa2" }}>Ошибка: {actionState["sync_products"].error}</p>}
              {actionState["sync_products"]?.result && <details style={{ marginTop: 8 }}><summary className="small">Результат</summary><pre className="result">{JSON.stringify(actionState["sync_products"].result, null, 2)}</pre></details>}

              <div className="sp-controls">
                <input className="input" placeholder="Поиск: имя, SKU OZON, external_id, товар системы" value={spQuery} onChange={(e) => setSpQuery(e.target.value)} style={{ maxWidth: 360 }} />
                <select className="input" style={{ width: 200 }} value={spOnly} onChange={(e) => setSpOnly(e.target.value)}>
                  <option value="all">Показывать: все</option>
                  <option value="linked">Только связанные</option>
                  <option value="unlinked">Только несвязанные</option>
                </select>
                <span className="small">Всего: {sp.items.length}, показано: {spFiltered.length}</span>
              </div>

              <div className="sp-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>OZON SKU</th>
                      <th>Название (OZON)</th>
                      <th>External ID</th>
                      <th>Товар системы (если связан)</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sp.loading && (
                      [...Array(8)].map((_, i) => (
                        <tr key={i}><td colSpan={5}><div className="shimmer" style={{ height: 32, borderRadius: 8 }} /></td></tr>
                      ))
                    )}
                    {!sp.loading && sp.error && (
                      <tr><td colSpan={5}><span className="badge err">Ошибка</span> {String(sp.error)}</td></tr>
                    )}
                    {!sp.loading && !sp.error && spFiltered.length === 0 && (
                      <tr><td colSpan={5} className="small">Пусто</td></tr>
                    )}
                    {!sp.loading && !sp.error && spFiltered.map((it) => {
                      const linked = Boolean(it.product);
                      return (
                        <tr key={it.id}>
                          <td><code>{it.sku_mp || "—"}</code></td>
                          <td>{it.name || "—"}</td>
                          <td><code>{it.external_id || "—"}</code></td>
                          <td>
                            {linked ? (
                              <div>
                                <div>{it.product.name}</div>
                                <div className="small"><code>{it.product.sku}</code> · остаток: {typeof it.product.stock === 'number' ? it.product.stock : '—'}</div>
                              </div>
                            ) : (
                              <span className="small" style={{ color: '#9aa8b4' }}>— не связан —</span>
                            )}
                          </td>
                          <td>
                            <span className={`status ${linked ? 'linked' : 'unlinked'}`}>{linked ? 'Связан' : 'Нет связи'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="section-card">
              <h4>Синхронизация складов</h4>
              <p className="small">Загрузка складов аккаунта OZON (FBS/FBO).</p>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn accent" disabled={!activeId || actionState["sync_warehouses"]?.loading} onClick={() => callAction("sync_warehouses")}>{actionState["sync_warehouses"]?.loading ? "Выполняется…" : "Синхронизировать склады"}</button>
              </div>
              {actionState["sync_warehouses"]?.error && <p className="small" style={{ color: "#ff9aa2" }}>Ошибка: {actionState["sync_warehouses"].error}</p>}
              {actionState["sync_warehouses"]?.result && <details style={{ marginTop: 8 }}><summary className="small">Результат</summary><pre className="result">{JSON.stringify(actionState["sync_warehouses"].result, null, 2)}</pre></details>}
            </div>

            <div className="section-card">
              <h4>Выгрузка остатков</h4>
              <p className="small">Отправить рассчитанные остатки на OZON.</p>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn accent" disabled={!activeId || actionState["sync_stocks"]?.loading} onClick={() => callAction("sync_stocks")}>{actionState["sync_stocks"]?.loading ? "Выполняется…" : "Выгрузить остатки"}</button>
              </div>
              {actionState["sync_stocks"]?.error && <p className="small" style={{ color: "#ff9aa2" }}>Ошибка: {actionState["sync_stocks"].error}</p>}
              {actionState["sync_stocks"]?.result && <details style={{ marginTop: 8 }}><summary className="small">Результат</summary><pre className="result">{JSON.stringify(actionState["sync_stocks"].result, null, 2)}</pre></details>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("products");
  const [{ data, loading, error }, setState] = useState({ data: [], loading: true, error: null });

  const load = async (signal) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(PRODUCTS_URL, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = Array.isArray(json) ? json : [];
      setState({ data: items, loading: false, error: null });
    } catch (e) {
      if (String(e?.name) === "AbortError") return;
      setState({ data: [], loading: false, error: e.message || String(e) });
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  const refresh = () => {
    const ctrl = new AbortController();
    load(ctrl.signal);
  };

  return (
    <div className="app">
      <style>{styles}</style>
      <Header tab={tab} setTab={setTab} refresh={refresh} />
      <main className="container">
        {tab === "products" ? (
          <ProductsPanel products={data} loading={loading} error={error} onReload={refresh} />
        ) : (
          <OzonPanel />
        )}
      </main>
    </div>
  );
}
