import React, { useEffect, useState } from 'react';
import { VisitData, User } from '../types';
import { generateDailySummary } from '../services/geminiService';
import { Icons } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface PresentationViewProps {
  visits: VisitData[];
  onBack: () => void;
  user: User | null;
}

const PresentationView: React.FC<PresentationViewProps> = ({ visits, onBack, user }) => {
  const [summary, setSummary] = useState<string>('Generating Executive Summary with Gemini AI...');
  const [isExporting, setIsExporting] = useState(false);
  const [showAISummary, setShowAISummary] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const result = await generateDailySummary(visits, user);
        setSummary(result);
      } catch (e) {
        setSummary("Summary generation failed. Check connection.");
      }
    };
    fetchSummary();
  }, [visits, user]);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById('report-content');
    if (!element) {
      setIsExporting(false);
      return;
    }

    try {
      const pdfWorker = html2pdf.default || html2pdf;
      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `GP_Market_Report_${user?.city || 'Market'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#FFFFFF', scrollY: 0 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] } 
      };

      await new Promise(resolve => setTimeout(resolve, 800));
      await pdfWorker().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Export error:", error);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const containerClass = isExporting ? 'bg-white text-black font-sans' : 'bg-gray-900 text-white min-h-screen font-sans';
  const cardClass = isExporting ? 'bg-white border border-gray-300' : 'bg-gray-800 border border-gray-700';

  return (
    <div className={`${isExporting ? 'bg-white' : 'bg-gray-900'} overflow-y-auto min-h-screen`}>
      <div className="fixed top-4 right-4 z-50 print:hidden flex items-center gap-3">
         <button onClick={() => setShowAISummary(!showAISummary)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${showAISummary ? 'bg-gold-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
           <Icons.Sparkles /> {showAISummary ? 'AI Summary On' : 'AI Summary Off'}
         </button>
         <button onClick={onBack} className="bg-gray-800 text-white p-2.5 rounded-xl transition-colors hover:bg-gray-700"><Icons.X /></button>
         <button onClick={handleDownloadPDF} disabled={isExporting} className="bg-gold-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95">
           {isExporting ? 'Exporting...' : 'Export PDF'}
         </button>
      </div>

      <div id="report-content" className={`p-4 md:p-12 ${containerClass}`}>
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header Section */}
          <section className="flex flex-col items-center text-center border-b border-gray-200 pb-12 mb-12">
            <div className="w-16 h-16 bg-gold-500 text-white rounded-full flex items-center justify-center font-black text-2xl mb-4 shadow-lg">GP</div>
            <h1 className="text-5xl font-extrabold mb-3 text-gold-600">Market Audit Report</h1>
            <p className="text-xl opacity-80">{user?.name} | {user?.role} | {user?.city}</p>
            <p className="text-lg mt-2 font-bold text-gold-500">{new Date().toLocaleDateString()}</p>
          </section>

          {/* AI Executive Summary */}
          {showAISummary && (
            <section style={{ pageBreakInside: 'avoid' }} className="animate-fade-in">
               <h2 className="text-2xl font-bold mb-4 border-l-4 border-gold-500 pl-4">Executive Summary</h2>
               <div className={`p-8 rounded-2xl ${isExporting ? 'bg-gray-50 border border-gray-100' : 'bg-gray-800 shadow-xl'}`}>
                 <p className="text-base leading-relaxed whitespace-pre-line text-justify">{summary}</p>
               </div>
            </section>
          )}

          {/* Shop Audits */}
          <section className="space-y-10">
            <h2 className="text-2xl font-bold mb-6 border-l-4 border-gold-500 pl-4">Detailed Shop Inspections</h2>
            <div className="space-y-12">
              {visits.map((visit) => (
                <div key={visit.id} className={`rounded-2xl overflow-hidden flex flex-col ${cardClass} shadow-sm`} style={{ pageBreakInside: 'avoid' }}>
                  {/* Photo Section - Placed First */}
                  <div className={`grid gap-1 ${visit.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} bg-gray-100`}>
                    {visit.imageUrls.length > 0 ? (
                      visit.imageUrls.map((url, i) => (
                        <div key={i} className="aspect-video relative overflow-hidden">
                           <img src={url} className="w-full h-full object-cover" alt={`Section ${i+1}`} />
                        </div>
                      ))
                    ) : (
                      <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400">No Photos Available</div>
                    )}
                  </div>

                  {/* Details Section - Always Below Pictures */}
                  <div className="p-8 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div>
                        <h3 className="text-3xl font-bold text-gold-600">{visit.shopName}</h3>
                        <p className="text-sm opacity-60 flex items-center gap-1 mt-1">
                          <Icons.MapPin /> {visit.fullAddress || visit.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center bg-gold-50 px-4 py-2 rounded-xl border border-gold-100">
                          <p className="text-[10px] uppercase text-gold-600 font-bold">Stock Level</p>
                          <p className={`text-2xl font-black ${visit.stockLevel < 30 ? 'text-red-600' : 'text-green-700'}`}>{visit.stockLevel}%</p>
                        </div>
                        <div className="text-center bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                          <p className="text-[10px] uppercase text-blue-600 font-bold">Shelf Share</p>
                          <p className="text-2xl font-black text-blue-700">{visit.shelfShare || 0}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-black tracking-widest mb-1">Owner / Primary Contact</p>
                          <p className="font-bold flex items-center gap-2">
                             <Icons.User /> {visit.shopkeeperName}
                          </p>
                          <p className="text-sm flex items-center gap-2 mt-1">
                             <Icons.Phone /> {visit.shopkeeperPhone || 'No contact info'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-black tracking-widest mb-1">Available SKUs</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {visit.productsAvailable.map(p => (
                              <span key={p} className="text-[10px] bg-gold-100 text-gold-800 px-2 py-1 rounded font-bold">{p}</span>
                            ))}
                            {visit.productsAvailable.length === 0 && <span className="text-xs italic opacity-50">None detected</span>}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-black tracking-widest mb-1">AI Audit Observation</p>
                          <div className={`p-4 rounded-xl italic text-sm ${isExporting ? 'bg-gray-50' : 'bg-gray-700/50'}`}>
                            "{visit.aiInsight || 'No AI insight generated for this visit.'}"
                          </div>
                        </div>
                        {visit.competitorActivity && (
                          <div>
                            <p className="text-[10px] uppercase text-gray-400 font-black tracking-widest mb-1">Market Intel / Competitors</p>
                            <p className="text-sm">{visit.competitorActivity}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PresentationView;