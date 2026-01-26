/**
 * Parses a location object (from Leaflet Geosearch) into a structured address object.
 * @param {Object} location - The location object from geosearch event (must contain .address property)
 * @returns {Object} Structured address object { street, streetNum, zipCode, city, country }
 */
export const parseAddressFromSearch = (location) => {
    if (!location || !location.address) return null;

    const addressStr = location.address;
    console.log("Parsing address string:", addressStr);
    const parts = addressStr.split(",").map(p => p.trim());
    
    let street = "", streetNum = "", zipCode = "", city = "", country = "";

    // 1. Country is usually the last part
    if (parts.length > 0) {
        country = parts[parts.length - 1];
    }

    // 2. Find Zip Code
    let zipIndex = -1;
    for(let i = parts.length - 1; i >= 0; i--) {
       const part = parts[i];
       // French zip codes are 5 digits. International 4-6.
       if (part.match(/^\d{4,6}$/)) {
           zipCode = part;
           zipIndex = i;
           break;
       } else if (part.match(/\b\d{4,6}\b/)) {
           // Contains zip and something else?
           const match = part.match(/\b(\d{4,6})\b/);
           if (match) {
               zipCode = match[1];
               zipIndex = i;
               // Maybe this part also contains the city?
               const possibleCity = part.replace(zipCode, "").trim();
               if (possibleCity.length > 2) {
                   city = possibleCity;
               }
               break;
           }
       }
    }

    // 3. Find City
    // If we haven't found city in the zip part
    if (!city) {
        // Look for candidates between Street (start) and Country (end)
        // Exclude known regions/noise
        const ignoreTerms = [
            country, 
            "France métropolitaine", 
            "Île-de-France", 
            "Auvergne-Rhône-Alpes", 
            "Nouvelle-Aquitaine", 
            "Occitanie",
            "Hauts-de-France",
            "Grand Est",
            "Bretagne",
            "Pays de la Loire",
            "Bourgogne-Franche-Comté",
            "Centre-Val de Loire",
            "Normandie",
            "Europe",
            zipCode
        ];

        // Search backwards from Country (or Zip if found)
        let searchEnd = zipIndex !== -1 ? zipIndex : parts.length - 1;
        
        for (let i = searchEnd - 1; i >= 0; i--) {
            const part = parts[i];
            // Skip if it is a number or empty
            if (!part || part.match(/^\d+$/)) continue;
            // Skip ignored terms
            if (ignoreTerms.some(term => term && part.toLowerCase().includes(term.toLowerCase()))) continue;
            
            // This is our best guess for City
            city = part;
            break;
        }
    }

    // 4. Find Street & Number
    // Usually the first parts
    if (parts.length > 0) {
        const firstPart = parts[0];
        
        // Case A: "18" (Just number)
        if (firstPart.match(/^\d+[a-zA-Z]?$/)) {
            streetNum = firstPart;
            if (parts.length > 1) {
                street = parts[1];
            }
        } 
        // Case B: "18 Rue..." (Number start)
        else if (firstPart.match(/^\d+\s+/)) {
            const match = firstPart.match(/^(\d+[a-zA-Z]?)\s+(.*)/);
            if (match) {
                streetNum = match[1];
                street = match[2];
            }
        }
        // Case C: "Rue... 18" (Number end)
        else if (firstPart.match(/\s+\d+$/)) {
             const match = firstPart.match(/(.*)\s+(\d+[a-zA-Z]?)$/);
             if (match) {
                 street = match[1];
                 streetNum = match[2];
             }
        }
        // Case D: No number, just street
        else {
            street = firstPart;
        }
    }

    return {
        street: street || "",
        streetNum: streetNum || "",
        zipCode: zipCode || "",
        city: city || "",
        country: country || ""
    };
};
