import Organization from "../models/org.model.js";
import asyncHandler from "../utils/asynchandler.utils.js";
import OrganizationUser from "../models/orgUser.model.js";

export const checkOrganizationExists = async (req, res) => {
    try {
      const { name } = req.params;
      const org = await Organization.findOne({ name });
      if (org) {
        return res.json({ exists: true, organization: org });
      } else {
        return res.json({ exists: false });
      }
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };

  export const getInviteLinks = asyncHandler(async (req, res) => {
    // Find the OrganizationUser record for the logged-in user and populate its organization
    const orgUser = await OrganizationUser.findOne({ user: req.user._id }).populate("organization");
  
    if (!orgUser) {
      return res.status(404).json({ success: false, message: "User is not part of any organization" });
    }
  
    // Verify the user is an admin
    if (orgUser.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. You are not authorized to view these invite links." });
    }
  
    // Return the invite links stored in the organization document
    res.status(200).json({ success: true, inviteLinks: orgUser.organization.inviteLinks });
  });