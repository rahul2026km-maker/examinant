import { useState } from 'react';
import type { OMRTestFormData, OMRQuestionMapping, OMRSection } from '../../types/omr.types';
import { KeyRound, Grid3X3, List, ChevronDown, ChevronRight } from 'lucide-react';

interface OMRQuestionAssignStepProps {
    formData: Partial<OMRTestFormData>;
    updateFormData: (updates: Partial<OMRTestFormData>) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

// Realistic OMR bubble colors
const BUBBLE_FILLED = 'bg-slate-900 border-slate-900 text-white shadow-inner';
const BUBBLE_EMPTY = 'bg-white border-slate-300 text-slate-500 hover:border-slate-500 hover:bg-slate-50';

export default function OMRQuestionAssignStep({ formData, updateFormData }: OMRQuestionAssignStepProps) {
    const sections: OMRSection[] = (formData.omrTemplate?.sections as OMRSection[]) || [];
    const mappings: OMRQuestionMapping[] = formData.questionMappings || [];
    const [viewMode, setViewMode] = useState<'sheet' | 'list'>('sheet');
    const [expandedSection, setExpandedSection] = useState<string>(sections[0]?.id || '');

    const initMappings = (): OMRQuestionMapping[] => {
        if (mappings.length > 0) return mappings;
        const init: OMRQuestionMapping[] = [];
        sections.forEach((sec) => {
            for (let i = sec.questionStartIndex; i <= sec.questionEndIndex; i++) {
                init.push({
                    serialNumber: i,
                    correctOption: '',
                    type: sec.optionsPerQuestion === 0 ? 'Numerical' : 'MCQ',
                    subject: sec.subject || '',
                });
            }
        });
        return init;
    };

    const getMappingsForSection = (sec: OMRSection) =>
        initMappings().filter(m => m.serialNumber >= sec.questionStartIndex && m.serialNumber <= sec.questionEndIndex);

    const updateMapping = (serialNumber: number, updates: Partial<OMRQuestionMapping>) => {
        const current = initMappings();
        const updated = current.map(m => m.serialNumber === serialNumber ? { ...m, ...updates } : m);
        updateFormData({ questionMappings: updated });
    };

    const setAllForSection = (sec: OMRSection, option: string) => {
        const current = initMappings();
        const updated = current.map(m =>
            m.serialNumber >= sec.questionStartIndex && m.serialNumber <= sec.questionEndIndex
                ? { ...m, correctOption: option }
                : m
        );
        updateFormData({ questionMappings: updated });
    };

    const allMappings = initMappings();
    const totalFilled = allMappings.filter(m => m.correctOption && m.correctOption !== '').length;
    const totalQ = formData.omrTemplate?.totalQuestions || 0;
    const fillPercent = totalQ > 0 ? (totalFilled / totalQ) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Answer Key</h2>
                    <p className="text-slate-500 text-sm">Click bubbles to mark the correct answer for each question</p>
                </div>
                {/* View toggle */}
                <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setViewMode('sheet')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'sheet' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Grid3X3 size={13} /> OMR Sheet
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <List size={13} /> List View
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <KeyRound size={15} className="text-amber-500" /> Answer Key Progress
                    </span>
                    <span className="text-sm font-bold text-amber-600">{totalFilled} / {totalQ} filled</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${fillPercent === 100 ? 'bg-green-500' : 'bg-amber-400'}`}
                        style={{ width: `${fillPercent}%` }}
                    />
                </div>
                {fillPercent < 100 && (
                    <p className="text-xs text-slate-400 mt-1.5">
                        Students can still attempt without a complete key — but auto-scoring won't work.
                    </p>
                )}
            </div>

            {sections.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 text-sm">No sections found. Go back and configure the OMR template first.</p>
                </div>
            ) : viewMode === 'sheet' ? (
                /* ============ REALISTIC OMR SHEET VIEW ============ */
                <div className="space-y-6">
                    {sections.map((sec, si) => {
                        const isExpanded = expandedSection === sec.id;
                        const secMappings = getMappingsForSection(sec);
                        const secFilled = secMappings.filter(m => m.correctOption).length;
                        const isNumerical = sec.optionsPerQuestion === 0;
                        const opts = OPTION_LABELS.slice(0, sec.optionsPerQuestion);

                        return (
                            <div key={sec.id || sec.name || si} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                {/* Section Header */}
                                <button
                                    type="button"
                                    onClick={() => setExpandedSection(isExpanded ? '' : sec.id)}
                                    className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
                                        <div className="text-left">
                                            <p className="font-bold text-slate-800">{sec.name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Q{sec.questionStartIndex}–Q{sec.questionEndIndex} • {isNumerical ? 'Numerical (Integer)' : `${sec.optionsPerQuestion}-option MCQ`} • +{sec.marksCorrect}/{sec.marksWrong}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${secFilled === sec.questionCount ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {secFilled}/{sec.questionCount}
                                        </span>
                                        {!isNumerical && (
                                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                {opts.map(opt => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setAllForSection(sec, opt)}
                                                        title={`Fill all as ${opt}`}
                                                        className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-900 hover:text-white text-slate-700 text-[10px] font-black transition-all"
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {/* OMR Bubble Grid */}
                                {isExpanded && (
                                    <div className="p-5 bg-white">
                                        {isNumerical ? (
                                            /* Numerical answer inputs in a clean grid */
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {secMappings.map(m => (
                                                    <div key={m.serialNumber} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                                                        <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                            {m.serialNumber}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={m.correctOption || ''}
                                                            onChange={e => updateMapping(m.serialNumber, { correctOption: e.target.value })}
                                                            placeholder="Enter answer..."
                                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Realistic OMR Bubble Sheet */
                                            <div className="font-mono">
                                                {/* Column headers */}
                                                <div className="flex items-center mb-3 px-1">
                                                    <div className="w-12 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Q No.</div>
                                                    <div className="flex gap-6 ml-2">
                                                        {opts.map(opt => (
                                                            <div key={opt} className="w-7 text-center text-[11px] font-black text-slate-500 uppercase">{opt}</div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Divider */}
                                                <div className="h-px bg-slate-200 mb-3" />

                                                {/* Question rows — two-column layout for longer sections */}
                                                <div className={`grid gap-x-8 gap-y-1 ${secMappings.length > 20 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                    {secMappings.map((m, rowIdx) => {
                                                        const isAltRow = rowIdx % 2 === 1;
                                                        return (
                                                            <div
                                                                key={m.serialNumber}
                                                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isAltRow ? 'bg-slate-50' : 'bg-white'}`}
                                                            >
                                                                {/* Question Number */}
                                                                <div className="w-10 text-right">
                                                                    <span className="text-[11px] font-bold text-slate-500">{m.serialNumber}.</span>
                                                                </div>

                                                                {/* Bubbles */}
                                                                <div className="flex gap-2 ml-1">
                                                                    {opts.map(opt => {
                                                                        const isSelected = m.correctOption === opt;
                                                                        return (
                                                                            <button
                                                                                key={opt}
                                                                                type="button"
                                                                                onClick={() => updateMapping(m.serialNumber, { correctOption: isSelected ? '' : opt })}
                                                                                title={`Q${m.serialNumber}: Select ${opt}`}
                                                                                className={`w-7 h-7 rounded-full border-2 text-[11px] font-black transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 ${isSelected ? BUBBLE_FILLED : BUBBLE_EMPTY}`}
                                                                            >
                                                                                {isSelected ? '' : opt}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Selected label */}
                                                                <div className="w-5 text-center">
                                                                    {m.correctOption && (
                                                                        <span className="text-[10px] font-black text-amber-600">{m.correctOption}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Section summary */}
                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                                    <span>
                                                        <span className="font-bold text-green-600">{secFilled}</span> answered &nbsp;·&nbsp;
                                                        <span className="font-bold text-slate-400">{sec.questionCount - secFilled}</span> blank
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const current = initMappings();
                                                            const cleared = current.map(m =>
                                                                m.serialNumber >= sec.questionStartIndex && m.serialNumber <= sec.questionEndIndex
                                                                    ? { ...m, correctOption: '' }
                                                                    : m
                                                            );
                                                            updateFormData({ questionMappings: cleared });
                                                        }}
                                                        className="text-red-400 hover:text-red-600 font-semibold transition-colors"
                                                    >
                                                        Clear section
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ============ LIST VIEW (original-style, with question text) ============ */
                <div className="space-y-3">
                    {sections.map((sec, si) => {
                        const isExpanded = expandedSection === sec.id;
                        const secMappings = getMappingsForSection(sec);
                        const secFilled = secMappings.filter(m => m.correctOption).length;
                        const isNumerical = sec.optionsPerQuestion === 0;
                        const opts = OPTION_LABELS.slice(0, sec.optionsPerQuestion);

                        return (
                            <div key={sec.id || sec.name || si} className="border border-slate-200 rounded-xl overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setExpandedSection(isExpanded ? '' : sec.id)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
                                        <div className="text-left">
                                            <p className="font-bold text-slate-800">{sec.name}</p>
                                            <p className="text-xs text-slate-500">Q{sec.questionStartIndex}–Q{sec.questionEndIndex} • {isNumerical ? 'Numerical' : `${sec.optionsPerQuestion} options`} • +{sec.marksCorrect}/{sec.marksWrong}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${secFilled === sec.questionCount ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {secFilled}/{sec.questionCount}
                                    </span>
                                </button>
                                {isExpanded && (
                                    <div className="p-4 space-y-3">
                                        {secMappings.map(m => (
                                            <div key={m.serialNumber} className="flex flex-col md:flex-row items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex-1 w-full relative">
                                                    <span className="absolute top-3 left-3 text-xs font-bold text-slate-400">Q{m.serialNumber}</span>
                                                    <textarea
                                                        value={m.questionText || ''}
                                                        onChange={e => updateMapping(m.serialNumber, { questionText: e.target.value })}
                                                        placeholder="Optional: type question text..."
                                                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 min-h-[70px] bg-white resize-none"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2 items-center">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Correct</span>
                                                    {isNumerical ? (
                                                        <input
                                                            type="text"
                                                            value={m.correctOption || ''}
                                                            onChange={e => updateMapping(m.serialNumber, { correctOption: e.target.value })}
                                                            placeholder="Value"
                                                            className="w-24 px-2 py-2 border border-slate-200 rounded-lg text-sm text-center font-mono focus:outline-none focus:border-amber-400"
                                                        />
                                                    ) : (
                                                        <div className="flex gap-1.5">
                                                            {opts.map(opt => (
                                                                <button
                                                                    key={opt}
                                                                    type="button"
                                                                    onClick={() => updateMapping(m.serialNumber, { correctOption: m.correctOption === opt ? '' : opt })}
                                                                    className={`w-9 h-9 rounded-full text-sm font-black border-2 transition-all ${m.correctOption === opt ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-500'}`}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
