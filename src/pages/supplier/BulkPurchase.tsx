import React, { useEffect, useMemo, useState } from 'react';
import { Save, ArrowLeft, Plus, Trash2, Eye, Package, User, DollarSign } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import bulkPurchaseService, { BulkPurchaseData, BulkPurchaseItem } from '../../services/bulkPurchaseService';
import branchService, { Branch } from '../../services/branchService';

interface SupplierInfo {
  name: string;
  address: string;
  gstin: string;
}

const categoryOptions = [
  'Spectacles',
  'Sunglasses',
  'Frame',
  'Lens',
  'Contact Lens',
  'Solution',
  'Other',
  'Non-Chargeable'
] as const;

// Indian GSTIN regex pattern: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric (1-9 or A-Z) + Z + 1 alphanumeric
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const getUuid = (): string => {
  try {
    if (window && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
  } catch (_e) {
    // ignore
  }
  return `bp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const initialPurchaseItem: BulkPurchaseItem = {
  materialName: '',
  productCode: '',
  productDescription: '',
  category: 'Spectacles',
  subcategory: '',
  hsn: '',
  quantity: 1,
  purchasePrice: 0,
  inputGSTPercent: 18,
  inputGSTAmount: 0,
  totalAmount: 0,
  // Conditional fields for Spectacles/Frame/Sunglasses
  color: '',
  size: '',
  type: '',
  gender: '',
  shape: '',
  material: '',
  templeDetails: '',
  bridgeSize: '',
  // Conditional fields for Lens
  lensDetail: '',
  lensCoating: '',
  design: '',
  lensIndex: '',
  lensNumber: '',
  lensAddition: '',
  lensAxis: '',
  lensNumberRange: '',
  // Conditional fields for Contact Lens
  lensProductName: '',
  ct: '',
  baseCurve: '',
  diameter: '',
  modality: '',
  validity: '',
  waterContent: '',
  dkt: '',
  // Conditional fields for Solution
  solutionName: '',
  variant: '',
  packingType: '',
  // Conditional fields for Other/Non-Chargeable
  name: '',
};

const initialFormState = {
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchaseBillNo: '',
  branch: '',
  supplierName: '',
  supplierAddress: '',
  supplierGstin: '',
  remarks: '',
  purchaseItems: [{ ...initialPurchaseItem, id: getUuid() }],
};

const BulkPurchasePage: React.FC = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialFormState);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [gstinError, setGstinError] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const fetchedBranches = await branchService.getAllBranches();
      setBranches(fetchedBranches);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const generateSampleData = (buttonNumber: number) => {
    const sampleSuppliers = [
      { name: 'Optical World Ltd.', address: '123 Main Street, Mumbai', gstin: '27ABCDE1234F1Z5' },
      { name: 'Vision Care Solutions', address: '456 Park Avenue, Delhi', gstin: '07FGHIJ5678K2M6' },
      { name: 'Eye Care Plus', address: '789 Business Park, Bangalore', gstin: '29NOPQR9012S3T7' },
      { name: 'Optical Express', address: '321 Trade Center, Chennai', gstin: '33UVWXY3456Z4A8' },
      { name: 'Spectacle Hub', address: '654 Industrial Area, Hyderabad', gstin: '36BCDEF7890A5B9' }
    ];

    const sampleProducts = [
      { name: 'Premium Round Frame', code: 'BP-SP001', category: 'Spectacles', hsn: '9004.10', price: 1200, color: 'Black', size: 'Medium', type: 'Single Vision', gender: 'Unisex', shape: 'Round', material: 'Acetate' },
      { name: 'Deluxe Square Frame', code: 'BP-SP002', category: 'Spectacles', hsn: '9004.10', price: 1500, color: 'Brown', size: 'Large', type: 'Bifocal', gender: 'Men', shape: 'Square', material: 'Metal' },
      { name: 'Elegant Cat Eye Frame', code: 'BP-SP003', category: 'Spectacles', hsn: '9004.10', price: 1800, color: 'Red', size: 'Small', type: 'Progressive', gender: 'Women', shape: 'Cat Eye', material: 'Acetate' },
      
      { name: 'Premium Aviator Sunglasses', code: 'BP-SG001', category: 'Sunglasses', hsn: '9004.10', price: 2500, color: 'Gold', size: 'Large', type: 'Aviator', gender: 'Unisex', shape: 'Aviator', material: 'Metal' },
      { name: 'Classic Wayfarer Sunglasses', code: 'BP-SG002', category: 'Sunglasses', hsn: '9004.10', price: 2200, color: 'Black', size: 'Medium', type: 'Wayfarer', gender: 'Unisex', shape: 'Wayfarer', material: 'Acetate' },
      { name: 'Fashion Round Sunglasses', code: 'BP-SG003', category: 'Sunglasses', hsn: '9004.10', price: 1900, color: 'Brown', size: 'Small', type: 'Round', gender: 'Women', shape: 'Round', material: 'Acetate' },
      
      { name: 'Premium High Index Lens', code: 'BP-LN001', category: 'Lens', hsn: '9001.40', price: 800, lensDetail: '1.74 High Index', lensCoating: 'Anti-Reflective', design: 'Single Vision', lensIndex: '1.74' },
      { name: 'Smart Photochromic Lens', code: 'BP-LN002', category: 'Lens', hsn: '9001.40', price: 1200, lensDetail: 'Photochromic', lensCoating: 'Photochromic', design: 'Single Vision', lensIndex: '1.50' },
      { name: 'Advanced Progressive Lens', code: 'BP-LN003', category: 'Lens', hsn: '9001.40', price: 2500, lensDetail: 'Progressive', lensCoating: 'Anti-Reflective', design: 'Progressive', lensIndex: '1.67' },
      
      { name: 'Premium Daily Contact Lens', code: 'BP-CL001', category: 'Contact Lens', hsn: '9001.30', price: 150, lensProductName: 'Daily Disposable', ct: '0.08', baseCurve: '8.6', diameter: '14.0', modality: 'Daily' },
      { name: 'Comfort Monthly Contact Lens', code: 'BP-CL002', category: 'Contact Lens', hsn: '9001.30', price: 300, lensProductName: 'Monthly Disposable', ct: '0.10', baseCurve: '8.4', diameter: '14.2', modality: 'Monthly' },
      { name: 'Premium Toric Contact Lens', code: 'BP-CL003', category: 'Contact Lens', hsn: '9001.30', price: 450, lensProductName: 'Toric', ct: '0.12', baseCurve: '8.8', diameter: '14.5', modality: 'Monthly' },
      
      { name: 'Premium Multi-Purpose Solution', code: 'BP-SL001', category: 'Solution', hsn: '3307.90', price: 200, solutionName: 'Multi-Purpose', variant: '120ml', packingType: 'Bottle' },
      { name: 'Gentle Saline Solution', code: 'BP-SL002', category: 'Solution', hsn: '3307.90', price: 150, solutionName: 'Saline', variant: '100ml', packingType: 'Bottle' },
      { name: 'Advanced Enzyme Cleaner', code: 'BP-SL003', category: 'Solution', hsn: '3307.90', price: 300, solutionName: 'Enzyme', variant: '30ml', packingType: 'Bottle' },
      
      { name: 'Premium Lens Cleaning Cloth', code: 'BP-OT001', category: 'Other', hsn: '6302.99', price: 50, otherName: 'Microfiber Cloth', type: 'Cleaning', color: 'White' },
      { name: 'Deluxe Lens Case', code: 'BP-OT002', category: 'Other', hsn: '4202.32', price: 80, otherName: 'Hard Case', type: 'Storage', color: 'Black' },
      { name: 'Professional Lens Tweezers', code: 'BP-OT003', category: 'Other', hsn: '8203.20', price: 120, otherName: 'Stainless Steel', type: 'Tool', material: 'Stainless Steel' }
    ];

    const seed = buttonNumber;
    const numItems = ((seed % 6) + 2); 
    
    const selectedProducts = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numItems; i++) {
      let randomIndex;
      let attempts = 0;
      do {
        randomIndex = ((seed * (i + 1) + attempts) % sampleProducts.length);
        attempts++;
      } while (usedIndices.has(randomIndex) && attempts < sampleProducts.length);
      
      usedIndices.add(randomIndex);
      selectedProducts.push(sampleProducts[randomIndex]);
    }

    const supplierIndex = seed % sampleSuppliers.length;
    const branchIndex = branches.length > 0 ? seed % branches.length : 0;
    const randomSupplier = sampleSuppliers[supplierIndex];
    const randomBranch = branches.length > 0 ? branches[branchIndex] : { code: 'MAIN_BRANCH', name: 'Main Branch' };

    const sampleItems = selectedProducts.map((product, index) => {
      const quantity = ((seed * (index + 1)) % 10) + 1; 
      const gstPercentIndex = ((seed * (index + 1)) % 5);
      const gstPercent = [0, 5, 12, 18, 28][gstPercentIndex];
      const baseAmount = quantity * product.price;
      const gstAmount = (baseAmount * gstPercent) / 100;
      const totalAmount = baseAmount + gstAmount;

      const item: BulkPurchaseItem = {
        id: getUuid(),
        materialName: product.name,
        productCode: product.code,
        productDescription: `${product.name} - ${product.category}`,
        category: product.category as any,
        subcategory: product.category,
        hsn: product.hsn,
        quantity,
        purchasePrice: product.price,
        inputGSTPercent: gstPercent,
        inputGSTAmount: gstAmount,
        totalAmount,
        color: (product as any).color || '',
        size: (product as any).size || '',
        type: (product as any).type || '',
        gender: (product as any).gender || '',
        shape: (product as any).shape || '',
        material: (product as any).material || '',
        templeDetails: (product as any).templeDetails || '',
        bridgeSize: (product as any).bridgeSize || '',
        lensDetail: (product as any).lensDetail || '',
        lensCoating: (product as any).lensCoating || '',
        design: (product as any).design || '',
        lensIndex: (product as any).lensIndex || '',
        lensNumber: (product as any).lensNumber || '',
        lensAddition: (product as any).lensAddition || '',
        lensAxis: (product as any).lensAxis || '',
        lensNumberRange: (product as any).lensNumberRange || '',
        lensProductName: (product as any).lensProductName || '',
        ct: (product as any).ct || '',
        baseCurve: (product as any).baseCurve || '',
        diameter: (product as any).diameter || '',
        modality: (product as any).modality || '',
        validity: (product as any).validity || '',
        waterContent: (product as any).waterContent || '',
        dkt: (product as any).dkt || '',
        solutionName: (product as any).solutionName || '',
        variant: (product as any).variant || '',
        packingType: (product as any).packingType || '',
        name: product.category === 'Other' ? (product as any).otherName || '' : '',
      };

      return item;
    });

    setFormState({
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchaseBillNo: `BULK-SAMPLE-${buttonNumber.toString().padStart(2, '0')}-${Date.now().toString().slice(-6)}`,
      branch: randomBranch.code,
      supplierName: randomSupplier.name,
      supplierAddress: randomSupplier.address,
      supplierGstin: randomSupplier.gstin,
      remarks: `Bulk Purchase Sample ${buttonNumber} - ${numItems} items`,
      purchaseItems: sampleItems,
    });

    setSuccessMessage(`Bulk Purchase Sample ${buttonNumber} loaded successfully with ${numItems} items!`);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const { totalBillAmount, totalGstAmount } = useMemo(() => {
    let totalBill = 0;
    let totalGst = 0;
    
    formState.purchaseItems.forEach(item => {
      totalBill += item.totalAmount;
      totalGst += item.inputGSTAmount;
    });
    
    return {
      totalBillAmount: Number(totalBill.toFixed(2)),
      totalGstAmount: Number(totalGst.toFixed(2)),
    };
  }, [formState.purchaseItems]);

  // GSTIN validation
  const validateGstin = (gstin: string): boolean => {
    if (!gstin || gstin.trim() === '') return false;
    return GSTIN_REGEX.test(gstin.toUpperCase());
  };

  // GSTIN validation state
  const isGstinValid = useMemo(() => {
    return validateGstin(formState.supplierGstin);
  }, [formState.supplierGstin]);

  const isFormValid = useMemo(() => {
    return (
      formState.purchaseDate !== '' &&
      formState.purchaseBillNo.trim() !== '' &&
      formState.branch !== '' &&
      formState.supplierName.trim() !== '' &&
      formState.supplierAddress.trim() !== '' &&
      formState.supplierGstin.trim() !== '' &&
      isGstinValid &&
      formState.purchaseItems.length > 0 &&
      formState.purchaseItems.every(item => {
        // Non-Chargeable items can have zero price/quantity
        const isNonChargeable = item.category === 'Non-Chargeable';

        const basicFieldsValid =
          item.materialName.trim() !== '' &&
          item.productCode.trim() !== '' &&
          item.hsn.trim() !== '' &&
          (isNonChargeable || item.quantity > 0) &&
          (isNonChargeable || item.purchasePrice > 0) &&
          (isNonChargeable || item.totalAmount > 0);

        return basicFieldsValid;
      })
    );
  }, [formState, isGstinValid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Clear GSTIN error when user starts typing in the GSTIN field
    if (name === 'supplierGstin') {
      setGstinError('');
    }

    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handlePurchaseItemChange = (index: number, field: keyof BulkPurchaseItem, value: any) => {
    setFormState(prev => {
      const newItems = [...prev.purchaseItems];
      const item = { ...newItems[index] };
      
      const numericalFields = ['quantity', 'purchasePrice', 'inputGSTPercent'];
      
      if (numericalFields.includes(field)) {
        const numValue = parseFloat(value) || 0;
        (item as any)[field] = numValue;
        
        const base = item.quantity * item.purchasePrice;
        item.inputGSTAmount = (base * item.inputGSTPercent) / 100;
        item.totalAmount = base + item.inputGSTAmount;
      } else {
        (item as any)[field] = value;
      }
      
      newItems[index] = item;
      return { ...prev, purchaseItems: newItems };
    });
  };

  const addPurchaseItem = () => {
    setFormState(prev => ({
      ...prev,
      purchaseItems: [...prev.purchaseItems, { ...initialPurchaseItem, id: getUuid() }]
    }));
  };

  const removePurchaseItem = (index: number) => {
    if (formState.purchaseItems.length > 1) {
      setFormState(prev => ({
        ...prev,
        purchaseItems: prev.purchaseItems.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.supplierGstin.trim()) {
      setSuccessMessage('Supplier GSTIN is required.');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!validateGstin(formState.supplierGstin)) {
      setSuccessMessage('Invalid GSTIN format. GSTIN must be 15 characters following the pattern: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric (1-9 or A-Z), Z, 1 alphanumeric.');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!isFormValid) {
      setSuccessMessage('Please fill all required fields correctly.');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const bulkPurchaseData: BulkPurchaseData = {
        purchaseDate: formState.purchaseDate,
        purchaseBillNo: formState.purchaseBillNo.trim(),
        branch: formState.branch,
        supplierName: formState.supplierName.trim(),
        supplierAddress: formState.supplierAddress.trim(),
        supplierGstin: formState.supplierGstin.trim(),
        remarks: formState.remarks.trim() || undefined,
        purchaseItems: formState.purchaseItems.map(item => ({
          materialName: item.materialName.trim(),
          productCode: item.productCode.trim(),
          productDescription: item.productDescription?.trim() || `${item.materialName.trim()} - ${item.category}`,
          category: item.category,
          subcategory: item.subcategory.trim() || item.category,
          hsn: item.hsn.trim(),
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          inputGSTPercent: item.inputGSTPercent,
          inputGSTAmount: item.inputGSTAmount,
          totalAmount: item.totalAmount,
          // Include all conditional fields
          color: item.color,
          size: item.size,
          type: item.type,
          gender: item.gender,
          shape: item.shape,
          material: item.material,
          templeDetails: item.templeDetails,
          bridgeSize: item.bridgeSize,
          lensDetail: item.lensDetail,
          lensCoating: item.lensCoating,
          design: item.design,
          lensIndex: item.lensIndex,
          lensNumber: item.lensNumber,
          lensAddition: item.lensAddition,
          lensAxis: item.lensAxis,
          lensNumberRange: item.lensNumberRange,
          lensProductName: item.lensProductName,
          ct: item.ct,
          baseCurve: item.baseCurve,
          diameter: item.diameter,
          modality: item.modality,
          validity: item.validity,
          waterContent: item.waterContent,
          dkt: item.dkt,
          solutionName: item.solutionName,
          variant: item.variant,
          packingType: item.packingType,
          name: item.name,
        })),
        totalBillAmount,
        totalGstAmount,
      };

      const result = await bulkPurchaseService.createBulkPurchase(bulkPurchaseData);
      
      if (result.success) {
        setFormState(initialFormState);
        setSuccessMessage('Bulk purchase created successfully!');
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSuccessMessage(`Error: ${result.message}`);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error saving bulk purchase:', error);
      setSuccessMessage('Failed to save bulk purchase. Please try again.');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const renderConditionalFields = (item: BulkPurchaseItem, index: number) => {
    const handleFieldChange = (field: keyof BulkPurchaseItem, value: any) => {
      handlePurchaseItemChange(index, field, value);
    };

    const inputClass = "border border-gray-400 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-gray-100";

    const renderBasicInputs = (fieldNames: string[]) => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {fieldNames.map(fieldName => (
          <div key={fieldName}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{fieldName.replace(/([A-Z])/g, ' $1').trim()}</label>
            <input
              value={(item as any)[fieldName]}
              onChange={(e) => handleFieldChange(fieldName as keyof BulkPurchaseItem, e.target.value)}
              className={inputClass}
              placeholder={`Enter ${fieldName.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
    );

    switch (item.category) {
      case 'Spectacles':
      case 'Frame':
      case 'Sunglasses':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                <input value={item.color} onChange={(e) => handleFieldChange('color', e.target.value)} className={inputClass} placeholder="Enter color" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                <input value={item.size} onChange={(e) => handleFieldChange('size', e.target.value)} className={inputClass} placeholder="Enter size" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <input value={item.type} onChange={(e) => handleFieldChange('type', e.target.value)} className={inputClass} placeholder="Enter type" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                <select value={item.gender} onChange={(e) => handleFieldChange('gender', e.target.value)} className={inputClass}>
                  <option value="">Select Gender</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>
            </div>
            {renderBasicInputs(['shape', 'material', 'templeDetails', 'bridgeSize'])}
          </>
        );

      case 'Lens':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {renderBasicInputs(['lensDetail', 'color', 'material', 'type'])}
            </div>
            {renderBasicInputs(['lensCoating', 'design', 'lensIndex', 'lensNumber', 'lensAddition', 'lensAxis', 'lensNumberRange'])}
          </>
        );

      case 'Contact Lens':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {renderBasicInputs(['lensProductName', 'lensNumber', 'ct', 'lensAddition', 'lensAxis', 'color', 'type', 'baseCurve', 'diameter', 'material', 'modality', 'validity', 'waterContent', 'dkt'])}
            </div>
          </>
        );

      case 'Solution':
        return renderBasicInputs(['solutionName', 'variant', 'packingType', 'color']);
        
      case 'Other':
        return renderBasicInputs(['name', 'type', 'color', 'shape', 'size']);
        
      case 'Non-Chargeable':
        return renderBasicInputs(['name', 'type', 'color', 'shape', 'size', 'material']);
        
      default:
        return null;
    }
  };

  const renderPurchaseItemForm = (item: BulkPurchaseItem, index: number) => (
    <div key={item.id || index} className="p-4 bg-gray-100 rounded-xl border border-gray-300 shadow-inner mb-4">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
        <h4 className="font-semibold text-gray-800">Item {index + 1}</h4>
        {formState.purchaseItems.length > 1 && (
          <button
            type="button"
            onClick={() => removePurchaseItem(index)}
            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Product Code *</label>
          <input
            value={item.productCode}
            onChange={(e) => handlePurchaseItemChange(index, 'productCode', e.target.value)}
            required
            className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-white"
            placeholder="Enter product code"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            value={item.materialName}
            onChange={(e) => handlePurchaseItemChange(index, 'materialName', e.target.value)}
            required
            className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-white"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Product Description</label>
          <input
            value={item.productDescription}
            onChange={(e) => handlePurchaseItemChange(index, 'productDescription', e.target.value)}
            className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-white"
            placeholder="Enter detailed description (optional)"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={item.category}
            onChange={(e) => handlePurchaseItemChange(index, 'category', e.target.value as any)}
            required
            className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-white"
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Subcategory</label>
          <input
            value={item.subcategory}
            onChange={(e) => handlePurchaseItemChange(index, 'subcategory', e.target.value)}
            className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-white"
            placeholder="Enter subcategory"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">HSN Code *</label>
          <input
            value={item.hsn}
            onChange={(e) => handlePurchaseItemChange(index, 'hsn', e.target.value)}
            required
            className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-white"
            placeholder="Enter HSN code"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
          <input
            type="number"
            min={item.category === 'Non-Chargeable' ? '0' : '1'}
            value={item.quantity}
            onChange={(e) => handlePurchaseItemChange(index, 'quantity', e.target.value)}
            required
            className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-white"
            placeholder="Enter quantity"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price Per Unit *</label>
          <input
            type="number"
            min={item.category === 'Non-Chargeable' ? '0' : '0.01'}
            step="0.01"
            value={item.purchasePrice}
            onChange={(e) => handlePurchaseItemChange(index, 'purchasePrice', e.target.value)}
            required
            className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-white"
            placeholder="Enter price per unit"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Input GST % *</label>
          <select
            value={item.inputGSTPercent}
            onChange={(e) => handlePurchaseItemChange(index, 'inputGSTPercent', e.target.value)}
            required
            className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-white"
          >
            <option value="0">0</option>
            <option value="5">5</option>
            <option value="12">12</option>
            <option value="18">18</option>
            <option value="28">28</option>
          </select>
        </div>
      </div>

      {item.category && (
        <div className="mt-6 p-4 bg-gray-200 rounded-lg border border-gray-300">
          <h5 className="font-medium text-gray-700 mb-4">
            {item.category} Specific Details
          </h5>
          
          {renderConditionalFields(item, index)}
          
          <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-300 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div><span className="font-medium text-gray-700">Base Amount:</span> ₹{(item.quantity * item.purchasePrice).toFixed(2)}</div>
              <div><span className="font-medium text-gray-700">GST Amount:</span> ₹{item.inputGSTAmount.toFixed(2)}</div>
              <div className="font-semibold text-green-600">Total Amount: ₹{item.totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 px-2">
      <div className="container mx-auto max-w-screen-2xl">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-4 p-3 flex items-center justify-between">
          <Link
            to="/supplier/purchase"
            className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200 hover:bg-emerald-50 px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Purchases</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">New Bulk Purchase</h1>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 text-sm">Bill No:</span>
            <span className="font-semibold text-gray-800">{formState.purchaseBillNo || 'N/A'}</span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            {/* Bill & Supplier Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bill Details Card */}
              <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-300 shadow-md space-y-3">
                <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Package className="h-5 w-5 text-cyan-600" />
                  <span>Bill Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
                    <input name="purchaseDate" type="date" value={formState.purchaseDate} onChange={handleInputChange} required className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-cyan-500 transition-all bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Bill No *</label>
                    <input name="purchaseBillNo" value={formState.purchaseBillNo} onChange={handleInputChange} required className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-cyan-500 transition-all bg-white" placeholder="Enter bill number" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                    <select name="branch" value={formState.branch} onChange={handleInputChange} required className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-cyan-500 transition-all bg-white">
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (<option key={branch.code} value={branch.code}>{branch.name} - {branch.address}</option>))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Supplier Details Card */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 shadow-md space-y-3">
                <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <User className="h-5 w-5 text-amber-600" />
                  <span>Supplier Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                    <input name="supplierName" value={formState.supplierName} onChange={handleInputChange} required className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 transition-all bg-white" placeholder="Enter supplier name" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Address *</label>
                    <textarea name="supplierAddress" value={formState.supplierAddress} onChange={handleInputChange} required className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 transition-all bg-white" placeholder="Enter supplier address" rows={2}></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN *</label>
                    <input
                      name="supplierGstin"
                      value={formState.supplierGstin}
                      onChange={handleInputChange}
                      required
                      className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 transition-all ${
                        formState.supplierGstin.trim() && !isGstinValid
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-400 bg-white'
                      }`}
                      placeholder="Enter GSTIN (e.g., 27AABCR1234F1Z5)"
                    />
                    {formState.supplierGstin.trim() && !isGstinValid && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <span className="mr-1">⚠</span>
                        Invalid GSTIN format. Expected: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea name="remarks" value={formState.remarks} onChange={handleInputChange} className="w-full border-gray-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 transition-all bg-white" placeholder="Enter remarks" rows={1}></textarea>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Purchase Items Section */}
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-300 shadow-md space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  <span>Purchase Items</span>
                </h3>
                <button
                  type="button"
                  onClick={addPurchaseItem}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>
              
              {formState.purchaseItems.map((item, index) => renderPurchaseItemForm(item, index))}
            </div>
            
            {/* Bill Summary & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="p-4 bg-green-50 rounded-xl border border-green-300 shadow-md">
                  <h3 className="font-bold mb-4 text-lg text-gray-800">Bill Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-blue-600">{formState.purchaseItems.length}</div>
                      <div className="text-sm text-gray-600">Total Items</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">₹{totalGstAmount.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Total GST</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-emerald-600">₹{totalBillAmount.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Total Bill Amount</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-300 shadow-md h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-800">Form Status & Actions</h3>
                    <div className="p-3 border border-gray-400 rounded-lg bg-white">
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-medium ${isFormValid ? 'text-green-700' : 'text-red-700'}`}>
                          {isFormValid ? 'Form is valid' : 'Form is incomplete or invalid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <button
                      type="submit"
                      disabled={isSaving || !isFormValid}
                      className={`w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium ${
                        isSaving || !isFormValid ? 'bg-gray-400 cursor-not-allowed text-white' :
                        saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                        saveStatus === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                        'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Create Bulk Purchase</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {successMessage && (
              <div className={`mt-4 p-3 rounded-lg ${saveStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {successMessage}
              </div>
            )}
          </form>
        </div>

        {/* Sample Data Buttons Section */}
        <div className="mt-8 p-6 bg-blue-100 rounded-xl border border-blue-300 shadow-md">
          <h3 className="font-bold mb-4 text-lg text-blue-800">Load Sample Data</h3>
          <p className="text-sm text-blue-700 mb-4">Click a button to load a sample bulk purchase record. This is useful for testing the form's layout and functionality.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => generateSampleData(num)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                Sample {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkPurchasePage;
