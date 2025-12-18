-- ============================================================================
-- Faye Organization Data Import
-- Generated at: 2025-12-18T03:47:56.515Z
-- ============================================================================
-- This script imports real organization data from the Excel file
-- Run this in Supabase SQL Editor after running 001_initial_schema.sql
-- ============================================================================

DO $$
DECLARE
    org_id UUID;
    
    -- Team Member profile IDs
    team_member_1_id UUID;
    team_member_2_id UUID;
    team_member_3_id UUID;
    team_member_4_id UUID;
    team_member_5_id UUID;
    team_member_6_id UUID;
    team_member_7_id UUID;
    team_member_8_id UUID;

    -- Sponsor profile IDs
    sponsor_1_id UUID;
    sponsor_2_id UUID;
    sponsor_3_id UUID;
    sponsor_4_id UUID;
    sponsor_5_id UUID;
    sponsor_6_id UUID;
    sponsor_7_id UUID;
    sponsor_8_id UUID;
    sponsor_9_id UUID;
    sponsor_10_id UUID;
    sponsor_11_id UUID;
    sponsor_12_id UUID;
    sponsor_13_id UUID;
    sponsor_14_id UUID;
    sponsor_15_id UUID;
    sponsor_16_id UUID;
    sponsor_17_id UUID;
    sponsor_18_id UUID;
    sponsor_19_id UUID;
    sponsor_20_id UUID;
    sponsor_21_id UUID;
    sponsor_22_id UUID;
    sponsor_23_id UUID;
    sponsor_24_id UUID;
    sponsor_25_id UUID;
    sponsor_26_id UUID;
    sponsor_27_id UUID;
    sponsor_28_id UUID;
    sponsor_29_id UUID;
    sponsor_30_id UUID;
    sponsor_31_id UUID;
    sponsor_32_id UUID;
    sponsor_33_id UUID;
    sponsor_34_id UUID;
    sponsor_35_id UUID;
    sponsor_36_id UUID;
    sponsor_37_id UUID;
    sponsor_38_id UUID;
    sponsor_39_id UUID;
    sponsor_40_id UUID;
    sponsor_41_id UUID;
    sponsor_42_id UUID;
    sponsor_43_id UUID;
    sponsor_44_id UUID;
    sponsor_45_id UUID;
    sponsor_46_id UUID;
    sponsor_47_id UUID;
    sponsor_48_id UUID;
    sponsor_49_id UUID;
    sponsor_50_id UUID;
    sponsor_51_id UUID;
    sponsor_52_id UUID;
    sponsor_53_id UUID;
    sponsor_54_id UUID;
    sponsor_55_id UUID;
    sponsor_56_id UUID;
    sponsor_57_id UUID;
    sponsor_58_id UUID;
    sponsor_59_id UUID;
    sponsor_60_id UUID;
    sponsor_61_id UUID;
    sponsor_62_id UUID;
    sponsor_63_id UUID;
    sponsor_64_id UUID;
    sponsor_65_id UUID;
    sponsor_66_id UUID;
    sponsor_67_id UUID;
    sponsor_68_id UUID;
    sponsor_69_id UUID;
    sponsor_70_id UUID;
    sponsor_71_id UUID;
    sponsor_72_id UUID;
    sponsor_73_id UUID;
    sponsor_74_id UUID;
    sponsor_75_id UUID;
    sponsor_76_id UUID;
    sponsor_77_id UUID;
    sponsor_78_id UUID;
    sponsor_79_id UUID;
    sponsor_80_id UUID;
    sponsor_81_id UUID;
    sponsor_82_id UUID;
    sponsor_83_id UUID;
    sponsor_84_id UUID;
    sponsor_85_id UUID;
    sponsor_86_id UUID;
    sponsor_87_id UUID;
    sponsor_88_id UUID;
    sponsor_89_id UUID;
    sponsor_90_id UUID;
    sponsor_91_id UUID;
    sponsor_92_id UUID;
    sponsor_93_id UUID;
    sponsor_94_id UUID;

    -- Orphan IDs
    orphan_1_id UUID;
    orphan_2_id UUID;
    orphan_3_id UUID;
    orphan_4_id UUID;
    orphan_5_id UUID;
    orphan_6_id UUID;
    orphan_7_id UUID;
    orphan_8_id UUID;
    orphan_9_id UUID;
    orphan_10_id UUID;
    orphan_11_id UUID;
    orphan_12_id UUID;
    orphan_13_id UUID;
    orphan_14_id UUID;
    orphan_15_id UUID;
    orphan_16_id UUID;
    orphan_17_id UUID;
    orphan_18_id UUID;
    orphan_19_id UUID;
    orphan_20_id UUID;
    orphan_21_id UUID;
    orphan_22_id UUID;
    orphan_23_id UUID;
    orphan_24_id UUID;
    orphan_25_id UUID;
    orphan_26_id UUID;
    orphan_27_id UUID;
    orphan_28_id UUID;
    orphan_29_id UUID;
    orphan_30_id UUID;
    orphan_31_id UUID;
    orphan_32_id UUID;
    orphan_33_id UUID;
    orphan_34_id UUID;
    orphan_35_id UUID;
    orphan_36_id UUID;
    orphan_37_id UUID;
    orphan_38_id UUID;
    orphan_39_id UUID;
    orphan_40_id UUID;
    orphan_41_id UUID;
    orphan_42_id UUID;
    orphan_43_id UUID;
    orphan_44_id UUID;
    orphan_45_id UUID;
    orphan_46_id UUID;
    orphan_47_id UUID;
    orphan_48_id UUID;
    orphan_49_id UUID;
    orphan_50_id UUID;
    orphan_51_id UUID;
    orphan_52_id UUID;
    orphan_53_id UUID;
    orphan_54_id UUID;
    orphan_55_id UUID;
    orphan_56_id UUID;
    orphan_57_id UUID;
    orphan_58_id UUID;
    orphan_59_id UUID;
    orphan_60_id UUID;
    orphan_61_id UUID;
    orphan_62_id UUID;
    orphan_63_id UUID;
    orphan_64_id UUID;
    orphan_65_id UUID;
    orphan_66_id UUID;
    orphan_67_id UUID;
    orphan_68_id UUID;
    orphan_69_id UUID;
    orphan_70_id UUID;
    orphan_71_id UUID;
    orphan_72_id UUID;
    orphan_73_id UUID;
    orphan_74_id UUID;
    orphan_75_id UUID;
    orphan_76_id UUID;
    orphan_77_id UUID;
    orphan_78_id UUID;
    orphan_79_id UUID;
    orphan_80_id UUID;
    orphan_81_id UUID;
    orphan_82_id UUID;
    orphan_83_id UUID;
    orphan_84_id UUID;
    orphan_85_id UUID;
    orphan_86_id UUID;
    orphan_87_id UUID;
    orphan_88_id UUID;
    orphan_89_id UUID;
    orphan_90_id UUID;
    orphan_91_id UUID;
    orphan_92_id UUID;
    orphan_93_id UUID;
    orphan_94_id UUID;
    orphan_95_id UUID;
    orphan_96_id UUID;
    orphan_97_id UUID;
    orphan_98_id UUID;
    orphan_99_id UUID;
    orphan_100_id UUID;
    orphan_101_id UUID;
    orphan_102_id UUID;
    orphan_103_id UUID;
    orphan_104_id UUID;
    orphan_105_id UUID;
    orphan_106_id UUID;
    orphan_107_id UUID;
    orphan_108_id UUID;
    orphan_109_id UUID;
    orphan_110_id UUID;
    orphan_111_id UUID;
    orphan_112_id UUID;
    orphan_113_id UUID;
    orphan_114_id UUID;
    orphan_115_id UUID;
    orphan_116_id UUID;
    orphan_117_id UUID;
    orphan_118_id UUID;
    orphan_119_id UUID;
    orphan_120_id UUID;
    orphan_121_id UUID;
    orphan_122_id UUID;
    orphan_123_id UUID;
    orphan_124_id UUID;
    orphan_125_id UUID;
    orphan_126_id UUID;
    orphan_127_id UUID;
    orphan_128_id UUID;
    orphan_129_id UUID;
    orphan_130_id UUID;
    orphan_131_id UUID;
    orphan_132_id UUID;
    orphan_133_id UUID;
    orphan_134_id UUID;
    orphan_135_id UUID;
    orphan_136_id UUID;
    orphan_137_id UUID;
    orphan_138_id UUID;
    orphan_139_id UUID;
    orphan_140_id UUID;
    orphan_141_id UUID;
    orphan_142_id UUID;
    orphan_143_id UUID;
    orphan_144_id UUID;
    orphan_145_id UUID;
    orphan_146_id UUID;
    orphan_147_id UUID;
    orphan_148_id UUID;
    orphan_149_id UUID;
    orphan_150_id UUID;
    orphan_151_id UUID;
    orphan_152_id UUID;
    orphan_153_id UUID;
    orphan_154_id UUID;
    orphan_155_id UUID;
    orphan_156_id UUID;
    orphan_157_id UUID;
    orphan_158_id UUID;
    orphan_159_id UUID;
    orphan_160_id UUID;
    orphan_161_id UUID;
    orphan_162_id UUID;
    orphan_163_id UUID;
    orphan_164_id UUID;
    orphan_165_id UUID;
    orphan_166_id UUID;
    orphan_167_id UUID;
    orphan_168_id UUID;
    orphan_169_id UUID;
    orphan_170_id UUID;
    orphan_171_id UUID;
    orphan_172_id UUID;
    orphan_173_id UUID;
    orphan_174_id UUID;
    orphan_175_id UUID;
    orphan_176_id UUID;
    orphan_177_id UUID;
    orphan_178_id UUID;
    orphan_179_id UUID;
    orphan_180_id UUID;
    orphan_181_id UUID;
    orphan_182_id UUID;
    orphan_183_id UUID;
    orphan_184_id UUID;
    orphan_185_id UUID;
    orphan_186_id UUID;
    orphan_187_id UUID;
    orphan_188_id UUID;
    orphan_189_id UUID;
    orphan_190_id UUID;
    orphan_191_id UUID;
    orphan_192_id UUID;
    orphan_193_id UUID;
    orphan_194_id UUID;
    orphan_195_id UUID;
    orphan_196_id UUID;
    orphan_197_id UUID;
    orphan_198_id UUID;
    orphan_199_id UUID;
    orphan_200_id UUID;
    orphan_201_id UUID;
    orphan_202_id UUID;
    orphan_203_id UUID;
    orphan_204_id UUID;
    orphan_205_id UUID;
    orphan_206_id UUID;
    orphan_207_id UUID;
    orphan_208_id UUID;
    orphan_209_id UUID;
    orphan_210_id UUID;
    orphan_211_id UUID;
    orphan_212_id UUID;
    orphan_213_id UUID;
    orphan_214_id UUID;
    orphan_215_id UUID;
    orphan_216_id UUID;
    orphan_217_id UUID;
    orphan_218_id UUID;
    orphan_219_id UUID;
    orphan_220_id UUID;
    orphan_221_id UUID;
    orphan_222_id UUID;
    orphan_223_id UUID;
    orphan_224_id UUID;
    orphan_225_id UUID;
    orphan_226_id UUID;
    orphan_227_id UUID;
    orphan_228_id UUID;
    orphan_229_id UUID;
    orphan_230_id UUID;
    orphan_231_id UUID;
    orphan_232_id UUID;
    orphan_233_id UUID;
    orphan_234_id UUID;
    orphan_235_id UUID;
    orphan_236_id UUID;
    orphan_237_id UUID;
    orphan_238_id UUID;
    orphan_239_id UUID;

    auth_id UUID;
