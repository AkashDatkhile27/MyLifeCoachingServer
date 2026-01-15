const puppeteer = require('puppeteer');
const generateIntroSessionInvoice= require('../utils/invoiceTemplates');
const sendEmail = require('../utils/sendEmail');

const sendInvoiceAndNotification = async ({ name, email, phone, paymentId, orderId, amount, description }) => {
    const date = new Date().toLocaleDateString();

    const invoiceContent = generateIntroSessionInvoice({
        name, email, phone, paymentId, orderId, amount, description, date
    });
    let adminEmailBody = '';

    if(amount == 30000)
    {
        //Email Admin: Combine Admin Info + Invoice
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
    }
    else{
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
    
   // --- TRY PDF GENERATION ---
    try {
        const browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Critical for server environments
        });
        const page = await browser.newPage();
        
        // Use setContent with timeout to prevent hanging
        await page.setContent(invoiceContent, { waitUntil: 'networkidle0', timeout: 30000 });
        
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
    } catch (pdfError) {
        console.error("⚠️ PDF Generation Failed (Falling back to HTML):", pdfError.message);
    }
        //Email User: Combine Greeting + Invoice in the email body
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
        html: userEmailBody, // Optional: Keep inline HTML for quick viewing
        attachments
    });

    // Email Admin
    await sendEmail({
        email: process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL,
        subject: `New Registration: ${name}`,
        message: `New user registered for the full course.\nName: ${name}`,
        html: adminEmailBody,
        attachments
    });
   
    
};


module.exports = sendInvoiceAndNotification;
