import { Layout } from "@/components/layout/Layout";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  RefreshCw, 
  Shield, 
  Scale, 
  AlertTriangle,
  Users,
  MessageSquare,
  Ban,
  CheckCircle2
} from "lucide-react";

const TermsConditions = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        {/* Hero Section */}
        <div className="bg-primary/10 py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="h-10 w-10 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Terms & Conditions
              </h1>
            </div>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto">
              कृपया हमारी वेबसाइट का उपयोग करने से पहले इन नियमों और शर्तों को ध्यान से पढ़ें।
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Last Updated: January 2026
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Important Notice */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-amber-800 text-lg mb-2">महत्वपूर्ण सूचना</h3>
                <p className="text-amber-700">
                  इस वेबसाइट का उपयोग करके, आप इन नियमों और शर्तों से बाध्य होने के लिए सहमत हैं। 
                  यदि आप किसी भी शर्त से असहमत हैं, तो कृपया हमारी सेवाओं का उपयोग न करें।
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: General Terms */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">1. सामान्य नियम</h2>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>यह वेबसाइट [Your Company Name] द्वारा संचालित है।</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>हमारी सेवाओं का उपयोग करने के लिए आपकी आयु 18 वर्ष या उससे अधिक होनी चाहिए।</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>आप सही और पूर्ण जानकारी प्रदान करने के लिए जिम्मेदार हैं।</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>हम किसी भी समय इन शर्तों को संशोधित करने का अधिकार सुरक्षित रखते हैं।</span>
                </li>
              </ul>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 2: Account & Registration */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">2. खाता और पंजीकरण</h2>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <div className="space-y-4 text-muted-foreground">
                <p><strong className="text-foreground">खाता बनाना:</strong> आपको हमारी सेवाओं का पूर्ण उपयोग करने के लिए एक खाता बनाना होगा।</p>
                <p><strong className="text-foreground">पासवर्ड सुरक्षा:</strong> आप अपने खाते की सुरक्षा और गोपनीयता बनाए रखने के लिए जिम्मेदार हैं।</p>
                <p><strong className="text-foreground">खाता जिम्मेदारी:</strong> आपके खाते के माध्यम से होने वाली सभी गतिविधियों के लिए आप जिम्मेदार हैं।</p>
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-blue-800 text-sm">
                    <strong>नोट:</strong> यदि आपको अपने खाते में कोई अनधिकृत गतिविधि दिखाई दे, तो तुरंत हमसे संपर्क करें।
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 3: Orders & Purchases */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">3. ऑर्डर और खरीदारी</h2>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">ऑर्डर प्रक्रिया:</h4>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>• सभी ऑर्डर स्वीकृति के अधीन हैं</li>
                    <li>• हम किसी भी ऑर्डर को अस्वीकार करने का अधिकार रखते हैं</li>
                    <li>• ऑर्डर की पुष्टि ईमेल/SMS द्वारा भेजी जाएगी</li>
                    <li>• कीमतें बिना पूर्व सूचना के बदल सकती हैं</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">उत्पाद उपलब्धता:</h4>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>• सभी उत्पाद स्टॉक उपलब्धता के अधीन हैं</li>
                    <li>• रंग और डिजाइन में मामूली अंतर हो सकता है</li>
                    <li>• हम उत्पाद विवरण में त्रुटियों को सुधारने का अधिकार रखते हैं</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 4: Payment Terms */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">4. भुगतान शर्तें</h2>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-green-800">Razorpay</h4>
                    <p className="text-sm text-green-600 mt-1">सुरक्षित ऑनलाइन भुगतान</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-purple-800">UPI</h4>
                    <p className="text-sm text-purple-600 mt-1">GPay, PhonePe, Paytm</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-orange-800">Cash on Delivery</h4>
                    <p className="text-sm text-orange-600 mt-1">डिलीवरी पर भुगतान</p>
                  </div>
                </div>
                <div className="mt-4 text-muted-foreground text-sm">
                  <p>• सभी कीमतें भारतीय रुपये (₹) में हैं और GST सहित हैं</p>
                  <p>• भुगतान विफल होने पर ऑर्डर रद्द हो सकता है</p>
                  <p>• COD ऑर्डर पर अतिरिक्त शुल्क लागू हो सकता है</p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 5: Shipping & Delivery */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">5. शिपिंग और डिलीवरी</h2>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <div className="space-y-4 text-muted-foreground">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="font-semibold text-foreground">डिलीवरी समय: 5-15 कार्य दिवस</p>
                  <p className="text-sm mt-1">दूरस्थ क्षेत्रों में अतिरिक्त समय लग सकता है।</p>
                </div>
                <ul className="space-y-2">
                  <li>• ₹499 से अधिक के ऑर्डर पर मुफ्त शिपिंग</li>
                  <li>• ट्रैकिंग जानकारी ईमेल/SMS द्वारा भेजी जाएगी</li>
                  <li>• डिलीवरी के समय सही पता और फोन नंबर उपलब्ध होना चाहिए</li>
                  <li>• गलत पते के कारण विलंब की जिम्मेदारी ग्राहक की होगी</li>
                </ul>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 6: Returns & Refunds - HIGHLIGHTED */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500 p-2 rounded-lg">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">6. रिटर्न और रिफंड पॉलिसी</h2>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border-2 border-green-200">
              {/* 15-Day Guarantee Banner */}
              <div className="bg-green-600 text-white rounded-xl p-6 mb-6 text-center">
                <h3 className="text-2xl font-bold mb-2">🎉 15-Day Money Back Guarantee 🎉</h3>
                <p className="text-xl">अगर 15 दिनों में ऑर्डर नहीं मिला = 100% पैसे वापस!</p>
                <p className="text-green-100 mt-2 text-sm">No Questions Asked | कोई सवाल नहीं पूछा जाएगा</p>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-bold text-foreground text-lg">रिटर्न के लिए पात्रता:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>खराब या दोषपूर्ण उत्पाद</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>गलत उत्पाद प्राप्त होने पर</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>साइज या रंग में गड़बड़ी</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>15 दिनों में डिलीवरी न होने पर</span>
                  </li>
                </ul>
                
                <div className="bg-white p-4 rounded-lg mt-4">
                  <h4 className="font-bold text-foreground mb-2">रिफंड प्रक्रिया:</h4>
                  <p className="text-muted-foreground text-sm">
                    रिफंड मूल भुगतान विधि में 5-7 कार्य दिवसों में जमा किया जाएगा।
                    COD ऑर्डर के लिए बैंक खाता विवरण आवश्यक होगा।
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 7: Prohibited Activities */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500 p-2 rounded-lg">
                <Ban className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">7. निषिद्ध गतिविधियाँ</h2>
            </div>
            <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-200">
              <p className="text-red-800 mb-4">निम्नलिखित गतिविधियाँ सख्त वर्जित हैं:</p>
              <ul className="space-y-2 text-red-700">
                <li>❌ फर्जी ऑर्डर या जानकारी देना</li>
                <li>❌ दूसरों के खातों का दुरुपयोग</li>
                <li>❌ वेबसाइट को हैक या नुकसान पहुंचाने का प्रयास</li>
                <li>❌ धोखाधड़ी या अवैध गतिविधियाँ</li>
                <li>❌ नकली समीक्षाएं या रेटिंग देना</li>
                <li>❌ स्पैम या अनुचित सामग्री पोस्ट करना</li>
              </ul>
              <p className="text-red-800 mt-4 font-semibold">
                ⚠️ उल्लंघन करने पर खाता तुरंत बंद कर दिया जाएगा।
              </p>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 8: Privacy & Data */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">8. गोपनीयता और डेटा सुरक्षा</h2>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <p className="text-muted-foreground mb-4">
                आपकी व्यक्तिगत जानकारी की सुरक्षा हमारी प्राथमिकता है। 
                हम आपके डेटा को सुरक्षित रखने के लिए उन्नत एन्क्रिप्शन तकनीक का उपयोग करते हैं।
              </p>
              <a href="/privacy-policy" className="text-primary hover:underline font-medium">
                📄 हमारी पूर्ण गोपनीयता नीति पढ़ें →
              </a>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 9: Intellectual Property */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">9. बौद्धिक संपदा</h2>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <p className="text-muted-foreground">
                इस वेबसाइट पर सभी सामग्री, लोगो, चित्र, डिज़ाइन और टेक्स्ट हमारी बौद्धिक संपदा हैं।
                बिना लिखित अनुमति के किसी भी सामग्री का उपयोग, पुनरुत्पादन या वितरण सख्त वर्जित है।
              </p>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 10: Contact */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">10. संपर्क करें</h2>
            </div>
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 shadow-sm border">
              <p className="text-muted-foreground mb-4">
                किसी भी प्रश्न या सहायता के लिए हमसे संपर्क करें:
              </p>
              <div className="space-y-2">
                <p><strong>📧 Email:</strong> support@yourstore.com</p>
                <p><strong>📞 Phone:</strong> +91 XXXXXXXXXX</p>
                <p><strong>⏰ Support Hours:</strong> सोमवार - शनिवार, 10:00 AM - 7:00 PM</p>
              </div>
              <div className="mt-4">
                <a href="/help" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  <MessageSquare className="h-4 w-4" />
                  Help Center पर जाएं
                </a>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <div className="bg-muted rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              इन नियमों और शर्तों का अंतिम अद्यतन जनवरी 2026 में किया गया था।
              हम समय-समय पर इन शर्तों को अपडेट कर सकते हैं।
              कृपया नियमित रूप से इस पेज की जांच करें।
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsConditions;
