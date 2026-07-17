/**
 * Helper functions for pick all functionality
 */

import { AuthService } from "~/services/AuthService";
import { RackBinService } from "~/services/RackBinService";
import type { SnapshotMasterItem, UsedSnapshot } from "~/types/CommonTypes";

/**
 * Get master snapshot data for a product
 */
const getMasterData = async (dealId: string, mrp: number, onMrp: boolean) => {
  const response = await RackBinService.getSnapshotsMastersData(
    AuthService.getLoggedInUserId() || "",
    {
      filter: { dealId, isUsable: true, quantity: { $gt: 0 } },
    },
    {
      filterOnMrp: onMrp,
      mrp: mrp,
    },
  );
  const data = response.data?.data || [];
  return {
    data,
    totalQuantity: data.reduce(
      (sum: number, item: SnapshotMasterItem) => sum + item.totalQuantity,
      0,
    ),
  };
};

/**
 * Process to pick all items
 * Recursively iterates through products, gets master snapshot data, and picks snapshots
 *
 * @param products - Array of products to be picked
 * @param orderId - Order ID for the picking operation
 * @param onComplete - Callback function to handle completion
 * @param onError - Callback function to handle errors
 */
export const pickAllProcess = async (
  products: any[],
  orderId: string,
  onComplete?: (result: any) => void,
  onError?: (error: Error) => void,
): Promise<void> => {
  try {
    const allPickedSnapshots: UsedSnapshot[] = [];
    const skippedProducts: any[] = [];
    let processedCount = 0;

    // Recursively iterate through products
    for (const product of products) {
      try {
        // Get pending quantity of the product
        const pendingQty = product._pendingQty || 0;

        if (pendingQty <= 0) {
          processedCount++;
          continue;
        }

        // Get master snapshot data using dealId filter
        const { data: masterDataWithMrp, totalQuantity: totalQtyWithMrp } =
          await getMasterData(
            product.dealId,
            product.mrp || 0,
            true, // Try with MRP filter first
          );

        let finalMasterData: SnapshotMasterItem[] = masterDataWithMrp;
        let finalTotalQty = totalQtyWithMrp;

        // If total quantity is lesser than pending qty, fetch master data without MRP filter
        if (finalTotalQty < pendingQty) {
          const {
            data: masterDataWithoutMrp,
            totalQuantity: totalQtyWithoutMrp,
          } = await getMasterData(
            product.dealId,
            product.mrp || 0,
            false, // Without MRP filter
          );
          finalMasterData = masterDataWithoutMrp;
          finalTotalQty = totalQtyWithoutMrp;
        }

        // Skip products with multiple snapshots
        if (finalMasterData.length > 1) {
          skippedProducts.push({
            ...product,
            reason: "Multiple snapshots",
            snapshotCount: finalMasterData.length,
          });
          processedCount++;
          continue;
        }

        if (finalMasterData.length === 0) {
          skippedProducts.push({
            ...product,
            reason: "No master data found",
          });
          processedCount++;
          continue;
        }

        // Pick snapshots by attaching usedQty and enteredStock
        const masterItem = finalMasterData[0];
        const quantityToPick = Math.min(pendingQty, finalTotalQty);

        // Update masters with usedQty
        const updatedMasters = masterItem.masters.map((master) => {
          const usedQty = Math.min(quantityToPick, master.quantity);
          return {
            ...master,
            usedQty: usedQty,
          };
        });

        // Create picked snapshot data
        const pickedSnapshots = updatedMasters
          .filter((master) => master.usedQty && master.usedQty > 0)
          .map((master) => ({
            id: master._id,
            quantity: master.usedQty || 0,
            snapshotId: master._id,
            usedQty: master.usedQty,
            enteredStock: master.usedQty,
            dealId: product.dealId,
            location: (master as any).location || {},
            barcode: master.barcode || "",
            expiry: master.expiry || null,
            manufactureDate: (master as any).manufactureDate || null,
            mrp: master.mrp || 0,
          }));

        allPickedSnapshots.push(...pickedSnapshots);
      } catch (productError) {
        console.error(
          `Error processing product ${product.dealId}:`,
          productError,
        );
        skippedProducts.push({
          ...product,
          reason: "Processing error",
          error: productError,
        });
      }

      processedCount++;
    }

    // After all products snapshots are collected, call update picking API
    if (allPickedSnapshots.length > 0) {
      try {
        // Group snapshots by dealId for proper API payload structure
        const groupedSnapshots = allPickedSnapshots.reduce(
          (acc, snapshot) => {
            const dealId = snapshot.dealId;
            if (!acc[dealId]) {
              acc[dealId] = [];
            }
            acc[dealId].push({
              snapshotId: snapshot.snapshotId,
              quantity: snapshot.quantity,
              location: snapshot.location || {},
              barcode: snapshot.barcode || "",
              expiry: snapshot.expiry || null,
              manufactureDate: snapshot.manufactureDate || null,
              mrp: snapshot.mrp || 0,
            });
            return acc;
          },
          {} as Record<string, any[]>,
        );

        // Prepare payload in the format expected by updatePicking API
        const payload = {
          items: Object.entries(groupedSnapshots).map(
            ([dealId, snapshots]) => ({
              dealId,
              snapshots,
            }),
          ),
        };

        // Call the actual updatePicking API
        const response = await RackBinService.updatePicking(orderId, payload);

        if (response.statusCode !== 200) {
          throw new Error(response.data?.message || "Failed to update picking");
        }
      } catch (updateError) {
        console.error("Error updating item snapshots:", updateError);
        throw updateError;
      }
    }

    const result = {
      success: true,
      message: `Successfully picked ${
        allPickedSnapshots.length
      } snapshots from ${processedCount - skippedProducts.length} products`,
      pickedSnapshots: allPickedSnapshots,
      skippedProducts: skippedProducts,
      totalProcessed: processedCount,
      totalSkipped: skippedProducts.length,
    };

    if (onComplete) {
      onComplete(result);
    }
  } catch (error) {
    console.error("Error in pick all process:", error);
    if (onError) {
      onError(error as Error);
    }
    throw error;
  }
};

/**
 * Reset all picked items
 * This is a placeholder function that will be implemented later
 *
 * @param products - Array of products to reset
 * @param onComplete - Callback function to handle completion
 * @param onError - Callback function to handle errors
 */
export const resetAllProcess = async (
  products: any[],
  onComplete?: (result: any) => void,
  onError?: (error: Error) => void,
): Promise<void> => {
  try {
    // TODO: Implement the actual reset all logic

    // TODO: Add actual reset logic here
    // This could include:
    // - Clearing picked quantities
    // - Resetting pick status
    // - Updating UI state
    // - Recording reset operations

    if (onComplete) {
      onComplete({ success: true, message: "All items reset successfully" });
    }
  } catch (error) {
    console.error("Error in reset all process:", error);
    if (onError) {
      onError(error as Error);
    }
    throw error;
  }
};

/**
 * Validate products before picking
 * This is a placeholder function that will be implemented later
 *
 * @param products - Array of products to validate
 * @returns Promise<boolean> - Whether all products are valid for picking
 */
export const validateProductsForPicking = async (
  products: any[],
): Promise<boolean> => {
  try {
    // TODO: Implement validation logic
    // This could include:
    // - Checking if products exist
    // - Validating quantities
    // - Checking inventory availability
    // - Verifying permissions

    // Placeholder validation - always return true for now
    return true;
  } catch (error) {
    console.error("Error validating products:", error);
    return false;
  }
};
