import React from 'react';
import {
  PolicySection,
  PolicySubSection,
  IconList,
  FeatureGrid,
  PolicyDataTable,
  ProcessStepper,
  ComparisonGrid,
  Callout,
} from './index';
import { POLICIES_TOC } from './data';

// Policy 1: General provisions
const visionMissionCards = [
  {
    title: 'الرؤية',
    description:
      'مجتمعٌ تُكفل فيه كرامة كل يتيم، ويجد فيه بيئةً آمنةً حانيةً تُطلق طاقاته وتُعظّم إمكاناته.',
  },
  {
    title: 'الرسالة',
    description:
      'رعاية الأيتام رعايةً شاملةً، تُنمّي شخصياتهم، وتصون كرامتهم، وتُعدّهم ليكونوا أفراداً صالحين فاعلين في مجتمعاتهم، بمنهجيةٍ مهنيةٍ وروحٍ إنسانيةٍ إسلامية.',
  },
];

const principles = [
  'مبدأ الكرامة الإنسانية: لكل يتيم كرامةٌ مصونة لا تُنتهك بأي حال من الأحوال.',
  'مبدأ المصلحة الفضلى: تُقدَّم مصلحة اليتيم فوق كل اعتبار في جميع القرارات.',
  'مبدأ عدم التمييز: تُقدَّم الخدمات بالتساوي بصرف النظر عن الجنس أو العرق أو المستوى الاجتماعي.',
  'مبدأ الشفافية: الوضوح الكامل في جميع العمليات المالية والإدارية.',
  'مبدأ المشاركة: إشراك اليتيم ووليّه في القرارات المتعلقة به وفق سنّه ونضجه.',
  'مبدأ الاستمرارية: توفير رعايةٍ مستدامة ومنتظمة لا تنقطع.',
  'مبدأ التكامل: التنسيق مع جميع الجهات المعنية لتقديم رعاية متكاملة.',
  'مبدأ السرية: حفظ خصوصية اليتيم وبياناته وعدم الإفصاح عنها.',
  'مبدأ التطوير المستمر: مراجعة السياسات وتحسينها دورياً وفق أفضل الممارسات.',
  'مبدأ المسؤولية: تحمّل المؤسسة المسؤولية الكاملة تجاه أيتامها وكافليها والمجتمع.',
];

const scopeItems = [
  'جميع أعضاء مجلس الإدارة والمسؤولين التنفيذيين.',
  'الموظفين الدائمين والمتعاقدين والمتطوعين.',
  'الكافلين المسجلين في قاعدة بيانات الجمعية.',
  'الشركاء والجهات المتعاونة مع الجمعية.',
  'أسر الأيتام وأوليائهم.',
];

const definitionsRows = [
  { term: 'اليتيم', definition: 'كل طفل فقد أباه ولم يبلغ سن الثامنة عشرة، أو من تقرر الجمعية احتياجه للرعاية وفق معاييرها.' },
  { term: 'الكافل', definition: 'الشخص أو المؤسسة المسجل لدى الجمعية والملتزم بتقديم الدعم المالي والاجتماعي ليتيم محدد.' },
  { term: 'الكفالة', definition: 'العقد المبرم بين الجمعية والكافل الذي يُحدد الالتزامات والحقوق المتبادلة.' },
  { term: 'ولي الأمر', definition: 'الشخص المنوط به رعاية اليتيم قانوناً وشرعاً في غياب الأب.' },
  { term: 'مسؤول الحالة', definition: 'الموظف المختص المعيّن من الجمعية لمتابعة يتيم أو مجموعة أيتام بعينهم.' },
  { term: 'التقييم الشامل', definition: 'الدراسة الاجتماعية والنفسية والأكاديمية والصحية التي تُجريها الجمعية لكل يتيم.' },
  { term: 'خطة الرعاية', definition: 'الوثيقة التفصيلية التي تُحدد احتياجات اليتيم وأهداف رعايته وآليات تنفيذها ومؤشرات قياسها.' },
];

// Policy 2: Admission & Registration
const admissionCriteria = [
  'أن يكون مفقود الأب أو أن تكون وفاته موثقة رسمياً.',
  'ألا يتجاوز عمر اليتيم ثمانية عشر عاماً عند التسجيل، مع حق الاستثناء للحالات الدراسية.',
  'أن يكون مقيماً في المناطق الجغرافية التي تغطيها خدمات الجمعية.',
  'أن يستوفي معايير الاحتياج المالي والاجتماعي وفق استمارة التقييم المعتمدة.',
  'الأولوية في القبول لمن جمع وفاة الأبوين معاً، ثم اليتيم ذو الأم العاجزة، ثم من هم في أشد الحاجة.',
];

