// src/controllers/society.list.controller.js
const mongoose = require("mongoose");
const Society = require("../models/society.model");
const User = require("../models/user.model");
const BuildingSetting = require("../models/building.model");
const Block = require("../models/block.model");
const Unit = require("../models/unit.model");
const Parking = require("../models/parking.model");
const Amenity = require("../models/amenity.model");
const { success, fail } = require("../utils/response");
const logger = require("../utils/logger");

/**
 * GET /api/v1/societies/list
 * Returns a list of societies with details & counts:
 *  - name, territory, status, code, estbYear
 *  - admin contact (email, mobile)
 *  - blocks (count, names)
 *  - units (count)
 *  - residents (count)
 *  - parking (total slots summary from Parking collection)
 *  - amenities count
 *
 * Query params:
 *  - sample=true  -> include small arrays of sample items (blocks, residents up to 5 each)
 */
exports.getSocietiesList = async (req, res, next) => {
  try {
    const includeSample = String(req.query.sample || "false") === "true";

    // fetch societies
    const societies = await Society.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    // For each society gather related data in parallel
    const results = await Promise.all(
      societies.map(async (s) => {
        const sid = s._id;

        // 1) admin info (if adminManager is a user ref)
        let admin = null;
        if (s.adminManager) {
          try {
            const adminUser = await User.findById(s.adminManager)
              .select("firstName lastName email mobileNumber countryCode")
              .lean();
            if (adminUser) {
              admin = {
                name: `${adminUser.firstName || ""} ${adminUser.lastName || ""}`.trim(),
                email: adminUser.email || null,
                mobile: adminUser.mobileNumber || null,
                countryCode: adminUser.countryCode || null,
              };
            }
          } catch (e) {
            logger.warn("adminManager lookup failed", e && e.message);
          }
        }

        // 2) buildings linked to this society (BuildingSetting.society.ref === society._id)
        const buildings = await BuildingSetting.find({ "society.ref": sid })
          .select("_id buildingName")
          .lean();
        const buildingIds = buildings.map((b) => b._id);

        // 3) blocks that belong to those buildings
        const blocks = await Block.find({ building: { $in: buildingIds } })
          .select("name building")
          .lean();
        const blockNames = blocks.map((b) => b.name);
        const blocksCount = blocks.length;

        // 4) units: all units whose block is in blockIds
        const blockIds = blocks.map((b) => b._id);
        let unitsCount = 0;
        let unitsSample = [];
        if (blockIds.length > 0) {
          unitsCount = await Unit.countDocuments({ block: { $in: blockIds } });
          if (includeSample) {
            unitsSample = await Unit.find({ block: { $in: blockIds } })
              .select("unitNumber unitType status owner")
              .limit(5)
              .lean();
          }
        } else {
          // fallback: if society.blocks embedded in society document, try to count using unit.unitNumber pattern (best effort)
          unitsCount = 0;
        }

        // 5) residents: users with society == sid
        const residentsFilter = { society: sid, isDeleted: { $ne: true } };
        const residentsCount = await User.countDocuments(residentsFilter);
        let residentsSample = [];
        if (includeSample && residentsCount > 0) {
          residentsSample = await User.find(residentsFilter)
            .select("firstName lastName email mobileNumber")
            .limit(5)
            .lean();
        }

        // 6) parking: sum of parking slot counts from Parking docs for buildings linked to society
        let parkingSummary = {
          memberCarSlots: 0,
          memberBikeSlots: 0,
          visitorCarSlots: 0,
          visitorBikeSlots: 0,
          totalConfigured: 0,
        };
        if (buildingIds.length > 0) {
          const parkings = await Parking.find({ building: { $in: buildingIds } })
            .select("memberCarSlots memberBikeSlots visitorCarSlots visitorBikeSlots")
            .lean();
          if (parkings && parkings.length > 0) {
            parkings.forEach((p) => {
              parkingSummary.memberCarSlots += p.memberCarSlots || 0;
              parkingSummary.memberBikeSlots += p.memberBikeSlots || 0;
              parkingSummary.visitorCarSlots += p.visitorCarSlots || 0;
              parkingSummary.visitorBikeSlots += p.visitorBikeSlots || 0;
            });
            parkingSummary.totalConfigured =
              parkingSummary.memberCarSlots +
              parkingSummary.memberBikeSlots +
              parkingSummary.visitorCarSlots +
              parkingSummary.visitorBikeSlots;
          }
        }

        // 7) amenities count (amenities are directly linked to society in model)
        const amenitiesCount = await Amenity.countDocuments({ society: sid });

        // 8) estb year: use createdAt if present, else null
        const estbYear = s.createdAt ? new Date(s.createdAt).getFullYear() : null;

        // Assemble result object for this society
        return {
          id: sid,
          code: s.code || null,
          name: s.name,
          territory: s.territory || null,
          address: s.address || null,
          status: s.status || "active",
          estbYear,
          admin,
          blocks: {
            count: blocksCount,
            names: includeSample ? blockNames.slice(0, 50) : undefined, // avoid huge arrays unless requested
          },
          units: {
            count: unitsCount,
            sample: includeSample ? unitsSample : undefined,
          },
          residents: {
            count: residentsCount,
            sample: includeSample ? residentsSample : undefined,
          },
          parking: parkingSummary,
          amenitiesCount,
        };
      })
    );

    return success(res, "Societies fetched", results);
  } catch (err) {
    logger.error("Error in getSocietiesList", err);
    return next(err);
  }
};
