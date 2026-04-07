#!/usr/bin/env python3
"""
SPX Mesh Editor — Master inline style migration
Runs across all JSX files, replaces style={{}} with className equivalents
Appends generated CSS to spx-app.css
"""
import os, re, shutil, hashlib

SRC_DIR = "/workspaces/spxmesh3/src"
CSS_OUT  = "/workspaces/spxmesh3/src/styles/spx-app.css"

# ── CSS class registry ─────────────────────────────────────────────────────
css_classes = {}   # style_string -> class_name
css_rules   = []   # final CSS rules

def style_to_class(style_str):
    """Convert a style object string to a unique CSS class name and rule."""
    key = style_str.strip()
    if key in css_classes:
        return css_classes[key]
    # Generate short hash-based class name
    h = hashlib.md5(key.encode()).hexdigest()[:6]
    cls = f"spx-s-{h}"
    css_classes[key] = cls
    # Convert JS style props to CSS
    css = js_style_to_css(key)
    if css:
        css_rules.append(f".{cls} {{ {css} }}")
    return cls

def js_style_to_css(style_str):
    """Convert JS style object string to CSS declarations."""
    # Parse key:value pairs
    props = []
    # Remove outer braces if present
    s = style_str.strip().strip('{}').strip()
    # Split on commas not inside parens/quotes
    parts = re.split(r',(?![^()]*\))', s)
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Match key: value
        m = re.match(r'^([a-zA-Z]+)\s*:\s*(.+)$', part)
        if not m:
            continue
        prop, val = m.group(1).strip(), m.group(2).strip()
        # Convert camelCase to kebab-case
        css_prop = re.sub(r'([A-Z])', r'-\1', prop).lower()
        # Clean up value — remove quotes
        val = val.strip('"\'').strip()
        # Skip dynamic values (contains variables/expressions)
        if any(c in val for c in ['${', '{', '}', '=>', 'props.', 'state.', 'this.']):
            return None
        props.append(f"{css_prop}: {val}")
    return '; '.join(props)

# ── Known static inline style patterns → CSS class mappings ───────────────
# These are hardcoded mappings for the most common patterns found in the codebase
KNOWN_MAPPINGS = {
    # ProfessionalShell tool strip divider
    '{width:2,height:1,background:"#3a3a3a",margin:"4px 4px"}':
        ('spx-tool-divider', '.spx-tool-divider { width: 2px; height: 1px; background: #3a3a3a; margin: 4px; }'),
    # ProfessionalShell tool buttons
    '{width:32,height:32,background:"transparent",border:"none",borderRadius:4,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#aaa",padding:4}':
        ('spx-tool-btn', '.spx-tool-btn { width: 32px; height: 32px; background: transparent; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #aaa; padding: 4px; }'),
    # Common panel containers
    '{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}':
        ('spx-panel-col', '.spx-panel-col { display: flex; flex-direction: column; height: 100%; overflow: hidden; }'),
    '{display:"flex",flexDirection:"column",gap:8,padding:8}':
        ('spx-panel-body', '.spx-panel-body { display: flex; flex-direction: column; gap: 8px; padding: 8px; }'),
    '{flex:1,overflowY:"auto"}':
        ('spx-panel-scroll', '.spx-panel-scroll { flex: 1; overflow-y: auto; }'),
    '{flex:1,overflow:"auto"}':
        ('spx-panel-scroll', '.spx-panel-scroll { flex: 1; overflow-y: auto; }'),
    # Common row layouts
    '{display:"flex",alignItems:"center",gap:8}':
        ('spx-row', '.spx-row { display: flex; align-items: center; gap: 8px; }'),
    '{display:"flex",alignItems:"center",gap:4}':
        ('spx-row-sm', '.spx-row-sm { display: flex; align-items: center; gap: 4px; }'),
    '{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px"}':
        ('spx-row-between', '.spx-row-between { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; }'),
    # Common button styles
    '{background:"none",border:"none",color:"#8b949e",cursor:"pointer",fontSize:16,lineHeight:1}':
        ('spx-close-btn', '.spx-close-btn { background: none; border: none; color: #8b949e; cursor: pointer; font-size: 16px; line-height: 1; }'),
    # Section headers
    '{padding:"6px 10px",borderBottom:"1px solid #21262d",background:"#161b22",flexShrink:0}':
        ('spx-section-header', '.spx-section-header { padding: 6px 10px; border-bottom: 1px solid #21262d; background: #161b22; flex-shrink: 0; }'),
    # Full height flex col panels
    '{position:"fixed",top:0,right:0,width:340,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}':
        ('spx-fixed-panel-r340', '.spx-fixed-panel-r340 { position: fixed; top: 0; right: 0; width: 340px; height: 100vh; z-index: 60; overflow: hidden; display: flex; flex-direction: column; }'),
    # Canvas/viewport overlays
    '{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}':
        ('spx-fullscreen-panel', '.spx-fullscreen-panel { position: absolute; inset: 0; z-index: 80; background: #06060f; display: flex; flex-direction: column; }'),
}

