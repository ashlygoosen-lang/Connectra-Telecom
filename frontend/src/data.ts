import type { Phone, InternetPlan } from './api'

// Built-in copy of the catalogue so pages render instantly (and for crawlers);
// it is refreshed from the API on load.
export const fallbackPhones: Phone[] = [
  { slug: 'iphone-16-pro', name: 'iPhone 16 Pro', brand: 'Apple', data: '50GB', price: 38, upfront: 49, color: '#d9d6ce', accent: '#f2f0eb', badge: 'New', rating: 4.9, reviews: 128, lead: 'Built for Apple Intelligence. Featuring a stunning titanium design and the powerful A18 Pro chip.', colors: [{ name: 'Natural Titanium', hex: '#d9d6ce' }, { name: 'Black Titanium', hex: '#292b2d' }, { name: 'White Titanium', hex: '#f4f1e8' }], storage: [{ size: '128GB', add: -4 }, { size: '256GB', add: 0 }, { size: '512GB', add: 7 }], features: ['5G ready', 'eSIM'] },
  { slug: 'galaxy-s25', name: 'Galaxy S25', brand: 'Samsung', data: 'Unlimited', price: 32, upfront: 29, color: '#b8c8d9', accent: '#edf3f8', badge: 'Best seller', rating: 4.8, reviews: 96, lead: 'Galaxy AI in your pocket, with a brilliant 120Hz display and all-day battery.', colors: [{ name: 'Icy Blue', hex: '#b8c8d9' }, { name: 'Navy', hex: '#26324a' }, { name: 'Mint', hex: '#cfe6dc' }], storage: [{ size: '128GB', add: 0 }, { size: '256GB', add: 4 }], features: ['5G ready', 'eSIM', 'Dual SIM'] },
  { slug: 'pixel-9-pro', name: 'Pixel 9 Pro', brand: 'Google', data: '100GB', price: 29, upfront: 19, color: '#222b35', accent: '#e6efff', rating: 4.7, reviews: 74, lead: 'The best of Google AI with a pro-level camera system that makes every shot count.', colors: [{ name: 'Obsidian', hex: '#222b35' }, { name: 'Porcelain', hex: '#ece7df' }, { name: 'Rose Quartz', hex: '#efd3d0' }], storage: [{ size: '128GB', add: 0 }, { size: '256GB', add: 4 }, { size: '512GB', add: 9 }], features: ['5G ready', 'eSIM'] },
  { slug: 'galaxy-a56', name: 'Galaxy A56', brand: 'Samsung', data: '25GB', price: 21, upfront: 0, color: '#c5b9e6', accent: '#f1edfb', rating: 4.6, reviews: 211, lead: 'Awesome everyday performance, a bright display and a camera that loves low light.', colors: [{ name: 'Awesome Lilac', hex: '#c5b9e6' }, { name: 'Graphite', hex: '#33363b' }], storage: [{ size: '128GB', add: 0 }, { size: '256GB', add: 3 }], features: ['5G ready', 'Dual SIM'] },
  { slug: 'iphone-15', name: 'iPhone 15', brand: 'Apple', data: '50GB', price: 27, upfront: 19, color: '#d5e2da', accent: '#eff8f3', rating: 4.8, reviews: 302, lead: 'Dynamic Island, a 48MP main camera and USB-C — iPhone essentials, beautifully done.', colors: [{ name: 'Green', hex: '#d5e2da' }, { name: 'Black', hex: '#2a2c2e' }, { name: 'Pink', hex: '#f3dadf' }], storage: [{ size: '128GB', add: 0 }, { size: '256GB', add: 5 }], features: ['5G ready', 'eSIM'] },
  { slug: 'xiaomi-14t', name: 'Xiaomi 14T', brand: 'Xiaomi', data: '75GB', price: 24, upfront: 0, color: '#202124', accent: '#eef0f5', rating: 4.5, reviews: 58, lead: 'Leica-tuned optics, a flagship-grade chip and 120W HyperCharge.', colors: [{ name: 'Titan Black', hex: '#202124' }, { name: 'Titan Blue', hex: '#40597a' }], storage: [{ size: '256GB', add: 0 }, { size: '512GB', add: 5 }], features: ['5G ready', 'Dual SIM'] },
]

export const fallbackPlans: InternetPlan[] = [
  { id: 'fibre-start', name: 'Fibre Start', speed: '50 Mbps', mbps: 50, price: 24, note: 'Great for browsing' },
  { id: 'fibre-plus', name: 'Fibre Plus', speed: '200 Mbps', mbps: 200, price: 36, note: 'Perfect for families', popular: true },
  { id: 'fibre-max', name: 'Fibre Max', speed: '500 Mbps', mbps: 500, price: 49, note: 'Built for everything' },
]

export const faqs: [string, string][] = [
  ['Can I keep my current phone number?', 'Yes. Moving your number to Connectra is free and usually takes less than 10 minutes. We guide you through every step.'],
  ['How do I check coverage in my area?', 'Use our coverage checker with your address or postcode for live mobile and fibre availability.'],
  ['Are there any hidden fees?', 'Never. Your monthly price and any upfront cost are clearly shown before you check out.'],
  ['What happens when my contract ends?', 'We will contact you before it ends with simple options to upgrade, switch plan or continue month-to-month.'],
]

export const supportTopics = [
  { id: 'mobile', icon: 'phone', title: 'Mobile & SIM', text: 'Set up, activate or troubleshoot' },
  { id: 'internet', icon: 'wifi', title: 'Home internet', text: 'Wi-Fi, routers and connectivity' },
  { id: 'billing', icon: 'bill', title: 'Billing & payments', text: 'Understand and pay your bill' },
  { id: 'account', icon: 'user', title: 'Account & app', text: 'Manage your details and plan' },
  { id: 'security', icon: 'shield', title: 'Safety & security', text: 'Keep your account protected' },
  { id: 'orders', icon: 'help', title: 'Orders & delivery', text: 'Track or change an order' },
]
