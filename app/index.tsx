import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ImageBackground, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const [counts, setCounts] = useState({ students: 0, faculties: 0, staff: 0 });

  useEffect(() => {
    const targets = { students: 18500, faculties: 14, staff: 650 };
    const steps = 24;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      const t = Math.min(1, step / steps);
      setCounts({
        students: Math.round(targets.students * t),
        faculties: Math.round(targets.faculties * t),
        staff: Math.round(targets.staff * t),
      });
      if (t >= 1) clearInterval(timer);
    }, 60);

    return () => clearInterval(timer);
  }, []);
  return (
    <ImageBackground
      source={require('../assets/university/campus-optimized.jpg')}
      style={st.bgImage}
      imageStyle={st.bgImageStyle}
      resizeMode="cover"
    >
      <View style={st.overlay}>
        <SafeAreaView style={st.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <View style={st.content}>
            <View style={st.header}>
              <Image source={require('../assets/university/logo.png')} style={st.headerLogo} resizeMode="cover" />
              <Text style={st.headerSub}>MUGLA SITKI KOCMAN UNIVERSITY</Text>
              <Text style={st.headerTitle}>MUVIA</Text>

              <View style={st.statsBox}>
                <View style={st.statItem}>
                  <Text style={st.statNumber}>{counts.students.toLocaleString()}</Text>
                  <Text style={st.statLabel}>Students</Text>
                </View>
                <View style={st.statDivider} />
                <View style={st.statItem}>
                  <Text style={st.statNumber}>{counts.faculties}</Text>
                  <Text style={st.statLabel}>Faculties</Text>
                </View>
                <View style={st.statDivider} />
                <View style={st.statItem}>
                  <Text style={st.statNumber}>{counts.staff}</Text>
                  <Text style={st.statLabel}>Staff</Text>
                </View>
              </View>
            </View>

            <View style={st.cardsContainer}>
              <TouchableOpacity style={st.card} onPress={() => router.push('/(auth)/student-login')} activeOpacity={0.85}>
                <View style={st.cardText}><Text style={st.cardTitle}>Student Login</Text><Text style={st.cardDesc}>Courses, exam schedule, grades & more</Text></View>
                <Text style={st.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.card} onPress={() => router.push('/(auth)/academic-login')} activeOpacity={0.85}>
                <View style={st.cardText}><Text style={st.cardTitle}>Academic Staff Login</Text><Text style={st.cardDesc}>Course management, students, announcements</Text></View>
                <Text style={st.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.card} onPress={() => router.push('/(visitor)/home')} activeOpacity={0.85}>
                <View style={st.cardText}><Text style={st.cardTitle}>Visitor Access</Text><Text style={st.cardDesc}>Campus map, events & transportation</Text></View>
                <Text style={st.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.card} onPress={() => router.push('/(admin)/home')} activeOpacity={0.85}>
                <View style={st.cardText}><Text style={st.cardTitle}>Admin Console</Text><Text style={st.cardDesc}>Complaint routing, SLA, workflow management</Text></View>
                <Text style={st.cardArrow}>›</Text>
              </TouchableOpacity>
            </View>
            <Text style={st.footer}>MUVIA © 2026</Text>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const st = StyleSheet.create({
  bgImage: { flex: 1 },
  bgImageStyle: { width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
  container: { flex: 1 },
  content: { flex: 1 },
  header: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 24, paddingTop: 40 },
  headerLogo: { width: 90, height: 90, borderRadius: 45, marginBottom: 16 },
  headerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', lineHeight: 40, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  cardsContainer: { paddingHorizontal: 24, paddingBottom: 10, gap: 6 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,54,93,0.85)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  cardText: { flex: 1 },
  cardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardDesc: { color: '#E2E8F0', fontSize: 12, lineHeight: 16 },
  cardArrow: { color: 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: '300' },
  statsBox: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)', marginHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'space-around', width: '100%' },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  statNumber: { color: '#D4AF37', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#FFFFFF', fontSize: 11, marginTop: 2, opacity: 0.8 },
});