def get_all_jsx_files(src_dir):
    files = []
    for root, dirs, filenames in os.walk(src_dir):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist']]
        for f in filenames:
            if f.endswith('.jsx'):
                files.append(os.path.join(root, f))
    return sorted(files)

def extract_inline_style(content, pos):
    """Extract the full style={{ ... }} expression starting at pos."""
    # Find the opening {{
    start = content.find('{{', pos)
    if start == -1:
        return None, -1
    depth = 0
    i = start
    in_str = False
    str_char = None
    while i < len(content):
        c = content[i]
        if in_str:
            if c == str_char and content[i-1] != '\\':
                in_str = False
        elif c in ('"', "'", '`'):
            in_str = True
            str_char = c
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return content[start:i+1], start
        i += 1
    return None, -1

def has_dynamic_value(style_str):
    """Check if style string contains dynamic JS expressions."""
    # Remove string literals first
    s = re.sub(r'"[^"]*"', '""', style_str)
    s = re.sub(r"'[^']*'", "''", s)
    # Check for dynamic patterns
    dynamic_patterns = [
        r'\$\{',           # template literals
        r'\b\w+\s*\?',     # ternary
        r'=>',             # arrow functions
        r'\bprops\.',      # props access
        r'\bstate\.',      # state access
        r'\bthis\.',       # this access
        r'\b[a-z][a-zA-Z]*\s*\(',  # function calls
        r'\b[a-z][a-zA-Z]*\s*\+',  # string concat with var
        r'\|\|',           # logical or
        r'&&',             # logical and
    ]
    for p in dynamic_patterns:
        if re.search(p, s):
            return True
    return False

def migrate_file(filepath):
    """Migrate a single JSX file, replacing inline styles with classNames."""
    with open(filepath) as f:
        content = f.read()
    
    original_count = content.count('style={{')
    if original_count == 0:
        return 0, 0
    
    shutil.copy(filepath, filepath + '.bak_migration')
    
    new_content = content
    replaced = 0
    skipped = 0
    
    # Find all style={{ }} occurrences
    pattern = re.compile(r'\bstyle=\{\{')
    
    # Process from end to start to preserve positions
    matches = list(pattern.finditer(new_content))
    
    for match in reversed(matches):
        pos = match.start()
        # Extract the full style={{ ... }} 
        # Find the matching closing }}
        start = match.end() - 1  # position of first {
        depth = 0
        i = start
        in_str = False
        str_char = None
        end = -1
        
        while i < len(new_content):
            c = new_content[i]
            if in_str:
                if c == str_char and (i == 0 or new_content[i-1] != '\\'):
                    in_str = False
            elif c in ('"', "'", '`'):
                in_str = True
                str_char = c
            elif c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    end = i
                    break
            i += 1
        
        if end == -1:
            skipped += 1
            continue
        
        style_expr = new_content[pos:end+1]  # style={{ ... }}
        inner = new_content[start:end+1]     # {{ ... }}
        
        # Check if dynamic
        if has_dynamic_value(inner):
            skipped += 1
            continue
        
        # Generate class
        inner_clean = inner.strip('{}').strip()
        
        # Check known mappings first
        matched_class = None
        for known_style, (cls, rule) in KNOWN_MAPPINGS.items():
            # Normalize both for comparison
            known_norm = re.sub(r'\s+', '', known_style)
            inner_norm = re.sub(r'\s+', '', inner)
            if known_norm in inner_norm or inner_norm in known_norm:
                matched_class = cls
                if rule not in css_rules:
                    css_rules.append(rule)
                break
        
        if not matched_class:
            # Generate from style content
            matched_class = style_to_class(inner_clean)
        
        if not matched_class:
            skipped += 1
            continue
        
        # Replace style={{ ... }} with className
        # Check if element already has className
        # Look backwards for existing className
        before = new_content[max(0, pos-200):pos]
        
        # Check if there's already a className on this element
        # Simple replacement: style={{ ... }} -> className="generated-class"
        new_content = new_content[:pos] + f'className="{matched_class}"' + new_content[end+1:]
        replaced += 1
    
    if replaced > 0:
        with open(filepath, 'w') as f:
            f.write(new_content)
    
    return replaced, skipped

