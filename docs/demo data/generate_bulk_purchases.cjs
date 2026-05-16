const fs = require('fs');
const path = require('path');

// -------------------- LOAD SUPPLIERS (first 5 only) --------------------
const suppliersPath = path.join(__dirname, 'suppliers.json');
const allSuppliers = JSON.parse(fs.readFileSync(suppliersPath, 'utf-8')).slice(0, 5);

// -------------------- LOAD EXISTING PURCHASE DATES --------------------
const generatedPath = path.join(__dirname, 'generated_purchases.json');
const generated = JSON.parse(fs.readFileSync(generatedPath, 'utf-8'));
const existingDates = [...new Set(generated.map(p => p.purchaseDate))].sort();

// -------------------- HELPERS --------------------
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function nearbyDate() {
    const base = pick(existingDates);
    const offset = rand(-3, 3);
    return addDays(base, offset);
}

function randomUniqueKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 9; i++) key += chars[rand(0, chars.length - 1)];
    return key;
}

// -------------------- BRANDS (MID TIER ONLY) --------------------
const midBrands = {
    SPECTACLES: ['Titan', 'Fastrack', 'Vogue'],
    SUNGLASSES: ['Titan', 'Fastrack', 'Vogue'],
    LENS: ['Insta', 'Carl Zeiss', 'Essilor'],
    CONTACT_LENSES: ['Acuvue', 'Air Optix', 'Biofinity']
};

// -------------------- SHAPES / MATERIALS / TYPES --------------------
const shapes = ['Rectangle', 'Round', 'Aviator', 'Square', 'Cat Eye'];
const materials = ['Acetate', 'Metal', 'TR90', 'Titanium'];
const types = ['Full Rim', 'Half Rim', 'Rimless'];
const colors = ['Black', 'Blue', 'Brown', 'Transparent'];
const sizes = ['S', 'M', 'L'];
const genders = ['Male', 'Female', 'Unisex'];

// -------------------- MID TIER PRICE ENGINE --------------------
function getPrice(category) {
    const map = {
        SPECTACLES: [900, 2500],
        SUNGLASSES: [2000, 5000],
        LENS: [600, 1500],
        CONTACT_LENSES: [1200, 2500]
    };
    const [min, max] = map[category];
    return rand(min, max);
}

// -------------------- HSN MAPPING --------------------
function getHSN(category) {
    if (category === 'SUNGLASSES') return '9004.1000';
    if (category === 'SPECTACLES') return '9004.9090';
    if (category === 'LENS') return '9001.5000';
    if (category === 'CONTACT_LENSES') return '9001.3000';
    return '9004.9090';
}

// -------------------- POWER STEPS FOR LENSES & CONTACT LENSES --------------------
function generatePowerSteps() {
    const steps = [];
    for (let p = -4.0; p <= -0.25; p += 0.25) steps.push(parseFloat(p.toFixed(2)));
    for (let p = 0.25; p <= 4.0; p += 0.25) steps.push(parseFloat(p.toFixed(2)));
    return steps;
}

const POWER_STEPS = generatePowerSteps(); // 32 values

// -------------------- PRODUCT CATALOGUE --------------------
let codeSpectacles = 2000;
let codeLens = 3000;
let codeCL = 4000;

const catalogue = [];

// --- SPECTACLES ---
for (let i = 0; i < 30; i++) {
    const brand = pick(midBrands.SPECTACLES);
    const shape = pick(shapes);
    const material = pick(materials);
    const type = pick(types);
    catalogue.push({
        category: 'SPECTACLES',
        productCode: `SPE-${codeSpectacles++}`,
        materialName: `${brand} ${shape} ${i}`,
        productDescription: `${brand} ${material} ${type} Spectacle Frame with Demo Lens`,
        hsn: getHSN('SPECTACLES'),
        purchasePrice: getPrice('SPECTACLES'),
        brand,
        shape,
        material,
        type,
        color: pick(colors),
        size: pick(sizes),
        gender: pick(genders)
    });
}

// --- SUNGLASSES ---
for (let i = 0; i < 30; i++) {
    const brand = pick(midBrands.SUNGLASSES);
    const shape = pick(shapes);
    const material = pick(materials);
    const type = pick(types);
    catalogue.push({
        category: 'SUNGLASSES',
        productCode: `SUN-${codeSpectacles++}`,
        materialName: `${brand} ${shape} Sunglasses ${i}`,
        productDescription: `${brand} ${material} ${type} Sunglasses`,
        hsn: getHSN('SUNGLASSES'),
        purchasePrice: getPrice('SUNGLASSES'),
        brand,
        shape,
        material,
        type,
        color: pick(colors),
        size: pick(sizes),
        gender: pick(genders)
    });
}

