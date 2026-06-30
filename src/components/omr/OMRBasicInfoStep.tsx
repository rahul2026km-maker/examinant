import { useState, useEffect } from 'react';
import type { OMRTestFormData } from '../../types/omr.types';
import { getAllTestSeries } from '../../services/testSeriesService';
import { FileText, FlaskConical, BookOpen, Target, ClipboardList } from 'lucide-react';

interface OMRBasicInfoStepProps {
    formData: Partial<OMRTestFormData>;
    updateFormData: (updates: Partial<OMRTestFormData>) => void;
}

const TEST_TYPE_OPTIONS = [
    { value: 'mock', label: 'Full Length Mock', desc: 'Timed full simulation of the actual exam pattern', icon: FlaskConical, color: 'purple' },
    { value: 'subject_wise', label: 'Subject Wise Test', desc: 'Focus on a single subject', icon: BookOpen, color: 'indigo' },
    { value: 'unit_wise', label: 'Unitwise Test', desc: 'Focus on a specific unit of the syllabus', icon: Target, color: 'pink' },
    { value: 'chapter_wise', label: 'Chapterwise Test', desc: 'Focus on individual chapters', icon: ClipboardList, color: 'amber' },
    { value: 'previous_year', label: 'Previous Year', desc: 'Past exam papers', icon: FileText, color: 'green' },
];

const OMRBasicInfoStep = ({ formData, updateFormData }: OMRBasicInfoStepProps) => {
    const [seriesList, setSeriesList] = useState<{ id: string; name: string }[]>([]);
    const [loadingSeries, setLoadingSeries] = useState(false);

    useEffect(() => {
        const fetchSeries = async () => {
            setLoadingSeries(true);
            try {
                const series = await getAllTestSeries();
                setSeriesList(series.map(s => ({ id: s.id, name: s.name })));
            } catch (error) {
                console.error('Failed to fetch test series', error);
            } finally {
                setLoadingSeries(false);
            }
        };
        fetchSeries();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Basic Information</h2>
                <p className="text-slate-500 text-sm">Enter basic details for your OMR-based test</p>
            </div>

            {/* OMR Badge */}
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xl">📄</div>
                <div>
                    <p className="font-bold text-amber-900 text-sm">OMR-Based Test</p>
                    <p className="text-amber-700 text-xs mt-0.5">Students will fill a bubble sheet (OMR) style interface — simulating real pen-paper exams</p>
                </div>
            </div>

            {/* Test Name */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Test Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    placeholder="e.g., JEE Mains OMR Mock Test #1"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-slate-800"
                />
            </div>


            {/* Test Series */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Test Series <span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.seriesId || ''}
                    onChange={(e) => updateFormData({ seriesId: e.target.value })}
                    disabled={loadingSeries}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white transition-all ${!formData.seriesId ? 'border-amber-300 bg-amber-50' : 'border-slate-300'
                        }`}
                >
                    <option value="">{loadingSeries ? 'Loading series...' : 'Select a Test Series'}</option>
                    {seriesList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Select the series this OMR test belongs to.</p>
            </div>

            {/* Test Type */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Test Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {TEST_TYPE_OPTIONS.map(({ value, label, desc, icon: Icon, color }) => {
                        const isSelected = formData.testType === value;
                        const colorMap: Record<string, string> = {
                            blue: isSelected ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                            purple: isSelected ? 'border-purple-600 bg-purple-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                            green: isSelected ? 'border-green-600 bg-green-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                            emerald: isSelected ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                            indigo: isSelected ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                            pink: isSelected ? 'border-pink-600 bg-pink-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                            amber: isSelected ? 'border-amber-600 bg-amber-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                        };
                        const iconColorMap: Record<string, string> = {
                            blue: 'text-blue-600',
                            purple: 'text-purple-600',
                            green: 'text-green-600',
                            emerald: 'text-emerald-600',
                            indigo: 'text-indigo-600',
                            pink: 'text-pink-600',
                            amber: 'text-amber-600',
                        };
                        return (
                            <label
                                key={value}
                                className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${colorMap[color]}`}
                            >
                                <input
                                    type="radio"
                                    name="testType"
                                    value={value}
                                    checked={isSelected}
                                    onChange={() => updateFormData({ testType: value as any })}
                                    className="sr-only"
                                />
                                <Icon size={20} className={`mb-2 ${iconColorMap[color]}`} />
                                <span className="font-semibold text-slate-800 text-sm">{label}</span>
                                <span className="text-xs text-slate-500 mt-1">{desc}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default OMRBasicInfoStep;
