import re

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'r') as f:
    code = f.read()

# Add Trash2 to imports
if 'Trash2' not in code:
    code = code.replace("import { BookOpen, Camera, ChevronDown, ChevronUp, Star, Award, Heart, Shield, GraduationCap, X, ChevronLeft, ChevronRight, Edit2, Pencil, GripVertical } from 'lucide-react';", "import { BookOpen, Camera, ChevronDown, ChevronUp, Star, Award, Heart, Shield, GraduationCap, X, ChevronLeft, ChevronRight, Edit2, Pencil, GripVertical, Trash2 } from 'lucide-react';")

# Add onDelete prop to EntryCardItem signature
old_sig = """  onToggle: (id: string, e?: React.MouseEvent) => void;
  onEdit: (entry: FriendEntry, e: React.MouseEvent) => void;
  onMediaClick: (images: string[], index: number) => void;"""
new_sig = """  onToggle: (id: string, e?: React.MouseEvent) => void;
  onEdit: (entry: FriendEntry, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onMediaClick: (images: string[], index: number) => void;"""
code = code.replace(old_sig, new_sig)

old_destruct = """  onEdit, 
  onMediaClick 
}: {"""
new_destruct = """  onEdit, 
  onDelete,
  onMediaClick 
}: {"""
code = code.replace(old_destruct, new_destruct)

# Add the Delete button in the UI next to Edit button
old_button_area = """            <button 
              onClick={(e) => onEdit(entry, e)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:text-sky-400 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>"""
new_button_area = """            <button 
              onClick={(e) => onEdit(entry, e)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:text-sky-400 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button 
              onClick={(e) => onDelete(entry.id, e)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>"""
code = code.replace(old_button_area, new_button_area)

# Implement handleDelete in CircleOfFriends
old_handleEdit = """  const handleEdit = (entry: FriendEntry, e: React.MouseEvent) => {"""
new_handleEdit = """  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this entry?')) {
      const updatedEntries = entries.filter(entry => entry.id !== id);
      await saveEntries(updatedEntries);
    }
  };

  const handleEdit = (entry: FriendEntry, e: React.MouseEvent) => {"""
code = code.replace(old_handleEdit, new_handleEdit)

# Add onDelete to the EntryCardItem instances
old_instance_1 = """<EntryCardItem key={entry.id} entry={entry} isExpanded={expandedCards.includes(entry.id)} onToggle={toggleCard} onEdit={handleEdit} onMediaClick={(imgs, idx) => setSelectedMedia({ images: imgs, index: idx })} />"""
new_instance_1 = """<EntryCardItem key={entry.id} entry={entry} isExpanded={expandedCards.includes(entry.id)} onToggle={toggleCard} onEdit={handleEdit} onDelete={handleDelete} onMediaClick={(imgs, idx) => setSelectedMedia({ images: imgs, index: idx })} />"""
code = code.replace(old_instance_1, new_instance_1)

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'w') as f:
    f.write(code)