const registrationSteps = [
  {
    title: 'مرحلة الاستقبال الأولي',
    description: 'استقبال طلب التسجيل من الأسرة أو الجهة المحيلة. تسليم استمارة التسجيل الأولية مع قائمة المستندات المطلوبة. تحديد موعد الزيارة الميدانية الأولى خلال أسبوع من تقديم الطلب. تخصيص مسؤول حالة مبدئي لمتابعة الطلب.',
  },
  {
    title: 'مرحلة الدراسة والتقييم',
    description: 'زيارة المنزل وإجراء المقابلة مع ولي الأمر والأسرة. تقييم الوضع الاقتصادي والاجتماعي والنفسي والصحي. مراجعة المستندات والوثائق الرسمية والتحقق منها. اطلاع اليتيم على آلية الكفالة وفق فهمه وعمره. إعداد تقرير الدراسة الاجتماعية خلال أسبوعين.',
  },
  {
    title: 'مرحلة اتخاذ القرار',
    description: 'عرض ملف الحالة على لجنة القبول المختصة. إخطار الأسرة بقرار القبول أو الرفض مع الأسباب خلال عشرة أيام. في حالة القبول: إنشاء ملف اليتيم الرسمي وإصدار رقم تعريفي فريد. في حالة الرفض: تحويل الحالة إلى جمعيات شريكة أو تقديم إرشادات بديلة. مراجعة قرارات الرفض بناءً على طلب الأسرة.',
  },
];

const documentsColumns = [
  { key: 'document', label: 'المستند' },
  { key: 'mandatory', label: 'إلزامي' },
  { key: 'supporting', label: 'داعم' },
];
const documentsRows = [
  { document: 'شهادة وفاة الأب مصادقة رسمية', mandatory: '✔', supporting: '' },
  { document: 'بطاقة هوية ولي الأمر', mandatory: '✔', supporting: '' },
  { document: 'شهادة ميلاد اليتيم', mandatory: '✔', supporting: '' },
  { document: 'عقد الإيجار أو وثيقة الملكية', mandatory: '✔', supporting: '' },
  { document: 'آخر كشف حساب بنكي أو شهادة الدخل', mandatory: '', supporting: '✔' },
  { document: 'التقارير المدرسية لآخر سنتين', mandatory: '', supporting: '✔' },
  { document: 'شهادة الحالة الصحية إن وجدت', mandatory: '', supporting: '✔' },
  { document: 'صورتان شخصيتان حديثتان', mandatory: '✔', supporting: '' },
];

// Policy 3: Sponsorship
const sponsorshipTypes = [
  {
    title: 'الكفالة الفردية',
    description: 'يتكفل شخص واحد بيتيم محدد أو أكثر، ويتولى تأمين احتياجاته الأساسية.',
  },
  {
    title: 'الكفالة الجماعية',
    description: 'يتشارك في كفالة يتيم واحد عدد من الأفراد كل بحسب طاقته، وتتولى الجمعية التنسيق.',
  },
  {
    title: 'الكفالة المؤسسية',
    description: 'تُقدّمها شركات أو مؤسسات بتكفّل دوري ضمن برامج مسؤوليتها الاجتماعية.',
  },
];

const sponsorConditions = [
  'بلوغ سن الرشد القانوني وأهلية التعاقد الكاملة.',
  'إثبات القدرة المالية على الوفاء بالتزامات الكفالة بصورة منتظمة.',
  'إبداء النية الصادقة والالتزام بالاستمرارية لمدة لا تقل عن سنة كاملة.',
  'القبول بسياسات الجمعية وأنظمتها والتوقيع على عقد الكفالة.',
  'الحفاظ على السرية الكاملة لهوية اليتيم ومعلوماته وعدم الإفصاح عنها.',
  'عدم محاولة التواصل المباشر مع اليتيم أو أسرته خارج الأطر المعتمدة من الجمعية.',
];

const sponsorDuties = [
  'الإخطار الفوري عند تغيير وضعه المالي أو رغبته في إيقاف الكفالة.',
  'الالتزام بالتحويل الدوري في المواعيد المتفق عليها.',
  'عدم تجاوز أطر التواصل المعتمدة مع اليتيم.',
  'احترام خصوصية اليتيم وعدم نشر أي معلومات تتعلق به.',
];

