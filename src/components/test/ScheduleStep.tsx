import type { TestFormData } from '../../types/test.types';

interface ScheduleStepProps {
    formData: Partial<TestFormData>;
    updateFormData: (updates: Partial<TestFormData>) => void;
}

const ScheduleStep = ({ formData, updateFormData }: ScheduleStepProps) => {
    const schedule = formData.schedule || { isScheduled: false };

    const updateSchedule = (key: string, value: any) => {
        updateFormData({
            schedule: {
                ...schedule,
                [key]: value
            }
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Schedule Test (Optional)</h2>
                <p className="text-slate-500">Set daily start and end times for this test</p>
            </div>

            {/* Enable Scheduling */}
            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg cursor-pointer">
                <input
                    type="checkbox"
                    checked={schedule.isScheduled}
                    onChange={(e) => updateSchedule('isScheduled', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                />
                <div>
                    <span className="font-semibold text-slate-800">Enable Test Scheduling</span>
                    <p className="text-xs text-slate-500">Restrict test access to specific daily times</p>
                </div>
            </label>

            {schedule.isScheduled && (
                <div className="space-y-4">
                    {/* Start Time */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Start Time
                        </label>
                        <input
                            type="time"
                            value={schedule.startTime || ''}
                            onChange={(e) => {
                                updateSchedule('startTime', e.target.value);
                            }}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* End Time */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            End Time
                        </label>
                        <input
                            type="time"
                            value={schedule.endTime || ''}
                            onChange={(e) => {
                                updateSchedule('endTime', e.target.value);
                            }}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Timezone */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Timezone
                        </label>
                        <select
                            value={schedule.timezone || 'Asia/Kolkata'}
                            onChange={(e) => updateSchedule('timezone', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                            <option value="America/New_York">EST (America/New_York)</option>
                            <option value="Europe/London">GMT (Europe/London)</option>
                            <option value="Asia/Dubai">GST (Asia/Dubai)</option>
                        </select>
                    </div>
                </div>
            )}

            {!schedule.isScheduled && (
                <div className="bg-slate-50 rounded-xl p-6 text-center">
                    <p className="text-slate-600">
                        Test will be available immediately after publishing and will remain accessible indefinitely.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ScheduleStep;