def generate_css_from_style_classes():
    """Generate CSS rules for all auto-generated classes."""
    extra_css = []
    
    for style_str, cls in css_classes.items():
        # Parse the style string into CSS
        props = []
        # Remove surrounding {{ }}
        s = style_str.strip().strip('{}').strip()
        # Split carefully
        parts = re.split(r',\s*(?=[a-zA-Z])', s)
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
            m = re.match(r'^([a-zA-Z]+)\s*:\s*(.+)$', part)
            if not m:
                continue
            prop = m.group(1).strip()
            val = m.group(2).strip().strip('"\'`').strip()
            
            # Skip if value looks dynamic
            if any(c in val for c in ['{', '}', '=>', '?']):
                continue
            
            # camelCase → kebab-case
            css_prop = re.sub(r'([A-Z])', r'-\1', prop).lower()
            
            # Add px to numeric values for size properties
            size_props = {'width', 'height', 'top', 'bottom', 'left', 'right',
                         'margin', 'padding', 'font-size', 'border-radius',
                         'gap', 'min-width', 'max-width', 'min-height', 'max-height',
                         'line-height'}
            if css_prop in size_props and re.match(r'^\d+$', val):
                val = val + 'px'
            
            props.append(f"  {css_prop}: {val};")
        
        if props:
            extra_css.append(f".{cls} {{\n" + '\n'.join(props) + "\n}")
    
    return extra_css

# ── Main ───────────────────────────────────────────────────────────────────
print("SPX Mesh Editor — Master inline style migration")
print("=" * 60)

files = get_all_jsx_files(SRC_DIR)
print(f"Found {len(files)} JSX files")

total_replaced = 0
total_skipped  = 0
files_changed  = 0

for filepath in files:
    rel = filepath.replace(SRC_DIR + '/', '')
    replaced, skipped = migrate_file(filepath)
    if replaced > 0:
        print(f"  ✓ {rel}: {replaced} replaced, {skipped} skipped (dynamic)")
        files_changed += 1
        total_replaced += replaced
        total_skipped  += skipped
    elif skipped > 0:
        print(f"  ~ {rel}: {skipped} skipped (all dynamic)")
        total_skipped += skipped

print()
print(f"Total replaced: {total_replaced}")
print(f"Total skipped (dynamic): {total_skipped}")
print(f"Files changed: {files_changed}")

# ── Write CSS ──────────────────────────────────────────────────────────────
extra_css = generate_css_from_style_classes()
all_new_css = css_rules + extra_css

if all_new_css:
    with open(CSS_OUT, 'a') as f:
        f.write('\n\n/* ── Auto-generated from inline style migration ─────────────── */\n')
        f.write('\n'.join(all_new_css))
        f.write('\n')
    print(f"\nAppended {len(all_new_css)} CSS rules to spx-app.css")
else:
    print("\nNo CSS rules generated (all replacements used known mappings)")

# ── Verify ─────────────────────────────────────────────────────────────────
print("\n── Remaining inline styles after migration ──")
import subprocess
result = subprocess.run(
    ['bash', '-c', f'find {SRC_DIR} -name "*.jsx" | xargs grep -l "style={{{{" 2>/dev/null | wc -l'],
    capture_output=True, text=True
)
print(f"Files still with style={{{{: {result.stdout.strip()}")

result2 = subprocess.run(
    ['bash', '-c', f'find {SRC_DIR} -name "*.jsx" | xargs grep -c "style={{{{" 2>/dev/null | grep -v ":0" | awk -F: \'{{sum+=$2}} END {{print sum}}\''],
    capture_output=True, text=True
)
print(f"Total remaining style={{{{ occurrences: {result2.stdout.strip()}")