const sponsorRights = [
  'تلقّي تقرير دوري مفصّل (كل 6 أشهر) عن أحوال اليتيم وتطوره.',
  'الحصول على إيصال رسمي معتمد بكل مبلغ مُحوَّل.',
  'الاطلاع على خطة الرعاية الخاصة باليتيم المكفول.',
  'حق طلب تغيير مسؤول الحالة إن وُجد سبب موضوعي.',
  'المشاركة في أنشطة الجمعية ولقاءات الكافلين المعتمدة.',
  'استرداد كامل المبالغ غير المُصرَّفة عند إنهاء العقد.',
];

const communicationRules = [
  'يتوسط الجمعية في جميع أشكال التواصل المباشر بين الكافل واليتيم.',
  'يجوز للكافل تلقّي رسائل ورسومات اليتيم بوساطة الجمعية وبموافقة ولي الأمر.',
  'تُنظَّم لقاءات جماعية معتمدة (يوم اليتيم، الأنشطة الترفيهية) وفق برنامج سنوي.',
  'يُحظر التبادل المباشر لأرقام الهواتف أو عناوين السكن دون إذن مكتوب من الجمعية.',
  'يُمنع منعاً باتاً أي اتصال عبر وسائل التواصل الاجتماعي مباشرةً دون وساطة الجمعية.',
  'تُوثَّق جميع أشكال التواصل في ملف الكافل باليتيم.',
];

// Policy 4: Comprehensive Care
const careEducation = [
  'توفير المستلزمات الدراسية والمصروف المدرسي الكافي.',
  'متابعة مسيرة اليتيم التعليمية وتحليل تقاريره الدراسية.',
  'توفير دروس دعم وتقوية للمتعثرين دراسياً.',
  'دعم اليتيم المتفوق بمنح ومكافآت تشجيعية.',
  'التنسيق مع الإدارات المدرسية لمعالجة أي إشكاليات تعليمية.',
];
const careHealth = [
  'توفير التغطية الصحية الأساسية (كشوفات، أدوية، عمليات اضطرارية).',
  'إجراء فحوصات طبية دورية شاملة (مرتين سنوياً على الأقل).',
  'التحويل إلى المختصين الصحيين عند الحاجة.',
  'متابعة الحالات المزمنة والإعاقات بخطط رعاية مخصصة.',
  'تقديم الدعم الصحي النفسي للأيتام الذين يعانون من آثار الفقد.',
];
const carePsych = [
  'جلسات إرشاد نفسي دورية مع معالجين متخصصين.',
  'برامج تنمية مهارات حياتية (ثقة بالنفس، تواصل، حل مشكلات).',
  'أنشطة ترفيهية وثقافية ورياضية منتظمة.',
  'برامج تمكين الهوية الإسلامية والانتماء.',
  'مجموعات دعم الأقران بين الأيتام.',
];
const careReligion = [
  'البرامج القرآنية والتربوية الإسلامية المنهجية.',
  'مجالس العلم والمحاضرات الدينية الملائمة للأعمار.',
  'الاحتفاء بالمناسبات الدينية وتقديم الهدايا في الأعياد.',
  'غرس القيم الإسلامية وترسيخ الهوية الدينية.',
];

const followUpColumns = [
  { key: 'type', label: 'نوع المتابعة' },
  { key: 'content', label: 'مضمون المتابعة' },
  { key: 'frequency', label: 'التكرار' },
];
const followUpRows = [
  { type: 'مراسلة / تقرير مالي', content: 'مراجعة وضع الكفالة المالية وتوزيع المستحقات.', frequency: 'شهرية' },
  { type: 'زيارة ميدانية', content: 'متابعة التحصيل الدراسي وزيارة المنزل.', frequency: 'ربع سنوية' },
  { type: 'تقرير متكامل للكافل', content: 'التقرير الشامل: صحة، تعليم، نفس، اجتماع، دين.', frequency: 'نصف سنوية' },
  { type: 'اجتماع لجنة الرعاية', content: 'مراجعة خطة الرعاية وتحديدها وتقييم شامل.', frequency: 'سنوية' },
  { type: 'استجابة فورية ≤ 24 ساعة', content: 'عند الأزمات أو الأحداث الطارئة (مرض، مشكلة).', frequency: 'طارئة' },
];

