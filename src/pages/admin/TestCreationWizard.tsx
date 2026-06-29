import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, X, AlertTriangle } from 'lucide-react';
import type { TestFormData } from '../../types/test.types';
import { createTest, generateQuestionsAuto, generateQuestionsCustom, saveQuestionsToTest, publishTest } from '../../services/testService';
import { toast, ToastContainer } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';

import BasicInfoStep from '../../components/test/BasicInfoStep';
import GenerationMethodStep from '../../components/test/GenerationMethodStep';
import QuestionConfigStep from '../../components/test/QuestionConfigStep';
import TestSettingsStep from '../../components/test/TestSettingsStep';
import ScheduleStep from '../../components/test/ScheduleStep';
import ReviewStep from '../../components/test/ReviewStep';

interface TestCreationWizardProps {
    seriesId?: string;
    onComplete?: () => void;
    onCancel?: () => void;
}

const STEPS = [
    { title: 'Basic Info', shortTitle: 'Info' },
    { title: 'Generation Method', shortTitle: 'Method' },
    { title: 'Question Config', shortTitle: 'Questions' },
    { title: 'Test Settings', shortTitle: 'Settings' },
    { title: 'Schedule', shortTitle: 'Schedule' },
    { title: 'Review & Publish', shortTitle: 'Review' },
];

const STEP_COMPONENTS = [
    BasicInfoStep,
    GenerationMethodStep,
    QuestionConfigStep,
    TestSettingsStep,
    ScheduleStep,
    ReviewStep,
];

