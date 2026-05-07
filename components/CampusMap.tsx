import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, ScrollView, Platform, Alert, Modal, KeyboardAvoidingView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as API from '../services/api';

interface CampusPoint {
  id: number; name: string; nameEn: string; category: Category;
  lat: number; lng: number; description: string; floor?: string; hours?: string;
}

type Category = 'All' | 'Faculty' | 'Academic' | 'Food' | 'Sports' | 'Health' | 'Transport' | 'Social';

const CAMPUS_CENTER = { lat: 37.1630, lng: 28.3720 };

const CAMPUS_POINTS: CampusPoint[] = [];

const CATEGORIES: { key: Category; label: string; icon: string; color: string }[] = [
  { key: 'All', label: 'All', icon: '🗺️', color: '#1A365D' },
  { key: 'Faculty', label: 'Faculty', icon: '🎓', color: '#2A69AC' },
  { key: 'Academic', label: 'Academic', icon: '📚', color: '#553C9A' },
  { key: 'Food', label: 'Dining', icon: '🍽️', color: '#C05621' },
  { key: 'Sports', label: 'Sports', icon: '⚽', color: '#276749' },
  { key: 'Health', label: 'Hospital', icon: '🏥', color: '#C53030' },
  { key: 'Transport', label: 'Transport', icon: '🚌', color: '#2C7A7B' },
  { key: 'Social', label: 'Social', icon: '🎭', color: '#702459' },
];

const toRadians = (value: number) => (value * Math.PI) / 180;

const getRouteEstimate = (points: CampusPoint[], fromId?: number, toId?: number) => {
  if (!fromId || !toId) return null;
  const from = points.find((point) => point.id === fromId);
  const to = points.find((point) => point.id === toId);
  if (!from || !to) return null;

  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const straightKm = 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
  const estimatedKm = Math.max(0.15, straightKm * 1.18);
  const walkingMinutes = Math.max(2, Math.round((estimatedKm / 4.8) * 60));

  return {
    distanceLabel: estimatedKm < 1 ? `${Math.round(estimatedKm * 1000)} m` : `${estimatedKm.toFixed(2)} km`,
    durationLabel: `${walkingMinutes} min`,
  };
};

