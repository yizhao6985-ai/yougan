/** reference 删改工具 */
import {
  deleteReference,
  setPendingReferencesContext,
  updateReferenceIntent,
} from "./mutate-tools.js";

export const MUTATE_REFERENCE_TOOLS = [
  deleteReference,
  setPendingReferencesContext,
  updateReferenceIntent,
];