// Policy 5: Orphans rights and protection
const rightsCharter = [
  'حق الكرامة: معاملةٌ تحفظ كرامته وتصون آدميته في جميع الأوقات والمواقف.',
  'حق الأمان: بيئة آمنة خالية من الإيذاء الجسدي أو النفسي أو اللفظي.',
  'حق التعليم: الحصول على التعليم الجيد وكل ما يُعينه عليه.',
  'حق الصحة: الرعاية الصحية الكاملة الوقائية والعلاجية.',
  'حق اللعب والترفيه: أنشطة ترفيهية ملائمة لعمره ومرحلته.',
  'حق الخصوصية: عدم الإفصاح عن هويته أو وضعه دون إذنه أو إذن وليّه.',
  'حق المشاركة: إشراكه في القرارات المتعلقة به بما يتناسب مع عمره.',
  'حق الشكوى: تقديم تظلماته دون خوف من العقاب أو التجاهل.',
  'حق الاستمرارية: ضمان استمرار رعايته وعدم انقطاعها فجأة.',
  'حق الهوية: صون هويته الدينية والاجتماعية والوطنية.',
];
const abuseTypes = [
  'إيذاء جسدي: أي ضرب أو إيلام أو عقوبة بدنية.',
  'إيذاء نفسي: الإهانة أو التقليل أو التخويف أو التهديد.',
  'إيذاء بالإهمال: التقصير المتعمد في تلبية احتياجات اليتيم.',
  'إيذاء جنسي: أي انتهاك أو تحرش أو استغلال جنسي بأي شكل.',
  'استغلال اقتصادي: توظيف اليتيم أو استثمار وضعه لمصلحة أي طرف.',
];
const abuseProcedures = [
  'يلتزم كل موظف ومتطوع بالإبلاغ الفوري عن أي اشتباه بالإيذاء.',
  'تُحال القضايا خلال 24 ساعة إلى لجنة الحماية المختصة.',
  'تُعلَّق مؤقتاً صلاحيات المبلَّغ عنه ريثما تنتهي التحقيقات.',
  'تُبلَّغ الجهات القانونية الرسمية عند ثبوت الإيذاء.',
  'تُقدَّم الرعاية النفسية الطارئة للضحية فوراً.',
];

// Policy 6: Family involvement
const familyRoleItems = [
  'تعزيز قدرات ولي الأمر على توفير بيئة تربوية صحية.',
  'إشراك الأسرة في رسم خطة الرعاية والموافقة عليها.',
  'دعم الأمهات بالتوجيه التربوي وبرامج التنمية الذاتية.',
  'توفير خدمة الإرشاد الأسري عند الحاجة.',
  'دعم الأسرة في الأزمات الطارئة بمبادرات التدخل السريع.',
];
const familyAgreementItems = [
  'الالتزام بإخطار الجمعية بأي تغيير جوهري (انتقال، مرض، أزمة).',
  'السماح للجمعية بإجراء الزيارات الميدانية الدورية والمباغتة.',
  'عدم قبول تبرعات أو دعم من جهات خارجية باسم اليتيم دون إخطار الجمعية.',
  'إشراك اليتيم في أنشطة الجمعية وبرامجها التعليمية والتطويرية.',
  'الإقرار بحق الجمعية في تعليق الكفالة عند مخالفة الاتفاقية.',
];

// Policy 7: Privacy and data protection
const dataPrinciples = [
  'القانونية: جمع البيانات بإذن صريح وفق العقود الموقعة.',
  'الهدفية: استخدام البيانات حصراً في الأغراض المحددة التي جُمعت لها.',
  'التناسب: جمع الحد الأدنى من البيانات الضرورية فقط.',
  'الدقة: التحقق من البيانات وتحديثها بانتظام.',
  'الأمان: تخزين البيانات في أنظمة محمية بإجراءات أمنية صارمة.',
  'المحاسبة: تحديد مسؤول واضح لحماية البيانات وإدارتها.',
];
const confidentialityRules = [
  'الإفصاح عن هوية اليتيم أو أسرته في وسائل التواصل الاجتماعي أو أمام الجمهور.',
  'التقاط صور لليتيم أو نشرها إلا بموافقة خطية مسبقة من الجمعية وولي الأمر.',
  'مشاركة تفاصيل الحالة مع أطراف غير معنية حتى بعد انتهاء العلاقة مع الجمعية.',
  'الاحتفاظ بنسخ من ملفات الأيتام خارج الأنظمة الرسمية للجمعية.',
];

