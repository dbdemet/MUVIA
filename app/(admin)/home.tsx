import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as API from '../../services/api';
import MapAdminEditor from '../../components/MapAdminEditor';

const STATUS_FLOW = ['pending', 'triaged', 'assigned', 'in-progress', 'resolved', 'closed'] as const;

export default function AdminComplaintsScreen() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [note, setNote] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showMapAdmin, setShowMapAdmin] = useState(false);

  const selected = useMemo(() => complaints.find((c) => c.id === selectedId) || null, [complaints, selectedId]);

  const load = async () => {
    setRefreshing(true);
    const data = await API.getAllComplaints();
    if (Array.isArray(data)) {
      setComplaints(data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
      if (!selectedId && data[0]?.id) setSelectedId(data[0].id);
    }
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const promote = async () => {
    if (!selected) return;
    const currentIndex = STATUS_FLOW.indexOf(selected.status);
    if (currentIndex < 0 || currentIndex >= STATUS_FLOW.length - 1) {
      Alert.alert('No further status', 'Complaint is already at the final state.');
      return;
    }
    const nextStatus = STATUS_FLOW[currentIndex + 1];
    const res = await API.updateComplaintStatus(selected.id, nextStatus, note || `Updated by admin to ${nextStatus}.`, 'Campus Admin');
    if (res?.success) {
      setNote('');
      await load();
    }
  };

  const assign = async () => {
    if (!selected) return;
    const manager = selected.managerName || 'Administrative Manager';
    const unit = selected.routedUnit || 'General Administration Unit';
    const res = await API.assignComplaintOwner(selected.id, manager, unit);
    if (res?.success) await load();
  };

  return (
    <>
      <SafeAreaView style={st.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3A1A1A" />
        <View style={st.header}>
          <Text style={st.title}>Complaint Admin Panel</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={st.refreshBtn} onPress={() => setShowMapAdmin(true)}>
              <Text style={st.refreshBtnText}>🗺️ Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.refreshBtn} onPress={load}>
              <Text style={st.refreshBtnText}>{refreshing ? 'Refreshing...' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>
        </View>

      <View style={st.statsRow}>
        <Text style={st.statText}>Total: {complaints.length}</Text>
        <Text style={st.statText}>Manual Review: {complaints.filter((c) => c.needsManualReview).length}</Text>
        <Text style={st.statText}>In Progress: {complaints.filter((c) => c.status === 'in-progress').length}</Text>
      </View>

      <View style={st.body}>
        <ScrollView style={st.listCol} showsVerticalScrollIndicator={false}>
          {complaints.map((c) => (
            <TouchableOpacity key={c.id} style={[st.item, selectedId === c.id && st.itemActive]} onPress={() => setSelectedId(c.id)}>
              <Text style={st.itemTitle}>{c.subject}</Text>
              <Text style={st.itemMeta}>{c.studentName} • {c.status}</Text>
              <Text style={st.itemMeta}>{c.routedUnit || 'Unassigned'} • {c.priority || 'medium'}</Text>
              {c.needsManualReview && <Text style={st.manualTag}>Manual Review Needed</Text>}
            </TouchableOpacity>
          ))}
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

              <Text style={st.summaryTitle}>Action Plan</Text>
              {(selected.actionPlan || []).map((step: string, idx: number) => (
                <Text key={idx} style={st.plan}>• {step}</Text>
              ))}

              <TextInput
                style={st.noteInput}
                placeholder="Add update note for complainant..."
                placeholderTextColor="#A0AEC0"
                value={note}
                onChangeText={setNote}
                multiline
              />
              <View style={st.actions}>
                <TouchableOpacity style={st.btnSecondary} onPress={assign}>
                  <Text style={st.btnSecondaryText}>Reassign Owner</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.btnPrimary} onPress={promote}>
                  <Text style={st.btnPrimaryText}>Move Next Stage</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={st.empty}>Select a complaint to inspect.</Text>
          )}
        </View>
      </View>
      </SafeAreaView>
      <MapAdminEditor visible={showMapAdmin} onClose={() => setShowMapAdmin(false)} />
    </>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { backgroundColor: '#3A1A1A', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  refreshBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  refreshBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF' },
  statText: { color: '#4A5568', fontSize: 12, fontWeight: '600' },
  body: { flex: 1, flexDirection: 'row', gap: 10, padding: 10 },
  listCol: { flex: 0.9 },
  detailCol: { flex: 1.4, backgroundColor: '#FFF', borderRadius: 12, padding: 12 },
  item: { backgroundColor: '#FFF', borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  itemActive: { borderColor: '#2A69AC', backgroundColor: '#EBF4FF' },
  itemTitle: { color: '#1A202C', fontSize: 12, fontWeight: '700' },
  itemMeta: { color: '#718096', fontSize: 11, marginTop: 2 },
  manualTag: { marginTop: 5, color: '#C53030', fontWeight: '700', fontSize: 10 },
  detailTitle: { color: '#1A202C', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  detailLine: { color: '#4A5568', fontSize: 12, marginBottom: 2 },
  summaryTitle: { color: '#1A365D', fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 4 },
  summary: { color: '#2D3748', fontSize: 12, lineHeight: 18 },
  plan: { color: '#2D3748', fontSize: 12, lineHeight: 17, marginBottom: 2 },
  noteInput: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, fontSize: 12, color: '#1A202C', marginTop: 10, minHeight: 72, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btnSecondary: { flex: 1, backgroundColor: '#EDF2F7', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnPrimary: { flex: 1, backgroundColor: '#2A69AC', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnSecondaryText: { color: '#4A5568', fontSize: 12, fontWeight: '700' },
  btnPrimaryText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  empty: { color: '#A0AEC0', marginTop: 40, textAlign: 'center' },
});
