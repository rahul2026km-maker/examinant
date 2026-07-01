import { useState, useEffect } from 'react';
import type { TestFormData } from '../../types/test.types';
import { Zap, Sliders, Search } from 'lucide-react';
import QuestionPicker from './QuestionPicker';
import { useSubjectList } from '../../hooks/useSubjectList';

interface GenerationMethodStepProps {
    formData: Partial<TestFormData>;
    updateFormData: (updates: Partial<TestFormData>) => void;
}

const GenerationMethodStep = ({ formData, updateFormData }: GenerationMethodStepProps) => {
    // State for selected subjects (custom or auto)
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
        formData.autoConfig?.subjects || formData.customConfig?.subjects || []
    );
    const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
    const availableSubjects = useSubjectList();

    // Synchronize selected subjects whenever generationType or selectedSubjects list changes
    useEffect(() => {
        if (formData.generationType === 'auto') {
            const questionsPerSubject = formData.questionConfig?.totalQuestions
                ? Math.floor(formData.questionConfig.totalQuestions / Math.max(selectedSubjects.length, 1))
                : 30;

            const currentAutoSubjects = formData.autoConfig?.subjects || [];
            const isMatch = currentAutoSubjects.length === selectedSubjects.length &&
                currentAutoSubjects.every(s => selectedSubjects.includes(s));

            if (!isMatch) {
                updateFormData({
                    autoConfig: {
                        subjects: selectedSubjects as any,
                        totalQuestions: formData.questionConfig?.totalQuestions || 90,
                        questionsPerSubject,
                        useWeightage: true
                    }
                });
            }
        } else {
            const currentCustomSubjects = formData.customConfig?.subjects || [];
            const isMatch = currentCustomSubjects.length === selectedSubjects.length &&
                currentCustomSubjects.every(s => selectedSubjects.includes(s));

            if (!isMatch || formData.customConfig?.questionSelection !== 'specific') {
                updateFormData({
                    customConfig: {
                        ...formData.customConfig,
                        subjects: selectedSubjects,
                        selectedUnits: formData.customConfig?.selectedUnits || {},
                        selectedChapters: formData.customConfig?.selectedChapters || {},
                        selectedTopics: formData.customConfig?.selectedTopics || {},
                        questionSelection: 'specific'
                    }
                });
            }
        }
    }, [formData.generationType, selectedSubjects]);

    useEffect(() => {
        if (availableSubjects.length === 0) {
            return;
        }

        const validSubjects = selectedSubjects.filter(subject => availableSubjects.includes(subject));
        if (validSubjects.length !== selectedSubjects.length) {
            setSelectedSubjects(validSubjects);
        }
    }, [availableSubjects]);

    const toggleSubject = (subject: string) => {
        const updated = selectedSubjects.includes(subject)
            ? selectedSubjects.filter(s => s !== subject)
            : [...selectedSubjects, subject];
        setSelectedSubjects(updated);
    };

    const renderCustomSelectionUI = () => {
        if (selectedSubjects.length === 0) return null;

        return (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6 shadow-sm">
                <div className="p-4 text-center py-8">
                    <div className="mb-4 text-slate-500">
                        You have selected {formData.customConfig?.selectedQuestionIds?.length || 0} specific questions.
                    </div>
                    <button
                        onClick={() => setIsQuestionPickerOpen(true)}
                        className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md"
                    >
                        <Search size={20} /> Open Question Picker
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Question Generation Method</h2>
                <p className="text-slate-500">Choose how you want to generate questions for this test</p>
            </div>

            {/* Generation Method Selection */}
            <div className="grid grid-cols-2 gap-6">
                <label
                    className={`flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all ${formData.generationType === 'auto'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                        }`}
                >
                    <input
                        type="radio"
                        name="generationType"
                        value="auto"
                        checked={formData.generationType === 'auto'}
                        onChange={() => updateFormData({ generationType: 'auto' })}
                        className="sr-only"
                    />
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Zap className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Auto Generate</h3>
                            <p className="text-xs text-slate-500">Based on JEE weightage</p>
                        </div>
                    </div>
                </label>

                <label
                    className={`flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all ${formData.generationType === 'custom'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                        }`}
                >
                    <input
                        type="radio"
                        name="generationType"
                        value="custom"
                        checked={formData.generationType === 'custom'}
                        onChange={() => updateFormData({ generationType: 'custom' })}
                        className="sr-only"
                    />
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Sliders className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Custom Topics</h3>
                            <p className="text-xs text-slate-500">Manual selection</p>
                        </div>
                    </div>
                </label>
            </div>

            {/* Subject Selection */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Select Subjects *
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {availableSubjects.map((subject) => (
                        <label
                            key={subject}
                            className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedSubjects.includes(subject)
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedSubjects.includes(subject)}
                                onChange={() => toggleSubject(subject)}
                                className="sr-only"
                            />
                            <span className="font-semibold text-slate-800">{subject}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Auto Generate Configuration */}
            {formData.generationType === 'auto' && selectedSubjects.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-slate-800">Auto-Generation Preview</h3>
                    <div className="space-y-3">
                        {selectedSubjects.map((subject) => (
                            <div key={subject} className="flex justify-between items-center bg-white p-3 rounded-lg">
                                <span className="font-semibold text-slate-700">{subject}</span>
                                <span className="text-blue-600 font-bold">
                                    {formData.autoConfig?.questionsPerSubject || 30} questions
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Custom Configuration UI */}
            {formData.generationType === 'custom' && selectedSubjects.length > 0 && renderCustomSelectionUI()}

            {/* Question Picker Modal */}
            <QuestionPicker
                isOpen={isQuestionPickerOpen}
                onClose={() => setIsQuestionPickerOpen(false)}
                subjects={selectedSubjects}
                initialSelected={formData.customConfig?.selectedQuestionIds || []}
                onSelect={(ids) => updateFormData({
                    customConfig: {
                        ...formData.customConfig!,
                        selectedQuestionIds: ids,
                        questionSelection: 'specific'
                    }
                })}
            />
        </div>
    );
};

export default GenerationMethodStep;
