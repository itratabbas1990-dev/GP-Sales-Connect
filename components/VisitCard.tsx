import React, { useState } from 'react';
import { VisitData } from '../types';
import { Icons } from '../constants';
import ImageEditor from './ImageEditor';

interface VisitCardProps {
  visit: VisitData;
  onDelete: (id: string) => void;
  onUpdate: (updatedVisit: VisitData) => void;
  onEdit: () => void;
}

const VisitCard: React.FC<VisitCardProps> = ({ visit, onDelete, onUpdate, onEdit }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onUpdate({ 
        ...visit, 
        imageUrls: [...(visit.imageUrls || []), base64String] 
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAnnotation = (newImage: string) => {
    if (editingIndex !== null) {
      const updated = [...(visit.imageUrls || [])];
      updated[editingIndex] = newImage;
      onUpdate({ ...visit, imageUrls: updated });
    }
    setEditingIndex(null);
  };

  const deletePhoto = (idx: number) => {
    onUpdate({
      ...visit,
      imageUrls: visit.imageUrls.filter((_, i) => i !== idx)
    });
  };

  const hasPhotos = visit.imageUrls && visit.imageUrls.length > 0;

  return (
    <>
      {editingIndex !== null && visit.imageUrls?.[editingIndex] && (
        <ImageEditor initialImage={visit.imageUrls[editingIndex]} onSave={handleSaveAnnotation} onCancel={() => setEditingIndex(null)} />
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col hover:shadow-lg transition-shadow">
        <div className="flex h-full">
          {/* Collage Column */}
          <div className="w-1/3 bg-gray-100 relative min-h-[160px] shrink-0">
            {!hasPhotos ? (
              <label className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-200">
                <Icons.Camera />
                <span className="text-[10px] font-bold mt-1">Add Photo</span>
                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
              </label>
            ) : (
              <div className={`grid h-full w-full ${visit.imageUrls.length > 1 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1'}`}>
                {visit.imageUrls.map((url, i) => (
                  <div key={i} className="relative border-[0.5px] border-white group overflow-hidden">
                    <img src={url} className="w-full h-full object-cover" alt="Section" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                      <button onClick={() => setEditingIndex(i)} className="p-1 bg-white rounded-full text-gold-600 scale-75"><Icons.Edit /></button>
                      <button onClick={() => deletePhoto(i)} className="p-1 bg-red-500 rounded-full text-white scale-75"><Icons.Trash /></button>
                    </div>
                  </div>
                ))}
                {visit.imageUrls.length < 4 && (
                  <label className="flex items-center justify-center bg-gold-50 text-gold-500 cursor-pointer hover:bg-gold-100">
                    <Icons.Plus />
                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            )}
          </div>

          <div className="w-2/3 p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800 leading-tight line-clamp-1">{visit.shopName}</h3>
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                    className="text-gold-600 hover:text-gold-700 p-1 bg-gold-50 rounded transition-colors"
                    title="Edit Report"
                  >
                    <Icons.Edit />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(visit.id); }} 
                    className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded transition-colors"
                    title="Delete Report"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                 <p className="text-xs text-gold-600 font-bold">{visit.shopkeeperName || 'No Owner Info'}</p>
                 {visit.coordinates && (
                   <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">GPS Tagged</span>
                 )}
              </div>
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">
                {visit.location}
              </p>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {visit.productsAvailable.slice(0, 3).map(p => (
                  <span key={p} className="text-[8px] bg-gold-50 text-gold-700 px-1 py-0.5 rounded border border-gold-200">{p}</span>
                ))}
                {visit.productsAvailable.length > 3 && <span className="text-[8px] text-gray-400">+{visit.productsAvailable.length - 3}</span>}
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-2 flex justify-between items-end">
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold">Stock</p>
                <p className={`font-bold text-sm ${visit.stockLevel < 30 ? 'text-red-500' : 'text-green-600'}`}>{visit.stockLevel}%</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-400 uppercase font-bold">Share</p>
                <p className="text-blue-500 font-bold text-sm">{visit.shelfShare || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VisitCard;