export enum PaymentStatus {
  Paid = 'مدفوع',
  Due = 'مستحق',
  Overdue = 'متأخر',
  Processing = 'قيد المعالجة',
}

export interface Payment {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
}

export interface Achievement {
  id: string;
  title: string;
  date: Date;
  description: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface SpecialOccasion {
  id: string;
  title: string;
  date: Date;
  organization_id: string;
  occasion_type: 'orphan_specific' | 'organization_wide' | 'multi_orphan';
  orphan_id?: string; // Nullable for organization-wide occasions
  linked_orphans?: Array<{
    id: string;
    name: string;
  }>; // For multi-orphan occasions
  created_at: Date;
}

export interface Gift {
  id: string;
  from: string;
  item: string;
  date: Date;
}

export interface UpdateLog {
  id: string;
  date: Date;
  author: string;
  note: string;
}

export interface ProgramParticipation {
  status: 'ملتحق' | 'غير ملتحق' | 'مكتمل' | 'بحاجة للتقييم';
  details: string;
}

export interface PsychologicalSupport {
  child: ProgramParticipation;
  guardian: ProgramParticipation;
}

export interface Orphan {
  id: number;
  uuid?: string; // UUID from database for operations
  name: string;
  photoUrl: string;
  age: number;
  dateOfBirth: Date;
  gender: 'ذكر' | 'أنثى';
  healthStatus: string;
  grade: string;
  country: string;
  governorate: string;
  attendance: string;
  performance: string;
  familyStatus: string;
  housingStatus: string;
  guardian: string;
  sponsorId: number;
  sponsorshipType: string;
  teamMemberId: number;
  familyMembers: {
    relationship: string;
    age: number;
  }[];
  hobbies: string[];
  needsAndWishes: string[];
  updateLogs: UpdateLog[];
  educationalProgram: ProgramParticipation;
  psychologicalSupport: PsychologicalSupport;
  payments: Payment[];
  achievements: Achievement[];
  specialOccasions: SpecialOccasion[];
  gifts: Gift[];
}

export interface Sponsor {
  id: number;
  uuid?: string; // UUID from database for operations
  name: string;
  avatarUrl: string;
  sponsoredOrphanIds: number[];
}

export interface Task {
  id: number;
  title: string;
  dueDate: Date;
  completed: boolean;
  orphanId?: number;
}

export interface TeamMember {
  id: number;
  uuid?: string; // UUID from database for operations
  name: string;
  avatarUrl: string;
  assignedOrphanIds: number[];
  tasks: Task[];
}

// Financial System Types
export enum TransactionType {
  Income = 'إيرادات',
  Expense = 'مصروفات',
}

export enum TransactionStatus {
  Completed = 'مكتملة',
  Pending = 'قيد المراجعة',
  Rejected = 'مرفوضة',
}

export interface FinancialTransaction {
  id: string;
  date: Date;
  description: string;
  createdBy: string;
  amount: number;
  status: TransactionStatus;
  type: TransactionType;
  orphanId?: number;
  receipt?: {
    sponsorName: string;
    donationCategory: string;
    amount: number;
    date: Date;
    description: string; // The original description before prefix
    transactionId: string;
    relatedOrphanIds?: number[];
    orphanAmounts?: Record<number, number>; // Map of orphan ID to amount
    orphanPaymentMonths?: Record<number, { month?: number; year: number; isYear: boolean }>; // Map of orphan ID to payment info
  }
}

// Messaging System Types
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: Date | null;
  created_at: Date;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  organization_id: string;
  last_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
  participant?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: 'team_member' | 'sponsor';
  };
  unread_count?: number;
  last_message?: {
    content: string;
    created_at: Date;
  };
}