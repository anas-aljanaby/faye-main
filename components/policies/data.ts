/**
 * Single source of truth for policy section ids, sidebar labels, and titles.
 * Used by PoliciesSidebar (TOC) and PoliciesContent (section headings).
 */
export const POLICIES_TOC = [
  { id: 'policy-1', number: 1, numberText: 'الأولى', label: 'الأحكام العامة والمبادئ التأسيسية', title: 'الأحكام العامة والمبادئ التأسيسية' },
  { id: 'policy-2', number: 2, numberText: 'الثانية', label: 'سياسة قبول الأيتام وتسجيلهم', title: 'قبول الأيتام وتسجيلهم' },
  { id: 'policy-3', number: 3, numberText: 'الثالثة', label: 'سياسة الكفالة وتنظيم العلاقة', title: 'سياسة الكفالة وتنظيم العلاقة' },
  { id: 'policy-4', number: 4, numberText: 'الرابعة', label: 'الرعاية الشاملة والمتابعة الميدانية', title: 'الرعاية الشاملة والمتابعة الميدانية' },
  { id: 'policy-5', number: 5, numberText: 'الخامسة', label: 'حقوق الأيتام وحمايتهم', title: 'حقوق الأيتام وحمايتهم' },
  { id: 'policy-6', number: 6, numberText: 'السادسة', label: 'الأسرة والولي وإشراكهم', title: 'الأسرة والولي وإشراكهم' },
  { id: 'policy-7', number: 7, numberText: 'السابعة', label: 'السرية والخصوصية وحماية البيانات', title: 'السرية والخصوصية وحماية البيانات' },
  { id: 'policy-8', number: 8, numberText: 'الثامنة', label: 'إدارة الموارد المالية والكفالات', title: 'إدارة الموارد المالية والكفالات' },
  { id: 'policy-9', number: 9, numberText: 'التاسعة', label: 'الحوكمة والرقابة والمساءلة', title: 'الحوكمة والرقابة والمساءلة' },
  { id: 'policy-10', number: 10, numberText: 'العاشرة', label: 'الشكاوى والتظلمات', title: 'الشكاوى والتظلمات' },
  { id: 'policy-11', number: 11, numberText: 'الحادية عشرة', label: 'إنهاء الكفالة وخروج اليتيم', title: 'إنهاء الكفالة وخروج اليتيم' },
  { id: 'policy-12', number: 12, numberText: 'الثانية عشرة', label: 'التطوع والشراكات الخارجية', title: 'التطوع والشراكات الخارجية' },
] as const;

export type PolicyId = (typeof POLICIES_TOC)[number]['id'];
