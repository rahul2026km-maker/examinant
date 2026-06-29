import { useState } from 'react';
import { Check, Eye, AlertTriangle, AlertCircle, Calendar, Settings, BookOpen } from 'lucide-react';
import type { TestFormData } from '../../types/test.types';
import TestPreviewModal from './TestPreviewModal';

interface ReviewStepProps {
    formData: Partial<TestFormData>;
    updateFormData: (updates: Partial<TestFormData>) => void;
}

const ReviewStep = ({ formData }: ReviewStepProps) => {
    const [showPreview, setShowPreview] = useState(false);

    const isCustomAll = formData.generationType === 'custom' && formData.customConfig?.questionSelection === 'all';
    const isCustomSpecific = formData.generationType === 'custom' && formData.customConfig?.questionSelection === 'specific';


    let totalQ = formData.questionConfig?.totalQuestions || 0;
    if (isCustomSpecific) {
        totalQ = formData.customConfig?.selectedQuestionIds?.length || 0;
    }

    const marksPerQ = formData.settings?.marksPerQuestion || 0;
    const totalMarks = totalQ * marksPerQ;
    const duration = formData.settings?.duration || 0;
    const negMarks = formData.settings?.negativeMarking ?? -1;

    const mcqPercentage = formData.questionConfig?.mcqPercentage || 0;
    const numericalPercentage = formData.questionConfig?.numericalPercentage || 0;



    // MCQ and Numerical counts are derived from percentages regardless of mode
    const mcqCount = Math.round(mcqPercentage * totalQ / 100);
    const numCount = Math.round(numericalPercentage * totalQ / 100);

    const subjects = formData.autoConfig?.subjects || formData.customConfig?.subjects || [];

    // Edge-case warnings
    const warnings: string[] = [];
    if (!isCustomAll && totalQ < 5) warnings.push('Very few questions — consider adding more for a meaningful test.');
    if (!isCustomAll && totalQ > 300) warnings.push('Very high question count. Students may run out of time.');
    if (!isCustomAll && duration > 0 && totalQ > 0 && duration / totalQ < 0.5) {
        warnings.push(`Only ${(duration / totalQ).toFixed(1)} min per question — this may be too rushed.`);
    }
    if (negMarks > 0) warnings.push('Negative marking is positive — did you mean a negative value like -1?');
    if (!formData.name?.trim()) warnings.push('Test name is missing.');
    if (subjects.length === 0) warnings.push('No subjects selected for question generation.');

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Review & Publish</h2>
                    <p className="text-slate-500 text-sm">Verify all settings before publishing</p>
                </div>
                <button
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Eye size={18} />
                    Preview as Student
                </button>
            </div>

            {/* Edge-case warnings */}
            {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-amber-800">
                        <AlertTriangle size={16} />
                        Issues to review
                    </div>
                    <ul className="space-y-1">
                        {warnings.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                {w}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Test Info */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="text-green-600" size={14} />
                    </div>
                    Test Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-slate-500 text-xs mb-1">Test Name</p>
                        <p className="font-semibold text-slate-800">{formData.name || <span className="text-red-500">Not set</span>}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-slate-500 text-xs mb-1">Type</p>
                        <p className="font-semibold text-slate-800 capitalize">{formData.testType?.replace('_', ' ') || '—'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-slate-500 text-xs mb-1">Generation</p>
                        <p className="font-semibold text-slate-800">
                            {formData.generationType === 'auto' ? 'Auto (JEE Weightage)' : 'Custom Topic Selection'}
                        </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-slate-500 text-xs mb-1">Subjects</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {subjects.length > 0
                                ? subjects.map(s => (
                                    <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{s}</span>
                                ))
                                : <span className="text-red-500 text-xs">None selected</span>
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Config */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpen className="text-blue-600" size={14} />
                    </div>
                    Question Configuration
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-blue-600">{totalQ}</div>
                        <div className="text-xs text-slate-600 mt-1">Total Selected Questions</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-purple-600">{mcqCount}</div>
                        <div className="text-xs text-slate-600 mt-1">MCQ</div>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-pink-600">{numCount}</div>
                        <div className="text-xs text-slate-600 mt-1">Numerical</div>
                    </div>
                </div>
            </div>

            {/* Test Settings */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center">
                        <Settings className="text-slate-600" size={14} />
                    </div>
                    Test Settings
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                        { label: 'Duration', value: `${Math.floor(duration / 60)}h ${duration % 60}m` },
                        { label: 'Total Marks', value: <span className="text-green-600 font-bold">{totalMarks}</span> },
                        { label: 'Per Question', value: `+${marksPerQ} marks` },
                        { label: 'Negative Marking', value: <span className="text-red-600">{negMarks} marks</span> },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-slate-500 text-xs mb-1">{label}</p>
                            <p className="font-semibold text-slate-800">{value}</p>
                        </div>
                    ))}
                </div>
                {formData.settings?.enableSectionTimers && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs space-y-2 mt-2">
                        <span className="font-bold text-slate-700 block">Subject Durations:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {subjects.map(subject => (
                                <div key={subject} className="flex justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200">
                                    <span className="font-semibold text-slate-600">{subject}</span>
                                    <span className="font-bold text-blue-600">{formData.settings?.sectionDurations?.[subject] || 30}m</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex flex-wrap gap-2">
                    {formData.settings?.enableSectionTimers && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Subject Timers Enabled</span>}
                    {formData.settings?.allowReview && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Review Allowed</span>}
                    {formData.settings?.showSolutions && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Show Solutions</span>}
                    {formData.settings?.shuffleQuestions && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Shuffle Questions</span>}
                    {formData.settings?.shuffleOptions && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Shuffle Options</span>}
                </div>
            </div>

            {/* Schedule */}
            {formData.schedule?.isScheduled && (
                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center">
                            <Calendar className="text-orange-600" size={14} />
                        </div>
                        Schedule
                    </h3>
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                        Available from <strong>{formData.schedule.startDate?.toString()}</strong> to{' '}
                        <strong>{formData.schedule.endDate?.toString()}</strong>
                    </div>
                </div>
            )}

            {/* Ready to publish */}
            {warnings.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="text-green-600" size={18} />
                    </div>
                    <div>
                        <p className="font-semibold text-green-800">All checks passed</p>
                        <p className="text-green-700 text-sm">Your test is ready to publish or save as draft.</p>
                    </div>
                </div>
            )}

            {/* Publishing note */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Before publishing:</p>
                <ul className="list-disc list-inside space-y-0.5">
                    <li>Questions are auto-generated based on your configuration</li>
                    <li>Once published, students can access the test immediately</li>
                    <li>Save as draft to review and make changes later</li>
                </ul>
            </div>

            <TestPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                formData={formData}
            />
        </div>
    );
};

export default ReviewStep;