const buildMapHTML = (points: CampusPoint[], fromCoord?: {lat: number, lng: number}, toCoord?: {lat: number, lng: number}, mode: string = 'walking', userLoc: {lat:number, lng:number} | null = null): string => {
  const pointsJson = JSON.stringify(points);
  const fromJson = fromCoord ? JSON.stringify(fromCoord) : 'null';
  const toJson = toCoord ? JSON.stringify(toCoord) : 'null';
  const userJson = userLoc ? JSON.stringify(userLoc) : 'null';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  #map { width:100vw; height:100vh; }
  .custom-marker {
    display:flex; align-items:center; justify-content:center;
    width:36px; height:36px; border-radius:50% 50% 50% 0;
    transform:rotate(-45deg); border:2px solid rgba(255,255,255,0.9);
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
  }
  .custom-marker span { transform:rotate(45deg); font-size:16px; line-height:1; }
  .leaflet-popup-content-wrapper {
    border-radius:12px; padding:0; overflow:hidden;
    box-shadow:0 4px 20px rgba(0,0,0,0.2); min-width:200px;
  }
  .leaflet-popup-content { margin:0; }
  .popup-header { padding:10px 14px 8px; color:#fff; font-weight:700; font-size:14px; }
  .popup-body { padding:10px 14px 12px; background:#fff; }
  .popup-desc { font-size:12px; color:#555; margin-bottom:6px; }
  .popup-meta { font-size:11px; color:#888; }
  .popup-btn {
    display:inline-block; margin-top:8px; padding:5px 12px;
    background:#2A69AC; color:#fff; border-radius:6px;
    font-size:12px; font-weight:600; cursor:pointer; border:none; width:100%;
  }
  .leaflet-popup-tip { background:#fff; }
  .faculty-label {
    background: rgba(17, 24, 39, 0.92);
    border: 0;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    border-radius: 8px;
    padding: 4px 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }
  .pulse { width:14px; height:14px; border-radius:50%; background: #2B8CFF; box-shadow:0 0 0 rgba(43,140,255,0.7); position:relative; }
  .pulse::after { content:""; position:absolute; left:-6px; top:-6px; width:26px; height:26px; border-radius:50%; background: rgba(43,140,255,0.15); animation: pulseAnim 1.6s infinite; }
  @keyframes pulseAnim { 0%{transform:scale(0.6);opacity:0.9} 70%{transform:scale(1.6);opacity:0.02} 100%{transform:scale(1.6);opacity:0} }
</style>
</head>
<body>
<div id="map"></div>
<script>
var POINTS = ${pointsJson};
var FROM_COORD = ${fromJson};
var TO_COORD = ${toJson};
var USER_LOC = ${userJson};
var ROUTE_MODE = '${mode}';
var CATEGORY_COLORS = {
  Faculty:'#2A69AC', Academic:'#553C9A', Food:'#C05621',
  Sports:'#276749', Health:'#C53030', Transport:'#2C7A7B',
  Social:'#702459', All:'#1A365D'
};
var CATEGORY_ICONS = {
  Faculty:'🎓', Academic:'📚', Food:'🍽️',
  Sports:'⚽', Health:'🏥', Transport:'🚌',
  Social:'🎭', All:'📍'
};

var map = L.map('map', { zoomControl:true, attributionControl:false })
  .setView([${CAMPUS_CENTER.lat}, ${CAMPUS_CENTER.lng}], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom:20, opacity:0.92
}).addTo(map);

L.control.attribution({ position:'bottomright', prefix:'© OSM' }).addTo(map);

function makeIcon(cat, highlight) {
  var color = CATEGORY_COLORS[cat] || '#1A365D';
  var icon = CATEGORY_ICONS[cat] || '📍';
  return L.divIcon({
    html:'<div class="custom-marker" style="background:'+color+';transform:rotate(-45deg) '+(highlight?'scale(1.2)':'')+'"><span>'+icon+'</span></div>',
    className:'', iconSize:[36,36], iconAnchor:[18,36], popupAnchor:[0,-36]
  });
}

var markers = {};
var userMarker = null;

if (USER_LOC) {
  userMarker = L.marker([USER_LOC.lat, USER_LOC.lng], { icon: L.divIcon({ html: '<div class="pulse"></div>', className:'' }), zIndexOffset: 10000 }).addTo(map);
}

POINTS.forEach(function(p) {
  var isFrom = FROM_COORD && FROM_COORD.lat === p.lat && FROM_COORD.lng === p.lng;
  var isTo = TO_COORD && TO_COORD.lat === p.lat && TO_COORD.lng === p.lng;
  var m = L.marker([p.lat, p.lng], { icon:makeIcon(p.category, isFrom||isTo) }).addTo(map);
  var headerColor = CATEGORY_COLORS[p.category] || '#1A365D';
  var hoursHtml = p.hours ? '<span>🕐 '+p.hours+'</span>' : '';
  m.bindPopup(
    '<div><div class="popup-header" style="background:'+headerColor+'">'+(CATEGORY_ICONS[p.category]||'')+' '+p.name+'</div>'+
    '<div class="popup-body"><div class="popup-desc">'+p.description+'</div>'+
    '<div class="popup-meta">'+hoursHtml+'</div>'+
    '<button class="popup-btn" onclick="postNavigationMsg('+p.id+')">🧭 Directions</button>'+
    '</div></div>', { maxWidth:240 }
  );
  if (p.category === 'Faculty') {
    m.bindTooltip(p.name, {
      permanent: true,
      direction: 'top',
      offset: [0, -30],
      className: 'faculty-label',
      interactive: false
    });
  }
  markers[p.id] = m;
});

function postNavigationMsg(id) {
  var msg = JSON.stringify({type:'navigate',id:id});
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(msg);
  } else {
    window.parent.postMessage(msg, '*');
  }
}

function updateFacultyLabels() {
  var showLabels = map.getZoom() >= 16;
  POINTS.forEach(function(p) {
    if (p.category !== 'Faculty') return;
    var marker = markers[p.id];
    if (!marker) return;
    if (showLabels) {
      marker.openTooltip();
    } else {
      marker.closeTooltip();
    }
  });
}

map.on('zoomend', updateFacultyLabels);
updateFacultyLabels();

map.on('click', function(e) {
  var msg = JSON.stringify({ type: 'mapClick', lat: e.latlng.lat, lng: e.latlng.lng });
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
  else window.parent.postMessage(msg, '*');
});

if (FROM_COORD && TO_COORD) {
    L.Routing.control({
      waypoints: [
        L.latLng(FROM_COORD.lat, FROM_COORD.lng),
        L.latLng(TO_COORD.lat, TO_COORD.lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: function(i, wp) {
        return L.marker(wp.latLng, {
          icon: L.divIcon({
            html: '<div style="background:#2A69AC;width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 5px rgba(0,0,0,0.5)"></div>',
            className: '', iconSize: [12, 12], iconAnchor: [6, 6]
          })
        });
      },
      lineOptions: {
        styles: [{color: '#2A69AC', weight: 6, opacity: 0.85}],
        extendToWaypoints: true,
        missingRouteTolerance: 10
      }
    }).addTo(map);
}

document.addEventListener('message', handleMsg);
window.addEventListener('message', handleMsg);
function handleMsg(e) {
  try {
    var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    if (typeof data === 'string') data = JSON.parse(data);
    if (data.type==='filter') {
      var cat=data.category;
      var query=(data.query||'').toLowerCase().trim();
      POINTS.forEach(function(p){
        var m=markers[p.id]; if(!m) return;
        var matchesCategory = cat==='All'||p.category===cat;
        var matchesQuery = !query || p.name.toLowerCase().includes(query) || p.nameEn.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
        if(matchesCategory && matchesQuery){m.addTo(map);}else{m.remove();}
      });
    } else if (data.type==='focus') {
      var p=POINTS.find(function(pt){return pt.id===data.id;});
      if(p){map.setView([p.lat,p.lng],18,{animate:true}); markers[p.id]&&markers[p.id].openPopup();}
    } else if (data.type==='resetView') {
      map.setView([${CAMPUS_CENTER.lat},${CAMPUS_CENTER.lng}],16,{animate:true});
    } else if (data.type==='userLocation') {
      if (!userMarker) {
        userMarker = L.marker([data.loc.lat, data.loc.lng], { icon: L.divIcon({ html: '<div class="pulse"></div>', className:'' }), zIndexOffset: 10000 }).addTo(map);
      } else {
        userMarker.setLatLng([data.loc.lat, data.loc.lng]);
      }
    }
  } catch(err){}
}
</script>
</body>
</html>`;
};

interface Props { userRole?: 'student' | 'academic' | 'visitor'; }

export default function CampusMap({ userRole = 'student' }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [routeFrom, setRouteFrom] = useState<number | undefined>();
  const [routeTo, setRouteTo] = useState<number | undefined>();
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [routeMode, setRouteMode] = useState<'walking' | 'driving' | 'bus'>('walking');
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [useMyLoc, setUseMyLoc] = useState(false);
  const [fromSearch, setFromSearch] = useState('');
  const [routeResult, setRouteResult] = useState<any>(null);
  const [points, setPoints] = useState<CampusPoint[]>(CAMPUS_POINTS);
  const [mapHtml, setMapHtml] = useState(() => buildMapHTML(CAMPUS_POINTS));
  const [setupMode, setSetupMode] = useState(false);
  const [setupModal, setSetupModal] = useState(false);
  const [setupLat, setSetupLat] = useState(0);
  const [setupLng, setSetupLng] = useState(0);
  const [setupName, setSetupName] = useState('');
  const [setupCat, setSetupCat] = useState<Category>('Faculty');

  useEffect(() => {
    API.getMapConfig().then((data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        setPoints(data);
        setMapHtml(buildMapHTML(data, undefined, undefined, 'walking', myLocation));
      }
    });
  }, []);

  useEffect(() => {
    let sub: any;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Highest, timeInterval: 2000, distanceInterval: 5 }, (loc) => {
          const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setMyLocation(coords);
          sendMsg({ type: 'userLocation', loc: coords });
        });
      } catch (e) {}
    })();
    return () => { if (sub && sub.remove) sub.remove(); };
  }, []);

  const themeColor = userRole === 'academic' ? '#1A3A2A' : userRole === 'visitor' ? '#2D3748' : '#1A365D';
  const routeEstimate = useMemo(() => getRouteEstimate(points, routeFrom, routeTo), [points, routeFrom, routeTo]);

  const sendMsg = (msg: object) => {
    webViewRef.current?.injectJavaScript(
      `(function(){
        var e = new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(msg))}});
        document.dispatchEvent(e);
      })()`
    );
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) { sendMsg({ type: 'filter', category: activeCategory, query: '' }); return; }
    const lower = text.toLowerCase();
    const matched = points.filter(p =>
      p.name.toLowerCase().includes(lower) || p.nameEn.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower)
    );
    sendMsg({ type: 'filter', category: activeCategory, query: text });
    if (matched.length === 1) sendMsg({ type: 'focus', id: matched[0].id });
  };

  const suggestions = search.trim()
    ? points.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 4)
    : [];

  const handleCategory = (cat: Category) => {
    setActiveCategory(cat); setSearch('');
    sendMsg({ type: 'filter', category: cat, query: '' });
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'navigate') { setRouteFrom(undefined); setRouteTo(data.id); setShowRoutePanel(true); }
      if (data.type === 'mapClick' && setupMode) {
        setSetupLat(data.lat);
        setSetupLng(data.lng);
        setSetupName('');
        setSetupModal(true);
      }
    } catch {}
  };

  const applyRoute = async () => {
    const fromPoint = useMyLoc && myLocation
      ? { lat: myLocation.lat, lng: myLocation.lng, name: 'My Location' }
      : routeFrom ? { lat: points.find(p => p.id === routeFrom)!.lat, lng: points.find(p => p.id === routeFrom)!.lng, name: points.find(p => p.id === routeFrom)!.name } : null;
    const toPoint = routeTo ? points.find(p => p.id === routeTo) : null;
    if (!fromPoint || !toPoint) return;
    
    try {
      const result = await API.getRoutePlan({ mode: routeMode, origin: fromPoint, destination: { lat: toPoint.lat, lng: toPoint.lng, name: toPoint.name } });
      if (result?.success) {
        setRouteResult(result);
        setMapHtml(buildMapHTML(points, {lat: fromPoint.lat, lng: fromPoint.lng}, {lat: toPoint.lat, lng: toPoint.lng}, routeMode, myLocation));
        setShowRoutePanel(false); 
      }
    } catch {}
  };

  const handleUseMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Denied', 'Location permission is needed for this feature.'); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setMyLocation(coords);
      setUseMyLoc(true);
      setFromSearch('📍 My Location');
      setRouteFrom(undefined);
    } catch { Alert.alert('Error', 'Could not get your location.'); }
  };

  const fromSuggestions = fromSearch.trim() && !useMyLoc
    ? points.filter(p => p.name.toLowerCase().includes(fromSearch.toLowerCase()) || p.nameEn.toLowerCase().includes(fromSearch.toLowerCase())).slice(0, 4)
    : [];

  const clearRoute = () => {
    setRouteFrom(undefined); setRouteTo(undefined); setShowRoutePanel(false); setRouteResult(null);
    setMapHtml(buildMapHTML(points, undefined, undefined, 'walking', myLocation));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.searchBar, { backgroundColor: themeColor }]}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search buildings or places..." placeholderTextColor="#aaa" value={search} onChangeText={handleSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); sendMsg({ type: 'filter', category: activeCategory, query: '' }); }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.myLocBtn, setupMode && { backgroundColor: '#C53030' }, { marginRight: 6 }]} onPress={() => setSetupMode(!setupMode)}>
          <Text>{setupMode ? '🛑' : '⚙️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.myLocBtn} onPress={() => sendMsg({ type: 'resetView' })}>
          <Text>📍</Text>
        </TouchableOpacity>
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map(p => (
            <TouchableOpacity key={p.id} style={styles.suggestionItem} onPress={() => { setSearch(p.name); sendMsg({ type: 'focus', id: p.id }); }}>
              <Text style={styles.suggestionIcon}>{CATEGORIES.find(c => c.key === p.category)?.icon || '📍'}</Text>
              <View><Text style={styles.suggestionName}>{p.name}</Text><Text style={styles.suggestionDesc}>{p.description}</Text></View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.key} style={[styles.filterChip, activeCategory === cat.key && { backgroundColor: cat.color }]} onPress={() => handleCategory(cat.key)}>
            <Text style={styles.filterIcon}>{cat.icon}</Text>
            <Text style={[styles.filterLabel, activeCategory === cat.key && styles.filterLabelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        onMessage={handleWebViewMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}><Text style={styles.loadingText}>🗺️ Loading map...</Text></View>
        )}
      />

      {routeResult && !showRoutePanel && (
        <View style={styles.floatingRouteCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.floatingRouteTitle}>{routeMode === 'walking' ? '🚶 Walking' : routeMode === 'driving' ? '🚗 Driving' : '🚌 Bus'}</Text>
            <Text style={styles.floatingRouteEta}>{routeResult.etaLabel} • {routeResult.distanceLabel}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity style={[styles.floatingCloseBtn, { backgroundColor: '#2A69AC' }]} onPress={() => setShowRoutePanel(true)}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatingCloseBtn} onPress={clearRoute}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showRoutePanel && (
        <View style={styles.routePanel}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.routeTitle}>🧭 Route Planner</Text>
            <TouchableOpacity onPress={clearRoute}><Text style={{ color: '#A0AEC0', fontSize: 20 }}>✕</Text></TouchableOpacity>
          </View>

          {/* Transport Mode Selector */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {([['walking', '🚶', 'Walk'], ['driving', '🚗', 'Drive'], ['bus', '🚌', 'Bus']] as const).map(([mode, icon, label]) => (
              <TouchableOpacity key={mode} style={[styles.routeChip, { flex: 1, alignItems: 'center', paddingVertical: 8 }, routeMode === mode && styles.routeChipActive]} onPress={() => setRouteMode(mode as any)}>
                <Text style={{ fontSize: 16 }}>{icon}</Text>
                <Text style={[styles.routeChipText, routeMode === mode && styles.routeChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* From Field */}
          <View style={styles.routeRow}>
            <Text style={styles.routeLabel}>From</Text>
            <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
              <TextInput style={{ flex: 1, backgroundColor: '#F7FAFC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, borderWidth: 1, borderColor: '#E2E8F0', color: '#1A202C' }} placeholder="Search or use location..." placeholderTextColor="#A0AEC0" value={fromSearch} onChangeText={(t) => { setFromSearch(t); setUseMyLoc(false); }} />
              <TouchableOpacity style={{ backgroundColor: '#2A69AC', borderRadius: 8, paddingHorizontal: 10, justifyContent: 'center' }} onPress={handleUseMyLocation}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>📍 GPS</Text>
              </TouchableOpacity>
            </View>
          </View>
          {fromSuggestions.length > 0 && (
            <View style={{ marginBottom: 6 }}>
              {fromSuggestions.map(p => (
                <TouchableOpacity key={p.id} style={{ paddingVertical: 6, paddingHorizontal: 8 }} onPress={() => { setRouteFrom(p.id); setFromSearch(p.name); }}>
                  <Text style={{ fontSize: 12, color: '#1A365D' }}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* To Field */}
          <View style={styles.routeRow}>
            <Text style={styles.routeLabel}>To</Text>
            <Text style={styles.routeToText}>{routeTo ? points.find(p => p.id === routeTo)?.name : 'Select destination on map'}</Text>
          </View>

          {/* Route Result */}
          {routeResult && (
            <View style={{ marginBottom: 10 }}>
              <View style={styles.routeMetaCard}>
                <View style={styles.routeMetaItem}>
                  <Text style={styles.routeMetaLabel}>Distance</Text>
                  <Text style={styles.routeMetaValue}>{routeResult.distanceLabel}</Text>
                </View>
                <View style={styles.routeMetaItem}>
                  <Text style={styles.routeMetaLabel}>ETA</Text>
                  <Text style={styles.routeMetaValue}>{routeResult.etaLabel}</Text>
                </View>
              </View>
            </View>
          )}

          {!routeResult && routeEstimate && (
            <View style={styles.routeMetaCard}>
              <View style={styles.routeMetaItem}>
                <Text style={styles.routeMetaLabel}>Estimated distance</Text>
                <Text style={styles.routeMetaValue}>{routeEstimate.distanceLabel}</Text>
              </View>
              <View style={styles.routeMetaItem}>
                <Text style={styles.routeMetaLabel}>Walk time</Text>
                <Text style={styles.routeMetaValue}>{routeEstimate.durationLabel}</Text>
              </View>
            </View>
          )}

          <View style={styles.routeActions}>
            <TouchableOpacity style={[styles.routeBtn, ((!routeFrom && !useMyLoc) || !routeTo) && styles.routeBtnDisabled]} onPress={applyRoute} disabled={(!routeFrom && !useMyLoc) || !routeTo}>
              <Text style={styles.routeBtnText}>🚩 Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={setupModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A365D', marginBottom: 12 }}>Drop a Pin</Text>
            <Text style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>Lat: {setupLat.toFixed(5)}, Lng: {setupLng.toFixed(5)}</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, marginBottom: 12 }} placeholder="Location Name (e.g. Fen Fakültesi)" value={setupName} onChangeText={setSetupName} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, maxHeight: 40 }}>
              {CATEGORIES.filter(c => c.key !== 'All').map(cat => (
                <TouchableOpacity key={cat.key} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: setupCat === cat.key ? '#1A365D' : '#EDF2F7', marginRight: 8 }} onPress={() => setSetupCat(cat.key)}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: setupCat === cat.key ? '#fff' : '#4A5568' }}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, padding: 12, backgroundColor: '#EDF2F7', borderRadius: 8, alignItems: 'center' }} onPress={() => setSetupModal(false)}>
                <Text style={{ fontWeight: '600', color: '#4A5568' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 12, backgroundColor: '#2A69AC', borderRadius: 8, alignItems: 'center' }} onPress={async () => {
                if (!setupName.trim()) { Alert.alert('Enter name'); return; }
                const newPoint = { id: Date.now(), name: setupName, nameEn: setupName, category: setupCat, lat: setupLat, lng: setupLng, description: 'Added by setup mode' };
                const updated = [...points, newPoint];
                setPoints(updated);
                setMapHtml(buildMapHTML(updated, undefined, undefined, 'walking', myLocation));
                setSetupModal(false);
                await API.saveMapConfig(updated);
                Alert.alert('Saved!', 'Location has been saved permanently.');
              }}>
                <Text style={{ fontWeight: '600', color: '#fff' }}>Save Pin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 10, height: 38 },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  clearBtn: { color: '#aaa', fontSize: 14, paddingLeft: 6 },
  myLocBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  suggestions: { backgroundColor: '#fff', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, zIndex: 100 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, gap: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  suggestionIcon: { fontSize: 20 },
  suggestionName: { fontSize: 13, fontWeight: '600', color: '#1A365D' },
  suggestionDesc: { fontSize: 11, color: '#888', marginTop: 1 },
  filterBar: { maxHeight: 48, backgroundColor: '#fff', elevation: 2 },
  filterBarContent: { paddingHorizontal: 8, paddingVertical: 6, gap: 6 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#f0f4f8' },
  filterIcon: { fontSize: 14 },
  filterLabel: { fontSize: 12, fontWeight: '500', color: '#555' },
  filterLabelActive: { color: '#fff', fontWeight: '700' },
  map: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f8' },
  loadingText: { fontSize: 16, color: '#555' },
  routePanel: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 12, maxHeight: 480 },
  routeTitle: { fontSize: 16, fontWeight: '700', color: '#1A365D', marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  routeLabel: { fontSize: 12, fontWeight: '600', color: '#555', width: 64 },
  routeToText: { fontSize: 13, fontWeight: '600', color: '#1A365D' },
  routeChips: { flexDirection: 'row', gap: 6 },
  routeChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#f0f4f8', borderWidth: 1, borderColor: '#ddd' },
  routeChipActive: { backgroundColor: '#1A365D', borderColor: '#1A365D' },
  routeChipText: { fontSize: 11, color: '#555' },
  routeChipTextActive: { color: '#fff', fontWeight: '600' },
  routeMetaCard: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  routeMetaItem: { flex: 1, backgroundColor: '#F7FAFC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  routeMetaLabel: { fontSize: 11, color: '#718096', marginBottom: 4 },
  routeMetaValue: { fontSize: 15, fontWeight: '700', color: '#1A365D' },
  routeActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  routeBtn: { flex: 1, backgroundColor: '#2A69AC', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  routeBtnDisabled: { opacity: 0.4 },
  routeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  routeBtnClear: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  routeBtnClearText: { color: '#666', fontSize: 14 },
  floatingRouteCard: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  floatingRouteTitle: { fontSize: 13, fontWeight: '700', color: '#1A365D', marginBottom: 2 },
  floatingRouteEta: { fontSize: 11, color: '#718096' },
  floatingCloseBtn: { backgroundColor: '#C53030', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
});
