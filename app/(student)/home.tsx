import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, BackHandler, Modal, TextInput, Alert, Dimensions, Image, DeviceEventEmitter, Linking, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useAuthStore, type AuthStore } from '../../store/useAuthStore';
import AIAssistant from '../../components/AIAssistant';
import CampusMap from '../../components/CampusMap';
import SettingsModal from '../../components/AccessibilitySettingsModal';
import * as API from '../../services/api';
import { t } from '../../constants/i18n';
import { getTheme } from '../../constants/theme';

type Tab = 'home' | 'schedule' | 'messages' | 'map' | 'assistant' | 'profile' | 'directory';

const ACADEMIC_STATUS: Record<string, { label: string; color: string; icon: string }> = {
  available: { label: 'Available', color: '#276749', icon: '✅' },
  'in-meeting': { label: 'In Meeting', color: '#B7791F', icon: '🟡' },
  away: { label: 'Away', color: '#C53030', icon: '🔴' },
  'on-leave': { label: 'On Leave', color: '#718096', icon: '⛔' },
};

export default function StudentHome() {
  const router = useRouter();
  const user = useAuthStore((s: AuthStore) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab !== 'home') { setActiveTab('home'); return true; }
      return false;
    });
    const subChat = DeviceEventEmitter.addListener('OPEN_CHAT', () => {
      setActiveTab('messages');
    });
    return () => { sub.remove(); subChat.remove(); };
  }, [activeTab]);
  const theme = useAuthStore((s: AuthStore) => s.theme);
  const blueLightFilter = useAuthStore((s: AuthStore) => s.blueLightFilter);
  const lang = useAuthStore((s: AuthStore) => s.language);
  const colors = getTheme(theme);
  return (
    <SafeAreaView style={[st.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.tabBar} />
      <View style={st.content}>
        {activeTab === 'home' && <HomeTab />}

        {activeTab === 'schedule' && <ScheduleTab />}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'map' && <CampusMap userRole="student" />}
        {activeTab === 'assistant' && <AIAssistant userRole="student" userName={user?.name} userEmail={user?.email} />}
        {activeTab === 'profile' && <ProfileTab router={router} />}
      </View>
      <View style={[st.tabBar, { backgroundColor: colors.tabBar }]}>
        {([
          { key: 'home', icon: '🏠', label: t('nav.home') },
          { key: 'schedule', icon: '📅', label: t('nav.schedule') },
          { key: 'messages', icon: '💬', label: t('nav.messages') },
          { key: 'map', icon: '🗺️', label: t('nav.map') },
          { key: 'assistant', icon: '🤖', label: t('nav.assistant') },
          { key: 'profile', icon: '👤', label: t('nav.profile') },
        ] as { key: Tab; icon: string; label: string }[]).map(tab => (
          <TouchableOpacity key={tab.key} style={st.tabItem} onPress={() => setActiveTab(tab.key)}>
            <Text style={st.tabIcon}>{tab.icon}</Text>
            <Text style={[st.tabLabel, activeTab === tab.key && st.tabLabelActive]}>{tab.label}</Text>
            {activeTab === tab.key && <View style={st.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>
      {blueLightFilter && <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,180,50,0.15)', zIndex: 9999 }} />}
    </SafeAreaView>
  );
}

function HomeTab() {
  const user = useAuthStore((s: AuthStore) => s.user);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnns] = useState<any[]>([]);
  const [meal, setMeal] = useState<any>(null);
  const [myRating, setMyRating] = useState(0);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [complaintModal, setComplaintModal] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [sportsModal, setSportsModal] = useState(false);
  const [sportsTitle, setSportsTitle] = useState('');
  const [sportsDesc, setSportsDesc] = useState('');
  const [sportsSlots, setSportsSlots] = useState('3');
  const [qrModal, setQrModal] = useState(false);
  const [academics, setAcademics] = useState<any[]>([]);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [communityClubs, setCommunityClubs] = useState<any[]>([]);
  const [sportsBoard, setSportsBoard] = useState<any[]>([]);
  const [clubChatModal, setClubChatModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [clubMessages, setClubMessages] = useState<any[]>([]);
  const [clubChatInput, setClubChatInput] = useState('');
  const [clubPollingInterval, setClubPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [annDetailModal, setAnnDetailModal] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState<any>(null);
  const evIdx = useRef(0);
  const evScrollRef = useRef<ScrollView>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const screenW = Dimensions.get('window').width - 56;

  useEffect(() => {
    API.getStudentSchedule(user?.id || 's1', user?.email).then(d => d && setSchedule(d));
    API.getStudentExams(user?.id || 's1', user?.email).then(d => d && setExams(d));
    API.getAnnouncements().then(d => d && setAnns(d));
    API.getTodayMeal().then(d => d && setMeal((p: any) => ({ ...p, today: d })));
    API.getWeeklyMeals().then(d => {
      if (Array.isArray(d)) setMeal((p: any) => ({ ...p, weekly: d }));
    });
    API.getAcademics(user?.department).then(d => d && setAcademics(d));
    API.getSportsBoard().then(d => Array.isArray(d) && setSportsBoard(d));
    if (user?.email) {
      API.getCommunityClubs(user.email).then((d) => Array.isArray(d) && setCommunityClubs(d));
    }
  }, [user?.id, user?.email]);
  const [mealTab, setMealTab] = useState<'today'|'week'>('today');
  const [weather, setWeather] = useState<{temp:number,code:number,wind:number,rain:number}|null>(null);

  useEffect(() => {
    // fetch weather (Ephesus area coordinates from prompt)
    (async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.1630&longitude=28.3720&current_weather=true&hourly=temperature_2m,precipitation,windspeed_10m,weathercode&timezone=Europe%2FIstanbul');
        const j = await res.json();
        if (j && j.current_weather) {
          setWeather({ temp: Math.round(j.current_weather.temperature), code: j.current_weather.weathercode || 0, wind: Math.round(j.current_weather.windspeed || 0), rain: (j.hourly && j.hourly.precipitation && j.hourly.precipitation[0]) || 0 });
        }
      } catch (e) { }
    })();
    const loadEvents = async () => {
      const recommended = user?.department ? await API.getRecommendedEvents(user.department, user?.email) : null;
      if (recommended?.length) {
        setEvents(recommended);
        return;
      }
      const allEvents = await API.getEvents(user?.email);
      if (allEvents?.length) setEvents(allEvents);
    };

    loadEvents();
  }, [user?.department]);

  const openChat = async (ac: any) => {
    DeviceEventEmitter.emit('OPEN_CHAT', ac);
  };

  // Auto-scroll events carousel
  useEffect(() => {
    if (events.length < 2) return;
    const timer = setInterval(() => {
      evIdx.current = (evIdx.current + 1) % events.length;
      setActiveEventIndex(evIdx.current);
      evScrollRef.current?.scrollTo({ x: evIdx.current * (screenW + 12), animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [events]);

  const rateMeal = async (r: number) => {
    setMyRating(r);
    const m = meal?.today;
    const res = await API.rateMeal(m?.date, r, user?.email);
    if (res?.success) {
      setMeal((p: any) => ({ ...p, today: { ...p.today, averageRating: res.newRating, ratingCount: res.ratingCount } }));
    }
  };

  const submitComplaint = async () => {
    if (!complaintSubject.trim() || !complaintDesc.trim()) { Alert.alert('Error', 'Please fill all fields.'); return; }
    const res = await API.submitComplaint({ studentId: user?.id || 's1', studentName: user?.name, faculty: user?.faculty || 'Faculty of Engineering', category: 'General', subject: complaintSubject, description: complaintDesc, email: user?.email });
    setComplaintModal(false); setComplaintSubject(''); setComplaintDesc('');
    if (res?.success) {
      Alert.alert(
        t('complaint.submitted'),
        t('complaint.submittedMsg')
      );
      let alertedAssign = false;
      const poll = setInterval(async () => {
        const complaints = await API.getComplaints(user?.id || 's1');
        const c = complaints?.find((x: any) => x.id === res.complaint.id);
        if (c?.status === 'triaged' || c?.status === 'assigned') {
          if (!alertedAssign) {
            alertedAssign = true;
            alertedAssign = true;
            clearInterval(poll);
            Alert.alert(
              'AI Routing Confirmation',
              `The MUVIA AI has analyzed your request and determined the appropriate handling path.\n\nFirst Contact: ${c.facultyUnit || 'Student Affairs'}\nAction Unit: ${c.routedUnit || 'Relevant Dept'}\n\nOur system has notified ${c.managerName || 'the department manager'} to begin the review process. You can track status updates in your history.`
            );
          }
        } else if (c?.status === 'resolved' || c?.status === 'closed') {
          clearInterval(poll);
        }
      }, 2000);
      setTimeout(() => clearInterval(poll), 30000);
    }
  };

  const submitSportsAd = async () => {
    if (!sportsTitle.trim() || !sportsDesc.trim()) { Alert.alert('Error', 'Please fill all fields.'); return; }
    const res = await API.postSportsListing({ title: sportsTitle, sport: 'General', description: sportsDesc, contact: user?.email, contactName: user?.name, slots: sportsSlots, date: new Date().toISOString().split('T')[0] });
    setSportsModal(false); setSportsTitle(''); setSportsDesc(''); setSportsSlots('3');
    if (res?.success) {
      Alert.alert('✅ Ad Posted', 'Your sports ad is now live on the board.');
      const all = await API.getSportsBoard();
      if (Array.isArray(all)) setSportsBoard(all);
    }
  };

  const openDetail = (item: any, type: string) => { setSelectedItem({ ...item, _type: type }); setDetailModal(true); };
  const refreshEvents = async () => {
    const all = await API.getEvents(user?.email);
    if (all?.length) setEvents(all);
  };
  const handleCheckIn = async (eventId: string) => {
    if (!user?.email) return;
    const res = await API.checkInEvent(eventId, user.email);
    if (!res?.success && res?.error) Alert.alert('Check-in', res.error);
    await refreshEvents();
  };
  const handleCheckOut = async (eventId: string) => {
    if (!user?.email) return;
    await API.checkOutEvent(eventId, user.email);
    await refreshEvents();
  };
  const handleEventFeedback = (eventId: string) => {
    if (!user?.email) return;
    Alert.alert(
      'Rate Event',
      'Please rate your experience',
      [
        { text: '⭐ 1', onPress: () => submitFeedback(eventId, 1) },
        { text: '⭐⭐⭐ 3', onPress: () => submitFeedback(eventId, 3) },
        { text: '⭐⭐⭐⭐⭐ 5', onPress: () => submitFeedback(eventId, 5) },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };
  const submitFeedback = async (eventId: string, rating: number) => {
    if (!user?.email) return;
    await API.submitEventFeedback(eventId, user.email, rating, `Feedback by ${user.name}`);
    Alert.alert(t('profile.thankYou'), t('home.eventFeedbackRecorded'));
    await refreshEvents();
  };

  const featuredEvent = events[0];

  return (
    <ScrollView style={st.scroll} showsVerticalScrollIndicator={false}>
      <View style={st.dashHeader}>
        <View style={{ flex: 1 }}>
          <Text style={st.dashGreeting}>Welcome back,</Text>
          <Text style={st.dashName}>{user?.name ?? 'Student'} 👋</Text>
          {user?.department && <Text style={{ color: '#718096', fontSize: 12 }}>{user.department}</Text>}
        </View>
        <TouchableOpacity style={st.qrBtn} onPress={() => setQrModal(true)}>
          <Text style={st.qrIcon}>📲</Text><Text style={st.qrText}>QR ID</Text>
        </TouchableOpacity>
      </View>

      {/* Weather card */}
      {weather && (
        <View style={st.weatherCard}>
          <Text style={st.weatherTemp}>{weather.temp}°C {weather.code === 0 ? '☀️' : weather.code <= 3 ? '🌤️' : weather.code >=45 && weather.code <=48 ? '🌫️' : weather.code >=51 && weather.code <=67 ? '🌧️' : weather.code >=71 && weather.code <=77 ? '❄️' : weather.code >=80 && weather.code <=82 ? '🌦️' : weather.code >=95 ? '⛈️' : '⛅'}</Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={st.weatherLabel}>Wind: {weather.wind} km/h</Text>
            <Text style={st.weatherLabel}>Precip: {weather.rain} mm {weather.rain > 0.5 ? '🌂' : ''}</Text>
          </View>
        </View>
      )}

      {/* Event Suggestion */}
      <View style={st.suggestionBanner}>
        <Text style={{ fontSize: 16 }}>💡</Text>
        <Text style={st.suggestionText}>
          {featuredEvent
            ? `Recommended for ${user?.department ?? 'your department'}: ${featuredEvent.title}`
            : 'Personalized event recommendations will appear here when live event data is available.'}
        </Text>
      </View>

      {/* Events Poster Carousel */}
      <Text style={st.sectionTitle}>🎪 Event Posters</Text>
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
        {events.map((ev: any, i: number) => (
          <View key={i} style={[st.eventPoster, { width: screenW }]}>
            <View style={st.posterMedia}>
              {ev.imageUrl ? (
                <Image source={{ uri: `${API.API_BASE_URL}${ev.imageUrl}` }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <View style={st.posterFallbackIconWrap}>
                  <Text style={st.posterFallbackIcon}>{ev.icon || '🎫'}</Text>
                </View>
              )}
              <View style={st.posterMediaOverlay}>
                <View style={st.posterBadge}><Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>👥 {ev.interestedCount} interested</Text></View>
              </View>
            </View>
            <View style={st.posterBody}>
              <Text style={st.posterTitle}>{ev.title}</Text>
              <Text style={st.posterDesc} numberOfLines={3}>{ev.description}</Text>
              <View style={st.posterMeta}>
                <Text style={st.posterMetaText}>📅 {ev.date}</Text>
                <Text style={st.posterMetaText}>🕐 {ev.time}</Text>
                <Text style={st.posterMetaText}>📍 {ev.location}</Text>
                <Text style={st.posterMetaText}>🎟️ {ev.remaining ?? '-'} / {ev.capacity ?? '-'} {t('home.emptySlots')}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                {!ev.userCheckedIn ? (
                  <TouchableOpacity style={[st.remindBtn, { flex: 1 }]} onPress={() => handleCheckIn(ev.id)}>
                    <Text style={{ color: '#2A69AC', fontSize: 12, fontWeight: '700' }}>Check-In</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[st.remindBtnActive, { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }]} onPress={() => handleCheckOut(ev.id)}>
                    <Text style={{ color: '#276749', fontSize: 12, fontWeight: '700' }}>Check-Out</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[st.remindBtn, { flex: 1 }]} onPress={() => handleEventFeedback(ev.id)}>
                  <Text style={{ color: '#2A69AC', fontSize: 12, fontWeight: '700' }}>Feedback</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      {/* Community Layer */}
      <Text style={st.sectionTitle}>{t('home.communityLayer')}</Text>
      {communityClubs.map((club: any) => (
        <View key={club.id} style={st.annCard}>
          <Text style={{ fontSize: 24 }}>{club.joined ? '✅' : '🏢'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.annTitle}>{club.name}</Text>
            <Text style={st.annTime}>{club.members} members · {club.president || 'N/A'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {club.joined ? (
              <TouchableOpacity onPress={async () => {
                setSelectedClub(club);
                const [msgs, members] = await Promise.all([
                  API.getClubMessages(club.id),
                  API.getClubMembers(club.id)
                ]);
                if (Array.isArray(msgs)) setClubMessages(msgs);
                if (Array.isArray(members)) setClubMembers(members);
                setClubChatModal(true);
                
                // Start polling
                const interval = setInterval(async () => {
                  const latest = await API.getClubMessages(club.id);
                  if (Array.isArray(latest)) setClubMessages(latest);
                }, 3000);
                setClubPollingInterval(interval);
              }} style={{ backgroundColor: '#25D366', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>Open Chat</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={async () => {
                if (!user?.email) return;
                await API.toggleClubMembership(user.email, club.id);
                const [clubs, members] = await Promise.all([
                  API.getCommunityClubs(user.email),
                  API.getClubMembers(club.id)
                ]);
                if (Array.isArray(clubs)) setCommunityClubs(clubs);
                if (Array.isArray(members)) setClubMembers(members);
                Alert.alert('Welcome!', `You have joined ${club.name}. Open the chat to meet other members!`);
              }} style={{ backgroundColor: '#128C7E', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>Join Group</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* Sports Board */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10, paddingHorizontal: 4 }}>
        <Text style={[st.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>{t('home.sportsBoard')}</Text>
        <TouchableOpacity style={{ backgroundColor: '#276749', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }} onPress={() => setSportsModal(true)}>
          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>+ Post Ad</Text>
        </TouchableOpacity>
      </View>
      {sportsBoard.slice(0, 3).map((sp: any) => (
        <TouchableOpacity key={sp.id} style={[st.annCard, { borderLeftWidth: 3, borderLeftColor: '#276749' }]} onPress={() => Alert.alert(sp.title, `${sp.description}\n\n🏅 ${sp.sport} · ${sp.type}\n📅 ${sp.date}\n👤 ${sp.contactName}\n📩 ${sp.contact}\n\nSlots: ${sp.slots}`)}>
          <Text style={{ fontSize: 20 }}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.annTitle}>{sp.title}</Text>
            <Text style={st.annTime}>{sp.sport} · {t('common.lookingFor')}: {sp.type} · {sp.slots} slots</Text>
          </View>
          <TouchableOpacity onPress={async () => {
            const res = await API.applySportsListing(sp.id);
            if (res?.success) Alert.alert('Applied!', `Contact ${res.contactName} at ${res.contact}`);
          }}>
            <Text style={{ color: '#276749', fontWeight: '700', fontSize: 11 }}>{t('common.apply')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {/* Today's Classes */}
      <Text style={st.sectionTitle}>Today's Classes</Text>
      {schedule.slice(0, 3).map((cls: any, i: number) => (
        <TouchableOpacity key={i} style={st.classCard} onPress={() => openDetail(cls, 'course')}>
          <View style={st.classTime}><Text style={st.classTimeText}>{cls.startTime}</Text></View>
          <View style={st.classInfo}><Text style={st.className}>{cls.name}</Text><Text style={st.classRoom}>👨‍🏫 {cls.professor} · 📍 {cls.room}</Text></View>
          <Text style={{ color: '#CBD5E0', fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Upcoming Exams */}
      <Text style={st.sectionTitle}>Upcoming Exams</Text>
      {exams.slice(0, 2).map((ex: any, i: number) => (
        <TouchableOpacity key={i} style={st.examCard} onPress={() => openDetail(ex, 'exam')}>
          <View style={st.examDate}><Text style={st.examDateText}>{ex.date?.slice(5)}</Text></View>
          <View style={st.classInfo}><Text style={st.className}>{ex.courseName}</Text><Text style={st.classRoom}>🕐 {ex.startTime} · 📍 {ex.room} · {ex.type}</Text></View>
        </TouchableOpacity>
      ))}

      {/* Daily Meal */}
      {meal && meal.today && (<>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10, paddingHorizontal: 4 }}>
          <Text style={[st.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Dining Menu 🍽️</Text>
          <View style={{ flexDirection: 'row', backgroundColor: '#EDF2F7', borderRadius: 8, padding: 2 }}>
            <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: mealTab === 'today' ? '#FFF' : 'transparent' }} onPress={() => setMealTab('today')}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: mealTab === 'today' ? '#1A365D' : '#718096' }}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: mealTab === 'week' ? '#FFF' : 'transparent' }} onPress={() => setMealTab('week')}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: mealTab === 'week' ? '#1A365D' : '#718096' }}>Week</Text>
            </TouchableOpacity>
          </View>
        </View>
        {mealTab === 'today' ? (
          <View style={st.mealCard}>
            {meal.today.items?.map((item: any, i: number) => (
              <Text key={i} style={st.mealItem}>{item.category === 'Soup' ? '🍜' : item.category === 'Main Course' ? '🥩' : item.category === 'Side Dish' ? '🥗' : item.category === 'Dessert' ? '🍰' : '🥤'} {item.name} ({item.calories} cal)</Text>
            ))}
            <View style={st.ratingRow}>
              <Text style={{ color: '#718096', fontSize: 12 }}>Rate: </Text>
              {[1,2,3,4,5].map(s => (
                <TouchableOpacity key={s} onPress={() => rateMeal(s)}><Text style={{ fontSize: 22 }}>{s <= (myRating || 0) ? '⭐' : '☆'}</Text></TouchableOpacity>
              ))}
              <Text style={{ color: '#718096', fontSize: 11, marginLeft: 8 }}>Avg: {meal.today.averageRating} ({meal.today.ratingCount})</Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {(meal.weekly || []).map((m: any, i: number) => (
              <View key={i} style={st.mealCard}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A365D', marginBottom: 4 }}>{m.dayName} ({m.date})</Text>
                {m.items?.map((item: any, j: number) => (
                  <Text key={j} style={st.mealItem}>• {item.name} ({item.calories} cal)</Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </>)}

      {/* Announcements */}
      <Text style={st.sectionTitle}>{t('home.announcements')}</Text>
      {announcements.slice(0, 3).map((ann: any, i: number) => (
        <TouchableOpacity key={i} style={st.annCard} onPress={() => { setSelectedAnn(ann); setAnnDetailModal(true); }}>
          <Text style={{ fontSize: 20 }}>{ann.icon}</Text>
          <View style={{ flex: 1 }}><Text style={st.annTitle}>{ann.title}</Text><Text style={st.annTime}>{ann.author} · {new Date(ann.timestamp).toLocaleDateString()}</Text></View>
          <Text style={{ color: '#CBD5E0', fontSize: 16 }}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Professors */}
      <Text style={st.sectionTitle}>Your Professors</Text>
      {academics.map((ac: any, i: number) => (
        <TouchableOpacity key={i} style={st.annCard} onPress={() => openChat(ac)}>
          <View style={[st.profAvatar, { backgroundColor: ac.availability === 'available' ? '#38A169' : ac.availability === 'in-meeting' ? '#D69E2E' : '#E53E3E' }]}>
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{ac.name.replace(/^(Dr\.|Prof\.)\s*/, '')[0]}</Text>
          </View>
          <View style={{ flex: 1 }}><Text style={st.annTitle}>{ac.name}</Text><Text style={st.annTime}>{ac.availability === 'available' ? '✅ In Office' : ac.availability === 'in-meeting' ? '🟡 In Meeting' : '🔴 Away'}</Text></View>
          <Text style={{ color: '#2A69AC', fontSize: 12, fontWeight: '600' }}>💬 Chat</Text>
        </TouchableOpacity>
      ))}

      {/* Complaint Button */}
      <TouchableOpacity style={st.complaintBtn} onPress={() => setComplaintModal(true)}>
        <Text style={st.complaintBtnText}>📋 Submit a Complaint</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />



      {/* Detail Modal */}
      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            {selectedItem && (<>
              <Text style={st.modalTitle}>{selectedItem._type === 'course' ? '📖' : '📝'} {selectedItem.name || selectedItem.courseName}</Text>
              <Text style={st.modalSub}>{selectedItem.code || selectedItem.courseCode} · {selectedItem.type}</Text>
              <View style={{ gap: 6, marginVertical: 12 }}>
                <Text style={st.modalDetail}>👨‍🏫 Professor: {selectedItem.professor}</Text>
                <Text style={st.modalDetail}>📍 Room: {selectedItem.room}</Text>
                <Text style={st.modalDetail}>🕐 Time: {selectedItem.startTime} - {selectedItem.endTime}</Text>
                {selectedItem.day && <Text style={st.modalDetail}>📅 Day: {selectedItem.day}</Text>}
                {selectedItem.credits && <Text style={st.modalDetail}>📊 Credits: {selectedItem.credits}</Text>}
                {selectedItem.description && <Text style={st.modalDetail}>📝 {selectedItem.description}</Text>}
                {selectedItem.topics && <Text style={st.modalDetail}>📚 Topics: {selectedItem.topics.join(', ')}</Text>}
                {selectedItem.notes && <Text style={st.modalDetail}>⚠️ {selectedItem.notes}</Text>}
              </View>
              <TouchableOpacity style={st.modalClose} onPress={() => setDetailModal(false)}><Text style={st.modalCloseTxt}>Close</Text></TouchableOpacity>
            </>)}
          </View>
        </View>
      </Modal>

      {/* Complaint Modal */}
      <Modal visible={complaintModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>{t('complaint.title')}</Text>
            <Text style={{ color: '#718096', fontSize: 12, marginBottom: 12 }}>{t('complaint.info')}</Text>
            <TextInput style={st.modalInput} placeholder={t('complaint.subject')} placeholderTextColor="#A0AEC0" value={complaintSubject} onChangeText={setComplaintSubject} />
            <TextInput style={[st.modalInput, { minHeight: 80 }]} placeholder={t('complaint.description')} placeholderTextColor="#A0AEC0" value={complaintDesc} onChangeText={setComplaintDesc} multiline textAlignVertical="top" />
            <View style={st.modalActions}>
              <TouchableOpacity style={st.modalCancel} onPress={() => setComplaintModal(false)}><Text style={st.modalCancelTxt}>{t('complaint.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={st.modalSend} onPress={submitComplaint}><Text style={st.modalSendTxt}>{t('complaint.submit')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sports Modal */}
      <Modal visible={sportsModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>🏆 Post Sports Ad</Text>
            <Text style={{ color: '#718096', fontSize: 12, marginBottom: 12 }}>Find teammates for your next game.</Text>
            <TextInput style={st.modalInput} placeholder="Title (e.g., Football 7v7)" placeholderTextColor="#A0AEC0" value={sportsTitle} onChangeText={setSportsTitle} />
            <TextInput style={st.modalInput} placeholder="Number of players needed (e.g., 3)" placeholderTextColor="#A0AEC0" value={sportsSlots} onChangeText={setSportsSlots} keyboardType="numeric" />
            <TextInput style={[st.modalInput, { minHeight: 80 }]} placeholder="Description (time, place, etc.)" placeholderTextColor="#A0AEC0" value={sportsDesc} onChangeText={setSportsDesc} multiline textAlignVertical="top" />
            <View style={st.modalActions}>
              <TouchableOpacity style={st.modalCancel} onPress={() => setSportsModal(false)}><Text style={st.modalCancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={st.modalSend} onPress={submitSportsAd}><Text style={st.modalSendTxt}>Post Ad</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Announcement Detail Modal */}
      <Modal visible={annDetailModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            {selectedAnn && (<>
              <Text style={st.modalTitle}>{selectedAnn.icon} {selectedAnn.title}</Text>
              <Text style={st.modalSub}>By {selectedAnn.author} · {new Date(selectedAnn.timestamp).toLocaleString()}</Text>
              <View style={{ gap: 8, marginVertical: 12 }}>
                <Text style={st.modalDetail}>{selectedAnn.content}</Text>
                {selectedAnn.courseCode && <Text style={st.modalDetail}>📖 Course: {selectedAnn.courseCode}</Text>}
              </View>
              <TouchableOpacity style={st.modalClose} onPress={() => setAnnDetailModal(false)}><Text style={st.modalCloseTxt}>{t('common.close')}</Text></TouchableOpacity>
            </>)}
          </View>
        </View>
      </Modal>

      {/* Club Chat Modal (WhatsApp Style) */}
      <Modal visible={clubChatModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {selectedClub && (
            <>
              {/* Header */}
              <SafeAreaView edges={['top']} style={{ backgroundColor: '#075E54', flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }}>
                <TouchableOpacity onPress={() => { 
                  setClubChatModal(false); 
                  setClubMessages([]); 
                  setClubMembers([]);
                  setShowMembers(false);
                  if (clubPollingInterval) clearInterval(clubPollingInterval);
                  setClubPollingInterval(null);
                }}>
                  <Text style={{ fontSize: 24, color: '#FFF' }}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={async () => {
                  const members = await API.getClubMembers(selectedClub.id);
                  if (Array.isArray(members)) setClubMembers(members);
                  setShowMembers(!showMembers);
                }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>🏢</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>{selectedClub.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{clubMembers.length} members · President: {selectedClub.president}</Text>
                  </View>
                  <View style={{ backgroundColor: showMembers ? '#128C7E' : 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '700' }}>{showMembers ? 'Messages' : 'Members'}</Text>
                  </View>
                </TouchableOpacity>
              </SafeAreaView>

              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                style={{ flex: 1, backgroundColor: '#E5DDD5' }}
              >
                {showMembers ? (
                  <View style={{ flex: 1, backgroundColor: '#FFF' }}>
                    <Text style={{ padding: 16, fontSize: 16, fontWeight: '700', color: '#075E54', borderBottomWidth: 1, borderBottomColor: '#EEE' }}>Group Participants ({clubMembers.length})</Text>
                    <ScrollView>
                      {clubMembers.map((m: any, i: number) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#128C7E', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#FFF', fontWeight: '700' }}>{m.name[0]}</Text>
                          </View>
                          <View>
                            <Text style={{ fontWeight: '600' }}>{m.name} {m.email === user?.email ? '(You)' : ''}</Text>
                            <Text style={{ fontSize: 12, color: '#666' }}>{m.role}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                    <TouchableOpacity style={{ padding: 16, alignItems: 'center' }} onPress={() => setShowMembers(false)}>
                      <Text style={{ color: '#075E54', fontWeight: '700' }}>Close Participants List</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView 
                    ref={chatScrollRef}
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={{ padding: 12 }}
                    onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
                  >
                    {clubMessages.length === 0 && (
                      <View style={{ alignSelf: 'center', backgroundColor: '#FFFEE0', padding: 8, borderRadius: 8, marginTop: 20, elevation: 1, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                        <Text style={{ color: '#718096', fontSize: 12, textAlign: 'center' }}>Messages are end-to-end encrypted. No one outside of this group, not even MUVIA, can read them.</Text>
                      </View>
                    )}
                    {clubMessages.map((msg: any, idx: number) => (
                      <View key={idx} style={{ alignSelf: msg.authorEmail === user?.email ? 'flex-end' : 'flex-start', marginBottom: 8, maxWidth: '85%' }}>
                        <View style={{ backgroundColor: msg.authorEmail === user?.email ? '#DCF8C6' : '#FFF', borderRadius: 8, padding: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 }}>
                          {msg.authorEmail !== user?.email && <Text style={{ color: '#075E54', fontSize: 11, fontWeight: '800', marginBottom: 2 }}>{msg.authorName}</Text>}
                          <Text style={{ color: '#1A202C', fontSize: 14 }}>{msg.content}</Text>
                          <Text style={{ color: '#718096', fontSize: 10, textAlign: 'right', marginTop: 2 }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Input area - fixed at bottom of KeyboardAvoidingView */}
                {!showMembers && (
                  <View style={{ backgroundColor: '#E5DDD5', padding: 8, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput 
                        style={{ flex: 1, fontSize: 15, color: '#000', maxHeight: 100 }} 
                        placeholder="Message" 
                        placeholderTextColor="#999" 
                        value={clubChatInput} 
                        onChangeText={setClubChatInput} 
                        multiline
                      />
                    </View>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#075E54', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }} 
                      onPress={async () => {
                        if (!clubChatInput.trim() || !user?.email) return;
                        await API.sendClubMessage(selectedClub.id, user.email, clubChatInput.trim());
                        setClubChatInput('');
                        const msgs = await API.getClubMessages(selectedClub.id);
                        if (Array.isArray(msgs)) setClubMessages(msgs);
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 20 }}>➤</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </KeyboardAvoidingView>
              <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#E5DDD5' }} />
            </>
          )}
        </View>
      </Modal>

      {/* QR Modal */}
      <Modal visible={qrModal} animationType="fade" transparent>
        <View style={[st.modalOverlay, { justifyContent: 'center', padding: 20 }]}>
          <View style={[st.modalBox, { alignItems: 'center', borderRadius: 24, paddingBottom: 24 }]}>
            <Text style={st.modalTitle}>📲 Digital Student ID</Text>
            <View style={st.qrCard}>
              <View style={{ width: 240, height: 240, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#1A365D', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                <WebView 
                  source={{ html: `<html><body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#fff"><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script><div id="q"></div><script>new QRCode('q',{text:'MSKU-ID:${user?.studentId||'220501001'}|${user?.name}|${user?.department}|${user?.email}',width:220,height:220});</script></body></html>` }} 
                  style={{ width: 220, height: 220, alignSelf: 'center', backgroundColor: 'transparent' }} 
                  scrollEnabled={false} 
                />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A365D', marginTop: 16 }}>{user?.name}</Text>
              <Text style={{ color: '#718096', fontSize: 14 }}>ID: {user?.studentId || '220501001'}</Text>
              <Text style={{ color: '#718096', fontSize: 13 }}>{user?.department}</Text>
              <Text style={{ color: '#718096', fontSize: 13 }}>{user?.email}</Text>
              <Text style={{ color: '#A0AEC0', fontSize: 11, marginTop: 12 }}>Scan to verify identity</Text>
            </View>
            <TouchableOpacity style={[st.modalClose, { width: '100%', marginTop: 20 }]} onPress={() => setQrModal(false)}><Text style={st.modalCloseTxt}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ScheduleTab() {
  const user = useAuthStore((s: AuthStore) => s.user);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const dayMap: Record<string,string> = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday' };
  const [schedule, setSchedule] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [detailModal, setDetailModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [section, setSection] = useState<'timetable'|'calendar'|'exams'>('timetable');

  useEffect(() => {
    API.getStudentSchedule(user?.id || 's1').then(d => d && setSchedule(d));
    API.getStudentExams(user?.id || 's1').then(d => d && setExams(d));
    API.getEvents().then(d => d && setEvents(d));
  }, []);

  return (
    <View style={st.tabContent}>
      <Text style={st.tabTitle}>Schedule</Text>
      <View style={st.dayRow}>
        {(['timetable','calendar','exams'] as const).map(s => (
          <TouchableOpacity key={s} style={[st.dayBtn, section === s && st.dayBtnActive]} onPress={() => setSection(s)}>
            <Text style={[st.dayText, section === s && st.dayTextActive]}>{s === 'timetable' ? '📅 Timetable' : s === 'calendar' ? '🗓️ Event Calendar' : '📝 Exams'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {section === 'timetable' && (<>
          <View style={st.timetable}>
            <View style={st.ttHeaderRow}>
              <View style={st.ttCorner}><Text style={st.ttCornerTxt}>Time</Text></View>
              {days.map(d => <View key={d} style={st.ttHeaderCell}><Text style={st.ttHeaderTxt}>{d}</Text></View>)}
            </View>
            {['09:00','11:00','13:00'].map(time => (
              <View key={time} style={st.ttRow}>
                <View style={st.ttTimeCell}><Text style={st.ttTimeTxt}>{time}</Text></View>
                {days.map(d => {
                  const cls = schedule.find(c => c.day === dayMap[d] && c.startTime === time);
                  return (
                    <TouchableOpacity key={d} style={[st.ttCell, cls && st.ttCellFilled]} onPress={() => cls && (setSelected(cls), setDetailModal(true))}>
                      {cls && <><Text style={st.ttCellCode}>{cls.code}</Text><Text style={st.ttCellRoom}>{cls.room}</Text></>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          <Text style={{ color: '#718096', fontSize: 11, textAlign: 'center', marginTop: 8 }}>Tap a cell to see course details</Text>
        </>)}

        {section === 'calendar' && (<>
          {events.map((ev: any, i: number) => (
            <TouchableOpacity key={i} style={st.calendarItem} onPress={() => Alert.alert(ev.title, `${ev.description}\n\n📅 ${ev.date}\n🕐 ${ev.time}\n📍 ${ev.location}\n\n👥 ${ev.interestedCount} interested`)}>
              <View style={st.calDateBox}><Text style={st.calDateNum}>{ev.date?.slice(8)}</Text><Text style={st.calDateMonth}>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(parseInt(ev.date?.slice(5,7))||1)-1]}</Text></View>
              <View style={{ flex: 1 }}><Text style={st.className}>{ev.icon} {ev.title}</Text><Text style={st.classRoom}>🕐 {ev.time} · 📍 {ev.location}</Text></View>
            </TouchableOpacity>
          ))}
        </>)}

        {section === 'exams' && (<>
          {exams.map((ex: any, i: number) => (
            <TouchableOpacity key={i} style={st.examCard} onPress={() => Alert.alert(`${ex.courseName} - ${ex.type}`, `📅 ${ex.date}\n🕐 ${ex.startTime}-${ex.endTime}\n📍 ${ex.room}\n👨‍🏫 ${ex.professor}\n\n📚 Topics:\n${ex.topics?.join(', ')}\n\n⚠️ ${ex.notes}`)}>
              <View style={st.examDate}><Text style={st.examDateText}>{ex.date?.slice(5)}</Text></View>
              <View style={st.classInfo}><Text style={st.className}>{ex.courseName}</Text><Text style={st.classRoom}>{ex.type} · 🕐 {ex.startTime} · 📍 {ex.room}</Text></View>
            </TouchableOpacity>
          ))}
        </>)}
      </ScrollView>
      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={st.modalOverlay}><View style={st.modalBox}>
          {selected && (<>
            <Text style={st.modalTitle}>📖 {selected.name}</Text>
            <View style={{ gap: 6, marginVertical: 12 }}>
              <Text style={st.modalDetail}>👨‍🏫 {selected.professor}</Text>
              <Text style={st.modalDetail}>📍 {selected.room}</Text>
              <Text style={st.modalDetail}>🕐 {selected.startTime}-{selected.endTime}</Text>
              <Text style={st.modalDetail}>📊 Credits: {selected.credits}</Text>
              <Text style={st.modalDetail}>📝 {selected.description}</Text>
            </View>
            <TouchableOpacity style={st.modalClose} onPress={() => setDetailModal(false)}><Text style={st.modalCloseTxt}>Close</Text></TouchableOpacity>
          </>)}
        </View></View>
      </Modal>
    </View>
  );
}

function MessagesTab() {
  const user = useAuthStore((s: AuthStore) => s.user);
  const [academics, setAcademics] = useState<any[]>([]);
  const [selectedAcademic, setSelectedAcademic] = useState<any>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All'|'Academic'|'Admin'>('All');

  const STAFF_DATA = [
    // Faculty of Engineering
    { id: 'cihat_c', name: 'Dr. Cihat Çetinkaya', title: 'Assoc. Prof.', faculty: 'Faculty of Engineering', department: 'Software Engineering', email: 'cihat.cetinkaya@mu.edu.tr', type: 'Academic', room: 'ENG-214', availability: 'available' },
    { id: 'burak_s', name: 'Dr. Burak Sahin', title: 'Lecturer', faculty: 'Faculty of Engineering', department: 'Software Engineering', email: 'burak.sahin@mu.edu.tr', type: 'Academic', room: 'ENG-A101', availability: 'available' },
    { id: 'fatma_o', name: 'Prof. Fatma Ozturk', title: 'Professor', faculty: 'Faculty of Engineering', department: 'Computer Engineering', email: 'fatma.ozturk@mu.edu.tr', type: 'Academic', room: 'ENG-301', availability: 'in-meeting' },
    { id: 'ali_y', name: 'Prof. Ali Yilmaz', title: 'Professor', faculty: 'Faculty of Engineering', department: 'Civil Engineering', email: 'ali.yilmaz@mu.edu.tr', type: 'Academic', room: 'ENG-405', availability: 'away' },
    { id: 'mehmet_c', name: 'Dr. Mehmet Celik', title: 'Lecturer', faculty: 'Faculty of Engineering', department: 'Computer Engineering', email: 'mehmet.celik@mu.edu.tr', type: 'Academic', room: 'ENG-C301', availability: 'available' },
    { id: 'eng_sa', name: 'Ms. Zeynep Ar', title: 'Student Affairs Officer', faculty: 'Faculty of Engineering', email: 'eng.sa@msku.edu.tr', type: 'Admin', room: 'ENG-G01', availability: 'available' },

    // Faculty of Economics (FEAS)
    { id: 'ayse_d', name: 'Dr. Ayse Demir', title: 'Assoc. Prof.', faculty: 'FEAS', department: 'Business Administration', email: 'ayse.demir@mu.edu.tr', type: 'Academic', room: 'FEAS-210', availability: 'available' },
    { id: 'ahmet_k', name: 'Dr. Ahmet Kaya', title: 'Lecturer', faculty: 'FEAS', department: 'Economics', email: 'ahmet.kaya@mu.edu.tr', type: 'Academic', room: 'FEAS-B20', availability: 'available' },
    { id: 'feas_sa', name: 'Mr. Can Oz', title: 'Student Affairs Officer', faculty: 'FEAS', email: 'feas.sa@msku.edu.tr', type: 'Admin', room: 'FEAS-102', availability: 'available' },

    // Faculty of Science
    { id: 'hakan_o', name: 'Prof. Hakan Ozturk', title: 'Professor', faculty: 'Faculty of Science', department: 'Mathematics', email: 'hakan.ozturk@mu.edu.tr', type: 'Academic', room: 'SCI-305', availability: 'available' },
    { id: 'zeynep_c', name: 'Dr. Zeynep Can', title: 'Lecturer', faculty: 'Faculty of Science', department: 'Physics', email: 'zeynep.can@mu.edu.tr', type: 'Academic', room: 'SCI-201', availability: 'available' },
    { id: 'elif_y', name: 'Prof. Elif Yilmaz', title: 'Professor', faculty: 'Faculty of Science', department: 'Biology', email: 'elif.yilmaz@mu.edu.tr', type: 'Academic', room: 'SCI-301', availability: 'away' },
    { id: 'sci_sa', name: 'Ms. Eda Nur', title: 'Student Affairs Officer', faculty: 'Faculty of Science', email: 'sci.sa@msku.edu.tr', type: 'Admin', room: 'SCI-G05', availability: 'available' },

    // Faculty of Literature / Letters
    { id: 'deniz_a', name: 'Dr. Deniz Arslan', title: 'Lecturer', faculty: 'Faculty of Letters', department: 'Turkish Language and Literature', email: 'deniz.arslan@mu.edu.tr', type: 'Academic', room: 'LET-101', availability: 'available' },
    { id: 'osman_y', name: 'Prof. Osman Yildirim', title: 'Professor', faculty: 'Faculty of Letters', department: 'History', email: 'osman.yildirim@mu.edu.tr', type: 'Academic', room: 'LET-201', availability: 'available' },
    { id: 'let_sa', name: 'Mr. Mert Alp', title: 'Student Affairs Officer', faculty: 'Faculty of Letters', email: 'let.sa@msku.edu.tr', type: 'Admin', room: 'LET-105', availability: 'available' },

    // Faculty of Education
    { id: 'aylin_k', name: 'Dr. Aylin Kocer', title: 'Lecturer', faculty: 'Faculty of Education', department: 'Primary Education', email: 'aylin.kocer@mu.edu.tr', type: 'Academic', room: 'EDU-101', availability: 'available' },
    { id: 'kaan_d', name: 'Dr. Kaan Demir', title: 'Lecturer', faculty: 'Faculty of Education', department: 'Guidance and Counseling', email: 'kaan.demir@mu.edu.tr', type: 'Academic', room: 'EDU-201', availability: 'available' },
    { id: 'edu_sa', name: 'Ms. Selin Gun', title: 'Student Affairs Officer', faculty: 'Faculty of Education', email: 'edu.sa@msku.edu.tr', type: 'Admin', room: 'EDU-G10', availability: 'available' },
  ];

  const QUICK_TEMPLATES = [
    'Could we meet to discuss my project?',
    'Can you clarify the midterm scope?',
    'I need feedback on my assignment.',
    'Is extra credit available for this course?'
  ];

  useEffect(() => {
    API.getAcademics(user?.department).then((d) => d && setAcademics(d));
    const sub = DeviceEventEmitter.addListener('OPEN_CHAT', (ac) => {
      openConversation(ac);
    });
    return () => sub.remove();
  }, []);

  const openConversation = async (ac: any) => {
    setSelectedAcademic(ac);
    const conv = await API.getConversation(user?.id || 's1', ac.id);
    if (conv) setConversation(conv);
  };

  useEffect(() => {
    if (!selectedAcademic) return;
    const timer = setInterval(async () => {
      const conv = await API.getConversation(user?.id || 's1', selectedAcademic.id);
      if (conv) setConversation(conv);
    }, 2500);
    return () => clearInterval(timer);
  }, [selectedAcademic, user?.id]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedAcademic) return;
    await API.sendMessage({
      fromId: user?.id || 's1',
      fromName: user?.name || 'Student',
      fromRole: 'student',
      toId: selectedAcademic.id,
      toName: selectedAcademic.name,
      toRole: 'academic',
      content: chatInput.trim(),
    });
    setChatInput('');
    const conv = await API.getConversation(user?.id || 's1', selectedAcademic.id);
    if (conv) setConversation(conv);
  };

  if (selectedAcademic) {
    const status = ACADEMIC_STATUS[selectedAcademic.availability] || ACADEMIC_STATUS.away;
    return (
      <View style={st.tabContent}>
        <View style={st.msgHeadRow}>
          <TouchableOpacity onPress={() => { setSelectedAcademic(null); setConversation([]); }}>
            <Text style={st.msgBack}>←</Text>
          </TouchableOpacity>
          <View style={[st.profAvatar, { backgroundColor: status.color }]}>
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{selectedAcademic.name.replace(/^(Dr\.|Prof\.)\s*/, '')[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.msgPartnerName}>{selectedAcademic.name}</Text>
            <Text style={[st.msgPartnerStatus, { color: status.color }]}>{status.icon} {status.label}</Text>
          </View>
        </View>

        <View style={st.messageHintBox}>
          <Text style={st.messageHintText}>
            {selectedAcademic.availability === 'available'
              ? 'Your instructor is currently available. You can continue this conversation now.'
              : 'Instructor is not currently available, but you can still leave a message or ask another question.'}
          </Text>
        </View>

        <View style={st.conversationBox}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {conversation.length === 0 && (
              <Text style={st.emptyConvText}>Start with your question. Your instructor can reply here.</Text>
            )}
            {conversation.map((msg: any, idx: number) => {
              const mine = msg.fromId === (user?.id || 's1');
              return (
                <View key={idx} style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                  <View style={[st.convBubble, mine ? st.convBubbleMine : st.convBubbleOther]}>
                    <Text style={[st.convText, mine && { color: '#FFF' }]}>{msg.content}</Text>
                    <Text style={[st.convTime, mine && { color: 'rgba(255,255,255,0.6)' }]}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.templateRow}>
            {QUICK_TEMPLATES.map((t, i) => (
              <TouchableOpacity key={i} style={st.templateChip} onPress={() => setChatInput(t)} onLongPress={async () => { setChatInput(t); await sendMessage(); }}>
                <Text style={st.templateChipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={st.chatComposer}>
          <TextInput
            style={st.chatComposerInput}
            placeholder="Type your message..."
            placeholderTextColor="#A0AEC0"
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={st.chatSendBtn} onPress={sendMessage}>
            <Text style={st.chatSendTxt}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const filtered = STAFF_DATA.filter(s => (filter === 'All' || (filter === 'Academic' ? s.type === 'Academic' : s.type === 'Admin')) && (query.trim() === '' || s.name.toLowerCase().includes(query.toLowerCase()) || s.faculty.toLowerCase().includes(query.toLowerCase())));
  const deptStaff = STAFF_DATA.filter(s => s.department === user?.department && s.type === 'Academic');
  const otherStaff = filtered.filter(s => !deptStaff.find(ds => ds.id === s.id));

  const faculties = [...new Set(STAFF_DATA.map(s => s.faculty))];

  return (
    <View style={st.tabContent}>
      <Text style={st.tabTitle}>Messages & Directory</Text>
      <TextInput style={st.dirSearch} placeholder="Search staff..." placeholderTextColor="#A0AEC0" value={query} onChangeText={setQuery} />
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 10 }}>
        {(['All','Academic','Admin'] as const).map(f => (
          <TouchableOpacity key={f} style={[st.dirFilterBtn, filter === f && st.dirFilterActive]} onPress={() => setFilter(f)}>
            <Text style={[{ color: '#718096', fontSize: 13, fontWeight: '600' }, filter === f && { color: '#FFF' }]}>{f === 'Admin' ? 'Student Affairs' : f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {user?.department && deptStaff.length > 0 && query.trim() === '' && filter !== 'Admin' && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#2A69AC', paddingLeft: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#2D3748' }}>My Department: {user.department}</Text>
            </View>
            {deptStaff.map((ac: any, i: number) => {
              const status = ACADEMIC_STATUS[ac.availability] || ACADEMIC_STATUS.away;
              return (
                <TouchableOpacity key={'dept-'+i} style={st.msgListCard} onPress={() => openConversation(ac)}>
                  <View style={[st.profAvatar, { backgroundColor: status.color }]}>
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{ac.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/, '')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.annTitle}>{ac.name}</Text>
                    <Text style={st.annTime}>{ac.title} · {ac.room}</Text>
                    <Text style={[st.msgPartnerStatus, { color: status.color }]}>{status.icon} {status.label}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <TouchableOpacity onPress={() => Linking.openURL(`mailto:${ac.email}`)} style={{ backgroundColor: '#EDF2F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                      <Text style={{ fontSize: 14 }}>✉️ Email</Text>
                    </TouchableOpacity>
                    <Text style={st.msgOpenTxt}>Chat 💬</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {filter !== 'All' ? (
          faculties.map(faculty => {
            const facultyStaff = otherStaff.filter(s => s.faculty === faculty);
            if (facultyStaff.length === 0) return null;
            return (
              <View key={faculty} style={{ marginBottom: 24 }}>
                <View style={{ backgroundColor: '#F7FAFC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#4A5568', textTransform: 'uppercase' }}>{faculty}</Text>
                </View>
                {facultyStaff.map((ac: any, i: number) => {
                  const status = ACADEMIC_STATUS[ac.availability] || ACADEMIC_STATUS.away;
                  return (
                    <TouchableOpacity key={faculty + i} style={st.msgListCard} onPress={() => openConversation(ac)}>
                      <View style={[st.profAvatar, { backgroundColor: status.color }]}>
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{ac.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/, '')[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={st.annTitle}>{ac.name}</Text>
                        <Text style={st.annTime}>{ac.title} · {ac.room}</Text>
                        <Text style={[st.msgPartnerStatus, { color: status.color }]}>{status.icon} {status.label}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${ac.email}`)} style={{ backgroundColor: '#EDF2F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                          <Text style={{ fontSize: 14 }}>✉️ Email</Text>
                        </TouchableOpacity>
                        <Text style={st.msgOpenTxt}>Chat 💬</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, opacity: 0.7 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#718096' }}>All Campus Personnel</Text>
            </View>
            {otherStaff.map((ac: any, i: number) => {
          const status = ACADEMIC_STATUS[ac.availability] || ACADEMIC_STATUS.away;
          return (
            <TouchableOpacity key={i} style={st.msgListCard} onPress={() => openConversation(ac)}>
              <View style={[st.profAvatar, { backgroundColor: status.color }]}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{ac.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/, '')[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.annTitle}>{ac.name}</Text>
                <Text style={st.annTime}>{ac.faculty} • {ac.type}</Text>
                <Text style={[st.msgPartnerStatus, { color: status.color }]}>{status.icon} {status.label}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <TouchableOpacity onPress={() => Linking.openURL(`mailto:${ac.email}`)} style={{ backgroundColor: '#EDF2F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ fontSize: 14 }}>✉️ Email</Text>
                </TouchableOpacity>
                <Text style={st.msgOpenTxt}>Chat 💬</Text>
              </View>
            </TouchableOpacity>
          );
        })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ProfileTab({ router }: { router: any }) {
  const user = useAuthStore((s: AuthStore) => s.user);
  const logout = useAuthStore((s: AuthStore) => s.logout);
  const [interests, setInterests] = useState(user?.interests || ['AI', 'Web Development']);
  const allInterests = ['AI', 'Web Development', 'Mobile Dev', 'Cybersecurity', 'Data Science', 'Robotics', 'Cloud', 'Game Dev', 'IoT', 'Blockchain', '🎬 Cinema', '🎵 Concert', '🎮 Gaming', '⚽ Sports', '📸 Photography', '🎭 Theater', '✈️ Travel', '📖 Reading', '🍳 Cooking'];
  const toggleInterest = (i: string) => setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  
  const [historyModal, setHistoryModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [feedbackData, setFeedbackData] = useState<Record<string, { rating: number, note: string, action?: 'close' | 'escalate' }>>({});

  const submitFeedback = async (complaintId: string) => {
    const fb = feedbackData[complaintId];
    if (!fb || fb.rating === 0) {
      Alert.alert('Rating Required', 'Please provide a star rating.');
      return;
    }
    const res = await API.submitComplaintFeedback(complaintId, fb.rating, fb.note, fb.action);
    if (res?.success) {
      if (fb.rating === 1) {
        Alert.alert(
          'Issue Escalated',
          'We are sorry that the resolution was not satisfactory. Your 1-star rating has automatically marked this issue as UNRESOLVED. Our central administration has been notified to intervene and ensure a better outcome.'
        );
      } else {
        Alert.alert(
          'Feedback Forwarded',
          `Your feedback and rating have been successfully forwarded to the ${res.routedUnit || 'relevant department'}. Your input helps us improve campus services.`
        );
      }
      setFeedbackData(prev => ({ ...prev, [complaintId]: { rating: 0, note: '' } }));
      const c = await API.getComplaints(user?.id || 's1', user?.email);
      setComplaints(c?.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()) || []);
    } else {
      Alert.alert('Connection Error', 'Could not submit feedback. Please ensure the backend server is running and updated.');
    }
  };
  const items = [
    { icon: '📊', label: 'My Grades', action: () => Alert.alert('My Grades', 'CS301: BB (72)\nCS302: CB (65)\nCS303: BA (85)\nCS304: AA (92)\nCS305: BB (78)\n\nGPA: 3.42') },
    { icon: '📋', label: 'Transcript', action: () => Alert.alert('Transcript', 'Your unofficial transcript is available on OBS (obs.mu.edu.tr). Contact Student Affairs for official copies.') },
    { icon: '🔔', label: 'Notifications', action: () => Alert.alert('Notifications', '• CS301 Midterm Study Session\n• Library Extended Hours\n• AI Panel Apr 25\n• Career Fair Apr 28') },
    {
      icon: '📋',
      label: 'Complaint History',
      action: async () => {
        const c = await API.getComplaints(user?.id || 's1', user?.email);
        if (!c?.length) {
          Alert.alert('Complaints', 'No complaints found in your history.');
          return;
        }
        setComplaints(c.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
        setHistoryModal(true);
      },
    },
    { icon: '⚙️', label: 'Settings', action: () => setSettingsModal(true) },
  ];
  return (
    <ScrollView style={st.scroll}>
      <View style={st.profileHeader}>
        <View style={st.avatar}><Text style={st.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'S'}</Text></View>
        <Text style={st.profileName}>{user?.name ?? 'Student'}</Text>
        <Text style={st.profileEmail}>{user?.email ?? 'student@mu.edu.tr'}</Text>
        <View style={st.profileBadge}><Text style={st.profileBadgeText}>🎓 {user?.department || 'Undergraduate'}</Text></View>
        {user?.gpa && <Text style={{ color: '#2A69AC', fontSize: 13, fontWeight: '700', marginTop: 4 }}>GPA: {user.gpa}</Text>}
      </View>
      {items.map((item, i) => (
        <TouchableOpacity key={i} style={st.menuItem} onPress={item.action}><Text style={st.menuIcon}>{item.icon}</Text><Text style={st.menuLabel}>{item.label}</Text><Text style={st.menuArrow}>›</Text></TouchableOpacity>
      ))}
      <Text style={st.sectionTitle}>My Interests & Hobbies</Text>
      <Text style={{ color: '#718096', fontSize: 12, paddingHorizontal: 4, marginBottom: 8 }}>Select academic interests and hobbies for personalized recommendations</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {allInterests.map(i => (
          <TouchableOpacity key={i} style={[st.interestChip, interests.includes(i) && st.interestChipActive]} onPress={() => toggleInterest(i)}>
            <Text style={[st.interestText, interests.includes(i) && { color: '#FFF' }]}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={st.logoutBtn} onPress={() => { logout(); router.replace('/'); }}><Text style={st.logoutText}>Sign Out</Text></TouchableOpacity>
      <View style={{ height: 20 }} />

      <Modal visible={historyModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={[st.modalBox, { maxHeight: '90%', padding: 20 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={st.modalTitle}>Your Requests</Text>
              <TouchableOpacity onPress={() => setHistoryModal(false)}><Text style={{ fontSize: 24, color: '#A0AEC0' }}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {complaints.map((c: any) => (
                <View key={c.id} style={{ backgroundColor: '#F7FAFC', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontWeight: '700', color: '#1A365D', flex: 1 }}>{c.subject}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: c.status === 'resolved' || c.status === 'closed' ? '#C6F6D5' : '#FEFCBF', color: c.status === 'resolved' || c.status === 'closed' ? '#22543D' : '#744210', overflow: 'hidden' }}>{t(`complaint.status.${c.status}`)}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>Ref: {c.id} · {new Date(c.submittedAt).toLocaleDateString()}</Text>
                  <Text style={{ fontSize: 13, color: '#4A5568', marginBottom: 8 }}>{c.description}</Text>
                  
                  {c.response ? (
                    <View style={{ backgroundColor: '#EBF8FF', padding: 12, borderRadius: 8, marginTop: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B6CB0', marginBottom: 4 }}>Official Response:</Text>
                      <Text style={{ fontSize: 12, color: '#2C5282' }}>{c.response}</Text>
                      <Text style={{ fontSize: 10, color: '#4299E1', marginTop: 4 }}>— {c.managerName} ({c.routedUnit})</Text>
                    </View>
                  ) : null}

                  {!c.rating ? (
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#4A5568', marginBottom: 8 }}>Were you satisfied with this resolution?</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <TouchableOpacity key={star} onPress={() => setFeedbackData({ ...feedbackData, [c.id]: { ...feedbackData[c.id], rating: star, note: feedbackData[c.id]?.note || '' } })}>
                            <Text style={{ fontSize: 24, color: (feedbackData[c.id]?.rating || 0) >= star ? '#D69E2E' : '#CBD5E0' }}>★</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput 
                        style={[st.modalInput, { minHeight: 60, marginBottom: 8, fontSize: 12, padding: 10 }]} 
                        placeholder="Add optional feedback note..." 
                        placeholderTextColor="#A0AEC0" 
                        value={feedbackData[c.id]?.note || ''} 
                        onChangeText={(t) => setFeedbackData({ ...feedbackData, [c.id]: { ...feedbackData[c.id], rating: feedbackData[c.id]?.rating || 0, note: t } })}
                        multiline 
                      />
                      
                      {(feedbackData[c.id]?.rating > 0 && feedbackData[c.id]?.rating <= 3) && (
                        <View style={{ marginBottom: 12, backgroundColor: '#FFF5F5', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FED7D7' }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#C53030', marginBottom: 6 }}>Problem not fully solved?</Text>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={{ flex: 1, padding: 8, borderRadius: 6, backgroundColor: feedbackData[c.id]?.action === 'close' ? '#C53030' : '#FFF', borderWidth: 1, borderColor: '#C53030', alignItems: 'center' }} onPress={() => setFeedbackData({ ...feedbackData, [c.id]: { ...feedbackData[c.id], action: 'close' } })}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: feedbackData[c.id]?.action === 'close' ? '#FFF' : '#C53030' }}>Close Anyway</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 1, padding: 8, borderRadius: 6, backgroundColor: feedbackData[c.id]?.action === 'escalate' ? '#C53030' : '#FFF', borderWidth: 1, borderColor: '#C53030', alignItems: 'center' }} onPress={() => setFeedbackData({ ...feedbackData, [c.id]: { ...feedbackData[c.id], action: 'escalate' } })}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: feedbackData[c.id]?.action === 'escalate' ? '#FFF' : '#C53030' }}>Escalate Issue</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      <TouchableOpacity style={{ backgroundColor: '#1A365D', padding: 10, borderRadius: 8, alignItems: 'center' }} onPress={() => submitFeedback(c.id)}>
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Submit Feedback</Text>
                      </TouchableOpacity>
                    </View>
                  ) : c.rating ? (
                    <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12, color: '#48BB78', fontWeight: '700' }}>✓ Feedback Recorded:</Text>
                      <Text style={{ fontSize: 14, color: '#D69E2E' }}>{'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <SettingsModal visible={settingsModal} onClose={() => setSettingsModal(false)} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' }, content: { flex: 1 }, scroll: { flex: 1, paddingHorizontal: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1A365D', paddingBottom: 8, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 }, tabIcon: { fontSize: 20 },
  tabLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '500' }, tabLabelActive: { color: '#FFF' },
  tabDot: { position: 'absolute', bottom: -8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#63B3ED' },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 16, paddingHorizontal: 4 },
  dashGreeting: { color: '#718096', fontSize: 14 }, dashName: { color: '#1A365D', fontSize: 22, fontWeight: '800' },
  qrBtn: { backgroundColor: '#1A365D', borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 },
  qrIcon: { fontSize: 20 }, qrText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  suggestionBanner: { backgroundColor: '#EBF8FF', borderRadius: 12, flexDirection: 'row', padding: 12, gap: 10, marginBottom: 4, alignItems: 'center' },
  suggestionText: { flex: 1, color: '#2A69AC', fontSize: 12, lineHeight: 18 },
  sectionTitle: { color: '#1A365D', fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 10, paddingHorizontal: 4 },
  classCard: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  classTime: { backgroundColor: '#EBF4FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 52, alignItems: 'center' },
  classTimeText: { color: '#2A69AC', fontSize: 13, fontWeight: '700' },
  classInfo: { flex: 1 }, className: { color: '#1A202C', fontSize: 14, fontWeight: '600', marginBottom: 3 },
  classRoom: { color: '#718096', fontSize: 12 },
  examCard: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 12, borderLeftWidth: 4, borderLeftColor: '#E53E3E', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  examDate: { backgroundColor: '#FFF5F5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 52, alignItems: 'center' },
  examDateText: { color: '#C53030', fontSize: 12, fontWeight: '700' },
  mealCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, gap: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  mealItem: { color: '#1A202C', fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 2 },
  annCard: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  annTitle: { color: '#1A202C', fontSize: 13, fontWeight: '600', marginBottom: 2 }, annTime: { color: '#A0AEC0', fontSize: 11 },
  complaintBtn: { backgroundColor: '#FFF5F5', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#FED7D7' },
  complaintBtnText: { color: '#C53030', fontSize: 14, fontWeight: '700' },
  tabContent: { flex: 1, paddingHorizontal: 16 }, tabTitle: { color: '#1A365D', fontSize: 22, fontWeight: '800', paddingTop: 24, paddingBottom: 16 },
  dayRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  dayBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#EDF2F7', alignItems: 'center' },
  dayBtnActive: { backgroundColor: '#1A365D' }, dayText: { color: '#718096', fontSize: 13, fontWeight: '600' }, dayTextActive: { color: '#FFF' },
  profileHeader: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1A365D', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  profileName: { color: '#1A202C', fontSize: 20, fontWeight: '800' }, profileEmail: { color: '#718096', fontSize: 13 },
  profileBadge: { backgroundColor: '#EBF4FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  profileBadgeText: { color: '#2A69AC', fontSize: 12, fontWeight: '600' },
  menuItem: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8, gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  menuIcon: { fontSize: 20 }, menuLabel: { flex: 1, color: '#1A202C', fontSize: 14, fontWeight: '600' }, menuArrow: { color: '#CBD5E0', fontSize: 20 },
  logoutBtn: { backgroundColor: '#FFF5F5', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  logoutText: { color: '#C53030', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A365D', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#718096', marginBottom: 8 },
  modalDetail: { fontSize: 13, color: '#4A5568', lineHeight: 20 },
  modalInput: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 14, color: '#1A202C', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, backgroundColor: '#EDF2F7', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelTxt: { color: '#718096', fontWeight: '600', fontSize: 14 },
  modalSend: { flex: 1, backgroundColor: '#1A365D', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSendTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  modalClose: { backgroundColor: '#1A365D', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  modalCloseTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  qrCard: { alignItems: 'center', padding: 20, gap: 4 },
  qrPlaceholder: { width: 120, height: 120, backgroundColor: '#EBF4FF', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  eventSlide: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginRight: 12, gap: 12, elevation: 2 },
  eventSlideTitle: { color: '#1A202C', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  eventSlideInfo: { color: '#718096', fontSize: 11 },
  profAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  availIndicator: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  interestChip: { backgroundColor: '#EDF2F7', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  interestChipActive: { backgroundColor: '#1A365D' },
  eventPoster: { backgroundColor: '#FFF', borderRadius: 18, marginRight: 12, overflow: 'hidden', elevation: 4 },
  posterMedia: { height: 148, backgroundColor: '#1A365D', justifyContent: 'space-between' },
  posterMediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)', padding: 12, justifyContent: 'flex-end' },
  posterBody: { padding: 14, gap: 8, backgroundColor: '#FFF' },
  posterTitle: { color: '#1A365D', fontSize: 18, fontWeight: '800', lineHeight: 24 },
  posterDesc: { color: '#4A5568', fontSize: 12, lineHeight: 18 },
  posterMeta: { flexDirection: 'row', gap: 10, marginTop: 2, flexWrap: 'wrap' },
  posterMetaText: { color: '#718096', fontSize: 11, fontWeight: '600' },
  posterBadge: { backgroundColor: 'rgba(17,24,39,0.72)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  posterFallbackIconWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  posterFallbackIcon: { fontSize: 40 },
  posterInfoBox: { backgroundColor: '#E6F0FF', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#1A365D' },
  posterInfoTitle: { color: '#1A365D', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  posterInfoText: { color: '#2D3748', fontSize: 12, lineHeight: 18 },
  interestText: { color: '#718096', fontSize: 12, fontWeight: '500' },
  remindBtn: { backgroundColor: '#EBF4FF', paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  remindBtnActive: { backgroundColor: '#F0FFF4', paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  timetable: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden', elevation: 2 },
  ttHeaderRow: { flexDirection: 'row', backgroundColor: '#1A365D' },
  ttCorner: { width: 50, padding: 8, alignItems: 'center', justifyContent: 'center' },
  ttCornerTxt: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  ttHeaderCell: { flex: 1, padding: 8, alignItems: 'center' },
  ttHeaderTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  ttRow: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#E2E8F0' },
  ttTimeCell: { width: 50, padding: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FAFC' },
  ttTimeTxt: { color: '#718096', fontSize: 10, fontWeight: '600' },
  ttCell: { flex: 1, padding: 6, minHeight: 54, borderLeftWidth: 0.5, borderLeftColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  ttCellFilled: { backgroundColor: '#EBF4FF' },
  ttCellCode: { color: '#1A365D', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  ttCellRoom: { color: '#718096', fontSize: 8, textAlign: 'center', marginTop: 2 },
  calendarItem: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#2A69AC' },
  calDateBox: { backgroundColor: '#1A365D', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 48 },
  calDateNum: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  calDateMonth: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  messageListInfo: { color: '#718096', fontSize: 12, marginTop: -8, marginBottom: 10 },
  msgListCard: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 12, elevation: 2 },
  msgOpenTxt: { color: '#2A69AC', fontSize: 12, fontWeight: '700' },
  msgHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 24, paddingBottom: 10 },
  msgBack: { color: '#1A365D', fontSize: 22, marginRight: 2 },
  msgPartnerName: { color: '#1A202C', fontSize: 16, fontWeight: '700' },
  msgPartnerStatus: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  messageHintBox: { backgroundColor: '#EBF4FF', borderRadius: 10, padding: 10, marginBottom: 8 },
  messageHintText: { color: '#2A69AC', fontSize: 11, lineHeight: 16 },
  conversationBox: { flex: 1, backgroundColor: '#F7FAFC', borderRadius: 12, padding: 8, marginBottom: 8, minHeight: 200 },
  emptyConvText: { color: '#A0AEC0', textAlign: 'center', marginTop: 28, fontSize: 13 },
  convBubble: { maxWidth: '82%', borderRadius: 14, padding: 10, elevation: 1 },
  convBubbleMine: { backgroundColor: '#1A365D' },
  convBubbleOther: { backgroundColor: '#FFF' },
  convText: { color: '#1A202C', fontSize: 13 },
  convTime: { color: '#A0AEC0', fontSize: 9, marginTop: 4, textAlign: 'right' },
  chatComposer: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  chatComposerInput: { flex: 1, backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1A202C' },
  chatSendBtn: { backgroundColor: '#1A365D', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  chatSendTxt: { color: '#FFF', fontWeight: '700' },
  templateRow: { paddingVertical: 6, gap: 8, paddingHorizontal: 4 },
  templateChip: { backgroundColor: '#EDF2F7', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  templateChipText: { color: '#1A365D', fontSize: 12, fontWeight: '600' },
  /* Weather */
  weatherCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A365D', padding: 12, borderRadius: 12, marginTop: 8, paddingHorizontal: 16 },
  weatherTemp: { color: '#FFD36E', fontSize: 20, fontWeight: '800' },
  weatherLabel: { color: '#F0F6FF', fontSize: 12 },
  /* Directory */
  dirSearch: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  dirFilterBtn: { backgroundColor: '#F7FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  dirFilterActive: { backgroundColor: '#1A365D' },
  dirFilterTxt: { color: '#4A5568', fontSize: 13, fontWeight: '700' },
  dirFilterTxtActive: { color: '#FFF' },
  staffCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12, elevation: 2 },
  staffName: { color: '#1A365D', fontSize: 14, fontWeight: '800' },
  staffTitle: { color: '#4A5568', fontSize: 12 },
  staffFaculty: { color: '#718096', fontSize: 11, marginTop: 4 },
  contactBtn: { backgroundColor: '#EDF2F7', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  contactBtnTxt: { fontSize: 16 },
});