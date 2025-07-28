const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOTPEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "🔐 Verify Your Email Address",
      html: `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background-color: #007bff; padding: 20px;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Email Verification</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
          <p style="font-size: 15px; color: #555;">Thank you for signing up. Please use the OTP below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; background: #eef5ff; color: #007bff; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 14px; color: #777;">This OTP is valid for 10 minutes.</p>
          <p style="font-size: 14px; color: #999;">If you didn't request this, you can safely ignore this message.</p>
        </div>
        <div style="background-color: #f1f1f1; padding: 15px 30px; text-align: center; font-size: 12px; color: #888;">
          This is an automated message, please do not reply.
        </div>
      </div>
    </div>
  `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
};
