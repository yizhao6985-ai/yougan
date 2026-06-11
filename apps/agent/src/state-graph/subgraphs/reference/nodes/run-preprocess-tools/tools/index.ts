/** reference 预处理工具 */
import {
  preprocessReferenceAudio,
  preprocessReferenceImage,
  preprocessReferenceText,
  preprocessReferenceVideo,
} from "./preprocess-tools.js";

export const PREPROCESS_REFERENCE_TOOLS = [
  preprocessReferenceText,
  preprocessReferenceImage,
  preprocessReferenceAudio,
  preprocessReferenceVideo,
];
