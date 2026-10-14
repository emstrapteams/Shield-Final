
const express = require("express");

const {
  createFirstAidKit,
  getFirstAidKits,
  getFirstAidKitById,
  updateFirstAidKit,
  setFirstAidKitStatus,
  updateFirstAidKitContents,
} = require("../controllers/firstAidKitController");

const router = express.Router();

router.get("/", getFirstAidKits);
router.post("/", createFirstAidKit);
router.get("/:id", getFirstAidKitById);
router.put("/:id", updateFirstAidKit);
router.patch("/:id/status", setFirstAidKitStatus);
router.patch("/:id/contents", updateFirstAidKitContents);

module.exports = router;
