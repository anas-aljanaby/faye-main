import { Orphan, Sponsor, TeamMember, PaymentStatus, FinancialTransaction, TransactionType, TransactionStatus } from './types';

export const sponsors: Sponsor[] = [
  { id: 1, name: 'عبدالله الراجحي', sponsoredOrphanIds: [1, 3] },
  { id: 2, name: 'فاطمة الأحمد', sponsoredOrphanIds: [2] },
];

export const orphans: Orphan[] = [
  {
    id: 1,
    name: 'أحمد خالد',
    photoUrl: 'https://picsum.photos/seed/ahmad/200/200',
    age: 9,
    dateOfBirth: new Date('2015-09-25'),
    gender: 'ذكر',
    healthStatus: 'جيدة، يعاني من حساسية موسمية',
    grade: 'الصف الرابع الابتدائي',
    country: 'العراق',
    governorate: 'بغداد',
    attendance: 'منتظم',
    performance: 'ممتاز',
    familyStatus: 'يتيم الأب, الأم ربة منزل',
    housingStatus: 'سكن بالإيجار، حالته جيدة',
    guardian: 'والدته',
    sponsorId: 1,
    sponsorshipType: 'كفالة شهرية شاملة',
    teamMemberId: 0, // Team members don't have direct relationships with orphans
    familyMembers: [
        { relationship: 'الأم', age: 35 },
        { relationship: 'أخت', age: 8 }
    ],
    hobbies: ['قراءة القرآن', 'الرسم', 'كرة القدم'],
    needsAndWishes: ['جهاز لابتوب للدراسة', 'دروس تقوية في اللغة الإنجليزية'],
    updateLogs: [
        { id: 'ul1', date: new Date('2024-07-20'), author: 'خالد الغامدي', note: 'تم تحديث الحالة الصحية بناءً على آخر زيارة طبية.' },
        { id: 'ul2', date: new Date('2024-06-15'), author: 'مدير النظام', note: 'تم تسجيل إنجاز جديد في مسابقة القرآن الكريم.' },
    ],
    educationalProgram: {
        status: 'ملتحق',
        details: 'برنامج تحفيظ القرآن الكريم ودروس تقوية في الرياضيات.',
    },
    psychologicalSupport: {
        child: { status: 'بحاجة للتقييم', details: 'يظهر عليه بعض علامات الانطواء بعد وفاة والده.' },
        guardian: { status: 'غير ملتحق', details: 'الأم تبدو متماسكة، ولكن يوصى بمتابعة دورية.' },
    },
    payments: [
      { id: 'p1', amount: 50, dueDate: new Date('2024-01-01'), status: PaymentStatus.Paid, paidDate: new Date('2024-01-01') },
      { id: 'p2', amount: 50, dueDate: new Date('2024-02-01'), status: PaymentStatus.Paid, paidDate: new Date('2024-02-01') },
      { id: 'p3', amount: 50, dueDate: new Date('2024-03-01'), status: PaymentStatus.Paid, paidDate: new Date('2024-02-28') },
      { id: 'p4', amount: 50, dueDate: new Date('2024-04-01'), status: PaymentStatus.Paid, paidDate: new Date('2024-03-30') },
      { id: 'p5', amount: 50, dueDate: new Date('2024-05-01'), status: PaymentStatus.Overdue },
      { id: 'p6', amount: 50, dueDate: new Date('2024-06-01'), status: PaymentStatus.Due },
      { id: 'p7', amount: 50, dueDate: new Date('2024-07-01'), status: PaymentStatus.Due },
    ],
    achievements: [
        { id: 'a1', title: 'المركز الأول في مسابقة القرآن الكريم', date: new Date('2024-03-15'), description: 'تفوق على 50 متسابقاً في المسابقة السنوية للمدرسة.', mediaUrl: 'https://picsum.photos/seed/quran-award/400/300', mediaType: 'image' },
        { id: 'a2', title: 'شهادة تقدير في مادة الرياضيات', date: new Date('2023-11-20'), description: 'لتحقيقه أعلى الدرجات على مستوى الصف.' },
    ],
    specialOccasions: [
        { id: 'o1', title: 'عيد الميلاد', date: new Date('2024-09-25') },
        { id: 'o2', title: 'بداية العام الدراسي', date: new Date('2024-09-01') },
    ],
    gifts: [
        { id: 'g1', from: 'الكافل عبدالله الراجحي', item: 'حقيبة مدرسية متكاملة', date: new Date('2023-08-28') }
    ]
  },
  {
    id: 2,
    name: 'سارة علي',
    photoUrl: 'https://picsum.photos/seed/sara/200/200',
    age: 8,
    dateOfBirth: new Date('2016-12-10'),
    gender: 'أنثى',
    healthStatus: 'جيدة، تحتاج لمتابعة دورية للنظر',
    grade: 'الصف الثاني الابتدائي',
    country: 'العراق',
    governorate: 'البصرة',
    attendance: 'منتظمة',
    performance: 'جيد جداً',
    familyStatus: 'يتيمة الأبوين',
    housingStatus: 'تعيش مع جدتها في سكن متواضع',
    guardian: 'جدتها',
    sponsorId: 2,
    sponsorshipType: 'كفالة تعليمية',
    teamMemberId: 2,
    familyMembers: [
        { relationship: 'الجدة', age: 62 }
    ],
    hobbies: ['قراءة القصص', 'التلوين'],
    needsAndWishes: ['نظارة طبية جديدة', 'ملابس شتوية', 'دمية'],
    updateLogs: [
        { id: 'ul3', date: new Date('2024-07-18'), author: 'نورة السعد', note: 'تمت زيارة منزل اليتيمة، الجدة بحاجة إلى متابعة صحية.' },
        { id: 'ul4', date: new Date('2024-05-10'), author: 'نورة السعد', note: 'تم تحديد الحاجة لنظارة طبية جديدة.' },
    ],
     educationalProgram: {
        status: 'غير ملتحق',
        details: 'مستواها جيد حالياً، لا توجد حاجة لبرامج إضافية.',
    },
    psychologicalSupport: {
        child: { status: 'ملتحق', details: 'جلسات دعم نفسي أسبوعية لمساعدتها على التكيف.' },
        guardian: { status: 'ملتحق', details: 'الجدة تتلقى دعماً اجتماعياً وجلسات إرشادية.' },
    },
    payments: [
      { id: 'p8', amount: 50, dueDate: new Date('2024-04-15'), status: PaymentStatus.Paid, paidDate: new Date('2024-04-15') },
      { id: 'p9', amount: 50, dueDate: new Date('2024-05-15'), status: PaymentStatus.Paid, paidDate: new Date('2024-05-14') },
      { id: 'p10', amount: 50, dueDate: new Date('2024-06-15'), status: PaymentStatus.Due },
    ],
    achievements: [],
    specialOccasions: [
        { id: 'o3', title: 'عيد الميلاد', date: new Date('2024-12-10') },
    ],
    gifts: []
  },
  {
    id: 3,
    name: 'يوسف محمد',
    photoUrl: 'https://picsum.photos/seed/yusuf/200/200',
    age: 12,
    dateOfBirth: new Date('2012-01-30'),
    gender: 'ذكر',
    healthStatus: 'جيدة جداً، لا توجد مشاكل صحية معروفة',
    grade: 'الصف السادس الابتدائي',
    country: 'العراق',
    governorate: 'أربيل',
    attendance: 'منتظم',
    performance: 'جيد',
    familyStatus: 'يتيم الأب',
    housingStatus: 'سكن ملك للعائلة، حالته متوسطة',
    guardian: 'عمه',
    sponsorId: 1,
    sponsorshipType: 'كفالة شهرية شاملة',
    teamMemberId: 0, // Team members don't have direct relationships with orphans
    familyMembers: [
        { relationship: 'العم', age: 45 },
        { relationship: 'ابن العم', age: 14 }
    ],
    hobbies: ['ألعاب الفيديو', 'ركوب الدراجة'],
    needsAndWishes: ['حذاء كرة قدم جديد', 'ساعة يد'],
    updateLogs: [
        { id: 'ul5', date: new Date('2024-07-22'), author: 'خالد الغامدي', note: 'تم التواصل مع العم لمناقشة المستوى الدراسي ليوسف.' },
    ],
     educationalProgram: {
        status: 'ملتحق',
        details: 'ملتحق بنادي كرة القدم والأنشطة الرياضية.',
    },
    psychologicalSupport: {
        child: { status: 'غير ملتحق', details: 'لا تظهر عليه أي مشاكل نفسية واضحة.' },
        guardian: { status: 'غير ملتحق', details: 'العم يوفر بيئة داعمة ومستقرة.' },
    },
     payments: [
      { id: 'p11', amount: 50, dueDate: new Date('2024-05-10'), status: PaymentStatus.Paid, paidDate: new Date('2024-05-08') },
      { id: 'p12', amount: 50, dueDate: new Date('2024-06-10'), status: PaymentStatus.Due },
    ],
    achievements: [
        { id: 'a3', title: 'قائد فريق كرة القدم', date: new Date('2024-04-22'), description: 'تم اختياره من قبل المدرب لقيادة فريق المدرسة.', mediaUrl: 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', mediaType: 'image' },
    ],
    specialOccasions: [
        { id: 'o4', title: 'عيد الميلاد', date: new Date('2025-01-30') },
    ],
    gifts: [
        { id: 'g2', from: 'الكافل عبدالله الراجحي', item: 'كرة قدم أصلية', date: new Date('2024-04-25') }
    ]
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'خالد الغامدي',
    avatarUrl: 'https://picsum.photos/seed/khaled/100/100',
    assignedOrphanIds: [], // Team members don't have direct relationships with orphans
    tasks: [
      { id: 1, title: 'متابعة المستوى الدراسي لأحمد خالد', dueDate: new Date('2024-06-05'), completed: false, orphanId: 1 },
      { id: 2, title: 'زيارة منزل يوسف محمد', dueDate: new Date('2024-06-12'), completed: false, orphanId: 3 },
      { id: 3, title: 'تسليم تقرير الحالة ليوسف', dueDate: new Date('2024-05-28'), completed: true },
    ],
  },
  {
    id: 2,
    name: 'نورة السعد',
    avatarUrl: 'https://picsum.photos/seed/noura/100/100',
    assignedOrphanIds: [], // Team members don't have direct relationships with orphans
    tasks: [
      { id: 4, title: 'توفير المستلزمات المدرسية لسارة', dueDate: new Date('2024-06-02'), completed: false, orphanId: 2 },
      { id: 5, title: 'متابعة الحالة الصحية لجدة سارة', dueDate: new Date('2024-06-18'), completed: false, orphanId: 2 },
      { id: 6, title: 'رفع تقرير شهر مايو', dueDate: new Date('2024-05-30'), completed: true },
    ],
  },
];


export const financialTransactions: FinancialTransaction[] = [
    { id: 't1', date: new Date('2024-07-23'), description: 'شراء وجبات طعام للرحلة', createdBy: 'فاطمة الأحمد', amount: 80, status: TransactionStatus.Rejected, type: TransactionType.Expense },
    { 
        id: 't2', 
        date: new Date('2024-07-22'), 
        description: '[كفالة يتيم] - دفعة شهر يوليو', 
        createdBy: 'النظام', 
        amount: 100, 
        status: TransactionStatus.Completed, 
        type: TransactionType.Income,
        receipt: {
            sponsorName: 'عبدالله الراجحي',
            donationCategory: 'كفالة يتيم',
            amount: 100,
            date: new Date('2024-07-22'),
            description: 'دفعة شهر يوليو',
            transactionId: 't2',
            relatedOrphanIds: [1, 3]
        }
    },
    { id: 't3', date: new Date('2024-07-21'), description: 'مصاريف صيانة السكن', createdBy: 'خالد الغامدي', amount: 250, status: TransactionStatus.Completed, type: TransactionType.Expense },
    { id: 't4', date: new Date('2024-07-20'), description: 'رسوم دراسية', createdBy: 'نورة السعد', amount: 400, status: TransactionStatus.Pending, type: TransactionType.Expense, orphanId: 2 },
    { id: 't5', date: new Date('2024-07-19'), description: 'دعم من منظمة خارجية', createdBy: 'النظام', amount: 1000, status: TransactionStatus.Completed, type: TransactionType.Income },
    { id: 't6', date: new Date('2024-07-18'), description: 'شراء ملابس العيد', createdBy: 'فاطمة الأحمد', amount: 320, status: TransactionStatus.Pending, type: TransactionType.Expense, orphanId: 1 },
];

// Messages Data
export enum ConversationType {
  Sponsor = 'الكفلاء',
  Team = 'فريق العمل',
  System = 'النظام',
}

export interface Message {
  id: number;
  sender: string;
  avatar?: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  participant: string;
  participantAvatar?: string;
  subject: string;
  unread: boolean;
  lastMessagePreview: string;
  lastMessageTimestamp: string;
  messages: Message[];
}

export const conversations: Conversation[] = [
  {
    id: 1,
    type: ConversationType.Sponsor,
    participant: 'عبدالله الراجحي',
    subject: 'استفسار بخصوص تقرير أحمد خالد',
    unread: true,
    lastMessagePreview: 'شكراً لكم على جهودكم، هل يمكن تزويدي بآخر تحديث؟',
    lastMessageTimestamp: 'منذ 5 دقائق',
    messages: [
      { id: 1, sender: 'مدير النظام', text: 'أهلاً بك أ. عبدالله، تم إرسال التقرير الشهري لأحمد.', timestamp: 'أمس، 10:30 صباحاً' },
      { id: 2, sender: 'عبدالله الراجحي', text: 'شكراً لكم على جهودكم، هل يمكن تزويدي بآخر تحديث؟', timestamp: 'منذ 5 دقائق' },
    ],
  },
  {
    id: 2,
    type: ConversationType.Team,
    participant: 'نورة السعد',
    participantAvatar: 'https://picsum.photos/seed/noura/100/100',
    subject: 'متابعة حالة سارة علي',
    unread: false,
    lastMessagePreview: 'تمام، سأقوم بالتواصل معهم اليوم.',
    lastMessageTimestamp: 'منذ ساعتين',
    messages: [
       { id: 1, sender: 'مدير النظام', text: 'أهلاً نورة، يرجى متابعة الحالة الصحية لجدة اليتيمة سارة علي.', timestamp: 'اليوم، 9:00 صباحاً' },
       { id: 2, sender: 'نورة السعد', avatar: 'https://picsum.photos/seed/noura/100/100', text: 'تمام، سأقوم بالتواصل معهم اليوم.', timestamp: 'منذ ساعتين' },
    ],
  },
  {
    id: 3,
    type: ConversationType.System,
    participant: 'إشعار من النظام',
    subject: 'موافقة على معاملة مالية',
    unread: false,
    lastMessagePreview: 'تمت الموافقة على طلب المصروف "شراء ملابس العيد".',
    lastMessageTimestamp: 'أمس',
    messages: [
        { id: 1, sender: 'النظام', text: 'تمت الموافقة على طلب المصروف "شراء ملابس العيد" بقيمة 320$.', timestamp: 'أمس، 4:15 مساءً' },
    ],
  },
  {
    id: 4,
    type: ConversationType.Sponsor,
    participant: 'فاطمة الأحمد',
    subject: 'اقتراح لدعم حملة الشتاء',
    unread: false,
    lastMessagePreview: 'بالتأكيد، فكرة ممتازة! سيتم عرضها على الإدارة.',
    lastMessageTimestamp: 'يوم الثلاثاء',
     messages: [
      { id: 1, sender: 'فاطمة الأحمد', text: 'السلام عليكم، أود اقتراح فكرة لدعم حملة الشتاء القادمة.', timestamp: 'يوم الإثنين' },
      { id: 2, sender: 'مدير النظام', text: 'وعليكم السلام، أهلاً بكِ. ماهو اقتراحك؟', timestamp: 'يوم الإثنين' },
      { id: 3, sender: 'فاطمة الأحمد', text: 'تخصيص جزء من التبرعات لشراء دفايات للأسر الأكثر حاجة.', timestamp: 'يوم الثلاثاء' },
      { id: 4, sender: 'مدير النظام', text: 'بالتأكيد، فكرة ممتازة! سيتم عرضها على الإدارة.', timestamp: 'يوم الثلاثاء' },
    ],
  },
  {
    id: 5,
    type: ConversationType.Team,
    participant: 'خالد الغامدي',
    participantAvatar: 'https://picsum.photos/seed/khaled/100/100',
    subject: 'تأجيل زيارة منزل يوسف محمد',
    unread: true,
    lastMessagePreview: 'تم التواصل مع عم اليتيم، وتم تحديد موعد جديد.',
    lastMessageTimestamp: 'الآن',
    messages: [
       { id: 1, sender: 'خالد الغامدي', avatar: 'https://picsum.photos/seed/khaled/100/100', text: 'تم التواصل مع عم اليتيم، وتم تحديد موعد جديد.', timestamp: 'الآن' },
    ],
  },
];

// Message Templates
export interface MessageTemplate {
  id: number;
  title: string;
  body: string;
}

export const messageTemplates: MessageTemplate[] = [
  { 
    id: 1, 
    title: 'ترحيب بكافل جديد', 
    body: 'أهلاً بك {اسم_الكافل} في عائلة فيء! نشكرك جزيل الشكر على كفالتك لليتيم {اسم_اليتيم}. مساهمتك ستصنع فرقاً كبيراً في حياته.' 
  },
  { 
    id: 2, 
    title: 'تقرير أداء شهري', 
    body: 'السلام عليكم {اسم_الكافل},\n\nيسعدنا أن نشاركك التقرير الشهري لليتيم {اسم_اليتيم}...\n\nمع خالص الشكر،\nفريق فيء' 
  },
  { 
    id: 3, 
    title: 'تذكير بالدفعة المستحقة', 
    body: 'مرحباً {اسم_الكافل},\n\nنود تذكيركم بأن دفعة الكفالة الشهرية مستحقة. دعمكم المستمر هو سر نجاحنا في رعاية أبنائنا.\n\nشكراً لكم.' 
  },
  {
    id: 4,
    title: 'شكر على المساهمة',
    body: 'السيد/ة {اسم_الكافل}،\n\nنتقدم لكم بجزيل الشكر والعرفان على مساهمتكم السخية في حملة الشتاء. عطاؤكم أدفأ قلوباً كثيرة.\n\nمع تحيات،\nإدارة فيء'
  }
];