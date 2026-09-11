import nodemailer from 'nodemailer';

let transporter: any = null;

async function getTransporter(): Promise<any> {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    console.log(`[Email] Configured custom SMTP transporter for ${smtpHost}`);
    return transporter;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;
  if (gmailUser && gmailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
    console.log(`[Email] Configured Gmail SMTP transporter for ${gmailUser}`);
    return transporter;
  }

  // Development / Local Mode: Use JSON transporter for instant simulated delivery
  transporter = nodemailer.createTransport({
    jsonTransport: true
  });
  console.log('[Email] Configured simulated email transporter (logs to console for local testing)');
  return transporter;
}

export async function sendPasswordResetOtp(
  toEmail: string,
  userName: string,
  otp: string,
  ttlMinutes: number
): Promise<{ success: boolean; messageId?: string; previewUrl?: string | false }> {
  try {
    const transport = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"Trao AI Support" <support@trao.ai>';
    const spacedOtp = otp.split('').join(' ');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Trao Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; margin-bottom: 12px; font-size: 22px;">
                &#10024;
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Trao</h1>
              <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px; font-weight: 500;">AI Interview Preparation Kit</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 700;">Your password reset code</h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #475569;">
                Hello <strong>${userName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #475569;">
                Enter this code on the Trao password reset screen to continue.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 18px 34px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 14px; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #4f46e5; font-family: 'SFMono-Regular', Menlo, Consolas, monospace;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 20px; color: #64748b;">
                &#9201;&#65039; <strong>This code expires in ${ttlMinutes} minutes.</strong>
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 20px; color: #64748b;">
                Never share this code with anyone. Trao staff will never ask you for it. If you did not request a password reset, you can safely ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">

              <p style="margin: 0; font-size: 11px; line-height: 18px; color: #94a3b8;">
                This code was requested for the account <strong>${toEmail}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Trao AI. Verified Candidate Preparation Kits.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const info = await transport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `${otp} is your Trao password reset code`,
      text: `Hello ${userName},

Your Trao password reset code is: ${spacedOtp}

This code expires in ${ttlMinutes} minutes. Never share it with anyone.

If you did not request this, please ignore this email.`,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`
================== [EMAIL DISPATCHED] ==================`);
    console.log(`To: ${toEmail} (${userName})`);
    console.log(`Subject: Trao password reset code`);
    console.log(`OTP: ${otp} (valid ${ttlMinutes}m)`);
    console.log(`Message ID: ${info?.messageId || 'local-dispatch'}`);
    if (previewUrl) {
      console.log(`Preview URL: ${previewUrl}`);
    }
    console.log(`========================================================
`);

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err: any) {
    console.error(`[Email] Failed to send password reset code to ${toEmail}:`, err?.message || err);
    return { success: false };
  }
}
