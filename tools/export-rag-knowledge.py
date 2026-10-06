#!/usr/bin/env python3
"""Export searchable chatbot documents from the editable demo XLSX (stdlib only)."""
import json
import posixpath
import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / "data" / "kluea-tcg-demo.xlsx"
OUTPUT = ROOT / "assets" / "knowledge.json"
NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkg": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def col_index(address):
    letters = re.match(r"[A-Z]+", address).group(0)
    index = 0
    for char in letters:
        index = index * 26 + ord(char) - 64
    return index - 1


def read_workbook(path):
    with zipfile.ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {item.attrib["Id"]: item.attrib["Target"] for item in rels.findall("pkg:Relationship", NS)}
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(node.text or "" for node in item.iter(f"{{{NS['main']}}}t")) for item in root.findall("main:si", NS)]
        sheets = {}
        for sheet in workbook.findall("main:sheets/main:sheet", NS):
            name = sheet.attrib["name"]
            relation_id = sheet.attrib[f"{{{NS['rel']}}}id"]
            target = targets[relation_id]
            sheet_path = target.lstrip("/") if target.startswith("/") else posixpath.normpath(posixpath.join("xl", target))
            root = ET.fromstring(archive.read(sheet_path))
            rows = []
            for row_node in root.findall("main:sheetData/main:row", NS):
                cells = {}
                for cell in row_node.findall("main:c", NS):
                    address = cell.attrib.get("r", "")
                    value_node = cell.find("main:v", NS)
                    value = value_node.text if value_node is not None else ""
                    kind = cell.attrib.get("t")
                    if kind == "s" and value:
                        value = shared[int(value)]
                    elif kind == "inlineStr":
                        value = "".join(node.text or "" for node in cell.iter(f"{{{NS['main']}}}t"))
                    elif kind in (None, "n") and value:
                        number = float(value)
                        value = int(number) if number.is_integer() else number
                    cells[col_index(address)] = value
                if cells:
                    rows.append([cells.get(index, "") for index in range(max(cells) + 1)])
            sheets[name] = rows
        return sheets


def table(sheets, name, first_header):
    rows = sheets.get(name, [])
    header_index = next((i for i, row in enumerate(rows) if row and row[0] == first_header), None)
    if header_index is None:
        return []
    headers = [str(value).strip() for value in rows[header_index]]
    output = []
    for row in rows[header_index + 1 :]:
        if not any(value != "" for value in row):
            continue
        output.append({headers[i]: row[i] if i < len(row) else "" for i in range(len(headers)) if headers[i]})
    return output


def main():
    sheets = read_workbook(WORKBOOK)
    products = table(sheets, "สินค้า", "รหัส")
    promotions = table(sheets, "โปรโมชั่น", "รหัสสินค้า")
    orders = table(sheets, "ยอดขาย", "วันที่")
    promo_by_id = {str(row.get("รหัสสินค้า", "")): row for row in promotions}
    sales_by_id = {}
    for row in orders:
        key = str(row.get("รหัสสินค้า", ""))
        sales_by_id[key] = sales_by_id.get(key, 0) + int(row.get("จำนวน", 0) or 0)

    documents = []
    for product in products:
        product_id = str(product.get("รหัส", ""))
        game = str(product.get("เกม", ""))
        name = str(product.get("สินค้า", ""))
        price = product.get("ราคา (บาท)", 0)
        stock = product.get("สต็อก", 0)
        promotion = str(product.get("โปรโมชัน", "ไม่มีโปรโมชัน"))
        documents.append({
            "id": f"excel-product-{product_id}", "type": "product", "productId": product_id,
            "title": f"{game} {name}",
            "content": f"{game} {name}. ราคา {price} บาท. สต็อกตัวอย่าง {stock} ชิ้น. โปรโมชัน {promotion}. ข้อมูลจากชีตสินค้าและโปรโมชั่นใน Excel ตัวอย่าง.",
            "tags": [product_id, game, name, "สินค้า ราคา โปร การ์ด"],
        })
        promo = promo_by_id.get(product_id, {})
        if promo:
            documents.append({
                "id": f"excel-promotion-{product_id}", "type": "promotion", "productId": product_id,
                "title": f"โปรโมชัน {game} {name}",
                "content": f"โปรโมชัน {game} {name}: {promo.get('รายละเอียดโปร', promotion)}, ประเภท {promo.get('ประเภท', '')}, ค่า {promo.get('ค่า', '')}. ข้อมูลจากชีตโปรโมชั่นใน Excel ตัวอย่าง.",
                "tags": ["โปร ลด โปรโมชั่น", game, name],
            })

    ranked = sorted(products, key=lambda row: sales_by_id.get(str(row.get("รหัส", "")), 0), reverse=True)
    if ranked:
        best = ranked[0]
        best_id = str(best.get("รหัส", ""))
        documents.append({
            "id": "excel-sales-summary", "type": "sales-summary", "productId": best_id,
            "metadata": {"productId": best_id, "productName": str(best.get("สินค้า", "")), "game": str(best.get("เกม", "")), "units": sales_by_id.get(best_id, 0)},
            "title": "สรุปสินค้าขายดีจาก Excel",
            "content": "สินค้าขายดีที่สุดคือ " + str(best.get("เกม", "")) + " " + str(best.get("สินค้า", "")) + " ขายได้ " + str(sales_by_id.get(best_id, 0)) + " ชิ้น. " + ". ".join(f"{row.get('สินค้า', '')} {sales_by_id.get(str(row.get('รหัส', '')), 0)} ชิ้น" for row in ranked) + ". เป็นยอดขายจำลองจากชีตยอดขายใน Excel.",
            "tags": ["ยอดขาย ขายดี สถิติ อันดับ dashboard สินค้าขายดีที่สุด"],
        })
    for product in products:
        product_id = str(product.get("รหัส", ""))
        documents.append({
            "id": f"excel-sales-{product_id}", "type": "sales", "productId": product_id,
            "title": f"ยอดขายตัวอย่าง {product.get('เกม', '')} {product.get('สินค้า', '')}",
            "content": f"{product.get('สินค้า', '')} {product.get('เกม', '')} ขายได้ {sales_by_id.get(product_id, 0)} ชิ้น จากรายการขายจำลองใน Excel",
            "tags": ["ยอดขาย ขายดี สถิติ รายงาน", str(product.get("เกม", "")), str(product.get("สินค้า", ""))],
        })

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({"source": WORKBOOK.name, "documents": documents}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Exported {len(documents)} RAG documents from {WORKBOOK.relative_to(ROOT)} to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
