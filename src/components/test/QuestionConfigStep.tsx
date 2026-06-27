import { useState, useEffect } from 'react';
import type { TestFormData } from '../../types/test.types';

interface QuestionConfigStepProps {
    formData: Partial<TestFormData>;
    updateFormData: (updates: Partial<TestFormData>) => void;
}

const QuestionConfigStep = ({ formData, updateFormData }: QuestionConfigStepProps) => {
    const getCalculatedQuestions = () => {
        if (formData.generationType !== 'custom') return null;
        if (formData.customConfig?.questionSelection === 'specific') {
            return formData.customConfig.selectedQuestionIds?.length || 0;
        } else {
            let totalChapters = 0;
            const chaptersMap = formData.customConfig?.selectedChapters || {};
            Object.values(chaptersMap).forEach(chapters => {
                totalChapters += chapters.length;
            });
            return totalChapters;
        }
    };

    const calculatedTotal = getCalculatedQuestions();
    const isCustom = formData.generationType === 'custom';

    useEffect(() => {
        if (isCustom && calculatedTotal !== null && calculatedTotal !== formData.questionConfig?.totalQuestions) {
            updateFormData({
                questionConfig: {
                    ...formData.questionConfig!,
                    totalQuestions: calculatedTotal > 0 ? calculatedTotal : 0
                }
            });
        }
    }, [isCustom, calculatedTotal, formData.questionConfig, updateFormData]);

    const [mcqPercentage, setMCQPercentage] = useState(formData.questionConfig?.mcqPercentage || 67);
    const totalQuestions = isCustom ? (calculatedTotal || 0) : (formData.questionConfig?.totalQuestions || 90);

    const handleMCQChange = (value: number) => {
        setMCQPercentage(value);
        updateFormData({
            questionConfig: {
                ...formData.questionConfig!,
                mcqPercentage: value,
                numericalPercentage: 100 - value
            }
        });
    };

    const mcqCount = Math.round((mcqPercentage / 100) * totalQuestions);
    const numericalCount = totalQuestions - mcqCount;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Question Configuration</h2>
                <p className="text-slate-500">Configure the distribution of questions</p>
            </div>

            {/* Total Questions (Hidden in Custom Mode) */}
            {!isCustom && (
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Total Questions
                    </label>
                    <input
                        type="number"
                        value={totalQuestions}
                        onChange={(e) => updateFormData({
                            questionConfig: {
                                ...formData.questionConfig!,
                                totalQuestions: Number(e.target.value)
                            }
                        })}
                        min="1"
                        max="300"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            )}

            {isCustom && (
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                        <h3 className="text-blue-800 font-semibold mb-2">Custom Generation Mode</h3>
                        <p className="text-blue-700 text-sm">
                            The question configuration is automatically determined based on your custom selections in the previous step.
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 animate-fade-in">
                        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3">Selection Summary</h3>
                        
                        <div>
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Selection Type</span>
                            <div className="mt-1 font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg inline-block text-sm">
                                {formData.customConfig?.questionSelection === 'specific' 
                                    ? 'Specific Manually Picked Questions' 
                                    : 'All Questions from Selected Chapters'}
                            </div>
                        </div>

                        {formData.customConfig?.questionSelection === 'specific' ? (
                            <div>
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-2">Selected Questions</span>
                                <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
                                    <span className="font-semibold text-slate-800 text-lg">
                                        {formData.customConfig.selectedQuestionIds?.length || 0} Questions Selected
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">Selected Subjects & Chapters</span>
                                {formData.customConfig?.subjects?.map(subject => {
                                    const chapters = formData.customConfig?.selectedChapters?.[subject] || [];
                                    return (
                                        <div key={subject} className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-800">{subject}</span>
                                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                                    {chapters.length} Chapters Selected
                                                </span>
                                            </div>
                                            {chapters.length > 0 ? (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {chapters.map(ch => (
                                                        <span key={ch} className="bg-white border border-slate-200 text-xs px-2.5 py-1 rounded text-slate-600 font-medium">
                                                            {ch}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-amber-600 font-medium">No chapters selected. Click "Back" to select chapters.</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MCQ/Numerical Split */}
            {!isCustom && (
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-4">
                        MCQ / Numerical Distribution
                    </label>

                    <div className="space-y-4">
                        {/* MCQ Slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">MCQ Questions</span>
                                <span className="text-sm font-bold text-blue-600">
                                    {mcqCount} ({mcqPercentage}%)
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={mcqPercentage}
                                onChange={(e) => handleMCQChange(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        {/* Numerical Display */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">Numerical Questions</span>
                                <span className="text-sm font-bold text-purple-600">
                                    {numericalCount} ({100 - mcqPercentage}%)
                                </span>
                            </div>
                            <div className="w-full h-2 bg-purple-200 rounded-lg"></div>
                        </div>

                        {/* Visual Bar */}
                        <div className="flex h-12 rounded-lg overflow-hidden border border-slate-300">
                            <div
                                style={{ width: `${mcqPercentage}%` }}
                                className="bg-blue-500 flex items-center justify-center text-white font-semibold text-sm"
                            >
                                {mcqCount > 0 && `${mcqCount} MCQ`}
                            </div>
                            <div
                                style={{ width: `${100 - mcqPercentage}%` }}
                                className="bg-purple-500 flex items-center justify-center text-white font-semibold text-sm"
                            >
                                {numericalCount > 0 && `${numericalCount} Numerical`}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Card */}
            {!isCustom && (
                <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                    <h3 className="font-bold text-slate-800">Configuration Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg">
                            <div className="text-2xl font-bold text-slate-800">{totalQuestions}</div>
                            <div className="text-sm text-slate-500">Total Questions</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{mcqCount}</div>
                            <div className="text-sm text-slate-500">MCQ Questions</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{numericalCount}</div>
                            <div className="text-sm text-slate-500">Numerical</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionConfigStep;
