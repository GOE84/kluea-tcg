(function(root) {
  const aliases = {pokemon:['pokemon','pokémon','โปเกมอน','โปเกม่อน'],onepiece:['one piece','onepiece','วันพีซ','วันพีส'],gundam:['gundam','กันดั้ม','กันดัม'],lorcana:['lorcana','ลอร์คานา']};
  const sales = text => /ขายดี|ยอดขาย|ขายได้|อันดับ/.test(text);
  const store = text => /ร้านอยู่|ที่อยู่|พิกัด|แผนที่|เดินทาง|เปิดกี่|ปิดกี่|เวลาเปิด|เวลา.*ปิด|เบอร์|โทร|ติดต่อ|ส่งของ|จัดส่ง|ค่าส่ง/.test(text);
  const tables = text => /โต๊ะ|ที่นั่ง|จอง|ที่ว่าง/.test(text);
  function mentioned(text, documents) {
    const q = text.toLowerCase();
    return [...new Set(documents.filter(d => d.type === 'product' && [d.title, ...(d.aliases || []), ...(aliases[d.productId] || [])].some(word => word && q.includes(word.toLowerCase()))).map(d => d.productId))];
  }
  function select(query, documents) {
    const ids = mentioned(query, documents);
    if (store(query)) return documents.filter(d => d.type === 'store');
    if (tables(query)) return documents.filter(d => d.type === 'table');
    if (sales(query)) return documents.filter(d => ids.length ? d.type === 'sales' && ids.includes(d.productId) : d.type === 'sales-summary');
    if (/กิจกรรม|แข่ง|อีเวนต์/.test(query)) return documents.filter(d => d.type === 'event');
    if (!ids.length && !/สินค้า|การ์ด|ราคา|โปร|ลด|สต็อก|แนะนำ|มีของ|อยากซื้อ/.test(query)) return [];
    return documents.filter(d => ['product','promotion'].includes(d.type) && (!ids.length || ids.includes(d.productId)));
  }
  function queryFor(message, previous, documents) {
    if (store(message)) return message;
    if (mentioned(message, documents).length || sales(message) || tables(message) || /กิจกรรม|แข่ง/.test(message)) return message;
    // Carry only the product identity for genuine follow-ups, never the previous sales intent.
    if (/ราคา|เท่าไ|โปร|ลด|ตัวนี้|รุ่นนี้|อันนี้|กี่|มีของ|สต็อก/.test(message)) {
      for (const turn of [...previous].reverse()) {
        const ids = mentioned(turn.text, documents);
        if (ids.length) return message + ' ' + ids.map(id => documents.find(d => d.type === 'product' && d.productId === id)?.title || id).join(' ');
        if (tables(turn.text) || sales(turn.text) || store(turn.text)) break;
      }
    }
    return message;
  }
  root.TCG_RETRIEVAL = { select, queryFor };
})(globalThis);
