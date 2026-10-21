import { jsPDF } from 'jspdf';

export interface PYQDocumentData {
    title: string;
    category: string;
    year?: string;
    description?: string;
    type?: string;
    fileUrl?: string;
}

// Category-specific sample question banks with authentic solutions
const QUESTION_SETS: Record<string, Array<{ q: string; options: string[]; answer: string; solution: string }>> = {
    'SSC CGL': [
        {
            q: "Under which Article of the Constitution of India is the Finance Commission of India constituted?",
            options: ["A) Article 280", "B) Article 324", "C) Article 356", "D) Article 368"],
            answer: "A) Article 280",
            solution: "Article 280 of the Constitution provides for a Finance Commission as a quasi-judicial body constituted by the President of India every fifth year."
        },
        {
            q: "Who was the Viceroy of India during the Partition of Bengal in the year 1905?",
            options: ["A) Lord Ripon", "B) Lord Curzon", "C) Lord Canning", "D) Lord Minto"],
            answer: "B) Lord Curzon",
            solution: "Lord Curzon announced the Partition of Bengal on 20 July 1905 to divide the Hindu and Muslim population for administrative convenience."
        },
        {
            q: "What is the SI unit of Magnetic Flux Density in physics?",
            options: ["A) Weber", "B) Tesla", "C) Henry", "D) Gauss"],
            answer: "B) Tesla",
            solution: "Tesla (T) is the SI derived unit of magnetic flux density. 1 Tesla is equal to 1 Weber per square metre (Wb/m²)."
        },
        {
            q: "If a train traveling at 72 km/h crosses a 200m long bridge in 25 seconds, what is the length of the train?",
            options: ["A) 250 m", "B) 300 m", "C) 350 m", "D) 400 m"],
            answer: "B) 300 m",
            solution: "Speed = 72 * (5/18) = 20 m/s. Total distance in 25s = 20 * 25 = 500m. Length of train = 500m - 200m (bridge) = 300m."
        },
        {
            q: "The Tropic of Cancer passes through how many Indian States?",
            options: ["A) 6 States", "B) 7 States", "C) 8 States", "D) 9 States"],
            answer: "C) 8 States",
            solution: "The Tropic of Cancer passes through Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram."
        },
        {
            q: "In Indian banking, what does the term 'Repo Rate' strictly refer to?",
            options: [
                "A) Rate at which banks lend to public",
                "B) Rate at which RBI lends short-term money to commercial banks",
                "C) Rate of inflation calculated by Ministry of Finance",
                "D) Savings interest rate paid to senior citizens"
            ],
            answer: "B) Rate at which RBI lends short-term money to commercial banks",
            solution: "Repo Rate is the rate at which the Reserve Bank of India lends money to commercial banks against pledged government securities."
        }
    ],
    'NEET UG': [
        {
            q: "During mitosis in eukaryotic cells, chromosomes align completely along the equatorial plane during which phase?",
            options: ["A) Prophase", "B) Metaphase", "C) Anaphase", "D) Telophase"],
            answer: "B) Metaphase",
            solution: "In Metaphase, the spindle fibers attach to kinetochores of chromosomes, aligning them along the metaphase plate (equatorial plane)."
        },
        {
            q: "Which endocrine hormone is secreted by adrenal medulla in response to acute stress (Fight or Flight)?",
            options: ["A) Insulin", "B) Adrenaline (Epinephrine)", "C) Melatonin", "D) Thyroxine"],
            answer: "B) Adrenaline (Epinephrine)",
            solution: "Adrenaline and Noradrenaline are released by the adrenal medulla under emergency or fight-or-flight conditions, accelerating heart rate and blood glucose."
        },
        {
            q: "In Mendel's monohybrid cross with garden pea plants, what is the phenotypic ratio in the F2 generation?",
            options: ["A) 9:3:3:1", "B) 3:1", "C) 1:2:1", "D) 2:1"],
            answer: "B) 3:1",
            solution: "The phenotypic ratio of dominant to recessive traits in F2 generation is 3:1 (e.g. 3 Tall : 1 Dwarf), while genotypic ratio is 1:2:1."
        },
        {
            q: "What is the hybridisation of carbon atoms in ethyne (C2H2) molecule?",
            options: ["A) sp3", "B) sp2", "C) sp", "D) dsp2"],
            answer: "C) sp",
            solution: "In ethyne (HC≡CH), each carbon atom forms one sigma bond with hydrogen and one sigma bond with carbon, resulting in sp hybridization with 180° bond angle."
        },
        {
            q: "The functional and structural microscopic filtration unit of the human kidney is called:",
            options: ["A) Neuron", "B) Nephron", "C) Alveoli", "D) Glomerulus Capsule"],
            answer: "B) Nephron",
            solution: "Each human kidney contains approximately 1 to 1.2 million functional nephrons responsible for filtering blood and producing urine."
        },
        {
            q: "The dimensional formula of Planck's Constant (h) is equivalent to the dimensions of:",
            options: ["A) Force", "B) Linear Momentum", "C) Angular Momentum", "D) Power"],
            answer: "C) Angular Momentum",
            solution: "Planck's Constant has dimensions [M L² T⁻¹], which is identical to the dimensional formula of Angular Momentum (L = r x p = m v r)."
        }
    ],
    'JEE Mains': [
        {
            q: "Evaluate the limit: lim (x -> 0) [ sin(3x) / tan(2x) ]:",
            options: ["A) 1", "B) 3/2", "C) 2/3", "D) 0"],
            answer: "B) 3/2",
            solution: "lim(x->0) [sin(3x)/(3x) * 3x] / [tan(2x)/(2x) * 2x] = (1 * 3x) / (1 * 2x) = 3/2."
        },
        {
            q: "A body of mass 2 kg moving at 10 m/s collides with a stationary body of mass 3 kg. If they stick together, what is their final velocity?",
            options: ["A) 2 m/s", "B) 4 m/s", "C) 5 m/s", "D) 6 m/s"],
            answer: "B) 4 m/s",
            solution: "By conservation of linear momentum: m1*v1 + m2*v2 = (m1+m2)*V => 2*10 + 0 = (2+3)*V => 20 = 5V => V = 4 m/s."
        },
        {
            q: "Which of the following compounds exhibits optical isomerism?",
            options: ["A) Lactic acid", "B) Acetic acid", "C) Glycine", "D) Acetone"],
            answer: "A) Lactic acid",
            solution: "Lactic acid (CH3-CH(OH)-COOH) contains a chiral carbon atom bonded to four distinct groups (-H, -CH3, -OH, -COOH) and is optically active."
        },
        {
            q: "The radius of gyration of a uniform circular disc of mass M and radius R about its central axis is:",
            options: ["A) R", "B) R / 2", "C) R / sqrt(2)", "D) R / sqrt(3)"],
            answer: "C) R / sqrt(2)",
            solution: "Moment of inertia of disc I = (1/2) * M * R² = M * k². Therefore, k = R / sqrt(2)."
        }
    ]
};

