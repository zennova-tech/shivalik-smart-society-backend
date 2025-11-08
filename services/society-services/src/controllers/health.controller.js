exports.ping = (req, res) => {
  res.json({
    ok: true,
    service: "society-services",
    time: new Date().toISOString(),
  });
};
