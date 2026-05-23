import sys

with open('supabase/create_summer_buddy_up.sql', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "LIKE '%@aariasblueelephant.org'" in line:
        continue
    
    if "CREATE POLICY \"Insert sub_coaches policy\" ON sub_coaches" in line:
        new_lines.append(line)
        continue
    if "FOR INSERT TO authenticated" in line and new_lines[-1].strip() == 'CREATE POLICY "Insert sub_coaches policy" ON sub_coaches':
        new_lines.append(line)
        new_lines.append("WITH CHECK (\n")
        new_lines.append("  EXISTS (\n")
        new_lines.append("    SELECT 1 FROM teams \n")
        new_lines.append("    WHERE teams.id = sub_coaches.team_id \n")
        new_lines.append("    AND teams.head_coach_id = auth.uid()\n")
        new_lines.append("  )\n")
        new_lines.append("  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')\n")
        new_lines.append(");\n")
        continue

    if "CREATE POLICY \"Insert students policy\" ON students" in line:
        new_lines.append(line)
        continue
    if "FOR INSERT TO authenticated" in line and new_lines[-1].strip() == 'CREATE POLICY "Insert students policy" ON students':
        new_lines.append(line)
        new_lines.append("WITH CHECK (\n")
        new_lines.append("  EXISTS (\n")
        new_lines.append("    SELECT 1 FROM teams \n")
        new_lines.append("    WHERE teams.id = students.team_id \n")
        new_lines.append("    AND teams.head_coach_id = auth.uid()\n")
        new_lines.append("  )\n")
        new_lines.append("  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')\n")
        new_lines.append(");\n")
        continue
        
    if "WITH CHECK (true);" in line and ("Insert sub_coaches policy" in new_lines[-2] or "Insert students policy" in new_lines[-2]):
        continue

    new_lines.append(line)

with open('supabase/create_summer_buddy_up.sql', 'w') as f:
    f.writelines(new_lines)

print("Modified create_summer_buddy_up.sql")
