const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
    },
    userName: {
      type: String,
    },
    password: {
      type: String,
    },
    receivedInvite: {
      type: Array,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
