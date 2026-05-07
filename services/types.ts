// services/types.ts
// MUVIA — Shared TypeScript interfaces

export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  faculty: string;
  year: number;
  gpa: number;
  interests: string[];
  enrolledCourses: string[];
}

export interface Academic {
  id: string;
  name: string;
  title: string;
  email: string;
  department: string;
  faculty: string;
  officeRoom: string;
  phone: string;
  courses: string[];
  officeHours: OfficeHour[];
  availability: AvailabilityStatus;
  availabilityNote?: string;
}

export type AvailabilityStatus = 'available' | 'in-meeting' | 'away' | 'on-leave';

export interface OfficeHour {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface Course {
  code: string;
  name: string;
  credits: number;
  professor: string;
  professorEmail: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
  type: 'Lecture' | 'Lab' | 'Seminar';
  description: string;
  enrolledCount: number;
}

export interface Exam {
  id: string;
  courseCode: string;
  courseName: string;
  type: 'Midterm' | 'Final' | 'Quiz';
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  professor: string;
  topics: string[];
  notes?: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: 'Conference' | 'Culture' | 'Career' | 'Sports' | 'Workshop' | 'Social';
  icon: string;
  imageUrl?: string | null;
  targetDepartments?: string[];
  interestedCount: number;
  capacity?: number;
  checkedInCount?: number;
  remaining?: number;
  isFull?: boolean;
  userCheckedIn?: boolean;
  userCheckedOut?: boolean;
  avgSatisfaction?: number;
  feedbackCount?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: 'university' | 'academic';
  courseCode?: string;
  timestamp: string;
  icon: string;
}

export interface MealItem {
  name: string;
  calories: number;
  category: 'Soup' | 'Main Course' | 'Side Dish' | 'Dessert' | 'Beverage';
}

export interface DailyMeal {
  date: string;
  dayName: string;
  items: MealItem[];
  totalCalories: number;
  averageRating: number;
  ratingCount: number;
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  faculty: string;
  category: string;
  subject: string;
  description: string;
  status: 'pending' | 'triaged' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  submittedAt: string;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  routedUnitKey?: 'Infrastructure' | 'IT' | 'Academic' | 'Transport' | 'Security' | 'Health' | 'StudentAffairs' | 'General';
  routedUnit?: string;
  managerName?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  triageSummary?: string;
  actionPlan?: string[];
  llmConfidence?: number;
  needsManualReview?: boolean;
  routingSource?: 'llm' | 'heuristic';
  lastUpdatedAt?: string;
  history?: Array<{
    status: 'pending' | 'triaged' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
    note: string;
    actor: string;
    at: string;
  }>;
}

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  fromRole: 'student' | 'academic';
  toId: string;
  toName: string;
  content: string;
  timestamp: string;
  read: boolean;
}
