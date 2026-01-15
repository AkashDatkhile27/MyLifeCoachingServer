function generateIntroSessionInvoice ({ name, email, phone, date, orderId, paymentId, amount, description }) {
  const itemDescription = description || (amount == 199 ? "Introduction Session (Demo Call)" : "15-Day Transformation Course");

  return `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e0e0e0; background-color: #ffffff; border-radius: 8px;">
        
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; color: #000; font-size: 24px; letter-spacing: 1px;">MyLifeCoaching</h1>
          <p style="margin: 5px 0; color: #666; font-size: 14px; text-transform: uppercase;">Payment Receipt</p>
        </div>

        <!-- Details -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div style="width: 48%; float: left;">
            <p style="font-size: 12px; color: #888; margin-bottom: 5px; text-transform: uppercase;">Billed To</p>
            <p style="margin: 0; font-weight: bold;">${name}</p>
            <p style="margin: 2px 0; font-size: 14px;">${email}</p>
            <p style="margin: 2px 0; font-size: 14px;">${phone}</p>
          </div>
          <div style="width: 48%; float: right; text-align: right;">
            <p style="font-size: 12px; color: #888; margin-bottom: 5px; text-transform: uppercase;">Payment Details</p>
            <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 2px 0; font-size: 14px;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin: 2px 0; font-size: 14px;"><strong>Payment ID:</strong> ${paymentId}</p>
          </div>
          <div style="clear: both;"></div>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-size: 14px;">Description</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; font-size: 14px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 15px 12px; border-bottom: 1px solid #eee; font-size: 14px;">${itemDescription}</td>
              <td style="padding: 15px 12px; text-align: right; border-bottom: 1px solid #eee; font-size: 14px;">₹${amount}</td>
            </tr>
            <tr>
              <td style="padding: 15px 12px; font-weight: bold; text-align: right; border-top: 2px solid #000;">Total Paid</td>
              <td style="padding: 15px 12px; font-weight: bold; text-align: right; border-top: 2px solid #000; font-size: 16px;">₹${amount}</td>
            </tr>
          </tbody>
        </table>

        <!-- Footer -->
        <div style="text-align: center; color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          <p style="margin-bottom: 5px;">Thank you for starting your journey with us.</p>
          <p>MyLifeCoaching Team</p>
        </div>
      </div>
    `;
};
module.exports = generateIntroSessionInvoice;