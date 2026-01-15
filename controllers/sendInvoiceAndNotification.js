// const puppeteer = require('puppeteer');
const generateIntroSessionInvoice= require('../utils/invoiceTemplates');
const sendEmail = require('../utils/sendEmail');

const sendInvoiceAndNotification = async ({ name, email, phone, paymentId, orderId, amount, description }) => {
      const date = new Date().toLocaleDateString();

    const invoiceContent = generateIntroSessionInvoice({
        name, email, phone, paymentId, orderId, amount, description, date
    });

    // Determine Admin Email Body based on amount
    let adminEmailBody = '';
    if(amount == 30000) {
        adminEmailBody = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>New Booking Alert! 🚀</h2>
            <p>A new user has booked the 15-Day Transformation Course Session (₹${amount}).</p>
            <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Phone:</strong> ${phone}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Payment ID:</strong> ${paymentId}</li>
            </ul>
            <hr/>
            <h3>Copy of User Invoice:</h3>
            ${invoiceContent}
          </div>
        `;
    } else {
        adminEmailBody = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>New Booking Alert! 🚀</h2>
            <p>A new user has booked the Intro Session (₹${amount}).</p>
            <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Phone:</strong> ${phone}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Payment ID:</strong> ${paymentId}</li>
            </ul>
            <hr/>
            <h3>Copy of User Invoice:</h3>
            ${invoiceContent}
          </div>
        `;
    }

    // 1. Initialize attachments array immediately
    let attachments = [];
    let pdfGenerated = false;

    // --- TRY PDF GENERATION (Lazy Load & Fallback) ---
    try {
        // Require puppeteer inside the function so it doesn't crash the server if missing
        const puppeteer = require('puppeteer'); 
        
        const browser = await puppeteer.launch({ 
            headless: 'new',
            // Critical args for serverless/container environments to prevent crashes
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--single-process', 
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        
        // Use setContent with timeout
        await page.setContent(invoiceContent, { waitUntil: 'networkidle0', timeout: 10000 });
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        
        await browser.close();

        attachments.push({
            filename: 'Invoice.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
        });
        pdfGenerated = true;

    } catch (pdfError) {
        console.error("⚠️ PDF Generation Failed (Falling back to HTML Invoice):", pdfError.message);
        // Do NOT throw error here. We want to proceed with HTML fallback.
    }

    // --- FALLBACK TO HTML FILE ---
    // If PDF failed or Puppeteer wasn't found, send HTML
    if (!pdfGenerated) {
        const fullHtmlAttachment = `<!DOCTYPE html><html><head><title>Invoice</title></head><body style="font-family:Arial;">${invoiceContent}</body></html>`;
        attachments.push({
            filename: 'Invoice.html',
            content: fullHtmlAttachment,
            contentType: 'text/html'
        });
    }

    // User Email Body
    const userEmailBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your session booking is successfully confirmed!</p>
        <p>Please find your official payment receipt details below. A downloadable copy is also attached to this email.</p>
        <br/>
        ${invoiceContent}
        <br/>
        <p>Best Regards,<br/>MyLifeCoaching Team</p>
      </div>
    `;

    // Email User
    await sendEmail({
        email: email,
        subject: 'Welcome to MyLifeCoaching! Payment Receipt',
        message: `Hi ${name},\n\nWelcome to the ${description}! Your payment of ₹${amount} was successful. Please find your invoice attached.`,
        html: userEmailBody,
        attachments: attachments // Explicitly pass the array
    });

    // Email Admin
    await sendEmail({
        email: process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL,
        subject: `New Course Registration: ${name}`,
        message: `New user registered for the full course.\nName: ${name}\nPhone: ${phone}\nAmount: ₹${amount}`,
        html: adminEmailBody,
        attachments: attachments // Explicitly pass the array
    });
};


module.exports = sendInvoiceAndNotification;


