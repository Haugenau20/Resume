"""Convert the <text> in a diagram SVG into Source Sans 3 outlines.

SVGs shown with <img> can't load web fonts, so each device would substitute its
own font and the labels would change width. Outlining the text makes the
diagrams look the same everywhere.

Edit the sources in this folder, then regenerate the published copies:

    python docs/diagrams/outline_text.py docs/diagrams/agent-runs.svg images/fulls/agent-runs.svg

The fonts are downloaded once from Adobe's repository (OFL licence) into
~/.cache/source-sans-3. Requires fontTools (pip install fonttools).
"""

import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

SVG_NS = 'http://www.w3.org/2000/svg'
FONT_URL = 'https://raw.githubusercontent.com/adobe-fonts/source-sans/release/TTF/SourceSans3-{}.ttf'
WEIGHTS = {'400': 'Regular', 'normal': 'Regular', '600': 'Semibold', '700': 'Bold', 'bold': 'Bold'}
INHERITED = ('font-size', 'font-weight', 'text-anchor', 'letter-spacing')
TEXT_ONLY = INHERITED + ('x', 'y', 'font-family')


def load_font(style, cache=Path.home() / '.cache' / 'source-sans-3'):
    path = cache / f'SourceSans3-{style}.ttf'
    if not path.exists():
        cache.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(FONT_URL.format(style), path)
    font = TTFont(path)
    return {'font': font, 'glyphs': font.getGlyphSet(), 'cmap': font.getBestCmap(),
            'hmtx': font['hmtx'], 'upem': font['head'].unitsPerEm, 'kern': kerning_pairs(font)}


def kerning_pairs(font):
    """Pair adjustments from the GPOS 'kern' feature, as {(left, right): x_advance}."""
    pairs = {}
    gpos = font['GPOS'].table
    lookups = {i for fr in gpos.FeatureList.FeatureRecord if fr.FeatureTag == 'kern' for i in fr.Feature.LookupListIndex}
    for index in sorted(lookups):
        for sub in gpos.LookupList.Lookup[index].SubTable:
            if sub.LookupType == 9:
                sub = sub.ExtSubTable
            if sub.LookupType != 2:
                continue
            if sub.Format == 1:
                for first, pairset in zip(sub.Coverage.glyphs, sub.PairSet):
                    for record in pairset.PairValueRecord:
                        if record.Value1 and getattr(record.Value1, 'XAdvance', 0):
                            pairs.setdefault((first, record.SecondGlyph), record.Value1.XAdvance)
            elif sub.Format == 2:
                class1, class2 = sub.ClassDef1.classDefs, sub.ClassDef2.classDefs
                for first in sub.Coverage.glyphs:
                    row = sub.Class1Record[class1.get(first, 0)]
                    for second, c2 in class2.items():
                        value = row.Class2Record[c2].Value1
                        if value and getattr(value, 'XAdvance', 0):
                            pairs.setdefault((first, second), value.XAdvance)
    return pairs


def number(value):
    return ('%.1f' % value).rstrip('0').rstrip('.')


def outline(text, x, y, size, font, anchor, spacing):
    """Return (path data, width) for one line of text."""
    scale = size / font['upem']
    names = [font['cmap'][ord(ch)] for ch in text]
    advances = []
    for i, name in enumerate(names):
        advance = font['hmtx'][name][0] * scale + spacing
        if i + 1 < len(names):
            advance += font['kern'].get((name, names[i + 1]), 0) * scale
        advances.append(advance)
    width = sum(advances) - (spacing if names else 0)
    cursor = x - {'middle': width / 2, 'end': width}.get(anchor, 0)
    pen = SVGPathPen(font['glyphs'], ntos=number)
    for name, advance in zip(names, advances):
        font['glyphs'][name].draw(TransformPen(pen, (scale, 0, 0, -scale, cursor, y)))
        cursor += advance
    return pen.getCommands(), width


def convert(source, target):
    ET.register_namespace('', SVG_NS)
    tree = ET.parse(source, parser=ET.XMLParser(target=ET.TreeBuilder(insert_comments=True)))
    fonts = {}

    def walk(element, inherited):
        values = dict(inherited, **{k: element.get(k) for k in INHERITED if element.get(k) is not None})
        for i, child in enumerate(list(element)):
            if child.tag != f'{{{SVG_NS}}}text':
                walk(child, values)
                continue
            attrs = dict(values, **{k: child.get(k) for k in INHERITED if child.get(k) is not None})
            style = WEIGHTS[attrs.get('font-weight', '400')]
            font = fonts.setdefault(style, load_font(style))
            d, width = outline(child.text or '', float(child.get('x', 0)), float(child.get('y', 0)),
                               float(attrs['font-size']), font, attrs.get('text-anchor', 'start'),
                               float(attrs.get('letter-spacing', 0)))
            path = ET.Element(f'{{{SVG_NS}}}path', {k: v for k, v in child.attrib.items() if k not in TEXT_ONLY})
            path.set('d', d)
            path.tail = child.tail
            element.remove(child)
            element.insert(i, path)
            print(f'  {width:7.1f}px  {child.text}')

    root = tree.getroot()
    walk(root, {})
    for name in INHERITED + ('font-family',):
        for element in root.iter():
            if element.tag != f'{{{SVG_NS}}}text':
                element.attrib.pop(name, None)
    tree.write(target, encoding='unicode')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    print(sys.argv[1])
    convert(sys.argv[1], sys.argv[2])
