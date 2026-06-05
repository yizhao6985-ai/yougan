/** profile 子图 ToolNode 工具列表 */
import {
  addProfileBeat,
  addProfileBeats,
  addProfileConstraint,
  clearProfileBeatsTool,
  clearProfileConstraintsTool,
  deleteProfileBeatTool,
  deleteProfileConstraintTool,
  setProfilePremiseTool,
  updateProfileBeatTool,
  updateProfileConstraintTool,
  updateProfileSpec,
  updateProfileVoice,
} from "./profile-tools.js";
import { REFERENCE_TOOLS } from "./reference-tools.js";

export const PROFILE_TOOLS = [
  updateProfileSpec,
  updateProfileVoice,
  setProfilePremiseTool,
  addProfileConstraint,
  updateProfileConstraintTool,
  deleteProfileConstraintTool,
  clearProfileConstraintsTool,
  addProfileBeat,
  addProfileBeats,
  updateProfileBeatTool,
  deleteProfileBeatTool,
  clearProfileBeatsTool,
  ...REFERENCE_TOOLS,
];
