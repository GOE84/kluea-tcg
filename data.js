/**
 * ข้อมูลที่แก้บ่อย — แก้ไฟล์นี้แล้วบันทึก จากนั้นรีเฟรชหน้าเว็บ
 * ไม่ต้องติดตั้งโปรแกรมเสริม ไม่ต้อง build และไม่ใช้ framework
 * ราคาเป็นตัวเลขบาท; image คือชื่อไฟล์ในโฟลเดอร์ assets/
 * id ของสินค้าแต่ละชิ้นต้องไม่ซ้ำกัน ใช้ตัวอักษรอังกฤษและขีดกลาง
 */
window.SHOP_DATA = {
  // เปิด Gemini เมื่อ deploy Cloudflare Pages Function และตั้ง GEMINI_API_KEY secret แล้ว; ปิดได้โดยตั้งเป็น false
  chat: { useGemini: true },
  // 1. สินค้า: เพิ่มรายการด้วยการคัดลอกวัตถุ { ... } หนึ่งชุด
  products: [
    {
      "id": "pokemon",
      "game": "Pokémon",
      "name": "Destined Rivals",
      "desc": "Booster Box · ภาษาอังกฤษ · 36 ซอง",
      "price": 5900,
      "stock": 6,
      "promotion": { "label": "โปรเปิดเดโม ลด 5%", "type": "percent", "value": 5, "minimumQuantity": 1 },
      "image": "pokemon.png",
      "badge": "BOOSTER BOX",
      "details": "Pokémon TCG: Scarlet & Violet — Destined Rivals Booster Display Box บรรจุ 36 ซอง ภาพประกอบจาก Pokémon",
      "source": "https://www.pokemon.com/us/news/pokemon-tcg-scarlet-violet-destined-rivals-product-showcase"
    },
    {
      "id": "onepiece",
      "game": "ONE PIECE",
      "name": "Romance Dawn [OP01]",
      "desc": "Booster Pack · ภาษาอังกฤษ · 1 ซอง",
      "price": 190,
      "stock": 8,
      "promotion": { "label": "ซื้อ 3 ซอง ลด 10%", "type": "percent", "value": 10, "minimumQuantity": 3 },
      "image": "onepiece.jpg",
      "badge": "BOOSTER PACK",
      "details": "ONE PIECE CARD GAME Booster Pack — Romance Dawn [OP01] ภาพประกอบจาก Bandai",
      "source": "https://en.onepiece-cardgame.com/products/boosters/op01.php"
    },
    {
      "id": "gundam",
      "game": "GUNDAM",
      "name": "Heroic Beginnings [ST01]",
      "desc": "Starter Deck · ภาษาญี่ปุ่น · 1 ชุด",
      "price": 690,
      "stock": 12,
      "promotion": { "label": "รับเดโมฟรีค่าห่อ", "type": "note", "value": 0, "minimumQuantity": 1 },
      "image": "gundam.webp",
      "badge": "STARTER DECK",
      "details": "GUNDAM CARD GAME Starter Deck Heroic Beginnings [ST01] ภาพประกอบจากเว็บไซต์ Gundam Card Game",
      "source": "https://www.gundam-gcg.com/asia-en/products/st01.html"
    },
    {
      "id": "lorcana",
      "game": "LORCANA",
      "name": "The First Chapter — Starter Set",
      "desc": "Starter Decks · ภาษาอังกฤษ · เซ็ต 3 แบบ",
      "price": 2290,
      "stock": 4,
      "promotion": { "label": "โปรเซ็ต ลด ฿200", "type": "fixed", "value": 200, "minimumQuantity": 1 },
      "image": "lorcana.png",
      "badge": "STARTER SET",
      "details": "Disney Lorcana: The First Chapter Starter Decks เดโมจัดเป็นเซ็ต 3 แบบตามภาพ ตัวสินค้าและราคาใช้เพื่อสาธิตเท่านั้น",
      "source": "https://www.disneylorcana.com/en-US/product"
    },
    {"id":"onepiece-op13-box","demoOnly":true,"game":"ONE PIECE","name":"Booster Box [OP13]","desc":"Booster Box · รุ่นที่กล่าวถึงในคลิป · ข้อมูลเดโม","price":3490,"stock":3,"promotion":{"label":"ไม่มีโปรโมชัน (เดโม)","type":"note","value":0,"minimumQuantity":1},"image":"op13-box.webp","badge":"BOOSTER BOX","details":"คลิปเกลือ TCG กล่าวถึง OP13 ช่วง 11:00–11:58 ภาพกล่องจากผู้ผลิต ราคาและสต็อกเป็นข้อมูลจำลอง ไม่ใช่รายการสินค้าจริงของร้าน","source":"https://www.youtube.com/watch?v=YM4ZSiVY1QE&t=660s","imageSource":"https://en.onepiece-cardgame.com/products/boosters/op13/"},
    {"id":"onepiece-op14-box","demoOnly":true,"game":"ONE PIECE","name":"Booster Box [OP14]","desc":"Booster Box · รุ่นที่กล่าวถึงในคลิป · ข้อมูลเดโม","price":3590,"stock":4,"promotion":{"label":"ไม่มีโปรโมชัน (เดโม)","type":"note","value":0,"minimumQuantity":1},"image":"op14-box.webp","badge":"BOOSTER BOX","details":"คลิปเกลือ TCG กล่าวถึง OP14 ช่วง 11:00–11:58 ภาพกล่องจากผู้ผลิต ราคาและสต็อกเป็นข้อมูลจำลอง ไม่ใช่รายการสินค้าจริงของร้าน","source":"https://www.youtube.com/watch?v=YM4ZSiVY1QE&t=660s","imageSource":"https://asia-tc.onepiece-cardgame.com/products/boosters/op14.php"},
    {"id":"onepiece-op15-box","demoOnly":true,"game":"ONE PIECE","name":"Booster Box [OP15]","desc":"Booster Box · รุ่นที่กล่าวถึงในคลิป · ข้อมูลเดโม","price":3690,"stock":5,"promotion":{"label":"ไม่มีโปรโมชัน (เดโม)","type":"note","value":0,"minimumQuantity":1},"image":"op15-box.webp","badge":"BOOSTER BOX","details":"คลิปเกลือ TCG กล่าวถึง OP15 ช่วง 11:00–11:58 ภาพกล่องจากผู้ผลิต ราคาและสต็อกเป็นข้อมูลจำลอง ไม่ใช่รายการสินค้าจริงของร้าน","source":"https://www.youtube.com/watch?v=YM4ZSiVY1QE&t=660s","imageSource":"https://asia-tc.onepiece-cardgame.com/products/boosters/op15.php"},
    {"id":"onepiece-op16-box","demoOnly":true,"game":"ONE PIECE","name":"Booster Box [OP16]","desc":"Booster Box · รุ่นที่กล่าวถึงในคลิป · ข้อมูลเดโม","price":3790,"stock":6,"promotion":{"label":"ไม่มีโปรโมชัน (เดโม)","type":"note","value":0,"minimumQuantity":1},"image":"op16-box.webp","badge":"BOOSTER BOX","details":"คลิปเกลือ TCG กล่าวถึง OP16 ช่วง 11:00–11:58 ภาพกล่องจากผู้ผลิต ราคาและสต็อกเป็นข้อมูลจำลอง ไม่ใช่รายการสินค้าจริงของร้าน","source":"https://www.youtube.com/watch?v=YM4ZSiVY1QE&t=660s","imageSource":"https://www.onepiece-cardgame.com/products/op16.html"},
    {"id":"onepiece-op17-box","demoOnly":true,"game":"ONE PIECE","name":"Booster Box [OP17]","desc":"Booster Box · รุ่นที่กล่าวถึงในคลิป · ข้อมูลเดโม","price":3890,"stock":7,"promotion":{"label":"ไม่มีโปรโมชัน (เดโม)","type":"note","value":0,"minimumQuantity":1},"image":"op17-box.webp","badge":"BOOSTER BOX","details":"คลิปเกลือ TCG กล่าวถึง OP17 ช่วง 11:00–11:58 ภาพกล่องจากผู้ผลิต ราคาและสต็อกเป็นข้อมูลจำลอง ไม่ใช่รายการสินค้าจริงของร้าน","source":"https://www.youtube.com/watch?v=YM4ZSiVY1QE&t=660s","imageSource":"https://asia-tc.onepiece-cardgame.com/products/op17.html"},
    {"id":"card-sleeves-demo","demoOnly":true,"game":"ACCESSORY","name":"ซองใส่การ์ด","desc":"อุปกรณ์ใส่การ์ด · ข้อมูลเดโม","price":120,"stock":20,"promotion":{"label":"ไม่มีโปรโมชัน (เดโม)","type":"note","value":0,"minimumQuantity":1},"image":"onepiece-sleeves.webp","badge":"ACCESSORY","details":"คลิปกล่าวถึงซองใส่การ์ดช่วง 14:54–15:04 ภาพจากผู้ผลิตเป็นตัวอย่างรุ่น ราคาและสต็อกเป็นตัวเลขจำลอง","source":"https://www.youtube.com/watch?v=YM4ZSiVY1QE&t=894s","imageSource":"https://www.onepiece-cardgame.com/products/sleeve042.html"},
    {"id":"card-binder-demo","demoOnly":true,"game":"ACCESSORY","name":"แฟ้มเก็บการ์ด","desc":"แฟ้มสะสมการ์ด · ข้อมูลเดโม","price":390,"stock":8,"promotion":{"label":"ไม่มีโปรโมชัน (เดโม)","type":"note","value":0,"minimumQuantity":1},"image":"onepiece-binder.webp","badge":"ACCESSORY","details":"คลิปกล่าวถึงแฟ้มเก็บการ์ดช่วง 14:54–15:04 ภาพจากผู้ผลิตเป็นตัวอย่างรุ่น ราคาและสต็อกเป็นตัวเลขจำลอง","source":"https://www.youtube.com/watch?v=YM4ZSiVY1QE&t=894s","imageSource":"https://www.onepiece-cardgame.com/products/baseshop-binder001.html"},
    {"id":"playable-singles-demo","demoOnly":true,"game":"การ์ดแยก","name":"การ์ดใช้งานคัดเลือก","desc":"การ์ดแยกสำหรับจัดเด็ค · เลือกใบที่ร้าน","price":10,"stock":50,"promotion":{"label":"ราคา 10 บาทต่อใบตามที่กล่าวในคลิป สต็อกเดโม","type":"note","value":0,"minimumQuantity":1},"image":"singles-demo.svg","badge":"SINGLE CARD","details":"คลิปกล่าวถึงการ์ดใช้งานราคา 10 บาทต่อใบช่วง 15:23–15:55 รายการและสต็อกเป็นข้อมูลจำลอง ต้องเลือกใบที่ร้าน","source":"https://www.youtube.com/watch?v=YM4ZSiVY1QE&t=923s"}
  ],

  // 2. ตั้งค่าการจองโต๊ะ (ข้อมูลจำลองเฉพาะเบราว์เซอร์)
  booking: {
    tableCount: 8,         // จำนวนโต๊ะทั้งหมด
    seatsPerTable: 4,     // จำนวนที่นั่งต่อโต๊ะ
    minPlayers: 2,
    slotHours: 2,         // ระยะเวลาต่อรอบ (ชั่วโมง)
    startHours: [14, 16, 18, 20],
    defaultHour: 18,
    advanceDays: 30,      // จองล่วงหน้าได้กี่วัน
    closedWeekdays: [1],  // 0=อาทิตย์, 1=จันทร์, ... 6=เสาร์

    // หมายเลขโต๊ะที่ไม่ว่างในแต่ละรอบ เพื่อสาธิตสถานะโต๊ะเต็ม
    occupiedByHour: {
      14: [3, 7],
      16: [1, 4, 6],
      18: [2, 3, 5, 8],
      20: [1, 2, 3, 4, 5, 6, 7, 8]
    }
  },

  // 3. โปรโมชันและยอดขายตัวอย่างชุดเดียวกับ chatbot / Dashboard / workbook
  sales: {
    currency: "THB",
    periodLabel: "ตัวอย่าง 30 วันล่าสุด",
    orders: [
      { date: "2026-09-12", productId: "pokemon", quantity: 2 },
      { date: "2026-09-14", productId: "onepiece", quantity: 12 },
      { date: "2026-09-17", productId: "gundam", quantity: 5 },
      { date: "2026-09-19", productId: "pokemon", quantity: 1 },
      { date: "2026-09-21", productId: "lorcana", quantity: 2 },
      { date: "2026-09-24", productId: "onepiece", quantity: 9 },
      { date: "2026-09-26", productId: "gundam", quantity: 4 },
      { date: "2026-09-28", productId: "pokemon", quantity: 1 },
      { date: "2026-10-01", productId: "onepiece", quantity: 15 },
      { date: "2026-10-02", productId: "lorcana", quantity: 1 },
      { date: "2026-10-03", productId: "gundam", quantity: 3 },
      { date: "2026-10-04", productId: "pokemon", quantity: 1 }
    ]
  },

  // 4. ตารางกิจกรรมและโปสเตอร์
  events: {
    caption: 'ตารางกิจกรรม 6–11 ตุลาคม 2026 จากภาพที่ร้านให้มา',
    poster: 'events.jpg',
    rows: [
      { day: 'อังคาร 6 ต.ค.', game: 'Battle of Talingchan', time: '19:00' },
      { day: 'พุธ 7 ต.ค.', game: 'Riftbound', time: '19:00' },
      { day: 'พฤหัสบดี 8 ต.ค.', game: 'Gundam Card Game', time: '19:00' },
      { day: 'ศุกร์ 9 ต.ค.', game: 'Disney Lorcana', time: '19:00' },
      { day: 'เสาร์ 10 ต.ค.', game: 'One Piece Card Game', time: '15:00' },
      { day: 'อาทิตย์ 11 ต.ค.', game: 'Pokémon / Yu-Gi-Oh!', time: '15:00 / 19:00' }
    ]
  }
};