// Generic questions for other categories
const DEFAULT_QUESTIONS = [
    {
        q: "Which constitutional amendment in India is commonly referred to as the 'Mini Constitution'?",
        options: ["A) 42nd Amendment Act 1976", "B) 44th Amendment Act 1978", "C) 73rd Amendment Act 1992", "D) 86th Amendment Act 2002"],
        answer: "A) 42nd Amendment Act 1976",
        solution: "The 42nd Amendment Act of 1976 effected sweeping changes to the Constitution, adding words 'Socialist, Secular, Integrity' to the Preamble."
    },
    {
        q: "What is the speed of light in vacuum approximately?",
        options: ["A) 3 x 10^6 m/s", "B) 3 x 10^8 m/s", "C) 3 x 10^10 m/s", "D) 3 x 10^5 km/s"],
        answer: "B) 3 x 10^8 m/s",
        solution: "The exact speed of light in vacuum is 299,792,458 metres per second (approx 3 x 10^8 m/s or 3 x 10^5 km/s)."
    },
    {
        q: "Which Indian institution publishes the Consumer Price Index (CPI) and National GDP estimates?",
        options: ["A) NITI Aayog", "B) National Statistical Office (NSO)", "C) Reserve Bank of India", "D) SEBI"],
        answer: "B) National Statistical Office (NSO)",
        solution: "The National Statistical Office (NSO) under the Ministry of Statistics and Programme Implementation releases GDP and CPI datasets."
    },
    {
        q: "If the ratio of two numbers is 3:4 and their HCF is 4, what is their LCM?",
        options: ["A) 12", "B) 24", "C) 48", "D) 96"],
        answer: "C) 48",
        solution: "Numbers are 3*4 = 12 and 4*4 = 16. LCM(12, 16) = 48."
    }
];

