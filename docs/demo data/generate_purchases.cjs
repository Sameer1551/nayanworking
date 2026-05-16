const fs = require('fs');
const path = require('path');

// -------------------- LOAD SUPPLIERS --------------------
const suppliersPath = path.join(__dirname, 'suppliers.json');
const suppliers = JSON.parse(fs.readFileSync(suppliersPath, 'utf-8')).slice(0, 5);

// -------------------- HELPERS --------------------
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomUniqueKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 9; i++) key += chars[rand(0, chars.length - 1)];
    return key;
}

// -------------------- PRICE ENGINE --------------------
function getPrice(category, tier) {
    const map = {
        SPECTACLES: { budget: [400, 900], mid: [900, 2500], premium: [2500, 8000] },
        SUNGLASSES: { budget: [800, 2000], mid: [2000, 5000], premium: [5000, 15000] },
        FRAMES: { budget: [300, 800], mid: [800, 2000], premium: [2000, 6000] },
        LENS: { budget: [200, 600], mid: [600, 1500], premium: [1500, 5000] },
        CONTACT_LENSES: { budget: [600, 1200], mid: [1200, 2500], premium: [2500, 4000] },
        SOLUTIONS: { budget: [100, 300], mid: [300, 600], premium: [600, 1200] },
        OTHER: { budget: [20, 150], mid: [150, 400], premium: [400, 1000] },
        NON_CHARGEABLE: { budget: [0, 0], mid: [0, 0], premium: [0, 0] }
    };
    const [min, max] = map[category][tier];
    return rand(min, max);
}

// -------------------- QUANTITY --------------------
function getQuantity(tier) {
    if (tier === 'premium') return rand(10, 40);
    if (tier === 'mid') return rand(30, 80);
    return rand(80, 200);
}

// -------------------- HSN --------------------
function getHSN(category, material) {
    if (category === 'FRAMES') {
        return (material === 'Metal' || material === 'Titanium')
            ? '9003.1900'
            : '9003.1100';
    }
    const map = {
        SPECTACLES: '9004.9090',
        SUNGLASSES: '9004.1000',
        LENS: '9001.5000',
        CONTACT_LENSES: '9001.3000',
        SOLUTIONS: '3304.9910',
        OTHER: '9004.9090',
        NON_CHARGEABLE: '0000.0000'
    };
    return map[category] || '9004.9090';
}

// -------------------- PRODUCT GENERATION --------------------
function generateCatalog() {
    const catalog = [];
    let code = 1000;

    const shapes = ['Rectangle', 'Round', 'Aviator', 'Square', 'Cat Eye'];
    const materials = ['Acetate', 'Metal', 'TR90', 'Titanium'];
    const types = ['Full Rim', 'Half Rim', 'Rimless'];
    const colors = ['Black', 'Brown', 'Blue', 'Transparent'];
    const sizes = ['S', 'M', 'L'];
    const genders = ['Male', 'Female', 'Unisex'];

    function create(category, count) {
        for (let i = 0; i < count; i++) {
            const tier = pick(['budget', 'mid', 'premium']);
            const shape = pick(shapes);
            const material = pick(materials);
            const type = pick(types);
            const color = pick(colors);
            const size = pick(sizes);
            const gender = pick(genders);
            const hsn = getHSN(category, material);

            catalog.push({
                productCode: `${category.slice(0, 3)}-${code++}`,
                materialName: `${shape} Model ${i}`,
                productDescription: `${material} ${type} ${shape}`,
                category,
                subcategory: tier.toUpperCase(),
                hsn,
                purchasePrice: getPrice(category, tier),
                tier,
                color,
                size,
                type,
                gender,
                shape,
                material
            });
        }
    }

    create('SPECTACLES', 25);
    create('SUNGLASSES', 25);
    create('FRAMES', 25);

    // LENSES
    const coatings = ['ARC', 'Blue Cut', 'Photochromic', 'Anti Glare'];
    const indexTypes = ['1.5', '1.56', '1.6', '1.67'];

    for (let i = 0; i < 40; i++) {
        const coating = pick(coatings);
        const tier = coating === 'Photochromic' ? 'premium' : 'mid';

        catalog.push({
            productCode: `LNS-${code++}`,
            materialName: `Single Vision Lens`,
            productDescription: `${coating} Lens Index ${pick(indexTypes)}`,
            category: 'LENS',
            subcategory: tier.toUpperCase(),
            hsn: getHSN('LENS'),
            purchasePrice: getPrice('LENS', tier),
            tier,
            lensCoating: coating,
            lensIndex: pick(indexTypes)
        });
    }

    // CONTACT LENSES
    const clBrands = ['Acuvue', 'Air Optix', 'Biofinity'];

    for (let i = 0; i < 20; i++) {
        const tier = pick(['mid', 'premium']);

        catalog.push({
            productCode: `CL-${code++}`,
            materialName: `${pick(clBrands)} Monthly`,
            productDescription: `Monthly Disposable Contact Lens`,
            category: 'CONTACT_LENSES',
            subcategory: tier.toUpperCase(),
            hsn: getHSN('CONTACT_LENSES'),
            purchasePrice: getPrice('CONTACT_LENSES', tier),
            tier,
            brand: pick(clBrands)
        });
    }

    // SOLUTIONS
    ['Renu', 'BioTrue', 'Opti-Free'].forEach(name => {
        catalog.push({
            productCode: `SOL-${code++}`,
            materialName: `${name} 300ml`,
            productDescription: `${name} Lens Solution`,
            category: 'SOLUTIONS',
            subcategory: 'MID',
            hsn: getHSN('SOLUTIONS'),
            purchasePrice: rand(200, 500),
            tier: 'mid'
        });
    });

    // OTHER
    for (let i = 0; i < 10; i++) {
        catalog.push({
            productCode: `OTH-${code++}`,
            materialName: `Accessory ${i}`,
            productDescription: `Cleaning Cloth / Case`,
            category: 'OTHER',
            subcategory: 'BUDGET',
            hsn: getHSN('OTHER'),
            purchasePrice: rand(20, 100),
            tier: 'budget'
        });
    }

    // NON_CHARGEABLE
    for (let i = 0; i < 5; i++) {
        catalog.push({
            productCode: `NC-${code++}`,
            materialName: `Promo Item ${i}`,
            productDescription: `Free Cleaning Kit`,
            category: 'NON_CHARGEABLE',
            subcategory: 'PROMO',
            hsn: getHSN('NON_CHARGEABLE'),
            purchasePrice: 0,
            tier: 'budget'
        });
    }

    return catalog;
}

