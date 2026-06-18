import { useEffect, useState } from 'react';
import { DEFAULT_EXAMS, examService } from '../services/examService';

export const useExamList = () => {
    const [exams, setExams] = useState<string[]>(DEFAULT_EXAMS);

    useEffect(() => {
        const unsubscribe = examService.subscribe((records) => {
            setExams(records.map(record => record.name));
        });

        return unsubscribe;
    }, []);

    return exams;
};
