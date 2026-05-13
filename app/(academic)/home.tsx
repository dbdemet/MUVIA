import { Alert, BackHandler, Dimensions, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore, type AuthStore } from '../../store/useAuthStore';
import AIAssistant from '../../components/AIAssistant';
import CampusMap from '../../components/CampusMap';
import SettingsModal from '../../components/AccessibilitySettingsModal';
import * as API from '../../services/api';

type Tab = 'home' | 'courses' | 'students' | 'messages' | 'map' | 'assistant' | 'profile';
type Avail = 'available' | 'in-meeting' | 'away' | 'on-leave';
const AVAIL_LABELS: Record<Avail, { label: string; color: string; icon: string }> = {
  'available': { label: 'Available', color: '#38A169', icon: '✅' },
  'in-meeting': { label: 'In Meeting', color: '#D69E2E', icon: '🟡' },
  'away': { label: 'Away', color: '#E53E3E', icon: '🔴' },
  'on-leave': { label: 'On Leave', color: '#718096', icon: '⛔' },
};

export default function AcademicHome() {
  const router = useRouter();
  const user = useAuthStore((s: AuthStore) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab !== 'home') { setActiveTab('home'); return true; } return false;
    });
    return () => sub.remove();
  }, [activeTab]);
  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3A2A" />
      <View style={st.content}>
        {activeTab === 'home' && <HomeTab onNav={setActiveTab} />}
        {activeTab === 'courses' && <CoursesTab />}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'map' && <CampusMap userRole="academic" />}
        {activeTab === 'assistant' && <AIAssistant userRole="academic" userName={user?.name} userEmail={user?.email} />}
        {activeTab === 'profile' && <ProfileTab router={router} />}
      </View>
      <View style={st.tabBar}>
        {([
          { key: 'home', icon: '🏠', label: 'Home' }, { key: 'courses', icon: '📖', label: 'Courses' },
          { key: 'messages', icon: '💬', label: 'Messages' }, { key: 'map', icon: '🗺️', label: 'Map' },
          { key: 'assistant', icon: '🤖', label: 'Assistant' }, { key: 'profile', icon: '👤', label: 'Profile' },
        ] as { key: Tab; icon: string; label: string }[]).map(tab => (
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

function HomeTab({ onNav }: { onNav: (t: Tab) => void }) {
  const user = useAuthStore((s: AuthStore) => s.user);
  const [availability, setAvailability] = useState<Avail>('available');
  const [courses, setCourses] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [meal, setMeal] = useState<any>(null);
  const [myRating, setMyRating] = useState(0);
  const [mealTab, setMealTab] = useState<'today' | 'week'>('today');
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [availModal, setAvailModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const evIdx = useRef(0);
  const evScrollRef = useRef<ScrollView>(null);
  const screenW = Dimensions.get('window').width - 56;

  const staticCourseExamInfo = [
    { type: 'Course', title: 'CSE301 - Software Engineering', detail: 'Mon 10:00-12:00 · ENG-214' },
    { type: 'Course', title: 'CSE417 - Human Computer Interaction', detail: 'Wed 13:00-15:00 · LAB-3' },
    { type: 'Exam', title: 'CSE301 Midterm Evaluation Window', detail: 'May 20-24 · Online Grade Entry' },
    { type: 'Exam', title: 'CSE417 Project Jury', detail: 'May 28 · Innovation Hall' },
  ];

  const staticStudentMessages = [
    { fromId: 's2201', fromName: 'Ayse Yilmaz', toId: user?.id || 'a1', content: 'Professor, I uploaded my project report to the system. Could you review it?', read: false, timestamp: new Date().toISOString() },
    { fromId: 's2202', fromName: 'Mehmet Demir', toId: user?.id || 'a1', content: 'Can we meet during office hours to discuss the CSE301 assignment?', read: false, timestamp: new Date(Date.now() - 3600 * 1000).toISOString() },
    { fromId: 's2203', fromName: 'Elif Kaya', toId: user?.id || 'a1', content: 'I would appreciate brief feedback on my quiz result.', read: true, timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  ];

  useEffect(() => {
    API.getCourses().then(d => {
      if (!d) return;
      const email = (user?.email || '').toLowerCase();
      const matched = d.filter((c: any) => c.professorEmail?.toLowerCase() === email);
      setCourses(matched.length > 0 ? matched : d.filter((c: any) => user?.courses?.includes(c.code)));
    });
    API.getMessages(user?.id || 'a1').then((d) => {
      const apiMessages = Array.isArray(d) ? d.filter((m: any) => m.toId === (user?.id || 'a1')) : [];
      setMessages([...staticStudentMessages, ...apiMessages]);
    });
    API.getTodayMeal().then(d => d && setMeal((p: any) => ({ ...p, today: d })));
    API.getWeeklyMeals().then(d => {
      if (Array.isArray(d)) setMeal((p: any) => ({ ...p, weekly: d }));
    });
    API.getEvents(user?.email).then(d => {
      if (Array.isArray(d)) setEvents(d);
    });
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (events.length < 2) return;
    const timer = setInterval(() => {
      evIdx.current = (evIdx.current + 1) % events.length;
      setActiveEventIndex(evIdx.current);
      evScrollRef.current?.scrollTo({ x: evIdx.current * (screenW + 12), animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [events, screenW]);

  const rateMeal = async (r: number) => {
    setMyRating(r);
    const m = meal?.today;
    const res = await API.rateMeal(m?.date, r, user?.email);
    if (res?.success) {
      setMeal((p: any) => ({ ...p, today: { ...p.today, averageRating: res.newRating, ratingCount: res.ratingCount } }));
    }
  };

  const changeAvailability = async (a: Avail) => {
    setAvailability(a);
    await API.updateAvailability(user?.id || 'a1', a, noteText);
    setAvailModal(false);
    Alert.alert('✅ Updated', `Status set to: ${AVAIL_LABELS[a].label}`);
  };

  const unread = messages.filter(m => !m.read).length;
  const av = AVAIL_LABELS[availability];

  return (
    <ScrollView style={st.scroll} showsVerticalScrollIndicator={false}>
      <View style={st.dashHeader}>
        <View style={{ flex: 1 }}>
          <Text style={st.dashGreeting}>Welcome 👋</Text>
          <Text style={st.dashName}>{user?.name ?? 'Professor'}</Text>
        </View>
        <TouchableOpacity style={[st.availBadge, { backgroundColor: av.color + '20', borderColor: av.color }]} onPress={() => setAvailModal(true)}>
          <Text style={{ fontSize: 12 }}>{av.icon}</Text><Text style={[st.availText, { color: av.color }]}>{av.label}</Text>
        </TouchableOpacity>
      </View>
      <View style={st.statsRow}>
        {[{ l: 'Courses', v: String(courses.length), i: '📖', t: 'courses' as Tab }, { l: 'Messages', v: unread > 0 ? String(unread) : '0', i: '💬', t: 'messages' as Tab }, { l: 'Students', v: '42', i: '👥', t: 'students' as Tab }].map((s, i) => (
          <TouchableOpacity key={i} style={st.statCard} onPress={() => onNav(s.t)}>
            <Text style={{ fontSize: 22 }}>{s.i}</Text><Text style={st.statVal}>{s.v}</Text><Text style={st.statLbl}>{s.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
        {(events.length > 0 ? events : [{ title: 'No active events', date: '-', time: '-', location: 'Campus', interestedCount: 0, icon: '📣', description: 'Live event content will appear here.' }]).map((ev: any, i: number) => (
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
                <View style={st.posterBadge}><Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>👥 {ev.interestedCount || 0} interested</Text></View>
              </View>
            </View>
            <View style={st.posterBody}>
              <Text style={st.posterTitle}>{ev.title}</Text>
              <Text style={st.posterDesc} numberOfLines={3}>{ev.description || 'Event details are being prepared.'}</Text>
              <View style={st.posterMeta}>
                <Text style={st.posterMetaText}>📅 {ev.date || '-'}</Text>
                <Text style={st.posterMetaText}>🕐 {ev.time || '-'}</Text>
                <Text style={st.posterMetaText}>📍 {ev.location || 'Campus'}</Text>
                <Text style={st.posterMetaText}>🎟️ {ev.remaining ?? '-'} / {ev.capacity ?? '-'} slots</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={st.eventDotsRow}>
        {(events.length > 0 ? events : [1]).map((_: any, i: number) => (
          <View key={i} style={[st.eventDot, activeEventIndex === i && st.eventDotActive]} />
        ))}
      </View>

      <Text style={st.sectionTitle}>🍽️ Meal Schedule</Text>
      <View style={st.mealTabs}>
        <TouchableOpacity style={[st.mealTabBtn, mealTab === 'today' && st.mealTabBtnActive]} onPress={() => setMealTab('today')}>
          <Text style={[st.mealTabText, mealTab === 'today' && st.mealTabTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.mealTabBtn, mealTab === 'week' && st.mealTabBtnActive]} onPress={() => setMealTab('week')}>
          <Text style={[st.mealTabText, mealTab === 'week' && st.mealTabTextActive]}>Weekly</Text>
        </TouchableOpacity>
      </View>
      {mealTab === 'today' ? (
        <View style={st.mealCard}>
          {(meal?.today?.items || []).map((item: any, i: number) => (
            <Text key={i} style={st.mealItem}>{item.category === 'Soup' ? '🍜' : item.category === 'Main Course' ? '🥩' : item.category === 'Side Dish' ? '🥗' : item.category === 'Dessert' ? '🍰' : '🥤'} {item.name} ({item.calories} cal)</Text>
          ))}
          {(!meal?.today?.items || meal.today.items.length === 0) && <Text style={st.mealEmpty}>No menu published yet.</Text>}
          <View style={st.ratingRow}>
            <Text style={{ color: '#718096', fontSize: 12 }}>Rate: </Text>
            {[1,2,3,4,5].map(s => (
              <TouchableOpacity key={s} onPress={() => rateMeal(s)}><Text style={{ fontSize: 22 }}>{s <= (myRating || 0) ? '⭐' : '☆'}</Text></TouchableOpacity>
            ))}
            <Text style={{ color: '#718096', fontSize: 11, marginLeft: 8 }}>Avg: {meal?.today?.averageRating ?? '-'} ({meal?.today?.ratingCount ?? 0})</Text>
          </View>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {(meal?.weekly || []).map((m: any, i: number) => (
            <View key={i} style={st.mealCard}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: G, marginBottom: 4 }}>{m.dayName || m.day || 'Day'} ({m.date || '-'})</Text>
              {m.items?.map((item: any, j: number) => (
                <Text key={j} style={st.mealItem}>• {item.name} ({item.calories} cal)</Text>
              ))}
            </View>
          ))}
          {(!meal?.weekly || meal.weekly.length === 0) && <Text style={st.mealEmpty}>Weekly menu not available.</Text>}
        </View>
      )}

      <Text style={st.sectionTitle}>📚 Course & Exam Notes</Text>
      {staticCourseExamInfo.map((item, i) => (
        <View key={i} style={st.staticInfoCard}>
          <Text style={st.staticInfoType}>{item.type}</Text>
          <Text style={st.staticInfoTitle}>{item.title}</Text>
          <Text style={st.staticInfoDetail}>{item.detail}</Text>
        </View>
      ))}

      <Text style={st.sectionTitle}>Today's Schedule</Text>
      {courses.slice(0, 3).map((c: any, i: number) => (
        <View key={i} style={st.courseCard}>
          <View style={st.courseTime}><Text style={st.courseTimeText}>{c.startTime}</Text></View>
          <View style={{ flex: 1 }}><Text style={st.courseName}>{c.name}</Text><Text style={st.courseDetail}>📍 {c.room} · 👥 {c.enrolledCount}</Text></View>
        </View>
      ))}
      <Text style={st.sectionTitle}>Office Hours</Text>
      {[{ day: 'Tuesday', time: '14:00-16:00', room: 'ENG-214' }, { day: 'Thursday', time: '10:00-12:00', room: 'ENG-214' }].map((oh, i) => (
        <View key={i} style={st.officeCard}><Text style={st.officeDay}>{oh.day}</Text><Text style={st.officeTime}>🕐 {oh.time} · 📍 {oh.room}</Text></View>
      ))}
      <Text style={st.sectionTitle}>Recent Messages</Text>
      {messages.slice(0, 3).map((msg: any, i: number) => (
        <TouchableOpacity key={i} style={st.msgCard} onPress={() => onNav('messages' as Tab)}>
          <View style={[st.msgAvatar, msg.read && { backgroundColor: '#A0AEC0' }]}><Text style={{ color: '#FFF', fontWeight: '700' }}>{msg.fromName[0]}</Text></View>
          <View style={{ flex: 1 }}><Text style={st.msgName}>{msg.fromName}</Text><Text style={st.msgText} numberOfLines={1}>{msg.content}</Text></View>
          {!msg.read && <View style={st.unreadDot} />}
        </TouchableOpacity>
      ))}
      <View style={{ height: 20 }} />
      <Modal visible={availModal} animationType="slide" transparent>
        <View style={st.modalOverlay}><View style={st.modalBox}>
          <Text style={st.modalTitle}>Update Availability</Text>
          {(Object.keys(AVAIL_LABELS) as Avail[]).map(a => (
            <TouchableOpacity key={a} style={[st.availOption, availability === a && { backgroundColor: AVAIL_LABELS[a].color + '15', borderColor: AVAIL_LABELS[a].color }]} onPress={() => changeAvailability(a)}>
              <Text style={{ fontSize: 16 }}>{AVAIL_LABELS[a].icon}</Text><Text style={{ flex: 1, fontWeight: '600', color: '#1A202C' }}>{AVAIL_LABELS[a].label}</Text>
              {availability === a && <Text>✓</Text>}
            </TouchableOpacity>
          ))}
          <TextInput style={st.modalInput} placeholder="Optional note (e.g., 'Back at 3pm')" placeholderTextColor="#A0AEC0" value={noteText} onChangeText={setNoteText} />
          <TouchableOpacity style={st.modalClose} onPress={() => setAvailModal(false)}><Text style={st.modalCloseTxt}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

function CoursesTab() {
  const user = useAuthStore((s: AuthStore) => s.user);
  const [courses, setCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [annModal, setAnnModal] = useState(false);
  const [annCourse, setAnnCourse] = useState('');
  const [annText, setAnnText] = useState('');
  const [activeSection, setActiveSection] = useState<'courses' | 'exams'>('courses');

  useEffect(() => {
    API.getCourses().then(d => {
      if (!d) return;
      const email = (user?.email || '').toLowerCase();
      // 1) match by professorEmail
      let matched = d.filter((c: any) => c.professorEmail?.toLowerCase() === email);
      // 2) fallback: match by user.courses array (department codes)
      if (matched.length === 0 && user?.courses?.length) {
        matched = d.filter((c: any) => user.courses!.includes(c.code));
      }
      // 3) fallback: match by department name
      if (matched.length === 0 && user?.department) {
        matched = d.filter((c: any) => {
          const profDept = (c.professor || '').toLowerCase();
          return profDept.includes(user.department!.toLowerCase().split(' ')[0]);
        });
      }
      setCourses(matched);
    });
    API.getExams().then(d => {
      if (!Array.isArray(d)) return;
      const myCodes = user?.courses || [];
      setExams(d.filter((e: any) => myCodes.includes(e.courseCode)));
    });
  }, []);

  const sendAnn = async () => {
    if (!annText.trim()) { Alert.alert('Error', 'Announcement text is required.'); return; }
    await API.postAnnouncement({ title: `${annCourse} Announcement`, content: annText, author: user?.name, authorRole: 'academic', courseCode: annCourse, icon: '📢' });
    Alert.alert('✅ Sent', `Announcement sent to all students enrolled in ${annCourse}.`);
    setAnnText(''); setAnnModal(false);
  };

  return (
    <View style={st.tabContent}>
      <Text style={st.tabTitle}>My Courses & Exams</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <TouchableOpacity style={[st.mealTabBtn, activeSection === 'courses' && st.mealTabBtnActive]} onPress={() => setActiveSection('courses')}>
          <Text style={[st.mealTabText, activeSection === 'courses' && st.mealTabTextActive]}>📖 Courses ({courses.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.mealTabBtn, activeSection === 'exams' && st.mealTabBtnActive]} onPress={() => setActiveSection('exams')}>
          <Text style={[st.mealTabText, activeSection === 'exams' && st.mealTabTextActive]}>📝 Exams ({exams.length})</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {activeSection === 'courses' && (
          <>
            {courses.length === 0 && <Text style={{ color: '#A0AEC0', textAlign: 'center', marginTop: 40 }}>No courses assigned yet.</Text>}
            {courses.map((c: any, i: number) => (
              <TouchableOpacity key={i} style={[st.fullCourseCard, expanded === i && { borderWidth: 2, borderColor: '#276749' }]} onPress={() => setExpanded(expanded === i ? null : i)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={st.codeBox}><Text style={st.codeText}>{c.code}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.courseName}>{c.name}</Text>
                    <Text style={st.courseDetail}>📅 {c.day} · 🕐 {c.startTime}-{c.endTime}</Text>
                    <Text style={st.courseDetail}>📍 {c.room} · 👥 {c.enrolledCount} students</Text>
                  </View>
                </View>
                {expanded === i && (
                  <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                    <Text style={{ color: '#4A5568', fontSize: 12, marginBottom: 10 }}>{c.description}</Text>
                    <View style={st.courseActions}>
                      {[{ i: '📢', l: 'Announce' }, { i: '📁', l: 'Materials' }, { i: '👥', l: 'Students' }, { i: '📊', l: 'Grades' }].map((a, j) => (
                        <TouchableOpacity key={j} style={st.actionBtn} onPress={() => { if (a.l === 'Announce') { setAnnCourse(c.code); setAnnModal(true); } }}>
                          <Text style={{ fontSize: 20 }}>{a.i}</Text><Text style={st.actionLabel}>{a.l}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}
        {activeSection === 'exams' && (
          <>
            {exams.length === 0 && <Text style={{ color: '#A0AEC0', textAlign: 'center', marginTop: 40 }}>No upcoming exams.</Text>}
            {exams.map((ex: any, i: number) => (
              <View key={i} style={st.staticInfoCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={st.staticInfoType}>{ex.type}</Text>
                  <Text style={{ color: new Date(ex.date) < new Date() ? '#A0AEC0' : '#E53E3E', fontSize: 10, fontWeight: '700' }}>{new Date(ex.date) < new Date() ? 'PAST' : 'UPCOMING'}</Text>
                </View>
                <Text style={st.staticInfoTitle}>{ex.courseCode} - {ex.courseName}</Text>
                <Text style={st.staticInfoDetail}>📅 {ex.date} · 🕐 {ex.startTime}-{ex.endTime}</Text>
                <Text style={st.staticInfoDetail}>📍 {ex.room} · 👨‍🏫 {ex.professor}</Text>
                {ex.topics?.length > 0 && <Text style={st.staticInfoDetail}>📚 Topics: {ex.topics.join(', ')}</Text>}
                {ex.notes && <Text style={{ color: '#718096', fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>📝 {ex.notes}</Text>}
              </View>
            ))}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
      <Modal visible={annModal} animationType="slide" transparent>
        <View style={st.modalOverlay}><View style={st.modalBox}>
          <Text style={st.modalTitle}>📢 Post Announcement</Text><Text style={st.modalSub}>{annCourse}</Text>
          <TextInput style={[st.modalInput, { minHeight: 80 }]} placeholder="Announcement text..." placeholderTextColor="#A0AEC0" multiline value={annText} onChangeText={setAnnText} textAlignVertical="top" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={st.modalCancel} onPress={() => setAnnModal(false)}><Text style={st.modalCancelTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={st.modalSend} onPress={sendAnn}><Text style={st.modalSendTxt}>Send</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

function MessagesTab() {
  const user = useAuthStore((s: AuthStore) => s.user);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const QUICK_TEMPLATES = [
    'Please visit during office hours.',
    'I will review and reply by tomorrow.',
    'Bring your draft and we will discuss.',
    'Please email your report before Friday.'
  ];

  const staticStudentMessages = [
    { id: 'static1', fromId: 's2201', fromName: 'Ayse Yilmaz', toId: user?.id || 'a1', toName: user?.name || 'Professor', content: 'Professor, I uploaded my project report to the system. Could you review it?', read: false, timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: 'static2', fromId: 's2202', fromName: 'Mehmet Demir', toId: user?.id || 'a1', toName: user?.name || 'Professor', content: 'Can we meet during office hours to discuss the CSE301 assignment?', read: false, timestamp: new Date(Date.now() - 3600 * 1000).toISOString() },
    { id: 'static3', fromId: 's2203', fromName: 'Elif Kaya', toId: user?.id || 'a1', toName: user?.name || 'Professor', content: 'I would appreciate brief feedback on my quiz result.', read: true, timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  ];

  useEffect(() => {
    API.getMessages(user?.id || 'a1').then(d => {
      const apiMsgs = Array.isArray(d) ? d : [];
      const existingIds = new Set(apiMsgs.map((m: any) => m.fromId));
      const seeded = staticStudentMessages.filter(s => !existingIds.has(s.fromId));
      setAllMessages([...seeded, ...apiMsgs]);
    });
  }, []);

  // Group by conversation partner
  const conversations = allMessages.reduce((acc: any[], msg: any) => {
    const partnerId = msg.fromId === (user?.id || 'a1') ? msg.toId : msg.fromId;
    const partnerName = msg.fromId === (user?.id || 'a1') ? (msg.toName || 'Student') : (msg.fromName || 'Student');
    if (!partnerId || !partnerName) return acc;
    if (!acc.find((c: any) => c.partnerId === partnerId)) {
      const partnerMsgs = allMessages.filter((m: any) => m.fromId === partnerId || m.toId === partnerId);
      const lastMessage = partnerMsgs[partnerMsgs.length - 1];
      const unread = allMessages.filter((m: any) => m.fromId === partnerId && m.toId === (user?.id || 'a1') && !m.read).length;
      acc.push({ partnerId, partnerName, lastMsg: lastMessage?.content || msg.content, unread, timestamp: lastMessage?.timestamp || msg.timestamp });
    }
    return acc;
  }, []);

  const openConv = async (partnerId: string, partnerName: string) => {
    setSelectedConv({ partnerId, partnerName });
    // Get API conversation
    const conv = await API.getConversation(user?.id || 'a1', partnerId);
    const apiConv = Array.isArray(conv) ? conv : [];
    // Merge static messages for this partner
    const staticForPartner = staticStudentMessages.filter(s => s.fromId === partnerId || s.toId === partnerId);
    const apiIds = new Set(apiConv.map((m: any) => m.id));
    const merged = [...staticForPartner.filter(s => !apiIds.has(s.id)), ...apiConv].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setConvMessages(merged);
    await API.markConversationRead(user?.id || 'a1', partnerId);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const sendReply = async () => {
    if (!chatInput.trim() || !selectedConv) return;
    const newMsg = { fromId: user?.id || 'a1', fromName: user?.name || 'Professor', fromRole: 'academic', toId: selectedConv.partnerId, toName: selectedConv.partnerName, content: chatInput.trim() };
    await API.sendMessage(newMsg);
    // Optimistic update
    setConvMessages(prev => [...prev, { ...newMsg, id: `opt_${Date.now()}`, timestamp: new Date().toISOString(), read: false }]);
    setChatInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    // Refresh from API
    setTimeout(async () => {
      const conv = await API.getConversation(user?.id || 'a1', selectedConv.partnerId);
      if (Array.isArray(conv) && conv.length > 0) {
        const staticForPartner = staticStudentMessages.filter(s => s.fromId === selectedConv.partnerId);
        const apiIds = new Set(conv.map((m: any) => m.id));
        const merged = [...staticForPartner.filter(s => !apiIds.has(s.id)), ...conv].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setConvMessages(merged);
      }
    }, 600);
  };

  if (selectedConv) {
    return (
      <View style={st.tabContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 24, paddingBottom: 12, gap: 12 }}>
          <TouchableOpacity onPress={() => { setSelectedConv(null); setConvMessages([]); }} style={{ padding: 4 }}><Text style={{ fontSize: 22, color: G }}>←</Text></TouchableOpacity>
          <View style={st.msgAvatar}><Text style={{ color: '#FFF', fontWeight: '700' }}>{selectedConv.partnerName[0]}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: G, fontSize: 17, fontWeight: '700' }}>{selectedConv.partnerName}</Text>
            <Text style={{ color: '#A0AEC0', fontSize: 11 }}>Tap to view profile</Text>
          </View>
        </View>
        <View style={{ flex: 1, backgroundColor: '#F0F4F8', borderRadius: 16, padding: 10, marginBottom: 8 }}>
          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {convMessages.length === 0 && <Text style={{ color: '#A0AEC0', textAlign: 'center', marginTop: 40, fontSize: 13 }}>Start a conversation...</Text>}
            {convMessages.map((msg: any, idx: number) => {
              const isMe = msg.fromId === (user?.id || 'a1');
              return (
                <View key={msg.id || idx} style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                  {!isMe && <Text style={{ color: '#718096', fontSize: 10, marginBottom: 2, marginLeft: 4 }}>{msg.fromName}</Text>}
                  <View style={{ backgroundColor: isMe ? G : '#FFF', borderRadius: 16, borderTopRightRadius: isMe ? 4 : 16, borderTopLeftRadius: isMe ? 16 : 4, padding: 12, maxWidth: '80%', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 }}>
                    <Text style={{ color: isMe ? '#FFF' : '#1A202C', fontSize: 14, lineHeight: 20 }}>{msg.content}</Text>
                    <Text style={{ color: isMe ? 'rgba(255,255,255,0.5)' : '#A0AEC0', fontSize: 9, marginTop: 4, textAlign: 'right' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 6 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.templateRow}>
            {QUICK_TEMPLATES.map((t, i) => (
              <TouchableOpacity key={i} style={st.templateChip} onPress={() => setChatInput(t)}>
                <Text style={st.templateChipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 8 }}>
          <TextInput style={[st.modalInput, { flex: 1, marginBottom: 0 }]} placeholder="Type a reply..." placeholderTextColor="#A0AEC0" value={chatInput} onChangeText={setChatInput} onSubmitEditing={sendReply} />
          <TouchableOpacity style={{ backgroundColor: G, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' }} onPress={sendReply}><Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Send</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={st.tabContent}><Text style={st.tabTitle}>Messages</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {conversations.length === 0 && <Text style={{ color: '#A0AEC0', textAlign: 'center', marginTop: 40 }}>No messages yet</Text>}
        {conversations.map((c: any, i: number) => (
          <TouchableOpacity key={i} style={st.msgCard} onPress={() => openConv(c.partnerId, c.partnerName)}>
            <View style={st.msgAvatar}><Text style={{ color: '#FFF', fontWeight: '700' }}>{(c.partnerName || '?')[0]}</Text></View>
            <View style={{ flex: 1 }}><Text style={st.msgName}>{c.partnerName}</Text><Text style={st.msgText} numberOfLines={1}>{c.lastMsg}</Text></View>
            {c.unread > 0 && <View style={[st.unreadDot, { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>{c.unread}</Text></View>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function StudentsTab() {
  const students = [
    { name: 'Emre Bolat', id: '220501001', course: 'CS301', grade: 'BB', midterm: 72, attendance: 92 },
    { name: 'Ayse Yilmaz', id: '220501002', course: 'CS301', grade: 'AA', midterm: 90, attendance: 98 },
    { name: 'Mehmet Demir', id: '220501003', course: 'CS301', grade: 'CB', midterm: 65, attendance: 78 },
  ];
  return (
    <View style={st.tabContent}><Text style={st.tabTitle}>Student List</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {students.map((s, i) => (
          <TouchableOpacity key={i} style={st.studentCard} onPress={() => Alert.alert(s.name, `ID: ${s.id}\nCourse: ${s.course}\nMidterm: ${s.midterm}\nGrade: ${s.grade}\nAttendance: ${s.attendance}%`)}>
            <View style={st.studentAvatar}><Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>{s.name[0]}</Text></View>
            <View style={{ flex: 1 }}><Text style={st.studentName}>{s.name}</Text><Text style={{ color: '#718096', fontSize: 11 }}>{s.id} · {s.course}</Text></View>
            <View style={st.gradeBadge}><Text style={st.gradeText}>{s.grade}</Text></View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function ProfileTab({ router }: { router: any }) {
  const user = useAuthStore((s: AuthStore) => s.user);
  const logout = useAuthStore((s: AuthStore) => s.logout);
  const [settingsModal, setSettingsModal] = useState(false);
  return (
    <ScrollView style={st.scroll}>
      <View style={st.profileHeader}>
        <View style={st.avatar}><Text style={st.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'D'}</Text></View>
        <Text style={st.profileName}>{user?.name ?? 'Professor'}</Text>
        <Text style={st.profileEmail}>{user?.email ?? 'staff@mu.edu.tr'}</Text>
        <View style={st.profileBadgeGreen}><Text style={st.profileBadgeGreenTxt}>👨‍🏫 Academic Staff · {user?.department}</Text></View>
      </View>
      {[{ i: '📅', l: 'Manage Office Hours' }, { i: '📊', l: 'Grade Reports' }, { i: '🔔', l: 'Notifications' }, { i: '⚙️', l: 'Settings' }].map((item, i) => (
        <TouchableOpacity key={i} style={st.menuItem} onPress={() => { if (item.l === 'Settings') setSettingsModal(true); }}>
          <Text style={{ fontSize: 20 }}>{item.i}</Text><Text style={st.menuLabel}>{item.l}</Text><Text style={{ color: '#CBD5E0', fontSize: 20 }}>›</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={st.logoutBtn} onPress={() => { logout(); router.replace('/'); }}><Text style={st.logoutText}>Sign Out</Text></TouchableOpacity>
      <SettingsModal visible={settingsModal} onClose={() => setSettingsModal(false)} />
    </ScrollView>
  );
}

const G = '#1A3A2A';
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' }, content: { flex: 1 }, scroll: { flex: 1, paddingHorizontal: 16 }, tabContent: { flex: 1, paddingHorizontal: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: G, paddingBottom: 8, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 }, tabIcon: { fontSize: 18 },
  tabLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '500' }, tabLabelActive: { color: '#FFF' },
  tabDot: { position: 'absolute', bottom: -8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#68D391' },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
  dashGreeting: { color: '#718096', fontSize: 14 }, dashName: { color: G, fontSize: 22, fontWeight: '800' },
  availBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', gap: 4, alignItems: 'center', borderWidth: 1 },
  availText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, elevation: 2 },
  statVal: { color: G, fontSize: 20, fontWeight: '800' }, statLbl: { color: '#718096', fontSize: 11 },
  sectionTitle: { color: G, fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  eventPoster: { backgroundColor: '#FFF', borderRadius: 18, marginRight: 12, overflow: 'hidden', elevation: 4 },
  posterMedia: { height: 148, backgroundColor: G, justifyContent: 'space-between' },
  posterMediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)', padding: 12, justifyContent: 'flex-end' },
  posterBody: { padding: 14, gap: 8, backgroundColor: '#FFF' },
  posterTitle: { color: G, fontSize: 18, fontWeight: '800', lineHeight: 24 },
  posterDesc: { color: '#4A5568', fontSize: 12, lineHeight: 18 },
  posterMeta: { flexDirection: 'row', gap: 10, marginTop: 2, flexWrap: 'wrap' },
  posterMetaText: { color: '#718096', fontSize: 11, fontWeight: '600' },
  posterBadge: { backgroundColor: 'rgba(17,24,39,0.72)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  posterFallbackIconWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  posterFallbackIcon: { fontSize: 40 },
  eventDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 4 },
  eventDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#CBD5E0' },
  eventDotActive: { backgroundColor: '#276749' },
  mealTabs: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  mealTabBtn: { backgroundColor: '#EDF2F7', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  mealTabBtnActive: { backgroundColor: '#276749' },
  mealTabText: { color: '#4A5568', fontSize: 12, fontWeight: '700' },
  mealTabTextActive: { color: '#FFF' },
  mealCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, gap: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  mealItem: { color: '#1A202C', fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 2 },
  mealTitle: { color: G, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  mealLine: { color: '#2D3748', fontSize: 12, marginBottom: 4 },
  mealEmpty: { color: '#A0AEC0', fontSize: 12 },
  staticInfoCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#2F855A' },
  staticInfoType: { color: '#2F855A', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  staticInfoTitle: { color: '#1A202C', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  staticInfoDetail: { color: '#718096', fontSize: 12 },
  tabTitle: { color: G, fontSize: 22, fontWeight: '800', paddingTop: 24, paddingBottom: 16 },
  courseCard: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 12, elevation: 2 },
  courseTime: { backgroundColor: '#F0FFF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, minWidth: 52, alignItems: 'center' },
  courseTimeText: { color: '#276749', fontSize: 12, fontWeight: '700' },
  courseName: { color: '#1A202C', fontSize: 14, fontWeight: '600', marginBottom: 3 },
  courseDetail: { color: '#718096', fontSize: 12 },
  officeCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 8, gap: 3, borderLeftWidth: 4, borderLeftColor: '#276749', elevation: 2 },
  officeDay: { color: G, fontSize: 14, fontWeight: '700' }, officeTime: { color: '#718096', fontSize: 13 },
  msgCard: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 12, elevation: 2 },
  msgAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: G, alignItems: 'center', justifyContent: 'center' },
  msgName: { color: '#1A202C', fontSize: 14, fontWeight: '600', marginBottom: 2 }, msgText: { color: '#718096', fontSize: 12 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#276749' },
  fullCourseCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, elevation: 2 },
  codeBox: { backgroundColor: '#F0FFF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  codeText: { color: '#276749', fontSize: 12, fontWeight: '700' },
  courseActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  actionBtn: { flex: 1, minWidth: '45%', backgroundColor: '#F7FAFC', borderRadius: 10, padding: 12, alignItems: 'center', gap: 4 },
  actionLabel: { color: G, fontSize: 12, fontWeight: '600' },
  studentCard: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 12, elevation: 2 },
  studentAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: G, alignItems: 'center', justifyContent: 'center' },
  studentName: { color: '#1A202C', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  gradeBadge: { backgroundColor: '#F0FFF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  gradeText: { color: '#276749', fontSize: 13, fontWeight: '700' },
  availOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  profileHeader: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: G, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  profileName: { color: '#1A202C', fontSize: 20, fontWeight: '800' }, profileEmail: { color: '#718096', fontSize: 13 },
  profileBadgeGreen: { backgroundColor: '#F0FFF4', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  profileBadgeGreenTxt: { color: '#276749', fontSize: 12, fontWeight: '600' },
  menuItem: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8, gap: 14, elevation: 1 },
  menuLabel: { flex: 1, color: '#1A202C', fontSize: 14, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#FFF5F5', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  logoutText: { color: '#C53030', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: G, marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#718096', marginBottom: 16 },
  modalInput: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 14, color: '#1A202C', marginBottom: 12 },
  modalCancel: { flex: 1, backgroundColor: '#EDF2F7', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelTxt: { color: '#718096', fontWeight: '600' },
  modalSend: { flex: 1, backgroundColor: G, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSendTxt: { color: '#FFF', fontWeight: '700' },
  modalClose: { backgroundColor: G, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  modalCloseTxt: { color: '#FFF', fontWeight: '700' },
  templateRow: { paddingVertical: 6, gap: 8, paddingHorizontal: 4 },
  templateChip: { backgroundColor: '#F7FAFC', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, borderWidth:1, borderColor:'#E2E8F0' },
  templateChipText: { color: G, fontSize: 12, fontWeight: '600' },
});