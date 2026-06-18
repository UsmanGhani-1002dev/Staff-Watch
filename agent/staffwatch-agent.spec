# staffwatch-agent.spec
# Build with: pyinstaller staffwatch-agent.spec

block_cipher = None

a = Analysis(
    ['service.py'],
    pathex=['.'],
    binaries=[],
    datas=[('config.json', '.')],
    hiddenimports=[
        'PIL._tkinter_finder',
        'win32timezone',
        'psutil',
        'requests',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='StaffWatchAgent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,       # No console window — silent
    icon='icon.ico',     # Add your icon
)
