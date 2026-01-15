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
let pdfBuffer;

    // --- TRY PDF GENERATION (Robust Serverless Logic) ---
    try {
        let browser;
        
        // Strategy: Check if we are in a serverless environment (like Vercel)
        // You MUST install: npm install @sparticuz/chromium puppeteer-core
        try {
            const chromium = require('@sparticuz/chromium');
            const puppeteerCore = require('puppeteer-core');

            // Optional: Adjust graphics mode for Vercel
            // chromium.setHeadlessMode = true; 
            // chromium.setGraphicsMode = false;

            browser = await puppeteerCore.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });
            console.log("Using @sparticuz/chromium for PDF generation.");
        } catch (serverlessError) {
            // Fallback: Standard Puppeteer (Local Development)
            console.log("Serverless chromium not found, trying standard puppeteer...");
            const puppeteer = require('puppeteer');
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
        }
        
        const page = await browser.newPage();
        
        // Use setContent with timeout
        await page.setContent(invoiceContent, { waitUntil: 'networkidle0', timeout: 15000 });
        
        pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        pdfGenerated = true;
        await browser.close();

    } catch (pdfError) {
        console.error("⚠️ PDF Generation Failed:", pdfError.message);
        throw new Error("Failed to generate PDF Invoice. Please check server logs for Puppeteer configuration.");
    }

    const attachments = [{
        filename: 'Invoice.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
    }];


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



