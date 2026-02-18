import React, { useRef, useEffect, useState } from 'react';
import { Icons } from '../constants';

interface ImageEditorProps {
  initialImage: string;
  onSave: (newImage: string) => void;
  onCancel: () => void;
}

type Tool = 'pen' | 'highlighter' | 'rect' | 'circle' | 'text';

const ImageEditor: React.FC<ImageEditorProps> = ({ initialImage, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#D09032'); // Default Gold
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = initialImage;
    img.onload = () => {
      // Fit canvas to container but maintain aspect ratio
      const containerWidth = containerRef.current?.clientWidth || 600;
      const scale = containerWidth / img.width;
      const h = img.height * scale;
      
      canvas.width = containerWidth;
      canvas.height = h;

      ctx.drawImage(img, 0, 0, containerWidth, h);
    };
  }, [initialImage]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save snapshot for shapes (so we can clear and redraw while dragging)
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    
    const pos = getPos(e);
    setStartPos(pos);
    setIsDrawing(true);

    if (activeTool === 'text') {
       // For text, we handle click immediately, not drag
       setIsDrawing(false);
       const text = prompt("Enter text:", "");
       if (text) {
         ctx.font = "bold 20px sans-serif";
         ctx.fillStyle = color;
         ctx.shadowColor = "rgba(0,0,0,0.5)";
         ctx.shadowBlur = 4;
         ctx.fillText(text, pos.x, pos.y);
       }
       return;
    }

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    // Setup styles
    ctx.strokeStyle = color;
    ctx.lineWidth = activeTool === 'highlighter' ? 15 : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (activeTool === 'highlighter') {
      ctx.globalAlpha = 0.4;
    } else {
      ctx.globalAlpha = 1.0;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !snapshot) return;

    const currPos = getPos(e);

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      ctx.lineTo(currPos.x, currPos.y);
      ctx.stroke();
    } else {
      // For shapes, restore snapshot then draw new shape
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      
      const w = currPos.x - startPos.x;
      const h = currPos.y - startPos.y;

      if (activeTool === 'rect') {
        ctx.rect(startPos.x, startPos.y, w, h);
      } else if (activeTool === 'circle') {
         const radius = Math.sqrt(w*w + h*h);
         ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      }
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/jpeg', 0.8));
    }
  };

  const tools: { id: Tool; icon: any; label: string }[] = [
    { id: 'pen', icon: Icons.Pen, label: 'Pen' },
    { id: 'highlighter', icon: Icons.Highlighter, label: 'Highlight' },
    { id: 'rect', icon: Icons.Square, label: 'Box' },
    { id: 'circle', icon: Icons.Circle, label: 'Circle' },
    { id: 'text', icon: Icons.Type, label: 'Text' },
  ];

  const colors = ['#D09032', '#EF4444', '#10B981', '#3B82F6', '#FFFFFF', '#000000'];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Toolbar */}
      <div className="bg-gray-800 w-full max-w-4xl p-4 rounded-t-xl flex flex-wrap gap-4 items-center justify-between border-b border-gray-700">
        <div className="flex gap-2">
          {tools.map(tool => (
             <button
               key={tool.id}
               type="button"
               onClick={() => setActiveTool(tool.id)}
               className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${activeTool === tool.id ? 'bg-gold-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
             >
               <tool.icon />
               <span className="hidden sm:inline">{tool.label}</span>
             </button>
          ))}
        </div>
        
        <div className="flex gap-2 items-center">
           <div className="h-6 w-px bg-gray-600 mx-2"></div>
           {colors.map(c => (
             <button
               key={c}
               type="button"
               onClick={() => setColor(c)}
               className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
               style={{ backgroundColor: c }}
             />
           ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="bg-gray-900 w-full max-w-4xl flex-1 flex items-center justify-center overflow-hidden border-x border-gray-700 relative">
         <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="cursor-crosshair shadow-2xl"
         />
         <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
           {activeTool === 'text' ? 'Click to add text' : 'Drag to draw'}
         </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-800 w-full max-w-4xl p-4 rounded-b-xl flex justify-between border-t border-gray-700">
         <button 
           onClick={onCancel}
           className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 font-medium flex items-center gap-2"
         >
           <Icons.X /> Cancel
         </button>
         <button 
           onClick={handleSave}
           className="px-6 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-white font-bold shadow-lg flex items-center gap-2"
         >
           <Icons.Check /> Save Annotation
         </button>
      </div>
    </div>
  );
};

export default ImageEditor;