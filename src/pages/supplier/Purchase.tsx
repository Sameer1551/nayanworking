import React, { useEffect, useMemo, useState } from 'react';
import { Save, ArrowLeft, User, Package, DollarSign, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import branchService, { Branch } from '../../services/branchService';

interface SupplierInfo {
  name: string;
  address: string;
  gstin: string;
}

interface PurchaseRecordV2 {
  id: string;
  purchaseDate: string;
  purchaseBillNo: string;
  branch: string;
  category: 'Spectacles' | 'Frame' | 'Lens' | 'Contact Lens' | 'Solution' | 'Other' | 'Non-Chargeable';
  productCode: string;
  productName: string;
  hsn: string;
  quantity: number;
  purchasePrice: number;
  inputGSTPercent: number;
  inputGSTAmount: number;
  totalAmount: number;
  supplier: SupplierInfo;
  remarks?: string;
  
  // Conditional fields based on category
  // Spectacles/Frame/Sunglasses fields
  color?: string;
  size?: string;
  type?: string;
  gender?: string;
  shape?: string;
  material?: string;
  templeDetails?: string;
  bridgeSize?: string;
  
  // Lens fields
  lensDetail?: string;
  lensCoating?: string;
  design?: string;
  lensIndex?: string;
  lensNumber?: string;
  lensAddition?: string;
  lensAxis?: string;
  lensNumberRange?: string;
  
  // Contact Lens fields
  lensProductName?: string;
  ct?: string;
  baseCurve?: string;
  diameter?: string;
  modality?: string;
  validity?: string;
  waterContent?: string;
  dkt?: string;
  
  // Solution fields
  solutionName?: string;
  variant?: string;
  packingType?: string;
  
  // Other/Non-Chargeable fields
  name?: string;
}

interface PurchaseFormState {
  purchaseDate: string;
  purchaseBillNo: string;
  branch: string;
  category: string;
  productCode: string;
  productName: string;
  productDescription: string;
  hsn: string;
  quantity: string;
  purchasePrice: string;
  inputGSTPercent: string;
  supplierName: string;
  supplierAddress: string;
  supplierGstin: string;
  remarks: string;
  subcategory: string; // Added missing subcategory field
  
  // Conditional fields (Spectacles/Frame/Sunglasses)
  color: string;
  size: string;
  type: string;
  gender: string;
  shape: string;
  material: string;
  templeDetails: string;
  bridgeSize: string;
  lensDetail: string;
  lensCoating: string;
  design: string;
  lensIndex: string;
  lensNumber: string;
  lensAddition: string;
  lensAxis: string;
  lensNumberRange: string;
  lensProductName: string;
  ct: string;
  baseCurve: string;
  diameter: string;
  modality: string;
  validity: string;
  waterContent: string;
  dkt: string;
  solutionName: string;
  variant: string;
  packingType: string;
  name: string;
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

const initialFormState: PurchaseFormState = {
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchaseBillNo: '',
  branch: '',
  category: '',
  productCode: '',
  productName: '',
  productDescription: '',
  hsn: '',
  quantity: '',
  purchasePrice: '',
  inputGSTPercent: '',
  supplierName: '',
  supplierAddress: '',
  supplierGstin: '',
  remarks: '',
  subcategory: '', // Added subcategory
  color: '',
  size: '',
  type: '',
  gender: '',
  shape: '',
  material: '',
  templeDetails: '',
  bridgeSize: '',
  lensDetail: '',
  lensCoating: '',
  design: '',
  lensIndex: '',
  lensNumber: '',
  lensAddition: '',
  lensAxis: '',
  lensNumberRange: '',
  lensProductName: '',
  ct: '',
  baseCurve: '',
  diameter: '',
  modality: '',
  validity: '',
  waterContent: '',
  dkt: '',
  solutionName: '',
  variant: '',
  packingType: '',
  name: '',
};

const PurchasePage: React.FC = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<PurchaseFormState>(initialFormState);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [gstinError, setGstinError] = useState<string>('');

  // Load branches from backend
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const fetchedBranches = await branchService.getAllBranches();
        setBranches(fetchedBranches);
      } catch (error) {
        console.error('Error loading branches:', error);
      }
    };
    loadBranches();
  }, []);

  // Sample data for each category
  const sampleData = {
    Spectacles: {
      sample1: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'SPC-001',
        branch: 'JUNG',
        category: 'Spectacles' as const,
        productName: 'Ray-Ban Aviator Classic',
        productCode: 'SPC-001',
        subcategory: 'Aviator',
        hsn: '9004.10',
        quantity: '10',
        purchasePrice: '2500.00',
        inputGSTPercent: '18',
        supplierName: 'Ray-Ban India',
        supplierAddress: 'Mumbai, Maharashtra',
        supplierGstin: '27AABCR1234Z1Z5',
        remarks: 'Premium aviator sunglasses',
        color: 'Gold',
        size: '58mm',
        type: 'Aviator',
        gender: 'Unisex',
        shape: 'Aviator',
        material: 'Gold-plated metal',
        templeDetails: 'Spring hinge with gold finish',
        bridgeSize: '18mm'
      },
      sample2: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'SPC-002',
        branch: 'BATH',
        category: 'Spectacles' as const,
        productName: 'Titan Rimless Premium',
        productCode: 'SPC-002',
        subcategory: 'Rimless',
        hsn: '9004.10',
        quantity: '15',
        purchasePrice: '1800.00',
        inputGSTPercent: '18',
        supplierName: 'Titan Company Ltd',
        supplierAddress: 'Bangalore, Karnataka',
        supplierGstin: '29AABCT1234Z1Z5',
        remarks: 'Lightweight rimless spectacles',
        color: 'Silver',
        size: '56mm',
        type: 'Rimless',
        gender: 'Unisex',
        shape: 'Rectangle',
        material: 'Titanium',
        templeDetails: 'Spring hinge with temple tips',
        bridgeSize: '16mm'
      }
    },
    Frame: {
      sample1: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'FRM-001',
        branch: 'BATH',
        category: 'Frame',
        productCode: 'FRM-001',
        productName: 'Titan Rimless Frame',
        subcategory: 'Rimless',
        hsn: '9003.11',
        quantity: '15',
        purchasePrice: '800.00',
        inputGSTPercent: '18',
        supplierName: 'Titan Company Ltd',
        supplierAddress: 'Bangalore, Karnataka',
        supplierGstin: '29AABCT1234Z1Z5',
        remarks: 'Lightweight rimless frames',
        color: 'Silver',
        size: '54mm',
        type: 'Rimless',
        gender: 'Unisex',
        shape: 'Rectangle',
        material: 'Titanium',
        templeDetails: 'Spring hinge',
        bridgeSize: '16mm'
      },
      sample2: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'FRM-002',
        branch: 'DIGL',
        category: 'Frame',
        productCode: 'FRM-002',
        productName: 'Vincent Chase Full Rim',
        subcategory: 'Full Rim',
        hsn: '9003.11',
        quantity: '20',
        purchasePrice: '450.00',
        inputGSTPercent: '18',
        supplierName: 'Vincent Chase',
        supplierAddress: 'Delhi, NCR',
        supplierGstin: '07AABCV1234Z1Z5',
        remarks: 'Durable full rim frames',
        color: 'Black',
        size: '52mm',
        type: 'Full Rim',
        gender: 'Unisex',
        shape: 'Rectangle',
        material: 'Acetate',
        templeDetails: 'Standard hinge',
        bridgeSize: '18mm'
      }
    },
    Lens: {
      sample1: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'LNS-001',
        branch: 'DIGL',
        category: 'Lens',
        productCode: 'LNS-001',
        productName: 'Zeiss Progressive Lens',
        subcategory: 'Progressive',
        hsn: '9001.40',
        quantity: '20',
        purchasePrice: '1200.00',
        inputGSTPercent: '18',
        supplierName: 'Zeiss India',
        supplierAddress: 'Gurgaon, Haryana',
        supplierGstin: '06AABCZ1234Z1Z5',
        remarks: 'Premium progressive lenses',
        color: 'Clear',
        material: 'Polycarbonate',
        type: 'Progressive',
        lensDetail: 'Progressive',
        lensCoating: 'Anti-reflective',
        design: 'Digital',
        lensIndex: '1.67',
        lensNumber: '-2.00 to +2.00',
        lensAddition: '+1.50 to +2.50',
        lensAxis: '0-180',
        lensNumberRange: '-6.00 to +6.00'
      },
      sample2: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'LNS-002',
        branch: 'MAYA',
        category: 'Lens',
        productCode: 'LNS-002',
        productName: 'Essilor Single Vision',
        subcategory: 'Single Vision',
        hsn: '9001.40',
        quantity: '25',
        purchasePrice: '800.00',
        inputGSTPercent: '18',
        supplierName: 'Essilor India',
        supplierAddress: 'Mumbai, Maharashtra',
        supplierGstin: '27AABCE1234Z1Z5',
        remarks: 'High-quality single vision lenses',
        color: 'Clear',
        material: 'CR-39',
        type: 'Single Vision',
        lensDetail: 'Single Vision',
        lensCoating: 'Anti-reflective',
        design: 'Standard',
        lensIndex: '1.50',
        lensNumber: '-4.00 to +4.00',
        lensAddition: 'N/A',
        lensAxis: '0-180',
        lensNumberRange: '-8.00 to +8.00'
      }
    },
    'Contact Lens': {
      sample1: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'CTL-001',
        branch: 'MAYA',
        category: 'Contact Lens',
        productCode: 'CTL-001',
        productName: 'Acuvue Daily Disposable',
        subcategory: 'Daily Disposable',
        hsn: '9001.30',
        quantity: '100',
        purchasePrice: '45.00',
        inputGSTPercent: '18',
        supplierName: 'Johnson & Johnson',
        supplierAddress: 'Mumbai, Maharashtra',
        supplierGstin: '27AABCJ1234Z1Z5',
        remarks: 'Daily disposable contact lenses',
        color: 'Clear',
        type: 'Daily Disposable',
        material: 'Silicone Hydrogel',
        lensProductName: 'Acuvue 1-Day',
        ct: '0.084mm',
        baseCurve: '8.5mm',
        diameter: '14.2mm',
        modality: 'Daily',
        validity: '30',
        waterContent: '58%',
        dkt: '25.5'
      },
      sample2: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'CTL-002',
        branch: 'RANG',
        category: 'Contact Lens',
        productCode: 'CTL-002',
        productName: 'Air Optix Monthly',
        subcategory: 'Monthly',
        hsn: '9001.30',
        quantity: '50',
        purchasePrice: '120.00',
        inputGSTPercent: '18',
        supplierName: 'Alcon India',
        supplierAddress: 'Bangalore, Karnataka',
        supplierGstin: '29AABCA1234Z1Z5',
        remarks: 'Monthly replacement contact lenses',
        color: 'Clear',
        type: 'Monthly',
        material: 'Silicone Hydrogel',
        lensProductName: 'Air Optix Plus',
        ct: '0.08mm',
        baseCurve: '8.6mm',
        diameter: '14.2mm',
        modality: 'Monthly',
        validity: '90',
        waterContent: '33%',
        dkt: '138'
      }
    },
    Solution: {
      sample1: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'SOL-001',
        branch: 'RANG',
        category: 'Solution',
        productCode: 'SOL-001',
        productName: 'Opti-Free Puremoist',
        subcategory: 'Multi-Purpose',
        hsn: '3307.90',
        quantity: '50',
        purchasePrice: '180.00',
        inputGSTPercent: '18',
        supplierName: 'Alcon India',
        supplierAddress: 'Bangalore, Karnataka',
        supplierGstin: '29AABCA1234Z1Z5',
        remarks: 'Multi-purpose contact lens solution',
        color: 'Clear',
        solutionName: 'Opti-Free Puremoist',
        variant: 'Multi-Purpose',
        packingType: '355ml Bottle'
      },
      sample2: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'SOL-002',
        branch: 'HAVE',
        category: 'Solution',
        productCode: 'SOL-002',
        productName: 'Renu Advanced Formula',
        subcategory: 'Multi-Purpose',
        hsn: '3307.90',
        quantity: '40',
        purchasePrice: '160.00',
        inputGSTPercent: '18',
        supplierName: 'Bausch & Lomb',
        supplierAddress: 'Mumbai, Maharashtra',
        supplierGstin: '27AABCB1234Z1Z5',
        remarks: 'Advanced multi-purpose solution',
        color: 'Clear',
        solutionName: 'Renu Advanced Formula',
        variant: 'Multi-Purpose',
        packingType: '300ml Bottle'
      }
    },
    Other: {
      sample1: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'OTH-001',
        branch: 'HAVE',
        category: 'Other',
        productCode: 'OTH-001',
        productName: 'Microfiber Cleaning Cloth',
        subcategory: 'Cleaning Accessory',
        hsn: '6302.60',
        quantity: '100',
        purchasePrice: '25.00',
        inputGSTPercent: '18',
        supplierName: 'Optical Supplies Co',
        supplierAddress: 'Chennai, Tamil Nadu',
        supplierGstin: '33AABCO1234Z1Z5',
        remarks: 'Premium cleaning cloths',
        color: 'Blue',
        type: 'Cleaning Accessory',
        shape: 'Rectangle',
        size: '15cm x 15cm',
        name: 'Microfiber Cloth'
      },
      sample2: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'OTH-002',
        branch: 'NEIL',
        category: 'Other',
        productCode: 'OTH-002',
        productName: 'Lens Cleaning Spray',
        subcategory: 'Cleaning Accessory',
        hsn: '3307.90',
        quantity: '30',
        purchasePrice: '120.00',
        inputGSTPercent: '18',
        supplierName: 'Optical Supplies Co',
        supplierAddress: 'Chennai, Tamil Nadu',
        supplierGstin: '33AABCO1234Z1Z5',
        remarks: 'Professional lens cleaning spray',
        color: 'Clear',
        type: 'Cleaning Accessory',
        shape: 'Spray',
        size: '100ml',
        name: 'Lens Cleaner'
      }
    },
    'Non-Chargeable': {
      sample1: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'NCH-001',
        branch: 'NEIL',
        category: 'Non-Chargeable',
        productCode: 'NCH-001',
        productName: 'Display Stand',
        subcategory: 'Display Equipment',
        hsn: '9405.99',
        quantity: '5',
        purchasePrice: '0.00',
        inputGSTPercent: '0',
        supplierName: 'Display Solutions',
        supplierAddress: 'Delhi, NCR',
        supplierGstin: '07AABCD1234Z1Z5',
        remarks: 'Free display stands for promotion',
        color: 'Black',
        type: 'Display Equipment',
        shape: 'Stand',
        size: 'Standard',
        material: 'Metal',
        name: 'Display Stand'
      },
      sample2: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'NCH-002',
        branch: 'JUNG',
        category: 'Non-Chargeable',
        productCode: 'NCH-002',
        productName: 'Brochure Holder',
        subcategory: 'Display Equipment',
        hsn: '9405.99',
        quantity: '10',
        purchasePrice: '0.00',
        inputGSTPercent: '0',
        supplierName: 'Display Solutions',
        supplierAddress: 'Delhi, NCR',
        supplierGstin: '07AABCD1234Z1Z5',
        remarks: 'Free brochure holders for marketing',
        color: 'Silver',
        type: 'Display Equipment',
        shape: 'Holder',
        size: 'A4',
        material: 'Plastic',
        name: 'Brochure Holder'
      }
    },
    Sunglasses: {
      sample1: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'SGL-001',
        branch: 'NEIL',
        category: 'Sunglasses' as const,
        productName: 'Oakley Holbrook Matte Black',
        productCode: 'SGL-001',
        subcategory: 'Sport',
        hsn: '9004.10',
        quantity: '15',
        purchasePrice: '2200.00',
        inputGSTPercent: '18',
        supplierName: 'Oakley India',
        supplierAddress: 'Gurgaon, Haryana',
        supplierGstin: '06AABCO1234Z1Z5',
        remarks: 'Premium sport sunglasses with polarized lenses',
        color: 'Matte Black',
        size: '59mm',
        type: 'Sport',
        gender: 'Unisex',
        shape: 'Rectangle',
        material: 'O-Matter',
        templeDetails: 'Unobtainium earsocks',
        bridgeSize: '17mm'
      },
      sample2: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseBillNo: 'SGL-002',
        branch: 'BATH',
        category: 'Sunglasses' as const,
        productName: 'Ray-Ban Wayfarer Classic',
        productCode: 'SGL-002',
        subcategory: 'Classic',
        hsn: '9004.10',
        quantity: '12',
        purchasePrice: '2800.00',
        inputGSTPercent: '18',
        supplierName: 'Ray-Ban India',
        supplierAddress: 'Mumbai, Maharashtra',
        supplierGstin: '27AABCR1234Z1Z5',
        remarks: 'Classic wayfarer sunglasses',
        color: 'Tortoise',
        size: '55mm',
        type: 'Classic',
        gender: 'Unisex',
        shape: 'Wayfarer',
        material: 'Acetate',
        templeDetails: 'Classic temple design',
        bridgeSize: '19mm'
      }
    }
  };

  const loadSampleData = (category: keyof typeof sampleData, sampleNumber: 'sample1' | 'sample2') => {
    setIsLoadingSample(true);
    const categoryData = sampleData[category];
    if (!categoryData) {
      setSuccessMessage('No sample data available for this category');
      setSaveStatus('error');
      setTimeout(() => {
        setSuccessMessage('');
        setSaveStatus('idle');
      }, 3000);
      setIsLoadingSample(false);
      return;
    }

    const data = categoryData[sampleNumber];
    if (!data) {
      setSuccessMessage(`Sample ${sampleNumber} not available for ${category}`);
      setSaveStatus('error');
      setTimeout(() => {
        setSuccessMessage('');
        setSaveStatus('idle');
      }, 3000);
      setIsLoadingSample(false);
      return;
    }
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setFormState(prev => ({
        ...prev,
        ...data,
        quantity: String(data.quantity),
        purchasePrice: String(data.purchasePrice),
        inputGSTPercent: String(data.inputGSTPercent),
      }));
      setSuccessMessage(`Loaded ${sampleNumber} sample data for ${category}`);
      setSaveStatus('success');
      setIsLoadingSample(false);
      setTimeout(() => {
        setSuccessMessage('');
        setSaveStatus('idle');
      }, 3000);
    }, 500);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const numericQuantity = useMemo(() => {
    const parsed = parseFloat(formState.quantity);
    return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  }, [formState.quantity]);
  
  const numericPrice = useMemo(() => {
    const parsed = parseFloat(formState.purchasePrice);
    return isNaN(parsed) || parsed < 0.01 ? 0 : parsed;
  }, [formState.purchasePrice]);
  
  const numericGstPercent = useMemo(() => {
    const parsed = parseFloat(formState.inputGSTPercent);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [formState.inputGSTPercent]);

  const { gstAmount, totalAmount } = useMemo(() => {
    const base = numericQuantity * numericPrice;
    const gst = (base * numericGstPercent) / 100;
    const total = base + gst;
    return {
      gstAmount: Number(gst.toFixed(2)),
      totalAmount: Number(total.toFixed(2)),
    };
  }, [numericQuantity, numericPrice, numericGstPercent]);

  // GSTIN validation
  const validateGstin = (gstin: string): boolean => {
    if (!gstin || gstin.trim() === '') return false;
    return GSTIN_REGEX.test(gstin.toUpperCase());
  };

  // GSTIN validation state
  const isGstinValid = useMemo(() => {
    return validateGstin(formState.supplierGstin);
  }, [formState.supplierGstin]);

  // Form validation state
  const isFormValid = useMemo(() => {
    const isNonChargeable = formState.category === 'Non-Chargeable';

    return (
      formState.purchaseDate !== '' &&
      formState.purchaseBillNo.trim() !== '' &&
      formState.branch !== '' &&
      formState.productName.trim() !== '' &&
      formState.productCode.trim() !== '' &&
      formState.hsn.trim() !== '' &&
      formState.category !== '' &&
      formState.subcategory.trim() !== '' &&
      formState.quantity.trim() !== '' &&
      formState.purchasePrice.trim() !== '' &&
      formState.inputGSTPercent !== '' &&
      formState.supplierName.trim() !== '' &&
      formState.supplierAddress.trim() !== '' &&
      formState.supplierGstin.trim() !== '' &&
      isGstinValid &&
      (isNonChargeable || numericQuantity > 0) &&
      (isNonChargeable || numericPrice > 0) &&
      (isNonChargeable || totalAmount > 0)
    );
  }, [formState, numericQuantity, numericPrice, totalAmount, isGstinValid]);

  // Add keyboard shortcut for form submission (Ctrl+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isFormValid && !isSaving) {
          const form = document.querySelector('form');
          if (form) {
            form.requestSubmit();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFormValid, isSaving]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Clear GSTIN error when user starts typing in the GSTIN field
    if (name === 'supplierGstin') {
      setGstinError('');
    }

    // Special handling for numeric fields
    if (name === 'quantity' || name === 'purchasePrice' || name === 'inputGSTPercent') {
      // Only allow positive numbers and decimal points
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormState((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormState(prev => ({ ...initialFormState, purchaseDate: prev.purchaseDate, purchaseBillNo: prev.purchaseBillNo, branch: prev.branch, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields and numeric values
    if (!formState.purchaseBillNo.trim()) {
      setSuccessMessage('Purchase bill number is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.purchaseDate) {
      setSuccessMessage('Purchase date is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.branch) {
      setSuccessMessage('Branch is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.productName.trim()) {
      setSuccessMessage('Product name is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.productCode.trim()) {
      setSuccessMessage('Product code is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.hsn.trim()) {
      setSuccessMessage('HSN code is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.category) {
      setSuccessMessage('Category is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.subcategory || formState.subcategory.trim() === '') {
      setSuccessMessage('Subcategory is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.quantity || formState.quantity.trim() === '') {
      setSuccessMessage('Quantity is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.purchasePrice || formState.purchasePrice.trim() === '') {
      setSuccessMessage('Purchase price is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.inputGSTPercent || formState.inputGSTPercent.trim() === '') {
      setSuccessMessage('Input GST percent is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    // For Non-Chargeable items, zero price/quantity is allowed
    const isNonChargeable = formState.category === 'Non-Chargeable';

    if (!isNonChargeable && numericQuantity <= 0) {
      setSuccessMessage('Quantity must be greater than 0');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!isNonChargeable && numericPrice <= 0) {
      setSuccessMessage('Purchase price must be greater than 0');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!isNonChargeable && totalAmount <= 0) {
      setSuccessMessage('Total amount must be greater than 0');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (gstAmount < 0) {
      setSuccessMessage('GST amount cannot be negative');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.supplierName.trim()) {
      setSuccessMessage('Supplier name is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.supplierAddress.trim()) {
      setSuccessMessage('Supplier address is required');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!formState.supplierGstin.trim()) {
      setSuccessMessage('Supplier GSTIN is required');
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

    // Additional validation for calculated values
    if (isNaN(totalAmount) || !isFinite(totalAmount)) {
      setSuccessMessage('Invalid total amount calculation');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (isNaN(gstAmount) || !isFinite(gstAmount)) {
      setSuccessMessage('Invalid GST amount calculation');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    // Debug logging for values being sent
    console.log('Form validation passed. Values to be sent:', {
      quantity: numericQuantity,
      purchasePrice: numericPrice,
      inputGSTPercent: numericGstPercent,
      gstAmount,
      totalAmount,
      calculatedBase: numericQuantity * numericPrice,
      calculatedGST: (numericQuantity * numericPrice * numericGstPercent) / 100
    });

    // Create the data object that matches the PurchaseData interface
    const record = {
      purchaseDate: formState.purchaseDate,
      purchaseBillNo: formState.purchaseBillNo.trim(),
      branch: formState.branch,
      materialName: formState.productName.trim(), // Map productName to materialName
      productCode: formState.productCode.trim(),
      productDescription: formState.productDescription?.trim() || `${formState.productName.trim()} - ${formState.category}`, // Use user input or fallback
      category: (() => {
        // Map frontend categories to backend-expected category names
        // The backend service expects these exact category names for proper mapping
        switch (formState.category) {
          case 'Spectacles':
            return 'Spectacles' as const;
          case 'Sunglasses':
            return 'Sunglasses' as const;
          case 'Frame':
            return 'Frame' as const;
          case 'Contact Lens':
            return 'Contact Lens' as const;
          case 'Lens':
            return 'Lens' as const;
          case 'Solution':
            return 'Solution' as const;
          case 'Other':
            return 'Other' as const;
          case 'Non-Chargeable':
            return 'Non-Chargeable' as const;
          default:
            return 'Spectacles' as const;
        }
      })(),
      subcategory: formState.subcategory.trim() || formState.type.trim() || formState.category, // Use subcategory or fallback
      hsn: formState.hsn.trim(),
      quantity: numericQuantity,
      purchasePrice: Number(numericPrice.toFixed(2)),
      inputGSTPercent: Number(numericGstPercent.toFixed(2)),
      inputGSTAmount: gstAmount,
      totalAmount: totalAmount,
      supplier: {
        name: formState.supplierName.trim(),
        address: formState.supplierAddress.trim(),
        gstin: formState.supplierGstin.trim(),
      },
      remarks: formState.remarks.trim() || undefined,
      // Conditional fields for Spectacles/Frame/Sunglasses
      color: formState.color.trim() || undefined,
      size: formState.size.trim() || undefined,
      type: formState.type.trim() || undefined,
      gender: formState.gender.trim() || undefined,
      shape: formState.shape.trim() || undefined,
      material: formState.material.trim() || undefined,
      templeDetails: formState.templeDetails.trim() || undefined,
      bridgeSize: formState.bridgeSize.trim() || undefined,
      // Conditional fields for Lens
      lensDetail: formState.lensDetail.trim() || undefined,
      lensCoating: formState.lensCoating.trim() || undefined,
      design: formState.design.trim() || undefined,
      lensIndex: formState.lensIndex.trim() || undefined,
      lensNumber: formState.lensNumber.trim() || undefined,
      lensAddition: formState.lensAddition.trim() || undefined,
      lensAxis: formState.lensAxis.trim() || undefined,
      lensNumberRange: formState.lensNumberRange.trim() || undefined,
      // Conditional fields for Contact Lens
      lensProductName: formState.lensProductName.trim() || undefined,
      ct: formState.ct.trim() || undefined,
      baseCurve: formState.baseCurve.trim() || undefined,
      diameter: formState.diameter.trim() || undefined,
      modality: formState.modality.trim() || undefined,
      validity: formState.validity.trim() || undefined,
      waterContent: formState.waterContent.trim() || undefined,
      dkt: formState.dkt.trim() || undefined,
      // Conditional fields for Solution
      solutionName: formState.solutionName.trim() || undefined,
      variant: formState.variant.trim() || undefined,
      packingType: formState.packingType.trim() || undefined,
      // Conditional fields for Other/Non-Chargeable
      name: formState.name.trim() || undefined,
    };

    // Debug logging
    console.log('Form submission data:', {
      formState,
      calculatedValues: {
        numericQuantity,
        numericPrice,
        numericGstPercent,
        gstAmount,
        totalAmount
      },
      record
    });

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const result = await purchaseService.appendPurchaseData(record);
      
      if (result.success) {
        // Clear form after successful submission
        setFormState({
          ...initialFormState,
          purchaseDate: new Date().toISOString().slice(0, 10), // Keep current date
        });
        setSuccessMessage('Purchase saved to MySQL database successfully!');
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
              } else {
          // Show more detailed error message
          let errorMsg = result.message;
          if (errorMsg.includes('Validation errors:')) {
            setSuccessMessage(`Validation Error: ${errorMsg}`);
          } else if (errorMsg.includes('HTTP')) {
            setSuccessMessage(`Server Error: ${errorMsg}. Please check if the backend is running on port 8080.`);
          } else if (errorMsg.includes('already exists')) {
            setSuccessMessage(`Duplicate Error: ${errorMsg}. Please use a different purchase bill number.`);
          } else {
            setSuccessMessage(`Error: ${errorMsg}`);
          }
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
    } catch (error) {
      console.error('Error saving purchase:', error);
      let errorMsg = 'Failed to save purchase. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMsg = 'Cannot connect to server. Please check if the backend is running on port 8080.';
        } else {
          errorMsg = error.message;
        }
      }
      
      setSuccessMessage(errorMsg);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('error'), 3000);
    } finally {
      setIsSaving(false);
    }

    window.setTimeout(() => setSuccessMessage(''), 5000);
  };
  
  // Conditional field rendering functions
  const renderSpectaclesFrameFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-3 bg-white rounded-xl shadow-inner">
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2">Basic Product Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Product Code *</label>
            <input
              name="productCode"
              value={formState.productCode}
              onChange={handleInputChange}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Enter product code"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Product Name *</label>
            <input
              name="productName"
              value={formState.productName}
              onChange={handleInputChange}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Enter product name"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Product Description</label>
            <input
              name="productDescription"
              value={formState.productDescription}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Enter detailed description (optional)"
            />
          </div>
        </div>
      </div>
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2 mt-4">Physical Attributes</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Color</label>
            <input name="color" value={formState.color} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter color" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Size</label>
            <input name="size" value={formState.size} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter size" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Type</label>
            <input name="type" value={formState.type} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter type" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Gender</label>
            <select name="gender" value={formState.gender} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="">Select Gender</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-gray-600">Shape</label>
            <input name="shape" value={formState.shape} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter shape" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Material</label>
            <input name="material" value={formState.material} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter material" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Temple Details</label>
            <input name="templeDetails" value={formState.templeDetails} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter temple details" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Bridge Size</label>
            <input name="bridgeSize" value={formState.bridgeSize} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter bridge size" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSunglassesFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-3 bg-white rounded-xl shadow-inner">
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2">Basic Product Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Product Code *</label>
            <input name="productCode" value={formState.productCode} onChange={handleInputChange} required className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter product code" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Product Name *</label>
            <input name="productName" value={formState.productName} onChange={handleInputChange} required className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter product name" />
          </div>
        </div>
      </div>
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2 mt-4">Physical Attributes</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Color</label>
            <input name="color" value={formState.color} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter color" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Size</label>
            <input name="size" value={formState.size} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter size" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Type</label>
            <input name="type" value={formState.type} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="e.g., Aviator, Wayfarer, Round" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Gender</label>
            <select name="gender" value={formState.gender} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="">Select Gender</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-gray-600">Shape</label>
            <input name="shape" value={formState.shape} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter shape" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Material</label>
            <input name="material" value={formState.material} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter material" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Temple Details</label>
            <input name="templeDetails" value={formState.templeDetails} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter temple details" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Bridge Size</label>
            <input name="bridgeSize" value={formState.bridgeSize} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter bridge size" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderLensFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-3 bg-white rounded-xl shadow-inner">
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2">Basic Product Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Product Code *</label>
            <input name="productCode" value={formState.productCode} onChange={handleInputChange} required className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter product code" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Lens Detail</label>
            <input name="lensDetail" value={formState.lensDetail} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens detail" />
          </div>
        </div>
      </div>
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2 mt-4">Technical Specifications</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Color</label>
            <input name="color" value={formState.color} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter color" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Material</label>
            <input name="material" value={formState.material} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter material" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Vision</label>
            <input name="type" value={formState.type} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter vision type" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Lens Coating</label>
            <input name="lensCoating" value={formState.lensCoating} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens coating" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Design</label>
            <input name="design" value={formState.design} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter design" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Lens Index</label>
            <input name="lensIndex" value={formState.lensIndex} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens index" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Lens Number</label>
            <input name="lensNumber" value={formState.lensNumber} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens number" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Lens Addition</label>
            <input name="lensAddition" value={formState.lensAddition} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens addition" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Lens Axis</label>
            <input name="lensAxis" value={formState.lensAxis} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens axis" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Lens Number Range</label>
            <input name="lensNumberRange" value={formState.lensNumberRange} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens number range" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactLensFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-3 bg-white rounded-xl shadow-inner">
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2">Basic Product Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Product Code *</label>
            <input name="productCode" value={formState.productCode} onChange={handleInputChange} required className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter product code" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Lens Product Name</label>
            <input name="lensProductName" value={formState.lensProductName} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens product name" />
          </div>
        </div>
      </div>
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2 mt-4">Technical Specifications</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Lens Number</label>
            <input name="lensNumber" value={formState.lensNumber} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens number" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">CT (Center Thickness)</label>
            <input name="ct" value={formState.ct} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter center thickness" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Lens Addition</label>
            <input name="lensAddition" value={formState.lensAddition} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens addition" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Lens Axis</label>
            <input name="lensAxis" value={formState.lensAxis} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lens axis" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Color</label>
            <input name="color" value={formState.color} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter color" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Type</label>
            <input name="type" value={formState.type} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter type" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Base Curve</label>
            <input name="baseCurve" value={formState.baseCurve} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter base curve" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Diameter</label>
            <input name="diameter" value={formState.diameter} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter diameter" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Material</label>
            <input name="material" value={formState.material} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter material" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Modality</label>
            <input name="modality" value={formState.modality} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter modality" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Validity (in days)</label>
            <input name="validity" value={formState.validity} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter validity in days" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">WC (Water Content)</label>
            <input name="waterContent" value={formState.waterContent} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter water content" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Dk/t (Permeability)</label>
            <input name="dkt" value={formState.dkt} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter Dk/t value" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSolutionFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-3 bg-white rounded-xl shadow-inner">
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2">Basic Product Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Product Code *</label>
            <input name="productCode" value={formState.productCode} onChange={handleInputChange} required className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter product code" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Solution Name</label>
            <input name="solutionName" value={formState.solutionName} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter solution name" />
          </div>
        </div>
      </div>
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2 mt-4">Physical Attributes</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Variant</label>
            <input name="variant" value={formState.variant} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter variant" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Packing Type</label>
            <input name="packingType" value={formState.packingType} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter packing type" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Color</label>
            <input name="color" value={formState.color} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter color" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderOtherFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-3 bg-white rounded-xl shadow-inner">
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2">Basic Product Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Product Code *</label>
            <input name="productCode" value={formState.productCode} onChange={handleInputChange} required className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter product code" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Name</label>
            <input name="name" value={formState.name} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter name" />
          </div>
        </div>
      </div>
      <div className="col-span-1 md:col-span-2">
        <h4 className="font-semibold text-gray-700 mb-2 mt-4">Physical Attributes</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-gray-600">Type</label>
            <input name="type" value={formState.type} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter type" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Color</label>
            <input name="color" value={formState.color} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter color" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Shape</label>
            <input name="shape" value={formState.shape} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter shape" />
          </div>
          <div>
            <label className="block font-medium text-gray-600">Size</label>
            <input name="size" value={formState.size} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter size" />
          </div>
          {formState.category === 'Non-Chargeable' && (
            <div>
              <label className="block font-medium text-gray-600">Material</label>
              <input name="material" value={formState.material} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter material" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderConditionalFields = () => {
    switch (formState.category) {
      case 'Spectacles':
      case 'Frame':
        return renderSpectaclesFrameFields();
      case 'Sunglasses':
        return renderSunglassesFields();
      case 'Lens':
        return renderLensFields();
      case 'Contact Lens':
        return renderContactLensFields();
      case 'Solution':
        return renderSolutionFields();
      case 'Other':
      case 'Non-Chargeable':
        return renderOtherFields();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="w-full">
        {/* Header with Back Button */}
        <div className="bg-white shadow-sm rounded-lg mb-2 p-2 flex items-center justify-between">
          <Link
            to="/supplier/purchase"
            className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200 hover:bg-emerald-50 px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Purchases</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">New Purchase Entry</h1>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 text-sm">Bill No:</span>
            <span className="font-semibold text-gray-800">{formState.purchaseBillNo || 'N/A'}</span>
          </div>
        </div>

        {/* Form Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-bold">i</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Form Guidelines</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• All fields marked with * are required</li>
                <li>• Use Ctrl+Enter to quickly submit the form</li>
                <li>• Select a category first to load sample data (2 options available)</li>
                <li>• GST amount and total are calculated automatically</li>
                <li>• Form progress is shown at the top</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-2xl overflow-hidden p-3 space-y-3">
          
          {/* Success/Error Message Display */}
          {successMessage && (
            <div className={`p-4 rounded-lg border ${
              saveStatus === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : saveStatus === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{successMessage}</span>
                <button
                  type="button"
                  onClick={() => setSuccessMessage('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Form Progress Indicator */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-800">Form Completion Progress</h4>
              <span className="text-sm text-blue-600 font-medium">
                {(() => {
                  const baseFields = ['purchaseDate', 'purchaseBillNo', 'branch', 'category', 'productCode', 'productName', 'hsn', 'quantity', 'purchasePrice', 'inputGSTPercent', 'supplierName', 'supplierAddress', 'supplierGstin', 'subcategory'];
                  let categoryFields: string[] = [];
                  switch(formState.category) {
                    case 'Spectacles':
                    case 'Frame':
                    case 'Sunglasses':
                      categoryFields = ['color', 'size', 'type', 'gender', 'shape', 'material', 'templeDetails', 'bridgeSize'];
                      break;
                    case 'Lens':
                      categoryFields = ['color', 'material', 'type', 'lensDetail', 'lensCoating', 'design', 'lensIndex', 'lensNumber', 'lensAddition', 'lensAxis', 'lensNumberRange'];
                      break;
                    case 'Contact Lens':
                      categoryFields = ['lensProductName', 'ct', 'baseCurve', 'diameter', 'modality', 'validity', 'waterContent', 'dkt', 'lensNumber', 'lensAddition', 'lensAxis', 'color', 'type', 'material'];
                      break;
                    case 'Solution':
                      categoryFields = ['solutionName', 'variant', 'packingType', 'color'];
                      break;
                    case 'Other':
                    case 'Non-Chargeable':
                      categoryFields = ['name', 'type', 'color', 'shape', 'size'];
                      if (formState.category === 'Non-Chargeable') categoryFields.push('material');
                      break;
                  }
                  const relevantFields = [...baseFields, ...categoryFields];
                  const filledFields = relevantFields.filter(key => {
                    const value = formState[key as keyof PurchaseFormState];
                    return typeof value === 'string' ? value.trim() !== '' : value !== '';
                  });
                  return Math.round((filledFields.length / relevantFields.length) * 100);
                })()}% Complete
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(() => {
                    const baseFields = ['purchaseDate', 'purchaseBillNo', 'branch', 'category', 'productCode', 'productName', 'hsn', 'quantity', 'purchasePrice', 'inputGSTPercent', 'supplierName', 'supplierAddress', 'supplierGstin', 'subcategory'];
                    let categoryFields: string[] = [];
                    switch(formState.category) {
                      case 'Spectacles':
                      case 'Frame':
                      case 'Sunglasses':
                        categoryFields = ['color', 'size', 'type', 'gender', 'shape', 'material', 'templeDetails', 'bridgeSize'];
                        break;
                      case 'Lens':
                        categoryFields = ['color', 'material', 'type', 'lensDetail', 'lensCoating', 'design', 'lensIndex', 'lensNumber', 'lensAddition', 'lensAxis', 'lensNumberRange'];
                        break;
                      case 'Contact Lens':
                        categoryFields = ['lensProductName', 'ct', 'baseCurve', 'diameter', 'modality', 'validity', 'waterContent', 'dkt', 'lensNumber', 'lensAddition', 'lensAxis', 'color', 'type', 'material'];
                        break;
                      case 'Solution':
                        categoryFields = ['solutionName', 'variant', 'packingType', 'color'];
                        break;
                      case 'Other':
                      case 'Non-Chargeable':
                        categoryFields = ['name', 'type', 'color', 'shape', 'size'];
                        if (formState.category === 'Non-Chargeable') categoryFields.push('material');
                        break;
                    }
                    const relevantFields = [...baseFields, ...categoryFields];
                    const filledFields = relevantFields.filter(key => {
                      const value = formState[key as keyof PurchaseFormState];
                      return typeof value === 'string' ? value.trim() !== '' : value !== '';
                    });
                    return Math.round((filledFields.length / relevantFields.length) * 100);
                  })()}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Form Validation Summary */}
          {!isFormValid && formState.category && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">Please complete the following required fields:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {!formState.purchaseDate && <li>• Purchase Date</li>}
                {!formState.purchaseBillNo.trim() && <li>• Purchase Bill Number</li>}
                {!formState.branch && <li>• Branch</li>}
                {!formState.productName.trim() && <li>• Product Name</li>}
                {!formState.productCode.trim() && <li>• Product Code</li>}
                {!formState.hsn.trim() && <li>• HSN Code</li>}
                {!formState.category && <li>• Category</li>}
                {!formState.subcategory.trim() && <li>• Subcategory</li>}
                {!formState.quantity.trim() && <li>• Quantity</li>}
                {!formState.purchasePrice.trim() && <li>• Purchase Price</li>}
                {!formState.inputGSTPercent && <li>• GST Percentage</li>}
                {!formState.supplierName.trim() && <li>• Supplier Name</li>}
                {!formState.supplierAddress.trim() && <li>• Supplier Address</li>}
                {!formState.supplierGstin.trim() && <li>• Supplier GSTIN</li>}
                {formState.category !== 'Non-Chargeable' && numericQuantity <= 0 && <li>• Quantity must be greater than 0</li>}
                {formState.category !== 'Non-Chargeable' && numericPrice <= 0 && <li>• Purchase Price must be greater than 0</li>}
              </ul>
            </div>
          )}
          
          {/* Purchase & Supplier Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Purchase Details Card */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Purchase Details</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
                  <input name="purchaseDate" type="date" value={formState.purchaseDate} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Bill No *</label>
                  <input name="purchaseBillNo" value={formState.purchaseBillNo} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Enter bill number" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                  <select name="branch" value={formState.branch} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (<option key={branch.code} value={branch.code}>{branch.name} - {branch.address}</option>))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Supplier Details Card */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                <User className="h-5 w-5 text-emerald-600" />
                <span>Supplier Details</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <input name="supplierName" value={formState.supplierName} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Enter supplier name" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Address *</label>
                  <textarea name="supplierAddress" value={formState.supplierAddress} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Enter supplier address" rows={2}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN *</label>
                  <input
                    name="supplierGstin"
                    value={formState.supplierGstin}
                    onChange={handleInputChange}
                    required
                    className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 ${
                      formState.supplierGstin.trim() && !isGstinValid
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 bg-white'
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
                  <textarea name="remarks" value={formState.remarks} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Enter remarks" rows={1}></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Category and Product Details Section */}
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <Package className="h-5 w-5 text-orange-600" />
              <span>Category & Product Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select name="category" value={formState.category} onChange={handleCategoryChange} required className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500">
                  <option value="">Select Category</option>
                  {categoryOptions.map((category) => (<option key={category} value={category}>{category}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label>
                <input name="subcategory" value={formState.subcategory} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500" placeholder="e.g., Aviator, Progressive, etc." />
              </div>
            </div>

            {/* Conditional Fields */}
            {formState.category && renderConditionalFields()}
          </div>
          
          {/* Pricing & Quantity Section */}
          <div className="p-3 bg-green-50 rounded-xl border border-green-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Pricing & Quantity</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code *</label>
                <input name="hsn" value={formState.hsn} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" placeholder="Enter HSN code" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input name="quantity" value={formState.quantity} onChange={handleInputChange} required type="number" min="1" step="1" className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" placeholder="Enter quantity" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price *</label>
                <input name="purchasePrice" value={formState.purchasePrice} onChange={handleInputChange} required type="number" min="0.01" step="0.01" className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" placeholder="Enter price" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST % *</label>
                <select name="inputGSTPercent" value={formState.inputGSTPercent} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500">
                  <option value="">Select GST %</option>
                  <option value="0">0</option><option value="5">5</option><option value="12">12</option><option value="18">18</option><option value="28">28</option>
                </select>
              </div>
            </div>
            
            {/* Calculation Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">Calculation Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="ml-2 font-medium">₹{(numericQuantity * numericPrice).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">GST Amount:</span>
                  <span className="ml-2 font-medium">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="ml-2 font-medium text-lg text-green-600">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="p-4 bg-gray-50 flex flex-wrap gap-3 justify-center rounded-xl border border-gray-200">
            {/* Sample Data Loading Buttons */}
            {formState.category && (
              <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
                <div className="text-center">
                  <span className="block text-sm font-medium text-gray-700 mb-2">Load Sample Data</span>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => loadSampleData(formState.category as keyof typeof sampleData, 'sample1')}
                      disabled={isLoadingSample}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        isLoadingSample
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isLoadingSample ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          <span>Sample 1</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSampleData(formState.category as keyof typeof sampleData, 'sample2')}
                      disabled={isLoadingSample}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        isLoadingSample
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isLoadingSample ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          <span>Sample 2</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
                  setFormState({
                    ...initialFormState,
                    purchaseDate: new Date().toISOString().slice(0, 10), // Keep current date
                  });
                  setSuccessMessage('Form reset successfully');
                  setSaveStatus('success');
                  setTimeout(() => {
                    setSuccessMessage('');
                    setSaveStatus('idle');
                  }, 3000);
                }
              }}
              className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 font-medium text-sm transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset Form</span>
            </button>
            <button
              type="submit"
              disabled={isSaving || !isFormValid}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                isSaving ? 'bg-gray-400 cursor-not-allowed text-white' :
                saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                saveStatus === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                !isFormValid ? 'bg-gray-400 cursor-not-allowed text-white' :
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
                  <span>{isFormValid ? 'Add Purchase (Ctrl+Enter)' : 'Fill Required Fields'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchasePage;
