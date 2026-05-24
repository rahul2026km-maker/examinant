import { useState } from 'react';
import type { OMRTestFormData, OMRSection } from '../../types/omr.types';
import { OMR_PRESETS } from '../../types/omr.types';
import { Plus, Trash2, Zap } from 'lucide-react';

interface OMRTemplateStepProps {
    formData: Partial<OMRTestFormData>;
    updateFormData: (updates: Partial<OMRTestFormData>) => void;
}

const PRESET_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
    JEE_MAINS: { label: 'JEE Mains', emoji: '⚡', color: 'blue' },
    NEET: { label: 'NEET', emoji: '🧬', color: 'green' },
    CUSTOM: { label: 'Custom', emoji: '🛠️', color: 'purple' },
};

const OMRTemplateStep = ({ formData, updateFormData }: OMRTemplateStepProps) => {
    const [selectedPreset, setSelectedPreset] = useState<string>(
        formData.omrTemplate?.examPattern || ''
    );

    const template = formData.omrTemplate || {};
    const sections: OMRSection[] = (template.sections as OMRSection[]) || [];

    const applyPreset = (presetKey: string) => {
        setSelectedPreset(presetKey);
        const preset = OMR_PRESETS[presetKey];
        if (!preset) return;
        updateFormData({
            omrTemplate: {
                ...preset,
                examPattern: presetKey as any,
            } as any,
        });
    };

    const updateSection = (idx: number, updates: Partial<OMRSection>) => {
        const updated = sections.map((s, i) => (i === idx ? { ...s, ...updates } : s));
        updateFormData({ omrTemplate: { ...template, sections: updated } as any });
    };

    const removeSection = (idx: number) => {
        const updated = sections.filter((_, i) => i !== idx);
        const total = updated.reduce((sum, s) => sum + s.questionCount, 0);
        updateFormData({ omrTemplate: { ...template, sections: updated, totalQuestions: total } as any });
    };

    const addSection = () => {
        const lastEnd = sections.length > 0 ? sections[sections.length - 1].questionEndIndex : 0;
        const newSection: OMRSection = {
            id: `sec-${Date.now()}`,
            name: `Section ${String.fromCharCode(65 + sections.length)}`,
            questionCount: 10,
            optionsPerQuestion: 4,
            marksCorrect: 1,
            marksWrong: 0,
            marksUnattempted: 0,
            questionStartIndex: lastEnd + 1,
            questionEndIndex: lastEnd + 10,
        };
        const updated = [...sections, newSection];
        const total = updated.reduce((sum, s) => sum + s.questionCount, 0);
        updateFormData({ omrTemplate: { ...template, sections: updated, totalQuestions: total } as any });
    };

    const totalQ = sections.reduce((sum, s) => sum + s.questionCount, 0);
    const totalMarks = sections.reduce((sum, s) => sum + s.questionCount * s.marksCorrect, 0);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">OMR Sheet Template</h2>
                <p className="text-slate-500 text-sm">Configure how many questions, sections, and marking scheme your OMR sheet will have</p>
            </div>

            {/* Preset Selector */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" /> Quick Preset
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {Object.entries(PRESET_LABELS).map(([key, { label, emoji, color }]) => {
                        const colorMap: Record<string, string> = {
                            blue: selectedPreset === key ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100' : 'border-slate-200 hover:border-blue-300',
                            green: selectedPreset === key ? 'border-green-600 bg-green-50 shadow-md shadow-green-100' : 'border-slate-200 hover:border-green-300',
                            purple: selectedPreset === key ? 'border-purple-600 bg-purple-50 shadow-md shadow-purple-100' : 'border-slate-200 hover:border-purple-300',
                        };
                        return (
                            <button
                                key={key}
                                onClick={() => applyPreset(key)}
                                type="button"
                                className={`flex flex-col items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${colorMap[color]}`}
                            >
                                <span className="text-3xl mb-2">{emoji}</span>
                                <span className="font-bold text-slate-800">{label}</span>
                                <span className="text-xs text-slate-500 mt-1">
                                    {key === 'JEE_MAINS' ? '90 Qs • 3 Subjects' : key === 'NEET' ? '180 Qs • 4 Subjects' : 'Fully Custom'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Summary Bar */}
            {sections.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Questions', value: totalQ, color: 'text-blue-700', bg: 'bg-blue-50' },
                        { label: 'Total Marks', value: totalMarks, color: 'text-green-700', bg: 'bg-green-50' },
                        { label: 'Sections', value: sections.length, color: 'text-purple-700', bg: 'bg-purple-50' },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                            <div className="text-xs text-slate-500 mt-1">{label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sections Table */}
            {sections.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-700">Sections Configuration</h3>
                        <button
                            type="button"
                            onClick={addSection}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            <Plus size={15} /> Add Section
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold">
                                <tr>
                                    <th className="px-4 py-3 text-left">Section Name</th>
                                    <th className="px-4 py-3 text-center">Q Count</th>
                                    <th className="px-4 py-3 text-center">Options</th>
                                    <th className="px-4 py-3 text-center">+Marks</th>
                                    <th className="px-4 py-3 text-center">-Marks</th>
                                    <th className="px-4 py-3 text-center">Q Range</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sections.map((sec, idx) => (
                                    <tr key={sec.id || sec.name || idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={sec.name}
                                                onChange={(e) => updateSection(idx, { name: e.target.value })}
                                                className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={sec.questionCount}
                                                min={1}
                                                onChange={(e) => {
                                                    const count = parseInt(e.target.value) || 1;
                                                    updateSection(idx, {
                                                        questionCount: count,
                                                        questionEndIndex: sec.questionStartIndex + count - 1,
                                                    });
                                                }}
                                                className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-amber-400"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <select
                                                value={sec.optionsPerQuestion}
                                                onChange={(e) => updateSection(idx, { optionsPerQuestion: parseInt(e.target.value) })}
                                                className="px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                                            >
                                                <option value={0}>Numerical</option>
                                                <option value={4}>4 (A-D)</option>
                                                <option value={5}>5 (A-E)</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                value={sec.marksCorrect}
                                                min={0}
                                                step={0.5}
                                                onChange={(e) => updateSection(idx, { marksCorrect: parseFloat(e.target.value) || 0 })}
                                                className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-amber-400"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                value={sec.marksWrong}
                                                max={0}
                                                step={0.25}
                                                onChange={(e) => updateSection(idx, { marksWrong: parseFloat(e.target.value) || 0 })}
                                                className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-amber-400"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-500 text-xs font-mono">
                                            Q{sec.questionStartIndex}–Q{sec.questionEndIndex}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeSection(idx)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {sections.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 mb-4">Select a preset above or add sections manually</p>
                    <button
                        type="button"
                        onClick={addSection}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors mx-auto"
                    >
                        <Plus size={16} /> Add First Section
                    </button>
                </div>
            )}

            {/* Duration */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Test Duration (minutes)</label>
                <input
                    type="number"
                    min={5}
                    value={formData.settings?.duration || 180}
                    onChange={(e) =>
                        updateFormData({ settings: { ...formData.settings, duration: parseInt(e.target.value) || 180, showResultsImmediately: formData.settings?.showResultsImmediately ?? true } })
                    }
                    className="w-40 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
            </div>

            {/* Show Results */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <input
                    type="checkbox"
                    id="showResults"
                    checked={formData.settings?.showResultsImmediately ?? true}
                    onChange={(e) =>
                        updateFormData({ settings: { ...formData.settings, duration: formData.settings?.duration || 180, showResultsImmediately: e.target.checked } })
                    }
                    className="w-4 h-4 accent-amber-500"
                />
                <label htmlFor="showResults" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Show results immediately after submission
                </label>
            </div>
        </div>
    );
};

export default OMRTemplateStep;
