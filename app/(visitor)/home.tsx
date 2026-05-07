import { Alert, BackHandler, Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Image, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore, type AuthStore } from '../../store/useAuthStore';
import AIAssistant from '../../components/AIAssistant';
import CampusMap from '../../components/CampusMap';
import * as API from '../../services/api';

type Tab = 'home' | 'map' | 'events' | 'transport' | 'assistant';

export default function VisitorHome() {
  const router = useRouter();
  const login = useAuthStore((s: AuthStore) => s.login);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [reminders, setReminders] = useState<string[]>([]);
  useEffect(() => { login({ name: 'Visitor', email: '', role: 'visitor' }); }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab !== 'home') { setActiveTab('home'); return true; } return false;
    });
    return () => sub.remove();
  }, [activeTab]);
  const addReminder = (id: string, title: string) => {
    if (reminders.includes(id)) { Alert.alert('Reminder Set', `You already have a reminder for "${title}".`); return; }
    setReminders(p => [...p, id]);
    Alert.alert('🔔 Reminder Set', `You'll be notified 1 hour before "${title}" starts.`);
  };
  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2D3748" />
      <View style={st.content}>
        {activeTab === 'home' && <HomeTab onTab={setActiveTab} router={router} />}
        {activeTab === 'map' && <CampusMap userRole="visitor" />}
        {activeTab === 'events' && <EventsTab onRemind={addReminder} reminders={reminders} />}
        {activeTab === 'transport' && <TransportTab />}
        {activeTab === 'assistant' && <AIAssistant userRole="visitor" userName="Visitor" />}
      </View>
      <View style={st.tabBar}>
        {([{ key: 'home', icon: '🏠', label: 'Home' }, { key: 'map', icon: '🗺️', label: 'Map' }, { key: 'events', icon: '📅', label: 'Events' }, { key: 'transport', icon: '🚌', label: 'Transport' }, { key: 'assistant', icon: '🤖', label: 'Assistant' }] as { key: Tab; icon: string; label: string }[]).map(tab => (
          <TouchableOpacity key={tab.key} style={st.tabItem} onPress={() => setActiveTab(tab.key)}>
            <Text style={st.tabIcon}>{tab.icon}</Text>
            <Text style={[st.tabLabel, activeTab === tab.key && st.tabLabelActive]}>{tab.label}</Text>
            {activeTab === tab.key && <View style={st.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function HomeTab({ onTab, router }: any) {
  const [events, setEvents] = useState<any[]>([]);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardChoice, setWizardChoice] = useState<string | null>(null);
  const evScrollRef = useRef<ScrollView>(null);
  const evIdx = useRef(0);
  const screenW = Dimensions.get('window').width - 56;
  useEffect(() => { API.getEvents().then(d => d && setEvents(d)); }, []);
  useEffect(() => {
    if (events.length < 2) return;
    const timer = setInterval(() => {
      evIdx.current = (evIdx.current + 1) % events.length;
      setActiveEventIndex(evIdx.current);
      evScrollRef.current?.scrollTo({ x: evIdx.current * (screenW + 12), animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [events]);
  const FACILITIES = [
    { name: 'Main Library', icon: '📚', hours: 'Open · Until 22:00' },
    { name: 'Central Cafeteria', icon: '🍽️', hours: 'Open · Until 20:00' },
    { name: 'Sports Complex', icon: '⚽', hours: 'Open · Until 22:00' },
    { name: 'Health Center', icon: '🏥', hours: 'Open · Until 17:00' },
  ];
  return (
    <ScrollView style={st.scroll} showsVerticalScrollIndicator={false}>
      <View style={st.dashHeader}>
        <View><Text style={st.dashGreeting}>Welcome 🏛️</Text><Text style={st.dashName}>MUVIA Campus</Text></View>
        <TouchableOpacity style={st.signInBtn} onPress={() => router.replace('/')}><Text style={st.signInTxt}>Sign In</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={st.wizardBtn} onPress={() => setWizardVisible(true)}>
        <Text style={st.wizardTxt}>🎓 İlk kez mi geldiniz? →</Text>
      </TouchableOpacity>
      <View style={st.infoBanner}><Text style={{ fontSize: 16 }}>ℹ️</Text><Text style={st.infoBannerTxt}>You're in visitor mode. Sign in for academic features.</Text></View>
      <Text style={st.sectionTitle}>Quick Access</Text>
      <View style={st.quickGrid}>
        {[{ i: '🗺️', l: 'Campus Map', t: 'map' }, { i: '📅', l: 'Events', t: 'events' }, { i: '🚌', l: 'Bus Times', t: 'transport' }, { i: '🤖', l: 'Ask AI', t: 'assistant' }].map((item, i) => (
          <TouchableOpacity key={i} style={st.quickCard} onPress={() => onTab(item.t)}><Text style={{ fontSize: 26 }}>{item.i}</Text><Text style={st.quickLabel}>{item.l}</Text></TouchableOpacity>
        ))}
      </View>
      <Text style={st.sectionTitle}>Upcoming Events</Text>
      <ScrollView
        ref={evScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={screenW + 12}
        style={{ marginBottom: 8 }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (screenW + 12));
          evIdx.current = index;
          setActiveEventIndex(index);
        }}
      >
        {events.map((ev: any) => (
          <TouchableOpacity key={ev.id} style={[st.eventPoster, { width: screenW }]} onPress={() => onTab('events')} activeOpacity={0.9}>
            <View style={st.posterMedia}>
              {ev.imageUrl ? (
                <Image source={{ uri: `${API.API_BASE_URL}${ev.imageUrl}` }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <View style={st.posterFallbackIconWrap}>
                  <Text style={st.posterFallbackIcon}>{ev.icon || '🎫'}</Text>
                </View>
              )}
              <View style={st.posterMediaOverlay}>
                <View style={st.typeBadgeOverlay}>
                  <Text style={st.typeBadgeOverlayText}>{ev.category}</Text>
                </View>
              </View>
            </View>
            <View style={st.posterBody}>
              <Text style={st.posterTitle}>{ev.title}</Text>
              <Text style={st.posterDesc} numberOfLines={3}>{ev.description}</Text>
              <View style={st.posterMeta}>
                <Text style={st.posterMetaText}>📅 {ev.date}</Text>
                <Text style={st.posterMetaText}>🕐 {ev.time}</Text>
                <Text style={st.posterMetaText}>📍 {ev.location}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {events[activeEventIndex] && (
        <View style={st.posterInfoBox}>
          <Text style={st.posterInfoTitle}>Event Info</Text>
          <Text style={st.posterInfoText} numberOfLines={3}>{events[activeEventIndex].description}</Text>
        </View>
      )}
      <Text style={st.sectionTitle}>Campus Facilities</Text>
      {FACILITIES.map((f, i) => (
        <View key={i} style={st.spotCard}><Text style={{ fontSize: 24 }}>{f.icon}</Text><View style={{ flex: 1 }}><Text style={st.spotName}>{f.name}</Text><Text style={{ color: '#718096', fontSize: 12 }}>{f.hours}</Text></View></View>
      ))}
      <View style={{ height: 24 }} />
      <WizardModal visible={wizardVisible} step={wizardStep} choice={wizardChoice} onClose={() => setWizardVisible(false)} setStep={setWizardStep} setChoice={setWizardChoice} onTab={onTab} />
    </ScrollView>
  );
}

function EventsTab({ onRemind, reminders }: any) {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  useEffect(() => { API.getEvents().then(d => d && setEvents(d)); }, []);
  const types = ['All', 'Conference', 'Culture', 'Career', 'Sports', 'Workshop', 'Social'];
  const filtered = filter === 'All' ? events : events.filter((e: any) => e.category === filter);
  return (
    <View style={st.tabContent}><Text style={st.tabTitle}>Events</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>{types.map(t => (
          <TouchableOpacity key={t} style={[st.filterChip, filter === t && st.filterChipActive]} onPress={() => setFilter(t)}>
            <Text style={[st.filterChipTxt, filter === t && { color: '#FFF', fontWeight: '700' }]}>{t}</Text>
          </TouchableOpacity>
        ))}</View>
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.map((ev: any) => (
          <View key={ev.id} style={st.fullEventCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}><Text style={{ fontSize: 28 }}>{ev.icon}</Text><View style={st.typeBadge}><Text style={{ color: '#2D3748', fontSize: 11, fontWeight: '600' }}>{ev.category}</Text></View></View>
            <Text style={st.fullEventTitle}>{ev.title}</Text>
            <Text style={{ color: '#718096', fontSize: 12, marginBottom: 4 }}>📅 {ev.date?.slice(5)} · 🕐 {ev.time}</Text>
            <Text style={{ color: '#718096', fontSize: 12, marginBottom: 14 }}>📍 {ev.location}</Text>
            <TouchableOpacity style={[st.remindBtn, reminders.includes(ev.id) && st.remindBtnActive]} onPress={() => onRemind(ev.id, ev.title)}>
              <Text style={{ color: reminders.includes(ev.id) ? '#276749' : '#2A69AC', fontSize: 13, fontWeight: '600' }}>{reminders.includes(ev.id) ? '✅ Reminder Set' : '🔔 Set Reminder'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function WizardModal({ visible, step, choice, onClose, setStep, setChoice, onTab }: any) {
  const BUILDINGS: Record<string, any[]> = {
    'Kayıt': [{name:'Registrar Office', id:101},{name:'Student Affairs', id:102}],
    'Sınav': [{name:'Exam Hall A', id:201},{name:'Exam Hall B', id:202}],
    'Kampüs Turu': [{name:'Main Gate', id:301},{name:'Library', id:302}],
    'Otopark': [{name:'North Parking', id:401},{name:'South Parking', id:402}]
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding:20 }}>
        <View style={{ backgroundColor:'#FFF', borderRadius:16, padding:16 }}>
          <Text style={{ fontSize:16, fontWeight:'800', color:'#2D3748', marginBottom:8 }}>Hoşgeldiniz — Ziyaretçi Yönlendirme</Text>
          {step === 1 && (
            <View>
              <Text style={{ marginBottom:8 }}>Ne için geldiniz?</Text>
              {['Kayıt','Sınav','Kampüs Turu','Otopark'].map(opt => (
                <TouchableOpacity key={opt} style={{ padding:12, borderRadius:10, backgroundColor: choice===opt ? '#2D3748' : '#F7FAFC', marginBottom:8 }} onPress={() => setChoice(opt)}>
                  <Text style={{ color: choice===opt ? '#FFF' : '#1A202C', fontWeight:'700' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {step === 2 && (
            <View>
              <Text style={{ marginBottom:8 }}>İlgili binalar</Text>
              {(BUILDINGS[choice || 'Kayıt'] || []).map(b => (
                <View key={b.id} style={{ flexDirection:'row', justifyContent:'space-between', padding:8, borderRadius:8, backgroundColor:'#F7FAFC', marginBottom:6 }}>
                  <Text>{b.name}</Text>
                  <TouchableOpacity onPress={() => { onTab('map'); onClose(); }} style={{ backgroundColor:'#2D3748', paddingHorizontal:10, paddingVertical:6, borderRadius:8 }}><Text style={{ color:'#fff' }}>Haritada Göster</Text></TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {step === 3 && (
            <View>
              <Text style={{ marginBottom:8 }}>Rota çizmek ister misiniz?</Text>
              <TouchableOpacity style={{ padding:12, borderRadius:10, backgroundColor:'#E6FFFA' }} onPress={() => { onTab('map'); onClose(); }}><Text style={{ fontWeight:'700' }}>Rota Çiz</Text></TouchableOpacity>
            </View>
          )}
          {step === 4 && (
            <View>
              <Text style={{ marginBottom:8 }}>Önemli Notlar</Text>
              <Text style={{ color:'#718096', fontSize:13 }}>Çalışma saatleri: 08:00 - 20:00. Otopark ücretlidir. Kütüphane kart gerekir.</Text>
            </View>
          )}

          <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:12 }}>
            <TouchableOpacity onPress={() => setStep(Math.max(1, step-1))} style={{ padding:10 }}><Text style={{ color:'#718096' }}>Geri</Text></TouchableOpacity>
            <View style={{ flexDirection:'row', gap:8 }}>
              <TouchableOpacity onPress={() => { setStep(Math.min(4, step+1)); }} style={{ padding:10 }}><Text style={{ color:'#2D3748', fontWeight:'700' }}>İleri</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep(1); setChoice(null); onClose(); }} style={{ padding:10 }}><Text style={{ color:'#C53030' }}>Kapat</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TransportTab() {
  const routes = [
    { route: 'Campus → City Center', next: 5, freq: 'Every 20 min', status: 'on-time' },
    { route: 'City Center → Campus', next: 12, freq: 'Every 20 min', status: 'on-time' },
    { route: 'Campus → Kotekli', next: 3, freq: 'Every 15 min', status: 'delayed' },
    { route: 'Campus → Mugla Station', next: 28, freq: 'Every 60 min', status: 'on-time' },
  ];
  return (
    <View style={st.tabContent}><Text style={st.tabTitle}>Transportation</Text>
      <View style={st.liveBox}><View style={st.liveDot} /><Text style={{ flex: 1, color: '#276749', fontSize: 13, fontWeight: '600' }}>Live bus tracking</Text></View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={st.sectionTitle}>Bus Routes</Text>
        {routes.map((b, i) => (
          <View key={i} style={st.busCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}><Text style={{ fontSize: 24 }}>🚌</Text><View><Text style={{ color: '#1A202C', fontSize: 13, fontWeight: '600' }}>{b.route}</Text><Text style={{ color: '#718096', fontSize: 11 }}>{b.freq}</Text></View></View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ color: b.status === 'delayed' ? '#C53030' : '#276749', fontSize: 20, fontWeight: '800' }}>{b.next} min</Text>
              <View style={{ backgroundColor: b.status === 'delayed' ? '#FFF5F5' : '#F0FFF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: b.status === 'delayed' ? '#C53030' : '#276749', fontSize: 10, fontWeight: '700' }}>{b.status === 'delayed' ? 'Delayed' : 'On Time'}</Text>
              </View>
            </View>
          </View>
        ))}
        <Text style={st.sectionTitle}>Other Transport</Text>
        <TouchableOpacity style={st.busCard} onPress={() => Linking.openURL('tel:+902522111234').catch(() => {})}>
          <Text style={{ fontSize: 22 }}>🚕</Text><View style={{ flex: 1 }}><Text style={{ color: '#1A202C', fontSize: 14, fontWeight: '600' }}>Call Taxi</Text><Text style={{ color: '#718096', fontSize: 11 }}>Campus taxi line</Text></View><Text style={{ fontSize: 18 }}>📞</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const D = '#2D3748';
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' }, content: { flex: 1 }, scroll: { flex: 1, paddingHorizontal: 16 }, tabContent: { flex: 1, paddingHorizontal: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: D, paddingBottom: 8, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 }, tabIcon: { fontSize: 20 },
  tabLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '500' }, tabLabelActive: { color: '#FFF' },
  tabDot: { position: 'absolute', bottom: -8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#90CDF4' },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 12 },
  dashGreeting: { color: '#718096', fontSize: 14 }, dashName: { color: D, fontSize: 22, fontWeight: '800' },
  signInBtn: { backgroundColor: D, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }, signInTxt: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  wizardBtn: { marginTop: 8, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', alignSelf: 'flex-start' },
  wizardTxt: { color: '#2D3748', fontWeight: '700' },
  infoBanner: { backgroundColor: '#EBF4FF', borderRadius: 12, flexDirection: 'row', padding: 12, gap: 10, marginBottom: 4 }, infoBannerTxt: { flex: 1, color: '#2A69AC', fontSize: 12 },
  sectionTitle: { color: D, fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 10 }, tabTitle: { color: D, fontSize: 22, fontWeight: '800', paddingTop: 24, paddingBottom: 16 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, elevation: 2 },
  quickLabel: { color: D, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  eventPoster: { backgroundColor: '#FFF', borderRadius: 18, marginRight: 12, overflow: 'hidden', elevation: 4 },
  posterMedia: { height: 148, backgroundColor: '#2D3748' },
  posterMediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)', padding: 12, justifyContent: 'flex-end' },
  posterBody: { padding: 14, gap: 8, backgroundColor: '#FFF' },
  posterTitle: { color: '#2D3748', fontSize: 18, fontWeight: '800', lineHeight: 24 },
  posterDesc: { color: '#4A5568', fontSize: 12, lineHeight: 18 },
  posterMeta: { flexDirection: 'row', gap: 10, marginTop: 2, flexWrap: 'wrap' },
  posterMetaText: { color: '#718096', fontSize: 11, fontWeight: '600' },
  posterFallbackIconWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  posterFallbackIcon: { fontSize: 40 },
  typeBadgeOverlay: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  typeBadgeOverlayText: { color: '#2D3748', fontSize: 11, fontWeight: '700' },
  posterInfoBox: { backgroundColor: '#EDF2F7', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#2D3748' },
  posterInfoTitle: { color: '#2D3748', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  posterInfoText: { color: '#2D3748', fontSize: 12, lineHeight: 18 },
  spotCard: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 12, elevation: 2 },
  spotName: { color: '#1A202C', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  filterChip: { backgroundColor: '#EDF2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  filterChipActive: { backgroundColor: D }, filterChipTxt: { color: '#718096', fontSize: 13, fontWeight: '500' },
  fullEventCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  typeBadge: { backgroundColor: '#EDF2F7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  fullEventTitle: { color: '#1A202C', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  remindBtn: { backgroundColor: '#EBF4FF', borderRadius: 10, padding: 10, alignItems: 'center' }, remindBtnActive: { backgroundColor: '#F0FFF4' },
  liveBox: { backgroundColor: '#F0FFF4', borderRadius: 12, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38A169' },
  busCard: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 10, elevation: 2 },
});