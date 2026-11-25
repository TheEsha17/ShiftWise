const Setting = require("../models/Setting");
const asyncHandler = require("../utils/asyncHandler");

exports.get = asyncHandler(async (req, res) => {
  const settings = await Setting.find({
    $or: [
      { scope: "Global" },
      { owner: req.user._id },
    ],
  }).sort({ key: 1 });
  res.json({
    settings: settings.map((setting) => {
      const value = setting.toObject();
      value.key = value.key.slice(value.key.indexOf(":") + 1);
      return value;
    }),
  });
});

exports.set = asyncHandler(async (req, res) => {
  const scopedKey = `${req.user._id}:${req.params.key}`;
  const setting = await Setting.findOneAndUpdate(
    { key: scopedKey, owner: req.user._id },
    {
      key: scopedKey,
      value: req.body.value,
      scope: req.user.role,
      owner: req.user._id,
    },
    { upsert: true, new: true, runValidators: true }
  );
  const value = setting.toObject();
  value.key = req.params.key;
  res.json({ setting: value });
});
