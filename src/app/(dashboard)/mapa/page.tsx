"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { MapPin, Route, RefreshCw, Navigation, Users, AlertCircle, Calendar, Clock, Phone, CheckCircle, X, Play } from "lucide-react";

const ClientMap = dynamic(() => import("@/components/maps/ClientMap"), { ssr: false, loading: () => <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">Carregando mapa...</div> });

interface Client {
  id: string; name: string; address?: string; neighborhood?: string;
  latitude?: number; longitude?: number; cellphone?: string; phone?: string;
  dueDay?: number; paymentLocation?: string; cobrador?: { name: string };
  status?: string;
  billingAddressSame?: boolean; billingAddress?: string; billingNeighborhood?: string;
  billingLatitude?: number; billingLongitude?: number; billingReference?: string;
}

export default function MapaPage() {
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
  const [locationFilter, setLocationFilter] = useState("");
  const [mode, setMode] = useState<"mapa" | "cobranca">("cobranca");
  const [routeStarted, setRouteStarted] = useState(false);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);

  const today = new Date().getDate();

  useEffect(() => { loadClients(); }, []);

  // Auto-select today's clients on load
  useEffect(() => {
    if (allClients.length > 0 && mode === "cobranca" && selectedIds.length === 0) {
      const todayClients = withCoords.filter(c => c.dueDay === today);
      if (todayClients.length > 0) {
        setSelectedIds(todayClients.map(c => c.id));
        setDayFilter(String(today));
      }
    }
  }, [allClients]);

  async function loadClients() {
    setLoading(true);
    const res = await fetch("/api/clientes?limit=999");
    const data = await res.json();
    const list = data.clients || data || [];
    setAllClients(list);
    setLoading(false);
  }

  // Use billing coordinates for route when billing address is different
  function getRouteCoords(c: Client): { lat: number; lng: number } | null {
    if (c.billingAddressSame === false && c.billingLatitude && c.billingLongitude) {
      return { lat: c.billingLatitude, lng: c.billingLongitude };
    }
    if (c.latitude && c.longitude) {
      return { lat: c.latitude, lng: c.longitude };
    }
    return null;
  }

  const withCoords = useMemo(() => allClients.filter(c => getRouteCoords(c) !== null && c.status !== "CANCELLED"), [allClients]);
  const withoutCoords = useMemo(() => allClients.filter(c => getRouteCoords(c) === null && c.status !== "CANCELLED"), [allClients]);

  // Day counts for quick buttons
  const dayCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    withCoords.forEach(c => {
      if (c.dueDay) counts[c.dueDay] = (counts[c.dueDay] || 0) + 1;
    });
    return counts;
  }, [withCoords]);

  const activeDays = Object.keys(dayCounts).map(Number).sort((a, b) => a - b);

  async function handleGeocode() {
    setGeocoding(true);
    setGeocodeResult("");
    const res = await fetch("/api/geocode", { method: "POST" });
    const data = await res.json();
    setGeocodeResult(`✅ ${data.geocoded} localizados | ❌ ${data.failed} não encontrados`);
    setGeocoding(false);
    loadClients();
  }

  async function handleCalcRoute() {
    if (selectedIds.length < 2) { alert("Selecione pelo menos 2 clientes para gerar a rota"); return; }
    setCalcRoute(true);
    setRoute(null);
    setOrderedClients([]);
    setRouteStarted(false);
    setVisitedIds([]);
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

  function selectByDay(day: string) {
    setDayFilter(day);
    const d = parseInt(day);
    if (!d) { setSelectedIds([]); return; }
    let filtered = withCoords.filter(c => c.dueDay === d);
    if (locationFilter) filtered = filtered.filter(c => c.paymentLocation === locationFilter);
    setSelectedIds(filtered.map(c => c.id));
    // Clear previous route
    setRoute(null); setRouteInfo(null); setOrderedClients([]); setRouteStarted(false); setVisitedIds([]);
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setRoute(null); setRouteInfo(null); setOrderedClients([]);
  }

  function markVisited(id: string) {
    setVisitedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleSelectAllToday() {
    const todayClients = withCoords.filter(c => c.dueDay === today);
    setSelectedIds(todayClients.map(c => c.id));
    setDayFilter(String(today));
    setRoute(null); setRouteInfo(null); setOrderedClients([]);
  }

  // Auto generate route after selecting by day
  async function handleQuickRoute(day: number) {
    setDayFilter(String(day));
    let filtered = withCoords.filter(c => c.dueDay === day);
    if (locationFilter) filtered = filtered.filter(c => c.paymentLocation === locationFilter);
    const ids = filtered.map(c => c.id);
    setSelectedIds(ids);

    if (ids.length < 2) { alert(`Apenas ${ids.length} cliente(s) no dia ${day}. Precisa de pelo menos 2.`); return; }

    setCalcRoute(true);
    setRoute(null); setOrderedClients([]); setRouteStarted(false); setVisitedIds([]);
    const res = await fetch("/api/rotas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientIds: ids }),
    });
    const data = await res.json();
    if (data.error) { alert(data.error); setCalcRoute(false); return; }
    setRoute(data.route.geometry);
    setRouteInfo(data.route);
    setOrderedClients(data.orderedClients.map((c: any, i: number) => ({ ...c, order: i + 1 })));
    setCalcRoute(false);
  }

  const displayClients = useMemo(() => {
    const list = orderedClients.length > 0 ? orderedClients :
      selectedIds.length > 0 ? withCoords.filter(c => selectedIds.includes(c.id)) : withCoords;
    // Override latitude/longitude with billing coords for map display
    return list.map(c => {
      const coords = getRouteCoords(c);
      if (!coords) return c;
      const isBilling = c.billingAddressSame === false && c.billingLatitude && c.billingLongitude;
      return {
        ...c,
        latitude: coords.lat,
        longitude: coords.lng,
        address: isBilling ? (c.billingAddress || c.address) : c.address,
        neighborhood: isBilling ? (c.billingNeighborhood || c.neighborhood) : c.neighborhood,
      };
    });
  }, [orderedClients, selectedIds, withCoords]);

  const filteredList = withCoords.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.neighborhood || "").toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Carregando...</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "cobranca" ? "🚗 Rota de Cobrança" : "🗺️ Mapa de Clientes"}
          </h1>
          <p className="text-sm text-gray-500">
            {withCoords.length} clientes no mapa | Hoje é dia {today}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode(mode === "cobranca" ? "mapa" : "cobranca")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            {mode === "cobranca" ? "Ver Mapa Geral" : "Modo Cobrança"}
          </button>
          {withoutCoords.length > 0 && (
            <button onClick={handleGeocode} disabled={geocoding}
              className="flex items-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm">
              <RefreshCw size={16} className={geocoding ? "animate-spin" : ""} />
              {geocoding ? "Localizando..." : `Localizar (${Math.min(withoutCoords.length, 50)})`}
            </button>
          )}
        </div>
      </div>

      {geocodeResult && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm text-orange-800">{geocodeResult}</div>
      )}

      {/* Modo Cobrança - Quick day selection */}
      {mode === "cobranca" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Calendar size={18} className="text-blue-600" />
            <h2 className="font-bold text-gray-900">Selecione o dia de vencimento</h2>
            <span className="text-xs text-gray-600">(clique para gerar rota automática)</span>
          </div>

          {/* Location filter */}
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs text-gray-500">Local de pagamento:</label>
            <button onClick={() => { setLocationFilter(""); }}
              className={`px-3 py-1 rounded-full text-xs font-medium ${!locationFilter ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              Todos
            </button>
            <button onClick={() => { setLocationFilter("RESIDENCIA"); }}
              className={`px-3 py-1 rounded-full text-xs font-medium ${locationFilter === "RESIDENCIA" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              🏠 Residência
            </button>
            <button onClick={() => { setLocationFilter("LOJA"); }}
              className={`px-3 py-1 rounded-full text-xs font-medium ${locationFilter === "LOJA" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              🏪 Loja
            </button>
          </div>

          {/* Day buttons */}
          <div className="flex flex-wrap gap-2">
            {activeDays.map(day => {
              const count = dayCounts[day] || 0;
              const isToday = day === today;
              const isSelected = dayFilter === String(day);
              return (
                <button key={day} onClick={() => handleQuickRoute(day)}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${isSelected ? "bg-blue-600 text-white shadow-md scale-105" :
                      isToday ? "bg-blue-100 text-blue-800 border-2 border-blue-400 hover:bg-blue-200" :
                      "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  Dia {day}
                  <span className={`ml-1 text-xs ${isSelected ? "text-blue-200" : "text-gray-600"}`}>({count})</span>
                  {isToday && !isSelected && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 flex items-center gap-2">
            <button onClick={handleSelectAllToday}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
              <Play size={16} /> Cobranças de Hoje (Dia {today}) — {withCoords.filter(c => c.dueDay === today).length} clientes
            </button>
            {selectedIds.length > 0 && !orderedClients.length && (
              <button onClick={handleCalcRoute} disabled={calcRoute || selectedIds.length < 2}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">
                <Route size={16} /> {calcRoute ? "Calculando..." : `Gerar Rota (${selectedIds.length} clientes)`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Route info bar */}
      {routeInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2"><Navigation size={18} className="text-blue-600" /><span className="font-bold text-blue-800">{routeInfo.distance} km</span><span className="text-xs text-blue-500">distância total</span></div>
            <div className="flex items-center gap-2"><Clock size={18} className="text-blue-600" /><span className="font-bold text-blue-800">{routeInfo.duration} min</span><span className="text-xs text-blue-500">tempo estimado</span></div>
            <div className="flex items-center gap-2"><Users size={18} className="text-blue-600" /><span className="font-bold text-blue-800">{orderedClients.length} paradas</span></div>
            {routeStarted && (
              <div className="flex items-center gap-2"><CheckCircle size={18} className="text-green-600" /><span className="font-bold text-green-700">{visitedIds.length}/{orderedClients.length} visitados</span></div>
            )}
            <div className="ml-auto flex gap-2">
              {!routeStarted && (
                <button onClick={() => setRouteStarted(true)} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">
                  <Play size={14} /> Iniciar Rota
                </button>
              )}
              <button onClick={() => { setRoute(null); setRouteInfo(null); setOrderedClients([]); setRouteStarted(false); setVisitedIds([]); }}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
                <X size={14} /> Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <ClientMap
            clients={displayClients.filter(c => c.latitude && c.longitude) as any}
            route={route}
            showNumbers={orderedClients.length > 0}
          />
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {/* Route order list */}
          {orderedClients.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 bg-blue-600 text-white">
                <p className="font-bold text-sm">📋 Ordem de Visita</p>
                <p className="text-xs text-blue-200">{orderedClients.length} clientes | {routeInfo?.distance} km</p>
              </div>
              {orderedClients.map(c => {
                const visited = visitedIds.includes(c.id);
                return (
                  <div key={c.id} className={`flex items-center gap-3 px-3 py-3 border-b border-gray-100 ${visited ? "bg-green-50" : "hover:bg-gray-50"}`}>
                    <span className={`rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${visited ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}>
                      {visited ? "✓" : c.order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${visited ? "text-green-700 line-through" : "text-gray-900"}`}>{c.name}</p>
                      <p className="text-xs text-gray-500 truncate">{c.address || c.neighborhood || "-"}</p>
                      {c.cellphone && (
                        <a href={`tel:${c.cellphone}`} className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {c.cellphone}
                        </a>
                      )}
                    </div>
                    {routeStarted && (
                      <button onClick={() => markVisited(c.id)}
                        className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0
                          ${visited ? "bg-gray-200 text-gray-600" : "bg-green-600 text-white hover:bg-green-700"}`}>
                        {visited ? "Desfazer" : "Visitado"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* Search & filters */}
              <div className="p-3 border-b">
                <input type="text" placeholder="Buscar cliente..." value={filter} onChange={e => setFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2" />
                {mode === "mapa" && (
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-gray-500">Dia:</label>
                    <select value={dayFilter} onChange={e => selectByDay(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm outline-none flex-1">
                      <option value="">Todos</option>
                      {activeDays.map(d => (
                        <option key={d} value={d}>Dia {d} ({dayCounts[d]})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Client checkboxes */}
              <div className="flex-1 overflow-y-auto max-h-[500px]">
                {filteredList.map(c => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <label key={c.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-gray-100 ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(c.id)} className="rounded border-gray-300" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {c.neighborhood || c.address || "-"} | Dia {c.dueDay || "-"}
                          {c.paymentLocation === "LOJA" ? " | 🏪 Loja" : " | 🏠 Casa"}
                          {c.billingAddressSame === false && " | 📍 End. cobrança diferente"}
                        </p>
                      </div>
                      <MapPin size={14} className="text-green-500 flex-shrink-0" />
                    </label>
                  );
                })}
                {filteredList.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    <AlertCircle size={20} className="mx-auto mb-2 text-gray-400" />
                    Nenhum cliente encontrado
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Clients without coordinates */}
      {withoutCoords.length > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><AlertCircle size={18} /> {withoutCoords.length} clientes sem localização</h3>
          <p className="text-sm text-yellow-700 mb-2">Clique em &quot;Localizar&quot; para buscar coordenadas automaticamente (50 por vez).</p>
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
