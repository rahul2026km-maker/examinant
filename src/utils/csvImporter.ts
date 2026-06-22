import Papa from 'papaparse';
import { collection, addDoc, serverTimestamp, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

// ========== TYPES ==========

export interface ChapterCSVRow {
    name: string;
    subject: string;
    unit: string;
    description: string;
    topics: string;
    difficulty: string;
    status: string;
}

export interface QuestionCSVRow {
    text: string;
    textHindi?: string;
    subject: string;
    chapter: string;
    unit?: string;
    exam?: string;
    examCategory?: string;
    topic: string;
    type: string;
    difficulty: string;
    marks: string;
    negativeMarks: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    optionAHindi?: string;
    optionBHindi?: string;
    optionCHindi?: string;
    optionDHindi?: string;
    correctAnswer: string;
    explanation: string;
    explanationHindi?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[]; // New field for non-blocking warnings
    isDuplicate?: boolean;
}

export interface ParsedData<T> {
    data: T[];
    errors: any[];
}
// ========== HELPERS ==========

export const getRowValue = (row: any, possibleKeys: string[]): any => {
    if (!row || typeof row !== 'object') return undefined;
    
    // Normalize possible search keys by removing non-alphanumeric characters and lowercase
    const normalizedSearches = possibleKeys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    for (const key of Object.keys(row)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedSearches.includes(normalizedKey)) {
            return row[key];
        }
    }
    return undefined;
};

export const normalizeCorrectAnswer = (answer: any): string => {
    if (answer === undefined || answer === null) return '';
    const trimmed = String(answer).trim().toLowerCase();
    
    // Exact matches
    if (trimmed === 'a' || trimmed === '1' || trimmed === 'option a' || trimmed === 'option_a') return '0';
    if (trimmed === 'b' || trimmed === '2' || trimmed === 'option b' || trimmed === 'option_b') return '1';
    if (trimmed === 'c' || trimmed === '3' || trimmed === 'option c' || trimmed === 'option_c') return '2';
    if (trimmed === 'd' || trimmed === '4' || trimmed === 'option d' || trimmed === 'option_d') return '3';
    
    // Ends with A/B/C/D after space
    if (trimmed.endsWith(' a')) return '0';
    if (trimmed.endsWith(' b')) return '1';
    if (trimmed.endsWith(' c')) return '2';
    if (trimmed.endsWith(' d')) return '3';
    
    return String(answer).trim();
};
// ========== CSV PARSERS ==========

export const parseChaptersCSV = (file: File): Promise<ParsedData<ChapterCSVRow>> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve({
                    data: results.data as ChapterCSVRow[],
                    errors: results.errors
                });
            },
            error: (error) => reject(error)
        });
    });
};

export const parseQuestionsCSV = (file: File): Promise<ParsedData<QuestionCSVRow>> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve({
                    data: results.data as QuestionCSVRow[],
                    errors: results.errors
                });
            },
            error: (error) => reject(error)
        });
    });
};

// ========== VALIDATORS ==========

