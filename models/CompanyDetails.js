
const mongoose = require('mongoose');

const companyDetailsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: String,
  shortName: String,
  inn: String,
  kpp: String,
  legalAddress: String,
  bank: String,
  bik: String,
  rs: String,
  ks: String
});

module.exports = mongoose.model('CompanyDetails', companyDetailsSchema);
