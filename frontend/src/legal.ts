// Connectra Telecom — legal documents (South Africa).
// Written for a South African electronic communications provider. Have them reviewed by a
// South African attorney before go-live. Fill in the null values in `legalEntity` when confirmed;
// until then the documents fall back to the website's contact form instead of showing invented details.

export const legalEntity = {
  tradingName: 'Connectra Telecom',
  entity: 'VINK Group (Pty) Ltd',
  registration: '2018/079316/07',
  city: 'Cape Town, Western Cape, South Africa',
  streetAddress: null as string | null, // e.g. '12 Example Street, Cape Town, 8001'
  supportEmail: null as string | null, // e.g. 'support@connectra.co.za'
  privacyEmail: null as string | null, // e.g. 'privacy@connectra.co.za'
  complaintsEmail: null as string | null,
  phone: null as string | null, // e.g. '021 000 0000'
  informationOfficer: null as string | null, // name registered with the Information Regulator
  icasaLicence: null as string | null, // e.g. 'I-ECNS and I-ECS licence no. ...'
  effectiveDate: '24 November 2026',
}

const L = legalEntity
const contactLine = (email: string | null, label: string) =>
  email ? `by email at ${email}` : `through the "Contact us" form on this website (choose "${label}")`
const who = `${L.tradingName}, a division of ${L.entity} (registration number ${L.registration})`
const address = L.streetAddress ? `${L.streetAddress}` : L.city

export type LegalBlock = string | { list: string[] } | { note: string }
export type LegalSection = { id: string; heading: string; body: LegalBlock[] }
export type LegalDoc = { slug: string; title: string; short: string; summary: string[]; sections: LegalSection[] }

