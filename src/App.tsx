/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Image as ImageIcon, Download, Trash2, Loader2, 
  Mic2, ChevronDown, Sparkles, User, LayoutGrid, Plus, AlertCircle, Wand2, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

/**
 * DANH SÁCH PHONG CÁCH VÀ BỐI CẢNH DỰA TRÊN ẢNH CỦA ANH TUẤN
 */
const STYLES = {
  Nam: [
    "Nam - Áo dài gấm truyền thống, khăn xếp",
    "Nam - Vest tuxedo sang trọng, lịch lãm",
    "Nam - Áo sơ mi lụa, phong cách lãng tử",
    "Nam - Đồ bụi bặm, phong cách Rocker",
    "Nam - Áo bà ba nâu, phong cách dân dã",
    "Nam - Cổ phục truyền thống Việt Nam"
  ],
  Nữ: [
    "Nữ - Liền chị Quan họ (Áo tứ thân, nón quai thao)",
    "Nữ - Áo dài đỏ truyền thống, quần trắng, cao gót",
    "Nữ - Áo dài vàng hoa mai, phù hợp đường hoa",
    "Nữ - Áo dài gấm sang trọng",
    "Nữ - Váy midi cổ điển, phong cách tiểu thư",
    "Nữ - Áo bà ba hồng đào, dịu dàng",
    "Nữ - Kimono cách tân thời thượng"
  ]
};

const CONTEXTS = [
  "Không gian Hội Lim (Bắc Ninh), cổng đình, cờ hội",
  "Khu sông nước Hội Lim, hát Quan họ trên thuyền rồng",
  "Sân khấu phòng trà sang trọng, ánh đèn vàng mờ ảo",
  "Sân khấu nhà hát lớn cổ điển, rèm nhung đỏ",
  "Phố ông Đồ, bàn thư pháp, giấy đỏ, mực tàu",
  "Đường hoa Xuân trung tâm thành phố, tiểu cảnh Tết",
  "Cánh đồng hoa hướng dương, nắng nhẹ",
  "Phòng khách ngày Tết, cây đào/mai, mâm ngũ quả",
  "Studio phông nền trắng tối giản, ánh sáng nghệ thuật"
];

