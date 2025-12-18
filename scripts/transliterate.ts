/**
 * Arabic to Latin transliteration for username generation
 * Based on simplified transliteration rules
 */

// Arabic to Latin character mapping
const arabicToLatinMap: Record<string, string> = {
  // Basic letters
  'ا': 'a',
  'أ': 'a',
  'إ': 'i',
  'آ': 'a',
  'ب': 'b',
  'ت': 't',
  'ث': 'th',
  'ج': 'j',
  'ح': 'h',
  'خ': 'kh',
  'د': 'd',
  'ذ': 'th',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'sh',
  'ص': 's',
  'ض': 'd',
  'ط': 't',
  'ظ': 'z',
  'ع': 'a',
  'غ': 'gh',
  'ف': 'f',
  'ق': 'q',
  'ك': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'و': 'w',
  'ي': 'y',
  'ى': 'a',
  'ة': 'a',
  'ء': '',
  'ئ': 'e',
  'ؤ': 'o',
  
  // Diacritics (tashkeel)
  'َ': 'a',
  'ُ': 'u',
  'ِ': 'i',
  'ً': 'an',
  'ٌ': 'un',
  'ٍ': 'in',
  'ْ': '',
  'ّ': '',
  
  // Numbers
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

/**
 * Transliterate Arabic text to Latin
 * @param arabic - Arabic text to transliterate
 * @returns Transliterated Latin text
 */
export function transliterate(arabic: string): string {
  if (!arabic) return '';
  
  // Remove invisible characters and Unicode control characters
  let text = arabic
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '') // Remove zero-width and direction control chars
    .replace(/\u202B/g, '') // Right-to-left embedding
    .replace(/\u202C/g, '') // Pop directional formatting
    .trim();
  
  let result = '';
  
  for (const char of text) {
    if (arabicToLatinMap[char] !== undefined) {
      result += arabicToLatinMap[char];
    } else if (/[a-zA-Z0-9]/.test(char)) {
      // Keep Latin letters and numbers as-is
      result += char.toLowerCase();
    } else if (char === ' ' || char === '-') {
      result += '_';
    }
    // Skip other characters
  }
  
  // Clean up the result
  result = result
    .replace(/_+/g, '_')  // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '')  // Remove leading/trailing underscores
    .toLowerCase();
  
  return result;
}

/**
 * Generate a unique username from Arabic name
 * @param arabicName - Arabic name
 * @param existingUsernames - Set of existing usernames to avoid duplicates
 * @returns Unique Latin username
 */
export function generateUsername(arabicName: string, existingUsernames: Set<string>): string {
  const base = transliterate(arabicName);
  
  if (!base) {
    // Fallback for names that don't transliterate well
    const fallback = `user_${Date.now()}`;
    return fallback;
  }
  
  // Try without number first
  if (!existingUsernames.has(base)) {
    existingUsernames.add(base);
    return base;
  }
  
  // Add sequential number if duplicate
  let counter = 1;
  while (existingUsernames.has(`${base}_${counter}`)) {
    counter++;
  }
  
  const username = `${base}_${counter}`;
  existingUsernames.add(username);
  return username;
}

// Test the transliteration
if (import.meta.url === `file://${process.argv[1]}`) {
  const testNames = [
    'اسراء السامرائي',
    'ندى البعاج',
    'امنة القيسي',
    'لينة قصي',
    'نورة المنصور',
    'فاطمة الأحمد',
    'عبدالله الراجحي',
    'خالد الغامدي',
    'أحمد خالد',
    'سارة علي',
  ];
  
  console.log('=== Transliteration Test ===\n');
  const usedUsernames = new Set<string>();
  
  for (const name of testNames) {
    const username = generateUsername(name, usedUsernames);
    console.log(`${name} -> ${username}`);
  }
  
  // Test duplicate handling
  console.log('\n=== Duplicate Handling Test ===\n');
  const testDuplicates = ['أحمد', 'أحمد', 'أحمد'];
  for (const name of testDuplicates) {
    const username = generateUsername(name, usedUsernames);
    console.log(`${name} -> ${username}`);
  }
}