export const legalDocs: LegalDoc[] = [
  // ───────────────────────────── TERMS OF USE ─────────────────────────────
  {
    slug: 'terms',
    title: 'Terms of Use',
    short: 'Terms of Use',
    summary: [
      'These terms apply whenever you use the Connectra website, app or online account.',
      'Ordering a service creates a separate agreement, governed by our Service Terms and your order details.',
      'Your consumer rights under South African law, including the CPA and ECTA, are not limited by these terms.',
      'Prices are in South African Rand and include VAT unless stated otherwise.',
    ],
    sections: [
      { id: 'about', heading: '1. About these terms', body: [
        `This website, the Connectra app and the "My Connectra" online account (together, the "Platform") are operated by ${who} ("Connectra", "we", "us" or "our"). Our head office is in ${address}.`,
        'These Terms of Use ("Terms") govern your access to and use of the Platform. By browsing the Platform, creating an account or placing an order, you agree to these Terms. If you do not agree, please do not use the Platform.',
        'These Terms must be read together with our Privacy Policy, Cookie Policy, Acceptable Use Policy, Refund & Cancellation Policy and Service Terms, which form part of these Terms.',
      ] },
      { id: 'definitions', heading: '2. Definitions', body: [
        { list: [
          '"Consumer" has the meaning given in the Consumer Protection Act 68 of 2008 ("CPA").',
          '"Services" means the mobile, home internet (fibre, LTE and 5G), Voice over Internet (VoIP), business voice and related services we offer.',
          '"Device" means a handset, router, adapter or other equipment supplied by us.',
          '"Order" means a request to buy a Service or Device placed through the Platform.',
          '"Business day" means any day other than a Saturday, Sunday or South African public holiday.',
        ] },
      ] },
      { id: 'eligibility', heading: '3. Who may use the Platform', body: [
        'You must be 18 years or older, or be assisted by a parent or legal guardian, to create an account or place an Order.',
        'If you act on behalf of a business, you confirm that you are authorised to bind that business to these Terms.',
        'Some Services require identity verification under the Regulation of Interception of Communications and Provision of Communication-related Information Act 70 of 2002 ("RICA"), and a credit or affordability check. We may decline an Order if verification cannot be completed.',
      ] },
      { id: 'account', heading: '4. Your account', body: [
        'You are responsible for keeping your login details confidential and for all activity on your account. Tell us immediately if you suspect unauthorised use.',
        'You must give accurate, current and complete information and keep it up to date.',
        'We may suspend or close an account that is used fraudulently, in breach of these Terms, or as required by law. Where reasonable, we will give you notice and an opportunity to remedy the problem first.',
      ] },
      { id: 'orders', heading: '5. Orders, pricing and payment', body: [
        'All prices are shown in South African Rand (ZAR) and include Value-Added Tax (VAT) at the prevailing rate, unless clearly stated otherwise.',
        'Before you place an Order, we show you the full price, any once-off or upfront amount, the contract term, delivery or activation charges, and the main characteristics of the Service or Device, as required by section 43 of the Electronic Communications and Transactions Act 25 of 2002 ("ECTA").',
        'An Order is an offer to buy. A binding agreement is formed when we confirm acceptance of your Order by email, SMS or in your account. We may decline an Order, for example if verification fails, stock is unavailable or a price was displayed in obvious error. If we decline after taking payment, we refund you in full.',
        'Payments are processed by third-party payment service providers. We do not store full card numbers on our systems.',
        'Monthly charges are billed in advance and usage-based charges in arrears, unless your plan says otherwise. If a payment fails, we may suspend Services after giving you notice, as described in the Service Terms.',
      ] },
      { id: 'availability', heading: '6. Coverage and availability', body: [
        'Coverage maps, coverage checks and speed estimates on the Platform are indicative only. Actual coverage and speeds depend on location, network conditions, building materials, weather, the Device used and the number of users.',
        'Fibre, LTE, 5G and VoIP availability is confirmed only once your installation or activation is complete. If a Service turns out not to be available at your address, you may cancel without penalty and we will refund amounts paid for that Service.',
      ] },
      { id: 'ip', heading: '7. Intellectual property', body: [
        'The Platform and its content, including text, graphics, logos, designs, software and the Connectra name, are owned by or licensed to us and are protected by intellectual property laws.',
        'You may view and print content for personal, non-commercial use. You may not copy, modify, distribute, sell or create derivative works from the Platform without our written permission.',
      ] },
      { id: 'conduct', heading: '8. Acceptable use of the Platform', body: [
        'You may not use the Platform unlawfully, interfere with its security or operation, attempt to gain unauthorised access, scrape it with automated tools, or upload malicious code. Use of the Services is also subject to our Acceptable Use Policy.',
      ] },
      { id: 'third', heading: '9. Third-party links and services', body: [
        'The Platform may link to third-party websites or services, such as payment gateways or app stores. We are not responsible for their content or practices, and your use of them is subject to their own terms.',
      ] },
      { id: 'liability', heading: '10. Limitation of liability', body: [
        'We take reasonable care to keep the Platform accurate, secure and available, but we cannot guarantee that it will always be error-free or uninterrupted.',
        'To the extent permitted by law, we are not liable for indirect, special or consequential loss, or for loss caused by events beyond our reasonable control (including load-shedding, natural disasters, vandalism, cable theft or failures of third-party networks).',
        'Nothing in these Terms limits or excludes any right you have, or any liability we have, that cannot lawfully be limited or excluded, including your rights under the CPA and ECTA, or liability for gross negligence or wilful misconduct.',
      ] },
      { id: 'indemnity', heading: '11. Your responsibility', body: [
        'If you use the Platform or Services in breach of these Terms or the law, you are responsible for the loss or damage that this reasonably causes us, to the extent permitted by the CPA.',
      ] },
      { id: 'changes', heading: '12. Changes to these Terms', body: [
        'We may update these Terms from time to time, for example to reflect changes in law or in our Services. The "Effective date" at the top shows when they were last changed. We will give you reasonable notice of material changes. Changes do not affect Orders already accepted, unless required by law.',
      ] },
      { id: 'law', heading: '13. Governing law and disputes', body: [
        'These Terms are governed by the laws of the Republic of South Africa.',
        'If you have a complaint, please follow our Complaints & Disputes procedure first. This does not prevent you from approaching ICASA, the National Consumer Commission, the Information Regulator or a court with jurisdiction.',
      ] },
      { id: 'general', heading: '14. General', body: [
        'If any provision of these Terms is found to be invalid or unenforceable, the rest remains in force. Our failure to enforce a right does not waive it. You may not transfer your rights under these Terms without our consent.',
        { note: `Statutory information (ECTA section 43): ${who}. Head office: ${address}. ${L.icasaLicence ? `Licence: ${L.icasaLicence}.` : 'Licence details are available on request.'} Contact: ${L.supportEmail ?? 'the "Contact us" form on this website'}${L.phone ? `, ${L.phone}` : ''}.` },
      ] },
    ],
  },

  // ───────────────────────────── PRIVACY POLICY ─────────────────────────────
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    short: 'Privacy Policy',
    summary: [
      'We process your personal information in line with the Protection of Personal Information Act 4 of 2013 (POPIA).',
      'We collect only what we need to provide, bill and support your services, meet legal duties (such as RICA) and keep the network secure.',
      'We do not sell your personal information. We send direct marketing only with your consent or as POPIA allows, and you can opt out at any time.',
      'You can ask to see, correct or delete your information, and you may complain to the Information Regulator.',
    ],
    sections: [
      { id: 'who', heading: '1. Who we are', body: [
        `${who} is the "responsible party" for personal information processed through the Platform and in providing the Services. Our head office is in ${address}.`,
        `Our Information Officer is ${L.informationOfficer ?? 'the Information Officer of VINK Group (Pty) Ltd'}, who can be contacted ${contactLine(L.privacyEmail, 'Privacy')}.`,
      ] },
      { id: 'collect', heading: '2. Personal information we collect', body: [
        { list: [
          'Identity and contact details: name, ID or passport number, date of birth, email address, mobile number, physical and postal address.',
          'RICA information: identity document and proof of residential address, as required by law for SIM cards and certain services.',
          'Account and order information: plans, Devices, order history, preferences and communications with us.',
          'Payment and credit information: billing details, the last four digits of payment cards, debit order details, payment history and, with your consent, credit bureau information.',
          'Service and usage information: call, SMS and data records (such as numbers called, time, duration and volume), connection logs, IP addresses, Device identifiers (such as IMEI) and approximate location needed to route communications.',
          'VoIP information: numbers you port to us, call detail records, voicemail and, where you enable it on Cloud PBX, call recordings.',
          'Website and app information: browser type, pages visited and information stored in cookies or local storage (see our Cookie Policy).',
          'Support information: messages, tickets, call recordings with our support team (we tell you when a call is recorded) and feedback.',
        ] },
        'We do not intentionally collect special personal information (such as health or biometric data) unless needed for a specific service and permitted by POPIA, for example accessibility support you ask for.',
      ] },
      { id: 'how', heading: '3. How we collect it', body: [
        'Directly from you when you order, register, contact us or use the Services; automatically from our network and systems when you use the Services and the Platform; and from third parties such as credit bureaus, fraud-prevention databases, number-portability systems, payment providers and network partners, where lawful.',
      ] },
      { id: 'why', heading: '4. Why we use it (purpose and lawful basis)', body: [
        { list: [
          'To conclude and perform our agreement with you: activating, delivering, installing, billing and supporting Services and Devices (contract).',
          'To meet legal obligations: RICA verification, record keeping under the Electronic Communications Act 36 of 2005 and tax laws, emergency services, lawful interception directions and court orders (legal obligation).',
          'To protect you and our network: detecting fraud, SIM-swap fraud and abuse, and maintaining security (legitimate interest).',
          'To assess affordability and credit risk for contracts that include Devices or credit, with your consent (consent / legal obligation under the National Credit Act where applicable).',
          'To improve our Services, Platform and network performance, using aggregated or de-identified data where possible (legitimate interest).',
          'To send service notices, such as usage notifications, billing and outage messages (contract / legal obligation).',
          'To send direct marketing about our products, with your consent or, for existing customers, about similar products with an easy opt-out, as allowed by section 69 of POPIA.',
        ] },
      ] },
      { id: 'share', heading: '5. Who we share it with', body: [
        'We share personal information only where necessary and lawful, with:',
        { list: [
          'Network operators, wholesale and infrastructure partners that carry or terminate your communications.',
          'Payment service providers, banks and debt-collection agents (for overdue accounts, after notice).',
          'Credit bureaus and fraud-prevention bodies, where permitted.',
          'Couriers and installers who deliver Devices or install services.',
          'IT, cloud hosting, messaging and customer-support service providers acting as our operators under written agreements.',
          'Other companies in the VINK Group, where needed for shared services and subject to the same protections.',
          'Regulators, law-enforcement agencies and courts, where required by law (for example under RICA, the Cybercrimes Act 19 of 2020 or a court order).',
          'A buyer or successor if all or part of our business is sold or restructured.',
        ] },
        'We do not sell your personal information.',
      ] },
      { id: 'transfer', heading: '6. Cross-border transfers', body: [
        'Some service providers (for example cloud hosting) may store information outside South Africa. We transfer personal information across borders only as permitted by section 72 of POPIA, for example where the recipient is subject to laws or binding agreements that provide an adequate level of protection.',
      ] },
      { id: 'security', heading: '7. How we protect it', body: [
        'We take appropriate, reasonable technical and organisational measures to protect personal information, including encryption in transit, access controls, password hashing, monitoring and staff training. We do not store full payment card numbers.',
        'If we have reasonable grounds to believe your personal information has been accessed by an unauthorised person, we will notify you and the Information Regulator as required by section 22 of POPIA.',
      ] },
      { id: 'retention', heading: '8. How long we keep it', body: [
        'We keep personal information only for as long as needed for the purposes above or as required by law. For example, communication-related information must be kept for periods prescribed under RICA, and financial records for at least five years under tax and companies legislation. After that, we delete, destroy or de-identify it.',
      ] },
      { id: 'rights', heading: '9. Your rights', body: [
        'Under POPIA you have the right to:',
        { list: [
          'be told when your personal information is collected and how it is used;',
          'ask whether we hold your personal information and request access to it (see our PAIA & Access to Information page);',
          'ask us to correct, update, delete or destroy inaccurate, irrelevant, excessive, out-of-date or unlawfully obtained information;',
          'object to processing based on legitimate interest, and to direct marketing at any time;',
          'withdraw consent you have given (this does not affect processing that took place before withdrawal);',
          'not be subject to a decision based solely on automated processing that has legal consequences for you, except as POPIA allows;',
          'lodge a complaint with the Information Regulator.',
        ] },
        `To exercise these rights, contact our Information Officer ${contactLine(L.privacyEmail, 'Privacy')}. We may need to verify your identity first.`,
      ] },
      { id: 'marketing', heading: '10. Direct marketing', body: [
        'You can opt out of marketing messages at any time by using the unsubscribe link in emails, replying STOP to SMS, changing your preferences in My Connectra or contacting us. Opting out does not stop service and billing messages.',
      ] },
      { id: 'children', heading: '11. Children', body: [
        'Our Services are not directed at children. Where a parent or guardian adds a child as a user (for example a child SIM), we process the child\'s information only with the consent of the competent person, as POPIA requires.',
      ] },
      { id: 'regulator', heading: '12. Information Regulator', body: [
        'If you are not satisfied with how we handle your personal information, you may complain to the Information Regulator (South Africa). Its current contact details are published on its official website, inforegulator.org.za.',
      ] },
      { id: 'changes', heading: '13. Changes to this policy', body: [
        'We may update this Privacy Policy. The effective date shows the latest version, and we will tell you about material changes.',
      ] },
    ],
  },

  // ───────────────────────────── REFUND & CANCELLATION ─────────────────────────────
  {
    slug: 'refunds',
    title: 'Refund & Cancellation Policy',
    short: 'Refunds & Cancellation',
    summary: [
      'Bought online? You can usually cancel within 7 days without reason or penalty (ECTA cooling-off), and we refund within 30 days.',
      'Fixed-term contracts can be cancelled at any time with 20 business days\' notice, subject only to a reasonable cancellation penalty (CPA section 14).',
      'Month-to-month services (including fibre and VoIP plans) can be cancelled with one calendar month\'s notice, with no penalty.',
      'Defective Devices are covered by the CPA\'s six-month implied warranty: repair, replacement or refund.',
    ],
    sections: [
      { id: 'scope', heading: '1. Scope', body: [
        `This policy explains how you can cancel Services and return Devices bought from ${who}, and how refunds work. It does not limit any right you have under the CPA, ECTA or other law.`,
      ] },
      { id: 'cooling', heading: '2. Cooling-off period for online orders', body: [
        'If you are a consumer and bought a Service or Device through our website or app, you may cancel the transaction, and any related credit agreement, without reason and without penalty in terms of section 44 of ECTA:',
        { list: [
          'for Devices, within 7 days after the date you receive them; and',
          'for Services, within 7 days after the date the agreement was concluded.',
        ] },
        'If you have paid, we refund you in full within 30 days of the date of cancellation. The only charge you may bear is the direct cost of returning a Device to us.',
        'Under ECTA, the cooling-off right does not apply to services that began with your consent before the end of the 7-day period. If you ask us to activate a SIM, fibre or VoIP line within the cooling-off period, we charge only for the service actually used up to cancellation (for example pro-rata monthly fees and usage).',
        'Devices must be returned complete, in their original packaging, unused or in the condition received (apart from inspection), with all accessories. Where a Device has been used beyond inspection or damaged, we may deduct a reasonable amount for the reduced value, as permitted by law.',
        { note: 'Orders resulting from direct marketing (for example a sales call you did not initiate) may also be cancelled within 5 business days under section 16 of the CPA, where section 44 of ECTA does not apply. We refund within 15 business days.' },
      ] },
      { id: 'fixed', heading: '3. Fixed-term contracts (for example 24- or 36-month device contracts)', body: [
        'Fixed-term agreements are offered for a maximum of 24 months unless you expressly agree to a longer term and we can show a demonstrable financial benefit to you, as required by section 14 of the CPA and its regulations. Where we offer a 36-month option, we also offer a 24-month option.',
        { list: [
          'You may cancel at any time by giving 20 business days\' notice in writing or another recorded form.',
          'On cancellation before the end of the term, you remain liable for amounts owed up to the date of cancellation, and we may charge a reasonable cancellation penalty that takes into account the factors in regulation 5 of the CPA regulations, including the remaining term, the value of any Device you keep, the length of notice and the discounts you received.',
          'Where a Device was subsidised, the penalty will not exceed the outstanding Device balance plus a reasonable portion of the remaining service fees. We will give you a written breakdown before you confirm cancellation.',
          'Between 40 and 80 business days before your fixed term ends, we will notify you of the expiry date and of your options. If you do not cancel or renew, your agreement continues month to month on the then-current terms.',
        ] },
      ] },
      { id: 'monthly', heading: '4. Month-to-month services', body: [
        'Month-to-month Services, including our fibre plans and Connectra Voice (VoIP) plans, may be cancelled at any time with one calendar month\'s notice, without a cancellation penalty. Monthly fees are payable until the end of the notice period. Rented equipment (such as a router or VoIP adapter, where not bought) must be returned within 14 days, or its replacement value may be charged.',
        'If you are porting your number away from us, cancellation is processed when the port completes.',
      ] },
      { id: 'prepaid', heading: '5. Prepaid airtime, data and bundles', body: [
        'Prepaid airtime and bundles are not refundable for change of mind once loaded, except where required by law. Unused data and other bundles are dealt with in line with ICASA\'s End-User and Subscriber Service Charter Regulations, including any applicable rollover and transfer rights.',
        'If a bundle is loaded in error or a top-up fails, contact us within 30 days and we will investigate and correct it.',
      ] },
      { id: 'defective', heading: '6. Defective Devices and warranty', body: [
        'Under sections 55 and 56 of the CPA, Devices must be of good quality and fit for purpose. If a Device has a defect within six months of delivery, you may return it and choose repair, replacement or a refund, unless the defect was caused by misuse, accidental damage or unauthorised repairs.',
        'If a repaired Device develops the same or a further defect within three months of the repair, we will replace it or refund you.',
        'Manufacturer warranties beyond six months are honoured through the manufacturer\'s authorised service centres; we will help you log the claim.',
        'Report a faulty Device within 6 months through the "Contact us" form or in My Connectra. We may ask you to bring or send the Device for assessment.',
      ] },
      { id: 'service', heading: '7. Service failures and billing errors', body: [
        'If you were billed incorrectly, we will correct the error and credit or refund the overcharged amount within 30 days of confirming it.',
        'If a Service is unavailable for a prolonged period because of a fault on our side, you may be entitled to a pro-rata credit, as described in the Service Terms.',
      ] },
      { id: 'how', heading: '8. How to cancel or request a refund', body: [
        { list: [
          `Contact us ${contactLine(L.supportEmail, 'Billing & payments')}, or log in to My Connectra.`,
          'Give your name, account or order number (for example CN-AB12CD), the Service or Device and the reason (optional for cooling-off).',
          'We will acknowledge your request within 2 business days and give you a reference number.',
          'For Device returns, we will arrange collection or give you return instructions.',
        ] },
      ] },
      { id: 'payment', heading: '9. How refunds are paid', body: [
        'Refunds are paid to the original payment method. Card refunds may take a few additional business days to reflect, depending on your bank. We never charge a fee to process a refund you are legally entitled to.',
      ] },
    ],
  },

  // ───────────────────────────── SERVICE TERMS ─────────────────────────────
  {
    slug: 'service-terms',
    title: 'Service Terms',
    short: 'Service Terms',
    summary: [
      'These terms apply to every Connectra service, with extra terms for mobile, home internet and VoIP.',
      'You will receive usage notifications at 50%, 80% and 100% of your bundles, and we will not charge out-of-bundle rates unless you opt in.',
      'VoIP depends on power and internet: keep a mobile phone available for emergency calls to 112 or 10111.',
      'Speeds and coverage are best-effort and depend on your location and network conditions.',
    ],
    sections: [
      { id: 'general', heading: '1. General terms for all Services', body: [
        `These Service Terms form part of your agreement with ${who} for any Service. Your order confirmation sets out your plan, price, term and any Device. If there is a conflict, your order confirmation applies first, then these Service Terms, then the Terms of Use.`,
        'We provide the Services with reasonable skill and care, in line with the Electronic Communications Act 36 of 2005 and ICASA regulations, including the End-User and Subscriber Service Charter Regulations.',
        'Activation requires successful RICA registration and, where applicable, a credit or affordability check.',
      ] },
      { id: 'billing', heading: '2. Billing and payment', body: [
        { list: [
          'Your bill shows the billing period, your plan charges, once-off charges, usage outside your bundle and VAT. Bills are available in My Connectra and by email.',
          'Payment is by debit order, card or other methods we make available. Payment is due on the date shown on your bill.',
          'If payment is not received, we will send you a reminder. If it remains unpaid 14 days after the reminder, we may restrict or suspend the Service after further notice. We may charge a reasonable reconnection fee and interest on overdue amounts as allowed by law.',
          'If you dispute a charge, tell us within 90 days of the bill date. You need not pay the disputed portion while we investigate, but undisputed amounts remain payable.',
          'We may change prices on month-to-month Services with at least 30 days\' notice; you may cancel without penalty before the change takes effect. Prices on fixed-term contracts change only as stated in your agreement.',
        ] },
      ] },
      { id: 'usage', heading: '3. Usage notifications and out-of-bundle charges', body: [
        'As required by ICASA, we send usage notifications by SMS, push notification or another suitable means when your voice, SMS and data bundles reach 50%, 80% and 100% depletion. You can opt out of these notifications.',
        'When a bundle is depleted, we do not charge you out-of-bundle rates unless you have opted in. You can change this choice at any time in My Connectra.',
        'Where you hold more than one bundle, the bundle that expires first is used first. Unused data may be rolled over or transferred in line with ICASA\'s regulations and your plan terms.',
      ] },
      { id: 'mobile', heading: '4. Mobile services (contracts and SIM-only)', body: [
        { list: [
          'Your SIM and number are for use in a mobile handset or approved device. You may not use them in SIM boxes or to resell services without our written consent.',
          '"Unlimited" plans are subject to our Acceptable Use Policy. To protect the network for all users, unusually heavy use may be managed (for example reduced speeds) after a fair-usage threshold, which we disclose with the plan.',
          'Device contracts: ownership of a Device passes to you once it is fully paid. Until then, you must not sell or encumber it. Report loss or theft immediately so that we can block the SIM and Device (IMEI).',
          'Roaming and international calls are charged at the rates published at the time of use. Roaming is off by default on new contracts until you activate it.',
          'You may port your number to another provider at any time, in line with ICASA\'s Number Portability Regulations; this does not remove your obligations under a fixed-term contract.',
        ] },
      ] },
      { id: 'internet', heading: '5. Home internet (fibre, LTE and 5G)', body: [
        { list: [
          'Speeds are "up to" speeds and are best-effort. Actual speeds depend on the infrastructure at your address, Wi-Fi conditions, your devices and network demand.',
          'Fibre installation requires access to your premises and, where applicable, permission from the property owner or body corporate. Installation work is done by our approved installers or the fibre network operator.',
          'The Wi-Fi 6 router supplied with a plan is either sold to you or loaned (as stated on your order). Loaned equipment must be returned when the Service ends.',
          'Unlimited means no data cap; our Acceptable Use Policy and traffic management for network protection still apply.',
          'Fault reports are logged 24/7. We aim to restore residential fibre faults within the target times published by the relevant fibre network operator.',
        ] },
      ] },
      { id: 'voip', heading: '6. Connectra Voice (VoIP) and Cloud PBX', body: [
        { list: [
          'VoIP calls are carried over an internet connection and need working power and internet. During a power failure, load-shedding (unless your equipment is on backup power) or an internet outage, VoIP may not work.',
          'Emergency calls: VoIP may not support calls to emergency numbers in all circumstances, and the location of a VoIP caller may not be automatically available to emergency services. Always keep a mobile phone available to call 112 or 10111 in an emergency.',
          'Geographic numbers (for example 021 or 011) are assigned for use in the related area. You must give us your correct service address and update it if it changes.',
          'Number porting: when you port a number to us, you authorise us to request the port from your current provider. Porting usually takes 3 to 5 business days. Your obligations to your current provider remain your responsibility.',
          'Call recording on Cloud PBX is a feature you control. You are responsible for informing the people you record and for complying with RICA and POPIA when you use it.',
          'Calls are billed per second at the published rates. Free calls between Connectra numbers apply only to calls within the Connectra network.',
          'Fraud protection: you are responsible for keeping your VoIP credentials and PBX settings secure. We may block international calling or suspend a line if we detect suspicious activity, and will contact you as soon as possible.',
        ] },
      ] },
      { id: 'quality', heading: '7. Service quality, maintenance and outages', body: [
        'We may carry out planned maintenance and will give reasonable notice where it is expected to affect Services. We will tell you about major unplanned outages through our status channels.',
        'If a Service is unavailable for more than 72 consecutive hours because of a fault within our control, you may request a pro-rata credit of your monthly fee for the affected period.',
        'We are not responsible for interruptions caused by events beyond our reasonable control, including load-shedding, natural disasters, vandalism, cable or battery theft, or third-party network failures. We will work to restore Services as soon as reasonably possible.',
      ] },
      { id: 'suspension', heading: '8. Suspension and termination by us', body: [
        'We may suspend or terminate a Service if you materially breach your agreement and do not remedy the breach within 20 business days after written notice, as allowed by section 14 of the CPA, or immediately where required by law, to prevent fraud, or to protect the network or other users.',
      ] },
      { id: 'disability', heading: '9. Accessibility', body: [
        'We are committed to making our Services and support accessible to persons with disabilities, in line with ICASA\'s Code of Conduct for Persons with Disabilities. Tell us if you need information in an accessible format or other assistance.',
      ] },
    ],
  },

  // ───────────────────────────── ACCEPTABLE USE ─────────────────────────────
  {
    slug: 'acceptable-use',
    title: 'Acceptable Use Policy',
    short: 'Acceptable Use',
    summary: [
      'Use Connectra services lawfully and in a way that does not harm others or the network.',
      'Spam, fraud, hacking, SIM boxing and illegal content are not allowed.',
      'We may manage traffic fairly to keep the network working well for everyone.',
    ],
    sections: [
      { id: 'purpose', heading: '1. Purpose', body: [
        `This Acceptable Use Policy ("AUP") applies to everyone who uses Services provided by ${who}. It protects our customers, our network and the wider internet.`,
      ] },
      { id: 'prohibited', heading: '2. Prohibited use', body: [
        'You may not use the Services to:',
        { list: [
          'break any law, including the Cybercrimes Act 19 of 2020, the Films and Publications Act 65 of 1996, POPIA and RICA;',
          'send unsolicited bulk messages (spam), or make automated or nuisance calls, including in breach of section 69 of POPIA or the CPA\'s direct-marketing rules;',
          'commit fraud, phishing, identity theft or SIM-swap fraud, or spoof caller ID or email headers;',
          'access, probe or interfere with any system, network or account without authorisation, or distribute malware;',
          'launch denial-of-service attacks or deliberately disrupt any network;',
          'operate SIM boxes, grey routes or call-termination bypass, or resell Services without our written consent;',
          'store, transmit or publish child sexual abuse material, content that incites violence or hatred, or content that infringes intellectual property rights;',
          'harass, threaten or defame any person.',
        ] },
      ] },
      { id: 'fair', heading: '3. Fair use and traffic management', body: [
        '"Unlimited" Services are intended for normal personal or business use. To protect service quality for all users, we may apply reasonable, transparent traffic management during peak periods or to unusually heavy users, and will disclose applicable thresholds with the plan.',
      ] },
      { id: 'security', heading: '4. Security of your devices', body: [
        'You must take reasonable steps to secure your devices, routers, VoIP equipment and accounts, including changing default passwords. You are responsible for use of the Services through your equipment and credentials.',
      ] },
      { id: 'report', heading: '5. Reporting abuse', body: [
        `Report abuse, spam or security issues ${contactLine(L.supportEmail, 'Safety & security')}. We co-operate with law-enforcement agencies as required by law.`,
      ] },
      { id: 'enforce', heading: '6. Enforcement', body: [
        'If you breach this AUP, we may warn you, restrict or suspend the affected Service, or terminate your agreement in accordance with our Service Terms and the law. Where a breach is serious or unlawful, we may act immediately and may report it to the authorities.',
      ] },
    ],
  },

  // ───────────────────────────── COOKIE POLICY ─────────────────────────────
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    short: 'Cookie Policy',
    summary: [
      'We currently use only essential and functional storage that the site needs to work.',
      'We do not use advertising or cross-site tracking cookies.',
      'If we introduce analytics or marketing cookies, we will ask for your consent first.',
    ],
    sections: [
      { id: 'what', heading: '1. What cookies and local storage are', body: [
        'Cookies and browser "local storage" are small pieces of information saved on your device by a website. They let the site remember things such as your login session or the items in your cart.',
      ] },
      { id: 'use', heading: '2. What we use', body: [
        { list: [
          'Sign-in session (essential): keeps you logged in to My Connectra after you sign in. Removed when you log out.',
          'Shopping cart (essential): remembers the plan or Device you selected while you complete checkout. Cleared when you close the browser tab.',
          'Intro animation (functional): remembers that you have already seen the opening animation in this browser session.',
          'Security (essential): our hosting and payment providers may set cookies needed to protect against fraud and abuse.',
        ] },
        'We do not currently use analytics, advertising or social-media tracking cookies.',
      ] },
      { id: 'consent', heading: '3. Consent', body: [
        'Essential storage does not require consent because the site cannot work without it. If we introduce non-essential cookies (such as analytics), we will ask for your consent through a banner before setting them, and you will be able to change your choice at any time.',
      ] },
      { id: 'manage', heading: '4. Managing cookies', body: [
        'You can delete or block cookies and local storage in your browser settings. If you block essential storage, parts of the site (such as login and checkout) will not work.',
      ] },
    ],
  },

  // ───────────────────────────── COMPLAINTS ─────────────────────────────
  {
    slug: 'complaints',
    title: 'Complaints & Disputes',
    short: 'Complaints',
    summary: [
      'Tell us first: we acknowledge complaints within 2 business days and aim to resolve them within 14 days.',
      'If you are unhappy with our final response, you can escalate to ICASA free of charge.',
      'Privacy complaints can go to the Information Regulator; other consumer complaints to the National Consumer Commission.',
    ],
    sections: [
      { id: 'commitment', heading: '1. Our commitment', body: [
        `We want to resolve problems quickly and fairly. This procedure follows ICASA's Code of Conduct and End-User and Subscriber Service Charter Regulations.`,
      ] },
      { id: 'step1', heading: '2. Step 1: Contact us', body: [
        `Log your complaint ${contactLine(L.complaintsEmail ?? L.supportEmail, 'Account & app')}, through My Connectra, or by calling our support team${L.phone ? ` on ${L.phone}` : ''}. Please include your name, account or order number, a description of the problem and what outcome you would like.`,
        'We will give you a reference number and acknowledge your complaint within 2 business days.',
      ] },
      { id: 'step2', heading: '3. Step 2: Investigation and resolution', body: [
        'We aim to resolve complaints within 14 days. If a complaint is complex and needs more time, we will tell you why and keep you updated. You will receive a written outcome.',
        'If you are not satisfied, you may ask for your complaint to be escalated to a senior manager, who will review it and respond in writing.',
      ] },
      { id: 'step3', heading: '4. Step 3: External escalation', body: [
        'If your complaint is not resolved to your satisfaction, or within the required time, you may escalate it to:',
        { list: [
          'ICASA (Independent Communications Authority of South Africa), Consumer Complaints Unit: for complaints about electronic communications services, billing, coverage, number porting and service quality. Contact details are on icasa.org.za.',
          'The Information Regulator: for complaints about the processing of personal information (inforegulator.org.za).',
          'The National Consumer Commission: for other consumer complaints under the Consumer Protection Act (thencc.org.za).',
        ] },
        'Escalation to these bodies is free. You also retain your right to approach a court.',
      ] },
      { id: 'records', heading: '5. Records', body: [
        'We keep a record of complaints and their outcomes for at least three years so that we can learn from them and report to the regulator when asked.',
      ] },
    ],
  },

  // ───────────────────────────── PAIA / ACCESS TO INFORMATION ─────────────────────────────
  {
    slug: 'paia',
    title: 'PAIA & Access to Information',
    short: 'PAIA & POPIA access',
    summary: [
      'You can request records we hold under the Promotion of Access to Information Act 2 of 2000 (PAIA).',
      'You can request your own personal information free of charge, subject to identity verification.',
      `Requests go to the Information Officer of ${L.entity}.`,
    ],
    sections: [
      { id: 'manual', heading: '1. PAIA manual', body: [
        `${L.tradingName} is a division of ${L.entity}. Its PAIA manual, prepared in terms of section 51 of PAIA, describes the categories of records held and how to request access. The manual is available on request from the Information Officer and will be published on this page.`,
      ] },
      { id: 'officer', heading: '2. Information Officer', body: [
        { list: [
          `Information Officer: ${L.informationOfficer ?? 'Information Officer, VINK Group (Pty) Ltd'}`,
          `Address: ${address}`,
          `Contact: ${L.privacyEmail ?? 'the "Contact us" form on this website (choose "Safety & security")'}`,
        ] },
      ] },
      { id: 'request', heading: '3. How to make a request', body: [
        { list: [
          'Complete the prescribed request form (Form 2 under the PAIA regulations, available from the Information Regulator\'s website) and send it to the Information Officer.',
          'Provide proof of identity and, if you act for someone else, proof of your authority.',
          'A prescribed request fee may apply for records other than your own personal information. We will tell you about any fee before processing.',
          'We will respond within 30 days, which may be extended once by up to 30 days in the circumstances PAIA allows.',
        ] },
      ] },
      { id: 'own', heading: '4. Your own personal information', body: [
        'Under section 23 of POPIA you may ask whether we hold personal information about you and request a description of it, free of charge. A reasonable fee may apply for copies of records, which we will quote in advance.',
      ] },
      { id: 'refusal', heading: '5. Grounds for refusal', body: [
        'We may refuse access only on the grounds set out in PAIA, for example to protect the privacy of third parties, commercial information or the safety of individuals. If we refuse, we will give reasons. You may complain to the Information Regulator or apply to court.',
      ] },
    ],
  },
]

export const legalBySlug = Object.fromEntries(legalDocs.map(d => [d.slug, d])) as Record<string, LegalDoc>
