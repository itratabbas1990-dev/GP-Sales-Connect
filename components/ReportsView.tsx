
import React, { useMemo, useState } from 'react';
import { VisitData, ProductLine } from '../types';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Icons } from '../constants';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ReportsViewProps {
  visits: VisitData[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ visits }) => {
  const [isExporting, setIsExporting] = useState(false);

  // 1. Calculate Category Penetration (Product Availability)
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(ProductLine).forEach(p => counts[p] = 0);
    
    visits.forEach(v => {
      v.productsAvailable.forEach(p => {
        if (counts[p] !== undefined) counts[p]++;
      });
    });

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key],
      percentage: visits.length ? Math.round((counts[key] / visits.length) * 100) : 0
    })).sort((a, b) => b.value - a.value);
  }, [visits]);

  // 2. Stock Health Distribution
  const stockHealthData = useMemo(() => {
    let critical = 0; // 0-30%
    let warning = 0;  // 31-70%
    let good = 0;     // 71-100%

    visits.forEach(v => {
      if (v.stockLevel <= 30) critical++;
      else if (v.stockLevel <= 70) warning++;
      else good++;
    });

    return [
      { name: 'Good (>70%)', value: good, color: '#10B981' },
      { name: 'Warning (30-70%)', value: warning, color: '#F59E0B' },
      { name: 'Critical (<30%)', value: critical, color: '#EF4444' }
    ].filter(d => d.value > 0);
  }, [visits]);

  // 3. Regional Performance Aggregation
  const regionData = useMemo(() => {
    const map = new Map<string, { totalStock: number, totalShare: number, count: number }>();

    visits.forEach(v => {
      const loc = (v.location || 'Unknown').trim();
      const curr = map.get(loc) || { totalStock: 0, totalShare: 0, count: 0 };
      map.set(loc, {
        totalStock: curr.totalStock + v.stockLevel,
        totalShare: curr.totalShare + (v.shelfShare || 0),
        count: curr.count + 1
      });
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      avgStock: Math.round(data.totalStock / data.count),
      avgShare: Math.round(data.totalShare / data.count),
      visitCount: data.count
    })).sort((a, b) => b.avgStock - a.avgStock);
  }, [visits]);

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: High Level Summary
    const summaryData = [
      { Metric: "Total Visits", Value: visits.length },
      { Metric: "Average Market Stock", Value: `${Math.round(visits.reduce((acc, v) => acc + v.stockLevel, 0) / visits.length)}%` },
      { Metric: "Critical Stock Shops (<30%)", Value: visits.filter(v => v.stockLevel < 30).length },
      { Metric: "Report Generation Date", Value: new Date().toLocaleString() }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    // Set column widths for Summary
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Raw Visit Data (Customized Columns)
    const rawData = visits.map((v, index) => ({
      "Visit Number": index + 1,
      "Shop Name": v.shopName,
      "Area": v.location,
      "Address": v.fullAddress,
      "Available SKUs": v.skuCount || 0,
      "Stock Level %": v.stockLevel || 0,
      "Shelf Share %": v.shelfShare || 0,
      "Coordinates": v.coordinates ? `${v.coordinates.lat}, ${v.coordinates.lng}` : '',
      "Time-in": new Date(v.timestamp).toLocaleString(),
      "Contact Number": v.shopkeeperPhone
    }));

    const wsRaw = XLSX.utils.json_to_sheet(rawData);
    
    // Set column widths for readability
    wsRaw['!cols'] = [
      { wch: 12 }, // Visit Number
      { wch: 25 }, // Shop Name
      { wch: 20 }, // Area
      { wch: 35 }, // Address
      { wch: 15 }, // Available SKUs
      { wch: 15 }, // Stock Level
      { wch: 15 }, // Shelf Share
      { wch: 25 }, // Coordinates
      { wch: 22 }, // Time-in
      { wch: 18 }, // Contact Number
    ];

    XLSX.utils.book_append_sheet(wb, wsRaw, "Visit_Logs");

    // Sheet 3: Regional Analysis
    const wsRegion = XLSX.utils.json_to_sheet(regionData.map(r => ({
      "Area": r.name,
      "Total Visits": r.visitCount,
      "Avg Stock %": r.avgStock,
      "Avg Share %": r.avgShare
    })));
    wsRegion['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsRegion, "Regional_Analysis");

    XLSX.writeFile(wb, `GP_Market_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById('analytics-report-container');
    if (!element) return;

    try {
      const pdfWorker = html2pdf.default || html2pdf;
      const opt = {
        margin: [0.5, 0.5],
        filename: `GP_Analytics_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#FFFFFF' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      await new Promise(resolve => setTimeout(resolve, 500));
      await pdfWorker().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-gray-500">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <Icons.Chart />
        </div>
        <h3 className="text-xl font-bold text-gray-700">No Analytics Available</h3>
        <p>Please add market visits to generate reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24 md:pb-12">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Market Analytics</h2>
          <p className="text-gray-500">Data-driven insights for Golden Pearl Cosmetics.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Icons.Download /> Excel
          </button>
          <div className="w-px h-6 bg-gray-200"></div>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 rounded-lg transition-colors ${isExporting ? 'opacity-50 animate-pulse' : ''}`}
          >
            <Icons.FileText /> {isExporting ? 'Exporting...' : 'PDF Report'}
          </button>
        </div>
      </div>

      {/* Wrapping the report for PDF export */}
      <div id="analytics-report-container" className="space-y-8 p-1">
        
        {/* Summary Header (Only visible in PDF/High-end view) */}
        <div className="hidden print-block flex justify-between items-center border-b-2 border-gold-500 pb-4 mb-8">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-500 text-white rounded-full flex items-center justify-center font-bold">GP</div>
              <h1 className="text-2xl font-bold text-gray-800">Market Intelligence Report</h1>
           </div>
           <div className="text-right">
              <p className="text-xs font-bold text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
              <p className="text-xs text-gold-600 font-bold uppercase">Golden Pearl Cosmetics</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Category Penetration */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100" style={{ pageBreakInside: 'avoid' }}>
            <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <Icons.TrendingUp /> Product Availability Penetration
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  />
                  <Bar dataKey="value" fill="#D09032" radius={[0, 4, 4, 0]} barSize={18}>
                     {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#B47226' : '#D09032'} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Stock Health */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100" style={{ pageBreakInside: 'avoid' }}>
            <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
               <Icons.PieChart /> Market Stock Status
            </h3>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockHealthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {stockHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Regional Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ pageBreakInside: 'avoid' }}>
          <div className="p-6 border-b border-gray-100 bg-gray-50">
             <h3 className="font-bold text-gray-700 flex items-center gap-2 text-lg">
               <Icons.MapPin /> Regional Performance Metrics
             </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/50 text-gray-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Area / Location</th>
                  <th className="px-6 py-4 text-center">Audit Count</th>
                  <th className="px-6 py-4 text-center">Avg. Stock</th>
                  <th className="px-6 py-4 text-center">Shelf Share</th>
                  <th className="px-6 py-4">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regionData.map((region) => (
                  <tr key={region.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">{region.name}</td>
                    <td className="px-6 py-4 text-center text-gray-600 font-medium">{region.visitCount}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-black shadow-sm ${region.avgStock < 30 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                        {region.avgStock}%
                      </span>
                    </td>
                     <td className="px-6 py-4 text-center">
                      <span className="text-blue-600 font-bold">{region.avgShare}%</span>
                    </td>
                    <td className="px-6 py-4">
                      {region.avgStock < 30 ? (
                        <div className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] uppercase">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
                          High Alert
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase">
                          <Icons.Check /> Stable
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Competitor Feed Summary (PDF Only or Bottom of page) */}
        <div className="bg-gold-50/50 p-6 rounded-xl border border-gold-100" style={{ pageBreakInside: 'avoid' }}>
          <h3 className="font-bold text-gold-800 mb-4 flex items-center gap-2">
            <Icons.Sparkles /> Field Market Intelligence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {visits.filter(v => v.competitorActivity && v.competitorActivity !== 'None observed').slice(0, 4).map((v, i) => (
               <div key={i} className="bg-white p-3 rounded-lg border border-gold-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">{v.shopName}</p>
                  <p className="text-sm italic text-gray-700">"{v.competitorActivity}"</p>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsView;
