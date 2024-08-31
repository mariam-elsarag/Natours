const filterObj = (obj, ...allowData) => {
  let filterFields = {};
  Object.keys(obj).forEach((el) => {
    if (allowData.includes(el)) {
      filterFields[el] = obj[el];
    }
  });
  return filterFields;
};
module.exports = filterObj;