export default function TuanPhamAIApp() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [selectedStyle, setSelectedStyle] = useState(STYLES.Nam[0]);
  const [selectedContext, setSelectedContext] = useState(CONTEXTS[0]);
  const [description, setDescription] = useState('');
  const [faceSimilarity, setFaceSimilarity] = useState(95);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset style khi đổi giới tính
  useEffect(() => {
    setSelectedStyle(STYLES[gender][0]);
  }, [gender]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
      setErrorMsg('');
    }
  };

  /**
   * NÚT AI GỢI Ý MÔ TẢ - TỐI ƯU THEO Ý ANH TUẤN
   */
  const handleAiSuggest = async () => {
    if (!uploadedImage) {
      setErrorMsg("Anh Tuấn ơi, tải ảnh lên trước để em phân tích rồi gợi ý cho chuẩn nhé!");
      return;
    }
    setIsAiSuggesting(true);
    setErrorMsg('');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Dựa trên phong cách ${selectedStyle} và bối cảnh ${selectedContext}, hãy viết 1 đoạn mô tả ngắn (bằng tiếng Việt) để diễn tả thần thái người mẫu chuyên nghiệp, cách tạo dáng và ánh sáng nghệ thuật. Viết dưới 30 từ.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      setDescription(response.text || '');
    } catch (err) {
      console.error(err);
      setErrorMsg("AI đang bận một chút, anh thử lại nhé!");
    } finally {
      setIsAiSuggesting(false);
    }
  };

  /**
   * HÀM TẠO ẢNH SIÊU THỰC - GIỮ MẶT 100%
   */
  const handleGenerate = async () => {
    if (!uploadedImage) {
      setErrorMsg('Vui lòng tải ảnh chân dung.');
      return;
    }
    setIsGenerating(true);
    setResultImage(null);
    setErrorMsg('');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Extract mimeType and base64 data
      const [header, base64Data] = uploadedImage.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

      // BƯỚC 1: PHÂN TÍCH MẶT THẬT (HIDDEN)
      const analysisResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: "Describe this person's face extremely detailed for identity preservation in AI art. Focus on glasses, jawline, and unique features." },
            { inlineData: { data: base64Data, mimeType: mimeType } }
          ]
        }
      });
      const faceDetail = analysisResponse.text || "a person with standard facial features";

      // BƯỚC 2: TỐI ƯU PROMPT CHO TỶ LỆ CƠ THỂ CÂN ĐỐI (SLIM & PROPORTIONATE)
      const finalPrompt = `
        [ULTRA-HIGH-END PHOTOREALISM]
        STRICT FACE MATCH (Similarity: ${faceSimilarity}%): Keep 100% of the facial features from the reference image.
        FACIAL IDENTITY: ${faceDetail}.
        
        SCENE DESCRIPTION: ${description}.
        SUBJECT: A professional ${gender} singer ${selectedStyle} performing in ${selectedContext}.
        
        BODY PROPORTIONS: Natural, proportionate, and slim body build. Balanced shoulders and hips. NOT bulky, NOT muscular, NOT disproportioned. Maintain elegant, natural singer posture.
        CLOTHING: Perfectly tailored and fitting garment (silk/brocade weave) to accentuate the natural, slim body lines.
        
        TECHNICAL SPECS: Shot on Phase One XF, 100MP, 85mm portrait lens, f/2.8. Realistic skin pores, natural eye reflections.
        NO 3D, NO CARTON, NO ANIMATION. Must be a real photograph.
      `;

      // BƯỚC 3: GỌI MODEL TẠO ẢNH
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: finalPrompt }
          ]
        }
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setResultImage(imageUrl);
      } else {
        throw new Error("Không nhận được ảnh từ AI");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi kỹ thuật. Anh kiểm tra lại API Key hoặc Secrets nhé!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `tuan-pham-ai-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Camera className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">TUẤN PHẠM AI <span className="text-indigo-600">PRO</span></h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Wand2 className="text-indigo-600" size={20} /> THIẾT LẬP SIÊU THỰC
            </h2>

            <div className="space-y-5">
              {/* Tải ảnh */}
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-500 bg-slate-50 transition-all">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                {uploadedImage ? (
                  <div className="relative group inline-block">
                    <img src={uploadedImage} className="w-32 h-32 mx-auto rounded-xl object-cover shadow-lg" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 font-medium">
                    <Upload className="mx-auto mb-2" size={32} />
                    Tải ảnh người mẫu gốc
                  </div>
                )}
              </div>

              {/* Giới tính */}
              <div className="grid grid-cols-2 gap-3">
                {['Nam', 'Nữ'].map(g => (
                  <button 
                    key={g} 
                    onClick={() => setGender(g as 'Nam' | 'Nữ')} 
                    className={`py-3 rounded-xl font-bold transition-all ${gender === g ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-200'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Lựa chọn phong cách */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase">Phong cách ca sĩ</label>
                  <div className="relative">
                    <select 
                      value={selectedStyle} 
                      onChange={(e) => setSelectedStyle(e.target.value)} 
                      className="w-full mt-1 p-3 rounded-xl border border-slate-200 bg-white font-medium outline-none appearance-none focus:border-indigo-500"
                    >
                      {STYLES[gender].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase">Bối cảnh không gian</label>
                  <div className="relative">
                    <select 
                      value={selectedContext} 
                      onChange={(e) => setSelectedContext(e.target.value)} 
                      className="w-full mt-1 p-3 rounded-xl border border-slate-200 bg-white font-medium outline-none appearance-none focus:border-indigo-500"
                    >
                      {CONTEXTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              {/* Diễn giải thông minh */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-400 uppercase">Diễn giải thêm</label>
                  <button 
                    onClick={handleAiSuggest} 
                    disabled={isAiSuggesting || !uploadedImage} 
                    className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {isAiSuggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI GỢI Ý MÔ TẢ
                  </button>
                </div>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full p-4 rounded-xl border border-slate-200 min-h-[80px] text-sm focus:border-indigo-500 outline-none transition-all" 
                  placeholder="AI sẽ giúp anh viết mô tả nghệ thuật tại đây..." 
                />
              </div>

              {/* Thanh trượt Similarity */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                  <span>Độ giống khuôn mặt</span>
                  <span className="text-indigo-600">{faceSimilarity}%</span>
                </div>
                <input 
                  type="range" min="50" max="100" value={faceSimilarity} 
                  onChange={(e) => setFaceSimilarity(parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                />
              </div>

              {errorMsg && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={12} /> {errorMsg}</p>}

              <button 
                onClick={handleGenerate} 
                disabled={isGenerating || !uploadedImage} 
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />} 
                {isGenerating ? 'ĐANG XỬ LÝ...' : 'TẠO ẢNH NGƯỜI MẪU THẬT'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Result */}
        <div className="lg:col-span-7 bg-slate-200 rounded-[2.5rem] p-2 overflow-hidden shadow-inner border-8 border-white">
          <div className="w-full h-full min-h-[600px] bg-slate-800 rounded-[2rem] flex flex-col items-center justify-center relative shadow-2xl overflow-hidden">
            {isGenerating ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-black tracking-widest text-xs animate-pulse">AI ĐANG PHÂN TÍCH & VẼ CHÂN DUNG...</p>
              </div>
            ) : resultImage ? (
              <div className="w-full h-full relative group">
                <img src={resultImage} className="w-full h-full object-cover rounded-[2rem]" />
                <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={handleDownload}
                    className="bg-white text-indigo-600 p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Download size={24} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-600 text-center">
                <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-bold opacity-30 uppercase tracking-widest">ẢNH KẾT QUẢ SẼ XUẤT HIỆN TẠI ĐÂY</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
