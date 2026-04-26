"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { MapPin, Route, RefreshCw, Navigation, Users, AlertCircle } from "lucide-react";

const ClientMap = dynamic(() => import("@/components/maps/ClientMap"), { ssr: false, loading: () => <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">Carregando mapa...</div> });

interface Client {
  id: string; name: string; address?: string; neighborhood?: string;
  latitude?: number; longitude?: number; cellphone?: string; phone?: string;
  dueDay?: number; paymentLocation?: string; cobrador?: { name: string };
}

export default function MapaPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [orderedClients, setOrderedClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<string>("");
  const [calcRoute, setCalcRoute] = useState(false);
  const [filter, setFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    setLoading(true);
    const res = await fetch("/api/clientes?limit=999");
    const data = await res.json();
    const list = data.clients || data || [];
    setAllClients(list);
    setClients(list.filter((c: Client) => c.latitude && c.longitude));
    setLoading(false);
  }

  const withoutCoords = allClients.filter(c => !c.latitude || !c.longitude);
  const withCoords = clients;

  async function handleGeocode() {
    setGeocoding(true);
    setGeocodeResult("");
    const res = await fetch("/api/geocode", { method: "POST" });
    const data = await res.json();
    setGeocodeResult(`${data.geocoded} endereços encontrados, ${data.failed} não encontrados`);
    setGeocoding(false);
    loadClients();
  }

  async function handleCalcRoute() {
    if (selectedIds.length < 2) { alert("Selecione pelo menos 2 clientes"); return; }
    setCalcRoute(true);
    setRoute(null);
    setOrderedClients([]);
    const res = await fetch("/api/rotas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientIds: selectedIds }),
    });
    const data = await res.json();
    if (data.error) { alert(data.error); setCalcRoute(false); return; }
    setRoute(data.route.geometry);
    setRouteInfo(data.route);
    setOrderedClients(data.orderedClients.map((c: any, i: number) => ({ ...c, order: i + 1 })));
    setCalcRoute(false);
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function selectByDay(day: string) {
    const d = parseInt(day);
    if (!d) { setSelectedIds([]); return; }
    const ids = withCoords.filter(c => c.dueDay === d).map(c => c.id);
    setSelectedIds(ids);
  }

  const displayClients = useMemo(() => {
    if (orderedClients.length > 0) return orderedClients;
    if (selectedIds.length > 0) return withCoords.filter(c => selectedIds.includes(c.id));
    return withCoords;
  }, [orderedClients, selectedIds, withCoords]);

  const filteredList = withCoords.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.neighborhood || "").toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Carregando...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Clientes</h1>
          <p className="text-sm text-gray-500">{withCoords.length} clientes no mapa | {withoutCoords.length} sem coordenadas</p>
        </div>
        <div className="flex gap-2">
          {withoutCoords.length > 0 && (
            <button onClick={handleGeocode} disabled={geocoding}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50">
              <RefreshCw size={18} className={geocoding ? "animate-spin" : ""} />
              {geocoding ? "Geocodificando..." : `Localizar ${Math.min(withoutCoords.length, 50)} endereços`}
            </button>
          )}
          <button onClick={handleCalcRoute} disabled={calcRoute || selectedIds.length < 2}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Route size={18} /> {calcRoute ? "Calculando..." : `Calcular Rota (${selectedIds.length})`}
          </button>
        </div>
      </div>

      {geocodeResult && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm text-orange-800">{geocodeResult}</div>
      )}

      {routeInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center gap-6">
          <div className="flex items-center gap-2"><Navigation size={18} className="text-blue-600" /><span className="font-bold text-blue-800">{routeInfo.distance} km</span></div>
          <div className="flex items-center gap-2"><Route size={18} className="text-blue-600" /><span className="font-bold text-blue-800">{routeInfo.duration} min</span></div>
          <div className="flex items-center gap-2"><Users size={18} className="text-blue-600" /><span className="font-bold text-blue-800">{orderedClients.length} paradas</span></div>
          <button onClick={() => { setRoute(null); setRouteInfo(null); setOrderedClients([]); }} className="ml-auto text-sm text-blue-600 hover:underline">Limpar rota</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <ClientMap
            clients={displayClients.filter(c => c.latitude && c.longitude) as any}
            route={route}
            showNumbers={orderedClients.length > 0}
          />
        </div>

        {/* Client list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <input type="text" placeholder="Buscar cliente..." value={filter} onChange={e => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2" />
            <div className="flex gap-2 items-center">
              <label className="text-xs text-gray-500">Dia vencimento:</label>
              <select value={dayFilter} onChange={e => { setDayFilter(e.target.value); selectByDay(e.target.value); }}
                className="px-2 py-1 border border-gray-300 rounded text-sm outline-none">
                <option value="">Todos</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ordered route list */}
          {orderedClients.length > 0 && (
            <div className="p-3 bg-blue-50 border-b">
              <p className="text-xs font-bold text-blue-800 mb-2">Ordem da rota:</p>
              {orderedClients.map(c => (
                <div key={c.id} className="flex items-center gap-2 py-1 text-sm">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{c.order}</span>
                  <span className="text-gray-900 font-medium truncate">{c.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-y-auto max-h-[400px]">
            {filteredList.map(c => (
              <label key={c.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)}
                  className="rounded border-gray-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.neighborhood || c.address || "-"} | Dia {c.dueDay || "-"}</p>
                </div>
                <MapPin size={14} className="text-green-500 flex-shrink-0" />
              </label>
            ))}
            {filteredList.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                <AlertCircle size={20} className="mx-auto mb-2 text-gray-400" />
                Nenhum cliente com localização
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clients without coordinates */}
      {withoutCoords.length > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><AlertCircle size={18} /> {withoutCoords.length} clientes sem localização no mapa</h3>
          <p className="text-sm text-yellow-700 mb-2">Clique em &quot;Localizar endereços&quot; para tentar encontrar automaticamente. O processo localiza até 50 por vez (1 por segundo).</p>
          <div className="flex flex-wrap gap-2">
            {withoutCoords.slice(0, 10).map(c => (
              <span key={c.id} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">{c.name}</span>
            ))}
            {withoutCoords.length > 10 && <span className="text-xs text-yellow-600">e mais {withoutCoords.length - 10}...</span>}
          </div>
        </div>
      )}
    </div>
  );
}
