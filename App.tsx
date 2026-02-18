
import React, { useState, useRef, useEffect } from 'react';
import { VisitData, ProductLine, User } from './types';
import VisitForm from './components/VisitForm';
import PresentationView from './components/PresentationView';
import VisitCard from './components/VisitCard';
import ReportsView from './components/ReportsView';
import LoginView from './components/LoginView';
import { Icons } from './constants';
import { downloadTemplate, parseExcel } from './services/excelService';
// @ts-ignore
import { get, set, del, clear } from 'idb-keyval';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'form' | 'presentation' | 'reports'>('dashboard');
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [editingVisit, setEditingVisit] = useState<VisitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Load data from IndexedDB on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [savedUser, savedVisits] = await Promise.all([
          get('gp_user'),
          get('gp_visits')
        ]);
        
        if (savedUser) setCurrentUser(savedUser);
        if (savedVisits && Array.isArray(savedVisits)) setVisits(savedVisits);
      } catch (err) {
        console.error("Failed to load persistent data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Persist visits whenever they change
  useEffect(() => {
    if (!isLoading) {
      set('gp_visits', visits).catch(err => console.error("Failed to save visits:", err));
    }
  }, [visits, isLoading]);

  // Persist user whenever they change
  useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        set('gp_user', currentUser).catch(err => console.error("Failed to save user:", err));
      } else {
        del('gp_user').catch(err => console.error("Failed to clear user:", err));
      }
    }
  }, [currentUser, isLoading]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-gold-400">Loading Sales Connect...</p>
      </div>
    );
  }

  // If not logged in, show login screen
  if (!currentUser) {
    return <LoginView onLogin={setCurrentUser} />;
  }

  // Calculate high-level stats
  const totalVisits = visits.length;
  const avgStock = visits.length > 0 ? Math.round(visits.reduce((acc, curr) => acc + curr.stockLevel, 0) / visits.length) : 0;
  const lowStockCount = visits.filter(v => v.stockLevel < 30).length;

  const handleSaveVisit = (visit: VisitData) => {
    const exists = visits.some(v => v.id === visit.id);
    if (exists) {
      setVisits(prev => prev.map(v => v.id === visit.id ? visit : v));
    } else {
      setVisits(prev => [visit, ...prev]);
    }
    setEditingVisit(null);
    setView('dashboard');
  };

  const handleUpdateVisit = (updatedVisit: VisitData) => {
    setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
  };

  const startEditVisit = (visit: VisitData) => {
    setEditingVisit(visit);
    setView('form');
  };

  const deleteVisit = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this visit report?")) {
      const updatedVisits = visits.filter(v => v.id !== id);
      setVisits(updatedVisits);
      await set('gp_visits', updatedVisits); // Force immediate backup update
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm("WARNING: This will delete ALL visit reports and local data. This action cannot be undone. Are you sure?")) {
       await clear();
       setVisits([]);
       setCurrentUser(null);
       window.location.reload();
    }
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const newVisits = await parseExcel(file);
      setVisits(prev => [...newVisits, ...prev]);
      alert(`Successfully imported ${newVisits.length} visits!`);
    } catch (err) {
      console.error(err);
      alert("Failed to parse Excel file.");
    }
    if (excelInputRef.current) excelInputRef.current.value = "";
  };

  if (view === 'presentation') {
    return <PresentationView visits={visits} onBack={() => setView('dashboard')} user={currentUser} />;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex bg-gray-900 text-white w-64 p-6 flex-col h-full shrink-0 shadow-xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center font-bold text-gray-900 shadow-lg">GP</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Golden Pearl</h1>
            <p className="text-xs text-gold-400">Sales Connect</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => { setView('dashboard'); setEditingVisit(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-gold-500 text-white font-medium shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <Icons.FileText /> Dashboard
          </button>
          <button 
            onClick={() => { setView('reports'); setEditingVisit(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'reports' ? 'bg-gold-500 text-white font-medium shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <Icons.PieChart /> Analytics
          </button>
          <button 
            onClick={() => { setView('form'); setEditingVisit(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'form' ? 'bg-gold-500 text-white font-medium shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <Icons.Plus /> New Visit
          </button>
          <button 
            onClick={() => { setView('presentation'); setEditingVisit(null); }}
            disabled={visits.length === 0}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'presentation' ? 'bg-gold-500 text-white font-medium shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50'}`}
          >
            <Icons.Chart /> Presentation
          </button>
        </nav>

        <div className="mt-8 mb-4 space-y-2">
          <button onClick={downloadTemplate} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-700 hover:text-gold-400">
            <Icons.Download /> Template
          </button>
          <button onClick={() => excelInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-700 hover:text-gold-400">
            <Icons.Upload /> Upload Excel
          </button>
          <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
        </div>

        <div className="pt-6 border-t border-gray-700 text-sm text-gray-400">
          <p className="flex items-center gap-2 text-white font-medium mb-1"><Icons.User /> {currentUser.name}</p>
          <p className="text-xs text-gold-400">{currentUser.role} | {currentUser.city}</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setCurrentUser(null)} className="text-xs text-white bg-gray-800 px-3 py-1.5 rounded hover:bg-gray-700">Logout</button>
            <button onClick={handleClearAllData} className="text-xs text-red-400 bg-gray-800 px-3 py-1.5 rounded hover:bg-gray-700">Clear</button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0 h-full relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-gray-900 text-white p-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center font-bold text-gray-900 text-xs">GP</div>
               <span className="font-bold text-lg">Sales Connect</span>
             </div>
             <button onClick={() => setView('presentation')} disabled={visits.length === 0} className="text-gold-400 disabled:opacity-30">
                <Icons.Chart />
             </button>
        </header>

        <div className="p-4 md:p-8">
          {view === 'form' ? (
            <VisitForm 
              initialData={editingVisit || undefined}
              onAddVisit={handleSaveVisit} 
              onCancel={() => { setView('dashboard'); setEditingVisit(null); }} 
            />
          ) : view === 'reports' ? (
            <ReportsView visits={visits} />
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gold-500">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Visits</p>
                  <p className="text-2xl font-bold text-gray-800">{totalVisits}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Avg Stock</p>
                  <p className="text-2xl font-bold text-gray-800">{avgStock}%</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-800">{lowStockCount}</p>
                </div>
              </div>

              {/* Visit List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
                  <button onClick={() => { setView('form'); setEditingVisit(null); }} className="bg-gold-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">+ Add Visit</button>
                </div>

                {visits.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500 border border-dashed border-gray-300">
                    <Icons.Camera />
                    <p className="mt-2">No visits yet. Start by capturing a shelf photo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {visits.map(v => (
                      <VisitCard 
                        key={v.id} 
                        visit={v} 
                        onDelete={deleteVisit} 
                        onUpdate={handleUpdateVisit} 
                        onEdit={() => startEditVisit(v)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => { setView('dashboard'); setEditingVisit(null); }} className={`flex flex-col items-center gap-1 p-2 w-16 ${view === 'dashboard' ? 'text-gold-600' : 'text-gray-400'}`}>
          <Icons.FileText />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <div className="relative -top-6">
          <button onClick={() => { setView('form'); setEditingVisit(null); }} className="w-14 h-14 bg-gold-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white active:scale-95 transition-transform">
             <Icons.Plus />
          </button>
        </div>
        <button onClick={() => { setView('reports'); setEditingVisit(null); }} className={`flex flex-col items-center gap-1 p-2 w-16 ${view === 'reports' ? 'text-gold-600' : 'text-gray-400'}`}>
          <Icons.PieChart />
          <span className="text-[10px] font-bold">Analytics</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
