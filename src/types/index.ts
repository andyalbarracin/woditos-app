// ─── Enums ───────────────────────────────────────────────────
export type UserRole = "super_admin" | "coach" | "staff" | "member";
export type GroupType = "running" | "functional" | "hybrid";
export type GroupStatus = "active" | "inactive";
export type SessionType = "running" | "functional" | "amrap" | "emom" | "hiit" | "technique";
export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type ReservationStatus = "confirmed" | "waitlist" | "cancelled";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type PostType = "text" | "photo" | "milestone" | "announcement";
export type PostVisibility = "group" | "all_members";
export type DifficultyLevel = "basic" | "intermediate" | "advanced";
export type AchievementType =
  | "attendance_streak"
  | "sessions_milestone"
  | "personal_record"
  | "first_month"
  | "perfect_week";

// ─── Core Models ─────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  birth_date?: string;
  emergency_contact?: string;
  experience_level?: DifficultyLevel;
  goals?: string;
  private_health_notes?: string;
  join_date: string;
  updated_at?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  group_type: GroupType;
  location?: string;
  capacity: number;
  coach_id: string;
  cover_image_url?: string;
  status: GroupStatus;
  created_at: string;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  membership_status: "active" | "inactive" | "pending";
  joined_at: string;
}

export interface Session {
  id: string;
  group_id: string;
  title: string;
  session_type: SessionType;
  start_time: string;
  end_time: string;
  location?: string;
  capacity: number;
  notes?: string;
  status: SessionStatus;
  coach_id?: string;
  created_at?: string;
}

export interface Reservation {
  id: string;
  session_id: string;
  user_id: string;
  reservation_status: ReservationStatus;
  created_at: string;
  cancelled_at?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  user_id: string;
  attendance_status: AttendanceStatus;
  checkin_time?: string;
  notes?: string;
}

export interface Post {
  id: string;
  author_user_id: string;
  group_id?: string;
  content_text?: string;
  media_url?: string;
  post_type: PostType;
  visibility: PostVisibility;
  created_at: string;
  author?: Profile;
  reactions_count?: number;
  comments_count?: number;
  user_reacted?: boolean;
}

export interface Story {
  id: string;
  author_user_id: string;
  group_id?: string;
  media_url: string;
  created_at: string;
  expires_at: string;
  author?: Profile;
  view_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  author_user_id: string;
  content_text: string;
  created_at: string;
  author?: Profile;
}

export interface ExerciseWiki {
  id: string;
  name: string;
  category: string;
  goal?: string;
  muscle_group?: string;
  difficulty_level: DifficultyLevel;
  description: string;
  technique?: string;
  common_mistakes?: string;
  media_url?: string;
  contraindications?: string;
  tags: string[];
}

export interface FoodWiki {
  id: string;
  name: string;
  category: string;
  benefits: string;
  best_time_to_consume?: string;
  performance_relation?: string;
  examples?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export interface CoachNote {
  id: string;
  coach_id: string;
  member_user_id: string;
  group_id?: string;
  note_text: string;
  created_at: string;
  visibility_private: boolean;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  title: string;
  description?: string;
  earned_at: string;
}

export interface MemberStats {
  total_sessions: number;
  attendance_percentage: number;
  current_streak: number;
  longest_streak: number;
  sessions_this_month: number;
}

export interface GroupStats {
  total_members: number;
  active_members: number;
  attendance_rate_30d: number;
  top_sessions: string[];
  occupancy_avg: number;
}

export interface SessionWithDetails extends Session {
  group?: Group;
  coach?: Profile;
  reservation_count: number;
  attendee_count?: number;
  user_reservation?: Reservation;
}
