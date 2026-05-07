// services/aiAssistant.ts
// MUVIA — AI Assistant Service

export type UserRole = 'student' | 'academic' | 'visitor';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function isLikelyValidAnthropicKey(rawKey?: string): boolean {
  if (!rawKey) return false;
  const key = rawKey.trim();
  if (key.includes('...') || key.length < 30) return false;
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key);
}

const SYSTEM_PROMPTS: Record<UserRole, string> = {
  student: `You are the MUVIA AI assistant helping students at MUGLA SITKI KOCMAN UNIVERSITY.
TOPICS: Campus buildings, class schedules, exam calendars, OBS system, clubs, library (Mon-Fri 08:00-22:00, weekends 10:00-18:00), cafeteria (07:00-20:00), health center, bus routes, sports complex, social activities.
RULES: Always reply in English. Prioritize accuracy and clear structure. Give practical next actions. Be concise for simple questions, but provide deeper context when asked. If uncertain, say what is unknown and suggest how to verify.`,
  academic: `You are the MUVIA AI assistant for academic staff.
TOPICS: Academic calendar, grade entry, OBS system, research projects, course management, office hour scheduling, student affairs.
RULES: Always reply in English. Be professional, clear, and action-oriented. Explain options and trade-offs when relevant. If uncertain, clearly state limits and provide safe assumptions.`,
  visitor: `You are the MUVIA AI assistant for campus visitors.
TOPICS: Campus directions, parking, cafeteria, events, admissions, bus routes, facilities.
RULES: Always reply in English. Be warm and informative. Give step-by-step directions when needed. Keep answers natural, easy to follow, and practical.`,
};

export const QUICK_SUGGESTIONS: Record<UserRole, string[]> = {
  student: [
    '📅 Do I have classes today?',
    '🍽️ What\'s the cafeteria menu?',
    '📚 Library hours?',
    '🎓 Any events for my department?',
    '📝 When is my next exam?',
    '🏥 Where is the health center?',
  ],
  academic: [
    '📝 When does grade entry close?',
    '📊 How to access student list?',
    '📧 How to send announcements?',
    '📅 Academic calendar dates?',
    '🔬 Research project submission?',
  ],
  visitor: [
    '🗺️ How do I get to campus?',
    '🅿️ Where is parking?',
    '☕ Where is the cafeteria?',
    '🎓 When is open day?',
    '🚌 Campus bus routes?',
  ],
};

const CAMPUS_KNOWLEDGE = [
  { key: 'library', text: 'Main Library hours: Mon-Fri 08:00-22:00, weekends 10:00-18:00.' },
  { key: 'cafeteria', text: 'Central cafeteria service window: 07:00-20:00; lunch is typically 11:30-14:00.' },
  { key: 'health', text: 'Campus health-related support is coordinated with Faculty of Medicine hospital and health center points.' },
  { key: 'transport', text: 'Campus transport includes ring shuttle services and city connection buses.' },
  { key: 'complaint', text: 'Complaints are triaged, assigned to a manager and unit, and tracked through workflow stages.' },
  { key: 'events', text: 'Events include conference, culture, career, workshop, sports, and social categories.' },
];

function buildGroundingContext(message: string) {
  const m = message.toLowerCase();
  const selected = CAMPUS_KNOWLEDGE.filter((item) => m.includes(item.key)).slice(0, 3);
  if (!selected.length) return '';
  return `\nGROUNDING FACTS:\n${selected.map((s) => `- ${s.text}`).join('\n')}\nUse these facts if relevant.`;
}

export async function sendMessageToAI(
  messages: ChatMessage[],
  userRole: UserRole,
  apiKey: string,
): Promise<string> {
  const model = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
  const latestUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const groundingContext = buildGroundingContext(latestUser);
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      system: `${SYSTEM_PROMPTS[userRole]}${groundingContext}`,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `HTTP ${response.status}`);
  }
  const data = await response.json();
  const content = data.content?.[0];
  if (content?.type === 'text') return content.text;
  throw new Error('Unexpected API response');
}

