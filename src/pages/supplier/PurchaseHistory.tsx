import React, { useState, useEffect, Fragment } from 'react';
import { Search, Filter, Download, Eye, ArrowLeft, Edit, Trash2, Save, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import purchaseService, { PurchaseData } from '../../services/purchaseService';
import bulkPurchaseService, { BulkPurchaseData } from '../../services/bulkPurchaseService';
import branchService, { Branch } from '../../services/branchService';

interface PurchaseRecord {
  id: string;
  purchaseDate: string;
  purchaseBillNo: string;
  branch: string;
  materialName: string;
  productCode: string;
  productDescription: string;
  category: string;
  subcategory: string;
  hsn: string;
  quantity: number;
  purchasePrice: number;
  inputGSTPercent: number;
  inputGSTAmount: number;
  totalAmount: number;
  supplier: {
    name: string;
    address: string;
    gstin: string;
  };
  remarks?: string;
  
  // Additional fields from updated purchase page
  color?: string;
  size?: string;
  type?: string;
  gender?: string;
  shape?: string;
  material?: string;
  templeDetails?: string;
  bridgeSize?: string;
  lensDetail?: string;
  lensCoating?: string;
  design?: string;
  lensIndex?: string;
  lensNumber?: string;
  lensAddition?: string;
  lensAxis?: string;
  lensNumberRange?: string;
  lensProductName?: string;
  ct?: string;
  baseCurve?: string;
  diameter?: string;
  modality?: string;
  validity?: string;
  waterContent?: string;
  dkt?: string;
  solutionName?: string;
  variant?: string;
  packingType?: string;
  name?: string;
  
  // New field to identify record type
  recordType: 'purchase' | 'bulk-purchase';
  // For bulk purchases, store the original bulk purchase data
  bulkPurchaseData?: BulkPurchaseData;
}

interface EditFormState {
  purchaseDate: string;
  purchaseBillNo: string;
  branch: string;
  materialName: string;
  productCode: string;
  productDescription: string;
  category: string;
  subcategory: string;
  hsn: string;
  quantity: string;
  purchasePrice: string;
  inputGSTPercent: string;
  supplierName: string;
  supplierAddress: string;
  supplierGstin: string;
  remarks: string;
  
  // Additional fields from updated purchase page
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

// Utility function to generate unique purchase code
const generatePurchaseCode = (purchaseDate: string, serialNo: number): string => {
  const date = new Date(purchaseDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
  const serial = serialNo.toString().padStart(3, '0');
  return `PUR-${day}/${month}/${year}/${serial}`;
};

// Utility function to map backend categories to display names
const mapCategoryToDisplayName = (category: string): string => {
  switch (category) {
    // Backend enum values (from database)
    case 'SPECTACLES':
      return 'Spectacles';
    case 'SUNGLASSES':
      return 'Sunglasses';
    case 'LENS':
      return 'Lens';
    case 'CONTACT_LENSES':
      return 'Contact Lenses';
    case 'FRAMES':
      return 'Frames';
    case 'SOLUTIONS':
      return 'Solutions';
    case 'OTHER':
      return 'Other';
    case 'NON_CHARGEABLE':
      return 'Non-Chargeable';
    
    // Backend-expected category names (from frontend forms)
    case 'Contact Lens':
      return 'Contact Lenses';
    case 'Frame':
      return 'Frames';
    case 'Solution':
      return 'Solutions';
    
    // Frontend display names (for backward compatibility)
    case 'Spectacles':
      return 'Spectacles';
    case 'Sunglasses':
      return 'Sunglasses';
    case 'Lens':
      return 'Lens';
    case 'Contact Lenses':
      return 'Contact Lenses';
    case 'Frames':
      return 'Frames';
    case 'Solutions':
      return 'Solutions';
    case 'Other':
      return 'Other';
    case 'Non-Chargeable':
      return 'Non-Chargeable';
    
    default:
      return category; // Return as-is if no mapping found
  }
};

const categoryOptions = [
  { label: 'Spectacles', subcategories: ['Aviator', 'Wayfarer', 'Round', 'Square', 'Rectangle', 'Cat Eye', 'Oversized', 'Rimless', 'Semi-Rimless'] },
  { label: 'Sunglasses', subcategories: ['Aviator', 'Wayfarer', 'Round', 'Square', 'Rectangle', 'Cat Eye', 'Oversized', 'Polarized', 'Non-Polarized', 'Photochromic'] },
  { label: 'Frames', subcategories: ['Metal', 'Plastic', 'Rimless', 'Semi-Rimless', 'Sports', 'Titanium', 'Acetate'] },
  { label: 'Lens', subcategories: ['Single Vision', 'Bifocal', 'Progressive', 'Computer Glasses', 'Reading Glasses', 'Anti-reflective', 'Photochromic', 'Polarized', 'High Index', 'Polycarbonate', 'Trivex', 'Aspheric', 'Toric', 'Multifocal'] },
  { label: 'Contact Lenses', subcategories: ['Single Vision', 'Bifocal', 'Progressive', 'Computer Glasses', 'Reading Glasses', 'Anti-reflective', 'Photochromic', 'Polarized', 'Daily Disposable', 'Monthly Disposable', 'Yearly', 'Toric', 'Multifocal', 'Silicone Hydrogel'] },
  { label: 'Solutions', subcategories: ['Multi-Purpose', 'Cleaning', 'Storage', 'Protection', 'Maintenance', 'Saline'] },
  { label: 'Other', subcategories: ['Cleaning Accessory', 'Professional Tools', 'Testing Equipment', 'Office Supplies', 'Replacement Parts'] },
  { label: 'Non-Chargeable', subcategories: ['Display Equipment', 'Promotional Items', 'Free Samples', 'Demo Products'] }
] as const;

const PurchaseHistoryPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [priceRangeFrom, setPriceRangeFrom] = useState('');
  const [priceRangeTo, setPriceRangeTo] = useState('');
  const [quantityRangeFrom, setQuantityRangeFrom] = useState('');
  const [quantityRangeTo, setQuantityRangeTo] = useState('');
  const [selectedGSTPercent, setSelectedGSTPercent] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [productCodeSearch, setProductCodeSearch] = useState('');
  const [hsnSearch, setHsnSearch] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [shapeFilter, setShapeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [lensDetailFilter, setLensDetailFilter] = useState('');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  
  // Debug: Log initial filter states
  console.log('Initial filter states:', {
    searchTerm,
    selectedCategory,
    selectedSubcategory,
    selectedBranch,
    dateFrom,
    dateTo,
    priceRangeFrom,
    priceRangeTo,
    quantityRangeFrom,
    quantityRangeTo,
    selectedGSTPercent,
    supplierSearch,
    productCodeSearch,
    hsnSearch,
    colorFilter,
    materialFilter,
    genderFilter,
    shapeFilter,
    typeFilter,
    lensDetailFilter
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<PurchaseRecord | null>(null);
  const [editFormState, setEditFormState] = useState<EditFormState>({
    purchaseDate: '',
    purchaseBillNo: '',
    branch: '',
    materialName: '',
    productCode: '',
    productDescription: '',
    category: '',
    subcategory: '',
    hsn: '',
    quantity: '',
    purchasePrice: '',
    inputGSTPercent: '',
    supplierName: '',
    supplierAddress: '',
    supplierGstin: '',
    remarks: '',
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
    name: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const categories = ['Spectacles', 'Sunglasses', 'Frame', 'Lens', 'Contact Lens', 'Solution', 'Other', 'Non-Chargeable'];

  useEffect(() => {
    console.log('Component mounted, loading purchase history...');
    loadPurchaseHistory();
  }, []);

  useEffect(() => {
    console.log('Filtering purchases. Total purchases:', purchases.length);
    filterPurchases();
    setCurrentPage(1); // Reset to first page when filters change
  }, [purchases, searchTerm, selectedCategory, selectedSubcategory, selectedBranch, dateFrom, dateTo, 
      priceRangeFrom, priceRangeTo, quantityRangeFrom, quantityRangeTo, selectedGSTPercent, 
      supplierSearch, productCodeSearch, hsnSearch, colorFilter, materialFilter, genderFilter, shapeFilter,
      typeFilter, lensDetailFilter]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when page size changes
  }, [itemsPerPage]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadPurchaseHistory = async () => {
    try {
      setLoading(true);
      let allRecords: PurchaseRecord[] = [];

      // Use the unified API which combines both regular and bulk purchases from MySQL
      try {
        const unifiedData = await purchaseService.getPurchaseHistory();
        if (unifiedData && unifiedData.length > 0) {
          console.log('Loaded unified purchase history data:', unifiedData.length, 'records');
          allRecords = unifiedData.map((record: any) => ({
            ...record,
            recordType: record.recordType === 'BULK' ? 'bulk-purchase' as const : 'purchase' as const,
            bulkPurchaseData: record.recordType === 'BULK' ? {
              id: record.parentId,
              purchaseBillNo: record.purchaseBillNo,
              purchaseDate: record.purchaseDate,
              branch: record.branch,
              supplierName: record.supplierName,
              supplierAddress: record.supplierAddress,
              supplierGstin: record.supplierGstin,
              remarks: record.remarks,
              purchaseItems: []
            } : undefined
          }));
        } else {
          console.log('Unified API returned empty data, trying separate endpoints');
          // Fallback: load separate endpoints
          const [purchaseData, bulkData] = await Promise.all([
            purchaseService.getPurchaseRecords().catch(() => []),
            bulkPurchaseService.getAllBulkPurchases().catch(() => [])
          ]);

          const purchaseRecords: PurchaseRecord[] = (purchaseData || []).map((record: any) => ({
            ...record,
            recordType: 'purchase' as const
          }));

          const bulkPurchaseRecords: PurchaseRecord[] = (bulkData || []).flatMap((bulkPurchase: any) =>
            bulkPurchase.purchaseItems.map((item: any) => ({
              id: `${bulkPurchase.id}-${item.id}`,
              purchaseDate: bulkPurchase.purchaseDate,
              purchaseBillNo: bulkPurchase.purchaseBillNo,
              branch: bulkPurchase.branch,
              materialName: item.materialName,
              productCode: item.productCode,
              productDescription: item.productDescription,
              category: item.category,
              subcategory: item.subcategory,
              hsn: item.hsn,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              inputGSTPercent: item.inputGSTPercent,
              inputGSTAmount: item.inputGSTAmount,
              totalAmount: item.totalAmount,
              supplier: {
                name: bulkPurchase.supplierName,
                address: bulkPurchase.supplierAddress,
                gstin: bulkPurchase.supplierGstin
              },
              remarks: bulkPurchase.remarks,
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
              recordType: 'bulk-purchase' as const,
              bulkPurchaseData: bulkPurchase
            }))
          );

          allRecords = [...purchaseRecords, ...bulkPurchaseRecords].sort((a, b) =>
            new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
          );
        }
      } catch (apiError) {
        console.error('Error loading from unified API:', apiError);
        allRecords = [];
      }

      setPurchases(allRecords);
      console.log('Final purchase history records loaded:', allRecords.length, 'records');

      // Load branches from backend API
      try {
        const branchesData = await branchService.getAllBranches();
        setBranches(branchesData);
      } catch (branchError) {
        console.error('Error loading branches:', branchError);
      }

    } catch (error) {
      console.error('Error loading purchase history:', error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPurchases = () => {
    console.log('Starting filterPurchases with', purchases.length, 'purchases');
    let filtered = [...purchases];
    console.log('Initial filtered count:', filtered.length);

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(purchase =>
        purchase.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.purchaseBillNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.productDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (purchase.remarks && purchase.remarks.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (purchase.color && purchase.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (purchase.size && purchase.size.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (purchase.type && purchase.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (purchase.gender && purchase.gender.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (purchase.shape && purchase.shape.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (purchase.material && purchase.material.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (purchase.lensDetail && purchase.lensDetail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (purchase.lensProductName && purchase.lensProductName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (purchase.solutionName && purchase.solutionName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (purchase.name && purchase.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      console.log('After search term filter:', filtered.length);
    }

    // Category filter
    if (selectedCategory) {
      console.log('Applying category filter:', selectedCategory);
      filtered = filtered.filter(purchase => {
        // Since purchase.category is already a display name, we can compare directly
        // mapCategoryToDisplayName handles both backend enum values and display names for backward compatibility
        const displayCategory = mapCategoryToDisplayName(purchase.category);
        const matches = displayCategory === selectedCategory;
        if (!matches) {
          console.log(`Record ${purchase.materialName} filtered out: category ${purchase.category} -> ${displayCategory} != ${selectedCategory}`);
        }
        return matches;
      });
      console.log('After category filter:', filtered.length);
    }

    // Subcategory filter
    if (selectedSubcategory) {
      filtered = filtered.filter(purchase => purchase.subcategory === selectedSubcategory);
    }

    // Branch filter
    if (selectedBranch) {
      filtered = filtered.filter(purchase => purchase.branch === selectedBranch);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(purchase => purchase.purchaseDate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(purchase => purchase.purchaseDate <= dateTo);
    }

    // Price range filter
    if (priceRangeFrom) {
      const fromPrice = parseFloat(priceRangeFrom);
      if (!isNaN(fromPrice)) {
        filtered = filtered.filter(purchase => purchase.purchasePrice >= fromPrice);
      }
    }
    if (priceRangeTo) {
      const toPrice = parseFloat(priceRangeTo);
      if (!isNaN(toPrice)) {
        filtered = filtered.filter(purchase => purchase.purchasePrice <= toPrice);
      }
    }

    // Quantity range filter
    if (quantityRangeFrom) {
      const fromQty = parseInt(quantityRangeFrom);
      if (!isNaN(fromQty)) {
        filtered = filtered.filter(purchase => purchase.quantity >= fromQty);
      }
    }
    if (quantityRangeTo) {
      const toQty = parseInt(quantityRangeTo);
      if (!isNaN(toQty)) {
        filtered = filtered.filter(purchase => purchase.quantity <= toQty);
      }
    }

    // GST percent filter
    if (selectedGSTPercent) {
      const gstPercent = parseFloat(selectedGSTPercent);
      if (!isNaN(gstPercent)) {
        filtered = filtered.filter(purchase => purchase.inputGSTPercent === gstPercent);
      }
    }

    // Supplier search filter
    if (supplierSearch) {
      filtered = filtered.filter(purchase =>
        purchase.supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        purchase.supplier.address.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        purchase.supplier.gstin.toLowerCase().includes(supplierSearch.toLowerCase())
      );
    }

    // Product code search filter
    if (productCodeSearch) {
      filtered = filtered.filter(purchase =>
        purchase.productCode.toLowerCase().includes(productCodeSearch.toLowerCase())
      );
    }

    // HSN search filter
    if (hsnSearch) {
      filtered = filtered.filter(purchase =>
        purchase.hsn.toLowerCase().includes(hsnSearch.toLowerCase())
      );
    }

    // Color filter
    if (colorFilter) {
      filtered = filtered.filter(purchase =>
        purchase.color && purchase.color.toLowerCase().includes(colorFilter.toLowerCase())
      );
    }

    // Material filter
    if (materialFilter) {
      filtered = filtered.filter(purchase =>
        purchase.material && purchase.material.toLowerCase().includes(materialFilter.toLowerCase())
      );
    }

    // Gender filter
    if (genderFilter) {
      filtered = filtered.filter(purchase =>
        purchase.gender && purchase.gender.toLowerCase().includes(genderFilter.toLowerCase())
      );
    }

    // Shape filter
    if (shapeFilter) {
      filtered = filtered.filter(purchase =>
        purchase.shape && purchase.shape.toLowerCase().includes(shapeFilter.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(purchase =>
        purchase.type && purchase.type.toLowerCase().includes(typeFilter.toLowerCase())
      );
    }

    // Lens detail filter
    if (lensDetailFilter) {
      filtered = filtered.filter(purchase =>
        purchase.lensDetail && purchase.lensDetail.toLowerCase().includes(lensDetailFilter.toLowerCase())
      );
    }

    console.log('Final filtered count:', filtered.length);
    setFilteredPurchases(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedBranch('');
    setDateFrom('');
    setDateTo('');
    setPriceRangeFrom('');
    setPriceRangeTo('');
    setQuantityRangeFrom('');
    setQuantityRangeTo('');
    setSelectedGSTPercent('');
    setSupplierSearch('');
    setProductCodeSearch('');
    setHsnSearch('');
    setColorFilter('');
    setMaterialFilter('');
    setGenderFilter('');
    setShapeFilter('');
    setTypeFilter('');
    setLensDetailFilter('');
  };

  const toggleRowExpansion = (purchaseId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(purchaseId)) {
      newExpandedRows.delete(purchaseId);
    } else {
      newExpandedRows.add(purchaseId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleViewRecord = (purchase: PurchaseRecord) => {
    // Toggle row expansion using purchase ID instead of index
    toggleRowExpansion(purchase.id);
  };

  const handleDownloadRecord = (purchase: PurchaseRecord) => {
    const dataStr = JSON.stringify(purchase, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `purchase-${purchase.purchaseBillNo}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEditRecord = (purchase: PurchaseRecord) => {
    setEditingRecord(purchase);
    setEditFormState({
      purchaseDate: purchase.purchaseDate,
      purchaseBillNo: purchase.purchaseBillNo,
      branch: purchase.branch,
      materialName: purchase.materialName,
      productCode: purchase.productCode,
      productDescription: purchase.productDescription,
      category: purchase.category,
      subcategory: purchase.subcategory,
      hsn: purchase.hsn,
      quantity: purchase.quantity.toString(),
      purchasePrice: purchase.purchasePrice.toString(),
      inputGSTPercent: purchase.inputGSTPercent.toString(),
      supplierName: purchase.supplier.name,
      supplierAddress: purchase.supplier.address,
      supplierGstin: purchase.supplier.gstin,
      remarks: purchase.remarks || '',
      color: purchase.color || '',
      size: purchase.size || '',
      type: purchase.type || '',
      gender: purchase.gender || '',
      shape: purchase.shape || '',
      material: purchase.material || '',
      templeDetails: purchase.templeDetails || '',
      bridgeSize: purchase.bridgeSize || '',
      lensDetail: purchase.lensDetail || '',
      lensCoating: purchase.lensCoating || '',
      design: purchase.design || '',
      lensIndex: purchase.lensIndex || '',
      lensNumber: purchase.lensNumber || '',
      lensAddition: purchase.lensAddition || '',
      lensAxis: purchase.lensAxis || '',
      lensNumberRange: purchase.lensNumberRange || '',
      lensProductName: purchase.lensProductName || '',
      ct: purchase.ct || '',
      baseCurve: purchase.baseCurve || '',
      diameter: purchase.diameter || '',
      modality: purchase.modality || '',
      validity: purchase.validity || '',
      waterContent: purchase.waterContent || '',
      dkt: purchase.dkt || '',
      solutionName: purchase.solutionName || '',
      variant: purchase.variant || '',
      packingType: purchase.packingType || '',
      name: purchase.name || ''
    });
  };

  const handleDeleteRecord = async (purchaseId: string) => {
    console.log('Attempting to delete purchase record:', purchaseId);
    setIsDeleting(true);
    
    try {
      // Find the record to determine its type
      const recordToDelete = purchases.find(p => p.id === purchaseId);
      if (!recordToDelete) {
        alert('Record not found');
        return;
      }

      let result;
      
      if (recordToDelete.recordType === 'bulk-purchase') {
        // Delete bulk purchase - need to extract the actual bulk purchase ID
        console.log('Deleting bulk purchase record');
        if (recordToDelete.bulkPurchaseData?.id) {
          // Extract the actual bulk purchase ID from the composite ID
          const bulkPurchaseId = recordToDelete.bulkPurchaseData.id.toString();
          console.log('Extracted bulk purchase ID:', bulkPurchaseId);
          result = await bulkPurchaseService.deleteBulkPurchase(bulkPurchaseId);
        } else {
          throw new Error('Bulk purchase data not found');
        }
      } else {
        // Delete regular purchase
        console.log('Deleting regular purchase record');
        result = await purchaseService.deletePurchaseRecord(purchaseId);
      }
      
      console.log('Delete result:', result);
      
      if (result.success) {
        // Update local state by removing the deleted record
        let updatedPurchases;
        if (recordToDelete.recordType === 'bulk-purchase') {
          // For bulk purchases, remove all items from the same bulk purchase
          const bulkPurchaseId = recordToDelete.bulkPurchaseData?.id;
          updatedPurchases = purchases.filter(p => {
            if (p.recordType === 'bulk-purchase' && p.bulkPurchaseData?.id === bulkPurchaseId) {
              return false; // Remove all items from this bulk purchase
            }
            return true; // Keep other records
          });
        } else {
          // For regular purchases, just remove the specific record
          updatedPurchases = purchases.filter(p => p.id !== purchaseId);
        }

        setPurchases(updatedPurchases);
        setShowDeleteConfirm(null);

        // Show success message
        alert(result.message);
        return;
      } else {
        console.error('Delete failed:', result.message);
        alert(`Failed to delete purchase record: ${result.message}`);
        return;
      }
    } catch (error) {
      console.error('Error deleting purchase record:', error);
      alert('Failed to delete purchase record. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    // Validate required fields
    if (!editFormState.purchaseDate || !editFormState.purchaseBillNo || !editFormState.branch || 
        !editFormState.category ||
        !editFormState.quantity || !editFormState.purchasePrice || !editFormState.inputGSTPercent ||
        !editFormState.supplierName || !editFormState.supplierAddress || !editFormState.supplierGstin) {
      alert('Please fill in all strictly required fields (Date, Bill No, Branch, Category, Quantity, Price, GST, Supplier).');
      return;
    }

    // Calculate GST amount and total amount
    const quantity = parseInt(editFormState.quantity, 10);
    const purchasePrice = parseFloat(editFormState.purchasePrice);
    const inputGSTPercent = parseFloat(editFormState.inputGSTPercent);
    
    if (isNaN(quantity) || isNaN(purchasePrice) || isNaN(inputGSTPercent)) {
      alert('Please enter valid numeric values for quantity, purchase price, and GST percentage.');
      return;
    }

    if (quantity <= 0 || purchasePrice <= 0 || inputGSTPercent < 0) {
      alert('Quantity and purchase price must be greater than 0, and GST percentage must be non-negative.');
      return;
    }

    const inputGSTAmount = (purchasePrice * quantity * inputGSTPercent) / 100;
    const totalAmount = (purchasePrice * quantity) + inputGSTAmount;

    const updatedPurchase: PurchaseData = {
      id: editingRecord.id,
      purchaseDate: editFormState.purchaseDate,
      purchaseBillNo: editFormState.purchaseBillNo,
      branch: editFormState.branch,
      materialName: editFormState.materialName,
      productCode: editFormState.productCode,
      productDescription: editFormState.productDescription,
      category: editFormState.category as PurchaseData['category'],
      subcategory: editFormState.subcategory,
      hsn: editFormState.hsn,
      quantity: quantity,
      purchasePrice: purchasePrice,
      inputGSTPercent: inputGSTPercent,
      inputGSTAmount: inputGSTAmount,
      totalAmount: totalAmount,
      supplier: {
        name: editFormState.supplierName,
        address: editFormState.supplierAddress,
        gstin: editFormState.supplierGstin
      },
      remarks: editFormState.remarks
    };

    try {
      setIsSaving(true);

      if (editingRecord.recordType === 'purchase') {
        const result = await purchaseService.updatePurchaseRecord(editingRecord.id, updatedPurchase);
        if (!result.success) {
          alert(result.message || 'Failed to update purchase in MySQL database.');
          return;
        }
      } else if (editingRecord.recordType === 'bulk-purchase' && editingRecord.bulkPurchaseData?.id) {
        const updatedBulkPurchase = {
          ...editingRecord.bulkPurchaseData,
          purchaseDate: editFormState.purchaseDate,
          purchaseBillNo: editFormState.purchaseBillNo,
          branch: editFormState.branch,
          remarks: editFormState.remarks,
          purchaseItems: editingRecord.bulkPurchaseData.purchaseItems.map(item =>
            item.id === editingRecord.id.split('-')[1] ? {
              ...item,
              materialName: editFormState.materialName,
              productCode: editFormState.productCode,
              productDescription: editFormState.productDescription,
              category: editFormState.category as any,
              subcategory: editFormState.subcategory,
              hsn: editFormState.hsn,
              quantity: quantity,
              purchasePrice: purchasePrice,
              inputGSTPercent: inputGSTPercent,
              inputGSTAmount: inputGSTAmount,
              totalAmount: totalAmount,
              color: editFormState.color,
              size: editFormState.size,
              type: editFormState.type,
              gender: editFormState.gender,
              shape: editFormState.shape,
              material: editFormState.material,
              templeDetails: editFormState.templeDetails,
              bridgeSize: editFormState.bridgeSize,
              lensDetail: editFormState.lensDetail,
              lensCoating: editFormState.lensCoating,
              design: editFormState.design,
              lensIndex: editFormState.lensIndex,
              lensNumber: editFormState.lensNumber,
              lensAddition: editFormState.lensAddition,
              lensAxis: editFormState.lensAxis,
              lensNumberRange: editFormState.lensNumberRange,
              lensProductName: editFormState.lensProductName,
              ct: editFormState.ct,
              baseCurve: editFormState.baseCurve,
              diameter: editFormState.diameter,
              modality: editFormState.modality,
              validity: editFormState.validity,
              waterContent: editFormState.waterContent,
              dkt: editFormState.dkt,
              solutionName: editFormState.solutionName,
              variant: editFormState.variant,
              packingType: editFormState.packingType,
              name: editFormState.name
            } : item
          ),
          supplierName: editFormState.supplierName,
          supplierAddress: editFormState.supplierAddress,
          supplierGstin: editFormState.supplierGstin
        };

        const result = await bulkPurchaseService.updateBulkPurchase(editingRecord.bulkPurchaseData.id, updatedBulkPurchase);
        if (!result.success) {
          alert(result.message || 'Failed to update bulk purchase in MySQL database.');
          return;
        }
      } else {
        alert('Unable to determine which purchase record to update.');
        return;
      }

      await loadPurchaseHistory();
      setEditingRecord(null);
      alert('Purchase record updated successfully in MySQL database!');
    } catch (error) {
      console.error('Error updating purchase record:', error);
      alert('Failed to update purchase record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditFormState({
      purchaseDate: '',
      purchaseBillNo: '',
      branch: '',
      materialName: '',
      productCode: '',
      productDescription: '',
      category: '',
      subcategory: '',
      hsn: '',
      quantity: '',
      purchasePrice: '',
      inputGSTPercent: '',
      supplierName: '',
      supplierAddress: '',
      supplierGstin: '',
      remarks: '',
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
      name: ''
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Serial No.', 'Purchase Code', 'Record Type', 'Purchase Date', 'Bill No', 'Branch', 'Material Name', 'Product Code', 'Product Description',
      'Category', 'Subcategory', 'HSN', 'Quantity', 'Purchase Price', 'GST %', 'GST Amount', 'Total Amount',
      'Color', 'Size', 'Type', 'Gender', 'Shape', 'Material', 'Temple Details', 'Bridge Size',
      'Lens Detail', 'Lens Coating', 'Design', 'Lens Index', 'Lens Number', 'Lens Addition', 'Lens Axis', 'Lens Number Range',
      'Lens Product Name', 'CT', 'Base Curve', 'Diameter', 'Modality', 'Validity', 'Water Content', 'Dk/t',
      'Solution Name', 'Variant', 'Packing Type', 'Name',
      'Supplier Name', 'Supplier Address', 'Supplier GSTIN', 'Remarks'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredPurchases.map((purchase, index) => [
        index + 1,
        generatePurchaseCode(purchase.purchaseDate, index + 1),
        purchase.recordType === 'bulk-purchase' ? 'Bulk Purchase' : 'Regular Purchase',
        purchase.purchaseDate,
        purchase.purchaseBillNo,
        purchase.branch,
        purchase.materialName,
        purchase.productCode,
        purchase.productDescription,
        purchase.category,
        purchase.subcategory,
        purchase.hsn,
        purchase.quantity,
        purchase.purchasePrice,
        purchase.inputGSTPercent,
        purchase.inputGSTAmount,
        purchase.totalAmount,
        purchase.color || '',
        purchase.size || '',
        purchase.type || '',
        purchase.gender || '',
        purchase.shape || '',
        purchase.material || '',
        purchase.templeDetails || '',
        purchase.bridgeSize || '',
        purchase.lensDetail || '',
        purchase.lensCoating || '',
        purchase.design || '',
        purchase.lensIndex || '',
        purchase.lensNumber || '',
        purchase.lensAddition || '',
        purchase.lensAxis || '',
        purchase.lensNumberRange || '',
        purchase.lensProductName || '',
        purchase.ct || '',
        purchase.baseCurve || '',
        purchase.diameter || '',
        purchase.modality || '',
        purchase.validity || '',
        purchase.waterContent || '',
        purchase.dkt || '',
        purchase.solutionName || '',
        purchase.variant || '',
        purchase.packingType || '',
        purchase.name || '',
        purchase.supplier.name,
        purchase.supplier.address,
        purchase.supplier.gstin,
        purchase.remarks || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(absAmount);
    return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPurchases = filteredPurchases.slice(startIndex, endIndex);
  
  console.log('Pagination debug:', {
    totalPages,
    startIndex,
    endIndex,
    currentPurchasesLength: currentPurchases.length,
    filteredPurchasesLength: filteredPurchases.length,
    itemsPerPage,
    currentPage
  });

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold">Purchase History</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Shows both regular purchases and bulk purchases in chronological order. Each record has a unique purchase code: <span className="font-mono text-emerald-600">PUR-DD/MM/YY/SerialNo</span> 
            (e.g., PUR-16/08/24/001 for the 1st purchase on August 16th, 2024). Bulk purchases are marked with a blue indicator.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              console.log('Manually reloading purchase history...');
              loadPurchaseHistory();
            }}
            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1.5 text-sm"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reload Data</span>
          </button>
          <button
            onClick={exportToCSV}
            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-1.5 text-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-lg shadow border mb-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
        >
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-500 mr-1.5" />
            <h3 className="font-semibold text-sm">Search & Filters</h3>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
            {isFiltersVisible ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>
        </div>
        
        {isFiltersVisible && (
          <div className="mt-3 pt-3 border-t border-gray-100">
        
        {/* Row 1: General Search + Category + Subcategory + Branch */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 mb-2">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-0.5">General Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by material, product code, bill no, supplier, descriptio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 border border-gray-300 rounded-md w-full focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory(''); // Reset subcategory when category changes
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Subcategory</label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
              disabled={!selectedCategory}
            >
              <option value="">All Subcategories</option>
              {selectedCategory && categoryOptions.find(cat => cat.label === selectedCategory)?.subcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.code} value={branch.code}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Date Range + Price Range + Quantity Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 mb-2">
          {/* Date Range */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Date Range</label>
            <div className="flex space-x-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
                placeholder="To"
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Price Range (₹)</label>
            <div className="flex space-x-1.5">
              <input
                type="number"
                placeholder="Min Price"
                value={priceRangeFrom}
                onChange={(e) => setPriceRangeFrom(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={priceRangeTo}
                onChange={(e) => setPriceRangeTo(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Quantity Range */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Quantity Range</label>
            <div className="flex space-x-1.5">
              <input
                type="number"
                placeholder="Min Qty"
                value={quantityRangeFrom}
                onChange={(e) => setQuantityRangeFrom(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                placeholder="Max Qty"
                value={quantityRangeTo}
                onChange={(e) => setQuantityRangeTo(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Supplier + Product Code + HSN + GST % + Color + Material */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 mb-2">
          {/* Supplier Search */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Supplier Search</label>
            <input
              type="text"
              placeholder="Search by supplier name, add..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Product Code Search */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Product Code</label>
            <input
              type="text"
              placeholder="Search by product code..."
              value={productCodeSearch}
              onChange={(e) => setProductCodeSearch(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          {/* HSN Search */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">HSN Code</label>
            <input
              type="text"
              placeholder="Search by HSN code..."
              value={hsnSearch}
              onChange={(e) => setHsnSearch(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          {/* GST Percent */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">GST %</label>
            <select
              value={selectedGSTPercent}
              onChange={(e) => setSelectedGSTPercent(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="">All GST %</option>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>

          {/* Color Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Color</label>
            <input
              type="text"
              placeholder="Filter by color..."
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Material Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Material</label>
            <input
              type="text"
              placeholder="Filter by material..."
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Row 4: Gender + Shape + Type + Lens Detail + Clear all filters link */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
          {/* Gender Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Gender</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="">All Genders</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>

          {/* Shape Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Shape</label>
            <input
              type="text"
              placeholder="Filter by shape..."
              value={shapeFilter}
              onChange={(e) => setShapeFilter(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Type</label>
            <input
              type="text"
              placeholder="Filter by type..."
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Lens Detail Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Lens Detail</label>
            <input
              type="text"
              placeholder="Filter by lens detail..."
              value={lensDetailFilter}
              onChange={(e) => setLensDetailFilter(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Clear Filters Button – occupies last 2 cols */}
          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || selectedCategory || selectedSubcategory || selectedBranch || dateFrom || dateTo || 
          priceRangeFrom || priceRangeTo || quantityRangeFrom || quantityRangeTo || selectedGSTPercent || 
          supplierSearch || productCodeSearch || hsnSearch || colorFilter || materialFilter || genderFilter || shapeFilter ||
          typeFilter || lensDetailFilter) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              <button
                onClick={clearFilters}
                className="text-red-600 hover:text-red-800 text-sm underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('')} className="ml-1 text-green-600 hover:text-green-800">×</button>
                </span>
              )}
              {selectedSubcategory && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Subcategory: {selectedSubcategory}
                  <button onClick={() => setSelectedSubcategory('')} className="ml-1 text-green-600 hover:text-green-800">×</button>
                </span>
              )}
              {selectedBranch && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Branch: {selectedBranch}
                  <button onClick={() => setSelectedBranch('')} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                </span>
              )}
              {(dateFrom || dateTo) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Date: {dateFrom || 'Any'} - {dateTo || 'Any'}
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="ml-1 text-yellow-600 hover:text-yellow-800">×</button>
                </span>
              )}
              {(priceRangeFrom || priceRangeTo) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Price: ₹{priceRangeFrom || '0'} - ₹{priceRangeTo || '∞'}
                  <button onClick={() => { setPriceRangeFrom(''); setPriceRangeTo(''); }} className="ml-1 text-indigo-600 hover:text-indigo-800">×</button>
                </span>
              )}
              {(quantityRangeFrom || quantityRangeTo) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  Qty: {quantityRangeFrom || '0'} - {quantityRangeTo || '∞'}
                  <button onClick={() => { setQuantityRangeFrom(''); setQuantityRangeTo(''); }} className="ml-1 text-pink-600 hover:text-pink-800">×</button>
                </span>
              )}
              {selectedGSTPercent && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  GST: {selectedGSTPercent}%
                  <button onClick={() => setSelectedGSTPercent('')} className="ml-1 text-orange-600 hover:text-orange-800">×</button>
                </span>
              )}
              {supplierSearch && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  Supplier: {supplierSearch}
                  <button onClick={() => setSupplierSearch('')} className="ml-1 text-teal-600 hover:text-teal-800">×</button>
                </span>
              )}
              {productCodeSearch && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                  Product Code: {productCodeSearch}
                  <button onClick={() => setProductCodeSearch('')} className="ml-1 text-cyan-600 hover:text-cyan-800">×</button>
                </span>
              )}
              {hsnSearch && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  HSN: {hsnSearch}
                  <button onClick={() => setHsnSearch('')} className="ml-1 text-gray-600 hover:text-gray-800">×</button>
                </span>
              )}
              {colorFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Color: {colorFilter}
                  <button onClick={() => setColorFilter('')} className="ml-1 text-red-600 hover:text-red-800">×</button>
                </span>
              )}
              {materialFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Material: {materialFilter}
                  <button onClick={() => setMaterialFilter('')} className="ml-1 text-amber-600 hover:text-amber-800">×</button>
                </span>
              )}
              {genderFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-lime-100 text-lime-800">
                  Gender: {genderFilter}
                  <button onClick={() => setGenderFilter('')} className="ml-1 text-lime-600 hover:text-lime-800">×</button>
                </span>
              )}
              {shapeFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Shape: {shapeFilter}
                  <button onClick={() => setShapeFilter('')} className="ml-1 text-emerald-600 hover:text-emerald-800">×</button>
                </span>
              )}
              {typeFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Type: {typeFilter}
                  <button onClick={() => setTypeFilter('')} className="ml-1 text-indigo-600 hover:text-indigo-800">×</button>
                </span>
              )}
              {lensDetailFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Lens Detail: {lensDetailFilter}
                  <button onClick={() => setLensDetailFilter('')} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        <div className="mt-4">
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Clear all filters
          </button>
        </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{filteredPurchases.length}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(filteredPurchases.reduce((sum, p) => {
                const base = p.purchasePrice * p.quantity;
                return sum + base;
              }, 0))}
            </div>
            <div className="text-sm text-gray-600">Base Amount</div>
            <div className="text-xs text-gray-400">(Ex-GST)</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {filteredPurchases.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Quantity</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {new Set(filteredPurchases.map(p => p.supplier.name)).size}
            </div>
            <div className="text-sm text-gray-600">Unique Suppliers</div>
          </div>
          <div className="text-center p-3 bg-teal-50 rounded-lg">
            <div className="text-2xl font-bold text-teal-600">
              {new Set(filteredPurchases.map(p => p.category)).size}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">
              {formatCurrency(filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0))}
            </div>
            <div className="text-sm text-gray-600">Grand Total</div>
            <div className="text-xs text-gray-400">(Inc-GST)</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-600">Showing records </span>
            <span className="font-semibold">{startIndex + 1}</span>
            <span className="text-gray-600"> to </span>
            <span className="font-semibold">
              {Math.min(endIndex, filteredPurchases.length)}
            </span>
            <span className="text-gray-600"> of </span>
            <span className="font-semibold">{filteredPurchases.length}</span>
            <span className="text-gray-600"> total records</span>
            {totalPages > 1 && (
              <span className="text-gray-500 ml-2">(Page {currentPage} of {totalPages})</span>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Regular Purchases: {filteredPurchases.filter(p => p.recordType === 'purchase').length} | 
              Bulk Purchases: {filteredPurchases.filter(p => p.recordType === 'bulk-purchase').length}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Page Value: <span className="font-semibold text-emerald-600">
              {formatCurrency(currentPurchases.reduce((sum, p) => sum + p.totalAmount, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Purchase Records Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Information</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category & Specifications</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Information</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPurchases.map((purchase, index) => (
                <Fragment key={purchase.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-center">
                        <div className="font-medium text-gray-900">{startIndex + index + 1}</div>
                        <div className="text-xs text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded">
                          {generatePurchaseCode(purchase.purchaseDate, startIndex + index + 1)}
                        </div>
                        {purchase.recordType === 'bulk-purchase' && (
                          <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded mt-1">
                            Bulk Purchase
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{purchase.purchaseBillNo}</div>
                        <div className="text-gray-500">{formatDate(purchase.purchaseDate)}</div>
                        <div className="text-gray-500">{purchase.branch}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{purchase.materialName}</div>
                        <div className="text-gray-500">{purchase.productCode}</div>
                        <div className="text-gray-500">HSN: {purchase.hsn}</div>
                        <div className="text-gray-500">{purchase.productDescription}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{mapCategoryToDisplayName(purchase.category)} - {purchase.subcategory}</div>
                        {purchase.color && <div className="text-gray-500">Color: {purchase.color}</div>}
                        {purchase.size && <div className="text-gray-500">Size: {purchase.size}</div>}
                        {purchase.type && <div className="text-gray-500">Type: {purchase.type}</div>}
                        {purchase.gender && <div className="text-gray-500">Gender: {purchase.gender}</div>}
                        {purchase.shape && <div className="text-gray-500">Shape: {purchase.shape}</div>}
                        {purchase.material && <div className="text-gray-500">Material: {purchase.material}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">Qty: {purchase.quantity}</div>
                        <div className="text-gray-500">Price: {formatCurrency(purchase.purchasePrice)}</div>
                        <div className="text-gray-500">GST: {purchase.inputGSTPercent}%</div>
                        <div className="font-semibold text-emerald-600">Total: {formatCurrency(purchase.totalAmount)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{purchase.supplier.name}</div>
                        <div className="text-gray-500">{purchase.supplier.address}</div>
                        <div className="text-gray-500">{purchase.supplier.gstin}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewRecord(purchase)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadRecord(purchase)}
                          className="text-emerald-600 hover:text-emerald-800 p-1"
                          title="Download Record"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditRecord(purchase)}
                          className="text-orange-600 hover:text-orange-800 p-1"
                          title="Edit Record"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isDeleting) {
                              setShowDeleteConfirm(purchase.id);
                            }
                          }}
                          disabled={isDeleting}
                          className={`p-1 transition-colors ${
                            isDeleting 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-red-600 hover:text-red-800'
                          }`}
                          title={isDeleting ? "Deleting..." : "Delete Record"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Row Details */}
                  {expandedRows.has(purchase.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          {/* Basic Product Details */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">Purchase Code:</span> <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{generatePurchaseCode(purchase.purchaseDate, purchases.findIndex(p => p.id === purchase.id) + 1)}</span></div>
                              {purchase.recordType === 'bulk-purchase' && (
                                <div><span className="font-medium">Record Type:</span> <span className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">Bulk Purchase</span></div>
                              )}
                              <div><span className="font-medium">Product Name:</span> {purchase.materialName}</div>
                              <div><span className="font-medium">Product Code:</span> {purchase.productCode}</div>
                              <div><span className="font-medium">Description:</span> {purchase.productDescription}</div>
                              <div><span className="font-medium">HSN Code:</span> {purchase.hsn}</div>
                              <div><span className="font-medium">Category:</span> {mapCategoryToDisplayName(purchase.category)}</div>
                              <div><span className="font-medium">Subcategory:</span> {purchase.subcategory}</div>
                              <div><span className="font-medium">Remarks:</span> {purchase.remarks || 'None'}</div>
                            </div>
                          </div>

                          {/* Physical Specifications */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Physical Specifications</h4>
                            <div className="space-y-2 text-sm">
                              {purchase.color && <div><span className="font-medium">Color:</span> {purchase.color}</div>}
                              {purchase.size && <div><span className="font-medium">Size:</span> {purchase.size}</div>}
                              {purchase.type && <div><span className="font-medium">Type:</span> {purchase.type}</div>}
                              {purchase.gender && <div><span className="font-medium">Gender:</span> {purchase.gender}</div>}
                              {purchase.shape && <div><span className="font-medium">Shape:</span> {purchase.shape}</div>}
                              {purchase.material && <div><span className="font-medium">Material:</span> {purchase.material}</div>}
                              {purchase.templeDetails && <div><span className="font-medium">Temple Details:</span> {purchase.templeDetails}</div>}
                              {purchase.bridgeSize && <div><span className="font-medium">Bridge Size:</span> {purchase.bridgeSize}</div>}
                            </div>
                          </div>

                          {/* Category-Specific Technical Details */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Technical Specifications</h4>
                            <div className="space-y-2 text-sm">
                              {(purchase.category === 'Lens' || purchase.category === 'CONTACT_LENSES') && (
                                <>
                                  {purchase.lensDetail && <div><span className="font-medium">Lens Detail:</span> {purchase.lensDetail}</div>}
                                  {purchase.lensCoating && <div><span className="font-medium">Lens Coating:</span> {purchase.lensCoating}</div>}
                                  {purchase.design && <div><span className="font-medium">Design:</span> {purchase.design}</div>}
                                  {purchase.lensIndex && <div><span className="font-medium">Lens Index:</span> {purchase.lensIndex}</div>}
                                  {purchase.lensNumber && <div><span className="font-medium">Lens Number:</span> {purchase.lensNumber}</div>}
                                  {purchase.lensAddition && <div><span className="font-medium">Lens Addition:</span> {purchase.lensAddition}</div>}
                                  {purchase.lensAxis && <div><span className="font-medium">Lens Axis:</span> {purchase.lensAxis}</div>}
                                  {purchase.lensNumberRange && <div><span className="font-medium">Lens Number Range:</span> {purchase.lensNumberRange}</div>}
                                </>
                              )}
                              {(purchase.category === 'Contact Lens' || purchase.category === 'CONTACT_LENSES') && (
                                <>
                                  {purchase.lensProductName && <div><span className="font-medium">Lens Product Name:</span> {purchase.lensProductName}</div>}
                                  {purchase.ct && <div><span className="font-medium">CT (Center Thickness):</span> {purchase.ct}</div>}
                                  {purchase.baseCurve && <div><span className="font-medium">Base Curve:</span> {purchase.baseCurve}</div>}
                                  {purchase.diameter && <div><span className="font-medium">Diameter:</span> {purchase.diameter}</div>}
                                  {purchase.modality && <div><span className="font-medium">Modality:</span> {purchase.modality}</div>}
                                  {purchase.validity && <div><span className="font-medium">Validity:</span> {purchase.validity} days</div>}
                                  {purchase.waterContent && <div><span className="font-medium">Water Content:</span> {purchase.waterContent}</div>}
                                  {purchase.dkt && <div><span className="font-medium">Dk/t (Permeability):</span> {purchase.dkt}</div>}
                                </>
                              )}
                              {(purchase.category === 'Solution' || purchase.category === 'SOLUTIONS') && (
                                <>
                                  {purchase.solutionName && <div><span className="font-medium">Solution Name:</span> {purchase.solutionName}</div>}
                                  {purchase.variant && <div><span className="font-medium">Variant:</span> {purchase.variant}</div>}
                                  {purchase.packingType && <div><span className="font-medium">Packing Type:</span> {purchase.packingType}</div>}
                                </>
                              )}
                              {(purchase.category === 'Other' || purchase.category === 'Non-Chargeable' || purchase.category === 'OTHER' || purchase.category === 'NON_CHARGEABLE') && (
                                <>
                                  {purchase.name && <div><span className="font-medium">Name:</span> {purchase.name}</div>}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Financial Details */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Financial Details</h4>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">Quantity:</span> {purchase.quantity}</div>
                              <div><span className="font-medium">Unit Price:</span> {formatCurrency(purchase.purchasePrice)}</div>
                              <div><span className="font-medium">Base Amount:</span> {formatCurrency(purchase.purchasePrice * purchase.quantity)}</div>
                              <div><span className="font-medium">GST %:</span> {purchase.inputGSTPercent}%</div>
                              <div><span className="font-medium">GST Amount:</span> {formatCurrency(purchase.inputGSTAmount)}</div>
                              <div><span className="font-medium">Total Amount:</span> <span className="font-semibold text-emerald-600">{formatCurrency(purchase.totalAmount)}</span></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPurchases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No purchase records found</div>
            <div className="text-gray-400 text-sm mt-2">Try adjusting your search criteria or filters</div>
          </div>
        )}

        {/* Show message when no results on current page but there are filtered results */}
        {filteredPurchases.length > 0 && currentPurchases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No results on this page</div>
            <div className="text-gray-400 text-sm mt-2">Try going to the previous page or adjusting your filters</div>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredPurchases.length > 0 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {/* Page Info */}
              <div className="text-sm text-gray-700">
                Showing records <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(endIndex, filteredPurchases.length)}
                </span>{' '}
                of <span className="font-medium">{filteredPurchases.length}</span> results
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                {/* First Page Button */}
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous Page Button */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        page === currentPage
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next Page Button */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last Page Button */}
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={(e) => {
          if (e.target === e.currentTarget && !isDeleting) {
            setShowDeleteConfirm(null);
          }
        }}>
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            {(() => {
              const purchaseToDelete = purchases.find(p => p.id === showDeleteConfirm);
              return (
                <>
                  {purchaseToDelete && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium mb-3">Record to be deleted:</p>
                      <div className="text-sm text-red-700 space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Purchase Code:</span>
                          <span className="font-semibold font-mono text-emerald-600">
                            {generatePurchaseCode(purchaseToDelete.purchaseDate, purchases.findIndex(p => p.id === purchaseToDelete.id) + 1)}
                          </span>
                        </div>
                        {purchaseToDelete.recordType === 'bulk-purchase' && (
                          <div className="flex justify-between">
                            <span className="font-medium">Record Type:</span>
                            <span className="font-semibold text-blue-600">Bulk Purchase</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="font-medium">Bill No:</span>
                          <span className="font-semibold">{purchaseToDelete.purchaseBillNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Product:</span>
                          <span className="font-semibold">{purchaseToDelete.materialName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Category:</span>
                          <span className="font-semibold">{mapCategoryToDisplayName(purchaseToDelete.category)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Quantity:</span>
                          <span className="font-semibold">{purchaseToDelete.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total Amount:</span>
                          <span className="font-semibold text-red-700">₹{purchaseToDelete.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Supplier:</span>
                          <span className="font-semibold">{purchaseToDelete.supplier.name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Warning</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>This will permanently delete the purchase record from the MySQL database. This action cannot be undone.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg transition-colors ${
                  isDeleting 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm) {
                    handleDeleteRecord(showDeleteConfirm);
                  }
                }}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  isDeleting 
                    ? 'bg-red-400 cursor-not-allowed text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

             {/* Edit Modal */}
       {editingRecord && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Edit Purchase Record</h3>
               <button
                 onClick={handleCancelEdit}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                   <input
                     type="date"
                     value={editFormState.purchaseDate}
                     onChange={(e) => setEditFormState({ ...editFormState, purchaseDate: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Bill No</label>
                   <input
                     type="text"
                     value={editFormState.purchaseBillNo}
                     onChange={(e) => setEditFormState({ ...editFormState, purchaseBillNo: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                   <select
                     value={editFormState.branch}
                     onChange={(e) => setEditFormState({ ...editFormState, branch: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   >
                     <option value="">Select Branch</option>
                     {branches.map(branch => (
                       <option key={branch.code} value={branch.code}>{branch.name}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                   <input
                     type="text"
                     value={editFormState.materialName}
                     onChange={(e) => setEditFormState({ ...editFormState, materialName: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                   <input
                     type="text"
                     value={editFormState.productCode}
                     onChange={(e) => setEditFormState({ ...editFormState, productCode: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                   <select
                     value={editFormState.category}
                     onChange={(e) => setEditFormState({ ...editFormState, category: e.target.value, subcategory: '' })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   >
                     <option value="">Select Category</option>
                     {categories.map(cat => (
                       <option key={cat} value={cat}>{cat}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                   <select
                     value={editFormState.subcategory}
                     onChange={(e) => setEditFormState({ ...editFormState, subcategory: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   >
                     <option value="">Select Subcategory</option>
                     {categoryOptions.find(cat => cat.label === editFormState.category)?.subcategories.map(sub => (
                       <option key={sub} value={sub}>{sub}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                   <input
                     type="text"
                     value={editFormState.hsn}
                     onChange={(e) => setEditFormState({ ...editFormState, hsn: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                   <input
                     type="number"
                     value={editFormState.quantity}
                     onChange={(e) => setEditFormState({ ...editFormState, quantity: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                   <input
                     type="number"
                     value={editFormState.purchasePrice}
                     onChange={(e) => setEditFormState({ ...editFormState, purchasePrice: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                   <input
                     type="number"
                     value={editFormState.inputGSTPercent}
                     onChange={(e) => setEditFormState({ ...editFormState, inputGSTPercent: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                   <input
                     type="text"
                     value={editFormState.supplierName}
                     onChange={(e) => setEditFormState({ ...editFormState, supplierName: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Address</label>
                   <input
                     type="text"
                     value={editFormState.supplierAddress}
                     onChange={(e) => setEditFormState({ ...editFormState, supplierAddress: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Supplier GSTIN</label>
                   <input
                     type="text"
                     value={editFormState.supplierGstin}
                     onChange={(e) => setEditFormState({ ...editFormState, supplierGstin: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   />
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                 <textarea
                   value={editFormState.productDescription}
                   onChange={(e) => setEditFormState({ ...editFormState, productDescription: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   rows={3}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                 <textarea
                   value={editFormState.remarks}
                   onChange={(e) => setEditFormState({ ...editFormState, remarks: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   rows={3}
                 />
               </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistoryPage;
