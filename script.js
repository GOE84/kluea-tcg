/**
 * พฤติกรรมของเว็บ — JavaScript ธรรมดา ไม่มี framework หรือขั้นตอน build
 * แก้ข้อความ/โครงหน้า: index.html | สี/ระยะห่าง: style.css | ข้อมูล: data.js
 * โครง HTML ของรายการซ้ำอยู่ใน <template> ท้าย index.html
 */
'use strict';

// ---------------------------------------------------------------------------
// 1. เครื่องมือช่วย: ค้นหา element, คัดลอก template, เก็บข้อมูลในเครื่อง
// ---------------------------------------------------------------------------
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const { products, booking: bookingConfig, events, sales } = window.SHOP_DATA;
const CART_KEY = 'kluea-cart-v1';
const BOOKING_KEY = 'kluea-bookings-v1';
const money = value => '฿' + value.toLocaleString('th-TH');
const tableLabel = number => 'T' + String(number).padStart(2, '0');

function template(id) {
  return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

function setText(root, field, value) {
  $(`[data-field="${field}"]`, root).textContent = value;
}

function setImage(root, product) {
  const image = $('[data-field="image"]', root);
  image.src = 'assets/' + product.image;
  image.alt = product.game + ' ' + product.name;
}

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000);
}

function showDialog(id, content) {
  const dialog = document.getElementById(id);
  dialog.replaceChildren(content);
  if (!dialog.open) dialog.showModal();
}

// ปุ่มปิดใช้ data-close="ชื่อ-id-dialog" ใน HTML
// ใช้ event delegation เพื่อรองรับปุ่มใน template ที่เพิ่มภายหลัง
document.addEventListener('click', event => {
  const closeButton = event.target.closest('[data-close]');
  if (closeButton) document.getElementById(closeButton.dataset.close).close();
});

$$('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    ) dialog.close();
  });
});

// ---------------------------------------------------------------------------
// 2. เปลี่ยนหน้าร้าน / จองโต๊ะ / กิจกรรม (ทุกหน้าอยู่ใน index.html)
// ---------------------------------------------------------------------------
function showPage(name) {
  $$('.page').forEach(section => { section.hidden = section.id !== name; });
  $$('.nav-link').forEach(button => {
    const active = button.dataset.page === name;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (name === 'booking') renderBooking();
  if (name === 'dashboard') renderDashboard();
  if (name === 'chat') initializeChat();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

$$('[data-page]').forEach(button => {
  button.addEventListener('click', () => showPage(button.dataset.page));
});

$$('.brand, .footer-brand').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    showPage('shop');
  });
});

// ---------------------------------------------------------------------------
// 3. สินค้า: กรอง ค้นหา และรายละเอียด
// ---------------------------------------------------------------------------
let activeFilter = 'all';

function renderFilters() {
  const filters = $('#filters');
  filters.replaceChildren();
  const games = ['all', ...new Set(products.map(product => product.game))];
  games.forEach(game => {
    const button = document.createElement('button');
    button.className = 'filter' + (activeFilter === game ? ' active' : '');
    button.textContent = game === 'all' ? 'ทั้งหมด' : game;
    button.dataset.filter = game;
    button.setAttribute('aria-pressed', String(activeFilter === game));
    button.onclick = () => {
      activeFilter = game;
      renderFilters();
      renderProducts();
    };
    filters.append(button);
  });
}

function renderProducts() {
  const query = $('#search').value.trim().toLowerCase();
  const matchingProducts = products.filter(product => {
    const matchesGame = activeFilter === 'all' || product.game === activeFilter;
    const searchableText = `${product.name} ${product.game} ${product.desc}`.toLowerCase();
    return matchesGame && searchableText.includes(query);
  });

  $('#product-total').textContent = matchingProducts.length + ' รายการ';
  const container = $('#products');
  container.replaceChildren();

  if (!matchingProducts.length) {
    const empty = template('no-products-template');
    $('[data-action="clear-search"]', empty).onclick = () => {
      $('#search').value = '';
      activeFilter = 'all';
      renderFilters();
      renderProducts();
    };
    container.append(empty);
    return;
  }

  matchingProducts.forEach(product => {
    const card = template('product-template');
    ['badge', 'game', 'name', 'desc'].forEach(field => setText(card, field, product[field]));
    setText(card, 'price', money(product.price));
    setText(card, 'stock', product.stock > 0
      ? `${product.demoOnly ? 'สินค้าเดโม' : 'พร้อมส่ง'} · สต็อกตัวอย่าง ${product.stock} ชิ้น` : 'สินค้าหมด');
    setImage(card, product);

    const detailButton = $('[data-action="detail"]', card);
    detailButton.setAttribute('aria-label', 'ดูรายละเอียด ' + product.name);
    detailButton.onclick = () => showProduct(product);

    const addButton = $('[data-action="add"]', card);
    addButton.setAttribute('aria-label', `เพิ่ม ${product.name} ลงตะกร้า`);
    addButton.disabled = product.stock < 1;
    addButton.onclick = () => addToCart(product.id);
    container.append(card);
  });
}

function showProduct(product) {
  const content = template('product-detail-template');
  ['game', 'name', 'details'].forEach(field => setText(content, field, product[field]));
  setText(content, 'price', money(product.price));
  setImage(content, product);
  $('[data-field="source"]', content).href = product.source;
  const addButton = $('[data-action="add"]', content);
  addButton.disabled = product.stock < 1;
  addButton.onclick = () => addToCart(product.id);
  showDialog('product-dialog', content);
}

