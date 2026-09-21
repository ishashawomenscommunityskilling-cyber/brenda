(function () {
  const cfg = window.BRENDAVA_PAY || {};

  const BANK_METHODS = {
    USD: "account, banktransfer",
    EUR: "account",
    GBP: "account",
    ZAR: "account",
    NGN: "banktransfer, account, ussd, internetbanking",
    UGX: "account, banktransfer"
  };

  function $(id) {
    return document.getElementById(id);
  }

  function money(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function txRef() {
    return "BRENDAVA-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  function hasPublicKey() {
    return Boolean(cfg.flutterwavePublicKey && cfg.flutterwavePublicKey.indexOf("FLWPUBK") === 0);
  }

  function showFeedback(boxId, type, html) {
    const box = $(boxId);
    if (!box) return;
    box.className = "form-feedback " + type;
    box.innerHTML = html;
    box.style.display = "block";
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function setSetupState() {
    const hasKey = hasPublicKey();
    ["flwSetupBanner", "flwBankSetupBanner"].forEach(function (id) {
      const el = $(id);
      if (el) el.style.display = hasKey ? "none" : "flex";
    });
    ["flutterwavePayBtn", "flutterwaveBankPayBtn"].forEach(function (id) {
      const btn = $(id);
      if (!btn) return;
      btn.disabled = !hasKey;
      btn.setAttribute("aria-disabled", hasKey ? "false" : "true");
    });
    return hasKey;
  }

  function collectFields(prefix, fallbackCurrency) {
    return {
      name: ($(prefix + "Name") && $(prefix + "Name").value.trim()) || "",
      email: ($(prefix + "Email") && $(prefix + "Email").value.trim()) || "",
      phone: ($(prefix + "Phone") && $(prefix + "Phone").value.trim()) || "",
      amount: money($(prefix + "Amount") && $(prefix + "Amount").value),
      purpose: ($(prefix + "Purpose") && $(prefix + "Purpose").value) || "Safari deposit",
      bookingRef: ($(prefix + "BookingRef") && $(prefix + "BookingRef").value.trim()) || "Website payment",
      currency: ($(prefix + "Currency") && $(prefix + "Currency").value) || fallbackCurrency || cfg.currency || "USD"
    };
  }

  function openCheckout(opts) {
    const feedbackId = opts.feedbackId;
    if (!setSetupState()) {
      showFeedback(
        feedbackId,
        "error",
        "<strong>Online checkout is not live yet.</strong> Add your Flutterwave public key in <code>js/pay-config.js</code>, then reload."
      );
      return;
    }
    if (typeof FlutterwaveCheckout !== "function") {
      showFeedback(feedbackId, "error", "The secure checkout could not load. Check your internet connection and try again.");
      return;
    }

    const fields = opts.fields;
    if (!fields.name || !fields.email || !fields.phone) {
      showFeedback(feedbackId, "error", "Please enter your full name, email and WhatsApp/phone so we can match this payment to your booking.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      showFeedback(feedbackId, "error", "Please enter a valid email address.");
      return;
    }
    if (fields.amount < (cfg.minAmount || 50)) {
      showFeedback(feedbackId, "error", "Enter a deposit of at least " + (cfg.minAmount || 50) + " in the selected currency. Confirm the exact amount with us first if you are unsure.");
      return;
    }

    const reference = txRef();
    const btn = $(opts.buttonId);
    const originalHtml = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening secure checkout…';
    }

    const checkout = {
      public_key: cfg.flutterwavePublicKey,
      tx_ref: reference,
      amount: fields.amount,
      currency: fields.currency,
      payment_options: opts.paymentOptions,
      customer: {
        email: fields.email,
        phone_number: fields.phone,
        name: fields.name
      },
      meta: {
        booking_ref: fields.bookingRef,
        purpose: fields.purpose,
        company: "Brendava Tours & Travel Co. Ltd",
        pay_mode: opts.mode
      },
      customizations: {
        title: cfg.companyName || "Brendava Tours & Travel",
        description: fields.purpose + " · " + fields.bookingRef,
        logo: cfg.logo || ""
      },
      callback: function (data) {
        const status = (data && (data.status || (data.data && data.data.status))) || "";
        const id = (data && (data.transaction_id || data.tx_ref)) || reference;
        if (String(status).toLowerCase() === "successful" || String(status).toLowerCase() === "completed") {
          showFeedback(
            feedbackId,
            "success",
            "<strong>Payment submitted.</strong> Flutterwave reference: <code>" +
              id +
              "</code><br>Keep this code. We confirm deposits in our Flutterwave dashboard and send written confirmation within 24 hours."
          );
          const wa = cfg.whatsappConfirm || "256789336441";
          const msg = encodeURIComponent(
            "Hello Brendava Tours, I have paid via Flutterwave (" +
              opts.mode +
              ").\n\nName: " +
              fields.name +
              "\nEmail: " +
              fields.email +
              "\nAmount: " +
              fields.amount +
              " " +
              fields.currency +
              "\nPurpose: " +
              fields.purpose +
              "\nBooking ref: " +
              fields.bookingRef +
              "\nFlutterwave tx: " +
              id
          );
          window.open("https://wa.me/" + wa + "?text=" + msg, "_blank", "noopener");
        } else {
          showFeedback(
            feedbackId,
            "error",
            "Checkout closed without a successful charge. If money left your account, send the Flutterwave receipt on WhatsApp and we will reconcile it."
          );
        }
      },
      onclose: function () {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
        }
      }
    };

    if (opts.mode === "bank") {
      checkout.bank_transfer_options = { expires: 3600 };
    }

    FlutterwaveCheckout(checkout);
  }

  window.payWithFlutterwave = function () {
    openCheckout({
      mode: "card",
      fields: collectFields("pay", cfg.currency || "USD"),
      paymentOptions: "card, mobilemoneyuganda, mobilemoneyrwanda, mpesa, paypal",
      buttonId: "flutterwavePayBtn",
      feedbackId: "payFeedback"
    });
  };

  window.payWithFlutterwaveBank = function () {
    const fields = collectFields("bankPay", "USD");
    openCheckout({
      mode: "bank",
      fields: fields,
      paymentOptions: BANK_METHODS[fields.currency] || "account, banktransfer",
      buttonId: "flutterwaveBankPayBtn",
      feedbackId: "bankPayFeedback"
    });
  };

  document.addEventListener("DOMContentLoaded", setSetupState);
})();
