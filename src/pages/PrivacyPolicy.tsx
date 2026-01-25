import { Layout } from '@/components/layout/Layout';
import { Shield, Lock, Eye, Database, Bell, UserCheck, Globe, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="min-h-screen bg-secondary/30">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container text-center">
            <Shield className="h-16 w-16 mx-auto mb-6 opacity-80" />
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-primary-foreground/70 text-lg">
              Last updated: January 2026
            </p>
          </div>
        </div>

        <div className="container py-12 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            
            {/* Introduction */}
            <section className="mb-10 p-6 bg-background rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <Lock className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0">Your Privacy Matters</h2>
                  <p className="text-muted-foreground">
                    At LUXE, we are committed to protecting your privacy. This policy explains how we collect, 
                    use, and safeguard your personal information when you use our website and services.
                  </p>
                </div>
              </div>
            </section>

            {/* Information We Collect */}
            <section className="mb-10 p-6 bg-background rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <Database className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0">Information We Collect</h2>
                  <ul className="space-y-3 text-muted-foreground">
                    <li><strong>Personal Information:</strong> Name, email, phone number, shipping address when you place an order</li>
                    <li><strong>Payment Information:</strong> We do NOT store card details. Payments are processed securely through Razorpay</li>
                    <li><strong>Order History:</strong> Records of your purchases for order tracking and customer service</li>
                    <li><strong>Device Information:</strong> Browser type, IP address for security and analytics</li>
                    <li><strong>Cookies:</strong> To improve your shopping experience and remember preferences</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="mb-10 p-6 bg-background rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <Eye className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0">How We Use Your Information</h2>
                  <ul className="space-y-3 text-muted-foreground">
                    <li>✅ Process and deliver your orders</li>
                    <li>✅ Send order confirmations and shipping updates</li>
                    <li>✅ Provide customer support</li>
                    <li>✅ Prevent fraud and ensure security</li>
                    <li>✅ Improve our website and services</li>
                    <li>❌ We do NOT sell your data to third parties</li>
                    <li>❌ We do NOT send spam or unwanted marketing</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-10 p-6 bg-background rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0">Data Security</h2>
                  <p className="text-muted-foreground mb-4">
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="space-y-3 text-muted-foreground">
                    <li>🔐 SSL encryption for all data transmission</li>
                    <li>🔐 Secure payment processing through certified gateways</li>
                    <li>🔐 Regular security audits and updates</li>
                    <li>🔐 Limited employee access to personal data</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="mb-10 p-6 bg-background rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <UserCheck className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0">Your Rights</h2>
                  <ul className="space-y-3 text-muted-foreground">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correction:</strong> Update incorrect or incomplete data</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    To exercise any of these rights, contact us at <strong>privacy@luxe.com</strong>
                  </p>
                </div>
              </div>
            </section>

            {/* Refund Policy */}
            <section className="mb-10 p-6 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0 text-green-800">
                    💰 Refund & Return Policy
                  </h2>
                  <div className="space-y-4 text-green-700">
                    <div className="p-4 bg-green-100 rounded-lg">
                      <h3 className="font-bold text-lg mb-2">🛡️ 15-Day Money Back Guarantee</h3>
                      <p className="font-bold">
                        अगर आपका ऑर्डर 15 दिनों में नहीं आता है, तो आपको 100% पैसे वापस मिलेंगे!
                      </p>
                      <p>
                        If your order doesn't arrive within 15 days of the expected delivery date, 
                        you will receive a FULL REFUND. No questions asked!
                      </p>
                    </div>
                    
                    <h4 className="font-semibold">Return Eligibility:</h4>
                    <ul className="space-y-2">
                      <li>✅ Damaged or defective products</li>
                      <li>✅ Wrong item received</li>
                      <li>✅ Size/color different from ordered</li>
                      <li>✅ Product not as described</li>
                    </ul>

                    <h4 className="font-semibold">Refund Process:</h4>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>Contact our support team within 15 days of delivery</li>
                      <li>Provide order ID and reason for return</li>
                      <li>We'll arrange FREE pickup from your address</li>
                      <li>Refund processed within 5-7 business days</li>
                      <li>Amount credited to original payment method</li>
                    </ol>

                    <h4 className="font-semibold">Non-Returnable Items:</h4>
                    <ul className="space-y-2">
                      <li>❌ Innerwear and lingerie (hygiene reasons)</li>
                      <li>❌ Items with tags removed or used</li>
                      <li>❌ Customized/personalized items</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Third Party Services */}
            <section className="mb-10 p-6 bg-background rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <Globe className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0">Third-Party Services</h2>
                  <p className="text-muted-foreground mb-4">
                    We use trusted third-party services to provide our services:
                  </p>
                  <ul className="space-y-3 text-muted-foreground">
                    <li><strong>Razorpay:</strong> Secure payment processing</li>
                    <li><strong>Delivery Partners:</strong> Shipping and logistics</li>
                    <li><strong>Analytics:</strong> To understand usage and improve experience</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    These services have their own privacy policies and we recommend reviewing them.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="mb-10 p-6 bg-primary/5 rounded-xl">
              <div className="flex items-start gap-4">
                <Mail className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0">Contact Us</h2>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about this Privacy Policy, please contact us:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Email:</strong> privacy@luxe.com</li>
                    <li><strong>Phone:</strong> +91 98765 43210</li>
                    <li><strong>Address:</strong> 123 Fashion Street, Mumbai, India 400001</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Updates */}
            <section className="p-6 bg-background rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <Bell className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0">Policy Updates</h2>
                  <p className="text-muted-foreground">
                    We may update this Privacy Policy from time to time. Any changes will be posted on this page 
                    with an updated revision date. We encourage you to review this policy periodically.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </Layout>
  );
}