export const validateChapter = async (row: ChapterCSVRow, index: number, allowedSubjects?: string[]): Promise<ValidationResult> => {
    const errors: string[] = [];

    // Required fields
    if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${index + 1}: Chapter name is required`);
    }

    const defaultSubs = allowedSubjects || ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    if (!row.subject || row.subject.trim() === '') {
        errors.push(`Row ${index + 1}: Subject is required`);
    } else if (!defaultSubs.includes(row.subject)) {
        errors.push(`Row ${index + 1}: Subject '${row.subject}' is not registered yet (click 'Auto-Create Registry' on the right)`);
    }

    if (!row.description || row.description.trim() === '') {
        errors.push(`Row ${index + 1}: Description is required`);
    }

    if (!row.topics || row.topics.trim() === '') {
        errors.push(`Row ${index + 1}: Topics are required`);
    }

    // Optional fields with validation
    if (row.difficulty && !['Easy', 'Medium', 'Hard'].includes(row.difficulty)) {
        errors.push(`Row ${index + 1}: Difficulty must be Easy, Medium, or Hard`);
    }

    if (row.status && !['active', 'draft', 'archived'].includes(row.status)) {
        errors.push(`Row ${index + 1}: Status must be active, draft, or archived`);
    }

    // Check for duplicates if basic validation passed
    let isDuplicate = false;
    if (errors.length === 0 && row.name && row.subject) {
        try {
            const duplicateQuery = query(
                collection(db, 'chapters'),
                where('name', '==', row.name.trim()),
                where('subject', '==', row.subject.trim())
            );
            const snapshot = await getDocs(duplicateQuery);
            if (!snapshot.empty) {
                isDuplicate = true;
                errors.push(`Row ${index + 1}: Duplicate - Chapter "${row.name}" already exists for ${row.subject}`);
            }
        } catch (error) {
            console.error('Error checking for duplicates:', error);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        isDuplicate
    };
};

export const validateQuestion = async (
    row: QuestionCSVRow,
    index: number,
    allowedSubjects?: string[],
    existingKeysSet?: Set<string>
): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Trim all inputs and resolve fields safely using helper
    const text = String(getRowValue(row, ['text', 'question', 'questionText', 'question_text', 'textEnglish', 'text_english']) || '').trim();
    let subject = String(getRowValue(row, ['subject', 'sub']) || '').trim();
    const chapter = String(getRowValue(row, ['chapter', 'chap']) || '').trim();
    const topic = String(getRowValue(row, ['topic']) || '').trim();
    const type = String(getRowValue(row, ['type']) || '').trim();
    const difficulty = String(getRowValue(row, ['difficulty', 'diff']) || '').trim();
    const marks = String(getRowValue(row, ['marks', 'mark']) || '').trim();
    
    const answerField = getRowValue(row, ['correctAnswer', 'correctOp', 'correctOption', 'correct_answer', 'correct_option', 'answer', 'correct']);
    const rawAnswer = answerField !== undefined && answerField !== null ? String(answerField).trim() : '';
    const correctAnswer = type === 'MCQ' ? normalizeCorrectAnswer(rawAnswer) : rawAnswer;

    // Normalize subject (Capitalize first letter)
    if (subject.toLowerCase() === 'physics') subject = 'Physics';
    if (subject.toLowerCase() === 'chemistry') subject = 'Chemistry';
    if (subject.toLowerCase() === 'mathematics' || subject.toLowerCase() === 'maths') subject = 'Mathematics';
    if (subject.toLowerCase() === 'biology') subject = 'Biology';

    // Required fields
    if (!text) {
        errors.push(`Row ${index + 1}: Question text is required`);
    }

    if (rawAnswer === '') {
        errors.push(`Row ${index + 1}: Correct answer is required`);
    }

    const defaultSubs = allowedSubjects || ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    if (!subject) {
        errors.push(`Row ${index + 1}: Subject is required`);
    } else if (!defaultSubs.includes(subject)) {
        errors.push(`Row ${index + 1}: Subject '${subject}' is not registered yet (click 'Auto-Create Registry' on the right)`);
    }

    if (!chapter) {
        errors.push(`Row ${index + 1}: Chapter is required`);
    }

    if (!topic) {
        errors.push(`Row ${index + 1}: Topic is required`);
    }

    if (!['MCQ', 'Numerical'].includes(type)) {
        errors.push(`Row ${index + 1}: Type must be MCQ or Numerical`);
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        errors.push(`Row ${index + 1}: Difficulty must be Easy, Medium, or Hard`);
    }

    if (!marks || isNaN(Number(marks)) || Number(marks) <= 0) {
        errors.push(`Row ${index + 1}: Marks must be a positive number`);
    }

    // Type-specific validation
    if (type === 'MCQ') {
        const optA = String(getRowValue(row, ['optionA', 'optA', 'option_A', 'opt_A', 'A']) || '').trim();
        const optB = String(getRowValue(row, ['optionB', 'optB', 'option_B', 'opt_B', 'B']) || '').trim();
        const optC = String(getRowValue(row, ['optionC', 'optC', 'option_C', 'opt_C', 'C']) || '').trim();
        const optD = String(getRowValue(row, ['optionD', 'optD', 'option_D', 'opt_D', 'D']) || '').trim();

        if (!optA || !optB || !optC || !optD) {
            errors.push(`Row ${index + 1}: MCQ questions must have all 4 options`);
        }

        const correctAns = Number(correctAnswer);
        if (isNaN(correctAns) || correctAns < 0 || correctAns > 3) {
            errors.push(`Row ${index + 1}: MCQ correctAnswer must be 0, 1, 2, or 3 (index of the correct option)`);
        }
    }

    if (type === 'Numerical') {
        if (isNaN(Number(correctAnswer))) {
            errors.push(`Row ${index + 1}: Numerical correctAnswer must be a number`);
        }
    }

    // Verify chapter exists (Soft validation - now a warning)
    if (errors.length === 0 && chapter && subject) {
        try {
            const chaptersQuery = query(
                collection(db, 'chapters'),
                where('name', '==', chapter),
                where('subject', '==', subject)
            );
            const snapshot = await getDocs(chaptersQuery);

            if (snapshot.empty) {
                warnings.push(`Row ${index + 1}: Chapter "${chapter}" not found in system. It will be added as a text label.`);
            } else {
                // Verify topic exists in chapter
                const chapterData = snapshot.docs[0].data();
                const topics = chapterData.topics || [];
                if (!topics.includes(topic)) {
                    warnings.push(`Row ${index + 1}: Topic "${topic}" not found in chapter "${chapter}".`);
                }
            }
        } catch (error) {
            console.error('Error verifying chapter:', error);
        }
    }

    // Check for duplicate questions
    let isDuplicate = false;
    if (errors.length === 0 && text && subject) {
        if (existingKeysSet) {
            const key = `${text.toLowerCase()}|${subject.toLowerCase()}`;
            if (existingKeysSet.has(key)) {
                isDuplicate = true;
                errors.push(`Row ${index + 1}: Duplicate - Question already exists`);
            }
        } else {
            try {
                const duplicateQuery = query(
                    collection(db, 'questions'),
                    where('text', '==', text),
                    where('subject', '==', subject)
                );
                const snapshot = await getDocs(duplicateQuery);
                if (!snapshot.empty) {
                    isDuplicate = true;
                    errors.push(`Row ${index + 1}: Duplicate - Question already exists`);
                }
            } catch (error) {
                console.error('Error checking for duplicate questions:', error);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        isDuplicate
    };
};

// ========== BATCH UPLOADERS ==========

export const batchUploadChapters = async (
    rows: ChapterCSVRow[],
    onProgress: (progress: number, current: number, total: number) => void
): Promise<{ success: number; failed: number; skipped: number }> => {
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
        try {
            // Check if already exists before uploading
            const duplicateQuery = query(
                collection(db, 'chapters'),
                where('name', '==', rows[i].name.trim()),
                where('subject', '==', rows[i].subject.trim())
            );
            const snapshot = await getDocs(duplicateQuery);

            if (!snapshot.empty) {
                console.log(`Skipping duplicate chapter: ${rows[i].name}`);
                skipped++;
            } else {
                const chapterData = {
                    name: rows[i].name.trim(),
                    subject: rows[i].subject.trim(),
                    unit: rows[i].unit?.trim() || '',
                    description: rows[i].description.trim(),
                    topics: rows[i].topics.split('|').map(t => t.trim()).filter(t => t),
                    difficulty: rows[i].difficulty?.trim() || 'Medium',
                    status: rows[i].status?.trim() || 'active',
                    createdAt: serverTimestamp()
                };

                await addDoc(collection(db, 'chapters'), chapterData);
                success++;
            }
        } catch (error) {
            console.error(`Error uploading chapter ${rows[i].name}:`, error);
            failed++;
        }

        onProgress(((i + 1) / rows.length) * 100, i + 1, rows.length);
    }

    return { success, failed, skipped };
};

export const batchUploadQuestions = async (
    rows: QuestionCSVRow[],
    onProgress: (progress: number, current: number, total: number) => void,
    existingKeysSet?: Set<string>
): Promise<{ success: number; failed: number; skipped: number }> => {
    let success = 0;
    let failed = 0;
    let skipped = 0;

    const batchSize = 100; // Write in batches of 100
    const localUploadedKeys = new Set<string>();

    for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const batch = writeBatch(db);
        let batchCount = 0;

        for (const row of chunk) {
            try {
                // Normalize subject
                let subject = String(getRowValue(row, ['subject', 'sub']) || '').trim();
                if (subject.toLowerCase() === 'physics') subject = 'Physics';
                if (subject.toLowerCase() === 'chemistry') subject = 'Chemistry';
                if (subject.toLowerCase() === 'mathematics' || subject.toLowerCase() === 'maths') subject = 'Mathematics';
                if (subject.toLowerCase() === 'biology') subject = 'Biology';

                const text = String(getRowValue(row, ['text', 'question', 'questionText', 'question_text', 'textEnglish', 'text_english']) || '').trim();
                const key = `${text.toLowerCase()}|${subject.toLowerCase()}`;

                // Check duplicate against existing + current batch
                const isDuplicate = (existingKeysSet && existingKeysSet.has(key)) || localUploadedKeys.has(key);

                if (isDuplicate) {
                    console.log(`Skipping duplicate question`);
                    skipped++;
                } else {
                    localUploadedKeys.add(key);

                    const rawNegMarks = getRowValue(row, ['negativeMarks', 'negativeM', 'negative_marks', 'negative_mark', 'negativeMark', 'negative']);
                    const answerField = getRowValue(row, ['correctAnswer', 'correctOp', 'correctOption', 'correct_answer', 'correct_option', 'answer', 'correct']);

                    const rowType = String(getRowValue(row, ['type']) || '').trim();
                    const examCategory = String(getRowValue(row, ['exam', 'examCategory', 'exam_category']) || '').trim() || 'General';
                    const unit = String(getRowValue(row, ['unit']) || '').trim();

                    const questionData: any = {
                        text: text,
                        textHindi: String(getRowValue(row, ['textHindi', 'questionHindi', 'question_hindi', 'text_hindi']) || '').trim(),
                        subject: subject,
                        chapter: String(getRowValue(row, ['chapter', 'chap']) || '').trim(),
                        unit: unit,
                        topic: String(getRowValue(row, ['topic']) || '').trim(),
                        examCategory: examCategory,
                        type: rowType,
                        difficulty: String(getRowValue(row, ['difficulty', 'diff']) || '').trim(),
                        marks: Number(getRowValue(row, ['marks', 'mark']) || 0),
                        negativeMarks: rawNegMarks !== undefined && rawNegMarks !== '' ? Number(rawNegMarks) : (rowType === 'MCQ' ? -1 : 0),
                        explanation: String(getRowValue(row, ['explanation', 'exp']) || '').trim(),
                        explanationHindi: String(getRowValue(row, ['explanationHindi', 'explanation_hindi', 'exp_hindi']) || '').trim(),
                        createdAt: serverTimestamp()
                    };

                    if (rowType === 'MCQ') {
                        questionData.options = [
                            String(getRowValue(row, ['optionA', 'optA', 'option_A', 'opt_A', 'A']) || '').trim(),
                            String(getRowValue(row, ['optionB', 'optB', 'option_B', 'opt_B', 'B']) || '').trim(),
                            String(getRowValue(row, ['optionC', 'optC', 'option_C', 'opt_C', 'C']) || '').trim(),
                            String(getRowValue(row, ['optionD', 'optD', 'option_D', 'opt_D', 'D']) || '').trim()
                        ];
                        questionData.optionsHindi = [
                            String(getRowValue(row, ['optionAHindi', 'optionA_Hindi', 'optionA_hindi', 'optAHindi', 'AHindi']) || '').trim(),
                            String(getRowValue(row, ['optionBHindi', 'optionB_Hindi', 'optionB_hindi', 'optBHindi', 'BHindi']) || '').trim(),
                            String(getRowValue(row, ['optionCHindi', 'optionC_Hindi', 'optionC_hindi', 'optCHindi', 'CHindi']) || '').trim(),
                            String(getRowValue(row, ['optionDHindi', 'optionD_Hindi', 'optionD_hindi', 'optDHindi', 'DHindi']) || '').trim()
                        ];
                        questionData.correctAnswer = Number(normalizeCorrectAnswer(answerField));
                    } else {
                        questionData.options = [];
                        questionData.optionsHindi = [];
                        questionData.correctAnswer = answerField !== undefined && answerField !== null ? String(answerField).trim() : '';
                    }

                    // Create new document reference in 'questions' collection
                    const newDocRef = doc(collection(db, 'questions'));
                    batch.set(newDocRef, questionData);
                    batchCount++;
                }
            } catch (rowError) {
                console.error(`Error preparation for uploading question:`, rowError);
                failed++;
            }
        }

        if (batchCount > 0) {
            try {
                await batch.commit();
                success += batchCount;
            } catch (batchError) {
                console.error(`Error committing batch upload:`, batchError);
                failed += batchCount;
            }
        }

        const currentCompleted = Math.min(i + batchSize, rows.length);
        onProgress((currentCompleted / rows.length) * 100, currentCompleted, rows.length);
    }

    return { success, failed, skipped };
};

// ========== DOWNLOAD TEMPLATE ==========

export const downloadTemplate = (type: 'chapters' | 'questions') => {
    const url = `/templates/${type}_template.csv`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