$('#search').addEventListener('input', renderProducts);

// ---------------------------------------------------------------------------
// 4. ตะกร้าและคำสั่งซื้อจำลอง
// ---------------------------------------------------------------------------
let cart = readStorage(CART_KEY, {});
if (!cart || typeof cart !== 'object' || Array.isArray(cart)) cart = {};
Object.keys(cart).forEach(id => {
  const product = products.find(item => item.id === id);
  if (!product || !Number.isInteger(cart[id]) || cart[id] < 1 || product.stock < 1) {
    delete cart[id];
  } else {
    cart[id] = Math.min(cart[id], product.stock);
  }
});

function updateCartCount() {
  $('#cart-count').textContent = Object.values(cart).reduce((sum, count) => sum + count, 0);
  saveStorage(CART_KEY, cart);
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  if ((cart[id] || 0) >= product.stock) return toast('จำนวนสินค้าเกินสต็อกตัวอย่าง');
  cart[id] = (cart[id] || 0) + 1;
  updateCartCount();
  toast('เพิ่มสินค้าลงตะกร้าแล้ว');
}

function changeQuantity(id, difference) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const quantity = Math.min(product.stock, (cart[id] || 0) + difference);
  if (quantity <= 0) delete cart[id];
  else cart[id] = quantity;
  updateCartCount();
  renderCart();
}

function renderCart() {
  const items = products.filter(product => cart[product.id]);
  if (!items.length) {
    $('#cart-content').replaceChildren(template('empty-cart-template'));
    return;
  }

  const content = template('cart-template');
  const list = $('[data-field="items"]', content);
  const total = items.reduce((sum, product) => sum + product.price * cart[product.id], 0);

  items.forEach(product => {
    const row = template('cart-item-template');
    setImage(row, product);
    setText(row, 'name', product.name);
    setText(row, 'quantity', cart[product.id]);
    setText(row, 'subtotal', money(product.price * cart[product.id]));
    const decrease = $('[data-action="decrease"]', row);
    const increase = $('[data-action="increase"]', row);
    decrease.setAttribute('aria-label', 'ลดจำนวน ' + product.name);
    increase.setAttribute('aria-label', 'เพิ่มจำนวน ' + product.name);
    decrease.onclick = () => changeQuantity(product.id, -1);
    increase.onclick = () => changeQuantity(product.id, 1);
    increase.disabled = cart[product.id] >= product.stock;
    list.append(row);
  });

  setText(content, 'total', money(total));
  $('#checkout', content).onclick = () => {
    cart = {};
    updateCartCount();
    const success = template('checkout-success-template');
    setText(success, 'total', money(total));
    $('#cart-content').replaceChildren(success);
  };
  $('#cart-content').replaceChildren(content);
}

$('#cart-open').onclick = () => {
  renderCart();
  $('#cart-dialog').showModal();
};

// ---------------------------------------------------------------------------
// 5. เวลาไทยและสถานะการจอง
// ---------------------------------------------------------------------------
function nowBangkok() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
}

function dateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const today = () => dateString(nowBangkok());
const displayDate = date => new Date(date + 'T12:00:00+07:00').toLocaleDateString('th-TH', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok'
});
const slotText = hour => `${hour}:00 – ${hour + bookingConfig.slotHours}:00`;
const isClosedDate = date => bookingConfig.closedWeekdays.includes(new Date(date + 'T12:00:00').getDay());
const allTables = () => Array.from({ length: bookingConfig.tableCount }, (_, index) => index + 1);

function loadReservations() {
  const data = readStorage(BOOKING_KEY, []);
  if (!Array.isArray(data)) return [];
  return data.filter(item => item && typeof item.id === 'string' &&
    typeof item.name === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    bookingConfig.startHours.includes(item.slot) && Number.isInteger(item.table) &&
    item.table >= 1 && item.table <= bookingConfig.tableCount);
}

let reservations = loadReservations();
let slot = bookingConfig.defaultHour;
if (!bookingConfig.startHours.includes(slot)) slot = bookingConfig.startHours[0];
let people = bookingConfig.minPlayers;
let selectedTable = null;
const firstDate = nowBangkok();
if (firstDate.getHours() >= slot) firstDate.setDate(firstDate.getDate() + 1);
// ค้นหาวันเปิดถัดไป (จำกัดจำนวนครั้ง เผื่อตั้งค่าปิดครบทั้งสัปดาห์)
for (let attempts = 0; attempts < 7 && isClosedDate(dateString(firstDate)); attempts++) {
  firstDate.setDate(firstDate.getDate() + 1);
}
let bookingDate = dateString(firstDate);

function isExpired() {
  return bookingDate < today() || (bookingDate === today() && nowBangkok().getHours() >= slot);
}

function isOccupied(table) {
  if (isClosedDate(bookingDate) || isExpired()) return true;
  const demoOccupied = bookingConfig.occupiedByHour[slot] || [];
  return demoOccupied.includes(table) || reservations.some(reservation =>
    reservation.date === bookingDate && reservation.slot === slot && reservation.table === table
  );
}

function fillSelect(select, values, label) {
  select.replaceChildren();
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = label(value);
    select.append(option);
  });
}

