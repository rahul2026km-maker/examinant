export interface TestSeries {
    id: string;
    title: string;
    description: string;
    isNew?: boolean;
    originalPrice: string;
    price: string;
    features: string[];
    colorTheme?: 'blue' | 'green';
}

export const testSeriesData: TestSeries[] = [
    {
        id: 'jee-mains-adv-2025',
        title: 'JEE Series',
        description: 'Boost your confidence and time management skills.',
        isNew: true,
        originalPrice: '2999',
        price: '1499',
        features: [
            "Full Length Mock Tests",
            "Chapter-wise Practice",
            "Previous Year Papers",
            "All India Rank"
        ],
        colorTheme: 'blue'
    },
    {
        id: 'neet-ug-2025',
        title: 'NEET Series',
        description: 'Boost your confidence and time management skills.',
        isNew: true,
        originalPrice: '2499',
        price: '1299',
        features: [
            "NCERT Based Pattern",
            "Physics, Chem, Bio",
            "Detailed Solutions",
            "Performance Analytics"
        ],
        colorTheme: 'blue'
    },
    {
        id: 'ssc-cgl-2025',
        title: 'SSC Series',
        description: 'Boost your confidence and time management skills.',
        isNew: true,
        originalPrice: '298',
        price: '149',
        features: [
            "Quant, Reasoning, English",
            "General Awareness",
            "Speed Tests",
            "Exam Oriented Interface"
        ],
        colorTheme: 'blue'
    }
];
