import nodemailer from 'nodemailer';

let transporter;

export const initTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (host && user && pass) {
    console.log('Using custom SMTP configuration for emails.');
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port == 465,
      auth: { user, pass }
    });
  } else {
    console.log('No SMTP config found. Generating a temporary Ethereal.email sandbox account for demonstration...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`Ethereal sandbox account generated. User: ${testAccount.user}`);
    } catch (err) {
      console.error('Failed to create Ethereal test account, falling back to mock logger:', err.message);
      transporter = {
        sendMail: async (options) => {
          console.log(`[MOCK EMAIL SENT] To: ${options.to}, Subject: ${options.subject}, Body: ${options.text || options.html}`);
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
    }
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transport = await initTransporter();
    const info = await transport.sendMail({
      from: '"ResqNet Support" <noreply@resqnet.io>',
      to,
      subject,
      text,
      html,
    });
    console.log(`Email successfully dispatched. Message ID: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Preview Link: ${previewUrl}`);
      return { success: true, previewUrl };
    }
    return { success: true };
  } catch (err) {
    console.error(`Email dispatch error to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};
