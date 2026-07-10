import React, {useEffect, useState} from 'react'
import {useParams, useNavigate} from "react-router";
import Navbar from "~/components/Navbar";
import {usePuterStore} from "~/lib/puter";
import ScoreCircle from "~/components/ScoreCircle";

type Tip = {
    type: "good" | "improve";
    tip: string;
    explanation: string;
};

type Category = {
    score: number;
    tips: Tip[];
};

type Feedback = {
    overallScore: number;
    ATS: Category;
    toneAndStyle: Category;
    content: Category;
    skills: Category;
};

const CATEGORY_LABELS: { key: keyof Omit<Feedback, "overallScore">; label: string }[] = [
    { key: "ATS", label: "ATS Compatibility" },
    { key: "toneAndStyle", label: "Tone & Style" },
    { key: "content", label: "Content" },
    { key: "skills", label: "Skills" },
];

const TipRow = ({ tip }: { tip: Tip }) => {
    const isGood = tip.type === "good";
    return (
        <div
            className={`rounded-lg p-4 border ${
                isGood ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
            }`}
        >
            <div className="flex items-center gap-2 mb-1">
                <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isGood ? "bg-green-200 text-green-800" : "bg-amber-200 text-amber-800"
                    }`}
                >
                    {isGood ? "Good" : "Improve"}
                </span>
                <span className="font-medium text-sm">{tip.tip}</span>
            </div>
            <p className="text-sm text-gray-600">{tip.explanation}</p>
        </div>
    );
};

const CategoryCard = ({ label, category }: { label: string; category: Category }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white/80 rounded-xl shadow-sm border p-5">
            <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-4">
                    <ScoreCircle score={category.score} />
                    <span className="font-semibold text-lg">{label}</span>
                </div>
                <span className="text-gray-400 text-sm">{expanded ? "Hide" : "Show"} details</span>
            </button>

            {expanded && (
                <div className="mt-4 flex flex-col gap-3">
                    {category.tips.map((tip, i) => (
                        <TipRow tip={tip} key={i} />
                    ))}
                </div>
            )}
        </div>
    );
};

const resume = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { kv, fs } = usePuterStore();

    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resumeData, setResumeData] = useState<any>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const loadResume = async () => {
            if (!id) {
                setError("No resume id provided");
                setIsFetching(false);
                return;
            }

            try {
                const raw = await kv.get(`resume:${id}`);
                if (!raw) {
                    setError("Resume not found");
                    setIsFetching(false);
                    return;
                }

                const parsed = JSON.parse(raw);
                setResumeData(parsed);

                if (parsed.imagePath) {
                    const blob = await fs.read(parsed.imagePath);
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setImageUrl(url);
                    }
                }
            } catch (err) {
                console.error("Failed to load resume:", err);
                setError("Failed to load resume data");
            } finally {
                setIsFetching(false);
            }
        };

        loadResume();
    }, [id]);

    if (isFetching) {
        return (
            <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
                <Navbar />
                <section className="main-section">
                    <h2>Loading resume feedback...</h2>
                </section>
            </main>
        );
    }

    if (error) {
        return (
            <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
                <Navbar />
                <section className="main-section">
                    <h2>{error}</h2>
                    <button className="primary-button mt-4" onClick={() => navigate('/upload')}>
                        Upload a resume
                    </button>
                </section>
            </main>
        );
    }

    const feedback: Feedback | undefined = resumeData?.feedback;

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16 flex flex-col items-center gap-4">
                    <h1>Resume Review</h1>
                    <h2>{resumeData?.companyName} — {resumeData?.jobTitle}</h2>
                    {feedback && (
                        <div className="flex flex-col items-center gap-2 mt-2">
                            <ScoreCircle score={feedback.overallScore} />
                            <span className="text-sm text-gray-500">Overall Score</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt="Resume preview"
                            className="max-w-md w-full rounded-lg shadow-lg border"
                        />
                    )}

                    <div className="flex-1 flex flex-col gap-4 w-full">
                        {feedback ? (
                            CATEGORY_LABELS.map(({ key, label }) => {
                                const category = feedback[key];
                                if (!category) return null;
                                return <CategoryCard key={key} label={label} category={category} />;
                            })
                        ) : (
                            <p>No feedback data available.</p>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}

export default resume;