const TestCreationWizard = ({ seriesId, onComplete, onCancel }: TestCreationWizardProps) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth() || {};
    const [currentStep, setCurrentStep] = useState(0);
    const [highestVisited, setHighestVisited] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [stepErrors, setStepErrors] = useState<string[]>([]);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const [formData, setFormData] = useState<Partial<TestFormData>>({
        name: '',
        seriesId: seriesId || '',
        testType: 'practice',
        generationType: 'auto',
        questionConfig: {
            totalQuestions: 90,
            mcqPercentage: 67,
            numericalPercentage: 33
        },
        settings: {
            duration: 180,
            marksPerQuestion: 4,
            negativeMarking: -1,
            allowReview: true,
            showSolutions: true,
            shuffleQuestions: true,
            shuffleOptions: true
        },
        status: 'draft'
    });

    const hasUnsavedChanges = !!(formData.name || formData.seriesId);

    const validateStep = (step: number): string[] => {
        const errors: string[] = [];
        switch (step) {
            case 0:
                if (!formData.name?.trim()) errors.push('Test name is required.');
                if (!formData.seriesId) errors.push('Please select a test series.');
                if (!formData.testType) errors.push('Please select a test type.');
                break;
            case 1:
                if (formData.generationType === 'auto') {
                    if (!formData.autoConfig?.subjects || formData.autoConfig.subjects.length === 0) {
                        errors.push('Select at least one subject.');
                    }
                } else {
                    if (!formData.customConfig?.subjects || formData.customConfig.subjects.length === 0) {
                        errors.push('Select at least one subject.');
                    }
                }
                break;
            case 2:
                if (!formData.questionConfig?.totalQuestions || formData.questionConfig.totalQuestions < 1) {
                    errors.push('Total questions must be at least 1.');
                }
                if ((formData.questionConfig?.mcqPercentage || 0) + (formData.questionConfig?.numericalPercentage || 0) !== 100) {
                    errors.push('MCQ% + Numerical% must equal 100.');
                }
                break;
            case 3:
                if (!formData.settings?.duration || formData.settings.duration < 1) {
                    errors.push('Duration must be at least 1 minute.');
                }
                if (formData.settings?.enableSectionTimers) {
                    const selectedSubjects = formData.generationType === 'auto'
                        ? formData.autoConfig?.subjects || []
                        : formData.customConfig?.subjects || [];
                    for (const subject of selectedSubjects) {
                        const dur = formData.settings?.sectionDurations?.[subject];
                        if (!dur || dur < 1) {
                            errors.push(`Duration for subject "${subject}" must be at least 1 minute.`);
                        }
                    }
                }
                if (!formData.settings?.marksPerQuestion || formData.settings.marksPerQuestion < 1) {
                    errors.push('Marks per question must be at least 1.');
                }
                if (formData.settings?.negativeMarking && formData.settings.negativeMarking > 0) {
                    errors.push('Negative marking should be 0 or a negative value (e.g. -1).');
                }
                break;
        }
        return errors;
    };

    const updateFormData = (updates: Partial<TestFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        if (stepErrors.length > 0) setStepErrors([]);
    };

    const handleNext = () => {
        const errors = validateStep(currentStep);
        if (errors.length > 0) {
            setStepErrors(errors);
            return;
        }
        setStepErrors([]);
        const next = currentStep + 1;
        setCurrentStep(next);
        setHighestVisited(prev => Math.max(prev, next));
    };

    const handleBack = () => {
        setStepErrors([]);
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const jumpToStep = (index: number) => {
        if (index > highestVisited) return; // Can't jump ahead past unvisited
        setStepErrors([]);
        setCurrentStep(index);
    };

    const handleCancel = () => {
        if (hasUnsavedChanges) {
            setShowCancelConfirm(true);
        } else {
            (onCancel || (() => navigate('/admin-dashboard/test-series')))();
        }
    };

    const handleSaveDraft = async () => {
        if (!formData.name?.trim()) {
            toast.error('Cannot save draft', 'Test name is required.');
            return;
        }
        setIsSaving(true);
        try {
            await delay(800);
            await createTest(formData as TestFormData, currentUser?.uid || 'admin');
            toast.success('Draft saved!', 'You can continue editing later.');
            if (onComplete) {
                onComplete();
            } else {
                navigate('/admin-dashboard/test-series');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            toast.error('Save failed', 'Could not save the draft. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        // Final validation across all steps
        const allErrors: string[] = [];
        for (let i = 0; i < 4; i++) {
            allErrors.push(...validateStep(i));
        }
        if (allErrors.length > 0) {
            setStepErrors(allErrors);
            toast.error('Validation failed', allErrors[0]);
            return;
        }

        setIsSaving(true);
        setIsGenerating(true);

        try {
            await delay(1000);
            const testId = await createTest({ ...formData, status: 'published' } as TestFormData, currentUser?.uid || 'admin');

            let questionIds: string[] = [];

            if (formData.generationType === 'auto' && formData.autoConfig?.subjects) {
                questionIds = await generateQuestionsAuto(formData.autoConfig as any);
            } else if (formData.generationType === 'custom' && formData.customConfig?.subjects && formData.questionConfig) {
                questionIds = await generateQuestionsCustom(formData.customConfig as any, formData.questionConfig);
            }

            await saveQuestionsToTest(testId, questionIds);
            await publishTest(testId);

            toast.success('Test published!', `${questionIds.length} questions generated successfully.`);
            if (onComplete) {
                onComplete();
            } else {
                navigate('/admin-dashboard/test-series');
            }
        } catch (error) {
            console.error('Error publishing test:', error);
            toast.error('Publish failed', 'Something went wrong. Please try again.');
        } finally {
            setIsSaving(false);
            setIsGenerating(false);
        }
    };

    const CurrentStepComponent = STEP_COMPONENTS[currentStep];
    const isLastStep = currentStep === STEPS.length - 1;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <ToastContainer />
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Create New Test</h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep].title}
                            </p>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                            <X size={18} /> Cancel
                        </button>
                    </div>

                    {/* Clickable Stepper */}
                    <div className="flex items-center">
                        {STEPS.map((step, index) => {
                            const isCompleted = index < currentStep;
                            const isCurrent = index === currentStep;
                            const isClickable = index <= highestVisited;

                            return (
                                <div key={index} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <button
                                            onClick={() => jumpToStep(index)}
                                            disabled={!isClickable}
                                            title={isClickable ? `Go to ${step.title}` : 'Complete previous steps first'}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${isCompleted
                                                ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                                : isCurrent
                                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                    : isClickable
                                                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer'
                                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {isCompleted ? <Check size={18} /> : index + 1}
                                        </button>
                                        <span className={`text-xs mt-1.5 text-center hidden sm:block ${isCurrent ? 'text-blue-700 font-semibold' : isCompleted ? 'text-green-700 font-medium' : 'text-slate-400'}`}>
                                            {step.shortTitle}
                                        </span>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div className={`h-1 flex-1 mx-1 rounded-full transition-colors ${index < currentStep ? 'bg-green-400' : 'bg-slate-200'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Validation Errors Banner */}
                <AnimatePresence>
                    {stepErrors.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3"
                        >
                            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="font-semibold text-red-800 text-sm mb-1">Please fix the following:</p>
                                <ul className="space-y-0.5">
                                    {stepErrors.map((e, i) => (
                                        <li key={i} className="text-sm text-red-700">• {e}</li>
                                    ))}
                                </ul>
                            </div>
                            <button onClick={() => setStepErrors([])} className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0">
                                <X size={16} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.18 }}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6"
                    >
                        <CurrentStepComponent formData={formData} updateFormData={updateFormData} />
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>

                    <div className="flex gap-3">
                        {isLastStep && (
                            <button
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="px-5 py-2.5 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSaving && !isGenerating ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : 'Save Draft'}
                            </button>
                        )}

                        {isLastStep ? (
                            <button
                                onClick={handlePublish}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} /> Publish Test
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Next <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Cancel confirmation modal */}
            <AnimatePresence>
                {showCancelConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="text-amber-600" size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Discard changes?</h2>
                            </div>
                            <p className="text-slate-600 text-sm mb-6">
                                You have unsaved changes. If you leave now, your progress will be lost.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelConfirm(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                                >
                                    Keep Editing
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCancelConfirm(false);
                                        (onCancel || (() => navigate('/admin-dashboard/test-series')))();
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
                                >
                                    Discard & Leave
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TestCreationWizard;