// Policy 8: Financial resources
const accountsItems = [
  'فتح حساب بنكي منفصل مخصص لأموال الكفالات مستقل عن حسابات التشغيل.',
  'لا يُصرَف من حسابات الكفالات إلا في الأوجه المتفق عليها في عقد الكفالة.',
  'لا يتجاوز اقتطاع التكاليف الإدارية من مبالغ الكفالة النسبة المعلنة (لا تزيد على 10%).',
  'إصدار كشف حساب شهري مفصل لكل كفالة وإتاحته لكل من الكافل والمسؤول.',
  'المبالغ غير المصروفة في نهاية السنة تُرحَّل أو تُعاد للكافل بحسب اختياره.',
];
const spendingColumns = [
  { key: 'category', label: 'الصلاحية' },
  { key: 'limit', label: 'الحد الأقصى' },
  { key: 'authority', label: 'الجهة المعتمِدة' },
];
const spendingRows = [
  { category: 'مصروف روتيني', limit: 'حتى 500 ريال', authority: 'مسؤول الحالة وحده' },
  { category: 'مصروف غير عادي', limit: '500 - 2000 ريال', authority: 'مدير الرعاية الاجتماعية' },
  { category: 'نفقة طارئة', limit: '2000 - 5000 ريال', authority: 'المدير التنفيذي' },
  { category: 'نفقة كبرى', limit: 'فوق 5000 ريال', authority: 'مجلس الإدارة أو لجنته المالية' },
];

// Policy 9: Governance
const governanceLevels = [
  {
    title: 'مستوى الرقابة',
    items: ['مجلس الإدارة: رسم السياسات العامة، اعتماد الميزانيات، تعيين المدير التنفيذي', 'المراجعة الداخلية', 'لجنة الرقابة الشرعية', 'المراجع الخارجي السنوي', 'لجنة التدقيق'],
  },
  {
    title: 'مستوى الإدارة',
    items: ['المدير التنفيذي', 'مدراء الأقسام', 'مسؤولو الحالات'],
  },
  {
    title: 'المستوى التنفيذي',
    items: ['الموظفون والمتطوعون'],
  },
];
const kpiColumns = [
  { key: 'domain', label: 'المجال' },
  { key: 'indicator', label: 'المؤشر' },
  { key: 'target', label: 'الهدف' },
];
const kpiRows = [
  { domain: 'المتابعة', indicator: 'نسبة الأيتام المسجلين الذين تُجرى لهم زيارة ميدانية في وقتها.', target: '≥ 95%' },
  { domain: 'التعليم', indicator: 'نسبة الأيتام المحققين للمعدل الدراسي الكافي.', target: '≥ 90%' },
  { domain: 'الشفافية', indicator: 'نسبة التقارير النصف سنوية المرسلة للكافلين في موعدها.', target: '100%' },
  { domain: 'الاحتفاظ', indicator: 'نسبة توقف الكفالات غير المبرمجة (مؤشر الرضا).', target: '≤ 5%' },
  { domain: 'الجودة', indicator: 'نسبة رضا الكافلين عن الخدمة في المسح السنوي.', target: '≥ 85%' },
  { domain: 'الكفاءة المالية', indicator: 'نسبة التكاليف الإدارية من إجمالي الإيرادات.', target: '≤ 10%' },
];

// Policy 10: Complaints
const complaintRights = [
  'الأيتام وأولياء أمورهم من أسرهم.',
  'الكافلون المسجلون.',
  'الموظفون والمتطوعون.',
  'أي شخص يتأثر مباشرةً بعمليات الجمعية.',
];
const complaintSteps = [
  { title: 'الاستقبال', description: 'استقبال الشكوى كتابياً أو شفهياً وإصدار رقم مرجعي خلال 24 ساعة.' },
  { title: 'التصنيف', description: 'تحديد نوع الشكوى (مالية، إدارية، حماية) وإحالتها للجهة المختصة.' },
  { title: 'التحقيق', description: 'إجراء التحقيق اللازم مع إعطاء مقدم الشكوى حق الاطلاع والرد.' },
  { title: 'القرار', description: 'إصدار القرار المعلل خلال 14 يوماً من تاريخ الاستلام.' },
  { title: 'التظلم', description: 'حق مقدم الشكوى في التظلم أمام مجلس الإدارة خلال 7 أيام من القرار.' },
];

