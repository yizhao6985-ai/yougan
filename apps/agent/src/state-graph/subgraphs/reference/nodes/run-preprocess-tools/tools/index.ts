/** reference 预处理工具 */
import {
  preprocessReferenceImage,
  preprocessReferenceText,
} from "./preprocess-tools.js";

export const PREPROCESS_REFERENCE_TOOLS = [
  preprocessReferenceText,
  preprocessReferenceImage,
];
