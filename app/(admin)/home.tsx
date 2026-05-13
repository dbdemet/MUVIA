import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as API from '../../services/api';

const STATUS_OPTIONS = ['pending', 'triaged', 'assigned', 'escalated', 'in-progress', 'resolved', 'closed'] as const;
const CATEGORY_OPTIONS = ['incoming', 'resolved', 'closed'] as const;

type ComplaintCategory = (typeof CATEGORY_OPTIONS)[number];

function getComplaintCategory(status: string): ComplaintCategory {
  if (status === 'closed') return 'closed';
  if (status === 'resolved') return 'resolved';
  return 'incoming';
}

// Logout glyph removed — replaced with text inside logout button

export default function AdminComplaintsScreen() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [adminName, setAdminName] = useState('Admin');
  const [expandedSections, setExpandedSections] = useState<Record<ComplaintCategory, boolean>>({
    incoming: true,
    resolved: false,
    closed: false,
  });

  const selected = useMemo(() => complaints.find((c) => c.id === selectedId) || null, [complaints, selectedId]);

  const groupedComplaints = useMemo(() => {
    const groups: Record<ComplaintCategory, any[]> = {
      incoming: [],
      resolved: [],
      closed: [],
    };

    [...complaints]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .forEach((complaint) => {
        const group = getComplaintCategory(complaint.status);
        groups[group].push(complaint);
      });

    return groups;
  }, [complaints]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await SecureStore.getItemAsync('adminAuth');
        if (!auth) {
          router.replace('/(admin)/login');
          return;
        }
        const adminData = JSON.parse(auth);
        setAdminName(adminData.name);
      } catch (e) {
        router.replace('/(admin)/login');
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('adminAuth');
    router.replace('/(admin)/login');
  };

  const load = async () => {
    const data = await API.getAllComplaints();
    if (Array.isArray(data)) {
      setComplaints(data);
      const sorted = [...data].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      if (!selectedId && sorted[0]?.id) setSelectedId(sorted[0].id);
    }
  };

  useEffect(() => { load(); }, []);

  const promote = async (nextStatus?: string) => {
    if (!selected) return;

    const currentId = selected.id;
    const targetStatus = nextStatus || STATUS_OPTIONS[0];

    if (!targetStatus) {
      Alert.alert('Not Allowed', 'You cannot change the status of this complaint.');
      return;
    }

    const res = await API.updateComplaintStatus(
      currentId,
      targetStatus,
      `Status updated to ${targetStatus} by ${adminName}.`,
      adminName
    );

    if (res?.success) {
      const assignedTo = res.complaint?.managerName || 'Next reviewer';
      setComplaints((prev) => prev.map((complaint) => complaint.id === currentId ? { ...complaint, ...res.complaint } : complaint));
      Alert.alert(
        '✅ Status Updated',
        `Complaint moved to: ${targetStatus}\n\nAssigned to: ${assignedTo}`,
        [{ text: 'OK', onPress: () => { load(); } }]
      );
    } else {
      Alert.alert('Error', 'Failed to update complaint status');
    }
  };

  return (
    <>
      <SafeAreaView style={st.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3A1A1A" />
        <View style={st.header}>
          <View>
            <Text style={st.title}>Admin Console</Text>
            <Text style={st.roleTag}>System Admin</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text style={st.adminName}>{adminName}</Text>
            <TouchableOpacity style={st.signOutBox} onPress={handleLogout}>
              <Text style={st.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>

      <View style={st.body}>
        <ScrollView style={st.listCol} showsVerticalScrollIndicator={false}>
          {CATEGORY_OPTIONS.map((category) => {
            const title = category === 'incoming' ? 'Incoming Complaints' : category === 'resolved' ? 'Resolved Complaints' : 'Closed Complaints';
            const count = groupedComplaints[category].length;
            const expanded = expandedSections[category];
            return (
              <View key={category} style={st.sectionCard}>
                <TouchableOpacity
                  style={st.sectionHeader}
                  onPress={() => setExpandedSections((prev) => ({ ...prev, [category]: !prev[category] }))}
                >
                  <View>
                    <Text style={st.sectionTitle}>{title}</Text>
                    <Text style={st.sectionMeta}>{count} complaint{count === 1 ? '' : 's'}</Text>
                  </View>
                  <Text style={st.sectionChevron}>{expanded ? '▾' : '▸'}</Text>
                </TouchableOpacity>

                {expanded && (
                  count > 0 ? groupedComplaints[category].map((c, idx) => (
                    <TouchableOpacity key={`${category}-${c.id}-${idx}`} style={[st.item, selectedId === c.id && st.itemActive]} onPress={() => setSelectedId(c.id)}>
                      <Text style={st.itemTitle}>{c.subject}</Text>
                      <Text style={st.itemMeta}>{c.studentName} • {c.status}</Text>
                      <Text style={st.itemMeta}>{c.routedUnit || 'Unassigned'} • {c.priority || 'medium'}</Text>
                      {c.needsManualReview && <Text style={st.manualTag}>Manual Review Needed</Text>}
                    </TouchableOpacity>
                  )) : <Text style={st.emptyInline}>No complaints in this section.</Text>
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={st.detailCol}>
          {selected ? (
            <>
              <Text style={st.detailTitle}>{selected.subject}</Text>
              <Text style={st.detailLine}>Student: {selected.studentName}</Text>
              <Text style={st.detailLine}>Status: {selected.status}</Text>
              <Text style={st.detailLine}>Manager: {selected.managerName || 'Not assigned'}</Text>
              <Text style={st.detailLine}>Unit: {selected.routedUnit || 'Not assigned'}</Text>
              <Text style={st.detailLine}>Priority: {selected.priority || 'medium'}</Text>
              <Text style={st.detailLine}>Confidence: {typeof selected.llmConfidence === 'number' ? selected.llmConfidence.toFixed(2) : 'n/a'}</Text>
              <Text style={st.summaryTitle}>Summary</Text>
              <Text style={st.summary}>{selected.triageSummary || selected.description}</Text>

              <Text style={st.summaryTitle}>Manual Status</Text>
              <View style={st.statusGrid}>
                {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                style={[st.statusBtn, selected.status === status && st.statusBtnActive]}
                onPress={() => promote(status)}
              >
                <View style={[st.statusCheck, selected.status === status && st.statusCheckActive]}>
                  <Text style={[st.statusCheckMark, selected.status === status && st.statusCheckMarkActive]}>{selected.status === status ? '✓' : ''}</Text>
                </View>
                <Text style={[st.statusBtnText, selected.status === status && st.statusBtnTextActive]}>
                  {status === 'triaged' ? 'Triaged' : status === 'assigned' ? 'Assigned' : status === 'escalated' ? 'Escalated' : status === 'in-progress' ? 'In Progress' : status === 'resolved' ? 'Resolved' : status === 'closed' ? 'Closed' : 'Pending'}
                </Text>
              </TouchableOpacity>
                ))}
              </View>

            </>
          ) : (
            <Text style={st.empty}>Select a complaint to inspect.</Text>
          )}
        </View>
      </View>
      </SafeAreaView>
    </>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { backgroundColor: '#3A1A1A', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  roleTag: { color: '#FBD38D', fontSize: 11, fontWeight: '700', marginTop: 2 },
  adminName: { color: '#CBD5E0', fontSize: 12, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#FFF', borderRadius: 12, width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FED7D7' },
  logoutIconBox: { width: 26, height: 26, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  logoutIconTopBar: { position: 'absolute', left: 5, top: 3, width: 13, height: 4, backgroundColor: '#3E4F89', borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  logoutIconSideTop: { position: 'absolute', left: 2, top: 4, width: 4, height: 10, backgroundColor: '#3E4F89', borderTopLeftRadius: 10, borderBottomLeftRadius: 6 },
  logoutIconSideBottom: { position: 'absolute', left: 2, bottom: 4, width: 4, height: 10, backgroundColor: '#3E4F89', borderTopLeftRadius: 6, borderBottomLeftRadius: 10 },
  logoutIconBottomBar: { position: 'absolute', left: 5, bottom: 3, width: 13, height: 4, backgroundColor: '#3E4F89', borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  logoutIconArrow: { position: 'absolute', right: 1, top: 8, width: 0, height: 0, borderTopWidth: 6, borderBottomWidth: 6, borderLeftWidth: 11, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#EF4444' },
  signOutText: { color: '#C53030', fontSize: 13, fontWeight: '800' },
  signOutBox: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 10, backgroundColor: '#FFF', marginBottom: 8 },
  statText: { color: '#4A5568', fontSize: 12, fontWeight: '600' },
  sectionCard: { marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, overflow: 'hidden', backgroundColor: '#FFF' },
  closedCard: { marginTop: 4 },
  sectionHeader: { paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2A69AC' },
  sectionTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  sectionMeta: { color: '#E6F0FF', fontSize: 11, marginTop: 2 },
  sectionChevron: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  body: { flex: 1, flexDirection: 'row', gap: 10, padding: 10 },
  listCol: { flex: 0.78 },
  detailCol: { flex: 1.62, backgroundColor: '#FFF', borderRadius: 12, padding: 12 },
  item: { backgroundColor: '#FFF', borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  itemActive: { borderColor: '#2A69AC', backgroundColor: '#EBF4FF' },
  itemTitle: { color: '#1A202C', fontSize: 12, fontWeight: '700' },
  itemMeta: { color: '#718096', fontSize: 11, marginTop: 2 },
  manualTag: { marginTop: 5, color: '#C53030', fontWeight: '700', fontSize: 10 },
  emptyInline: { color: '#A0AEC0', fontSize: 12, marginBottom: 10 },
  detailTitle: { color: '#1A202C', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  detailLine: { color: '#4A5568', fontSize: 12, marginBottom: 2 },
  summaryTitle: { color: '#1A365D', fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 4 },
  summary: { color: '#2D3748', fontSize: 12, lineHeight: 18 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EDF2F7', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  statusBtnActive: { backgroundColor: '#2A69AC', borderColor: '#2A69AC' },
  statusCheck: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  statusCheckActive: { borderColor: '#FFF', backgroundColor: '#1D4ED8' },
  statusCheckMark: { fontSize: 11, fontWeight: '900', color: 'transparent', lineHeight: 12 },
  statusCheckMarkActive: { color: '#FFF' },
  statusBtnText: { color: '#4A5568', fontSize: 11, fontWeight: '800' },
  statusBtnTextActive: { color: '#FFF' },
  empty: { color: '#A0AEC0', marginTop: 40, textAlign: 'center' },
});
