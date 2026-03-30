#!/usr/bin/env python3
"""
install_motion_library.py
Installs MotionLibrary.js and MotionLibraryPanel.jsx into spx-mesh-editor.
Run from any directory: python3 install_motion_library.py [--repo PATH]
"""
import os
import sys
import shutil
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

SRC_FILES = {
    'MotionLibrary.js':      ('src/mesh/MotionLibrary.js',),
    'MotionLibraryPanel.jsx': ('src/components/animation/MotionLibraryPanel.jsx',),
}

def find_repo():
    candidates = [
        os.path.expanduser('~/spx-mesh-editor'),
        os.path.expanduser('~/SpectraSphere'),
        '/workspaces/SpectraSphere',
        os.getcwd(),
    ]
    for c in candidates:
        if os.path.isdir(os.path.join(c, 'src')):
            return c
    return None

def install(repo_root):
    print(f'\n📦 Installing Motion Library into: {repo_root}\n')
    for src_name, (dest_rel,) in SRC_FILES.items():
        src_path  = os.path.join(SCRIPT_DIR, src_name)
        dest_path = os.path.join(repo_root, dest_rel)
        dest_dir  = os.path.dirname(dest_path)

        if not os.path.isfile(src_path):
            print(f'  ✗ Source not found: {src_path}')
            continue

        os.makedirs(dest_dir, exist_ok=True)
        shutil.copy2(src_path, dest_path)
        size_kb = os.path.getsize(dest_path) / 1024
        print(f'  ✓ {dest_rel}  ({size_kb:.1f} KB)')

    print('\n✅ Done. Import in your panel host:\n')
    print("  import MotionLibraryPanel from './components/animation/MotionLibraryPanel';")
    print("  import { MOTION_CLIPS, searchClips } from './mesh/MotionLibrary';\n")
    print('Wire BVH event listener if not using prop:')
    print("  window.addEventListener('spx:applyBVH', e => {")
    print("    const { bvh, name, fps, loop } = e.detail;")
    print("    bvhImporter.loadBVHString(bvh, { name, fps, loop });")
    print('  });\n')

def main():
    parser = argparse.ArgumentParser(description='Install MotionLibrary into spx-mesh-editor')
    parser.add_argument('--repo', help='Path to spx-mesh-editor repo root')
    args = parser.parse_args()

    repo = args.repo or find_repo()
    if not repo:
        print('✗ Could not locate spx-mesh-editor. Pass --repo /path/to/repo')
        sys.exit(1)

    install(repo)

if __name__ == '__main__':
    main()
