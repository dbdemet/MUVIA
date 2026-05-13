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
        <Text style={st.wizardTxt}>🎓 First time visiting? →</Text>
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
  const PURPOSES: { key: string; icon: string; label: string; desc: string }[] = [
    { key: 'registration', icon: '📋', label: 'Registration', desc: 'Enrollment & student affairs' },
    { key: 'examination', icon: '📝', label: 'Examination', desc: 'Exam halls & schedules' },
    { key: 'tour', icon: '🏛️', label: 'Campus Tour', desc: 'Explore the campus' },
    { key: 'parking', icon: '🅿️', label: 'Parking', desc: 'Find a parking spot' },
  ];

  const BUILDINGS: Record<string, { name: string; desc: string }[]> = {
    'registration': [{ name: 'Registrar Office', desc: 'Main building, ground floor' }, { name: 'Student Affairs', desc: 'Administration building, 2nd floor' }],
    'examination': [{ name: 'Exam Hall A', desc: 'Engineering Faculty, Block C' }, { name: 'Exam Hall B', desc: 'Science Faculty, Block A' }],
    'tour': [{ name: 'Main Gate (Entrance)', desc: 'Start of the campus tour route' }, { name: 'Central Library', desc: 'Main campus library & study areas' }, { name: 'Student Center', desc: 'Dining, clubs & social hub' }],
    'parking': [{ name: 'North Parking Lot', desc: 'Near Engineering Faculty — 200 spots' }, { name: 'South Parking Lot', desc: 'Near Student Center — 150 spots' }],
  };

  const TIPS: Record<string, string[]> = {
    'registration': ['Bring your ID and documents.', 'Registrar hours: 08:30 – 17:00 (Mon–Fri).', 'Student Affairs closes at 16:30.'],
    'examination': ['Check your exam room assignment on SABIS.', 'Arrive at least 15 minutes early.', 'No electronic devices in exam halls.'],
    'tour': ['The full campus tour takes about 45 minutes on foot.', 'Free Wi-Fi is available across campus.', 'Visit the cafeteria for affordable meals.'],
    'parking': ['Parking fee: ₺20/day for visitors.', 'North lot fills up by 09:00 on weekdays.', 'Accessible parking available near all buildings.'],
  };

  const stepLabels = ['Purpose', 'Locations', 'Navigate', 'Tips'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#2D3748' }}>🎓 Visitor Guide</Text>
            <TouchableOpacity onPress={() => { setStep(1); setChoice(null); onClose(); }} style={{ padding: 4 }}><Text style={{ fontSize: 18 }}>✕</Text></TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
            {stepLabels.map((lbl, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View style={{ height: 4, width: '100%', borderRadius: 2, backgroundColor: step >= i + 1 ? '#2D3748' : '#E2E8F0' }} />
                <Text style={{ fontSize: 9, color: step >= i + 1 ? '#2D3748' : '#A0AEC0', fontWeight: '600' }}>{lbl}</Text>
              </View>
            ))}
          </View>

          {/* Step 1: Purpose */}
          {step === 1 && (
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D3748', marginBottom: 10 }}>What brings you to campus?</Text>
              {PURPOSES.map(opt => (
                <TouchableOpacity key={opt.key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: choice === opt.key ? '#2D3748' : '#F7FAFC', marginBottom: 8, gap: 12, borderWidth: 1, borderColor: choice === opt.key ? '#2D3748' : '#E2E8F0' }} onPress={() => setChoice(opt.key)}>
                  <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: choice === opt.key ? '#FFF' : '#1A202C', fontWeight: '700', fontSize: 14 }}>{opt.label}</Text>
                    <Text style={{ color: choice === opt.key ? 'rgba(255,255,255,0.7)' : '#718096', fontSize: 11 }}>{opt.desc}</Text>
                  </View>
                  {choice === opt.key && <Text style={{ color: '#FFF', fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 2: Relevant buildings */}
          {step === 2 && (
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D3748', marginBottom: 10 }}>Relevant Locations</Text>
              {(BUILDINGS[choice || 'registration'] || []).map((b, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: '#F7FAFC', marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: '#1A202C', fontSize: 13 }}>{b.name}</Text>
                    <Text style={{ color: '#718096', fontSize: 11 }}>{b.desc}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { onTab('map'); onClose(); setStep(1); setChoice(null); }} style={{ backgroundColor: '#2D3748', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>📍 Show on Map</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Step 3: Navigation */}
          {step === 3 && (
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D3748', marginBottom: 10 }}>Need Directions?</Text>
              <Text style={{ color: '#718096', fontSize: 13, marginBottom: 14, lineHeight: 20 }}>Use our interactive campus map to plan your route. You can choose walking, driving, or bus mode.</Text>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, backgroundColor: '#2D3748', gap: 8 }} onPress={() => { onTab('map'); onClose(); setStep(1); setChoice(null); }}>
                <Text style={{ fontSize: 18 }}>🗺️</Text>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Open Campus Map</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, backgroundColor: '#EBF4FF', gap: 8, marginTop: 8 }} onPress={() => { onTab('assistant'); onClose(); setStep(1); setChoice(null); }}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
                <Text style={{ color: '#2A69AC', fontWeight: '700', fontSize: 14 }}>Ask AI Assistant</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: Tips */}
          {step === 4 && (
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D3748', marginBottom: 10 }}>Important Tips</Text>
              {(TIPS[choice || 'registration'] || []).map((tip, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <Text style={{ color: '#2D3748', fontSize: 14 }}>•</Text>
                  <Text style={{ color: '#4A5568', fontSize: 13, flex: 1, lineHeight: 20 }}>{tip}</Text>
                </View>
              ))}
              <View style={{ backgroundColor: '#F0FFF4', borderRadius: 12, padding: 12, marginTop: 6 }}>
                <Text style={{ color: '#276749', fontSize: 12, fontWeight: '600' }}>🕐 Campus hours: 08:00 – 22:00 daily</Text>
                <Text style={{ color: '#276749', fontSize: 12, marginTop: 4 }}>📶 Free Wi-Fi: MSKU-Guest (no password)</Text>
              </View>
            </View>
          )}

          {/* Navigation buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
            <TouchableOpacity onPress={() => { if (step > 1) setStep(step - 1); }} style={{ opacity: step === 1 ? 0.3 : 1, paddingVertical: 8, paddingHorizontal: 12 }} disabled={step === 1}>
              <Text style={{ color: '#718096', fontWeight: '600' }}>← Back</Text>
            </TouchableOpacity>
            <Text style={{ color: '#A0AEC0', fontSize: 12 }}>{step} / 4</Text>
            {step < 4 ? (
              <TouchableOpacity onPress={() => { if (step === 1 && !choice) { Alert.alert('Select an option', 'Please choose your visit purpose first.'); return; } setStep(step + 1); }} style={{ backgroundColor: '#2D3748', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 }}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => { setStep(1); setChoice(null); onClose(); }} style={{ backgroundColor: '#276749', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 }}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Done ✓</Text>
              </TouchableOpacity>
            )}
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