function initializeBooking() {
  fillSelect($('#booking-slot'), bookingConfig.startHours, slotText);
  const playerCounts = Array.from({
    length: Math.max(0, bookingConfig.seatsPerTable - bookingConfig.minPlayers + 1)
  }, (_, index) => index + bookingConfig.minPlayers);
  fillSelect($('#booking-people'), playerCounts, count => count + ' คน');

  $('#booking-date').onchange = event => {
    if (!event.target.value || !event.target.checkValidity()) {
      toast(`เลือกวันที่ภายใน ${bookingConfig.advanceDays} วันข้างหน้า`);
      renderBooking();
      return;
    }
    bookingDate = event.target.value;
    selectedTable = null;
    renderBooking();
  };
  $('#booking-slot').onchange = event => {
    slot = Number(event.target.value);
    selectedTable = null;
    renderBooking();
  };
  $('#booking-people').onchange = event => {
    people = Number(event.target.value);
    renderBooking();
  };
  $('#reserve').onclick = openReservation;
}

// ---------------------------------------------------------------------------
// 6. แสดงผังโต๊ะและรายการจอง — ไม่สร้างโครงหน้าทั้งหน้าด้วย string
// ---------------------------------------------------------------------------
function renderBooking() {
  if (selectedTable && isOccupied(selectedTable)) selectedTable = null;
  const maxDate = nowBangkok();
  maxDate.setDate(maxDate.getDate() + bookingConfig.advanceDays);
  $('#booking-date').min = today();
  $('#booking-date').max = dateString(maxDate);
  $('#booking-date').value = bookingDate;
  $('#booking-slot').value = String(slot);
  $('#booking-people').value = String(people);

  const available = allTables().filter(table => !isOccupied(table));
  let title = `ว่าง ${available.length} จาก ${bookingConfig.tableCount} โต๊ะ`;
  if (isClosedDate(bookingDate)) title = 'วันที่เลือก · ร้านปิด';
  else if (isExpired()) title = 'รอบนี้ผ่านไปแล้ว';
  else if (!available.length) title = 'รอบนี้โต๊ะเต็มแล้ว';
  $('#availability-title').textContent = title;
  $('#no-tables').hidden = available.length > 0;
  $('#booking-rules').textContent = `ผังตัวอย่าง ${bookingConfig.tableCount} โต๊ะ · โต๊ะละ ${bookingConfig.seatsPerTable} คน · รอบละ ${bookingConfig.slotHours} ชั่วโมง`;

  const grid = $('#table-grid');
  grid.replaceChildren();
  allTables().forEach(table => {
    const button = template('table-template');
    const occupied = isOccupied(table);
    const selected = selectedTable === table;
    button.dataset.table = String(table);
    button.classList.toggle('busy', occupied);
    button.classList.toggle('selected', selected);
    button.disabled = occupied;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `โต๊ะ ${table} ${occupied ? 'ไม่ว่าง' : `ว่าง ${bookingConfig.seatsPerTable} ที่นั่ง`}`);
    setText(button, 'label', tableLabel(table));
    setText(button, 'status', occupied ? 'ไม่ว่าง' : selected ? 'เลือกแล้ว' : bookingConfig.seatsPerTable + ' ที่นั่ง');
    button.onclick = () => {
      selectedTable = table;
      renderBooking();
      $(`[data-table="${table}"]`).focus();
    };
    grid.append(button);
  });

  $('#summary-date').textContent = displayDate(bookingDate);
  $('#summary-slot').textContent = slotText(slot);
  $('#summary-people').textContent = people + ' คน';
  $('#summary-table').textContent = selectedTable ? tableLabel(selectedTable) : 'ยังไม่ได้เลือก';
  $('#reserve').disabled = !selectedTable;
  $('#reserve').textContent = selectedTable ? 'จองโต๊ะนี้' : 'เลือกโต๊ะบนผังก่อน';
  renderReservations();
  updateAvailabilityPreview();
}

function renderReservations() {
  const list = $('#reservation-list');
  list.replaceChildren();
  $('#no-reservations').hidden = reservations.length > 0;
  const sorted = [...reservations].sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
  sorted.forEach(reservation => {
    const row = template('reservation-template');
    setText(row, 'title', `โต๊ะ ${tableLabel(reservation.table)} · ${reservation.name} · ${reservation.people} คน`);
    setText(row, 'when', `${displayDate(reservation.date)} · ${slotText(reservation.slot)}`);
    setText(row, 'id', reservation.id);
    $('[data-action="cancel"]', row).onclick = () => cancelReservation(reservation.id);
    list.append(row);
  });
}

function fillReservationSummary(content, reservation) {
  setText(content, 'table', `โต๊ะ ${tableLabel(reservation.table)} · ${reservation.people} คน`);
  setText(content, 'when', `${displayDate(reservation.date)} · ${slotText(reservation.slot)}`);
}

function openReservation() {
  if (!selectedTable || isOccupied(selectedTable)) {
    renderBooking();
    return toast('โต๊ะนี้ไม่ว่างแล้ว กรุณาเลือกโต๊ะใหม่');
  }
  const content = template('booking-confirm-template');
  fillReservationSummary(content, { table: selectedTable, people, date: bookingDate, slot });
  $('#reservation-form', content).onsubmit = event => {
    event.preventDefault();
    const name = new FormData(event.target).get('name').trim();
    if (!name) return toast('กรุณาระบุชื่อที่ใช้จอง');
    reservations = loadReservations();
    if (!selectedTable || isOccupied(selectedTable)) {
      $('#booking-dialog').close();
      selectedTable = null;
      renderBooking();
      return toast('โต๊ะนี้ไม่ว่างแล้ว กรุณาเลือกโต๊ะใหม่');
    }
    const reservation = {
      id: 'K-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
      name, date: bookingDate, slot, people, table: selectedTable
    };
    reservations.push(reservation);
    const saved = saveStorage(BOOKING_KEY, reservations);
    selectedTable = null;
    renderBooking();
    const success = template('booking-success-template');
    fillReservationSummary(success, reservation);
    setText(success, 'id', reservation.id);
    setText(success, 'saved', saved
      ? 'ดูหรือยกเลิกได้ใน “การจองของฉัน”'
      : 'เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูล การจองนี้จะหายเมื่อปิดหน้า');
    showDialog('booking-dialog', success);
  };
  showDialog('booking-dialog', content);
}

