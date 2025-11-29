export enum PaymentStatus {
  Paid = 'مدفوع',
  Due = 'مستحق',
  Overdue = 'متأخر',
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
  }
}