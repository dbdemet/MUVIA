import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface MapPoint {
  id: number;
  name: string;
  nameEn: string;
  category: string;
  lat: number;
  lng: number;
  description: string;
  floor?: string;
  hours?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  initialPoints?: MapPoint[];
}

export default function MapAdminEditor({ visible, onClose, initialPoints = [] }: Props) {
  const [points, setPoints] = useState<MapPoint[]>(initialPoints);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editName, setEditName] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editHours, setEditHours] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    'Faculty',
    'Academic',
    'Food',
    'Sports',
    'Health',
    'Transport',
    'Social',
  ];

  useEffect(() => {
    if (visible) {
      loadMapConfig();
    }
  }, [visible]);

  const loadMapConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/map-config');
      const data = await response.json();
      if (Array.isArray(data)) {
        setPoints(data);
      }
    } catch (e) {
      console.warn('Failed to load map config:', e);
      Alert.alert('Connection Error', 'Could not load map configuration from server');
    } finally {
      setLoading(false);
    }
  };

  const saveMapConfig = async (newPoints: MapPoint[]) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/map-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPoints),
      });
      const result = await response.json();
      if (result.success) {
        setPoints(newPoints);
        Alert.alert('✓ Saved', 'Map configuration saved successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to save');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save map configuration to server');
      console.warn('Save error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPoint = (point: MapPoint) => {
    setSelectedPoint(point);
    setEditLat(point.lat.toString());
    setEditLng(point.lng.toString());
    setEditName(point.name);
    setEditNameEn(point.nameEn);
    setEditDesc(point.description);
    setEditCategory(point.category);
    setEditHours(point.hours || '');
  };

  const handleUpdatePoint = () => {
    if (!selectedPoint) return;
    if (!editLat || !editLng || !editName || !editNameEn) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const updated = points.map((p) =>
      p.id === selectedPoint.id
        ? {
            ...p,
            lat: parseFloat(editLat),
            lng: parseFloat(editLng),
            name: editName,
            nameEn: editNameEn,
            description: editDesc,
            category: editCategory || p.category,
            hours: editHours,
          }
        : p
    );

    saveMapConfig(updated);
    setSelectedPoint(null);
  };

  const handleAddPoint = () => {
    const newId = Math.max(...points.map((p) => p.id), 0) + 1;
    const newPoint: MapPoint = {
      id: newId,
      name: 'New Location',
      nameEn: 'New Location',
      category: 'Academic',
      lat: 37.163,
      lng: 28.372,
      description: 'New campus location',
      hours: '08:00 - 17:00',
    };
    saveMapConfig([...points, newPoint]);
  };

  const handleDeletePoint = (id: number) => {
    Alert.alert('Delete', 'Remove this location?', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Delete',
        onPress: () => {
          saveMapConfig(points.filter((p) => p.id !== id));
          setSelectedPoint(null);
        },
      },
    ]);
  };

  const handleReset = () => {
    Alert.alert('Reset Map', 'Restore default campus locations?', [
      { text: 'Cancel' },
      {
        text: 'Reset',
        onPress: () => {
          // Reset to default points
          const defaults = [
            {
              id: 1,
              name: 'Rektörlük Binası',
              nameEn: 'Rectorate Building',
              category: 'Academic',
              lat: 37.16378,
              lng: 28.37119,
              description: 'Main administration building',
              hours: '08:00 - 17:00',
            },
            {
              id: 2,
              name: 'Mühendislik Fakültesi',
              nameEn: 'Faculty of Engineering',
              category: 'Faculty',
              lat: 37.16149,
              lng: 28.37598,
              description: 'Engineering Faculty buildings',
              hours: '08:30 - 17:30',
            },
            {
              id: 3,
              name: 'Merkez Kütüphane',
              nameEn: 'Main Library',
              category: 'Academic',
              lat: 37.16327,
              lng: 28.37218,
              description: 'Central library',
              hours: '08:00 - 22:00',
            },
          ];
          saveMapConfig(defaults);
          setSelectedPoint(null);
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>🗺️ Map Icon Manager</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={st.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {selectedPoint ? (
          // Edit mode
          <ScrollView style={st.editPanel}>
            <Text style={st.subtitle}>Editing: {selectedPoint.name}</Text>

            <Text style={st.label}>Location Name (Turkish)</Text>
            <TextInput
              style={st.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g., Mühendislik Fakültesi"
            />

            <Text style={st.label}>Location Name (English)</Text>
            <TextInput
              style={st.input}
              value={editNameEn}
              onChangeText={setEditNameEn}
              placeholder="e.g., Faculty of Engineering"
            />

            <Text style={st.label}>Description</Text>
            <TextInput
              style={[st.input, st.textarea]}
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Description of this location"
              multiline
            />

            <Text style={st.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={st.categoryRow}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    st.categoryBtn,
                    editCategory === cat && st.categoryBtnActive,
                  ]}
                  onPress={() => setEditCategory(cat)}
                >
                  <Text
                    style={[
                      st.categoryBtnText,
                      editCategory === cat && st.categoryBtnTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={st.label}>Latitude (📍 Tap map to auto-fill)</Text>
            <TextInput
              style={st.input}
              value={editLat}
              onChangeText={setEditLat}
              placeholder="37.1630"
              keyboardType="decimal-pad"
            />

            <Text style={st.label}>Longitude</Text>
            <TextInput
              style={st.input}
              value={editLng}
              onChangeText={setEditLng}
              placeholder="28.3720"
              keyboardType="decimal-pad"
            />

            <Text style={st.label}>Opening Hours (optional)</Text>
            <TextInput
              style={st.input}
              value={editHours}
              onChangeText={setEditHours}
              placeholder="08:00 - 17:00"
            />

            <View style={st.buttonRow}>
              <TouchableOpacity
                style={[st.btn, st.btnSave]}
                onPress={handleUpdatePoint}
              >
                <Text style={st.btnText}>💾 Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.btn, st.btnDelete]}
                onPress={() => handleDeletePoint(selectedPoint.id)}
              >
                <Text style={st.btnText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[st.btn, st.btnCancel]}
              onPress={() => setSelectedPoint(null)}
            >
              <Text style={st.btnText}>← Back to List</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          // List mode
          <>
            <ScrollView style={st.listPanel}>
              <Text style={st.hint}>
                📝 Tap a location to edit its position or details
              </Text>
              {points.map((point) => (
                <TouchableOpacity
                  key={point.id}
                  style={st.listItem}
                  onPress={() => handleSelectPoint(point)}
                >
                  <View style={st.listItemLeft}>
                    <Text style={st.listItemName}>{point.name}</Text>
                    <Text style={st.listItemDetail}>
                      {point.nameEn} • {point.category}
                    </Text>
                    <Text style={st.listItemCoord}>
                      📍 {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                    </Text>
                  </View>
                  <Text style={st.listItemIcon}>→</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={st.actionButtons}>
              <TouchableOpacity
                style={[st.btn, st.btnAction]}
                onPress={handleAddPoint}
              >
                <Text style={st.btnText}>➕ Add New Location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.btn, st.btnReset]}
                onPress={handleReset}
              >
                <Text style={st.btnText}>🔄 Reset to Defaults</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#1A365D' },
  closeBtn: { fontSize: 20, color: '#718096', padding: 4 },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  editPanel: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  listPanel: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  hint: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A365D',
    marginBottom: 8,
  },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  categoryRow: { marginBottom: 12 },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  categoryBtnActive: {
    backgroundColor: '#2A69AC',
    borderColor: '#2A69AC',
  },
  categoryBtnText: { color: '#2D3748', fontSize: 12, fontWeight: '600' },
  categoryBtnTextActive: { color: '#FFF' },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemLeft: { flex: 1 },
  listItemName: { fontSize: 14, fontWeight: '700', color: '#1A365D' },
  listItemDetail: { fontSize: 12, color: '#718096', marginTop: 2 },
  listItemCoord: { fontSize: 11, color: '#A0AEC0', marginTop: 4 },
  listItemIcon: { fontSize: 18, color: '#CBD5E0' },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  btnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  btnSave: { backgroundColor: '#276749' },
  btnDelete: { backgroundColor: '#C53030' },
  btnCancel: { backgroundColor: '#A0AEC0' },
  btnAction: { backgroundColor: '#2A69AC' },
  btnReset: { backgroundColor: '#D69E2E' },
});