// Policy 11: Termination
const naturalTerminationCases = [
  'بلوغ اليتيم سن الثامنة عشرة وإتمام مرحلة التعليم الثانوي.',
  'وفاة اليتيم، تغمده الله برحمته.',
  'انتقال اليتيم إلى كفالة أسرية رسمية أو تبنٍّ قانوني.',
  'إيقاف مؤقت أو دائم بقرار من لجنة الرعاية لأسباب موضوعية.',
];
const exitProcedures = [
  'تقييم شامل للاحتياجات وفجوات الاستقلالية.',
  'وضع خطة انتقالية فردية مخصصة لكل يتيم.',
  'تدريب على المهارات الحياتية الأساسية (إدارة المال، السكن، العمل).',
  'ربط اليتيم بشبكات الدعم المجتمعي والمهني.',
  'توثيق ملفه كاملاً وتسليم نسخة منه له ولولي أمره.',
  'متابعة لمدة سنة ما بعد الخروج ضمن برنامج "خريجي فيء".',
];
const sponsorTerminationItems = [
  'إشعار مسبق بمدة لا تقل عن ثلاثة أشهر.',
  'التزود بالدعم المالي خلال فترة الإشعار حتى إيجاد كافل بديل.',
  'التوقيع على نموذج إنهاء رسمي يُوثّق الأسباب والتزامات الطرفين.',
  'استرداد المبالغ غير المصروفة خلال 30 يوماً.',
];

// Policy 12: Volunteering and partnerships
const volunteerDiscipline = [
  'اجتياز برنامج التدريب التعريفي قبل الانخراط في أي نشاط.',
  'التوقيع على اتفاقية سرية وميثاق سلوك المتطوع.',
  'الخضوع للإشراف المباشر من مسؤول متخصص طوال مدة التطوع.',
  'عدم التعامل مع الأيتام بشكل منفرد أو خارج الأطر المعتمدة.',
  'الإبلاغ الفوري عن أي إشكالية أو انتهاك يشهده المتطوع.',
];
const partnershipRules = [
  'انسجام رسالة الشريك مع قيم الجمعية وعدم تعارض أهدافه معها.',
  'تقديم الشريك لخدمات ذات قيمة مضافة حقيقية للأيتام.',
  'الالتزام بسياسات السرية والحماية وعدم إفشاء معلومات الأيتام.',
  'الخضوع للتقييم الدوري للشراكة وتجديدها أو إنهائها بناءً على النتائج.',
  'عدم استخدام الأيتام لأغراض دعائية أو تسويقية دون موافقة صريحة.',
  'تحديد صلاحيات الشريك بوضوح في اتفاقية خطية مُوقَّعة.',
];

