import re

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'r') as f:
    code = f.read()

old_logic = """  const awardEntries: Record<string, FriendEntry[]> = {};
  AWARDS.forEach(a => awardEntries[a.title] = []);
  const generalEntries: FriendEntry[] = [];

  entries.forEach(entry => {
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
    const pA = a.priority || 23;
    const pB = b.priority || 23;
    return pA - pB;
  };
  
  generalEntries.sort(sortByPriority);
  Object.keys(awardEntries).forEach(k => awardEntries[k].sort(sortByPriority));"""

new_logic = """  const awardEntries: Record<string, FriendEntry[]> = {};
  AWARDS.forEach(a => awardEntries[a.title] = []);
  const generalEntries: FriendEntry[] = [];

  const sortByPriorityAndDate = (a: FriendEntry, b: FriendEntry) => {
    const pA = a.priority || 23;
    const pB = b.priority || 23;
    if (pA !== pB) return pA - pB;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  };

  const sortedEntries = [...entries].sort(sortByPriorityAndDate);

  sortedEntries.forEach(entry => {
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

code = code.replace(old_logic, new_logic)

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'w') as f:
    f.write(code)

