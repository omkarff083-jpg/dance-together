import { Layout } from '@/components/layout/Layout';
import { Shield, Lock, Eye, Database, Bell, UserCheck, Globe, Mail, CheckCircle, RefreshCw, Truck, CreditCard, Clock, IndianRupee, Package, HeartHandshake } from 'lucide-react';

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
            
            {/* 🔥 MAIN REFUND GUARANTEE BANNER */}
            <section className="mb-10 p-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-4">
                  <IndianRupee className="h-5 w-5" />
                  <span className="font-bold">100% Money Back Guarantee</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 mt-0">
                  🛡️ 15-Day Full Refund Policy
                </h2>
                <p className="text-2xl font-bold mb-2">
                  अगर 15 दिनों में ऑर्डर नहीं मिला = पूरे पैसे वापस!
                </p>
                <p className="text-xl opacity-90">
                  Order not delivered in 15 days? Get 100% refund - No questions asked!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-white/20 rounded-xl p-4">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">15 Days</p>
                    <p className="text-sm opacity-80">Delivery Time</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4">
                    <IndianRupee className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">100% Refund</p>
                    <p className="text-sm opacity-80">Full Amount Return</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4">
                    <HeartHandshake className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">No Questions</p>
                    <p className="text-sm opacity-80">Hassle-Free</p>
                  </div>
                </div>
              </div>
            </section>

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

            {/* Our Promises - NEW SECTION */}
            <section className="mb-10 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
              <h2 className="font-display text-2xl font-bold mb-6 text-center">🤝 Our Promises to You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-background rounded-lg shadow-sm">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">100% Original Products</p>
                    <p className="text-sm text-muted-foreground">Only genuine, quality items</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background rounded-lg shadow-sm">
                  <Truck className="h-6 w-6 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Free Shipping</p>
                    <p className="text-sm text-muted-foreground">On orders above ₹499</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background rounded-lg shadow-sm">
                  <RefreshCw className="h-6 w-6 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Easy Returns</p>
                    <p className="text-sm text-muted-foreground">15-day hassle-free returns</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background rounded-lg shadow-sm">
                  <CreditCard className="h-6 w-6 text-purple-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Secure Payments</p>
                    <p className="text-sm text-muted-foreground">100% safe transactions</p>
                  </div>
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

            {/* Detailed Refund Policy */}
            <section className="mb-10 p-6 bg-green-50 border-2 border-green-300 rounded-xl">
              <div className="flex items-start gap-4">
                <Package className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0 text-green-800">
                    📦 Complete Refund & Return Policy
                  </h2>
                  <div className="space-y-6 text-green-700">
                    
                    {/* Main Promise Box */}
                    <div className="p-6 bg-green-100 rounded-xl border border-green-300">
                      <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                        <IndianRupee className="h-6 w-6" />
                        15-Day Money Back Guarantee
                      </h3>
                      <p className="text-lg font-bold mb-2">
                        🎯 अगर 15 दिनों के अंदर ऑर्डर नहीं मिला, तो 100% पैसे वापस!
                      </p>
                      <p className="text-lg">
                        If your order is not delivered within 15 days of placing the order, 
                        we will refund your COMPLETE payment amount. This is our promise!
                      </p>
                    </div>
                    
                    <h4 className="font-semibold text-lg">✅ Return Eligibility:</h4>
                    <ul className="space-y-2 ml-4">
                      <li>• Damaged or defective products - पूरा रिफंड</li>
                      <li>• Wrong item received - FREE replacement या रिफंड</li>
                      <li>• Size/color different from ordered - FREE exchange</li>
                      <li>• Product not as described - Full refund</li>
                      <li>• Order not delivered in 15 days - 100% money back</li>
                    </ul>

                    <h4 className="font-semibold text-lg">📋 How to Get Refund:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
                        <p className="text-sm">Contact Support</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
                        <p className="text-sm">Share Order ID</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
                        <p className="text-sm">FREE Pickup</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">4</div>
                        <p className="text-sm">Quality Check</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">5</div>
                        <p className="text-sm">Refund in 5-7 days</p>
                      </div>
                    </div>

                    <h4 className="font-semibold text-lg">⏰ Refund Timeline:</h4>
                    <ul className="space-y-2 ml-4">
                      <li>• <strong>UPI/Net Banking:</strong> 2-3 business days</li>
                      <li>• <strong>Credit/Debit Card:</strong> 5-7 business days</li>
                      <li>• <strong>Wallet:</strong> Instant to 24 hours</li>
                    </ul>

                    <h4 className="font-semibold text-lg">❌ Non-Returnable Items:</h4>
                    <ul className="space-y-2 ml-4">
                      <li>• Innerwear and lingerie (hygiene reasons)</li>
                      <li>• Items with tags removed or used</li>
                      <li>• Customized/personalized items</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping Policy - NEW */}
            <section className="mb-10 p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-4">
                <Truck className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4 mt-0 text-blue-800">
                    🚚 Shipping Policy
                  </h2>
                  <div className="space-y-4 text-blue-700">
                    <ul className="space-y-3">
                      <li>✈️ <strong>Delivery Time:</strong> 5-15 days across India</li>
                      <li>📍 <strong>Tracking:</strong> Real-time tracking available for all orders</li>
                      <li>🆓 <strong>Free Shipping:</strong> On orders above ₹499</li>
                      <li>💰 <strong>Under ₹499:</strong> Flat ₹49 shipping charge</li>
                      <li>📦 <strong>Cash on Delivery:</strong> Available (₹29 extra)</li>
                    </ul>
                    <div className="p-4 bg-blue-100 rounded-lg">
                      <p className="font-semibold">
                        💡 Pro Tip: Order ₹500 से ज़्यादा का और पाएं FREE delivery!
                      </p>
                    </div>
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
                    <li><strong>Support Hours:</strong> 10 AM - 7 PM (Monday - Saturday)</li>
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