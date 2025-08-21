// Updated version of mapCountProductToSimplifiedDisplay function
const mapCountProductToSimplifiedDisplay = (countProduct: CountProduct): SimplifiedDyeingDisplayRecord => {
  const mappedRecord = {
    id: countProduct.id,
    quantity: countProduct.quantity,
    customerName: countProduct.customerName, // Use customer name directly
    count: countProduct.count || "Standard", 
    sentToDye: countProduct.sentToDye ? (countProduct.sentQuantity ?? countProduct.quantity) : 0,
    sentDate: countProduct.sentDate,
    received: countProduct.received ? countProduct.receivedQuantity : undefined,
    receivedDate: countProduct.receivedDate || undefined,
    dispatch: countProduct.dispatch ? countProduct.dispatchQuantity : undefined,
    dispatchDate: countProduct.dispatchDate || undefined,
    partyNameMiddleman: countProduct.middleman || countProduct.partyName,
    dyeingFirm: countProduct.dyeingFirm,
    remarks: countProduct.remarks || ''
  };
  
  return mappedRecord;
};
