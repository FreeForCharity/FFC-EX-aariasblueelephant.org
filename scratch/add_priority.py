import re

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'r') as f:
    code = f.read()

# 1. Update FriendEntry
code = code.replace(
    "  media: string | string[];\n  date: string;",
    "  media: string | string[];\n  priority?: number;\n  date: string;"
)

# 2. Update formData initialization
code = code.replace(
    "    media: [] as string[]\n  });",
    "    media: [] as string[],\n    priority: 1\n  });"
)

# 3. Update handleOpenModal & handleSubmit
code = code.replace(
    "media: [] });",
    "media: [], priority: 1 });"
)

# 4. Update handleEdit
old_edit = """    setFormData({
      name: entry.name,
      grade: entry.grade,
      school: entry.school,
      teacher: entry.teacher,
      category: entry.category,
      content: entry.content,
      media: Array.isArray(entry.media) ? entry.media : (entry.media ? [entry.media] : [])
    });"""

new_edit = """    setFormData({
      name: entry.name,
      grade: entry.grade,
      school: entry.school,
      teacher: entry.teacher,
      category: entry.category,
      content: entry.content,
      media: Array.isArray(entry.media) ? entry.media : (entry.media ? [entry.media] : []),
      priority: entry.priority || 1
    });"""

code = code.replace(old_edit, new_edit)

# 5. Add Sorting Logic
old_sort_spot = """  entries.forEach(entry => {
    if (AWARDS.some(a => a.title === entry.category)) {
      if (awardEntries[entry.category].length < 2) {
        awardEntries[entry.category].push(entry);
      } else {
        generalEntries.push(entry);
      }
    } else {
      generalEntries.push(entry);
    }
  });"""

new_sort_spot = """  entries.forEach(entry => {
    if (AWARDS.some(a => a.title === entry.category)) {
      if (awardEntries[entry.category].length < 2) {
        awardEntries[entry.category].push(entry);
      } else {
        generalEntries.push(entry);
      }
    } else {
      generalEntries.push(entry);
    }
  });

  const sortByPriority = (a: FriendEntry, b: FriendEntry) => {
    const pA = a.priority || 1;
    const pB = b.priority || 1;
    return pA - pB;
  };
  
  generalEntries.sort(sortByPriority);
  Object.keys(awardEntries).forEach(k => awardEntries[k].sort(sortByPriority));"""

code = code.replace(old_sort_spot, new_sort_spot)

# 6. Update Form UI
old_category = """                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category / Award</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>"""

new_category = """                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category / Award</label>
                      <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Display Priority (1 = First)</label>
                      <input type="number" min="1" required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 1})} />
                    </div>
                  </div>"""

code = code.replace(old_category, new_category)

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'w') as f:
    f.write(code)

