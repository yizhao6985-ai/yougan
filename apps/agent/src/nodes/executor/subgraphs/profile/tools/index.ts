import {
  addProfileBeat,
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
import { reviseProfile } from "./revise-profile.js";

export const PROFILE_TOOLS = [
  updateProfileSpec,
  updateProfileVoice,
  setProfilePremiseTool,
  addProfileConstraint,
  updateProfileConstraintTool,
  deleteProfileConstraintTool,
  clearProfileConstraintsTool,
  addProfileBeat,
  updateProfileBeatTool,
  deleteProfileBeatTool,
  clearProfileBeatsTool,
  reviseProfile,
  ...REFERENCE_TOOLS,
];
