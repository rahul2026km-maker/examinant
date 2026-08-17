import { useState, useEffect } from 'react';
import PageLayout from '../components/landing/PageLayout';
import TestSeriesCard from '../components/landing/TestSeriesCard';
import { getAllTestSeries } from '../services/testSeriesService';
import { Loader2, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { TestSeries } from '../types/test.types';

const TestSeriesPage = () => {
    const [series, setSeries] = useState<TestSeries[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const data = await getAllTestSeries({ status: 'published' });
                setSeries(data);
            } catch (error) {
                console.error("Failed to fetch test series:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSeries();
    }, []);

    const filteredSeries = series.filter(item => {
        // Legacy fallback matching:
        if (categoryParam?.toLowerCase() === 'engineering entrance') {
            if (item.examCategory?.toLowerCase() === 'jee') {
                return !subcategoryParam || subcategoryParam.toLowerCase() === 'jee';
            }
        }
        if (categoryParam?.toLowerCase() === 'medical entrance') {
            if (item.examCategory?.toLowerCase() === 'neet') {
                return !subcategoryParam || subcategoryParam.toLowerCase() === 'neet';
            }
        }

        const matchesCategory = !categoryParam || item.examCategory?.toLowerCase() === categoryParam.toLowerCase();
        const matchesSubcategory = !subcategoryParam || item.examSubCategory?.toLowerCase() === subcategoryParam.toLowerCase();
        return matchesCategory && matchesSubcategory;
    });

    return (
        <PageLayout>
            <div className="bg-blue-50/30 py-12 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                            {categoryParam ? `${categoryParam} Test Series` : 'All Test Series'}
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Comprehensive test series designed by experts to help you ace your exams.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                        </div>
                    ) : filteredSeries.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="inline-block p-8 bg-white rounded-[32px] shadow-sm border border-slate-100 mb-4 transition-all hover:shadow-md">
                                <div className="w-20 h-20 bg-blue-50/80 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3 hover:rotate-6 transition-transform">
                                    <Clock className="text-[#1D64D0] w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Coming Soon</h3>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto text-sm leading-relaxed">
                                    Our expert faculty is currently crafting premium test series for this category. Stay tuned for updates!
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredSeries.map((item) => (
                                <TestSeriesCard
                                    key={item.id}
                                    id={item.id}
                                    title={item.name}
                                    isNew={item.status === 'published'}
                                    originalPrice={(item.pricing?.amount || 0) * 4} // Calculated original price (75% savings)
                                    price={item.pricing?.amount || 0}
                                    features={[
                                        `${item.stats?.totalTests || 0} Full Length Tests`,
                                        "Detailed Performance Analysis",
                                        "Personalized Score Tracking",
                                        "All India Rank Support"
                                    ]}
                                    onExplore={() => navigate(`/test-series/${item.id}`)}
                                    thumbnailUrl={item.thumbnailUrl}
                                    testCount={item.stats?.totalTests || 0}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default TestSeriesPage;
