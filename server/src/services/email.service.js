import nodemailer from "nodemailer";

let transporter = null;

export function initializeEmailTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: { user, pass }
      });
      console.log(`✉️ Email transport initialized successfully (SMTP: ${host}:${port})`);
    } catch (err) {
      console.error("❌ Failed to initialize SMTP email transport:", err);
    }
  } else {
    console.warn("⚠️ SMTP credentials not found in server/.env. Falling back to Console Logger Transporter.");
    // Fallback Mock Transporter that logs to console
    transporter = {
      sendMail: async (options) => {
        console.log(`
====== 📨 [MOCK EMAIL OUTBOX] ======
To: ${options.to}
Subject: ${options.subject}
Body (HTML Snippet): 
${options.html ? options.html.substring(0, 450) + "..." : "No HTML body"}
===================================
        `);
        return { messageId: `mock-email-${Date.now()}` };
      }
    };
  }

  return transporter;
}

/**
 * Send email notification
 */
export async function sendEmailNotification(toEmail, subject, htmlBody) {
  const activeTransporter = initializeEmailTransporter();
  const fromEmail = process.env.SMTP_FROM_EMAIL || '"SemPilot Notifications" <notifications@sempilot.app>';

  if (!toEmail) {
    return { success: false, reason: "Recipient email is empty" };
  }

  try {
    const info = await activeTransporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: subject,
      html: htmlBody
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Failed to send email to ${toEmail}. Error:`, err);
    return { success: false, error: err.message };
  }
}
