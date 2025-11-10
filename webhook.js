import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const pdfPath = path.join(process.cwd(), 'files/muj-ebook.pdf');
export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customer_email = session.customer_details.email;

    // Načítať PDF zo súborov
    const pdfPath = path.join(process.cwd(), 'files/muj-ebook.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Nastavenie mailu
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    // Poslať e-mail s PDF prílohou
    await transporter.sendMail({
      from: 'svadbanadosah@gmail.com',
      to: customer_email,
      subject: 'Tvoj PDF',
      text: 'Ďakujeme za nákup, tu je tvoj PDF!',
      attachments: [{ filename: 'muj-ebook.pdf', content: pdfBuffer }]
    });
  }

  res.status(200).json({ received: true });
}
