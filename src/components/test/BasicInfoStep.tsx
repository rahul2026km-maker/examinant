import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { TestFormData } from '../../types/test.types';
import { getAllTestSeries } from '../../services/testSeriesService';

interface BasicInfoStepProps {
    formData: Partial<TestFormData>;
    updateFormData: (updates: Partial<TestFormData>) => void;
}

const TEST_TYPES = [
    { value: 'practice', label: 'Practice Test', desc: 'Students can attempt anytime, see results immediately' },
    { value: 'mock', label: 'Mock Test', desc: 'Timed full simulation of the actual exam' },
    { value: 'previous_year', label: 'Previous Year', desc: 'Past exam papers with official answers' },
];

const BasicInfoStep = ({ formData, updateFormData }: BasicInfoStepProps) => {
    const [seriesList, setSeriesList] = useState<{ id: string; name: string }[]>([]);
    const [seriesLoading, setSeriesLoading] = useState(true);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const series = await getAllTestSeries();
                setSeriesList(series.map(s => ({ id: s.id, name: s.name })));
            } catch (error) {
                console.error('Failed to fetch test series', error);
            } finally {
                setSeriesLoading(false);
            }
        };
        fetchSeries();
    }, []);

    const mark = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

    const nameError = touched.name && !formData.name?.trim() ? 'Test name is required.' : null;
    const seriesError = touched.seriesId && !formData.seriesId ? 'Please select a test series.' : null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Basic Information</h2>
                <p className="text-slate-500 text-sm">Enter the basic details for your test</p>
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
                    onBlur={() => mark('name')}
                    placeholder="e.g., JEE Mains Mock Test #1"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${nameError ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                />
                {nameError && (
                    <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                        <AlertCircle size={12} /> {nameError}
                    </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                    {(formData.name || '').length}/100 characters
                </p>
            </div>

            {/* Test Series Selection */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Test Series <span className="text-red-500">*</span>
                </label>
                {seriesLoading ? (
                    <div className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-sm animate-pulse">
                        Loading series...
                    </div>
                ) : (
                    <select
                        value={formData.seriesId || ''}
                        onChange={(e) => updateFormData({ seriesId: e.target.value })}
                        onBlur={() => mark('seriesId')}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors ${seriesError ? 'border-red-400 bg-red-50' : formData.seriesId ? 'border-slate-300' : 'border-slate-300'}`}
                    >
                        <option value="">Select a Test Series</option>
                        {seriesList.map((series) => (
                            <option key={series.id} value={series.id}>
                                {series.name}
                            </option>
                        ))}
                    </select>
                )}
                {seriesError && (
                    <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                        <AlertCircle size={12} /> {seriesError}
                    </p>
                )}
                {seriesList.length === 0 && !seriesLoading && (
                    <p className="text-xs text-amber-600 mt-1.5">
                        No test series found. Create one from Test Series Management first.
                    </p>
                )}
            </div>

            {/* Test Type */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Test Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TEST_TYPES.map((type) => {
                        const isSelected = formData.testType === type.value;
                        return (
                            <label
                                key={type.value}
                                className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="testType"
                                    value={type.value}
                                    checked={isSelected}
                                    onChange={(e) => updateFormData({ testType: e.target.value as any })}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-slate-300'}`}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                    </div>
                                    <span className="font-semibold text-slate-800 text-sm">{type.label}</span>
                                </div>
                                <span className="text-xs text-slate-500 pl-6">{type.desc}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BasicInfoStep;
