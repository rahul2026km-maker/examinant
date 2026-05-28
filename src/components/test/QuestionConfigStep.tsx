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
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
                    <p className="text-blue-700 font-medium">
                        The question configuration will be automatically determined based on the chapters and questions you selected in the previous step.
                    </p>
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
