import React, { useState } from 'react';
import {
    TrendingUp,
    Activity,
    Brain,
    Lock
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { Select } from '../../components/ui/Select';

export default function AiAnalytics() {
    // State for filters
    const [timeRange, setTimeRange] = useState('30days');
    const [selectedDept, setSelectedDept] = useState('all');

    // Filter Options
    const timeOptions = [
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: '90days', label: 'Last 3 Months' },
    ];

    const deptOptions = [
        { value: 'all', label: 'All Departments' },
        { value: 'cardiology', label: 'Cardiology' },
        { value: 'general', label: 'General Medicine' },
        { value: 'orthopedics', label: 'Orthopedics' },
        { value: 'ent', label: 'ENT' },
    ];

    // Analytics Data
    const loadForecastData = [
        { name: 'Today', card: 65, gen: 85, orth: 45, ent: 30 },
        { name: '+7d', card: 70, gen: 88, orth: 48, ent: 32 },
        { name: '+14d', card: 80, gen: 95, orth: 52, ent: 35 },
        { name: '+21d', card: 120, gen: 140, orth: 85, ent: 58 },
        { name: '+30d', card: 155, gen: 170, orth: 90, ent: 60 },
    ];

    const diseaseData = [
        { name: 'Flu', value: 32, color: '#60A5FA' }, // Blue-400
        { name: 'Diabetes', value: 21, color: '#34D399' }, // Emerald-400
        { name: 'Hypertension', value: 18, color: '#FBBF24' }, // Amber-400
        { name: 'Respiratory Infections', value: 14, color: '#A78BFA' }, // Violet-400
        { name: 'Others', value: 15, color: '#9CA3AF' }, // Gray-400
    ];

    const departmentStatus = [
        { name: 'Cardiology', status: 'High', percent: 88, color: 'text-red-500', dot: '🔴' },
        { name: 'General Medicine', status: 'High', percent: 85, color: 'text-red-500', dot: '🔴' },
        { name: 'Orthopedics', status: 'Moderate', percent: 72, color: 'text-orange-500', dot: '🟡' },
        { name: 'ENT', status: 'Normal', percent: 45, color: 'text-green-500', dot: '🟢' },
    ];

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                <Brain className="w-5 h-5 text-pink-500 shrink-0" />
                <div>
                    <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-500" />
                        AI analytics support hospital planning and preventive care.
                    </h4>
                    <p className="text-xs text-blue-700 ml-4">This dashboard does NOT provide diagnosis or patient-level insights.</p>
                </div>
            </div>

            {/* Chart 1: Forecast */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Department Load Forecast
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Predicted patient load for the next 7-30 days</p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 text-xs font-medium">
                            <Brain className="w-3 h-3" />
                            AI Prediction
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={loadForecastData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={{ stroke: '#9CA3AF' }}
                                    tickLine={{ stroke: '#9CA3AF' }}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                    label={{ value: 'Date', position: 'insideBottom', offset: -5, fill: '#6B7280', fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={{ stroke: '#9CA3AF' }}
                                    tickLine={{ stroke: '#9CA3AF' }}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    label={{ value: 'Expected Patient Visits', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
                                />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 'none' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                <Line type="monotone" dataKey="card" stroke="#60A5FA" strokeWidth={2} dot={{ r: 4 }} name="Cardiology" />
                                <Line type="monotone" dataKey="gen" stroke="#34D399" strokeWidth={2} dot={{ r: 4 }} name="General Medicine" />
                                <Line type="monotone" dataKey="orth" stroke="#FBBF24" strokeWidth={2} dot={{ r: 4 }} name="Orthopedics" />
                                <Line type="monotone" dataKey="ent" stroke="#A78BFA" strokeWidth={2} dot={{ r: 4 }} name="ENT" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Department Load Status</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {departmentStatus.map((dept, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <span className="text-lg leading-none mt-0.5">{dept.dot}</span>
                                <div>
                                    <p className="text-xs font-medium text-gray-900">{dept.name}</p>
                                    <p className={`text-xs ${dept.color}`}>{dept.status} ({dept.percent}%)</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 space-y-1">
                        <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">🟢 Normal:</span> &lt; 60% capacity</p>
                        <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">🟡 Moderate:</span> 60-80% capacity</p>
                        <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">🔴 High:</span> &gt; 80% capacity</p>
                    </div>
                </div>

                <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
                    <Lock className="w-3 h-3 text-blue-700" />
                    <p className="text-xs text-blue-700">Prediction is based only on historical visit counts. No patient data used.</p>
                </div>
            </div>

            {/* Chart 2: Disease Status */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-600" />
                                Disease Trend Distribution
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Top diagnosis categories for the selected time period</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-40">
                                <Select
                                    options={timeOptions}
                                    value={timeRange}
                                    onChange={setTimeRange}
                                    placeholder="Time Range"
                                />
                            </div>
                            <div className="w-48">
                                <Select
                                    options={deptOptions}
                                    value={selectedDept}
                                    onChange={setSelectedDept}
                                    placeholder="Department"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="flex flex-col items-center">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={diseaseData}
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                            isAnimationActive={true}
                                            animationBegin={0}
                                            animationDuration={3500}
                                            label={({ name, value }) => `${name}: ${value}%`}
                                        >
                                            {diseaseData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center mt-2">
                                <h4 className="font-semibold text-gray-900 text-sm">Top Conditions</h4>
                                <p className="text-xs text-gray-500">Last 30 Days</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {diseaseData.map((d) => (
                                <div key={d.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-sm font-medium text-gray-900">{d.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{d.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-4 py-3 bg-purple-50 border-t border-purple-100 flex items-center gap-2">
                    <Lock className="w-3 h-3 text-purple-700" />
                    <p className="text-xs text-purple-700">Only aggregated diagnosis categories are displayed. No individual records.</p>
                </div>
            </div>
        </div>
    );
}
