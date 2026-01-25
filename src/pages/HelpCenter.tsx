import { Layout } from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Package, RefreshCcw, CreditCard, Truck, Shield, MessageCircle, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const helpCategories = [
  {
    icon: Package,
    title: 'Orders & Tracking',
    description: 'Track your order, modify or cancel orders',
  },
  {
    icon: RefreshCcw,
    title: 'Returns & Refunds',
    description: '15-day return policy, refund process',
  },
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'Payment methods, failed payments',
  },
  {
    icon: Truck,
    title: 'Shipping & Delivery',
    description: 'Delivery times, shipping charges',
  },
];

const faqs = [
  {
    category: 'Orders',
    questions: [
      {
        q: 'How can I track my order?',
        a: 'You can track your order by going to "My Orders" section. Click on any order to see real-time tracking updates with estimated delivery date.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'Yes, you can cancel your order before it is shipped. Go to "My Orders", select the order and click "Cancel Order". Once shipped, cancellation is not possible.',
      },
      {
        q: 'How do I modify my order?',
        a: 'Order modifications are only possible before shipping. Please contact our support team immediately through the chat option for any changes.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 15-day return policy. If you receive a damaged product or wrong item, you can request a return within 15 days of delivery.',
      },
      {
        q: 'What if my order doesn\'t arrive within 15 days?',
        a: '🔒 अगर आपका ऑर्डर 15 दिनों में नहीं आता है, तो आपको 100% रिफंड मिलेगा। हम आपके पैसे की पूरी गारंटी देते हैं। If your order doesn\'t arrive within 15 days of the expected delivery date, you will receive a FULL REFUND of your entire payment. No questions asked!',
      },
      {
        q: 'How long does refund take?',
        a: 'Refunds are processed within 5-7 business days after we receive the returned item or approve your refund request. The amount will be credited to your original payment method.',
      },
      {
        q: 'How do I initiate a return?',
        a: 'Contact our support team through the chat option or call us. Provide your order ID and reason for return. We will arrange pickup from your address.',
      },
    ],
  },
  {
    category: 'Payments',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept Razorpay (Credit/Debit Cards, UPI, Net Banking, Wallets), Direct UPI payment, and Cash on Delivery (COD).',
      },
      {
        q: 'Is it safe to pay online?',
        a: 'Yes! All payments are processed through secure, encrypted gateways. We never store your card details on our servers.',
      },
      {
        q: 'My payment failed but money was deducted',
        a: 'Don\'t worry! If payment fails, the amount is automatically refunded within 5-7 business days. If not, contact our support with transaction details.',
      },
    ],
  },
  {
    category: 'Shipping',
    questions: [
      {
        q: 'What are the shipping charges?',
        a: 'We offer FREE shipping on all orders above ₹499. For orders below ₹499, a nominal shipping charge of ₹49 applies.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 5-7 business days for metro cities and 7-10 days for other areas. Express delivery (1-3 days) is available for select locations.',
      },
      {
        q: 'Do you deliver to my area?',
        a: 'We deliver across India! Enter your pincode during checkout to confirm delivery availability and estimated time for your location.',
      },
    ],
  },
];

export default function HelpCenter() {
  return (
    <Layout>
      <div className="min-h-screen bg-secondary/30">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container text-center">
            <HelpCircle className="h-16 w-16 mx-auto mb-6 opacity-80" />
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
            <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">
              Find answers to your questions or contact our support team
            </p>
          </div>
        </div>

        <div className="container py-12">
          {/* Quick Help Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {helpCategories.map((category) => (
              <Card key={category.title} className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <category.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Refund Guarantee Banner */}
          <Card className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                    <Shield className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h2 className="font-display text-2xl font-bold text-green-800 mb-2">
                    🛡️ 15-Day Money Back Guarantee
                  </h2>
                  <p className="text-green-700 mb-2">
                    <strong>अगर 15 दिनों में ऑर्डर नहीं मिला तो 100% पैसे वापस!</strong>
                  </p>
                  <p className="text-green-600">
                    We promise: If your order doesn't arrive within 15 days, you get a FULL REFUND. Your money is 100% safe with us.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <div className="mb-12">
            <h2 className="font-display text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            
            <div className="grid gap-8">
              {faqs.map((section) => (
                <Card key={section.category}>
                  <CardHeader>
                    <CardTitle>{section.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {section.questions.map((faq, idx) => (
                        <AccordionItem key={idx} value={`${section.category}-${idx}`}>
                          <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground whitespace-pre-line">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Still need help?</CardTitle>
              <CardDescription>Our support team is here to assist you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-lg bg-secondary/50">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-4">Chat with our support team</p>
                  <Button size="sm">Start Chat</Button>
                </div>
                <div className="text-center p-6 rounded-lg bg-secondary/50">
                  <Phone className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Call Us</h3>
                  <p className="text-sm text-muted-foreground mb-4">+91 98765 43210</p>
                  <Button size="sm" variant="outline">Call Now</Button>
                </div>
                <div className="text-center p-6 rounded-lg bg-secondary/50">
                  <Mail className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-sm text-muted-foreground mb-4">support@luxe.com</p>
                  <Button size="sm" variant="outline">Send Email</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
