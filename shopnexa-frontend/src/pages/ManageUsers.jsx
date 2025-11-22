import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/axios";

// Simple debounce hook for search input
function useDebounce(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all"); // all | customer | retailer | wholesaler | admin
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.get("/users");
        const data = res.data?.data ?? res.data ?? [];
        if (isMounted) setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn("users fetch error", e);
        if (isMounted) {
          setError(true);
          setUsers([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUsers();
    return () => { isMounted = false; };
  }, [reloadTick]);

  // Normalize role values (fallback to 'customer')
  const normalizedUsers = useMemo(() => users.map(u => ({
    ...u,
    role: (u.role || u.user_role || "customer").toLowerCase(),
  })), [users]);

  // Apply custom name mapping & force admin for specific email
  const nameMap = {
    "prassad": "Prassad",
    "rosy": "Rosy",
    "shaswat": "Shashwat",
    "baka": "Baka",
    "test": "Test",
  };
  const adminEmail = "shaswatsahoo234@gmail.com";

  const enrichedUsers = useMemo(() => normalizedUsers.map(u => {
    const email = (u.email || "").toLowerCase();
    // Derive base portion before @ for name lookup
    const base = email.split("@")[0];
    let derivedName = u.name || nameMap[base] || base || "User";
    // Capitalize first letter if plain lowercase
    if (derivedName && derivedName.length > 1) {
      derivedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
    }
    const forcedRole = email === adminEmail ? "admin" : u.role;
    return { ...u, name: derivedName, role: forcedRole };
  }), [normalizedUsers]);

  // Inject demo roles if none exist: make a few retailers and one wholesaler
  const demoAdjustedUsers = useMemo(() => {
    const hasRetailer = enrichedUsers.some(u => u.role === "retailer");
    const hasWholesaler = enrichedUsers.some(u => u.role === "wholesaler");
    if (hasRetailer && hasWholesaler) return enrichedUsers;
    const cloned = enrichedUsers.map(u => ({ ...u }));
    let retailerAssigned = 0;
    let wholesalerAssigned = false;
    for (const u of cloned) {
      if (!wholesalerAssigned) {
        if (u.role !== "admin") u.role = "wholesaler"; // don't override admin
        wholesalerAssigned = true;
        continue;
      }
      if (retailerAssigned < 3) { // assign 3 retailers
        if (u.role !== "admin") u.role = "retailer";
        retailerAssigned++;
      }
      if (wholesalerAssigned && retailerAssigned >= 3) break;
    }
    return cloned;
  }, [enrichedUsers]);

  const counts = useMemo(() => {
    const base = { customer: 0, retailer: 0, wholesaler: 0, admin: 0 };
    for (const u of demoAdjustedUsers) {
      if (base[u.role] !== undefined) base[u.role]++;
      else base.customer++; // bucket unknown into customer
    }
    return base;
  }, [demoAdjustedUsers]);

  const filtered = useMemo(() => {
    let list = demoAdjustedUsers;
    if (roleFilter !== "all") list = list.filter(u => u.role === roleFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
    }
    return list;
  }, [demoAdjustedUsers, roleFilter, debouncedSearch]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Manage Users</h1>
            <p className="text-sm text-slate-600">View all registered users, roles and filter/search.</p>
          </div>
          <button
            onClick={() => setReloadTick(t => t + 1)}
            className="px-3 py-2 rounded-lg text-sm bg-slate-800 text-white hover:bg-slate-700"
          >Refresh</button>
        </div>

        {/* Role summary */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(counts).map(([role, count]) => (
            <div key={role} className="px-3 py-1.5 rounded-full bg-white/60 backdrop-blur border border-white/30 text-xs text-slate-700 flex items-center gap-2">
              <span className="capitalize">{role}</span>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-[11px]">{count}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2 bg-white/50 backdrop-blur rounded-xl p-1 border border-white/30">
            {["all","customer","retailer","wholesaler","admin"].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 text-xs rounded-lg transition ${roleFilter===r?"bg-slate-800 text-white shadow":"text-slate-700 hover:bg-white"}`}
              >{r.charAt(0).toUpperCase()+r.slice(1)}</button>
            ))}
          </div>
          <div className="relative">
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="pl-3 pr-10 py-2 rounded-lg bg-white/70 backdrop-blur border border-white/30 text-sm focus:ring-2 focus:ring-sky-200 outline-none"
            />
            {search && (
              <button
                onClick={()=>setSearch("")}
                className="absolute right-2 top-2 text-xs text-slate-500 hover:text-slate-700"
              >Clear</button>
            )}
          </div>
        </div>

        {/* Role legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
          <span className="font-semibold mr-1">Legend:</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-violet-50 ring-1 ring-violet-200 text-[12px]"> 
            <span className="inline-block w-2 h-2 rounded-full bg-violet-400" /> Admin
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 ring-1 ring-emerald-200 text-[12px]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Retailer
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 ring-1 ring-amber-200 text-[12px]">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Wholesaler
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-50 ring-1 ring-sky-200 text-[12px]">
            <span className="inline-block w-2 h-2 rounded-full bg-sky-500" /> Customer
          </span>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white/60 backdrop-blur border border-white/30 shadow-sm overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {loading && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-600">Loading users...</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={5} className="p-6 text-center text-red-600">Failed to load users.</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-600">No users match current filters.</td></tr>
              )}
              {!loading && !error && filtered.map(u => (
                <tr
                  key={u.id}
                  role="row"
                  aria-label={`User role: ${u.role}. Row color indicates ${u.role === 'admin' ? 'purple' : u.role === 'retailer' ? 'green' : u.role === 'wholesaler' ? 'amber' : u.role === 'customer' ? 'blue' : 'default'}`}
                  className={`transition ${
                    u.role === 'admin' ? 'bg-violet-50 ring-1 ring-violet-200' :
                    u.role === 'retailer' ? 'bg-emerald-50 ring-1 ring-emerald-200' :
                    u.role === 'wholesaler' ? 'bg-amber-50 ring-1 ring-amber-200' :
                    u.role === 'customer' ? 'bg-sky-50 ring-1 ring-sky-200' :
                    'hover:bg-white/40'
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{(u.id||"").slice(0,8)}</td>
                  <td className="px-4 py-3">{u.name || "—"}</td>
                  <td className="px-4 py-3">{u.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      u.role === 'admin' ? 'bg-violet-50 text-violet-800 ring-1 ring-violet-200' :
                      u.role === 'retailer' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' :
                      u.role === 'wholesaler' ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' :
                      u.role === 'customer' ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-200' :
                      'bg-gray-200 text-gray-700'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">{u.created_at? new Date(u.created_at).toLocaleDateString():"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