// --- LENS ---
const coatings = ['ARC', 'Blue Cut', 'Photochromic', 'Anti Glare'];
const indices = ['1.5', '1.56', '1.6', '1.67'];

for (let i = 0; i < 20; i++) {
    const coating = pick(coatings);
    catalogue.push({
        category: 'LENS',
        productCode: `LNS-${codeLens++}`,
        materialName: `Single Vision Lens`,
        productDescription: `${coating} Lens Index ${pick(indices)}`,
        hsn: getHSN('LENS'),
        purchasePrice: getPrice('LENS'),
        coating,
        index: pick(indices)
    });
}

// --- CONTACT LENSES ---
for (let i = 0; i < 12; i++) {
    const brand = pick(midBrands.CONTACT_LENSES);
    catalogue.push({
        category: 'CONTACT_LENSES',
        productCode: `CL-${codeCL++}`,
        materialName: `${brand} Monthly`,
        productDescription: `Monthly Disposable Contact Lens`,
        hsn: getHSN('CONTACT_LENSES'),
        purchasePrice: getPrice('CONTACT_LENSES'),
        brand
    });
}

// Assign each catalogue item to a supplier
catalogue.forEach((p, i) => {
    p.supplierIndex = i % 5;
});

// -------------------- SIMULATION STATE --------------------
const GST = 12;
const bulkPurchases = [];   // parent records
const purchaseItems = [];   // child records
let billCounter = 1;
let bulkPurchaseIdCounter = 1;

// Track inventory per product+power
const inventory = {};

// -------------------- PURCHASE CYCLES --------------------
// Cycle 1: Initial bulk buy (50-100 qty)
// Cycle 2: After 2 months — sell 60-80%, replenish
// Cycle 3: After 4 months — replenish again

const cycles = [
    { label: 'Initial bulk purchase - high stock', highQty: true,  sellPercent: null },
    { label: 'Post-sales replenishment',             highQty: false, sellPercent: 70   },
    { label: 'Replenishment cycle 2',                highQty: false, sellPercent: 65   }
];

