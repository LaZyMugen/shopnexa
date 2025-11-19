import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/axios";
import ProductTable from "../components/ProductTable";

export default function ManageProducts() {
	const [products, setProducts] = useState([]);
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("");
	const [sort, setSort] = useState("created_at");
	const [order, setOrder] = useState("desc");
	const [showCreate, setShowCreate] = useState(false);
	const [creating, setCreating] = useState(false);
	const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", category_id: "", region: "", image_url: "" });
	const [editing, setEditing] = useState(null);
	const [savingEdit, setSavingEdit] = useState(false);


	const loadCategories = async () => {
		try {
			const res = await api.get("/categories");
			setCategories(res.data?.data || []);
		} catch (err) {
			console.warn('load categories failed', err);
		}
	};

	const loadProducts = useCallback(async () => {
		setLoading(true); setError("");
		try {
			const params = { page, pageSize, sort, order };
			if (search.trim()) params.search = search.trim();
			if (category) params.category = category;
			const res = await api.get("/products", { params });
			setProducts(res.data?.data || []);
			setTotal(res.data?.total || 0);
		} catch (e) {
			setError(e.response?.data?.error || e.message || "Failed to load products");
		} finally {
			setLoading(false);
		}
	}, [page, pageSize, sort, order, search, category]);

	useEffect(() => { loadCategories(); }, []);
	useEffect(() => { loadProducts(); }, [loadProducts]);

	const resetForm = () => setForm({ name: "", description: "", price: "", stock: "", category_id: "", region: "", image_url: "" });

		const submitCreate = async (e) => {
			e.preventDefault();
			if (!form.name.trim()) return;
			setCreating(true); setError("");
			const tempId = "temp-" + Date.now();
			const optimistic = { id: tempId, ...form, price: Number(form.price || 0), stock: Number(form.stock || 0), created_at: new Date().toISOString() };
			setProducts(prev => [...prev, optimistic]);
			try {
				const payload = { ...form, price: Number(form.price || 0), stock: Number(form.stock || 0) };
				const res = await api.post("/products", payload);
				const created = res.data?.data?.[0];
				if (created) {
					setProducts(prev => prev.map(p => p.id === tempId ? created : p));
				} else {
					await loadProducts();
				}
				resetForm();
				setShowCreate(false);
			} catch (er) {
				// rollback
				setProducts(prev => prev.filter(p => p.id !== tempId));
				setError(er.response?.data?.error || er.message || "Create failed");
			} finally {
				setCreating(false);
			}
		};

	const startEdit = (p) => {
		setEditing(p);
		setForm({
			name: p.name ?? "",
			description: p.description ?? "",
			price: p.price ?? "",
			stock: p.stock ?? "",
			category_id: p.category_id ?? "",
			region: p.region ?? "",
			image_url: p.image_url ?? "",
		});
		setShowCreate(true);
	};

		const submitEdit = async (e) => {
			e.preventDefault();
			if (!editing) return;
			setSavingEdit(true); setError("");
			const original = editing;
			const payload = { ...form, price: Number(form.price || 0), stock: Number(form.stock || 0) };
			// optimistic update
			setProducts(prev => prev.map(p => p.id === original.id ? { ...p, ...payload } : p));
			try {
				const res = await api.put(`/products/${original.id}`, payload);
				const updated = res.data?.data?.[0];
				if (updated) {
					setProducts(prev => prev.map(p => p.id === original.id ? updated : p));
				} else {
					await loadProducts();
				}
				setEditing(null);
				resetForm();
				setShowCreate(false);
			} catch (er) {
				// rollback
				setProducts(prev => prev.map(p => p.id === original.id ? original : p));
				setError(er.response?.data?.error || er.message || "Update failed");
			} finally {
				setSavingEdit(false);
			}
		};

		const deleteProduct = async (p) => {
			if (!window.confirm(`Delete product "${p.name}"?`)) return;
			setError("");
			// optimistic removal
			const before = products;
			setProducts(prev => prev.filter(x => x.id !== p.id));
			try {
				await api.delete(`/products/${p.id}`);
				// Optionally refresh if current filters might exclude other changed items
				// await loadProducts();
			} catch (er) {
				// rollback
				setProducts(before);
				setError(er.response?.data?.error || er.message || "Delete failed");
			} finally {
	                // no cleanup required here, keep a no-op to satisfy linters
	                void 0;
	            }
		};

	const totalPages = Math.max(Math.ceil(total / pageSize), 1);

	return (
		<AdminLayout>
			<div className="space-y-6">
				<header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<h1 className="text-xl font-semibold text-slate-800">Manage Products</h1>
						<p className="text-xs text-slate-600">CRUD, filters & pagination</p>
					</div>
					<div className="flex gap-3">
						<button
							onClick={() => { setEditing(null); resetForm(); setShowCreate(true); }}
							className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
						>New Product</button>
						<button
							onClick={() => loadProducts()}
							disabled={loading}
							className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm disabled:opacity-50"
						>Refresh</button>
					</div>
				</header>

				{/* Filters */}
				<div className="rounded-xl bg-white/60 backdrop-blur-md border border-white/30 p-4 shadow flex flex-col md:flex-row gap-4 md:items-end">
					<div className="flex-1">
						<label className="text-xs font-medium text-slate-600">Search</label>
						<input
							value={search}
							onChange={(e) => { setSearch(e.target.value); setPage(1);} }
							placeholder="Name contains..."
							className="mt-1 w-full px-3 py-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="text-xs font-medium text-slate-600">Category</label>
						<select
							value={category}
							onChange={(e) => { setCategory(e.target.value); setPage(1);} }
							className="mt-1 px-3 py-2 rounded border border-slate-300 text-sm bg-white"
						>
							<option value="">All</option>
							{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
						</select>
					</div>
					<div>
						<label className="text-xs font-medium text-slate-600">Sort</label>
						<select
							value={sort}
							onChange={(e) => setSort(e.target.value)}
							className="mt-1 px-3 py-2 rounded border border-slate-300 text-sm bg-white"
						>
							<option value="created_at">Created</option>
							<option value="price">Price</option>
							<option value="stock">Stock</option>
							<option value="name">Name</option>
						</select>
					</div>
					<div>
						<label className="text-xs font-medium text-slate-600">Order</label>
						<select
							value={order}
							onChange={(e) => setOrder(e.target.value)}
							className="mt-1 px-3 py-2 rounded border border-slate-300 text-sm bg-white"
						>
							<option value="desc">Desc</option>
							<option value="asc">Asc</option>
						</select>
					</div>
					<div className="md:ml-auto flex gap-2">
						<button
							onClick={() => { setSearch(""); setCategory(""); setSort("created_at"); setOrder("desc"); setPage(1);} }
							className="px-3 py-2 rounded bg-slate-200 text-slate-700 text-xs hover:bg-slate-300"
						>Clear</button>
					</div>
				</div>

				{error && <div className="p-3 rounded bg-red-500/15 border border-red-500 text-red-600 text-sm">{error}</div>}

				{/* Table */}
						<ProductTable
							products={products}
							loading={loading}
							onEdit={(p) => startEdit(p)}
							onDelete={(p) => deleteProduct(p)}
						/>

				{/* Pagination */}
				<div className="flex items-center justify-between text-sm">
					<div className="text-slate-600">Page {page} of {totalPages}</div>
					<div className="flex gap-2">
						<button
							onClick={() => setPage(p => Math.max(p-1,1))}
							disabled={page === 1}
							className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50"
						>Prev</button>
						<button
							onClick={() => setPage(p => Math.min(p+1,totalPages))}
							disabled={page === totalPages}
							className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50"
						>Next</button>
					</div>
				</div>

				{/* Create/Edit Modal */}
				{showCreate && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
						<form
							onSubmit={editing ? submitEdit : submitCreate}
							className="w-full max-w-lg bg-white rounded-xl p-6 shadow-xl space-y-4"
						>
							<h2 className="text-lg font-semibold text-slate-800">{editing ? `Edit: ${editing.name}` : "New Product"}</h2>
							<div className="grid grid-cols-1 gap-4">
								<Field label="Name">
									<input
										className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
										value={form.name}
										onChange={(e)=>setForm(f=>({...f,name:e.target.value}))}
										required
									/>
								</Field>
								<Field label="Description">
									<textarea
										rows={3}
										className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
										value={form.description}
										onChange={(e)=>setForm(f=>({...f,description:e.target.value}))}
									/>
								</Field>
								<div className="grid grid-cols-2 gap-4">
									<Field label="Price (₹)">
										<input
											type="number"
											className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
											value={form.price}
											onChange={(e)=>setForm(f=>({...f,price:e.target.value}))}
											min={0}
											step="0.01"
											required
										/>
									</Field>
									<Field label="Stock">
										<input
											type="number"
											className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
											value={form.stock}
											onChange={(e)=>setForm(f=>({...f,stock:e.target.value}))}
											min={0}
											required
										/>
									</Field>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<Field label="Category">
										<select
											className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white"
											value={form.category_id}
											onChange={(e)=>setForm(f=>({...f,category_id:e.target.value}))}
										>
											<option value="">None</option>
											{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
										</select>
									</Field>
									<Field label="Region">
										<input
											className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
											value={form.region}
											onChange={(e)=>setForm(f=>({...f,region:e.target.value}))}
										/>
									</Field>
								</div>
												<Field label="Image URL">
													<input
														className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
														value={form.image_url}
														onChange={(e)=>setForm(f=>({...f,image_url:e.target.value}))}
														placeholder="https://..."
													/>
													{form.image_url.trim() && form.image_url.startsWith("http") && (
														<div className="mt-2 flex items-center gap-3">
															<img
																src={form.image_url}
																alt="Preview"
																onError={(ev)=>{ev.currentTarget.style.opacity='0.3';}}
																className="h-16 w-16 object-cover rounded border border-slate-200"
															/>
															<span className="text-[10px] text-slate-500 break-all">Preview</span>
														</div>
													)}
												</Field>
								{error && <div className="p-2 rounded bg-red-500/15 border border-red-500 text-red-600 text-xs">{error}</div>}
								<div className="flex justify-end gap-3 pt-2">
									<button
										type="button"
										onClick={()=>{setShowCreate(false); setEditing(null); resetForm();}}
										className="px-4 py-2 rounded bg-slate-200 text-slate-700 text-sm hover:bg-slate-300"
										disabled={creating || savingEdit}
									>Cancel</button>
									<button
										type="submit"
										className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
										disabled={creating || savingEdit}
									>{editing ? (savingEdit ? "Saving..." : "Save") : (creating ? "Creating..." : "Create")}</button>
								</div>
							</div>
						</form>
					</div>
				)}
			</div>
		</AdminLayout>
	);
}

function Field({ label, children }) {
	return (
		<label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
			<span>{label}</span>
			{children}
		</label>
	);
}