function cancelReservation(id) {
  const reservation = reservations.find(item => item.id === id);
  if (!reservation) return;
  const content = template('cancel-confirm-template');
  fillReservationSummary(content, reservation);
  $('#confirm-cancel', content).onclick = () => {
    reservations = loadReservations().filter(item => item.id !== id);
    saveStorage(BOOKING_KEY, reservations);
    $('#booking-dialog').close();
    renderBooking();
    toast('ยกเลิกแล้ว โต๊ะกลับมาว่างในรอบเดิม');
  };
  showDialog('booking-dialog', content);
}

// แผงสรุปหน้าร้าน: อ้างอิงรอบที่เลือกและการตั้งค่าใน data.js
function updateAvailabilityPreview() {
  const available = allTables().filter(table => !isOccupied(table)).length;
  const summary = $('.availability');
  $('span', summary).textContent = 'รอบตัวอย่าง ' + slotText(slot);
  const number = $('strong', summary);
  number.replaceChildren(document.createTextNode(available + ' '));
  const label = document.createElement('small');
  label.textContent = `/ ${bookingConfig.tableCount} โต๊ะว่าง`;
  number.append(label);
  const bars = $('.capacity-bars', summary);
  bars.replaceChildren();
  allTables().forEach((table, index) => {
    const bar = document.createElement('i');
    bar.classList.toggle('empty', index >= available);
    bars.append(bar);
  });
}

window.addEventListener('storage', event => {
  if (event.key === BOOKING_KEY) {
    reservations = loadReservations();
    renderBooking();
  }
});

// ---------------------------------------------------------------------------
// 7. ตารางกิจกรรม
// ---------------------------------------------------------------------------
function renderEvents() {
  $('#events-caption').textContent = events.caption;
  $('#events-poster').src = 'assets/' + events.poster;
  const list = $('#event-rows');
  list.replaceChildren();
  events.rows.forEach(event => {
    const row = template('event-template');
    ['day', 'game', 'time'].forEach(field => setText(row, field, event[field]));
    list.append(row);
  });
}

