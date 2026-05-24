import type { OMRTestFormData, OMRSection } from '../../types/omr.types';
import { CheckCircle, Clock, FileText, KeyRound, Layers } from 'lucide-react';

interface OMRReviewStepProps {
    formData: Partial<OMRTestFormData>;
    updateFormData: (updates: Partial<OMRTestFormData>) => void;
}


const OMRReviewStep = ({ formData }: OMRReviewStepProps) => {
    const sections: OMRSection[] = (formData.omrTemplate?.sections as OMRSection[]) || [];
    const mappings = formData.questionMappings || [];
    const totalQ = formData.omrTemplate?.totalQuestions || 0;
    const totalMarks = sections.reduce((sum, s) => sum + s.questionCount * s.marksCorrect, 0);
    const filledKeys = mappings.filter((m) => m.correctOption).length;

    const summaryItems = [
        { icon: FileText, label: 'Test Name', value: formData.name || '—', color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: Clock, label: 'Duration', value: `${formData.settings?.duration || 180} minutes`, color: 'text-green-600', bg: 'bg-green-50' },
        { icon: Layers, label: 'Total Questions', value: totalQ, color: 'text-purple-600', bg: 'bg-purple-50' },
        { icon: CheckCircle, label: 'Total Marks', value: totalMarks, color: 'text-amber-600', bg: 'bg-amber-50' },
        { icon: KeyRound, label: 'Answer Keys Filled', value: `${filledKeys} / ${totalQ}`, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Review & Publish</h2>
                <p className="text-slate-500 text-sm">Review your OMR test configuration before publishing</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {summaryItems.map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-xl p-4 flex items-start gap-3`}>
                        <Icon size={20} className={`${color} mt-0.5 flex-shrink-0`} />
                        <div>
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className={`font-bold ${color} text-sm mt-0.5`}>{String(value)}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Exam Pattern */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">
                    <Layers size={16} className="text-amber-500" /> Section-wise Breakdown
                </h3>
                <div className="space-y-3">
                    {sections.map((sec, si) => {
                        const secMappings = mappings.filter(
                            (m) => m.serialNumber >= sec.questionStartIndex && m.serialNumber <= sec.questionEndIndex
                        );
                        const filledInSec = secMappings.filter((m) => m.correctOption).length;
                        const isNumerical = sec.optionsPerQuestion === 0;

                        return (
                            <div key={sec.id || sec.name || si} className="bg-white rounded-lg border border-slate-200 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-slate-800">{sec.name}</p>
                                        <p className="text-xs text-slate-500">
                                            Q{sec.questionStartIndex}–Q{sec.questionEndIndex} • {isNumerical ? 'Numerical' : `MCQ (${sec.optionsPerQuestion} opts)`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-green-600">+{sec.marksCorrect} correct</p>
                                        <p className="text-xs font-bold text-red-500">{sec.marksWrong} wrong</p>
                                    </div>
                                </div>

                                {/* Answer Key preview (first 10) */}
                                <div className="flex flex-wrap gap-2">
                                    {secMappings.slice(0, 15).map((m) => (
                                        <div key={m.serialNumber} className="flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] text-slate-400 font-mono">Q{m.serialNumber}</span>
                                            <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border-2 ${m.correctOption
                                                    ? 'bg-amber-500 border-amber-500 text-white'
                                                    : 'bg-white border-slate-200 text-slate-300'
                                                }`}>
                                                {m.correctOption || '?'}
                                            </span>
                                        </div>
                                    ))}
                                    {secMappings.length > 15 && (
                                        <div className="flex items-end pb-1">
                                            <span className="text-xs text-slate-400">+{secMappings.length - 15} more</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2 text-xs text-slate-500">
                                    Answer keys: <span className={`font-bold ${filledInSec === sec.questionCount ? 'text-green-600' : 'text-amber-600'}`}>
                                        {filledInSec}/{sec.questionCount} filled
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Instructions */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Instructions for Students (optional)
                </label>
                <textarea
                    rows={4}
                    value={formData.settings?.instructions || ''}
                    onChange={() =>
                        // We are calling updateFormData passed as arg but not destructured — access via closure
                        console.log('instructions change not wired')
                    }
                    placeholder="e.g., Use HB pencil only. Do not fold the OMR sheet..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">These instructions will be shown to students before the test begins.</p>
            </div>

            {/* Status toggle */}
            <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xl">📄</div>
                <div className="flex-1">
                    <p className="font-bold text-amber-900 text-sm">Ready to Publish?</p>
                    <p className="text-amber-700 text-xs mt-0.5">
                        {filledKeys < totalQ
                            ? `⚠️ ${totalQ - filledKeys} answer keys are missing. Auto-scoring won't work for those.`
                            : '✅ All answer keys are filled. This test is ready to publish!'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OMRReviewStep;
