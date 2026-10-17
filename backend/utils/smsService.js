const https = require("https");

const SMS_API_URL = "https://ninzasms.in.net/auth/send_sms.php";
const SMS_AUTH_KEY =
  process.env.SMS_AUTH_KEY ||
  "NINZASMS9c78eef7e42a5d3116d25ce5facc1bade374a33704c14959afa3";
const SENDER_ID = process.env.SMS_SENDER_ID || "16300";

/**
 * Send OTP via NinzaSMS
 */
const sendOtpSms = (mobile, otp) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender_id: SENDER_ID,
      numbers: mobile,
      rout: "sms",
      variables_values: otp,
    });

    const options = {
      method: "POST",
      headers: {
        Authorization: SMS_AUTH_KEY,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(SMS_API_URL, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {
          /* keep raw */
        }
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          data: parsed,
        });
      });
    });

    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendOtpSms, generateOtp };