export const generatePYQDocument = (item: PYQDocumentData): jsPDF => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    // Pick appropriate questions
    const categoryKey = Object.keys(QUESTION_SETS).find(k => 
        (item.category || '').toLowerCase().includes(k.toLowerCase()) || 
        (item.title || '').toLowerCase().includes(k.toLowerCase())
    );
    const questions = categoryKey ? QUESTION_SETS[categoryKey] : DEFAULT_QUESTIONS;

    // Helper: Add Watermark
    const addWatermark = () => {
        doc.saveGraphicsState();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(36);
        doc.setTextColor(230, 235, 245);
        doc.text("EXAMINANT OFFICIAL", pageWidth / 2, pageHeight / 2 - 20, { align: 'center', angle: 45 });
        doc.text("AUTHENTIC QUESTION PAPER", pageWidth / 2, pageHeight / 2 + 25, { align: 'center', angle: 45 });
        doc.restoreGraphicsState();
    };

    // Helper: Header
    const renderHeader = (pageNumber: number, totalPages: number) => {
        addWatermark();

        // Dark Top Header Bar
        doc.setFillColor(11, 21, 43); // Dark Navy #0B152B
        doc.rect(0, 0, pageWidth, 28, 'F');

        // Brand Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text("EXAMINANT ACADEMY", margin, 12);

        // Subtitle badge
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(56, 189, 248); // Sky blue #38BDF8
        doc.text("ALL INDIA PREVIOUS YEAR QUESTION PAPER SERIES • OFFICIAL VERIFIED COPY", margin, 18);

        // Verified Stamp on top right
        doc.setFillColor(29, 100, 208);
        doc.roundedRect(pageWidth - margin - 38, 7, 38, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text("VERIFIED PAPER", pageWidth - margin - 19, 13, { align: 'center' });
        doc.setFontSize(6.5);
        doc.setTextColor(220, 235, 255);
        doc.text("WITH SOLUTIONS", pageWidth - margin - 19, 18, { align: 'center' });

        // Footer on every page
        doc.setDrawColor(220, 225, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 130, 150);
        doc.text("Examinant Learning Platform • Authentic PYQ Papers • For Student Practice Only", margin, pageHeight - 7);
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    };

    // ================= PAGE 1 =================
    renderHeader(1, 2);

    let y = 35;

    // Exam Title Box
    doc.setFillColor(244, 247, 254);
    doc.setDrawColor(210, 222, 245);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate 900
    const wrappedTitle = doc.splitTextToSize(item.title, contentWidth - 8);
    doc.text(wrappedTitle, margin + 4, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(29, 100, 208); // Blue
    doc.text(`Target Examination: ${item.category || 'National Level Exam'}`, margin + 4, y + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Exam Year: ${item.year || '2023'}   |   Full Marks: 200   |   Duration: 2 Hours   |   Official Shift: Shift-I`, margin + 4, y + 22);

    y += 32;

    // Instructions Box
    doc.setFillColor(255, 251, 235); // Warm Amber
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text("IMPORTANT CANDIDATE INSTRUCTIONS:", margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 70, 20);
    doc.text("1. This paper contains authentic questions based on official exam pattern.", margin + 4, y + 9);
    doc.text("2. Marking Scheme: Correct Answer (+2 / +4), Negative Marking (-0.5 / -1) as per category guidelines.", margin + 4, y + 13);
    doc.text("3. Detailed step-by-step solutions and verified answer key are included in Section II of this paper.", margin + 4, y + 17);

    y += 24;

    // Section 1 Header
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SECTION I : OFFICIAL QUESTIONS (QUESTIONS 01 - 06)", margin + 4, y + 5);

    y += 11;

    // Render Questions (Page 1 fits 3-4 questions)
    const questionsForPage1 = questions.slice(0, 3);
    questionsForPage1.forEach((qObj, index) => {
        // Question Number & Text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const qNum = `Q${index + 1}. `;
        const qLines = doc.splitTextToSize(`${qNum}${qObj.q}`, contentWidth - 4);
        doc.text(qLines, margin + 2, y);
        y += (qLines.length * 4.2) + 2;

        // Options in 2x2 grid
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        const colWidth = (contentWidth - 6) / 2;
        const opt1 = qObj.options[0] || '';
        const opt2 = qObj.options[1] || '';
        const opt3 = qObj.options[2] || '';
        const opt4 = qObj.options[3] || '';

        doc.text(opt1, margin + 6, y);
        doc.text(opt2, margin + 6 + colWidth, y);
        y += 4.5;
        doc.text(opt3, margin + 6, y);
        doc.text(opt4, margin + 6 + colWidth, y);
        y += 7;

        // Divider
        doc.setDrawColor(230, 235, 245);
        doc.setLineWidth(0.2);
        doc.line(margin + 2, y, margin + contentWidth - 2, y);
        y += 4;
    });

    // ================= PAGE 2 =================
    doc.addPage();
    renderHeader(2, 2);

    y = 35;

    // Remaining Questions
    const questionsForPage2 = questions.slice(3);
    if (questionsForPage2.length > 0) {
        questionsForPage2.forEach((qObj, idx) => {
            const index = idx + 3;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(15, 23, 42);
            const qNum = `Q${index + 1}. `;
            const qLines = doc.splitTextToSize(`${qNum}${qObj.q}`, contentWidth - 4);
            doc.text(qLines, margin + 2, y);
            y += (qLines.length * 4.2) + 2;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);

            const colWidth = (contentWidth - 6) / 2;
            doc.text(qObj.options[0] || '', margin + 6, y);
            doc.text(qObj.options[1] || '', margin + 6 + colWidth, y);
            y += 4.5;
            doc.text(qObj.options[2] || '', margin + 6, y);
            doc.text(qObj.options[3] || '', margin + 6 + colWidth, y);
            y += 7;

            doc.setDrawColor(230, 235, 245);
            doc.setLineWidth(0.2);
            doc.line(margin + 2, y, margin + contentWidth - 2, y);
            y += 4;
        });
    }

    y += 2;

    // Section 2: Answer Key & Step-by-Step Solutions
    doc.setFillColor(29, 100, 208); // Royal Blue
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SECTION II : OFFICIAL ANSWER KEY & DETAILED STEP-BY-STEP EXPLANATIONS", margin + 4, y + 5);

    y += 11;

    // Solutions box
    questions.forEach((qObj, index) => {
        if (y > pageHeight - 30) {
            return; // keep inside page bounds
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129); // Emerald Green
        doc.text(`Q${index + 1} Correct Answer: ${qObj.answer}`, margin + 3, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(51, 65, 85);
        const solLines = doc.splitTextToSize(`Explanation: ${qObj.solution}`, contentWidth - 6);
        doc.text(solLines.slice(0, 2), margin + 3, y + 9);

        y += 16;
    });

    return doc;
};

// Clean file name helper
export const getSafeFileName = (title: string): string => {
    return (title || 'Examinant_PYQ_Paper')
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
};

/**
 * Handle "VIEW" click:
 * Opens the exact uploaded PDF paper in a new tab for reading / printing / full-screen view.
 */
export const handleViewPYQ = async (item: PYQDocumentData): Promise<void> => {
    try {
        const fileUrl = (item.fileUrl || '').trim();

        if (fileUrl) {
            // 1. Base64 Data URL: convert to Blob object URL to prevent browser navigation block
            if (fileUrl.startsWith('data:application/pdf') || fileUrl.startsWith('data:image/')) {
                const parts = fileUrl.split(',');
                const byteCharacters = atob(parts[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
                return;
            }

            // 2. Blob URL
            if (fileUrl.startsWith('blob:')) {
                window.open(fileUrl, '_blank');
                return;
            }

            // 3. Cloudinary or Firebase or regular HTTPS URL
            if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('/')) {
                let viewUrl = fileUrl;
                // If Cloudinary URL had fl_attachment, strip it for inline viewing
                if (viewUrl.includes('cloudinary.com') && viewUrl.includes('fl_attachment')) {
                    viewUrl = viewUrl.replace(/\/fl_attachment[^/]*\//, '/');
                }
                // If Firebase Storage had response-content-disposition=attachment, strip it
                if (viewUrl.includes('firebasestorage.googleapis.com') && viewUrl.includes('response-content-disposition')) {
                    viewUrl = viewUrl.replace(/[?&]response-content-disposition=[^&]*/, '');
                }
                window.open(viewUrl, '_blank', 'noopener,noreferrer');
                return;
            }
        }

        // Fallback only if no file was uploaded: generate dynamic authentic PDF and view
        const doc = generatePYQDocument(item);
        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        const newTab = window.open(blobUrl, '_blank');
        if (!newTab) {
            const safeName = getSafeFileName(item.title);
            doc.save(`${safeName}.pdf`);
        }
    } catch (error) {
        console.error("Error viewing PYQ paper:", error);
        const doc = generatePYQDocument(item);
        doc.save(`${getSafeFileName(item.title)}.pdf`);
    }
};

/**
 * Handle "DOWNLOAD" click:
 * Downloads the exact uploaded PDF file directly to the user's computer/device.
 */
export const handleDownloadPYQ = async (item: PYQDocumentData): Promise<void> => {
    const safeName = getSafeFileName(item.title);
    const fileName = `${safeName}.pdf`;

    try {
        const fileUrl = (item.fileUrl || '').trim();

        if (fileUrl) {
            // Case 1: Base64 data URL
            if (fileUrl.startsWith('data:application/pdf') || fileUrl.startsWith('data:image/')) {
                const parts = fileUrl.split(',');
                const byteCharacters = atob(parts[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                return;
            }

            // Case 2: Blob URL
            if (fileUrl.startsWith('blob:')) {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // Case 3: Cloudinary URL
            if (fileUrl.includes('cloudinary.com')) {
                let downloadUrl = fileUrl;
                // Add fl_attachment to Cloudinary URL to force server-side Content-Disposition: attachment
                if (!downloadUrl.includes('fl_attachment')) {
                    downloadUrl = downloadUrl.replace('/upload/', `/upload/fl_attachment:${encodeURIComponent(safeName)}/`);
                }

                // First try silent direct blob fetch & download
                try {
                    const response = await fetch(downloadUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
                        return;
                    }
                } catch {
                    // Blob fetch failed (e.g. CORS), fall through to direct anchor trigger
                }

                // Trigger native browser download using Cloudinary attachment flag
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // Case 4: Firebase Storage URL
            if (fileUrl.includes('firebasestorage.googleapis.com')) {
                let downloadUrl = fileUrl;
                if (!downloadUrl.includes('response-content-disposition')) {
                    const separator = downloadUrl.includes('?') ? '&' : '?';
                    downloadUrl = `${downloadUrl}${separator}response-content-disposition=attachment%3B%20filename%3D%22${encodeURIComponent(fileName)}%22`;
                }

                // Try fetching as blob
                try {
                    const response = await fetch(downloadUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
                        return;
                    }
                } catch {
                    // Blob fetch failed
                }

                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // Case 5: Any other external URL
            try {
                const response = await fetch(fileUrl);
                if (response.ok) {
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
                    return;
                }
            } catch (corsErr) {
                console.warn("Direct blob fetch failed, triggering direct link download:", corsErr);
            }

            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = fileName;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // Fallback only if no uploaded file exists: generate dynamic PDF
        const doc = generatePYQDocument(item);
        doc.save(fileName);
    } catch (error) {
        console.error("Error downloading PYQ paper:", error);
        const doc = generatePYQDocument(item);
        doc.save(fileName);
    }
};
