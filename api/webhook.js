import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Stripe kľúč z Vercel prostredia
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Keď je platba úspešná
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details.email;

    // Priprav PDF na odoslanie
    const filePath = path.join(process.cwd(), 'files', 'muj-ebook.pdf');
    const fileContent = fs.readFileSync(filePath);

    // Nastavenie mailového klienta
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Odoslanie e-mailu
    await transporter.sendMail({
      from: 'svadbanadosah@gmail.com',
      to: customerEmail,
      subject: 'Váš eBook – Svadba na dosah 💍',
      text: 'Ďakujeme za kúpu! V prílohe nájdete svoj eBook.',
      attachments: [
        {
          filename: 'muj-ebook.pdf',
          content: fileContent,
        },
      ],
    });

    console.log(`E-mail bol odoslaný na ${customerEmail}`);
  }

  res.status(200).json({ received: true });
}

// Aby Stripe správne čítal raw body
export const config = {
  api: {
    bodyParser: false,
  },
};
