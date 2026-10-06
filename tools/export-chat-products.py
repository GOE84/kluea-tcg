#!/usr/bin/env python3
"""Read the separate chatbot product workbook and atomically refresh its JSON."""
import importlib.util
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('xlsx_reader', Path(__file__).with_name('export-rag-knowledge.py'))
reader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reader)


def convert(workbook):
    rows = reader.table(reader.read_workbook(workbook), 'สินค้าแชทบอท', 'รหัส')
    if not rows:
        raise ValueError('ไม่พบข้อมูลในชีตสินค้าแชทบอท')
    products, ids = [], set()
    for index, row in enumerate(rows, 2):
        def text(key):
            return str(row.get(key, '')).strip()
        def number(key, minimum=0, integer=False):
            value = float(row.get(key, ''))
            if not math.isfinite(value) or value < minimum or (integer and not value.is_integer()):
                raise ValueError(f'แถว {index}: {key} ไม่ถูกต้อง')
            return int(value) if value.is_integer() else value
        pid = text('รหัส')
        if not pid or pid in ids or not text('สินค้า') or not text('เกม'):
            raise ValueError(f'แถว {index}: รหัสซ้ำหรือข้อมูลจำเป็นว่าง')
        ids.add(pid)
        kind = text('ประเภทโปร')
        value = number('ค่าโปร')
        if kind not in ('percent', 'fixed', 'note') or (kind == 'percent' and value > 100):
            raise ValueError(f'แถว {index}: โปรโมชันไม่ถูกต้อง')
        image = text('ไฟล์รูป')
        if Path(image).name != image or not (ROOT / 'assets' / image).is_file():
            raise ValueError(f'แถว {index}: ไม่พบไฟล์รูป {image}')
        products.append(dict(id=pid, game=text('เกม'), name=text('สินค้า'), price=number('ราคา (บาท)'),
            stock=number('สต็อก', integer=True), desc=text('รายละเอียดสั้น'), image=image,
            promotion=dict(label=text('โปรโมชัน'), type=kind, value=value, minimumQuantity=number('ขั้นต่ำ (ชิ้น)', 1, True)),
            aliases=[word.strip() for word in text('คำค้น (คั่นด้วย |)').split('|') if word.strip()],
            details=text('รายละเอียด'), badge=text('ป้ายสินค้า'), source=text('แหล่งอ้างอิง'), dataType='demo'))
    return dict(source=workbook.name, description='ข้อมูลสินค้าแชทบอทจาก Excel แยก ราคาและสต็อกเป็นเดโม', products=products)


if __name__ == '__main__':
    data = convert(ROOT / 'data' / 'chatbot-products.xlsx')
    output = ROOT / 'assets' / 'product-reference.json'
    temp = output.with_suffix('.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(output)
    print(f"Updated {len(data['products'])} products from data/chatbot-products.xlsx")
