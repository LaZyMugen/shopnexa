import { useEffect, useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/categories");
      setCategories(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createCategory = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      await api.post("/categories", { name: newName.trim() });
      setNewName("");
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const renameCategory = async (id, name) => {
    if (!name.trim()) return;
    setSavingId(id);
    setError("");
    try {
      await api.put(`/categories/${id}`, { name: name.trim() });
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Rename failed");
    } finally {
      setSavingId(null);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    setDeletingId(id);
    setError("");
    try {
      await api.delete(`/categories/${id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Manage Categories</h1>
          <button
            onClick={load}
            className="px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800"
            disabled={loading}
          >Refresh</button>
        </header>

        {error && (
          <div className="p-3 rounded bg-red-500/15 border border-red-500 text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={creating}
          />
          <button
            onClick={createCategory}
            disabled={creating || !newName.trim()}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
          >{creating ? "Creating..." : "Add"}</button>
        </div>

        <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 p-4 shadow">
          {loading ? (
            <div className="py-8 text-center text-slate-600">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-slate-600">No categories</div>
          ) : (
            <ul className="space-y-3">
              {categories.map(cat => (
                <li key={cat.id} className="flex items-center gap-3">
                  <input
                    defaultValue={cat.name}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val !== cat.name) renameCategory(cat.id, val);
                    }}
                    className="flex-1 px-2 py-1 rounded border border-slate-300 bg-white text-sm"
                    disabled={savingId === cat.id || deletingId === cat.id}
                  />
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    disabled={savingId === cat.id || deletingId === cat.id}
                    className="px-3 py-1 rounded bg-red-600 text-white text-xs disabled:opacity-50"
                  >{deletingId === cat.id ? "Deleting..." : "Delete"}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
