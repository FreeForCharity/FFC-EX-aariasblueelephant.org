import re

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'r') as f:
    code = f.read()

# 1. Update imports
code = code.replace(
    "import { HandHelping, BookOpen, Mountain, Stars, Users, Send, X, PlusCircle, Quote, ChevronDown, ChevronUp, Image as ImageIcon, Pencil } from 'lucide-react';",
    "import { HandHelping, BookOpen, Mountain, Stars, Users, Send, X, PlusCircle, Quote, ChevronDown, ChevronUp, Image as ImageIcon, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';"
)

# 2. Update FriendEntry
code = code.replace(
    "  media: string;",
    "  media: string | string[];"
)

# 3. Update state types
code = code.replace(
    "  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);",
    "  const [selectedMedia, setSelectedMedia] = useState<{ images: string[], index: number } | null>(null);"
)
code = code.replace(
    "    media: ''\n  });",
    "    media: [] as string[]\n  });"
)

# 4. Update clear forms
code = code.replace(
    "media: '' });",
    "media: [] });"
)

# 5. Update handleEdit media setting
code = code.replace(
    "      media: entry.media\n    });",
    "      media: Array.isArray(entry.media) ? entry.media : (entry.media ? [entry.media] : [])\n    });"
)

# 6. Update handleImageChange
old_handle_image = """  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setFormData(prev => ({ ...prev, media: compressedBase64 }));
        };
      };
      reader.readAsDataURL(file);
    }
  };"""

new_handle_image = """  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
              if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
        };
        reader.readAsDataURL(file);
      });
    };

    const compressedImages = await Promise.all(files.map(processFile));
    setFormData(prev => ({ ...prev, media: [...prev.media, ...compressedImages] }));
  };"""

code = code.replace(old_handle_image, new_handle_image)

# 7. Extract getTruncatedContent to outside
old_get_trunc = """  const getTruncatedContent = (text: string, maxLimit = 120) => {
    if (text.length <= maxLimit) return { isTruncated: false, text };
    let truncated = text.slice(0, maxLimit);
    const lastPunct = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('!'), truncated.lastIndexOf('?'));
    if (lastPunct > 50) truncated = truncated.slice(0, lastPunct + 1);
    else {
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 50) truncated = truncated.slice(0, lastSpace);
    }
    return { isTruncated: true, text: truncated };
  };"""

code = code.replace(old_get_trunc, "")
code = code.replace("const STORAGE_KEY = 'circleOfFriendsEntries';", "const STORAGE_KEY = 'circleOfFriendsEntries';\n\n" + old_get_trunc.replace("  const getTruncatedContent", "const getTruncatedContent"))

# 8. Extract EntryCard
start_entry_idx = code.find("  const EntryCard = ({ entry }: { entry: FriendEntry }) => {")
end_entry_idx = code.find("  return (\n    <div className=\"min-h-screen")

entry_card_code = code[start_entry_idx:end_entry_idx]
code = code[:start_entry_idx] + code[end_entry_idx:]

new_entry_card_code = """
const EntryCardItem = ({ 
  entry, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onMediaClick 
}: { 
  entry: FriendEntry; 
  isExpanded: boolean; 
  onToggle: (id: string, e?: React.MouseEvent) => void;
  onEdit: (entry: FriendEntry, e: React.MouseEvent) => void;
  onMediaClick: (images: string[], index: number) => void;
}) => {
  const { isTruncated, text } = getTruncatedContent(entry.content, isExpanded ? 5000 : 120);
  const mediaArray = Array.isArray(entry.media) ? entry.media : (entry.media ? [entry.media] : []);
  const [imgIndex, setImgIndex] = useState(0);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex(i => (i + 1) % mediaArray.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex(i => (i - 1 + mediaArray.length) % mediaArray.length);
  };

""" + entry_card_code.replace("  const EntryCard = ({ entry }: { entry: FriendEntry }) => {\n    const isExpanded = expandedCards.includes(entry.id);\n    const { isTruncated, text } = getTruncatedContent(entry.content, isExpanded ? 5000 : 120);\n", "")

new_entry_card_code = new_entry_card_code.replace("toggleCard(entry.id, e)", "onToggle(entry.id, e)")
new_entry_card_code = new_entry_card_code.replace("handleEdit(entry, e)", "onEdit(entry, e)")

