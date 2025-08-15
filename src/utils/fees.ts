/**
 * Calculates the total fee for a given price, including Bold's percentage + fixed fee
 * and ReteICA percentage.
 *
 * This function assumes the 'price' parameter is the *net* amount you desire to receive,
 * and it calculates the *additional* amount needed to cover the fees.
 *
 * @param {number} price The base price of the service (the net amount you want to get).
 * @returns {number} The total calculated fee (Bold + ReteICA + fixed).
 */
export const calculatePSEFee = (price: number): number => {
    // Define fee percentages and fixed fees
    const boldFeePercentage = 3.49; // 3.49%
    const reteICAPercentage = 0.414; // 0.414%
    const fixedBoldFee = 900; // $900 COP

    // Convert percentages to decimal
    const boldFeeDecimal = boldFeePercentage / 100;
    const reteICADecimal = reteICAPercentage / 100;

    // Calculate total percentage that will be deducted from the *gross* price
    const totalPercentageDecimal = boldFeeDecimal + reteICADecimal;

    // Calculate the gross price needed to achieve 'price' net
    const grossPriceNeeded = (price + fixedBoldFee) / (1 - totalPercentageDecimal);

    // The PSE fee is the difference between gross and net price
    const totalFee = grossPriceNeeded - price;

    return Math.round(totalFee);
};
