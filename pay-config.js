/**
 * Brendava Tours — public checkout settings.
 * Paste your Flutterwave PUBLIC key from:
 * https://dashboard.flutterwave.com → Settings → API Keys
 *
 * Test key starts with FLWPUBK_TEST-
 * Live key starts with FLWPUBK-
 *
 * Never put your SECRET key in this file or in any HTML/JS on the website.
 *
 * For online bank payments, in Flutterwave Dashboard:
 * Settings → Business Preferences → Payment Methods
 * enable “Pay with Bank” (account) and “Bank Transfer”.
 * Uncheck “Enable Dashboard Payment Options” so the website can choose bank vs card.
 */
window.BRENDAVA_PAY = {
  flutterwavePublicKey: "",
  currency: "USD",
  minAmount: 50,
  companyName: "Brendava Tours & Travel",
  logo: "https://www.brendavatoursandtravel.com/images/logo.jpg",
  whatsappConfirm: "256762584996",
  emailConfirm: "brendavatoursandtravel@gmail.com"
};