export function PoliciesContent() {
  return (
    <div className="space-y-2 policies-content print:p-0">
      <PolicySection id={POLICIES_TOC[0].id} title={POLICIES_TOC[0].title}>
        <PolicySubSection title="أولاً: الرؤية والرسالة">
          <FeatureGrid cards={visionMissionCards} columns={2} />
        </PolicySubSection>
        <PolicySubSection title="ثانياً: المبادئ الحاكمة">
          <p className="text-gray-600 mb-3">المبادئ العشرة الحاكمة لعمل جمعية فيء</p>
          <IconList items={principles} />
        </PolicySubSection>
        <PolicySubSection title="ثالثاً: نطاق تطبيق السياسات">
          <p className="text-gray-600 mb-2">
            تسري هذه السياسات على جميع من يتعامل مع الجمعية أو يعمل باسمها أو تحت مظلتها، ويشمل ذلك:
          </p>
          <IconList items={scopeItems} />
        </PolicySubSection>
        <PolicySubSection title="رابعاً: التعريفات والمصطلحات">
          <PolicyDataTable
            columns={[
              { key: 'term', label: 'المصطلح' },
              { key: 'definition', label: 'التعريف' },
            ]}
            rows={definitionsRows}
          />
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[1].id} title={POLICIES_TOC[1].title}>
        <PolicySubSection title="أولاً: معايير القبول">
          <p className="text-gray-600 mb-2">
            تلتزم الجمعية بمعايير قبول موضوعية وشفافة تضمن العدالة في الخدمة:
          </p>
          <IconList items={admissionCriteria} />
        </PolicySubSection>
        <PolicySubSection title="ثانياً: إجراءات التسجيل">
          <p className="text-gray-600 mb-3">تمرّ عملية تسجيل اليتيم بالمراحل التالية:</p>
          <ProcessStepper steps={registrationSteps} />
        </PolicySubSection>
        <PolicySubSection title="ثالثاً: المستندات المطلوبة">
          <PolicyDataTable columns={documentsColumns} rows={documentsRows} />
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[2].id} title={POLICIES_TOC[2].title}>
        <PolicySubSection title="أولاً: طبيعة الكفالة وأنواعها">
          <p className="text-gray-600 mb-3">
            الكفالة في جمعية فيء عقدٌ إنساني منضبط يُنظّم العلاقة بين الكافل واليتيم والجمعية وفق ضوابط واضحة:
          </p>
          <FeatureGrid cards={sponsorshipTypes} columns={3} />
        </PolicySubSection>
        <PolicySubSection title="ثانياً: شروط قبول الكافل">
          <p className="text-gray-600 mb-2">يُشترط في الكافل المسجل لدى الجمعية ما يلي:</p>
          <IconList items={sponsorConditions} />
        </PolicySubSection>
        <PolicySubSection title="ثالثاً: حقوق الكافل وواجباته">
          <ComparisonGrid
            leftTitle="الواجبات"
            rightTitle="الحقوق"
            leftItems={sponsorDuties}
            rightItems={sponsorRights}
          />
        </PolicySubSection>
        <PolicySubSection title="رابعاً: ضوابط التواصل بين الكافل واليتيم">
          <p className="text-gray-600 mb-2">إطار التواصل المعتمد</p>
          <IconList items={communicationRules} />
          <Callout variant="warning" className="mt-4" title="ملاحظة">
            يُحظر التبادل المباشر لأرقام الهواتف أو عناوين السكن دون إذن مكتوب من الجمعية. يُمنع منعاً باتاً أي اتصال عبر وسائل التواصل الاجتماعي مباشرةً دون وساطة الجمعية.
          </Callout>
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[3].id} title={POLICIES_TOC[3].title}>
        <PolicySubSection title="أولاً: أبعاد الرعاية الشاملة">
          <p className="text-gray-600 mb-3">
            تتبنى الجمعية مفهوم الرعاية المتكاملة التي ترعى اليتيم في جميع جوانب حياته:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-card border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-800 mb-2">🎓 الرعاية التعليمية</h4>
              <IconList items={careEducation} />
            </div>
            <div className="bg-bg-card border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-800 mb-2">🏥 الرعاية الصحية</h4>
              <IconList items={careHealth} />
            </div>
            <div className="bg-bg-card border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-800 mb-2">🧠 الرعاية النفسية والاجتماعية</h4>
              <IconList items={carePsych} />
            </div>
            <div className="bg-bg-card border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-800 mb-2">🕌 الرعاية الدينية والأخلاقية</h4>
              <IconList items={careReligion} />
            </div>
          </div>
        </PolicySubSection>
        <PolicySubSection title="ثانياً: جداول المتابعة الدورية">
          <PolicyDataTable columns={followUpColumns} rows={followUpRows} />
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[4].id} title={POLICIES_TOC[4].title}>
        <PolicySubSection title="أولاً: ميثاق حقوق الأيتام">
          <p className="text-gray-600 mb-3">تُعلن جمعية فيء عن التزامها الراسخ بضمان الحقوق التالية لكل يتيم مسجل:</p>
          <p className="font-medium text-gray-800 mb-2">الحقوق الأساسية المصونة</p>
          <IconList items={rightsCharter} />
        </PolicySubSection>
        <PolicySubSection title="ثانياً: سياسة الحماية من الإيذاء">
          <p className="text-gray-600 mb-2">تتخذ جمعية فيء نهجاً صفرياً تجاه أي شكل من أشكال الإيذاء:</p>
          <IconList items={abuseTypes} />
          <Callout variant="danger" className="mt-4" title="إجراءات الإبلاغ والتحقيق">
            <IconList items={abuseProcedures} />
          </Callout>
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[5].id} title={POLICIES_TOC[5].title}>
        <PolicySubSection title="أولاً: دور الأسرة في منظومة الرعاية">
          <p className="text-gray-600 mb-2">تؤمن جمعية فيء بأن الأسرة ركيزةٌ لا غنى عنها في رعاية اليتيم، وتسعى إلى:</p>
          <IconList items={familyRoleItems} />
        </PolicySubSection>
        <PolicySubSection title="ثانياً: اتفاقية الأسرة">
          <p className="text-gray-600 mb-2">تُوقَّع مع كل أسرة عند التسجيل اتفاقيةٌ تُحدد المسؤوليات المتبادلة وتشمل:</p>
          <IconList items={familyAgreementItems} />
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[6].id} title={POLICIES_TOC[6].title}>
        <PolicySubSection title="أولاً: مبادئ حماية البيانات">
          <p className="text-gray-600 mb-3">المبادئ الستة لإدارة البيانات في الجمعية</p>
          <IconList items={dataPrinciples} />
        </PolicySubSection>
        <PolicySubSection title="ثانياً: قواعد السرية للعاملين والكافلين">
          <p className="text-gray-600 mb-2">يُحظر على جميع العاملين والكافلين:</p>
          <IconList items={confidentialityRules} />
          <Callout variant="danger" className="mt-4">
            المخالفة تستوجب إجراءات تأديبية تصل إلى إنهاء التعاقد وملاحقة قانونية عند الاقتضاء.
          </Callout>
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[7].id} title={POLICIES_TOC[7].title}>
        <PolicySubSection title="أولاً: حسابات الكفالات">
          <p className="text-gray-600 mb-2">تلتزم الجمعية بالمعايير المالية التالية في إدارة موارد الكفالات:</p>
          <IconList items={accountsItems} />
        </PolicySubSection>
        <PolicySubSection title="ثانياً: آليات الإنفاق">
          <PolicyDataTable columns={spendingColumns} rows={spendingRows} />
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[8].id} title={POLICIES_TOC[8].title}>
        <PolicySubSection title="أولاً: الهيكل الحوكمي">
          <p className="text-gray-600 mb-3">تعمل جمعية فيء وفق منظومة حوكمة متكاملة ذات ثلاثة مستويات:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {governanceLevels.map((level, i) => (
              <div key={i} className="bg-bg-card border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-3">{level.title}</h4>
                <IconList items={level.items} />
              </div>
            ))}
          </div>
        </PolicySubSection>
        <PolicySubSection title="ثانياً: مؤشرات قياس الأداء">
          <p className="text-gray-600 mb-3">تُقيَّم الجمعية سنوياً بمؤشرات أداء واضحة وقابلة للقياس:</p>
          <PolicyDataTable columns={kpiColumns} rows={kpiRows} />
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[9].id} title={POLICIES_TOC[9].title}>
        <PolicySubSection title="أولاً: حق تقديم الشكوى">
          <p className="text-gray-600 mb-2">تكفل الجمعية لجميع أطرافها حق تقديم الشكاوى والتظلمات دون خشية انتقام أو تمييز:</p>
          <IconList items={complaintRights} />
        </PolicySubSection>
        <PolicySubSection title="ثانياً: مراحل معالجة الشكوى">
          <ProcessStepper steps={complaintSteps} orientation="horizontal" />
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[10].id} title={POLICIES_TOC[10].title}>
        <PolicySubSection title="أولاً: حالات الإنهاء الطبيعية">
          <IconList items={naturalTerminationCases} />
        </PolicySubSection>
        <PolicySubSection title="ثانياً: إجراءات الخروج وبرنامج الاستقلالية">
          <p className="text-gray-600 mb-2">تُطبّق الجمعية برنامجاً انتقالياً تدريجياً قبل ستة أشهر من إنهاء الكفالة:</p>
          <IconList items={exitProcedures} />
        </PolicySubSection>
        <PolicySubSection title="ثالثاً: إنهاء عقد الكافل">
          <p className="text-gray-600 mb-2">يحق للكافل إنهاء عقد الكفالة مع مراعاة ما يلي:</p>
          <IconList items={sponsorTerminationItems} />
          <Callout variant="info" className="mt-4">
            لا تعتبر الكفالة مُنهاة رسمياً قبل توقيع جميع الوثائق وإيجاد كافل بديل.
          </Callout>
        </PolicySubSection>
      </PolicySection>

      <PolicySection id={POLICIES_TOC[11].id} title={POLICIES_TOC[11].title}>
        <PolicySubSection title="أولاً: انضباط المتطوعين">
          <p className="text-gray-600 mb-2">يخضع المتطوعون لنفس معايير الموظفين في المجالات الحساسة:</p>
          <IconList items={volunteerDiscipline} />
        </PolicySubSection>
        <PolicySubSection title="ثانياً: ضوابط الشراكات">
          <p className="text-gray-600 mb-2">معايير قبول الشراكات والجهات المتعاونة</p>
          <IconList items={partnershipRules} />
        </PolicySubSection>
      </PolicySection>
    </div>
  );
}