export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function getDemoResponse(text: string, role: UserRole): string {
  const t = text.toLowerCase();

  if (t.includes('cafeteria') || t.includes('food') || t.includes('menu') || t.includes('meal'))
    return '🍽️ The Central Cafeteria is open daily 07:00-20:00. Lunch is served 11:30-14:00 and dinner 17:30-19:30.\n\n👉 Would you like me to show today\'s menu or point out the cafeteria on the map?';
  if (t.includes('library'))
    return '📚 Main Library: Mon-Fri 08:00-22:00, weekends 10:00-18:00. Open 24/7 during exam weeks!\n\n👉 Would you like me to check the current availability of study rooms?';
  if (t.includes('bus') || t.includes('transport') || t.includes('shuttle'))
    return '🚌 The campus ring shuttle departs every 20 minutes between 08:00-18:00. Municipal buses #2 and #5 connect to the city center.\n\n👉 Shall I direct you to the nearest bus stop based on your location?';
  if (t.includes('health') || t.includes('doctor') || t.includes('hospital'))
    return '🏥 The Campus Health Center is located next to the Faculty of Engineering and is open 08:00-17:00 on weekdays.\n\n👉 Is it an emergency? (If so, please dial 112) Or do you need directions?';
  if (t.includes('exam') || t.includes('midterm') || t.includes('final'))
    return '📝 Your next exam is: Data Structures Midterm, April 28 at 10:00, Room ENG-C301.\n\n👉 Shall I review past exam questions or prepare a study plan for this course?';
  if (t.includes('event') || t.includes('activity') || t.includes('festival'))
    return '🎤 Upcoming events: AI & Future Technologies Panel (April 25), Career Fair 2026 (April 28), and the Spring Hackathon (May 3).\n\n👉 Would you like me to add any of these to your calendar?';
  if (t.includes('class') || t.includes('schedule') || t.includes('calendar'))
    return '📅 You can view your weekly schedule in the Timetable section of the Schedule tab.\n\n👉 Shall I list your remaining classes for today or check your attendance status for a specific course?';
  if (t.includes('professor') || t.includes('academic') || t.includes('office'))
    return '👨‍🏫 You can view academics\' office hours and current availability status in the Messages tab.\n\n👉 Would you like to schedule an appointment or send a direct message to your advisor?';
  if (t.includes('complaint') || t.includes('problem') || t.includes('issue'))
    return '📋 I can forward your complaint directly to the faculty administration.\n\n👉 Is this an infrastructure issue (internet, cleaning, etc.) or an academic one? Please provide details.';
  if (t.includes('hello') || t.includes('hi') || t.includes('hey'))
    return '👋 Hello! I\'m your MUVIA assistant.\n\nHow can I help you today? You can ask me things like:\n• "What\'s for lunch today?"\n• "When is my next exam?"\n• "How late is the library open?"';
  if (t.includes('obs') || t.includes('grade') || t.includes('transcript'))
    return '📊 You can access the OBS system at obs.mu.edu.tr. Your current GPA is 3.42.\n\n👉 Would you like to download a PDF copy of your unofficial transcript?';
  if (t.includes('wifi') || t.includes('internet'))
    return '📶 You can connect to the campus WiFi network "MSKU-Student" or "eduroam" using your OBS credentials.\n\n👉 Are you having trouble connecting? I can send you the step-by-step setup guide.';
  if (t.includes('sport') || t.includes('gym') || t.includes('pool'))
    return '⚽ The Sports Complex is open 06:00-22:00. It features a gym, indoor swimming pool, and tennis courts.\n\n👉 Would you like to book a session for the swimming pool?';
  if (t.includes('club') || t.includes('community'))
    return '🎭 There are over 50 student clubs on campus, ranging from IT and Music to Theater and Outdoor Sports!\n\n👉 If you tell me your interests (e.g., coding, hiking, music), I can recommend the best clubs for you.';
  if (t.includes('parking') || t.includes('park'))
    return '🅿️ The main parking lot is accessible from the West Gate.\n\n👉 Do you want to check the current parking availability (currently 30% empty) or register your vehicle for campus entry?';

  return '🤖 I\'m here to help with campus info! Ask me about classes, exams, events, cafeteria, library, professors, maps, or anything campus-related.\n\n👉 How can I assist you today? Do you have a specific question about the campus?';
}

export function getFollowUpSuggestions(lastUserQuestion: string, lastAssistantResponse: string, role: UserRole): string[] {
  const q = lastUserQuestion.toLowerCase();
  const a = lastAssistantResponse.toLowerCase();
  const t = `${q} ${a}`;

  if (t.includes('cafeteria') || t.includes('yemekhane') || t.includes('menu') || t.includes('meal'))
    return ['💰 How much is lunch?', '📅 Next exam?', '📚 Library hours?'];
  if (t.includes('library') || t.includes('kütüphane'))
    return ['🍽️ Cafeteria menu?', '📝 Next exam?', '🏥 Health center?'];
  if (t.includes('exam') || t.includes('sınav'))
    return ['📚 Library hours?', '👨‍🏫 Professor office hours?', '📅 Events this week?'];
  if (t.includes('event') || t.includes('etkinlik'))
    return ['📝 Next exam?', '🍽️ Cafeteria menu?', '🗺️ How to get there?'];
  if (t.includes('professor') || t.includes('hoca') || t.includes('office'))
    return ['📝 Next exam?', '📅 Events today?', '🍽️ Cafeteria hours?'];
  if (t.includes('bus') || t.includes('otobüs') || t.includes('transport') || t.includes('ulaşım'))
    return ['🅿️ Parking?', '🍽️ Cafeteria?', '📅 Events?'];
  if (t.includes('health') || t.includes('sağlık'))
    return ['🚌 Bus routes?', '📚 Library?', '📅 Events?'];
  if (t.includes('sport') || t.includes('spor'))
    return ['🍽️ Cafeteria?', '📅 Events?', '🗺️ Campus map?'];
  if (t.includes('map') || t.includes('harita') || t.includes('faculty') || t.includes('building'))
    return ['📍 Show nearest faculty?', '🍽️ Where is dining hall?', '🚌 Nearest bus stop?'];

  if (lastUserQuestion.trim().length > 0) {
    return [
      '📌 Can you summarize this in 1 minute?',
      '➡️ What should I do next step by step?',
      '✅ Give me the most accurate answer only',
    ];
  }

  return QUICK_SUGGESTIONS[role].slice(0, 3);
}