old_media_render = """          {entry.media && (
            <div className={`relative mb-6 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 transition-all duration-700 ${isExpanded ? 'min-h-[300px]' : 'h-32 opacity-80'}`}>
              <div className="absolute inset-0 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedMedia(entry.media); }} title="View Full Image"></div>
              <img src={entry.media} alt="Submission media" className="w-full h-full object-cover" />
            </div>
          )}"""

new_media_render = """          {mediaArray.length > 0 && (
            <div className={`relative mb-6 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 transition-all duration-700 ${isExpanded ? 'min-h-[300px]' : 'h-32 opacity-80 group-hover:opacity-100'}`}>
              <div className="absolute inset-0 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); onMediaClick(mediaArray, imgIndex); }} title="View Full Image"></div>
              
              <AnimatePresence initial={false}>
                <motion.img 
                  key={imgIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={mediaArray[imgIndex]} 
                  alt={`Submission media ${imgIndex + 1}`} 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              </AnimatePresence>

              {mediaArray.length > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                    {mediaArray.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}"""

new_entry_card_code = new_entry_card_code.replace(old_media_render, new_media_render)

# Put EntryCardItem back above CircleOfFriends
code = code.replace("const CircleOfFriends: React.FC = () => {", new_entry_card_code + "\nconst CircleOfFriends: React.FC = () => {")

# 9. Update references to EntryCard
code = code.replace("<EntryCard key={entry.id} entry={entry} />", "<EntryCardItem key={entry.id} entry={entry} isExpanded={expandedCards.includes(entry.id)} onToggle={toggleCard} onEdit={handleEdit} onMediaClick={(imgs, idx) => setSelectedMedia({ images: imgs, index: idx })} />")

# 10. Update Form File Input
old_file_input = """                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Picture / Media (Optional)</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                        <ImageIcon className="h-4 w-4" /> Choose File
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                      {formData.media && (
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200">
                          <img src={formData.media} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>"""

new_file_input = """                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pictures / Media (Optional)</label>
                    <div className="flex flex-col gap-4">
                      <label className="cursor-pointer px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all flex items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 self-start">
                        <ImageIcon className="h-4 w-4" /> Add Images
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                      </label>
                      
                      {formData.media.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.media.map((m, i) => (
                            <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 group">
                              <img src={m} alt={`Preview ${i}`} className="h-full w-full object-cover" />
                              <button 
                                type="button" 
                                onClick={() => setFormData(p => ({ ...p, media: p.media.filter((_, idx) => idx !== i) }))}
                                className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>"""

code = code.replace(old_file_input, new_file_input)

# 11. Update Full Screen Modal
old_fullscreen_modal = """      {/* Media Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md" 
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }} 
              className="relative max-w-5xl max-h-[90dvh] rounded-2xl overflow-hidden shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedMedia(null)} 
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
              >
                <X className="h-6 w-6" />
              </button>
              <img src={selectedMedia} alt="Expanded media" className="w-full h-full max-h-[90dvh] object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>"""

new_fullscreen_modal = """      {/* Media Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md" 
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }} 
              className="relative max-w-5xl max-h-[90dvh] rounded-2xl overflow-hidden shadow-2xl w-full h-full flex items-center justify-center" 
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedMedia(null)} 
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-30"
              >
                <X className="h-6 w-6" />
              </button>
              
              <AnimatePresence initial={false} mode="wait">
                <motion.img 
                  key={selectedMedia.index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  src={selectedMedia.images[selectedMedia.index]} 
                  alt="Expanded media" 
                  className="w-full h-full max-h-[90dvh] object-contain" 
                />
              </AnimatePresence>

              {selectedMedia.images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMedia(s => s ? { ...s, index: (s.index - 1 + s.images.length) % s.images.length } : null);
                    }} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMedia(s => s ? { ...s, index: (s.index + 1) % s.images.length } : null);
                    }} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {selectedMedia.images.map((_, i) => (
                      <button 
                        key={i} 
                        onClick={(e) => { e.stopPropagation(); setSelectedMedia(s => s ? { ...s, index: i } : null); }}
                        className={`h-2 rounded-full transition-all ${i === selectedMedia.index ? 'w-6 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-2 bg-white/40 hover:bg-white/60'}`} 
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>"""

code = code.replace(old_fullscreen_modal, new_fullscreen_modal)

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'w') as f:
    f.write(code)

