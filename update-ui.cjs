const fs = require('fs');
const file = 'src/pages/supplier/PurchaseReturn.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Max width and spacing
content = content.replace(
  'max-w-2xl w-full mx-4 max-h-[90vh]',
  'max-w-5xl w-full mx-4 max-h-[90vh]'
);

content = content.replace(
  '<div className="bg-white p-6 rounded-lg shadow-xl',
  '<div className="bg-white p-5 rounded-lg shadow-xl'
);

content = content.replace(
  '<div className="flex justify-between items-center mb-4">',
  '<div className="flex justify-between items-center mb-2">'
);

content = content.replace(
  '<form onSubmit={(e) => { e.preventDefault(); handleSaveReturn(); }} className="space-y-6">',
  '<form onSubmit={(e) => { e.preventDefault(); handleSaveReturn(); }} className="space-y-3">'
);

// 2. Return Details Grid
content = content.replace(
  '{/* Return Details */}\n              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">',
  '{/* Return Details */}\n              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">'
);

// 3. Purchase Details Grid
content = content.replace(
  '{/* Purchase Details */}\n              <div className="bg-gray-50 p-4 rounded-lg">\n                <h4 className="font-medium text-gray-900 mb-3">Purchase Details</h4>\n                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">',
  '{/* Purchase Details */}\n              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">\n                <h4 className="font-medium text-sm text-gray-900 mb-2">Purchase Details</h4>\n                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">'
);

// 4. Supplier Details Grid (Starts the split layout)
content = content.replace(
  '{/* Supplier Details */}\n              <div className="bg-gray-50 p-4 rounded-lg">\n                <h4 className="font-medium text-gray-900 mb-3">Supplier Details</h4>\n                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">',
  '{/* Layout for Supplier Details and Remarks side by side */}\n              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">\n                {/* Supplier Details */}\n                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">\n                  <h4 className="font-medium text-sm text-gray-900 mb-2">Supplier Details</h4>\n                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">'
);

// 5. Transform textarea to input for Supplier Address
content = content.replace(
  '<div className="md:col-span-2">\n                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Address</label>\n                    <textarea\n                      value={addReturnForm.supplierAddress}\n                      onChange={(e) => setAddReturnForm({ ...addReturnForm, supplierAddress: e.target.value })}\n                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"\n                      rows={2}\n                      required\n                    />\n                  </div>',
  '<div className="sm:col-span-2">\n                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Address</label>\n                    <input\n                      type="text"\n                      value={addReturnForm.supplierAddress}\n                      onChange={(e) => setAddReturnForm({ ...addReturnForm, supplierAddress: e.target.value })}\n                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"\n                      required\n                    />\n                  </div>'
);

// 6. Remarks Block inside split layout
content = content.replace(
  '{/* Remarks */}\n              <div>\n                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>\n                <textarea\n                  value={addReturnForm.remarks}\n                  onChange={(e) => setAddReturnForm({ ...addReturnForm, remarks: e.target.value })}\n                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"\n                  rows={3}\n                  placeholder="Additional details about the return..."\n                />\n              </div>\n\n              <div className="flex justify-end space-x-2">',
  '{/* Remarks */}\n                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col">\n                  <h4 className="font-medium text-sm text-gray-900 mb-2">Remarks</h4>\n                  <div className="flex-1">\n                    <textarea\n                      value={addReturnForm.remarks}\n                      onChange={(e) => setAddReturnForm({ ...addReturnForm, remarks: e.target.value })}\n                      className="w-full h-full min-h-[90px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"\n                      placeholder="Additional details about the return..."\n                    />\n                  </div>\n                </div>\n              </div>\n\n              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">'
);

// 7. Make form elements compact (only inside the form!)
const formStart = content.indexOf('<form onSubmit={(e) => { e.preventDefault(); handleSaveReturn(); }}');
const deleteConfirmStart = content.indexOf('{/* Delete Confirmation Modal */}');

if (formStart !== -1 && deleteConfirmStart !== -1) {
    let formBlock = content.substring(formStart, deleteConfirmStart);
    
    // Replace class names for inputs and labels inside the form
    formBlock = formBlock.replace(/px-3 py-2/g, 'px-2 py-1 text-sm');
    formBlock = formBlock.replace(/Focus:ring-2/g, 'focus:ring-1');
    formBlock = formBlock.replace(/mb-1/g, 'mb-0.5');
    formBlock = formBlock.replace(/block text-sm font-medium/g, 'block text-[13px] font-medium');
    
    content = content.substring(0, formStart) + formBlock + content.substring(deleteConfirmStart);
}

fs.writeFileSync(file, content);
console.log('Update Complete');
