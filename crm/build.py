#!/usr/bin/env python3
"""Setzt die Quelldateien aus src/ zu einer einzigen index.html zusammen.
Reihenfolge: kopf.html, CSS-Dateien, koerper.html, JS-Dateien (in einer gemeinsamen Funktion), ende.html."""
import pathlib
SRC = pathlib.Path(__file__).parent / 'src'
CSS = ['tokens.css', 'basis.css', 'app.css', 'beratung.css', 'wissen.css']
JS = ['bestand.js', 'grafik.js', 'navigation.js', 'start.js', 'kunden.js', 'beratung.js','ueberblick.js','training.js', 'wissen-inhalte.js', 'wissen.js', 'zz-init.js']
def read(p): return (SRC / p).read_text(encoding='utf8')
out = [read('kopf.html'), '<style>\n']
for c in CSS:
    if (SRC / 'css' / c).exists(): out.append(read('css/' + c) + '\n')
out.append('</style>\n</head>\n')
out.append(read('koerper.html'))
out.append("<script>\n(function(){\n'use strict';\n")
for j in JS:
    if (SRC / 'js' / j).exists(): out.append('/* ===== ' + j + ' ===== */\n' + read('js/' + j) + '\n')
out.append('})();\n</script>\n')
out.append(read('ende.html'))
(pathlib.Path(__file__).parent / 'index.html').write_text(''.join(out), encoding='utf8')
print('index.html gebaut')
