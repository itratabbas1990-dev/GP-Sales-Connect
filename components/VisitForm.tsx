
import React, { useState, useRef, useEffect } from 'react';
import { VisitData, ProductLine } from '../types';
import { Icons } from '../constants';
import { analyzeShopImage } from '../services/geminiService';
import ImageEditor from './ImageEditor';

interface VisitFormProps {
  initialData?: VisitData;
  onAddVisit: (visit: VisitData) => void;
  onCancel: () => void;
}

const VisitForm: React.FC<VisitFormProps> = ({ initialData, onAddVisit, onCancel }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<VisitData>>(initialData || {
    shopName: '',
    shopkeeperName: '',
    shopkeeperPhone: '',
    location: '',
    fullAddress: '',
    notes: '',
    competitorActivity: '',
    stockLevel: 0,
    shelfShare: 0,
    skuCount: 0,
    productsAvailable: [],
    imageUrls: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only fetch location automatically for new visits
    if (!initialData) {
      fetchLocation();
    }
  }, [initialData]);

  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setFormData(prev => ({ ...prev, coordinates: coords }));
        setLocationLoading(false);
        fetchAddressFromCoords(coords.lat, coords.lng);
      },
      (error) => {
        console.error("GPS Error:", error);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    setAddressLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.suburb || '';
        const street = addr.road || '';
        const house = addr.house_number || '';
        const neighbourhood = addr.neighbourhood || addr.suburb || '';
        
        setFormData(prev => ({
          ...prev,
          location: city || prev.location,
          fullAddress: [house, street, neighbourhood].filter(Boolean).join(', ') || prev.fullAddress
        }));
      }
    } catch (err) {
      console.error("Address fetch failed:", err);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), base64String]
      }));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runAnalysis = async () => {
    if (!formData.imageUrls || formData.imageUrls.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const base64List = formData.imageUrls.map(img => img.split(',')[1]);
      const analysis = await analyzeShopImage(base64List);
      setFormData(prev => ({
        ...prev,
        productsAvailable: analysis.products,
        stockLevel: analysis.stockEstimate,
        shelfShare: analysis.shelfShare,
        skuCount: analysis.skuCount,
        aiInsight: analysis.description
      }));
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnnotateSave = (newImage: string) => {
    if (editingIndex !== null && formData.imageUrls) {
      const updated = [...formData.imageUrls];
      updated[editingIndex] = newImage;
      setFormData(prev => ({ ...prev, imageUrls: updated }));
    }
    setEditingIndex(null);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls?.filter((_, i) => i !== index)
    }));
  };

  const toggleProduct = (product: ProductLine) => {
    setFormData(prev => {
      const current = prev.productsAvailable || [];
      if (current.includes(product)) {
        return { ...prev, productsAvailable: current.filter(p => p !== product) };
      } else {
        return { ...prev, productsAvailable: [...current, product] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shopName || !formData.location) return;

    const newVisit: VisitData = {
      id: formData.id || Date.now().toString(),
      shopName: formData.shopName,
      shopkeeperName: formData.shopkeeperName || '',
      shopkeeperPhone: formData.shopkeeperPhone || '',
      location: formData.location,
      fullAddress: formData.fullAddress || '',
      timestamp: formData.timestamp || Date.now(),
      imageUrls: formData.imageUrls || [],
      notes: formData.notes || '',
      competitorActivity: formData.competitorActivity || 'None observed',
      stockLevel: formData.stockLevel || 0,
      shelfShare: formData.shelfShare || 0,
      skuCount: formData.skuCount || 0,
      productsAvailable: formData.productsAvailable || [],
      aiInsight: formData.aiInsight,
      coordinates: formData.coordinates
    };

    onAddVisit(newVisit);
  };

  return (
    <>
      {editingIndex !== null && formData.imageUrls?.[editingIndex] && (
        <ImageEditor 
          initialImage={formData.imageUrls[editingIndex]} 
          onSave={handleAnnotateSave} 
          onCancel={() => setEditingIndex(null)} 
        />
      )}
      
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto border-t-4 border-gold-500 animate-fade-in mb-24 md:mb-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Icons.MapPin /> {initialData ? 'Edit Market Visit' : 'Market Visit Entry'}
          </h2>
          {formData.coordinates ? (
            <div className="flex flex-col items-end">
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                GPS Active
              </span>
            </div>
          ) : (
            <button type="button" onClick={fetchLocation} className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-gold-50 text-gold-600 border-gold-200">
              {locationLoading ? 'Locating...' : 'Enable GPS'}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Shelf Photos (Capture all sections)</label>
            <div className="grid grid-cols-2 gap-2">
              {formData.imageUrls?.map((url, idx) => (
                <div key={idx} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={url} className="w-full h-full object-cover" alt={`Section ${idx + 1}`} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => setEditingIndex(idx)} className="p-1.5 bg-white rounded-full text-gold-600 shadow"><Icons.Edit /></button>
                    <button type="button" onClick={() => removeImage(idx)} className="p-1.5 bg-red-500 rounded-full text-white shadow"><Icons.Trash /></button>
                  </div>
                </div>
              ))}
              {(formData.imageUrls?.length || 0) < 4 && (
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video border-2 border-dashed border-gold-300 rounded-lg flex flex-col items-center justify-center bg-gold-50/30 hover:bg-gold-50 transition-colors"
                >
                  <Icons.Camera />
                  <span className="text-xs font-bold mt-1">Capture Section</span>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                </button>
              )}
            </div>

            {formData.imageUrls && formData.imageUrls.length > 0 && (
              <button 
                type="button" 
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className={`w-full mt-2 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isAnalyzing ? 'bg-gray-100 text-gray-400' : 'bg-gold-100 text-gold-700 hover:bg-gold-200'}`}
              >
                <Icons.Sparkles /> {isAnalyzing ? 'Analyzing all frames...' : 'Analyze Shelf Layout (AI)'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
              <input required type="text" value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none" placeholder="e.g. Al-Madina Cosmetics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shopkeeper Name</label>
              <input type="text" value={formData.shopkeeperName} onChange={e => setFormData({...formData, shopkeeperName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none" placeholder="Name of owner" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input type="tel" value={formData.shopkeeperPhone} onChange={e => setFormData({...formData, shopkeeperPhone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none" placeholder="03XX-XXXXXXX" />
            </div>
            <div className={addressLoading ? "animate-pulse" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area / City</label>
              <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none" placeholder="e.g. Liberty, Lahore" />
            </div>
            <div className={`col-span-1 md:col-span-2 ${addressLoading ? "animate-pulse" : ""}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Address</label>
              <textarea rows={2} value={formData.fullAddress} onChange={e => setFormData({...formData, fullAddress: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none" placeholder="e.g. Street #2, Near Main Gate" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Golden Pearl Brand Categories</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(ProductLine).map(product => (
                <button
                  key={product}
                  type="button"
                  onClick={() => toggleProduct(product)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    formData.productsAvailable?.includes(product)
                      ? 'bg-gold-500 text-white border-gold-500 shadow-md'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gold-400'
                  }`}
                >
                  {product}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Visible SKUs</label>
              <input type="number" min="0" value={formData.skuCount} onChange={e => setFormData({...formData, skuCount: parseInt(e.target.value)})} className="w-full px-2 py-2 bg-white border border-gray-300 rounded-md focus:ring-gold-500 text-sm" />
            </div>
             <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Stock Level %</label>
              <input type="number" min="0" max="100" value={formData.stockLevel} onChange={e => setFormData({...formData, stockLevel: parseInt(e.target.value)})} className="w-full px-2 py-2 bg-white border border-gray-300 rounded-md focus:ring-gold-500 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Shelf Share %</label>
              <input type="number" min="0" max="100" value={formData.shelfShare} onChange={e => setFormData({...formData, shelfShare: parseInt(e.target.value)})} className="w-full px-2 py-2 bg-white border border-gray-300 rounded-md focus:ring-gold-500 text-sm" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 shadow-md font-bold">
               {initialData ? 'Update Report' : 'Save Report'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default VisitForm;