BEGIN
    RAISE NOTICE 'Starting Faye organization data import...';
    
    -- ============================================================================
    -- STEP 1: CREATE ORGANIZATION
    -- ============================================================================
    RAISE NOTICE 'Creating organization...';
    
    INSERT INTO organizations (name) 
    VALUES ('منظمة فيء')
    RETURNING id INTO org_id;
    
    RAISE NOTICE '  ✓ Created organization: منظمة فيء (ID: %)', org_id;

    -- ============================================================================
    -- STEP 2: CREATE TEAM MEMBER PROFILES
    -- ============================================================================
    RAISE NOTICE 'Creating team member profiles...';

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'team_member', 'اسراء السامرائي')
    RETURNING id INTO team_member_1_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'team_member', 'ندى البعاج')
    RETURNING id INTO team_member_2_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'team_member', 'امنة القيسي')
    RETURNING id INTO team_member_3_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'team_member', 'لينة قصي')
    RETURNING id INTO team_member_4_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'team_member', 'د ميسرة')
    RETURNING id INTO team_member_5_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'team_member', 'رقية النعيمي')
    RETURNING id INTO team_member_6_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'team_member', 'خضر الزيدي')
    RETURNING id INTO team_member_7_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'team_member', 'عائشة الفهداوي')
    RETURNING id INTO team_member_8_id;

    RAISE NOTICE '  ✓ Created 8 team member profiles';

    -- ============================================================================
    -- STEP 3: CREATE SPONSOR PROFILES
    -- ============================================================================
    RAISE NOTICE 'Creating sponsor profiles...';

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'اسماء')
    RETURNING id INTO sponsor_1_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'نورة المنصور')
    RETURNING id INTO sponsor_2_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'فاعلة خير')
    RETURNING id INTO sponsor_3_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'خير ربي')
    RETURNING id INTO sponsor_4_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'فوزية الطاسان')
    RETURNING id INTO sponsor_5_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سمانتا فضل الله')
    RETURNING id INTO sponsor_6_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'حنان دهلوي')
    RETURNING id INTO sponsor_7_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'أيوب الجنابي')
    RETURNING id INTO sponsor_8_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سليمان محمد (فاعل خير)')
    RETURNING id INTO sponsor_9_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'خالد ال محمود (نوار الدخيل)')
    RETURNING id INTO sponsor_10_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'لينا غندور')
    RETURNING id INTO sponsor_11_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'دكتورة مريم')
    RETURNING id INTO sponsor_12_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'عائشة الملا')
    RETURNING id INTO sponsor_13_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ام عبدالله القطرية')
    RETURNING id INTO sponsor_14_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ام طارق')
    RETURNING id INTO sponsor_15_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'حنان عبدالغفور')
    RETURNING id INTO sponsor_16_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ايمان اللفت')
    RETURNING id INTO sponsor_17_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ليلى الكنعان')
    RETURNING id INTO sponsor_18_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'الاخوة والاخوات')
    RETURNING id INTO sponsor_19_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'نورة اللفت')
    RETURNING id INTO sponsor_20_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ايمان الحلواني')
    RETURNING id INTO sponsor_21_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ام احمد')
    RETURNING id INTO sponsor_22_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'نورة القحطاني')
    RETURNING id INTO sponsor_23_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'عيد الماجد')
    RETURNING id INTO sponsor_24_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ام ثامر')
    RETURNING id INTO sponsor_25_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'أبو علي')
    RETURNING id INTO sponsor_26_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'امل الهداب')
    RETURNING id INTO sponsor_27_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ليلى (ام انس)')
    RETURNING id INTO sponsor_28_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'انوار الابراهيم')
    RETURNING id INTO sponsor_29_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'تهاني المعلم')
    RETURNING id INTO sponsor_30_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ام عبدالعزيز')
    RETURNING id INTO sponsor_31_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ايمان السقاط')
    RETURNING id INTO sponsor_32_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'أبو عبدالله')
    RETURNING id INTO sponsor_33_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سيناء العمران')
    RETURNING id INTO sponsor_34_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'علي ال محمود (نوار الدخيل)')
    RETURNING id INTO sponsor_35_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سهى العمران')
    RETURNING id INTO sponsor_36_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'فاطمة العسماوي')
    RETURNING id INTO sponsor_37_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سعاد الداوود')
    RETURNING id INTO sponsor_38_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'بدرية الملحم')
    RETURNING id INTO sponsor_39_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سعود الرميزان')
    RETURNING id INTO sponsor_40_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'أبو نهار')
    RETURNING id INTO sponsor_41_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'محمد ال محمود (نوار الدخيل)')
    RETURNING id INTO sponsor_42_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'شيخة بانمي')
    RETURNING id INTO sponsor_43_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'غنيمة العسماوي')
    RETURNING id INTO sponsor_44_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سحر غزالي')
    RETURNING id INTO sponsor_45_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'عهود رجب')
    RETURNING id INTO sponsor_46_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ام عبدالاله')
    RETURNING id INTO sponsor_47_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'اعتماد اللفت')
    RETURNING id INTO sponsor_48_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'مجد الحواري')
    RETURNING id INTO sponsor_49_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'علياء')
    RETURNING id INTO sponsor_50_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'مرام الشريف')
    RETURNING id INTO sponsor_51_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ابرار الابراهيم')
    RETURNING id INTO sponsor_52_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'منى الحافظ')
    RETURNING id INTO sponsor_53_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'مها المرشد')
    RETURNING id INTO sponsor_54_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'نورة الحافظ')
    RETURNING id INTO sponsor_55_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'نبيلة معروف بنتن')
    RETURNING id INTO sponsor_56_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'حنان اللفت')
    RETURNING id INTO sponsor_57_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ناجية الحربي')
    RETURNING id INTO sponsor_58_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'شهد الحلواني')
    RETURNING id INTO sponsor_59_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'نوار الدخيل')
    RETURNING id INTO sponsor_60_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'دلال الفيلجاوي')
    RETURNING id INTO sponsor_61_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'خولة الدحان')
    RETURNING id INTO sponsor_62_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'اروى السيد')
    RETURNING id INTO sponsor_63_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'خلود الجنابي')
    RETURNING id INTO sponsor_64_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'مها الحافظ وجوهرة')
    RETURNING id INTO sponsor_65_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'امنة عرنوص')
    RETURNING id INTO sponsor_66_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سلوى اسماعيل')
    RETURNING id INTO sponsor_67_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'زينة السعدي')
    RETURNING id INTO sponsor_68_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'خلود الراشد')
    RETURNING id INTO sponsor_69_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سعاد عبدالعزيز الحميد')
    RETURNING id INTO sponsor_70_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'علية حسين')
    RETURNING id INTO sponsor_71_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ام مشعل')
    RETURNING id INTO sponsor_72_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سامية اسماعيل')
    RETURNING id INTO sponsor_73_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'منيرة الرشيد')
    RETURNING id INTO sponsor_74_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'قاسم الجنابي')
    RETURNING id INTO sponsor_75_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'سوسن عبدالمحسن الحنين')
    RETURNING id INTO sponsor_76_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'هناء إسماعيل')
    RETURNING id INTO sponsor_77_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'انتصار البراك')
    RETURNING id INTO sponsor_78_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'حياة اللفت')
    RETURNING id INTO sponsor_79_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'مؤمن الزرزور')
    RETURNING id INTO sponsor_80_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ليلى جمعة')
    RETURNING id INTO sponsor_81_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'روني كامل')
    RETURNING id INTO sponsor_82_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ميسم خالد')
    RETURNING id INTO sponsor_83_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'طلحة')
    RETURNING id INTO sponsor_84_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'زينب سعد / ضحى علاء عبد الوهاب')
    RETURNING id INTO sponsor_85_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'هاجر مثنى نوري')
    RETURNING id INTO sponsor_86_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'عثمان المشايخي')
    RETURNING id INTO sponsor_87_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'عبد الله علي كريم')
    RETURNING id INTO sponsor_88_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ايناس جواد النعيمي / اثير طه')
    RETURNING id INTO sponsor_89_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'صفا قاسم')
    RETURNING id INTO sponsor_90_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'قتيبة الغالبي')
    RETURNING id INTO sponsor_91_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'شفاء قاسم')
    RETURNING id INTO sponsor_92_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'جوانة')
    RETURNING id INTO sponsor_93_id;

    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', 'ياسر محيسن')
    RETURNING id INTO sponsor_94_id;

    RAISE NOTICE '  ✓ Created 94 sponsor profiles';

    -- ============================================================================
    -- STEP 4: CREATE USER PERMISSIONS (for all users)
    -- ============================================================================
    RAISE NOTICE 'Creating user permissions...';

    -- اسراء السامرائي (Manager with all permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (team_member_1_id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE);

    -- ندى البعاج (Team member with standard permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (team_member_2_id, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE);

    -- امنة القيسي (Team member with standard permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (team_member_3_id, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE);

    -- لينة قصي (Team member with standard permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (team_member_4_id, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE);

    -- د ميسرة (Team member with standard permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (team_member_5_id, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE);

    -- رقية النعيمي (Team member with standard permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (team_member_6_id, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE);

    -- خضر الزيدي (Team member with standard permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (team_member_7_id, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE);

    -- عائشة الفهداوي (Team member with standard permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (team_member_8_id, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE);

    -- اسماء (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_1_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- نورة المنصور (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_2_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- فاعلة خير (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_3_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- خير ربي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_4_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- فوزية الطاسان (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_5_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سمانتا فضل الله (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_6_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- حنان دهلوي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_7_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- أيوب الجنابي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_8_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سليمان محمد (فاعل خير) (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_9_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- خالد ال محمود (نوار الدخيل) (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_10_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- لينا غندور (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_11_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- دكتورة مريم (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_12_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- عائشة الملا (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_13_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ام عبدالله القطرية (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_14_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ام طارق (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_15_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- حنان عبدالغفور (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_16_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ايمان اللفت (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_17_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ليلى الكنعان (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_18_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- الاخوة والاخوات (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_19_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- نورة اللفت (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_20_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ايمان الحلواني (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_21_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ام احمد (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_22_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- نورة القحطاني (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_23_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- عيد الماجد (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_24_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ام ثامر (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_25_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- أبو علي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_26_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- امل الهداب (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_27_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ليلى (ام انس) (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_28_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- انوار الابراهيم (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_29_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- تهاني المعلم (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_30_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ام عبدالعزيز (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_31_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ايمان السقاط (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_32_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- أبو عبدالله (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_33_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سيناء العمران (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_34_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- علي ال محمود (نوار الدخيل) (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_35_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سهى العمران (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_36_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- فاطمة العسماوي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_37_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سعاد الداوود (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_38_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- بدرية الملحم (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_39_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سعود الرميزان (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_40_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- أبو نهار (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_41_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- محمد ال محمود (نوار الدخيل) (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_42_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- شيخة بانمي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_43_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- غنيمة العسماوي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_44_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سحر غزالي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_45_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- عهود رجب (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_46_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ام عبدالاله (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_47_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- اعتماد اللفت (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_48_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- مجد الحواري (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_49_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- علياء (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_50_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- مرام الشريف (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_51_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ابرار الابراهيم (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_52_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- منى الحافظ (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_53_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- مها المرشد (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_54_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- نورة الحافظ (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_55_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- نبيلة معروف بنتن (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_56_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- حنان اللفت (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_57_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ناجية الحربي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_58_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- شهد الحلواني (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_59_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- نوار الدخيل (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_60_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- دلال الفيلجاوي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_61_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- خولة الدحان (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_62_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- اروى السيد (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_63_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- خلود الجنابي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_64_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- مها الحافظ وجوهرة (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_65_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- امنة عرنوص (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_66_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سلوى اسماعيل (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_67_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- زينة السعدي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_68_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- خلود الراشد (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_69_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سعاد عبدالعزيز الحميد (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_70_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- علية حسين (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_71_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ام مشعل (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_72_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سامية اسماعيل (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_73_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- منيرة الرشيد (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_74_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- قاسم الجنابي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_75_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- سوسن عبدالمحسن الحنين (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_76_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- هناء إسماعيل (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_77_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- انتصار البراك (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_78_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- حياة اللفت (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_79_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- مؤمن الزرزور (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_80_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ليلى جمعة (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_81_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- روني كامل (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_82_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ميسم خالد (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_83_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- طلحة (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_84_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- زينب سعد / ضحى علاء عبد الوهاب (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_85_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- هاجر مثنى نوري (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_86_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- عثمان المشايخي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_87_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- عبد الله علي كريم (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_88_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ايناس جواد النعيمي / اثير طه (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_89_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- صفا قاسم (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_90_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- قتيبة الغالبي (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_91_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- شفاء قاسم (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_92_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- جوانة (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_93_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    -- ياسر محيسن (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (sponsor_94_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

    RAISE NOTICE '  ✓ Created permissions for all users';

    -- ============================================================================
    -- STEP 5: CREATE AUTH ACCOUNTS
    -- ============================================================================
    RAISE NOTICE 'Creating auth accounts...';

    BEGIN
        SELECT create_user_account(
            'asra_alsamraey',
            'asra_alsamraey@faye.org',
            'asra_alsamraeyPass123',
            team_member_1_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for اسراء السامرائي (asra_alsamraey)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for اسراء السامرائي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'nda_albaaj',
            'nda_albaaj@faye.org',
            'nda_albaajPass123',
            team_member_2_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ندى البعاج (nda_albaaj)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ندى البعاج may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'amna_alqysy',
            'amna_alqysy@faye.org',
            'amna_alqysyPass123',
            team_member_3_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for امنة القيسي (amna_alqysy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for امنة القيسي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'lyna_qsy',
            'lyna_qsy@faye.org',
            'lyna_qsyPass123',
            team_member_4_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for لينة قصي (lyna_qsy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for لينة قصي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'd_mysra',
            'd_mysra@faye.org',
            'd_mysraPass123',
            team_member_5_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for د ميسرة (d_mysra)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for د ميسرة may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'rqya_alnaymy',
            'rqya_alnaymy@faye.org',
            'rqya_alnaymyPass123',
            team_member_6_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for رقية النعيمي (rqya_alnaymy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for رقية النعيمي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'khdr_alzydy',
            'khdr_alzydy@faye.org',
            'khdr_alzydyPass123',
            team_member_7_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for خضر الزيدي (khdr_alzydy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for خضر الزيدي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'aaesha_alfhdawy',
            'aaesha_alfhdawy@faye.org',
            'aaesha_alfhdawyPass123',
            team_member_8_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for عائشة الفهداوي (aaesha_alfhdawy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for عائشة الفهداوي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'asma',
            'asma@faye.org',
            'asmaPass123',
            sponsor_1_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for اسماء (asma)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for اسماء may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'nwra_almnswr',
            'nwra_almnswr@faye.org',
            'nwra_almnswrPass123',
            sponsor_2_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for نورة المنصور (nwra_almnswr)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for نورة المنصور may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'faala_khyr',
            'faala_khyr@faye.org',
            'faala_khyrPass123',
            sponsor_3_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for فاعلة خير (faala_khyr)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for فاعلة خير may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'khyr_rby',
            'khyr_rby@faye.org',
            'khyr_rbyPass123',
            sponsor_4_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for خير ربي (khyr_rby)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for خير ربي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'fwzya_altasan',
            'fwzya_altasan@faye.org',
            'fwzya_altasanPass123',
            sponsor_5_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for فوزية الطاسان (fwzya_altasan)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for فوزية الطاسان may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'smanta_fdl_allh',
            'smanta_fdl_allh@faye.org',
            'smanta_fdl_allhPass123',
            sponsor_6_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سمانتا فضل الله (smanta_fdl_allh)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سمانتا فضل الله may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'hnan_dhlwy',
            'hnan_dhlwy@faye.org',
            'hnan_dhlwyPass123',
            sponsor_7_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for حنان دهلوي (hnan_dhlwy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for حنان دهلوي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'aywb_aljnaby',
            'aywb_aljnaby@faye.org',
            'aywb_aljnabyPass123',
            sponsor_8_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for أيوب الجنابي (aywb_aljnaby)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for أيوب الجنابي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'slyman_mhmd_faal_khyr',
            'slyman_mhmd_faal_khyr@faye.org',
            'slyman_mhmd_faal_khyrPass123',
            sponsor_9_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سليمان محمد (فاعل خير) (slyman_mhmd_faal_khyr)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سليمان محمد (فاعل خير) may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'khald_al_mhmwd_nwar_aldkhyl',
            'khald_al_mhmwd_nwar_aldkhyl@faye.org',
            'khald_al_mhmwd_nwar_aldkhylPass123',
            sponsor_10_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for خالد ال محمود (نوار الدخيل) (khald_al_mhmwd_nwar_aldkhyl)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for خالد ال محمود (نوار الدخيل) may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'lyna_ghndwr',
            'lyna_ghndwr@faye.org',
            'lyna_ghndwrPass123',
            sponsor_11_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for لينا غندور (lyna_ghndwr)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for لينا غندور may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'dktwra_mrym',
            'dktwra_mrym@faye.org',
            'dktwra_mrymPass123',
            sponsor_12_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for دكتورة مريم (dktwra_mrym)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for دكتورة مريم may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'aaesha_almla',
            'aaesha_almla@faye.org',
            'aaesha_almlaPass123',
            sponsor_13_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for عائشة الملا (aaesha_almla)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for عائشة الملا may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'am_abdallh_alqtrya',
            'am_abdallh_alqtrya@faye.org',
            'am_abdallh_alqtryaPass123',
            sponsor_14_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ام عبدالله القطرية (am_abdallh_alqtrya)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ام عبدالله القطرية may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'am_tarq',
            'am_tarq@faye.org',
            'am_tarqPass123',
            sponsor_15_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ام طارق (am_tarq)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ام طارق may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'hnan_abdalghfwr',
            'hnan_abdalghfwr@faye.org',
            'hnan_abdalghfwrPass123',
            sponsor_16_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for حنان عبدالغفور (hnan_abdalghfwr)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for حنان عبدالغفور may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'ayman_allft',
            'ayman_allft@faye.org',
            'ayman_allftPass123',
            sponsor_17_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ايمان اللفت (ayman_allft)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ايمان اللفت may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'lyla_alknaan',
            'lyla_alknaan@faye.org',
            'lyla_alknaanPass123',
            sponsor_18_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ليلى الكنعان (lyla_alknaan)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ليلى الكنعان may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'alakhwa_walakhwat',
            'alakhwa_walakhwat@faye.org',
            'alakhwa_walakhwatPass123',
            sponsor_19_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for الاخوة والاخوات (alakhwa_walakhwat)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for الاخوة والاخوات may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'nwra_allft',
            'nwra_allft@faye.org',
            'nwra_allftPass123',
            sponsor_20_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for نورة اللفت (nwra_allft)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for نورة اللفت may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'ayman_alhlwany',
            'ayman_alhlwany@faye.org',
            'ayman_alhlwanyPass123',
            sponsor_21_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ايمان الحلواني (ayman_alhlwany)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ايمان الحلواني may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'am_ahmd',
            'am_ahmd@faye.org',
            'am_ahmdPass123',
            sponsor_22_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ام احمد (am_ahmd)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ام احمد may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'nwra_alqhtany',
            'nwra_alqhtany@faye.org',
            'nwra_alqhtanyPass123',
            sponsor_23_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for نورة القحطاني (nwra_alqhtany)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for نورة القحطاني may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'ayd_almajd',
            'ayd_almajd@faye.org',
            'ayd_almajdPass123',
            sponsor_24_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for عيد الماجد (ayd_almajd)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for عيد الماجد may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'am_thamr',
            'am_thamr@faye.org',
            'am_thamrPass123',
            sponsor_25_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ام ثامر (am_thamr)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ام ثامر may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'abw_aly',
            'abw_aly@faye.org',
            'abw_alyPass123',
            sponsor_26_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for أبو علي (abw_aly)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for أبو علي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'aml_alhdab',
            'aml_alhdab@faye.org',
            'aml_alhdabPass123',
            sponsor_27_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for امل الهداب (aml_alhdab)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for امل الهداب may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'lyla_am_ans',
            'lyla_am_ans@faye.org',
            'lyla_am_ansPass123',
            sponsor_28_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ليلى (ام انس) (lyla_am_ans)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ليلى (ام انس) may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'anwar_alabrahym',
            'anwar_alabrahym@faye.org',
            'anwar_alabrahymPass123',
            sponsor_29_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for انوار الابراهيم (anwar_alabrahym)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for انوار الابراهيم may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'thany_almalm',
            'thany_almalm@faye.org',
            'thany_almalmPass123',
            sponsor_30_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for تهاني المعلم (thany_almalm)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for تهاني المعلم may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'am_abdalazyz',
            'am_abdalazyz@faye.org',
            'am_abdalazyzPass123',
            sponsor_31_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ام عبدالعزيز (am_abdalazyz)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ام عبدالعزيز may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'ayman_alsqat',
            'ayman_alsqat@faye.org',
            'ayman_alsqatPass123',
            sponsor_32_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ايمان السقاط (ayman_alsqat)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ايمان السقاط may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'abw_abdallh',
            'abw_abdallh@faye.org',
            'abw_abdallhPass123',
            sponsor_33_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for أبو عبدالله (abw_abdallh)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for أبو عبدالله may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'syna_alamran',
            'syna_alamran@faye.org',
            'syna_alamranPass123',
            sponsor_34_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سيناء العمران (syna_alamran)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سيناء العمران may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'aly_al_mhmwd_nwar_aldkhyl',
            'aly_al_mhmwd_nwar_aldkhyl@faye.org',
            'aly_al_mhmwd_nwar_aldkhylPass123',
            sponsor_35_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for علي ال محمود (نوار الدخيل) (aly_al_mhmwd_nwar_aldkhyl)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for علي ال محمود (نوار الدخيل) may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'sha_alamran',
            'sha_alamran@faye.org',
            'sha_alamranPass123',
            sponsor_36_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سهى العمران (sha_alamran)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سهى العمران may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'fatma_alasmawy',
            'fatma_alasmawy@faye.org',
            'fatma_alasmawyPass123',
            sponsor_37_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for فاطمة العسماوي (fatma_alasmawy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for فاطمة العسماوي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'saad_aldawwd',
            'saad_aldawwd@faye.org',
            'saad_aldawwdPass123',
            sponsor_38_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سعاد الداوود (saad_aldawwd)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سعاد الداوود may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'bdrya_almlhm',
            'bdrya_almlhm@faye.org',
            'bdrya_almlhmPass123',
            sponsor_39_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for بدرية الملحم (bdrya_almlhm)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for بدرية الملحم may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'sawd_alrmyzan',
            'sawd_alrmyzan@faye.org',
            'sawd_alrmyzanPass123',
            sponsor_40_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سعود الرميزان (sawd_alrmyzan)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سعود الرميزان may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'abw_nhar',
            'abw_nhar@faye.org',
            'abw_nharPass123',
            sponsor_41_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for أبو نهار (abw_nhar)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for أبو نهار may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'mhmd_al_mhmwd_nwar_aldkhyl',
            'mhmd_al_mhmwd_nwar_aldkhyl@faye.org',
            'mhmd_al_mhmwd_nwar_aldkhylPass123',
            sponsor_42_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for محمد ال محمود (نوار الدخيل) (mhmd_al_mhmwd_nwar_aldkhyl)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for محمد ال محمود (نوار الدخيل) may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'shykha_banmy',
            'shykha_banmy@faye.org',
            'shykha_banmyPass123',
            sponsor_43_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for شيخة بانمي (shykha_banmy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for شيخة بانمي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'ghnyma_alasmawy',
            'ghnyma_alasmawy@faye.org',
            'ghnyma_alasmawyPass123',
            sponsor_44_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for غنيمة العسماوي (ghnyma_alasmawy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for غنيمة العسماوي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'shr_ghzaly',
            'shr_ghzaly@faye.org',
            'shr_ghzalyPass123',
            sponsor_45_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سحر غزالي (shr_ghzaly)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سحر غزالي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'ahwd_rjb',
            'ahwd_rjb@faye.org',
            'ahwd_rjbPass123',
            sponsor_46_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for عهود رجب (ahwd_rjb)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for عهود رجب may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'am_abdalalh',
            'am_abdalalh@faye.org',
            'am_abdalalhPass123',
            sponsor_47_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ام عبدالاله (am_abdalalh)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ام عبدالاله may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'aatmad_allft',
            'aatmad_allft@faye.org',
            'aatmad_allftPass123',
            sponsor_48_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for اعتماد اللفت (aatmad_allft)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for اعتماد اللفت may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'mjd_alhwary',
            'mjd_alhwary@faye.org',
            'mjd_alhwaryPass123',
            sponsor_49_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for مجد الحواري (mjd_alhwary)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for مجد الحواري may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'alya',
            'alya@faye.org',
            'alyaPass123',
            sponsor_50_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for علياء (alya)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for علياء may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'mram_alshryf',
            'mram_alshryf@faye.org',
            'mram_alshryfPass123',
            sponsor_51_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for مرام الشريف (mram_alshryf)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for مرام الشريف may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'abrar_alabrahym',
            'abrar_alabrahym@faye.org',
            'abrar_alabrahymPass123',
            sponsor_52_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ابرار الابراهيم (abrar_alabrahym)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ابرار الابراهيم may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'mna_alhafz',
            'mna_alhafz@faye.org',
            'mna_alhafzPass123',
            sponsor_53_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for منى الحافظ (mna_alhafz)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for منى الحافظ may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'mha_almrshd',
            'mha_almrshd@faye.org',
            'mha_almrshdPass123',
            sponsor_54_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for مها المرشد (mha_almrshd)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for مها المرشد may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'nwra_alhafz',
            'nwra_alhafz@faye.org',
            'nwra_alhafzPass123',
            sponsor_55_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for نورة الحافظ (nwra_alhafz)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for نورة الحافظ may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'nbyla_marwf_bntn',
            'nbyla_marwf_bntn@faye.org',
            'nbyla_marwf_bntnPass123',
            sponsor_56_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for نبيلة معروف بنتن (nbyla_marwf_bntn)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for نبيلة معروف بنتن may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'hnan_allft',
            'hnan_allft@faye.org',
            'hnan_allftPass123',
            sponsor_57_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for حنان اللفت (hnan_allft)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for حنان اللفت may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'najya_alhrby',
            'najya_alhrby@faye.org',
            'najya_alhrbyPass123',
            sponsor_58_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ناجية الحربي (najya_alhrby)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ناجية الحربي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'shhd_alhlwany',
            'shhd_alhlwany@faye.org',
            'shhd_alhlwanyPass123',
            sponsor_59_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for شهد الحلواني (shhd_alhlwany)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for شهد الحلواني may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'nwar_aldkhyl',
            'nwar_aldkhyl@faye.org',
            'nwar_aldkhylPass123',
            sponsor_60_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for نوار الدخيل (nwar_aldkhyl)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for نوار الدخيل may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'dlal_alfyljawy',
            'dlal_alfyljawy@faye.org',
            'dlal_alfyljawyPass123',
            sponsor_61_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for دلال الفيلجاوي (dlal_alfyljawy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for دلال الفيلجاوي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'khwla_aldhan',
            'khwla_aldhan@faye.org',
            'khwla_aldhanPass123',
            sponsor_62_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for خولة الدحان (khwla_aldhan)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for خولة الدحان may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'arwa_alsyd',
            'arwa_alsyd@faye.org',
            'arwa_alsydPass123',
            sponsor_63_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for اروى السيد (arwa_alsyd)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for اروى السيد may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'khlwd_aljnaby',
            'khlwd_aljnaby@faye.org',
            'khlwd_aljnabyPass123',
            sponsor_64_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for خلود الجنابي (khlwd_aljnaby)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for خلود الجنابي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'mha_alhafz_wjwhra',
            'mha_alhafz_wjwhra@faye.org',
            'mha_alhafz_wjwhraPass123',
            sponsor_65_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for مها الحافظ وجوهرة (mha_alhafz_wjwhra)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for مها الحافظ وجوهرة may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'amna_arnws',
            'amna_arnws@faye.org',
            'amna_arnwsPass123',
            sponsor_66_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for امنة عرنوص (amna_arnws)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for امنة عرنوص may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'slwa_asmaayl',
            'slwa_asmaayl@faye.org',
            'slwa_asmaaylPass123',
            sponsor_67_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سلوى اسماعيل (slwa_asmaayl)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سلوى اسماعيل may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'zyna_alsady',
            'zyna_alsady@faye.org',
            'zyna_alsadyPass123',
            sponsor_68_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for زينة السعدي (zyna_alsady)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for زينة السعدي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'khlwd_alrashd',
            'khlwd_alrashd@faye.org',
            'khlwd_alrashdPass123',
            sponsor_69_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for خلود الراشد (khlwd_alrashd)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for خلود الراشد may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'saad_abdalazyz_alhmyd',
            'saad_abdalazyz_alhmyd@faye.org',
            'saad_abdalazyz_alhmydPass123',
            sponsor_70_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سعاد عبدالعزيز الحميد (saad_abdalazyz_alhmyd)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سعاد عبدالعزيز الحميد may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'alya_hsyn',
            'alya_hsyn@faye.org',
            'alya_hsynPass123',
            sponsor_71_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for علية حسين (alya_hsyn)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for علية حسين may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'am_mshal',
            'am_mshal@faye.org',
            'am_mshalPass123',
            sponsor_72_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ام مشعل (am_mshal)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ام مشعل may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'samya_asmaayl',
            'samya_asmaayl@faye.org',
            'samya_asmaaylPass123',
            sponsor_73_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سامية اسماعيل (samya_asmaayl)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سامية اسماعيل may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'mnyra_alrshyd',
            'mnyra_alrshyd@faye.org',
            'mnyra_alrshydPass123',
            sponsor_74_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for منيرة الرشيد (mnyra_alrshyd)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for منيرة الرشيد may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'qasm_aljnaby',
            'qasm_aljnaby@faye.org',
            'qasm_aljnabyPass123',
            sponsor_75_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for قاسم الجنابي (qasm_aljnaby)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for قاسم الجنابي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'swsn_abdalmhsn_alhnyn',
            'swsn_abdalmhsn_alhnyn@faye.org',
            'swsn_abdalmhsn_alhnynPass123',
            sponsor_76_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for سوسن عبدالمحسن الحنين (swsn_abdalmhsn_alhnyn)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for سوسن عبدالمحسن الحنين may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'hna_ismaayl',
            'hna_ismaayl@faye.org',
            'hna_ismaaylPass123',
            sponsor_77_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for هناء إسماعيل (hna_ismaayl)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for هناء إسماعيل may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'antsar_albrak',
            'antsar_albrak@faye.org',
            'antsar_albrakPass123',
            sponsor_78_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for انتصار البراك (antsar_albrak)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for انتصار البراك may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'hyaa_allft',
            'hyaa_allft@faye.org',
            'hyaa_allftPass123',
            sponsor_79_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for حياة اللفت (hyaa_allft)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for حياة اللفت may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'momn_alzrzwr',
            'momn_alzrzwr@faye.org',
            'momn_alzrzwrPass123',
            sponsor_80_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for مؤمن الزرزور (momn_alzrzwr)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for مؤمن الزرزور may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'lyla_jmaa',
            'lyla_jmaa@faye.org',
            'lyla_jmaaPass123',
            sponsor_81_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ليلى جمعة (lyla_jmaa)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ليلى جمعة may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'rwny_kaml',
            'rwny_kaml@faye.org',
            'rwny_kamlPass123',
            sponsor_82_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for روني كامل (rwny_kaml)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for روني كامل may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'mysm_khald',
            'mysm_khald@faye.org',
            'mysm_khaldPass123',
            sponsor_83_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ميسم خالد (mysm_khald)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ميسم خالد may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'tlha',
            'tlha@faye.org',
            'tlhaPass123',
            sponsor_84_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for طلحة (tlha)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for طلحة may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'zynb_sad_dha_ala_abd_alwhab',
            'zynb_sad_dha_ala_abd_alwhab@faye.org',
            'zynb_sad_dha_ala_abd_alwhabPass123',
            sponsor_85_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for زينب سعد / ضحى علاء عبد الوهاب (zynb_sad_dha_ala_abd_alwhab)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for زينب سعد / ضحى علاء عبد الوهاب may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'hajr_mthna_nwry',
            'hajr_mthna_nwry@faye.org',
            'hajr_mthna_nwryPass123',
            sponsor_86_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for هاجر مثنى نوري (hajr_mthna_nwry)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for هاجر مثنى نوري may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'athman_almshaykhy',
            'athman_almshaykhy@faye.org',
            'athman_almshaykhyPass123',
            sponsor_87_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for عثمان المشايخي (athman_almshaykhy)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for عثمان المشايخي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'abd_allh_aly_krym',
            'abd_allh_aly_krym@faye.org',
            'abd_allh_aly_krymPass123',
            sponsor_88_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for عبد الله علي كريم (abd_allh_aly_krym)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for عبد الله علي كريم may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'aynas_jwad_alnaymy_athyr_th',
            'aynas_jwad_alnaymy_athyr_th@faye.org',
            'aynas_jwad_alnaymy_athyr_thPass123',
            sponsor_89_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ايناس جواد النعيمي / اثير طه (aynas_jwad_alnaymy_athyr_th)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ايناس جواد النعيمي / اثير طه may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'sfa_qasm',
            'sfa_qasm@faye.org',
            'sfa_qasmPass123',
            sponsor_90_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for صفا قاسم (sfa_qasm)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for صفا قاسم may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'qtyba_alghalby',
            'qtyba_alghalby@faye.org',
            'qtyba_alghalbyPass123',
            sponsor_91_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for قتيبة الغالبي (qtyba_alghalby)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for قتيبة الغالبي may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'shfa_qasm',
            'shfa_qasm@faye.org',
            'shfa_qasmPass123',
            sponsor_92_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for شفاء قاسم (shfa_qasm)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for شفاء قاسم may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'jwana',
            'jwana@faye.org',
            'jwanaPass123',
            sponsor_93_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for جوانة (jwana)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for جوانة may already exist: %', SQLERRM;
    END;

    BEGIN
        SELECT create_user_account(
            'yasr_mhysn',
            'yasr_mhysn@faye.org',
            'yasr_mhysnPass123',
            sponsor_94_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ياسر محيسن (yasr_mhysn)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ياسر محيسن may already exist: %', SQLERRM;
    END;

    -- ============================================================================
    -- STEP 6: CREATE ORPHANS
    -- ============================================================================
    RAISE NOTICE 'Creating orphan records...';

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'احمد علي حسين',
        'ذكر',
        '2013-01-01',
        'سهاد محمد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_1_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'احمد عمار احمد',
        'ذكر',
        '2020-01-01',
        'سرور محمود',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_2_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'احمد مولود خالد',
        'ذكر',
        '2014-01-01',
        'حسينة حمادي',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_3_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'احمد هلال علي',
        'ذكر',
        '2014-01-01',
        'هناء عودة',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_4_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ارام علي عماد',
        'ذكر',
        '2020-01-01',
        'منى معد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_5_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ارجوان محمد محمود',
        'أنثى',
        '2020-01-01',
        'ازهار سالم',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_6_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'اساور مثنى عبدالرحمن',
        'أنثى',
        '2017-01-01',
        'اشواق داوود',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_7_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'اسراء حامد اسماعيل',
        'أنثى',
        '2012-01-01',
        'نجية خليل',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_8_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'اماني صبري جاسم',
        'أنثى',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_9_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'امنة سعيد فليح',
        'أنثى',
        '2011-01-01',
        'سناء سعيد',
        'العراق',
        'الطارمية',
        'شهرية'
    )
    RETURNING id INTO orphan_10_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'امير فراس محمد',
        'ذكر',
        '2018-01-01',
        'مريم',
        'العراق',
        'الطارمية',
        'سنوية'
    )
    RETURNING id INTO orphan_11_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'انس أسامة شاكر',
        'ذكر',
        '2014-01-01',
        'استبرق محمود',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_12_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'انس محمد فخري',
        'ذكر',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'شهرية'
    )
    RETURNING id INTO orphan_13_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'انور صباح خوام',
        'ذكر',
        '2014-01-01',
        'ليلى محمد',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_14_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ايسر حامد حبيب',
        'ذكر',
        '2016-01-01',
        'انفال محمد',
        'العراق',
        'الطارمية',
        'سنوية'
    )
    RETURNING id INTO orphan_15_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ايلاف سامي محمود',
        'أنثى',
        '2016-01-01',
        'دعاء حسين',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_16_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ايلاف محمد احمد',
        'أنثى',
        '2016-01-01',
        'كافي جبار',
        'العراق',
        'الطارمية',
        'شهرية'
    )
    RETURNING id INTO orphan_17_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ايمن رائد مجيد',
        'ذكر',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_18_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ايمن وسام قاسم',
        'ذكر',
        '2015-01-01',
        'سجى محمود',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_19_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'براء معن يوسف',
        'أنثى',
        '2016-01-01',
        'وسن عبدالرزاق',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_20_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'بركات رائد مجيد',
        'ذكر',
        '2015-01-01',
        'سماح محمد',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_21_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'بروين خضر سالم',
        'أنثى',
        '2014-01-01',
        'سوسن خالد',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_22_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'بشائر عماد علي',
        'أنثى',
        '2013-01-01',
        'هبة',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_23_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'بكر عمر عبد',
        'ذكر',
        '2015-01-01',
        'مروة هلال',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_24_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'بكر ماهر رافع',
        'ذكر',
        '2014-01-01',
        'رغد صباح',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_25_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'تبارك امير مهدي',
        'أنثى',
        '2012-01-01',
        'أسماء كريم',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_26_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'تسنيم خضر ستار',
        'أنثى',
        '2016-01-01',
        'اقبال حسن',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_27_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'جنة سيف سعد',
        'أنثى',
        '2012-01-01',
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_28_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'جود خالد سعد',
        'أنثى',
        '2020-01-01',
        'سهر إبراهيم',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_29_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'جيهان باسم ربيع',
        'أنثى',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_30_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'حارث عبدالله خضير',
        'ذكر',
        '2014-01-01',
        'فاطمة محمد',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_31_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'حسين ياسين حمود',
        'ذكر',
        '2012-01-01',
        'نضال شاكر',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_32_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'حميد محمد سعدون',
        'ذكر',
        '2014-01-01',
        'شيماء احمد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_33_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'حوراء سيف سعد',
        'أنثى',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_34_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'حوراء علي عبدالله',
        'أنثى',
        '2013-01-01',
        'عذراء شاكر محمد علي',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_35_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'دعاء ياسين حمود',
        'أنثى',
        '2019-01-01',
        'نضال شاكر',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_36_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ديمة سلمان علي',
        'أنثى',
        '2014-01-01',
        'شيماء فالح',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_37_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رتاج ياسين حمود',
        'أنثى',
        '2017-01-01',
        'نضال شاكر',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_38_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رحيق علي شهاب',
        'أنثى',
        '2013-01-01',
        'أسماء رافد',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_39_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رزان فراس عادل',
        'أنثى',
        '2020-01-01',
        'عتاب احمد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_40_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رغد موسى حسين',
        'أنثى',
        '2014-01-01',
        'راوية علي',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_41_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رفل موسى حسين',
        'أنثى',
        '2016-01-01',
        'راوية علي',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_42_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رنة محمد علي',
        'أنثى',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_43_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رهف ثائر رافع',
        'أنثى',
        '2013-01-01',
        'رنا صباح',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_44_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رهف سليم عبدالله',
        'أنثى',
        '2013-01-01',
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_45_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رهف عباس خضير',
        'أنثى',
        '2011-01-01',
        'سندس حازم عبد الرزاق',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_46_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رهف فراس عادل',
        'أنثى',
        '2019-01-01',
        'عتاب احمد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_47_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رهف هاشم نبيل',
        'أنثى',
        '2012-01-01',
        'سؤدد ابراهيم احمد',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_48_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'روان فراس عادل',
        'أنثى',
        '2020-01-01',
        'عتاب احمد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_49_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رؤى إبراهيم ناجي',
        'أنثى',
        '2011-01-01',
        'فرقد عبدالله',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_50_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رؤيا ضياء احمد',
        'أنثى',
        '2013-01-01',
        'نجوى محمد',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_51_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ريتاج عبدالله كاظم',
        'أنثى',
        '2015-01-01',
        'أسماء طه',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_52_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'زهراء جهاد عبد',
        'أنثى',
        '2014-01-01',
        'حنان صباح',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_53_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'زهراء سليمان ابراهيم',
        'أنثى',
        '2017-01-01',
        'هدية صاحب',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_54_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'زهراء عباس كامل',
        'أنثى',
        '2014-01-01',
        'شيماء ثامر',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_55_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'زينب موفق رحيم',
        'أنثى',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_56_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'زينة حقي اسماعيل',
        'أنثى',
        '2017-01-01',
        'انتصار طالب',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_57_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'سرى عمار احمد',
        'أنثى',
        '2013-01-01',
        'سرور محمود',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_58_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'سمر جمال',
        'أنثى',
        '2014-01-01',
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_59_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'سيرين علي شهاب',
        'أنثى',
        '2015-01-01',
        'أسماء رافد',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_60_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'سيف رائد مجيد',
        'ذكر',
        '2016-01-01',
        'سماح محمد',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_61_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'شذى ماهر رافع',
        'أنثى',
        '2016-01-01',
        'رغد صباح',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_62_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'شهد جهاد عبد',
        'أنثى',
        '2014-01-01',
        'حنان صباح',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_63_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'صفا جبار خضير',
        'أنثى',
        '2013-01-01',
        'سناء محمود صبح',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_64_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'صفا محمد فخري',
        'أنثى',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'شهرية'
    )
    RETURNING id INTO orphan_65_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'صهيب علي عبد',
        'ذكر',
        '2014-01-01',
        'فريال عليوي',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_66_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عامر علي عبد',
        'ذكر',
        '2019-01-01',
        'فريال عليوي',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_67_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالرحمن مثنى عبدالرحمن',
        'ذكر',
        '2012-01-01',
        'اشواق داوود',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_68_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالرزاق نبيل',
        'ذكر',
        '2010-01-01',
        'مروة عبدالرزاق',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_69_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالقادر ياس خضر',
        'ذكر',
        '2017-01-01',
        'عذراء عباس',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_70_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالكريم فالح مهدي',
        'ذكر',
        '2013-01-01',
        'شيماء كريم حمد',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_71_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالله احمد سامي',
        'ذكر',
        '2014-01-01',
        'منال كريم',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_72_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالله صبري جاسم',
        'ذكر',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_73_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالله محمد عليوي',
        'ذكر',
        '2016-01-01',
        'هاجر عبدالله',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_74_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عزالدين حاتم كريم',
        'ذكر',
        '2014-01-01',
        'جنان علي ابراهيم',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_75_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عزام سلام محمود',
        'ذكر',
        '2011-01-01',
        'امنة عبد دحان',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_76_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عسل خالد هاشم',
        'أنثى',
        '2014-01-01',
        'وفاء احمد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_77_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عكاب سامي مجباس',
        'ذكر',
        '2013-01-01',
        'حليمة خوام ناصر',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_78_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'علاء ميثاق رحيم',
        'ذكر',
        '2018-01-01',
        'انتصار فزع خلف',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_79_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'علي اثير جمال',
        'ذكر',
        '2013-01-01',
        'وفاء حسين علي',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_80_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'علي حامد حبيب',
        'ذكر',
        '2012-01-01',
        'انفال محمد',
        'العراق',
        'الطارمية',
        'سنوية'
    )
    RETURNING id INTO orphan_81_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'علي مالك حميد',
        'ذكر',
        '2014-01-01',
        'نسرين محمد',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_82_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عمار ياسر اسعد',
        'ذكر',
        '2020-01-01',
        'الاء نجيب خليف',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_83_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عيسى مصطفى محمد',
        'ذكر',
        '2014-01-01',
        'نبراس اسماعيل سلمان',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_84_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'غفران غافل عبدالله',
        'أنثى',
        '2012-01-01',
        'سعاد عواد خضير',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_85_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فاتن علي احمد',
        'أنثى',
        '2015-01-01',
        'هديل عويف',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_86_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فاطمة رائد احمد',
        'أنثى',
        '2015-01-01',
        'حنان سلام',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_87_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فرح علي حسين',
        'أنثى',
        '2015-01-01',
        'سهاد محمد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_88_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فهد خضر ستار',
        'ذكر',
        '2021-01-01',
        'اقبال حسن',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_89_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فوزية محمد طه',
        'أنثى',
        '2012-01-01',
        'ميراث احمد',
        'العراق',
        'الطارمية',
        'شهرية'
    )
    RETURNING id INTO orphan_90_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'قاسم احمد عبد',
        'ذكر',
        '2013-01-01',
        'بدراء عبد الستار رشيد',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_91_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'كرار محمد علي',
        'ذكر',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_92_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ليان علي عماد',
        'أنثى',
        '2016-01-01',
        'منى معد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_93_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ليث خالد سلومي',
        'ذكر',
        '2013-01-01',
        'سهى عدنان',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_94_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ليث عبدالكريم مناور',
        'ذكر',
        '2015-01-01',
        'سمر كريم يوسف',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_95_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ليث مهدي احمد',
        'ذكر',
        '2017-01-01',
        'فريال',
        'العراق',
        'الطارمية',
        'شهرية'
    )
    RETURNING id INTO orphan_96_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ماريا رياض احمد',
        'أنثى',
        '2017-01-01',
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_97_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ماريا محمد نصر',
        'أنثى',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_98_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مازن أسامة شاكر',
        'ذكر',
        '2013-01-01',
        'استبرق محمود',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_99_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد احمد شهاب',
        'ذكر',
        '2012-01-01',
        'اسماء رياض احمد',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_100_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد احمد كريم',
        'ذكر',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_101_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد حقي إسماعيل',
        'ذكر',
        '2013-01-01',
        'انتصار طالب علاوي',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_102_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد خالد هاشم',
        'ذكر',
        '2018-01-01',
        'وفاء احمد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_103_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد ضياء احمد',
        'ذكر',
        '2016-01-01',
        'نجوى محمد حمود',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_104_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد ضياء محمد',
        'ذكر',
        '2013-01-01',
        'أسماء ياس',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_105_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد عبدالله صالح',
        'ذكر',
        '2013-01-01',
        'سناء محمد',
        'العراق',
        'الطارمية',
        'سنوية'
    )
    RETURNING id INTO orphan_106_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد عبدالله كاظم',
        'ذكر',
        '2016-01-01',
        'أسماء طه',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_107_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد هلال علي',
        'ذكر',
        '2012-01-01',
        'هناء عودة',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_108_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مراد ناجي حسين',
        'ذكر',
        '2016-01-01',
        'ليلى رجب علاوي',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_109_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مريم احمد محمود',
        'أنثى',
        '2013-01-01',
        'امنة حسين',
        'العراق',
        'الطارمية',
        'سنوية'
    )
    RETURNING id INTO orphan_110_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مريم خيرالله ندى',
        'أنثى',
        '2019-01-01',
        'حمدية حسن شديد',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_111_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مصطفى حسين علاوي',
        'ذكر',
        '2012-01-01',
        'هدى هلال عواد',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_112_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مصطفى خضر سالم',
        'ذكر',
        '2013-01-01',
        'سوسن خالد محمد',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_113_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مصطفى غسان محمد',
        'ذكر',
        '2016-01-01',
        'ناعسه علي مطلق',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_114_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مصطفى فراس محمد',
        'ذكر',
        '2015-01-01',
        'مريم',
        'العراق',
        'الطارمية',
        'سنوية'
    )
    RETURNING id INTO orphan_115_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'منار احمد محمود',
        'ذكر',
        '2017-01-01',
        'امنة حسين',
        'العراق',
        'الطارمية',
        'سنوية'
    )
    RETURNING id INTO orphan_116_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'منتهى سامي مجباس',
        'أنثى',
        '2014-01-01',
        'حليمة خوام ناصر',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_117_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ميساء محمد سعدون',
        'أنثى',
        '2012-01-01',
        'شيماء احمد',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_118_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ميمونة علي احمد',
        'أنثى',
        '2012-01-01',
        'هديل عويف',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_119_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'نجم موسى حسين',
        'ذكر',
        '2017-01-01',
        'راوية علي',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_120_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'نصر محمد نصر',
        'ذكر',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_121_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'نصر مولود خالد',
        'ذكر',
        '2014-01-01',
        'حسينة حمادي حسين',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_122_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'نهى ابراهيم ناجي',
        'أنثى',
        '2016-01-01',
        'رغد عبد الله حمود',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_123_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'نور الخالق ياسين خضير',
        'ذكر',
        '2014-01-01',
        'اتور عباس',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_124_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'نور الصمد ياسين خضير',
        'ذكر',
        '2015-01-01',
        'اتور عباس',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_125_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'هاجر حسين علي',
        'أنثى',
        '2015-01-01',
        'شيماء محمود احمد',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_126_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'هبة يوسف عمر',
        'أنثى',
        '2014-01-01',
        'شيماء نوري فريح',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_127_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'هيثم يوسف عمر',
        'ذكر',
        '2012-01-01',
        'شيماء نوري فريح',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_128_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ولاء معن يوسف',
        'أنثى',
        '2016-01-01',
        'وسن عبدالرزاق',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_129_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ياسين سامي مجباس',
        'ذكر',
        '2016-01-01',
        'حليمة خوام ناصر',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_130_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يسار علاء إسماعيل',
        'ذكر',
        '2014-01-01',
        'سحر كريم',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_131_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يقين علي عبدالله',
        'أنثى',
        '2018-01-01',
        'عذراء شاكر محمد علي',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_132_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يقين محمد محمود',
        'أنثى',
        '2013-01-01',
        'ازهار سالم',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_133_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يقين ياس خضر',
        'أنثى',
        '2012-01-01',
        'عذراء عباس سعود',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_134_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يوسف أنور',
        'ذكر',
        '2012-01-01',
        'نور مبدر تايه',
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_135_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يوسف سلمان علي',
        'ذكر',
        '2012-01-01',
        'شيماء فالح',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_136_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يوسف عباس فاضل',
        'ذكر',
        NULL,
        NULL,
        'العراق',
        'اللطيفية',
        'سنوية'
    )
    RETURNING id INTO orphan_137_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يوسف مولود خالد',
        'ذكر',
        '2015-01-01',
        'حسينة حمادي حسين',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_138_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يوسف مؤيد بركات',
        'ذكر',
        '2014-01-01',
        'عائشة رحيم طعمة',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_139_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يوسف ميثاق رحيم',
        'ذكر',
        '2013-01-01',
        'انتصار فزع خلف',
        'العراق',
        'الفلوجة',
        'سنوية'
    )
    RETURNING id INTO orphan_140_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يوسف هيثم خضير',
        'ذكر',
        '2012-01-01',
        'براء عمر جسام',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_141_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ابا الحسن سعيد',
        'ذكر',
        '2016-01-01',
        'شيماء داود',
        'العراق',
        'بابل',
        'سنوية'
    )
    RETURNING id INTO orphan_142_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ابراهيم خيرالله ندا',
        'ذكر',
        '2022-01-01',
        'حميدة حسن',
        'العراق',
        'الفلوجة',
        'شهرية'
    )
    RETURNING id INTO orphan_143_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ابراهيم سهاد حامد',
        'ذكر',
        '2015-01-01',
        'هبة سلمان داود',
        'العراق',
        'بابل',
        'شهرية'
    )
    RETURNING id INTO orphan_144_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ابراهيم سهيل نجم الدين',
        'ذكر',
        '2011-01-01',
        'خالدة عبدالخالق نعمان',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_145_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ابراهيم عماد عبد',
        'ذكر',
        '2016-01-01',
        'عتاب خلف فرج',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_146_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'احمد جاسم محمد',
        'ذكر',
        '2015-01-01',
        'امنة هلال ابراهيم',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_147_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'احمد رائد صالح',
        'ذكر',
        '2012-01-01',
        'انوار اديب شريف',
        'العراق',
        'الموصل',
        'سنوية'
    )
    RETURNING id INTO orphan_148_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'احمد عماد عبد',
        'ذكر',
        '2014-01-01',
        'عتاب خلف فرج',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_149_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'احمد محمد احمد',
        'ذكر',
        '2012-01-01',
        'ناهدة علي',
        'العراق',
        'الطارمية',
        'شهرية'
    )
    RETURNING id INTO orphan_150_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'امال نزار صالح',
        'أنثى',
        '2017-01-01',
        'نسرين سلمان علي',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_151_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'اماني احمد منديل',
        'أنثى',
        '2013-01-01',
        'سميرة حسون صالح',
        'العراق',
        'كركوك',
        'شهرية'
    )
    RETURNING id INTO orphan_152_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'امنة رائد صالح',
        'أنثى',
        '2010-01-01',
        'انوار اديب شريف',
        'العراق',
        'الموصل',
        'سنوية'
    )
    RETURNING id INTO orphan_153_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'انس رائد صالح',
        'ذكر',
        '2014-01-01',
        'انوار اديب شريف',
        'العراق',
        'الموصل',
        'سنوية'
    )
    RETURNING id INTO orphan_154_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'انس عبدالرحمن يونس',
        'ذكر',
        '2012-01-01',
        'ازهار ناطق مشير',
        'العراق',
        'بابل',
        'شهرية'
    )
    RETURNING id INTO orphan_155_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'تقى شهاب احمد',
        'أنثى',
        '2013-01-01',
        'سمر الطيف',
        'العراق',
        'الموصل',
        'سنوية'
    )
    RETURNING id INTO orphan_156_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'حسن دلي حسن',
        'ذكر',
        '2014-01-01',
        'مشاعل عيدان ملبس',
        'العراق',
        'البصرة',
        'شهرية'
    )
    RETURNING id INTO orphan_157_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'جهاد كمال صباح',
        'ذكر',
        '2017-01-01',
        'رنا علي احمد',
        'العراق',
        'كركوك',
        'شهرية'
    )
    RETURNING id INTO orphan_158_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'حبيب مهدي احمد',
        'ذكر',
        '2013-01-01',
        'فريال فهد احمد',
        'العراق',
        'الطارمية',
        'سنوية'
    )
    RETURNING id INTO orphan_159_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'حسين دلي حسن',
        'ذكر',
        '2019-01-01',
        'مشاعل عيدان ملبس',
        'العراق',
        'البصرة',
        'شهرية'
    )
    RETURNING id INTO orphan_160_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'حمزة رائد منير',
        'ذكر',
        '2019-01-01',
        'هيام خليل',
        'العراق',
        'القائم',
        'سنوية'
    )
    RETURNING id INTO orphan_161_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'خالد طه احمد',
        'ذكر',
        '2013-01-01',
        'سراب علي حسين',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_162_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'دنيا عبدالله سلمان',
        'أنثى',
        '2011-01-01',
        'بيان عبد شطي',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_163_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رتاج رعد صبري',
        'أنثى',
        '2020-01-01',
        'تأثير الزمن معاذ يعقوب',
        'العراق',
        'البصرة',
        'شهرية'
    )
    RETURNING id INTO orphan_164_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رضا عبد الكريم حسين',
        'ذكر',
        '2018-01-01',
        'باسمة حميد عبدالكاظم',
        'العراق',
        'بابل',
        'شهرية'
    )
    RETURNING id INTO orphan_165_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رغد محمد ياسين',
        'أنثى',
        '2014-01-01',
        'عهود احمد علي',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_166_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رقية احمد عبدالسلام',
        'أنثى',
        '2018-01-01',
        'علياء طه رضا',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_167_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رقية شهاب احمد',
        'أنثى',
        '2011-01-01',
        'سمر الطيف',
        'العراق',
        'الموصل',
        'سنوية'
    )
    RETURNING id INTO orphan_168_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ريتاج احمد عبدالسلام',
        'أنثى',
        '2014-01-01',
        'علياء طه رضا',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_169_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'سدرة عماد عبد',
        'أنثى',
        '2018-01-01',
        'عتاب خلف فرج',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_170_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'سعد جاسم محمد',
        'ذكر',
        '2017-01-01',
        'امنة هلال ابراهيم',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_171_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'سفيان شجاع خلف',
        'ذكر',
        '2019-01-01',
        'رجوة خلف زعيان',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_172_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'سلمى سالم صبيح',
        'أنثى',
        '2014-01-01',
        'صالحه بديوي وادي',
        'العراق',
        'البصرة',
        'شهرية'
    )
    RETURNING id INTO orphan_173_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'سهى شهاب احمد',
        'أنثى',
        '2018-01-01',
        'سمر الطيف',
        'العراق',
        'الموصل',
        'سنوية'
    )
    RETURNING id INTO orphan_174_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'شيماء كمال صباح',
        'أنثى',
        '2015-01-01',
        'رنا علي احمد',
        'العراق',
        'كركوك',
        'شهرية'
    )
    RETURNING id INTO orphan_175_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'صابرين نزار صالح',
        'أنثى',
        '2014-01-01',
        'نسرين سلمان علي',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_176_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'صيده طه احمد',
        'أنثى',
        '2012-01-01',
        'سراب علي حسين',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_177_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ضحى سهيل نجم الدين',
        'أنثى',
        '2010-01-01',
        'خالدة عبدالخالق نعمان',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_178_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عباس احمد عبدالسلام',
        'ذكر',
        '2019-01-01',
        'علياء طه رضا',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_179_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عباس برهان منصور',
        'ذكر',
        '2016-01-01',
        'اشواق محسن عيدان',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_180_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالرحمن احمد منديل',
        'ذكر',
        '2010-01-01',
        'سميرة حسون صالح',
        'العراق',
        'كركوك',
        'نصف سنة'
    )
    RETURNING id INTO orphan_181_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالرحمن خالد احمد',
        'ذكر',
        '2014-01-01',
        'فوزية محمود عبدالله',
        'العراق',
        'كركوك',
        'نصف سنة'
    )
    RETURNING id INTO orphan_182_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ايات دلي حسن',
        'أنثى',
        '2016-01-01',
        'مشاعل عيدان ملبس',
        'العراق',
        'البصرة',
        'شهرية'
    )
    RETURNING id INTO orphan_183_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالرزاق احمد منديل',
        'ذكر',
        '2011-01-01',
        'سميرة حسون صالح',
        'العراق',
        'كركوك',
        'شهرية'
    )
    RETURNING id INTO orphan_184_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالله خالد احمد',
        'ذكر',
        '2014-01-01',
        'فوزية محمود عبدالله',
        'العراق',
        'كركوك',
        'شهرية'
    )
    RETURNING id INTO orphan_185_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالمؤمن احمد منديل',
        'ذكر',
        '2015-01-01',
        'سميرة حسون صالح',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_186_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عراك مناور حمد',
        'ذكر',
        '2014-01-01',
        'ديانة محمد حسن',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_187_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'علي عبدالمطلب خلف',
        'ذكر',
        '2017-01-01',
        'اية حسين فاضل',
        'العراق',
        'البصرة',
        'شهرية'
    )
    RETURNING id INTO orphan_188_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عمر رائد منير',
        'ذكر',
        '2014-01-01',
        'هيام خليل',
        'العراق',
        'القائم',
        'سنوية'
    )
    RETURNING id INTO orphan_189_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فارس شجاع خلف',
        'ذكر',
        '2015-01-01',
        'رجوة خلف زعيان',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_190_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فاطمة محمد جاسم',
        'أنثى',
        '2014-01-01',
        'صبيحة محمود حافظ',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_191_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فراس سالم صبيح',
        'ذكر',
        '2015-01-01',
        'صالحه بديوي وادي',
        'العراق',
        'البصرة',
        'شهرية'
    )
    RETURNING id INTO orphan_192_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فوزية مزهر محمود',
        'ذكر',
        '2015-01-01',
        'ازهار عبدالكريم حميد',
        'العراق',
        'الموصل',
        'سنوية'
    )
    RETURNING id INTO orphan_193_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'قمر ارزوقي غريب',
        'أنثى',
        '2014-01-01',
        'أسماء سالم',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_194_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ليان برهان منصور',
        'أنثى',
        '2013-01-01',
        'اشواق محسن عيدان',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_195_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محسن خالد عواد',
        'ذكر',
        '2013-01-01',
        'شيماء احمد صالح',
        'العراق',
        'البصرة',
        'سنوية'
    )
    RETURNING id INTO orphan_196_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد عبدالمطلب خلف',
        'ذكر',
        '2018-01-01',
        'اية حسين فاضل',
        'العراق',
        'البصرة',
        'شهرية'
    )
    RETURNING id INTO orphan_197_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد عزالدين',
        'ذكر',
        '2014-01-01',
        'اكرام بشار محمد',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_198_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مرتضى محمود عبدالوهاب',
        'ذكر',
        '2015-01-01',
        'شيماء عبد الله معتوق',
        'العراق',
        'البصرة',
        'سنوية'
    )
    RETURNING id INTO orphan_199_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مروان شجاع خلف',
        'ذكر',
        '2017-01-01',
        'رجوة خلف زعيان',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_200_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مروة عبدالله سلمان',
        'أنثى',
        '2012-01-01',
        'بيان عبد شطي',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_201_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مصطفى مزهر محمود',
        'ذكر',
        '2015-01-01',
        'ازهار عبدالكريم حميد',
        'العراق',
        'الموصل',
        'سنوية'
    )
    RETURNING id INTO orphan_202_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مصطفى مهدي احمد',
        'ذكر',
        '2014-01-01',
        'فريال فهد احمد',
        'العراق',
        'الطارمية',
        'شهرية'
    )
    RETURNING id INTO orphan_203_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'معاذ ناصر حسين',
        'ذكر',
        '2017-01-01',
        'رؤى جاسم',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_204_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ملاك نزار صالح',
        'أنثى',
        '2015-01-01',
        'نسرين سلمان علي',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_205_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'منديل احمد منديل',
        'ذكر',
        '2017-01-01',
        'سميرة حسون صالح',
        'العراق',
        'كركوك',
        'شهرية'
    )
    RETURNING id INTO orphan_206_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'موسى طه احمد',
        'ذكر',
        '2018-01-01',
        'سراب علي حسين',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_207_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مؤمل محمد جاسم',
        'ذكر',
        '2014-01-01',
        'صبيحة محمود حافظ',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_208_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'نجم الدين سهيل نجم الدين',
        'ذكر',
        '2021-01-01',
        'خالدة عبدالخالق نعمان',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_209_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'هيام رعد صبري',
        'أنثى',
        '2013-01-01',
        'تأثير الزمن معاذ يعقوب',
        'العراق',
        'البصرة',
        'شهرية'
    )
    RETURNING id INTO orphan_210_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'وسام برهان منصور',
        'ذكر',
        '2012-01-01',
        'اشواق محسن عيدان',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_211_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ياسر جاسم محمد',
        'ذكر',
        '2021-01-01',
        'امنة هلال ابراهيم',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_212_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يوسف جاسم محمد',
        'ذكر',
        '2024-01-01',
        'امنة هلال ابراهيم',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_213_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يوسف طه احمد',
        'ذكر',
        '2016-01-01',
        'سراب علي حسين',
        'العراق',
        'كركوك',
        'سنوية'
    )
    RETURNING id INTO orphan_214_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يوسف نبيل جاسم',
        'ذكر',
        '2016-01-01',
        'امال عبد الحسن',
        'العراق',
        'بابل',
        'شهرية'
    )
    RETURNING id INTO orphan_215_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالرحمن شداد عباس الجبوري',
        'ذكر',
        '2011-01-01',
        'هبة اسماعيل مهيدي',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_216_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'احمد ارحيم ابراهيم',
        'ذكر',
        '2012-01-01',
        'سهيلة رشيد مطلك',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_217_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'احمد عباس علي',
        'ذكر',
        '2011-01-01',
        'سهى خليل ابراهيم',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_218_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ازل محمد جبار',
        'أنثى',
        '2017-01-01',
        'انوار جميل عباس',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_219_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'جنى شداد عباس الجبوري',
        'أنثى',
        '2015-01-01',
        'هبة اسماعيل مهيدي',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_220_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'حسين رأفت كريم',
        'ذكر',
        '2014-01-01',
        'مروة سعدون علي',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_221_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'خبيب محمد مطر',
        'ذكر',
        '2013-01-01',
        'الهام شعبان ناصر',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_222_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'رزان عبدالله احمد',
        'أنثى',
        '2017-01-01',
        'نضال احمد عبيد',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_223_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'زينب عبدالله احمد',
        'أنثى',
        '2016-01-01',
        'نضال احمد عبيد',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_224_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'سارة عدنان خضير',
        'أنثى',
        '2014-01-01',
        'ذكرى عبد خلف',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_225_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'عبدالرحمن حميد صعب',
        'ذكر',
        '2014-01-01',
        'نوره رافع خشمان',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_226_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'علي صدام حسين',
        'ذكر',
        '2014-01-01',
        'منتهى خضير',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_227_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فاطمة شهاب احمد',
        'أنثى',
        '2017-01-01',
        'الهام حسين علوان',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_228_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'فاطمة طه ياسين',
        'أنثى',
        '2013-01-01',
        'رنا طارق كاظم',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_229_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'لارين فارس خليل',
        'أنثى',
        '2014-01-01',
        'شيماء حسين مكطوف',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_230_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ماريا رعد داود',
        'أنثى',
        '2017-01-01',
        'سعاد كمر شهاب',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_231_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد اسعد احمد',
        'ذكر',
        '2014-01-01',
        'حنين حمدي محمد',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_232_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'محمد بهاء صلاح',
        'ذكر',
        '2013-01-01',
        'ازهار داود نجم',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_233_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مراد رعد داود',
        'ذكر',
        '2011-01-01',
        'سعاد كمر شهاب',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_234_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مريم جارالله جاسم',
        'أنثى',
        '2013-01-01',
        'الهام دحام محمد',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_235_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'مريم محمد مطر',
        'أنثى',
        '2016-01-01',
        'الهام شعبان ناصر',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_236_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'نورس رعد داود',
        'أنثى',
        '2013-01-01',
        'سعاد كمر شهاب',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_237_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'يحيى عبدالله احمد',
        'ذكر',
        '2013-01-01',
        'نضال احمد عبيد',
        'العراق',
        'بغداد',
        'سنوية'
    )
    RETURNING id INTO orphan_238_id;

    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        'ابراهيم صدام حسين',
        'ذكر',
        '2011-01-01',
        'منتهى خضير',
        'العراق',
        'بغداد',
        'شهرية'
    )
    RETURNING id INTO orphan_239_id;

    RAISE NOTICE '  ✓ Created 239 orphan records';

    -- ============================================================================
    -- STEP 7: CREATE SPONSOR-ORPHAN RELATIONSHIPS
    -- ============================================================================
    RAISE NOTICE 'Creating sponsor-orphan relationships...';

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_1_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_2_id, orphan_2_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_3_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_4_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_5_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_6_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_7_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_5_id, orphan_8_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_6_id, orphan_9_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_7_id, orphan_10_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_11_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_12_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_8_id, orphan_13_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_9_id, orphan_14_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_10_id, orphan_15_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_11_id, orphan_16_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_7_id, orphan_17_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_12_id, orphan_18_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_5_id, orphan_19_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_13_id, orphan_20_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_12_id, orphan_21_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_22_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_23_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_14_id, orphan_24_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_15_id, orphan_25_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_26_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_16_id, orphan_27_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_17_id, orphan_28_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_29_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_18_id, orphan_30_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_19_id, orphan_31_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_32_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_33_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_34_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_7_id, orphan_35_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_36_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_37_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_38_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_39_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_40_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_20_id, orphan_41_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_21_id, orphan_42_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_43_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_22_id, orphan_44_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_23_id, orphan_45_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_46_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_47_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_24_id, orphan_48_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_49_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_50_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_25_id, orphan_51_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_21_id, orphan_52_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_26_id, orphan_53_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_54_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_55_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_27_id, orphan_56_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_57_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_2_id, orphan_58_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_28_id, orphan_59_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_60_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_61_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_26_id, orphan_62_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_29_id, orphan_63_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_19_id, orphan_64_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_9_id, orphan_65_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_66_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_20_id, orphan_67_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_68_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_30_id, orphan_69_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_31_id, orphan_70_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_71_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_20_id, orphan_72_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_32_id, orphan_73_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_74_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_33_id, orphan_75_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_34_id, orphan_76_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_77_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_78_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_79_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_14_id, orphan_80_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_35_id, orphan_81_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_36_id, orphan_82_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_83_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_37_id, orphan_84_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_38_id, orphan_85_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_86_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_87_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_88_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_16_id, orphan_89_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_7_id, orphan_90_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_91_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_92_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_93_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_19_id, orphan_94_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_39_id, orphan_95_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_40_id, orphan_96_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_19_id, orphan_97_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_98_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_99_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_41_id, orphan_100_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_101_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_102_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_103_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_25_id, orphan_104_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_105_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_42_id, orphan_106_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_2_id, orphan_107_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_43_id, orphan_108_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_109_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_110_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_20_id, orphan_111_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_44_id, orphan_112_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_113_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_26_id, orphan_114_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_45_id, orphan_115_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_43_id, orphan_116_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_117_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_118_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_119_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_46_id, orphan_120_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_121_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_122_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_47_id, orphan_123_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_48_id, orphan_124_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_19_id, orphan_125_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_49_id, orphan_126_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_50_id, orphan_127_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_9_id, orphan_128_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_51_id, orphan_129_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_130_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_131_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_46_id, orphan_132_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_133_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_52_id, orphan_134_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_19_id, orphan_135_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_136_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_2_id, orphan_137_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_138_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_16_id, orphan_139_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_140_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_29_id, orphan_141_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_49_id, orphan_142_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_20_id, orphan_143_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_53_id, orphan_144_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_54_id, orphan_145_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_55_id, orphan_146_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_23_id, orphan_147_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_148_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_56_id, orphan_149_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_57_id, orphan_150_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_58_id, orphan_151_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_21_id, orphan_152_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_153_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_154_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_20_id, orphan_155_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_156_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_59_id, orphan_157_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_40_id, orphan_158_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_60_id, orphan_159_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_61_id, orphan_160_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_19_id, orphan_161_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_62_id, orphan_162_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_63_id, orphan_163_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_64_id, orphan_164_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_65_id, orphan_165_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_55_id, orphan_166_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_13_id, orphan_167_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_168_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_13_id, orphan_169_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_55_id, orphan_170_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_23_id, orphan_171_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_13_id, orphan_172_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_59_id, orphan_173_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_4_id, orphan_174_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_66_id, orphan_175_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_54_id, orphan_176_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_62_id, orphan_177_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_54_id, orphan_178_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_13_id, orphan_179_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_67_id, orphan_180_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_68_id, orphan_181_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_68_id, orphan_182_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_59_id, orphan_183_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_40_id, orphan_184_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_40_id, orphan_185_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_2_id, orphan_186_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_63_id, orphan_187_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_21_id, orphan_188_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_19_id, orphan_189_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_19_id, orphan_190_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_69_id, orphan_191_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_59_id, orphan_192_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_193_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_1_id, orphan_194_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_70_id, orphan_195_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_27_id, orphan_196_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_21_id, orphan_197_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_49_id, orphan_198_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_71_id, orphan_199_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_19_id, orphan_200_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_72_id, orphan_201_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_3_id, orphan_202_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_7_id, orphan_203_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_49_id, orphan_204_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_54_id, orphan_205_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_21_id, orphan_206_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_62_id, orphan_207_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_73_id, orphan_208_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_74_id, orphan_209_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_75_id, orphan_210_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_76_id, orphan_211_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_77_id, orphan_212_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_77_id, orphan_213_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_78_id, orphan_214_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_79_id, orphan_215_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_80_id, orphan_216_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_81_id, orphan_217_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_82_id, orphan_218_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_82_id, orphan_219_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_83_id, orphan_220_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_84_id, orphan_221_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_82_id, orphan_222_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_85_id, orphan_223_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_86_id, orphan_224_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_82_id, orphan_225_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_82_id, orphan_226_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_84_id, orphan_227_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_87_id, orphan_228_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_84_id, orphan_229_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_82_id, orphan_230_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_88_id, orphan_231_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_89_id, orphan_232_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_90_id, orphan_233_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_91_id, orphan_234_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_92_id, orphan_235_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_93_id, orphan_236_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_90_id, orphan_237_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_90_id, orphan_238_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (sponsor_94_id, orphan_239_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    -- ============================================================================
    -- STEP 8: CREATE TEAM MEMBER-ORPHAN RELATIONSHIPS
    -- ============================================================================
    RAISE NOTICE 'Creating team member-orphan relationships...';

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_1_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_2_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_3_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_4_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_5_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_6_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_7_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_8_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_9_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_10_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_11_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_12_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_13_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_14_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_15_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_16_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_17_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_18_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_19_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_20_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_21_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_22_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_23_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_24_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_25_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_26_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_27_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_28_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_29_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_30_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_31_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_32_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_33_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_34_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_35_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_36_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_37_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_38_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_39_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_40_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_41_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_42_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_43_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_44_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_45_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_46_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_47_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_48_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_49_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_50_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_51_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_52_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_53_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_54_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_55_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_56_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_57_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_58_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_59_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_60_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_61_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_62_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_63_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_64_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_65_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_66_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_67_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_68_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_69_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_70_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_71_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_72_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_73_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_74_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_75_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_76_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_77_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_78_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_79_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_80_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_81_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_82_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_83_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_84_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_85_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_86_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_87_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_88_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_89_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_90_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_91_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_92_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_93_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_94_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_95_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_96_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_97_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_98_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_99_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_100_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_101_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_102_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_103_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_104_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_105_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_106_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_107_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_108_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_109_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_110_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_111_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_112_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_113_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_114_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_115_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_116_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_117_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_118_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_119_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_120_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_121_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_122_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_123_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_124_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_125_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_126_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_127_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_128_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_129_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_130_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_131_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_132_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_133_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_134_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_135_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_136_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_137_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_138_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_139_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_140_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_141_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_142_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_143_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_144_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_145_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_146_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_147_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_148_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_149_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_150_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_151_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_152_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_153_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_154_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_155_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_156_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_157_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_158_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_159_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_160_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_161_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_162_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_163_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_164_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_165_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_166_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_167_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_168_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_169_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_170_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_171_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_172_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_173_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_174_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_175_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_176_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_177_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_178_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_179_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_180_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_181_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_182_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_183_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_184_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_185_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_186_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_187_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_188_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_189_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_190_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_191_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_192_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_193_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_194_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_195_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_196_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_197_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_198_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_199_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_200_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_201_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_202_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_203_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_204_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_205_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_206_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_207_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_208_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_209_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_210_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_211_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_212_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_213_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_214_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_2_id, orphan_215_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_216_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_217_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_218_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_219_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_4_id, orphan_220_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_221_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_222_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_223_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_224_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_225_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_226_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_227_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_1_id, orphan_228_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_229_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_230_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_5_id, orphan_231_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_6_id, orphan_232_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_233_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_7_id, orphan_234_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_8_id, orphan_235_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_236_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_237_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_238_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (team_member_3_id, orphan_239_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    -- ============================================================================
    -- STEP 9: CREATE SPONSOR-TEAM MEMBER RELATIONSHIPS
    -- ============================================================================
    RAISE NOTICE 'Creating sponsor-team member relationships...';

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_1_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_2_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_3_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_4_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_5_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_6_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_7_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_8_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_9_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_10_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_11_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_12_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_13_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_14_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_15_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_16_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_17_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_18_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_19_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_20_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_21_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_22_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_23_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_24_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_25_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_26_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_27_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_28_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_29_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_30_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_31_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_32_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_33_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_34_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_35_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_36_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_37_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_38_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_39_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_40_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_41_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_42_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_43_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_44_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_45_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_46_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_47_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_48_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_49_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_50_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_51_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_52_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_53_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_54_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_55_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_56_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_57_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_58_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_59_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_60_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_61_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_62_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_63_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_64_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_65_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_66_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_67_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_68_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_69_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_70_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_71_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_72_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_73_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_74_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_75_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_76_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_77_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_78_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_79_id, team_member_2_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_80_id, team_member_3_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_81_id, team_member_3_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_82_id, team_member_3_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_83_id, team_member_4_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_84_id, team_member_3_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_85_id, team_member_3_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_86_id, team_member_3_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_87_id, team_member_1_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_88_id, team_member_5_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_89_id, team_member_6_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_90_id, team_member_3_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_91_id, team_member_7_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_92_id, team_member_8_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_93_id, team_member_3_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (sponsor_94_id, team_member_3_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    -- ============================================================================
    -- IMPORT COMPLETE
    -- ============================================================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Import completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Organization: منظمة فيء';
    RAISE NOTICE '  - Team Members: 8';
    RAISE NOTICE '  - Sponsors: 94';
    RAISE NOTICE '  - Orphans: 239';
    RAISE NOTICE '';
    
END $$;
