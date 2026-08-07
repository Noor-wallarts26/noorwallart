import indiaData from './indiaStatesDistricts.json';

/**
 * Utility to validate and lookup an Indian 6-digit pincode.
 */
export const lookupIndianPincode = async (pincodeStr) => {
  const cleanPincode = String(pincodeStr || '').trim();

  // Validate 6-digit Indian Pincode (starts with 1-9)
  if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
    return {
      success: false,
      message: 'Please enter a valid 6-digit Indian Pincode.'
    };
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`);
    const data = await response.json();

    if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
      const postOffices = data[0].PostOffice;
      const primaryPO = postOffices[0];

      const rawState = primaryPO.State;
      const rawDistrict = primaryPO.District;
      const localities = postOffices.map(po => po.Name).filter(Boolean);

      // Match rawState against indiaStatesDistricts.json states list (case insensitive)
      let matchedState = indiaData.states.find(
        s => s.state.toLowerCase() === rawState.toLowerCase()
      )?.state;

      // Fallback state matching
      if (!matchedState) {
        matchedState = indiaData.states.find(
          s => s.state.toLowerCase().includes(rawState.toLowerCase()) || rawState.toLowerCase().includes(s.state.toLowerCase())
        )?.state || rawState;
      }

      // Match rawDistrict against the matched state's district list
      let matchedDistrict = '';
      const stateObj = indiaData.states.find(s => s.state === matchedState);
      if (stateObj && Array.isArray(stateObj.districts)) {
        matchedDistrict = stateObj.districts.find(
          d => d.toLowerCase() === rawDistrict.toLowerCase()
        ) || stateObj.districts.find(
          d => d.toLowerCase().includes(rawDistrict.toLowerCase()) || rawDistrict.toLowerCase().includes(d.toLowerCase())
        ) || rawDistrict;
      } else {
        matchedDistrict = rawDistrict;
      }

      return {
        success: true,
        pincode: cleanPincode,
        state: matchedState,
        district: matchedDistrict,
        localities: Array.from(new Set(localities)),
        primaryLocality: primaryPO.Name || localities[0] || '',
        country: 'India'
      };
    } else {
      return {
        success: false,
        message: 'Pincode not found. Please verify your 6-digit Indian Pincode.'
      };
    }
  } catch (error) {
    console.error("Pincode lookup error:", error);
    return {
      success: false,
      message: 'Unable to auto-detect location from pincode. Please select your State and District manually.'
    };
  }
};