// -------------------- SIMULATION --------------------
const catalog = generateCatalog();
const inventory = {};
let purchases = [];
let billCounter = 1;
let idCounter = 1;
const GST = 12;

catalog.forEach((p, i) => p.supplierIndex = i % 5);

// -------------------- EVERY 2 MONTH PURCHASE --------------------
for (let month = 0; month < 12; month += 2) {

    const supplierBuckets = [[], [], [], [], []];

    catalog.forEach(product => {
        let qty = 0;

        if (month === 0) {
            qty = getQuantity(product.tier);
            inventory[product.productCode] = qty;
        } else {
            const current = inventory[product.productCode] || 0;
            const sold = Math.floor(current * (rand(60, 80) / 100));
            const remaining = current - sold;
            qty = sold;
            inventory[product.productCode] = remaining + qty;
        }

        if (qty > 0) {
            supplierBuckets[product.supplierIndex].push({ product, qty });
        }
    });

    // -------------------- CREATE PURCHASE --------------------
    for (let s = 0; s < 5; s++) {
        const items = supplierBuckets[s];
        if (!items.length) continue;

        const supplier = suppliers[s];
        const billNo = `PB-2024-${String(billCounter++).padStart(4, '0')}`;
        const purchaseDate = new Date(2024, month, rand(1, 28)).toISOString().split('T')[0];
        const uniqueKey = randomUniqueKey();
        const createdAt = purchaseDate;
        const updatedAt = purchaseDate;

        items.forEach(({ product, qty }) => {
            const base = product.purchasePrice * qty;
            const input_gst_amount = +(base * GST / 100).toFixed(2);
            const total_amount = +(base + input_gst_amount).toFixed(2);

            const record = {
                id: idCounter++,
                branch: supplier.branchCode,
                category: product.category,
                created_at: createdAt,
                hsn: product.hsn,
                input_gst_amount,
                input_gst_percent: GST,
                material_name: product.materialName,
                product_code: product.productCode,
                product_description: product.productDescription,
                purchase_bill_no: billNo,
                purchase_date: purchaseDate,
                purchase_price: product.purchasePrice,
                quantity: qty,
                remarks: 'Bi-monthly restock cycle',
                subcategory: product.subcategory,
                supplier_address: 'India',
                supplier_gstin: supplier.gstNumber,
                supplier_name: supplier.companyName,
                total_amount,
                updated_at: updatedAt,
                base_curve: null,
                bridge_size: null,
                color: product.color || null,
                ct: null,
                design: null,
                diameter: null,
                dkt: null,
                gender: product.gender || null,
                lens_addition: null,
                lens_axis: null,
                lens_coating: product.lensCoating || null,
                lens_detail: null,
                lens_index: product.lensIndex || null,
                lens_number: null,
                lens_number_range: null,
                lens_product_name: null,
                material: product.material || null,
                modality: null,
                name: null,
                packing_type: null,
                shape: product.shape || null,
                size: product.size || null,
                solution_name: null,
                temple_details: null,
                type: product.type || null,
                validity: null,
                variant: null,
                water_content: null,
                supplier_id: null,
                unique_key: uniqueKey
            };

            purchases.push(record);
        });
    }
}

// -------------------- SAVE --------------------
const output = path.join(__dirname, 'generated_purchases.json');
fs.writeFileSync(output, JSON.stringify(purchases, null, 2));

console.log(`Generated ${purchases.length} purchase records`);
console.log(`Categories: SPECTACLES=${purchases.filter(p=>p.category==='SPECTACLES').length}, SUNGLASSES=${purchases.filter(p=>p.category==='SUNGLASSES').length}, LENS=${purchases.filter(p=>p.category==='LENS').length}, CONTACT_LENSES=${purchases.filter(p=>p.category==='CONTACT_LENSES').length}, FRAMES=${purchases.filter(p=>p.category==='FRAMES').length}, SOLUTIONS=${purchases.filter(p=>p.category==='SOLUTIONS').length}, OTHER=${purchases.filter(p=>p.category==='OTHER').length}, NON_CHARGEABLE=${purchases.filter(p=>p.category==='NON_CHARGEABLE').length}`);
