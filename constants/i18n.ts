// constants/i18n.ts
// MUVIA — Internationalization (EN default, TR optional)

const translations: Record<string, Record<string, string>> = {
  // ── Navigation ──
  'nav.home': { en: 'Home', tr: 'Ana Sayfa' },
  'nav.schedule': { en: 'Schedule', tr: 'Program' },
  'nav.messages': { en: 'Messages', tr: 'Mesajlar' },
  'nav.map': { en: 'Map', tr: 'Harita' },
  'nav.assistant': { en: 'Assistant', tr: 'Asistan' },
  'nav.profile': { en: 'Profile', tr: 'Profil' },
  'nav.courses': { en: 'Courses', tr: 'Dersler' },

  // ── Welcome / Login ──
  'welcome.university': { en: 'MUGLA SITKI KOCMAN UNIVERSITY', tr: 'Muğla Sıtkı Koçman Üniversitesi' },
  'welcome.appName': { en: 'MUVIA', tr: 'MUVIA' },
  'welcome.desc': { en: 'Find your way around campus, track events,\nconnect with professors, and manage your journey.', tr: 'Kampüste yolunuzu bulun, etkinlikleri takip edin,\nhocalarınızla bağlantı kurun.' },
  'welcome.studentLogin': { en: 'Student Login', tr: 'Öğrenci Girişi' },
  'welcome.studentDesc': { en: 'Courses, exam schedule, grades & more', tr: 'Dersler, sınav takvimi, notlar ve daha fazlası' },
  'welcome.academicLogin': { en: 'Academic Staff Login', tr: 'Akademik Personel Girişi' },
  'welcome.academicDesc': { en: 'Course management, students, announcements', tr: 'Ders yönetimi, öğrenciler, duyurular' },
  'welcome.visitorAccess': { en: 'Visitor Access', tr: 'Ziyaretçi Erişimi' },
  'welcome.visitorDesc': { en: 'Campus map, events & transportation', tr: 'Kampüs haritası, etkinlikler ve ulaşım' },
  'welcome.adminConsole': { en: 'Admin Console', tr: 'Yönetim Konsolu' },
  'welcome.adminDesc': { en: 'Complaint routing, SLA, workflow management', tr: 'Şikayet yönlendirme, SLA, iş akışı yönetimi' },

  // ── Auth ──
  'auth.signIn': { en: 'Sign In', tr: 'Giriş Yap' },
  'auth.signingIn': { en: 'Signing in...', tr: 'Giriş yapılıyor...' },
  'auth.studentTitle': { en: 'Student Login', tr: 'Öğrenci Girişi' },
  'auth.studentSub': { en: 'Sign in with your MSKU account', tr: 'MSKÜ hesabınızla giriş yapın' },
  'auth.academicTitle': { en: 'Academic Staff Login', tr: 'Akademik Personel Girişi' },
  'auth.academicSub': { en: 'Sign in with your MSKU staff account', tr: 'MSKÜ personel hesabınızla giriş yapın' },
  'auth.email': { en: 'University Email', tr: 'Üniversite E-postası' },
  'auth.password': { en: 'Password', tr: 'Şifre' },
  'auth.emailPlaceholder': { en: 'username@posta.mu.edu.tr', tr: 'kullaniciadi@posta.mu.edu.tr' },
  'auth.passwordPlaceholder': { en: 'Enter your password', tr: 'Şifrenizi girin' },
  'auth.forgotPassword': { en: 'Forgot password?', tr: 'Şifremi unuttum?' },
  'auth.studentInfo': { en: '🔒  Use your OBS credentials to sign in.\nYour data is protected by MSKU security standards.', tr: '🔒  OBS kimlik bilgilerinizi kullanarak giriş yapın.\nVerileriniz MSKÜ güvenlik standartlarıyla korunmaktadır.' },
  'auth.academicInfo': { en: '🔒  Use your OBS staff credentials.\nAccess restricted to authorized personnel.', tr: '🔒  OBS personel kimlik bilgilerinizi kullanın.\nErişim yetkili personelle sınırlıdır.' },
  'auth.back': { en: '← Back', tr: '← Geri' },
  'auth.emailRequired': { en: 'Email and password are required.', tr: 'E-posta ve şifre gereklidir.' },

  // ── Home ──
  'home.welcomeBack': { en: 'Welcome back,', tr: 'Tekrar hoş geldiniz,' },
  'home.student': { en: 'Student', tr: 'Öğrenci' },
  'home.eventPosters': { en: '🎪 Event Posters', tr: '🎪 Etkinlik Afişleri' },
  'home.todaysClasses': { en: "Today's Classes", tr: 'Bugünkü Dersler' },
  'home.upcomingExams': { en: 'Upcoming Exams', tr: 'Yaklaşan Sınavlar' },
  'home.todaysMenu': { en: "Today's Menu 🍽️", tr: 'Günün Menüsü 🍽️' },
  'home.announcements': { en: 'Announcements', tr: 'Duyurular' },
  'home.yourProfessors': { en: 'Your Professors', tr: 'Hocalarınız' },
  'home.submitComplaint': { en: '📋 Submit a Complaint', tr: '📋 Şikayet Bildir' },
  'home.communityLayer': { en: 'Community', tr: 'Topluluk' },
  'home.sportsBoard': { en: '⚽ Sports Board', tr: '⚽ Spor İlanları' },
  'home.interested': { en: 'interested', tr: 'ilgili' },
  'home.available': { en: 'available', tr: 'mevcut' },
  'home.checkIn': { en: 'Check-In', tr: 'Giriş Yap' },
  'home.checkOut': { en: 'Check-Out', tr: 'Çıkış Yap' },
  'home.feedback': { en: 'Feedback', tr: 'Geri Bildirim' },
  'home.rate': { en: 'Rate:', tr: 'Puan:' },
  'home.avg': { en: 'Avg:', tr: 'Ort:' },
  'home.chat': { en: '💬 Chat', tr: '💬 Sohbet' },
  'home.inOffice': { en: '✅ In Office', tr: '✅ Ofiste' },
  'home.inMeeting': { en: '🟡 In Meeting', tr: '🟡 Toplantıda' },
  'home.away': { en: '🔴 Away', tr: '🔴 Uzakta' },
  'home.recommended': { en: 'Recommended for', tr: 'Önerilir:' },
  'home.eventFeedbackRecorded': { en: 'Your event feedback has been recorded.', tr: 'Etkinlik memnuniyet anketiniz kaydedildi.' },
  'home.emptySlots': { en: 'available', tr: 'boş' },
  'home.noEvents': { en: 'Personalized event recommendations will appear here when live event data is available.', tr: 'Canlı etkinlik verileri mevcut olduğunda kişiselleştirilmiş etkinlik önerileri burada görünecektir.' },

  // ── Complaint ──
  'complaint.title': { en: '📋 Submit Complaint', tr: '📋 Şikayet Bildir' },
  'complaint.info': { en: 'Our smart system will automatically route your complaint to the correct department.', tr: 'Akıllı sistemimiz şikayetinizi otomatik olarak doğru birime yönlendirecektir.' },
  'complaint.subject': { en: 'Subject (e.g., Broken bench, WiFi issue)', tr: 'Konu (ör. Kırık bank, WiFi sorunu)' },
  'complaint.description': { en: 'Describe the issue in detail...', tr: 'Sorunu ayrıntılı olarak açıklayın...' },
  'complaint.cancel': { en: 'Cancel', tr: 'İptal' },
  'complaint.submit': { en: 'Submit', tr: 'Gönder' },
  'complaint.fillAll': { en: 'Please fill all fields.', tr: 'Lütfen tüm alanları doldurun.' },
  'complaint.submitted': { en: '✅ Request Submitted', tr: '✅ Talep Gönderildi' },
  'complaint.submittedMsg': { en: 'Your request has been successfully registered.', tr: 'Talebiniz başarıyla kaydedildi.' },
  'complaint.refId': { en: 'Reference ID', tr: 'Referans No' },
  'complaint.deptAssigned': { en: '🏢 Department Assigned', tr: '🏢 Birim Atandı' },
  'complaint.routedTo': { en: 'Your request has been routed to the relevant unit.', tr: 'Talebiniz ilgili birime yönlendirildi.' },
  'complaint.assignedTo': { en: 'Assigned To', tr: 'Atanan' },
  'complaint.department': { en: 'Department', tr: 'Birim' },
  'complaint.trackMsg': { en: 'You can track further updates in Profile > Complaint History.', tr: 'Güncellemeleri Profil > Şikayet Geçmişi bölümünden takip edebilirsiniz.' },
  'complaint.status.pending': { en: 'PENDING', tr: 'BEKLİYOR' },
  'complaint.status.triaged': { en: 'TRIAGED', tr: 'AYRILDI' },
  'complaint.status.assigned': { en: 'ASSIGNED', tr: 'BİRİMLERE ATANDI' },
  'complaint.status.in-progress': { en: 'IN PROGRESS', tr: 'İŞLEMDE' },
  'complaint.status.resolved': { en: 'RESOLVED', tr: 'ÇÖZÜLDÜ' },
  'complaint.status.closed': { en: 'CLOSED', tr: 'KAPATILDI' },
  'complaint.status.escalated': { en: 'ESCALATED', tr: 'ESCALATED' },

  // ── Profile ──
  'profile.myGrades': { en: 'My Grades', tr: 'Notlarım' },
  'profile.transcript': { en: 'Transcript', tr: 'Transkript' },
  'profile.notifications': { en: 'Notifications', tr: 'Bildirimler' },
  'profile.complaintHistory': { en: 'Complaint History', tr: 'Şikayet Geçmişi' },
  'profile.settings': { en: 'Settings', tr: 'Ayarlar' },
  'profile.interests': { en: 'My Interests & Hobbies', tr: 'İlgi Alanlarım ve Hobiler' },
  'profile.interestsDesc': { en: 'Select academic interests and hobbies for personalized recommendations', tr: 'Kişiselleştirilmiş öneriler için akademik ilgi alanlarını ve hobiler seçin' },
  'profile.signOut': { en: 'Sign Out', tr: 'Çıkış Yap' },
  'profile.yourRequests': { en: 'Your Requests', tr: 'Talepleriniz' },
  'profile.noComplaints': { en: 'No complaints found in your history.', tr: 'Geçmişinizde şikayet bulunamadı.' },
  'profile.officialResponse': { en: 'Official Response:', tr: 'Resmi Yanıt:' },
  'profile.satisfied': { en: 'Were you satisfied with this resolution?', tr: 'Bu çözümden memnun kaldınız mı?' },
  'profile.submitFeedback': { en: 'Submit Feedback', tr: 'Geri Bildirim Gönder' },
  'profile.feedbackRecorded': { en: '✓ Feedback Recorded:', tr: '✓ Geri Bildirim Kaydedildi:' },
  'profile.ratingRequired': { en: 'Please provide a star rating.', tr: 'Lütfen yıldız puanı verin.' },
  'profile.thankYou': { en: 'Thank You', tr: 'Teşekkürler' },
  'profile.feedbackSuccess': { en: 'Your feedback has been successfully recorded.\n\nThe administration carefully reviews all feedback to continuously improve campus services and ensure your satisfaction.', tr: 'Geri bildiriminiz başarıyla kaydedildi.\n\nYönetim, kampüs hizmetlerini sürekli iyileştirmek için tüm geri bildirimleri dikkatlice incelemektedir.' },
  'profile.feedbackError': { en: 'Could not submit feedback. Please ensure the backend server is running and updated.', tr: 'Geri bildirim gönderilemedi. Lütfen sunucunun çalıştığından emin olun.' },

  // ── Settings ──
  'settings.title': { en: '⚙️ Settings', tr: '⚙️ Ayarlar' },
  'settings.language': { en: '🌐 Language', tr: '🌐 Dil' },
  'settings.theme': { en: '🎨 Theme', tr: '🎨 Tema' },
  'settings.blueLightFilter': { en: '🔅 Blue Light Filter', tr: '🔅 Mavi Işık Filtresi' },
  'settings.blueLightDesc': { en: 'Reduces blue light to ease eye strain', tr: 'Göz yorgunluğunu azaltmak için mavi ışığı azaltır' },
  'settings.done': { en: 'Done', tr: 'Tamam' },
  'settings.light': { en: '☀️ Light', tr: '☀️ Açık' },
  'settings.dark': { en: '🌙 Dark', tr: '🌙 Koyu' },

  // ── Schedule ──
  'schedule.title': { en: 'Schedule', tr: 'Program' },
  'schedule.timetable': { en: '📅 Timetable', tr: '📅 Ders Programı' },
  'schedule.eventCalendar': { en: '🗓️ Event Calendar', tr: '🗓️ Etkinlik Takvimi' },
  'schedule.exams': { en: '📝 Exams', tr: '📝 Sınavlar' },
  'schedule.tapCell': { en: 'Tap a cell to see course details', tr: 'Ders detaylarını görmek için bir hücreye dokunun' },

  // ── Messages ──
  'messages.title': { en: 'Messages', tr: 'Mesajlar' },
  'messages.selectAcademic': { en: 'Select an academic staff member to start or continue a conversation.', tr: 'Bir akademik personel seçerek sohbet başlatın veya devam edin.' },
  'messages.noMessages': { en: 'No messages yet. Start a conversation!', tr: 'Henüz mesaj yok. Bir sohbet başlatın!' },
  'messages.typeMessage': { en: 'Type your message...', tr: 'Mesajınızı yazın...' },
  'messages.send': { en: 'Send', tr: 'Gönder' },
  'messages.open': { en: 'Open', tr: 'Aç' },
  'messages.available': { en: 'Your instructor is currently available. You can continue this conversation now.', tr: 'Hocanız şu anda müsait. Bu sohbete devam edebilirsiniz.' },
  'messages.unavailable': { en: 'Instructor is not currently available, but you can still leave a message.', tr: 'Hoca şu anda müsait değil, ancak yine de mesaj bırakabilirsiniz.' },

  // ── QR ID ──
  'qr.title': { en: '📲 Digital Student ID', tr: '📲 Dijital Öğrenci Kimliği' },
  'qr.scan': { en: 'Scan to verify identity', tr: 'Kimliği doğrulamak için tarayın' },
  'qr.close': { en: 'Close', tr: 'Kapat' },

  // ── Common ──
  'common.close': { en: 'Close', tr: 'Kapat' },
  'common.error': { en: 'Error', tr: 'Hata' },
  'common.success': { en: 'Success', tr: 'Başarılı' },
  'common.time': { en: 'Time', tr: 'Saat' },
  'common.join': { en: 'Join', tr: 'Katıl' },
  'common.leave': { en: 'Leave', tr: 'Ayrıl' },
  'common.members': { en: 'members', tr: 'üye' },
  'common.president': { en: 'President', tr: 'Başkan' },
  'common.lookingFor': { en: 'Looking for', tr: 'Aranıyor' },
  'common.apply': { en: 'Apply', tr: 'Başvur' },
};

let currentLang: 'en' | 'tr' = 'en';

export function setLanguage(lang: 'en' | 'tr') {
  currentLang = lang;
}

export function getLanguage(): 'en' | 'tr' {
  return currentLang;
}

export function t(key: string, lang?: 'en' | 'tr'): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry['en'] || key;
}
