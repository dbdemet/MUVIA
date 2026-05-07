import { Alert, BackHandler, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
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
  const [availModal, setAvailModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    API.getCourses().then(d => d && setCourses(d.filter((c: any) => user?.courses?.includes(c.code))));
    API.getMessages(user?.id || 'a1').then(d => d && setMessages(d.filter((m: any) => m.toId === (user?.id || 'a1'))));
  }, []);

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
        {[{ l: 'Courses', v: String(courses.length), i: '📖', t: 'courses' as Tab }, { l: 'Messages', v: String(unread), i: '💬', t: 'messages' as Tab }, { l: 'Students', v: '42', i: '👥', t: 'students' as Tab }].map((s, i) => (
          <TouchableOpacity key={i} style={st.statCard} onPress={() => onNav(s.t)}>
            <Text style={{ fontSize: 22 }}>{s.i}</Text><Text style={st.statVal}>{s.v}</Text><Text style={st.statLbl}>{s.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  const [expanded, setExpanded] = useState<number | null>(null);
  const [annModal, setAnnModal] = useState(false);
  const [annCourse, setAnnCourse] = useState('');
  const [annText, setAnnText] = useState('');
  useEffect(() => { API.getCourses().then(d => d && setCourses(d.filter((c: any) => user?.courses?.includes(c.code)))); }, []);
  const sendAnn = async () => {
    if (!annText.trim()) { Alert.alert('Error', 'Announcement text is required.'); return; }
    await API.postAnnouncement({ title: `${annCourse} Announcement`, content: annText, author: user?.name, authorRole: 'academic', courseCode: annCourse, icon: '📢' });
    Alert.alert('✅ Sent', `Announcement sent to all students enrolled in ${annCourse}.`);
    setAnnText(''); setAnnModal(false);
  };
  return (
    <View style={st.tabContent}><Text style={st.tabTitle}>My Courses</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {courses.map((c: any, i: number) => (
          <TouchableOpacity key={i} style={[st.fullCourseCard, expanded === i && { borderWidth: 2, borderColor: '#276749' }]} onPress={() => setExpanded(expanded === i ? null : i)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={st.codeBox}><Text style={st.codeText}>{c.code}</Text></View>
              <View style={{ flex: 1 }}><Text style={st.courseName}>{c.name}</Text><Text style={st.courseDetail}>📅 {c.day} · 📍 {c.room} · 👥 {c.enrolledCount}</Text></View>
            </View>
            {expanded === i && (
              <View style={st.courseActions}>
                {[{ i: '📢', l: 'Announce' }, { i: '📁', l: 'Materials' }, { i: '👥', l: 'Students' }, { i: '📊', l: 'Grades' }].map((a, j) => (
                  <TouchableOpacity key={j} style={st.actionBtn} onPress={() => { if (a.l === 'Announce') { setAnnCourse(c.code); setAnnModal(true); } }}>
                    <Text style={{ fontSize: 20 }}>{a.i}</Text><Text style={st.actionLabel}>{a.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
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
  const QUICK_TEMPLATES = [
    'Please visit during office hours.',
    'I will review and reply by tomorrow.',
    'Bring your draft and we will discuss.',
    'Please email your report before Friday.'
  ];

  useEffect(() => {
    API.getMessages(user?.id || 'a1').then(d => d && setAllMessages(d));
  }, []);

  // Group by conversation partner
  const conversations = allMessages.reduce((acc: any[], msg: any) => {
    const partnerId = msg.fromId === (user?.id || 'a1') ? msg.toId : msg.fromId;
    const partnerName = msg.fromId === (user?.id || 'a1') ? msg.toName : msg.fromName;
    if (!acc.find((c: any) => c.partnerId === partnerId)) {
      const unread = allMessages.filter((m: any) => m.fromId === partnerId && m.toId === (user?.id || 'a1') && !m.read).length;
      acc.push({ partnerId, partnerName, lastMsg: msg.content, unread, timestamp: msg.timestamp });
    }
    return acc;
  }, []);

  const openConv = async (partnerId: string, partnerName: string) => {
    setSelectedConv({ partnerId, partnerName });
    const conv = await API.getConversation(user?.id || 'a1', partnerId);
    if (conv) setConvMessages(conv);
    await API.markConversationRead(user?.id || 'a1', partnerId);
  };

  const sendReply = async () => {
    if (!chatInput.trim() || !selectedConv) return;
    await API.sendMessage({ fromId: user?.id || 'a1', fromName: user?.name || 'Professor', fromRole: 'academic', toId: selectedConv.partnerId, toName: selectedConv.partnerName, content: chatInput.trim() });
    setChatInput('');
    setTimeout(async () => {
      const conv = await API.getConversation(user?.id || 'a1', selectedConv.partnerId);
      if (conv) setConvMessages(conv);
    }, 500);
  };

  if (selectedConv) {
    return (
      <View style={st.tabContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 24, paddingBottom: 12, gap: 12 }}>
          <TouchableOpacity onPress={() => setSelectedConv(null)}><Text style={{ fontSize: 20, color: G }}>←</Text></TouchableOpacity>
          <View style={st.msgAvatar}><Text style={{ color: '#FFF', fontWeight: '700' }}>{selectedConv.partnerName[0]}</Text></View>
          <Text style={{ color: G, fontSize: 18, fontWeight: '700', flex: 1 }}>{selectedConv.partnerName}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#F7FAFC', borderRadius: 12, padding: 8, marginBottom: 8 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {convMessages.map((msg: any, idx: number) => (
              <View key={idx} style={{ alignItems: msg.fromId === (user?.id || 'a1') ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <View style={{ backgroundColor: msg.fromId === (user?.id || 'a1') ? G : '#FFF', borderRadius: 14, padding: 10, maxWidth: '80%', elevation: 1 }}>
                  <Text style={{ color: msg.fromId === (user?.id || 'a1') ? '#FFF' : '#1A202C', fontSize: 13 }}>{msg.content}</Text>
                  <Text style={{ color: msg.fromId === (user?.id || 'a1') ? 'rgba(255,255,255,0.5)' : '#A0AEC0', fontSize: 9, marginTop: 4, textAlign: 'right' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.templateRow}>
            {QUICK_TEMPLATES.map((t, i) => (
              <TouchableOpacity key={i} style={st.templateChip} onPress={() => setChatInput(t)} onLongPress={async () => { setChatInput(t); await sendReply(); }}>
                <Text style={st.templateChipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 8 }}>
          <TextInput style={[st.modalInput, { flex: 1, marginBottom: 0 }]} placeholder="Type a reply..." placeholderTextColor="#A0AEC0" value={chatInput} onChangeText={setChatInput} onSubmitEditing={sendReply} />
          <TouchableOpacity style={{ backgroundColor: G, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' }} onPress={sendReply}><Text style={{ color: '#FFF', fontWeight: '700' }}>Send</Text></TouchableOpacity>
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
            <View style={st.msgAvatar}><Text style={{ color: '#FFF', fontWeight: '700' }}>{c.partnerName[0]}</Text></View>
            <View style={{ flex: 1 }}><Text style={st.msgName}>{c.partnerName}</Text><Text style={st.msgText} numberOfLines={1}>{c.lastMsg}</Text></View>
            {c.unread > 0 && <View style={[st.unreadDot, { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>{c.unread}</Text></View>}
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