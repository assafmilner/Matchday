const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
   },
   role: {
    type: String,
    default: "user",
  },
  favoriteTeam: {
    type: String,
    enum: ['הפועל תל אביב','מכבי תל אביב','הפועל באר שבע', 'מכבי חיפה', 'בית"ר ירושלים', 'בני יהודה', 'מכבי נתניה', 'הפועל חיפה', 'הפועל ירושלים', 'עירוני קרית שמונה', 'מ.ס. אשדוד', 'בני סכנין', 'הפועל פתח תקווה', 'מכבי פתח תקווה', 'הפועל רמת גן', 'הפועל כפר שלם'],
    default: "הפועל תל אביב"
  },
  location: {
    type: String,
    enum: ['צפון', 'מרכז', 'דרום', 'ירושלים', 'אחר'],
    default: 'אחר'
  },
  refreshToken: {
    type: String,
  },
  profilePicture: {
    type: String,
    default:"http://localhost:3001/assets/defaultProfilePic.png", 
  },
});

module.exports = mongoose.model("User", UserSchema);