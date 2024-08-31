exports.validation = (req, res, next) => {
  const body = req.body;

  if (!body.name || !body.price) {
    res.status(400).json({ status: 'fail', msg: 'missing name or price' });
    return;
  }
  next();
};
