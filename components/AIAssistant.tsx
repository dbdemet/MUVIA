import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import {
  ChatMessage, UserRole, QUICK_SUGGESTIONS,
  sendMessageToAI, genId, isLikelyValidAnthropicKey, getDemoResponse, getFollowUpSuggestions,
} from '../services/aiAssistant';
import * as API from '../services/api';

const RAW_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '';

const THEME: Record<UserRole, { primary: string; name: string }> = {
  student:  { primary: '#1A365D', name: 'MUVIA Assistant' },
  academic: { primary: '#1A3A2A', name: 'Academic Assistant' },
  visitor:  { primary: '#2D3748', name: 'Campus Guide' },
};

function TypingDots() {
  const a0 = useRef(new Animated.Value(0)).current;
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const make = (a: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]));
    const l0 = make(a0, 0); const l1 = make(a1, 180); const l2 = make(a2, 360);
    l0.start(); l1.start(); l2.start();
    return () => { l0.stop(); l1.stop(); l2.stop(); };
  }, []);
  return (
    <View style={td.wrap}>
      {[a0, a1, a2].map((a, i) => (
        <Animated.View key={i} style={[td.dot, {
          transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
        }]} />
      ))}
    </View>
  );
}
const td = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#bbb' },
});

function Bubble({ msg, color }: { msg: ChatMessage; color: string }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[bs.row, isUser && bs.rowUser]}>
      {!isUser && (
        <View style={[bs.avatar, { backgroundColor: color }]}>
          <Text style={{ fontSize: 13 }}>🤖</Text>
        </View>
      )}
      <View style={[bs.bubble, isUser ? [bs.bubbleUser, { backgroundColor: color }] : bs.bubbleBot]}>
        <Text style={[bs.text, isUser && { color: '#fff' }]}>{msg.content}</Text>
        <Text style={[bs.time, isUser && { color: 'rgba(255,255,255,0.65)' }]}>
          {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}
const bs = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 16, alignItems: 'flex-end', gap: 8 },
  rowUser: { flexDirection: 'row-reverse' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: '#fff', borderBottomLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  text: { fontSize: 14, color: '#222', lineHeight: 20 },
  time: { fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'right' },
});

interface Props { userRole: UserRole; userName?: string; userEmail?: string; }

export default function AIAssistant({ userRole, userName, userEmail }: Props) {
  const theme = THEME[userRole];
  const scrollRef = useRef<ScrollView>(null);
  const [noKey, setNoKey] = useState(!isLikelyValidAnthropicKey(RAW_KEY));
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Always show fresh greeting with current userName
  useEffect(() => {
    setMessages([{
      id: genId(), role: 'assistant',
      content: userName
        ? `Hello ${userName.split(' ')[0]}! 👋 I'm the MUVIA assistant. I have access to your courses, exams, and campus data. How can I help you today?`
        : `Hello! 👋 Welcome to MUVIA. How can I help you?`,
      timestamp: new Date(),
    }]);
  }, [userName]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStarterMenu, setShowStarterMenu] = useState(false);

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setShowStarterMenu(false);
    const userMsg: ChatMessage = { id: genId(), role: 'user', content: trimmed, timestamp: new Date() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      let reply = '';
      if (userEmail) {
        // Send conversation history for multi-turn context
        const historyForApi = history.slice(-8).map(m => ({ role: m.role, content: m.content }));
        const dynamic = await API.askAssistant({ email: userEmail, role: userRole, message: trimmed, history: historyForApi });
        if (dynamic?.success && dynamic.reply) reply = dynamic.reply;
      }
      if (!reply && !noKey) {
        reply = await sendMessageToAI(history, userRole, RAW_KEY);
      }
      if (!reply) {
        reply = getDemoResponse(trimmed, userRole);
      }
      setMessages(prev => [...prev, { id: genId(), role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch (err: any) {
      const msg = String(err?.message ?? '').toLowerCase();
      if (msg.includes('invalid') || msg.includes('auth') || msg.includes('401')) {
        setNoKey(true);
        setMessages(prev => [...prev, { id: genId(), role: 'assistant', content: getDemoResponse(trimmed, userRole), timestamp: new Date() }]);
      } else {
        setMessages(prev => [...prev, { id: genId(), role: 'assistant', content: '⚠️ Connection error. Please check your internet and try again.', timestamp: new Date() }]);
      }
    } finally { setLoading(false); }
  };

  const suggestionItems = showStarterMenu
    ? QUICK_SUGGESTIONS[userRole]
    : [...getFollowUpSuggestions(lastUserMessage, lastAssistantMessage, userRole), '🏠 Main Menu'];

  const handleSuggestionPress = (suggestion: string) => {
    if (suggestion === '🏠 Main Menu') {
      setShowStarterMenu(true);
      return;
    }
    send(suggestion);
  };

  return (
    <KeyboardAvoidingView style={a.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <View style={[a.header, { backgroundColor: theme.primary }]}>
        <View style={a.headerIconWrap}><Text style={{ fontSize: 18 }}>🤖</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={a.headerTitle}>{theme.name}</Text>
          <Text style={a.headerSub}>{loading ? 'Typing...' : 'Online'}</Text>
        </View>
        {noKey && <View style={a.demoBadge}><Text style={a.demoBadgeTxt}>Demo</Text></View>}
      </View>
      <ScrollView ref={scrollRef} style={a.messages} contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {messages.map(m => <Bubble key={m.id} msg={m} color={theme.primary} />)}
        {loading && (
          <View style={bs.row}>
            <View style={[bs.avatar, { backgroundColor: theme.primary }]}><Text style={{ fontSize: 13 }}>🤖</Text></View>
            <View style={[bs.bubble, bs.bubbleBot]}><TypingDots /></View>
          </View>
        )}
      </ScrollView>
      {!loading && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={a.suggBar} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' }}>
          {suggestionItems.map((s, i) => (
            <TouchableOpacity key={i} style={[a.suggChip, { borderColor: theme.primary }]} onPress={() => handleSuggestionPress(s)}>
              <Text style={[a.suggText, { color: theme.primary }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={a.inputBar}>
        <TextInput style={a.input} placeholder="Ask something..." placeholderTextColor="#aaa" value={input} onChangeText={setInput} onSubmitEditing={() => send(input)} returnKeyType="send" multiline maxLength={500} />
        <TouchableOpacity style={[a.sendBtn, { backgroundColor: theme.primary }, (!input.trim() || loading) && a.sendBtnOff]} onPress={() => send(input)} disabled={!input.trim() || loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={a.sendIco}>➤</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const a = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  headerIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  demoBadge: { backgroundColor: 'rgba(255,200,0,0.22)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,200,0,0.5)' },
  demoBadgeTxt: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  messages: { flex: 1 },
  suggBar: { maxHeight: 52, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#eee' },
  suggChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, backgroundColor: '#fff', elevation: 1 },
  suggText: { fontSize: 12, fontWeight: '600' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, backgroundColor: '#F0F4F8', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#222', maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { opacity: 0.4 },
  sendIco: { color: '#fff', fontSize: 16, marginLeft: 2 },
});