cycles.forEach((cycle) => {

    // Group items by supplier for this cycle
    const supplierBuckets = [[], [], [], [], []];
    catalogue.forEach(product => {
        supplierBuckets[product.supplierIndex].push(product);
    });

    // Create one bulk_purchase per supplier per cycle
    for (let s = 0; s < 5; s++) {
        const items = supplierBuckets[s];
        if (!items.length) continue;

        const supplier = allSuppliers[s];
        const billNo = `BB-2024-${String(billCounter++).padStart(4, '0')}`;
        const purchaseDate = nearbyDate();
        const uniqueKey = randomUniqueKey();

        let cycleTotalAmount = 0;
        let cycleTotalGst = 0;

        const cycleBulkPurchaseId = bulkPurchaseIdCounter++;

        // Process all items for this supplier in this cycle
        items.forEach(product => {

            if (product.category === 'LENS' || product.category === 'CONTACT_LENSES') {
                // Each power step = one line item
                POWER_STEPS.forEach(power => {
                    let qty;

                    if (cycle.highQty) {
                        qty = rand(50, 100);
                    } else {
                        const key = `${product.productCode}_${power}`;
                        const currentStock = inventory[key] || 0;
                        const targetStock = rand(30, 50);
                        qty = Math.max(0, targetStock - currentStock);
                        if (qty === 0) return;
                    }

                    const base = product.purchasePrice * qty;
                    const inputGstAmount = +(base * GST / 100).toFixed(2);
                    const totalAmount = +(base + inputGstAmount).toFixed(2);

                    cycleTotalAmount += totalAmount;
                    cycleTotalGst += inputGstAmount;

                    const itemUniqueKey = randomUniqueKey();

                    purchaseItems.push({
                        // linking fields
                        bulk_purchase_id: cycleBulkPurchaseId,
                        unique_key: uniqueKey,
                        purchase_bill_no: billNo,
                        // product fields
                        category: product.category,
                        product_code: product.productCode,
                        material_name: product.materialName,
                        product_description: product.productDescription,
                        hsn: product.hsn,
                        quantity: qty,
                        purchase_price: product.purchasePrice,
                        // GST fields
                        input_gst_percent: GST,
                        input_gst_amount: inputGstAmount,
                        total_amount: totalAmount,
                        // optical fields
                        subcategory: 'MID',
                        color: product.color || null,
                        size: product.size || null,
                        type: product.type || null,
                        shape: product.shape || null,
                        material: product.material || null,
                        gender: product.gender || null,
                        // lens/CL specific
                        lens_coating: product.coating || null,
                        lens_index: product.index || null,
                        power: power,
                        // extras
                        remarks: cycle.label,
                        brand: product.brand || null
                    });

                    // Update inventory
                    const key = `${product.productCode}_${power}`;
                    inventory[key] = (inventory[key] || 0) + qty;
                });

            } else {
                // SPECTACLES / SUNGLASSES
                let qty;

                if (cycle.highQty) {
                    qty = rand(50, 100);
                } else {
                    const currentStock = inventory[product.productCode] || 0;
                    const targetStock = rand(40, 60);
                    qty = Math.max(0, targetStock - currentStock);
                    if (qty === 0) return;
                }

                const base = product.purchasePrice * qty;
                const inputGstAmount = +(base * GST / 100).toFixed(2);
                const totalAmount = +(base + inputGstAmount).toFixed(2);

                cycleTotalAmount += totalAmount;
                cycleTotalGst += inputGstAmount;

                purchaseItems.push({
                    bulk_purchase_id: cycleBulkPurchaseId,
                    unique_key: uniqueKey,
                    purchase_bill_no: billNo,
                    category: product.category,
                    product_code: product.productCode,
                    material_name: product.materialName,
                    product_description: product.productDescription,
                    hsn: product.hsn,
                    quantity: qty,
                    purchase_price: product.purchasePrice,
                    input_gst_percent: GST,
                    input_gst_amount: inputGstAmount,
                    total_amount: totalAmount,
                    subcategory: 'MID',
                    color: product.color || null,
                    size: product.size || null,
                    type: product.type || null,
                    shape: product.shape || null,
                    material: product.material || null,
                    gender: product.gender || null,
                    lens_coating: null,
                    lens_index: null,
                    power: null,
                    remarks: cycle.label,
                    brand: product.brand || null
                });

                inventory[product.productCode] = (inventory[product.productCode] || 0) + qty;
            }
        });

        // Only create bulk_purchase header if there are actual items
        const headerItemCount = purchaseItems.filter(p => p.bulk_purchase_id === cycleBulkPurchaseId).length;
        if (headerItemCount > 0) {
            bulkPurchases.push({
                id: cycleBulkPurchaseId,
                branch: supplier.branch,
                created_at: purchaseDate,
                purchase_bill_no: billNo,
                purchase_date: purchaseDate,
                remarks: cycle.label,
                supplier_address: 'India',
                supplier_gstin: supplier.gstNumber,
                supplier_name: supplier.companyName,
                total_bill_amount: +cycleTotalAmount.toFixed(2),
                total_gst_amount: +cycleTotalGst.toFixed(2),
                updated_at: purchaseDate,
                supplier_id: null,
                unique_key: uniqueKey
            });
        }
    }

    // --- SELL SIMULATION between cycles ---
    if (cycle.sellPercent !== null) {
        Object.keys(inventory).forEach(key => {
            const stock = inventory[key];
            if (stock === 0) return;
            const sold = Math.floor(stock * (cycle.sellPercent / 100));
            inventory[key] = stock - sold;
        });
    }
});

// Sort purchase items by bill_no
purchaseItems.sort((a, b) => a.purchase_bill_no.localeCompare(b.purchase_bill_no));

// -------------------- SAVE TWO FILES --------------------
const outputBulk = path.join(__dirname, 'generated_bulk_purchases.json');
const outputItems = path.join(__dirname, 'generated_bulk_purchase_items.json');

fs.writeFileSync(outputBulk, JSON.stringify(bulkPurchases, null, 2));
fs.writeFileSync(outputItems, JSON.stringify(purchaseItems, null, 2));

console.log(`Generated:`);
console.log(`  - bulk_purchases:   ${bulkPurchases.length} bills`);
console.log(`  - purchase_items:   ${purchaseItems.length} line items`);
console.log(`  Spectacles/Sun:     ${purchaseItems.filter(p => p.category === 'SPECTACLES' || p.category === 'SUNGLASSES').length}`);
console.log(`  Lens items:         ${purchaseItems.filter(p => p.category === 'LENS').length}`);
console.log(`  Contact Lens items: ${purchaseItems.filter(p => p.category === 'CONTACT_LENSES').length}`);
console.log(`  Power steps:        ${POWER_STEPS.length} (${POWER_STEPS[0]} to ${POWER_STEPS[POWER_STEPS.length-1]})`);