// ---------------------------------------------------------------------------
// 8. แชทเดโม: ใช้ catalog, promo และโต๊ะจาก data.js ไม่มี key ฝั่ง browser
// ---------------------------------------------------------------------------
let chatStarted = false;
let chatBusy = false;
const chatHistory = [];
let spreadsheetKnowledge = null;
let referenceProducts = products;
const productReferenceReady = fetch('assets/product-reference.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(data => { if (Array.isArray(data?.products) && data.products.length) referenceProducts = data.products; }).catch(() => {});
const knowledgeBaseReady = fetch('assets/knowledge.json')
  .then(response => response.ok ? response.json() : null)
  .then(data => { spreadsheetKnowledge = data && Array.isArray(data.documents) ? data : null; })
  .catch(() => { spreadsheetKnowledge = null; });
function addChatMessage(role, text, product = null, tables = null, remember = true) {
  const row = document.createElement('div');
  row.className = `chat-message ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;
  if (text) row.append(bubble);
  if (product) {
    const card = document.createElement('article'); card.className = 'chat-product-card';
    const img = document.createElement('img'); img.src = `assets/${product.image}`; img.alt = `${product.game} ${product.name}`;
    const details = document.createElement('div'); details.className = 'chat-product-copy';
    const game = document.createElement('span'); game.className = 'eyebrow blue'; game.textContent = product.game;
    const name = document.createElement('strong'); name.textContent = product.name;
    const price = document.createElement('b'); price.textContent = money(product.price);
    const promo = document.createElement('small'); promo.textContent = `โปรเดโม: ${promotionSummary(product)}`;
    const add = document.createElement('button'); add.type = 'button'; add.className = 'text-button'; add.textContent = 'เพิ่มลงตะกร้า'; add.onclick = () => addToCart(product.id);
    details.append(game, name, price, promo, add); card.append(img, details); row.append(card);
  }
  if (tables) {
    const card = document.createElement('div'); card.className = 'chat-table-card';
    const firstTable = Array.isArray(tables) ? tables[0]?.metadata : null;
    const board = firstTable
      ? buildKnowledgeDocuments().filter(doc => doc.type === 'table' && doc.metadata.date === firstTable.date && doc.metadata.hour === firstTable.hour)
      : [];
    const heading = document.createElement('strong'); heading.textContent = firstTable ? `${firstTable.dateLabel} · ${firstTable.slotLabel}` : `${displayDate(bookingDate)} · ${slotText(slot)}`;
    const legend = document.createElement('span'); legend.className = 'table-legend'; legend.textContent = '🟢 ว่าง　🔵 เลือกจองได้　⚪ ไม่ว่าง';
    const grid = document.createElement('div'); grid.className = 'chat-table-grid';
    const tableStates = board.length ? board.map(doc => doc.metadata) : allTables().map(number => ({ tableLabel: tableLabel(number), available: !isOccupied(number) }));
    tableStates.forEach(table => { const item = document.createElement('span'); item.className = `chat-table-chip ${table.available ? 'available' : 'occupied'}`; item.textContent = `${table.tableLabel} ${table.available ? 'ว่าง' : 'เต็ม'}`; grid.append(item); });
    const link = document.createElement('button'); link.type = 'button'; link.className = 'button primary'; link.textContent = 'ไปเลือกโต๊ะและจอง'; link.onclick = () => showPage('booking');
    card.append(heading, legend, grid, link); row.append(card);
  }
  $('#chat-messages').append(row); $('#chat-messages').scrollTop = $('#chat-messages').scrollHeight;
  if (remember && text && (role === 'assistant' || role === 'user')) chatHistory.push({ role, text });
}
function promotionSummary(product) {
  const promotion = product.promotion;
  if (!promotion) return 'ไม่มีโปรโมชัน';
  if (promotion.type === 'percent') {
    const quantity = promotion.minimumQuantity || 1;
    const discounted = Math.round(product.price * quantity * (1 - promotion.value / 100));
    return `${promotion.label} · ${quantity} ชิ้น เหลือ ${money(discounted)}`;
  }
  if (promotion.type === 'fixed') return `${promotion.label} · ราคาโปร ${money(Math.max(0, product.price - promotion.value))}`;
  return promotion.label;
}
// Build small, inspectable knowledge chunks from the same data used by the shop.
// They are refreshed per turn so local bookings and the selected date are current.
function buildKnowledgeDocuments() {
  const documents = spreadsheetKnowledge ? spreadsheetKnowledge.documents.filter(doc => !['product', 'promotion'].includes(doc.type)) : [];
  referenceProducts.forEach(product => documents.push({id: `reference-${product.id}`, type: 'product', productId: product.id, title: `${product.game} ${product.name}`, aliases: [...(product.aliases || []), product.name], content: `${product.game} ${product.name}. ${product.desc}. ราคา ${money(product.price)}. สต็อก ${product.stock} ชิ้น. ${promotionSummary(product)}. ${product.details}. ข้อมูลจำลอง`, tags: [product.game, product.name, ...(product.aliases || [])]}));
  const date = bookingDate;
  const dateLabel = displayDate(date);
  bookingConfig.startHours.forEach(hour => allTables().forEach(number => {
    const reservationTaken = reservations.some(item => item.date === date && item.slot === hour && item.table === number);
    const demoTaken = (bookingConfig.occupiedByHour[hour] || []).includes(number);
    const expired = date < today() || (date === today() && nowBangkok().getHours() >= hour);
    const available = !isClosedDate(date) && !expired && !reservationTaken && !demoTaken;
    const label = slotText(hour);
    documents.push({
      id: `table-${date}-${hour}-${number}`, type: 'table',
      title: `โต๊ะ ${tableLabel(number)} วันที่ ${dateLabel} รอบ ${label}`,
      content: `สถานะจองโต๊ะตัวอย่าง วันที่ ${dateLabel} รอบ ${label} โต๊ะ ${tableLabel(number)} ${available ? 'ว่าง สามารถเลือกจองในหน้าเว็บได้' : 'ไม่ว่างหรือร้านปิด'}`,
      tags: ['โต๊ะ เล่นการ์ด จอง ที่นั่ง ว่าง', date, label, ...slotSearchTerms(hour), tableLabel(number)],
      metadata: { date, dateLabel, hour, slotLabel: label, table: number, tableLabel: tableLabel(number), available }
    });
  }));
  events.rows.forEach((event, index) => documents.push({
    id: `event-${index}`, type: 'event', title: `${event.day} ${event.game}`,
    content: `กิจกรรม ${event.game} วันที่ ${event.day} เวลา ${event.time}`,
    tags: ['กิจกรรม แข่งขัน event', event.game, event.day, event.time]
  }));
  const salesSummary = products.map(product => ({
    product,
    units: sales.orders.filter(order => order.productId === product.id).reduce((sum, order) => sum + order.quantity, 0)
  })).sort((a, b) => b.units - a.units);
  if (!spreadsheetKnowledge && salesSummary[0]) documents.push({
    id: 'sales-top', type: 'sales-summary', productId: salesSummary[0].product.id,
    metadata: { productId: salesSummary[0].product.id, productName: salesSummary[0].product.name, game: salesSummary[0].product.game, units: salesSummary[0].units },
    title: 'สรุปสินค้าขายดีและยอดขายตัวอย่าง',
    content: `สินค้าขายดีที่สุดคือ ${salesSummary[0].product.game} ${salesSummary[0].product.name} ขายได้ ${salesSummary[0].units} ชิ้น. ${salesSummary.map(item => `${item.product.name} ${item.units} ชิ้น`).join('. ')}. ข้อมูล ${sales.periodLabel} เป็นข้อมูลจำลอง`,
    tags: ['ยอดขาย ขายดี สถิติ รายงาน dashboard สินค้าขายดีที่สุด อันดับหนึ่ง']
  });
  if (!spreadsheetKnowledge) products.forEach(product => {
    const units = sales.orders.filter(order => order.productId === product.id).reduce((sum, order) => sum + order.quantity, 0);
    documents.push({ id: `sales-${product.id}`, type: 'sales', productId: product.id,
      title: `ยอดขายตัวอย่าง ${product.game} ${product.name}`,
      content: `${product.name} ${product.game} ขายได้ ${units} ชิ้น จากรายการขายจำลอง ${sales.periodLabel}`,
      tags: ['ยอดขาย ขายดี สถิติ รายงาน dashboard', product.game, product.name] });
  });
  return documents;
}
function slotSearchTerms(hour) {
  const terms = {
    14: ['บ่ายสอง', 'สองโมงบ่าย', 'บ่าย 2'],
    16: ['สี่โมงเย็น', 'สี่โมง', '4 โมงเย็น'],
    18: ['หกโมงเย็น', 'หกโมง', '6 โมงเย็น'],
    20: ['สองทุ่ม', '2 ทุ่ม', 'สองทุ่มตรง']
  };
  return [...(terms[hour] || []), `${hour}:00`];
}
function knowledgeTokens(value) {
  const text = String(value || '').toLocaleLowerCase('th-TH').normalize('NFKC');
  const tokens = new Set(text.match(/[a-z0-9]+/g) || []);
  const thaiRuns = text.match(/[\u0E00-\u0E7F]+/g) || [];
  let segmenter;
  try { segmenter = new Intl.Segmenter('th', { granularity: 'word' }); } catch { segmenter = null; }
  thaiRuns.forEach(run => {
    const words = segmenter ? [...segmenter.segment(run)].map(part => part.segment).filter(part => part.length > 1) : [run];
    words.forEach(word => {
      if (word.length > 1) tokens.add(word);
      const size = word.length > 6 ? 3 : 2;
      for (let index = 0; index <= word.length - size; index++) tokens.add(word.slice(index, index + size));
    });
  });
  return tokens;
}
function retrieveKnowledge(query, documents = buildKnowledgeDocuments(), limit = 8) {
  const queryTokens = knowledgeTokens(query);
  if (!queryTokens.size) return [];
  const scored = TCG_RETRIEVAL.select(query, documents).map(document => {
    const searchable = `${document.title} ${document.content} ${(document.tags || []).join(' ')}`;
    const tokens = knowledgeTokens(searchable);
    let score = 0;
    queryTokens.forEach(token => { if (tokens.has(token)) score += token.length >= 4 ? 2 : 1; });
    if (String(query).trim().length > 2 && searchable.toLocaleLowerCase('th-TH').includes(String(query).trim().toLocaleLowerCase('th-TH'))) score += 6;
    if (/โต๊ะ|ที่นั่ง|เล่น|จอง|ว่าง/.test(query) && document.type === 'table') score += 3;
    if (/โปร|ลด|โปรโมชั่น/.test(query) && ['product', 'promotion'].includes(document.type)) score += 2;
    if (/ขายดี|ยอดขาย|ขายได้|อันดับ|ตัวไหน/.test(query) && document.type === 'sales-summary') score += 8;
    else if (/ขายดี|ยอดขาย|ขายได้/.test(query) && document.type === 'sales') score += 1;
    return { document, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) return [];
  const threshold = Math.max(1, Math.min(3, scored[0].score * 0.28));
  return scored.filter(item => item.score >= threshold).slice(0, limit).map(item => item.document);
}
async function askGemini(retrievalQuery) {
  if (!window.SHOP_DATA.chat?.useGemini) return null;
  const history = chatHistory.slice(-12);
  const documents = TCG_RETRIEVAL.select(retrievalQuery, buildKnowledgeDocuments());
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', signal: AbortSignal.timeout(35000), headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: retrievalQuery || history.filter(item => item.role === 'user').at(-1)?.text || '',
        messages: history,
        documents
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data.reply !== 'string' || !data.reply.trim()) return null;
    return { reply: data.reply.trim(), sources: Array.isArray(data.sources) ? data.sources : [] };
  } catch { return null; }
}
function initializeChat() {
  if (chatStarted) return;
  chatStarted = true;
  addChatMessage('assistant', 'สวัสดีค่า วันนี้ให้ช่วยอะไรดีคะ');
}
function fallbackReply(message, sources) {
  const earlierUserMessages = chatHistory.filter(item => item.role === 'user').length - 1;
  const productDoc = sources.find(source => source.type === 'product');
  const product = productDoc && referenceProducts.find(item => item.id === productDoc.productId);
  const tableDocs = sources.filter(source => source.type === 'table');
  const eventDoc = sources.find(source => source.type === 'event');
  const salesDoc = sources.find(source => String(source.type).startsWith('sales'));
  const text = message.toLowerCase();
  if (/^(สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|ดีคับ|hi|hello)[! ครับค่ะ]*$/i.test(text)) return 'สวัสดีค่า วันนี้ให้ช่วยดูอะไรดีคะ';
  if (/ร้านอยู่|ที่อยู่|พิกัด|แผนที่|เดินทาง/.test(text)) return 'ตอนนี้ยังไม่มีที่อยู่ร้านในข้อมูลค่ะ ลองทักเพจ Facebook เกลือ TCG เพื่อขอพิกัดได้เลยนะคะ';
  if (/เปิดกี่|ปิดกี่|เวลาเปิด|เวลา.*ปิด/.test(text)) return 'ยังไม่มีเวลาเปิด–ปิดร้านที่ยืนยันไว้ค่ะ เช็กกับเพจเกลือ TCG ก่อนแวะมาจะชัวร์กว่านะคะ';
  if (/เบอร์|โทร|ติดต่อ/.test(text)) return 'ติดต่อผ่านเพจ Facebook เกลือ TCG ได้ค่ะ ลิงก์อยู่ด้านล่างเว็บนะคะ';
  if (/ส่งของ|จัดส่ง|ค่าส่ง/.test(text)) return 'ยังไม่มีข้อมูลค่าส่งกับวิธีจัดส่งค่ะ ลองสอบถามทางเพจเกลือ TCG ได้เลยนะคะ';
  if (text.length < 3) return 'เหมือนข้อความยังไม่ครบ พิมพ์ต่อได้เลยนะคะ';
  if (/^(ขอบคุณ|ขอบใจ|โอเค|ครับ|ค่ะ|ได้เลย|👍|🙏)[! ครับค่ะ]*$/.test(text)) return 'ได้เลยค่า ถ้าอยากเช็กอะไรเพิ่มบอกได้เลยนะคะ';
  if (tableDocs.length) {
    const bySlot = new Map();
    tableDocs.forEach(doc => {
      const key = `${doc.metadata.date}-${doc.metadata.hour}`;
      if (!bySlot.has(key)) bySlot.set(key, []);
      bySlot.get(key).push(doc);
    });
    const choices = [...bySlot.values()].sort((a, b) => b.filter(doc => doc.metadata.available).length - a.filter(doc => doc.metadata.available).length);
    const best = choices[0];
    const free = best.filter(doc => doc.metadata.available).length;
    return free
      ? `เช็กให้แล้วค่ะ 😊 วันที่ ${best[0].metadata.dateLabel} รอบ ${best[0].metadata.slotLabel} ยังมีโต๊ะว่าง ${free} โต๊ะ สนใจรอบนี้ไหมคะ`
      : 'เช็กแล้วค่ะ รอบที่ค้นเจอเต็มหมดเลย 😅 อยากให้ลองดูวันหรือเวลาอื่นไหมคะ';
  }
  if (salesDoc?.type === 'sales-summary') return `จากยอดตัวอย่าง สินค้าขายดีที่สุดคือ ${salesDoc.metadata.game} ${salesDoc.metadata.productName} ขายได้ ${salesDoc.metadata.units} ชิ้นค่ะ เป็นข้อมูลจำลองนะคะ อยากดูสินค้าตัวนี้ไหมคะ`;
  if (salesDoc?.type === 'sales') return `จากยอดขายตัวอย่าง ${salesDoc.content.replace(/^.*?ขายได้ /, 'ขายได้ ')} ค่ะ เป็นข้อมูลจำลองนะคะ`;
  if (product) {
    if (product.stock < 1) return `รุ่น ${product.name} ตอนนี้หมดชั่วคราวค่ะ อยากให้ช่วยดูเกมใกล้เคียงให้ไหมคะ`;
    if (/โปร|ลด/.test(text)) return `${product.name} มีโปร ${promotionSummary(product)} ค่ะ`;
    if (/สต็อก|เหลือ|กี่ชิ้น|กี่ชุด/.test(text)) return `${product.name} ตอนนี้มี ${product.stock} ชิ้นค่ะ`;
    if (/ราคา|เท่าไ|กี่บาท/.test(text)) return `${product.name} ราคา ${money(product.price)} ค่ะ`;
    return `มีค่ะ เป็น ${product.name} ราคา ${money(product.price)} นะคะ`;

  }
  if (eventDoc) return `มีค่ะ 😊 ${eventDoc.content} นะคะ อยากให้ช่วยดูรายการกิจกรรมอื่นด้วยไหมคะ`;
  if (/โปร|ลด|โปรโมชั่น/.test(text)) return 'โปรจะแยกตามสินค้าเลยค่ะ เล็งเกมไหนไว้เป็นพิเศษไหมคะ เดี๋ยวค้นโปรของรุ่นนั้นให้ค่ะ';
  if (/^(ดี|โอเค|ขอบคุณ|ขอบใจ|ครับ|ค่ะ|จ้า|จ้ะ|ได้เลย|เยี่ยม|👍|🙏)/i.test(message.trim())) {
    return earlierUserMessages > 1
      ? 'ยินดีเลยค่ะ 😊 ถ้ามีอะไรอยากเช็กเพิ่ม พิมพ์มาได้เสมอนะคะ'
      : 'ยินดีค่ะ 😊 มีเกมไหนที่กำลังสนใจเป็นพิเศษไหมคะ บอกชื่อเกมได้เลย เดี๋ยวช่วยดูราคาให้ค่ะ';
  }
  if (/ราคา|เท่าไร|กี่บาท|ซื้อ|เอา|สนใจ/.test(message)) return 'ช่วยดูให้ได้เลยค่ะ กำลังมองหาเกมหรือสินค้าไหนอยู่คะ?';
  return 'หมายถึงอะไรนะคะ ช่วยเล่าเพิ่มอีกนิดได้ไหม';
}
async function answerChat(message) {
  const typing = document.createElement('div');
  typing.className = 'chat-message assistant chat-typing';
  typing.textContent = 'ผู้ช่วยเกลือกำลังพิมพ์…';
  $('#chat-messages').append(typing);
  $('#chat-messages').scrollTop = $('#chat-messages').scrollHeight;
  try {
    await Promise.all([knowledgeBaseReady, productReferenceReady]);
    const userTurns = chatHistory.filter(item => item.role === 'user');
    const smallTalk = /^(สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|ดีคับ|hi|hello|ขอบคุณ|ขอบใจ|โอเค|ครับ|ค่ะ|ได้เลย)[! ครับค่ะ]*$/i.test(message) || message.length < 3;
    const retrievalQuery = smallTalk ? message : TCG_RETRIEVAL.queryFor(message, userTurns.slice(0, -1), buildKnowledgeDocuments());
    const localSources = smallTalk ? [] : retrieveKnowledge(retrievalQuery);
    const generated = await askGemini(retrievalQuery);
    const sources = smallTalk ? [] : generated?.sources?.length ? generated.sources : localSources;
    const reply = generated?.reply || fallbackReply(message, sources);
    const status = document.querySelector('.chat-topline .demo-pill');
    status.textContent = generated ? 'GEMINI' : 'DEMO';
    status.title = generated ? 'ตอบด้วย Gemini จากข้อมูลร้าน' : 'คำตอบสำรองจากข้อมูลเดโม ยังไม่ได้ใช้ Gemini ในข้อความนี้';
    const bubbles = reply.split(/\n+/).map(line => line.trim()).filter(Boolean);
    // Keep every sentence even when the model returns more than four lines.
    if (bubbles.length > 4) bubbles.splice(3, bubbles.length - 3, bubbles.slice(3).join(' '));
    for (const text of bubbles) {
      await new Promise(resolve => setTimeout(resolve, Math.min(900, Math.max(250, text.length * 8))));
      typing.remove();
      addChatMessage('assistant', text, null, null, false);
      $('#chat-messages').append(typing);
    }
    chatHistory.push({ role: 'assistant', text: reply.slice(0, 500) });
    const tableDocs = sources.filter(source => source.type === 'table');
    if (/โต๊ะ|ที่นั่ง|รอบ/.test(reply) && tableDocs.length) addChatMessage('assistant', '', null, tableDocs);
  } catch {
    addChatMessage('assistant', 'ขอโทษค่ะ เมื่อกี้ตอบไม่สำเร็จ ลองส่งข้อความอีกทีนะคะ');
  } finally {
    typing.remove();
    chatBusy = false;
    $('#chat-form button').disabled = false;
    $('#chat-messages').scrollTop = $('#chat-messages').scrollHeight;
  }
}
$('#chat-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#chat-input'); const message = input.value.trim();
  if (!message || chatBusy) return;
  chatBusy = true; $('#chat-form button').disabled = true;
  addChatMessage('user', message); input.value = ''; answerChat(message);
});
$('#chat-suggestions').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return; const input = $('#chat-input'); input.value = button.textContent; $('#chat-form').requestSubmit();
});

// ---------------------------------------------------------------------------
// 9. Dashboard: คำนวณจากรายการตัวอย่างเดียวกับ workbook
// ---------------------------------------------------------------------------
function summarizeSales() {
  return products.map(product => {
    const rows = sales.orders.filter(order => order.productId === product.id);
    const units = rows.reduce((sum, order) => sum + order.quantity, 0);
    return { product, units, orders: rows.length, revenue: units * product.price };
  }).sort((a, b) => b.units - a.units);
}
function renderDashboard() {
  const rows = summarizeSales(); const units = rows.reduce((sum, item) => sum + item.units, 0);
  const revenue = rows.reduce((sum, item) => sum + item.revenue, 0); const orderCount = sales.orders.length;
  const top = rows[0]; const kpis = $('#dashboard-kpis'); kpis.replaceChildren();
  [["ยอดขายจำลอง", money(revenue)], ["ขายได้", `${units} ชิ้น`], ["รายการขาย", `${orderCount} รายการ`], ["ขายดีที่สุด", top?.product.name || '—']].forEach(([label, value]) => {
    const card = document.createElement('article'); card.className = 'kpi-card'; const small = document.createElement('span'); small.textContent = label; const strong = document.createElement('strong'); strong.textContent = value; card.append(small, strong); kpis.append(card);
  });
  const best = $('#best-sellers'); best.replaceChildren(); rows.forEach((item, index) => {
    const row = document.createElement('div'); row.className = 'seller-row'; const rank = document.createElement('span'); rank.className = 'seller-rank'; rank.textContent = String(index + 1).padStart(2, '0');
    const details = document.createElement('div'); details.className = 'seller-details'; const name = document.createElement('strong'); name.textContent = item.product.name; const game = document.createElement('small'); game.textContent = item.product.game; details.append(name, game);
    const count = document.createElement('b'); count.textContent = `${item.units} ชิ้น`; row.append(rank, details, count); best.append(row);
  });
  const breakdown = $('#sales-breakdown'); breakdown.replaceChildren(); const max = Math.max(...rows.map(item => item.revenue), 1);
  rows.forEach(item => { const row = document.createElement('div'); row.className = 'sales-row'; const label = document.createElement('div'); label.className = 'sales-row-label'; const name = document.createElement('span'); name.textContent = item.product.name; const value = document.createElement('strong'); value.textContent = money(item.revenue); label.append(name, value); const track = document.createElement('div'); track.className = 'sales-track'; const fill = document.createElement('i'); fill.style.width = `${Math.max(3, item.revenue / max * 100)}%`; track.append(fill); row.append(label, track); breakdown.append(row); });
}

// ---------------------------------------------------------------------------
// 8. เริ่มต้นหน้าเว็บ (data.js ต้องถูกโหลดก่อน script.js)
// ---------------------------------------------------------------------------
renderFilters();
renderProducts();
updateCartCount();
initializeBooking();
renderBooking();
renderEvents();
