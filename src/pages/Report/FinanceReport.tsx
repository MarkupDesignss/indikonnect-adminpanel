"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  ShieldAlert,
  Receipt,
  Wallet,
  Package,
  CreditCard,
  Truck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ExcelJS from "exceljs";
import financeReportApi, {
  FinanceReportItem,
} from "../../api/endpoints/report/financeReport";
import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";
/* ================= THEME ================= */
type ReportLanguage = "en" | "hi";
const LanguageContext = React.createContext<ReportLanguage>("en");
const HINDI: Record<string, string> = {
  "All available dates": "सभी उपलब्ध तारीखें",
  "Sales Classification": "बिक्री वर्गीकरण",
  "Sales Unregistered": "अपंजीकृत बिक्री",
  "Sales Registered": "पंजीकृत बिक्री",
  "Other Sales": "अन्य बिक्री",
  "Classification unavailable": "वर्गीकरण उपलब्ध नहीं",
  Registered: "पंजीकृत",
  "URP Sales": "URP बिक्री",
  "Invoice date": "बिल की तारीख",
  "Place Of Supply (POS)": "आपूर्ति का स्थान (POS)",
  Rate: "GST दर",
  "Taxable Value": "कर योग्य राशि",
  "Invoice Value": "इनवॉइस राशि",
  "GSTIN NO": "GSTIN नंबर",
  "Confirmed records are excluded from this report.":
    "पुष्टि वाले रिकॉर्ड इस रिपोर्ट में शामिल नहीं हैं।",
  "Order Reference": "ऑर्डर संदर्भ",
  "Item Reference ID": "आइटम संदर्भ आईडी",
  "Invoice Number": "बिल नंबर",
  "Invoice Date": "बिल की तारीख",
  "Order Date": "ऑर्डर की तारीख",
  "Product Name": "उत्पाद का नाम",
  "Product Head": "उत्पाद श्रेणी",
  "Product Category": "उत्पाद श्रेणी",
  "Product category": "उत्पाद श्रेणी",
  SKU: "SKU",
  Quantity: "मात्रा",
  Price: "कीमत",
  "Total Discount": "कुल छूट",
  CV: "CV",
  "Total Tax": "कुल टैक्स",
  CGST: "CGST",
  SGST: "SGST",
  IGST: "IGST",
  "Tax Percentage": "टैक्स दर (%)",
  "HSN Code": "HSN कोड",
  "Customer Name": "ग्राहक का नाम",
  "Distributor Name": "वितरक का नाम",
  "Distributor Email": "वितरक का ईमेल",
  "Distributor Mobile": "वितरक का मोबाइल",
  "Distributor GSTIN": "वितरक GSTIN",
  "Distributor State": "वितरक का राज्य",
  "Distributor / GSTIN": "वितरक / GSTIN",
  "Account Holder Name": "खाताधारक का नाम",
  "Account Holder Email": "खाताधारक का ईमेल",
  "Account Holder Mobile": "खाताधारक का मोबाइल",
  "Account Holder GSTIN": "खाताधारक GSTIN",
  "Account Holder State": "खाताधारक का राज्य",
  "Account Holder / GSTIN": "खाताधारक / GSTIN",
  "Account holder, invoice, product, GSTIN, courier…":
    "खाताधारक, बिल, उत्पाद, GSTIN, कूरियर…",
  "Customer GSTIN": "ग्राहक GSTIN",
  "Customer State": "ग्राहक का राज्य",
  "Shipping Charges": "डिलीवरी शुल्क",
  "Unit Price Without GST": "प्रति इकाई कीमत (बिना GST)",
  "Product Subtotal Without GST": "उत्पाद राशि (बिना GST)",
  "Product GST": "उत्पाद पर GST",
  "Shipping Charges Without GST": "डिलीवरी शुल्क (बिना GST)",
  "Sub Total": "टैक्स से पहले कुल राशि",
  "Shipping GST": "डिलीवरी पर GST",
  "Service Charge Per Unit": "प्रति इकाई सेवा शुल्क",
  "Total Service Charge": "कुल सेवा शुल्क",
  Total: "अंतिम राशि",
  "Order Status": "ऑर्डर की स्थिति",
  "Item Delivery Status": "आइटम की डिलीवरी स्थिति",
  "Confirmed At": "पुष्टि की तारीख और समय",
  "Dispatched At": "भेजने की तारीख और समय",
  "Delivered At": "डिलीवरी की तारीख और समय",
  "Account Type": "खाते का प्रकार",
  "User Name": "यूज़र नाम",
  "Customer Mobile": "ग्राहक का मोबाइल",
  "Customer Email": "ग्राहक का ईमेल",
  "Billing State": "बिलिंग राज्य",
  "Payment Gateway": "भुगतान माध्यम",
  "Gateway Transaction ID": "भुगतान लेनदेन आईडी",
  "Courier Company": "कूरियर कंपनी",
  "Courier Tracking Number": "कूरियर ट्रैकिंग नंबर",
  "GST Registration": "GST पंजीकरण",
  "GST Type": "GST का प्रकार",
  URP: "URP – अपंजीकृत",
  "Registered GSTIN": "पंजीकृत GSTIN",
  "Missing GSTIN": "GSTIN उपलब्ध नहीं",
  "Other / invalid GSTIN": "अन्य / अमान्य GSTIN",
  Unknown: "अज्ञात",
  "No GST": "GST नहीं",
  "Is exactly": "बिल्कुल समान",
  Contains: "इसमें शामिल है",
  "Is not": "समान नहीं है",
  "Is blank": "खाली है",
  "Is not blank": "खाली नहीं है",
  Equals: "बराबर",
  "On or after": "इस तारीख से या बाद में",
  "On or before": "इस तारीख तक",
  "At least": "कम से कम",
  "At most": "अधिकतम",
  Between: "के बीच",
  "Not assigned": "निर्धारित नहीं",
  "Tracking:": "ट्रैकिंग:",
  "SKU:": "SKU:",
  "Category:": "श्रेणी:",
  "HSN:": "HSN:",
  "GST:": "GST:",
  "Item Ref:": "आइटम संदर्भ:",
  "Access Denied": "प्रवेश की अनुमति नहीं",
  "You don't have permission to view the Finance Sales Report.":
    "आपको बिक्री रिपोर्ट देखने की अनुमति नहीं है।",
  Reports: "रिपोर्ट",
  "Finance Sales Report": "बिक्री और वित्तीय रिपोर्ट",
  "Product-wise sales and GST calculated from unit prices, quantities and tax rates.":
    "प्रति इकाई कीमत, मात्रा और टैक्स दर से गणना की गई उत्पादवार बिक्री और GST।",
  Refresh: "रीफ़्रेश करें",
  "Export CSV (": "CSV डाउनलोड (",
  "Export Excel": "Excel डाउनलोड",
  "Exporting...": "डाउनलोड तैयार हो रहा है...",
  "Search & filters": "खोज और फ़िल्टर",
  "Combine filters to download only the records you need.":
    "केवल ज़रूरी रिकॉर्ड डाउनलोड करने के लिए फ़िल्टर चुनें।",
  "Clear all": "सभी हटाएँ",
  "Search all fields": "सभी फ़ील्ड में खोजें",
  "Order date from": "ऑर्डर की शुरुआती तारीख",
  "Order date to": "ऑर्डर की अंतिम तारीख",
  All: "सभी",
  "Advanced field filters": "विस्तृत फ़िल्टर",
  active: "सक्रिय",
  "All conditions must match. Choose any report column. Use exact GSTIN, date ranges, amount ranges, blank values or text search. CV and discount filters use the available line value or order-level value.":
    "सभी शर्तें पूरी होनी चाहिए। किसी भी कॉलम को चुनें। GSTIN, तारीख, राशि, खाली फ़ील्ड या टेक्स्ट से खोजें। CV और छूट के लिए उपलब्ध आइटम या ऑर्डर की राशि उपयोग होती है।",
  Field: "फ़ील्ड",
  Condition: "शर्त",
  To: "तक",
  From: "से",
  Value: "मान",
  "Enter amount": "राशि दर्ज करें",
  "Enter or select value": "मान दर्ज करें या चुनें",
  "+ Add condition": "+ शर्त जोड़ें",
  "Apply filters": "फ़िल्टर लागू करें",
  "Search:": "खोज:",
  "Frontend-calculated amounts. Shipping GST uses the product rate when no separate rate is supplied. Unit price is treated as net of discounts; service charges are added without separate GST.":
    "राशि की गणना फ्रंटएंड पर होती है। अलग डिलीवरी GST दर न मिलने पर उत्पाद की दर ली जाती है। प्रति इकाई कीमत छूट के बाद की मानी गई है; सेवा शुल्क पर अलग GST नहीं जोड़ा गया है।",
  "Sales overview": "बिक्री का सारांश",
  "All matching records across pages · INR": "सभी पेज के मिलते रिकॉर्ड · रुपये",
  "Updating totals": "कुल राशि अपडेट हो रही है",
  "Totals unavailable · Retry": "कुल राशि उपलब्ध नहीं · फिर कोशिश करें",
  "product lines": "उत्पाद रिकॉर्ड",
  "Total Sales": "कुल बिक्री",
  "Total item amount · incl. GST": "कुल आइटम राशि · GST सहित",
  "Sales breakdown": "बिक्री का विवरण",
  "GST breakdown": "GST का विवरण",
  "Order activity": "ऑर्डर का विवरण",
  "Finance Reports": "वित्तीय रिपोर्ट",
  "Product-wise sales and GST details. Export includes all matching records.":
    "उत्पादवार बिक्री और GST विवरण। डाउनलोड में सभी मिलते रिकॉर्ड शामिल हैं।",
  "matching product lines": "मिलते उत्पाद रिकॉर्ड",
  "Loading finance report...": "वित्तीय रिपोर्ट लोड हो रही है...",
  "Could not load all report pages.": "सभी रिपोर्ट पेज लोड नहीं हो सके।",
  Retry: "फिर कोशिश करें",
  "Sales calculation unavailable: one or more records are missing quantity, taxable unit price, GST rate or shipping base.":
    "बिक्री की गणना उपलब्ध नहीं: किसी रिकॉर्ड में मात्रा, टैक्स योग्य कीमत, GST दर या डिलीवरी शुल्क नहीं है।",
  "No Finance Records Found": "कोई वित्तीय रिकॉर्ड नहीं मिला",
  "No records match the selected GST filter.":
    "चुने गए GST फ़िल्टर से कोई रिकॉर्ड नहीं मिला।",
  "Clear Filters": "फ़िल्टर हटाएँ",
  "Mobile:": "मोबाइल:",
  "GSTIN:": "GSTIN:",
  "State:": "राज्य:",
  Qty: "मात्रा",
  "Unit:": "प्रति इकाई:",
  "Line:": "उत्पाद राशि:",
  "Without GST": "बिना GST",
  "Product GST:": "उत्पाद GST:",
  "Service charge:": "सेवा शुल्क:",
  Order: "ऑर्डर",
  "Item delivery": "आइटम डिलीवरी",
  "Product Item": "उत्पाद",
  "Qty:": "मात्रा:",
  "Code:": "कोड:",
  "Product Total (excl. GST)": "उत्पाद राशि (बिना GST)",
  "Shipping (excl. GST)": "डिलीवरी (बिना GST)",
  "Unit Price (excl. GST)": "प्रति इकाई कीमत (बिना GST)",
  "GST Tax Breakdown": "GST टैक्स विवरण",
  "Product-line GST": "आइटम का GST",
  "Courier & Tracking": "कूरियर और ट्रैकिंग",
  "Item Total": "आइटम की कुल राशि",
  "Service Charge": "सेवा शुल्क",
  "Current page totals": "इस पेज का कुल",
  "visible product lines": "दिख रहे उत्पाद रिकॉर्ड",
  "Showing product lines": "दिखाए जा रहे उत्पाद रिकॉर्ड",
  of: "में से",
  "product rows on this page)": "उत्पाद रिकॉर्ड इस पेज पर)",
  Page: "पेज",
  "Report filters": "रिपोर्ट फ़िल्टर",
  "Customer, invoice, product, GSTIN, courier…":
    "ग्राहक, बिल, उत्पाद, GSTIN, कूरियर…",
  "Remove filter": "फ़िल्टर हटाएँ",
  "Active filters": "सक्रिय फ़िल्टर",
  "Financial summary": "वित्तीय सारांश",
  "Products + shipping, excl. GST": "उत्पाद + डिलीवरी, बिना GST",
  "Total GST": "कुल GST",
  "Product GST + shipping GST": "उत्पाद GST + डिलीवरी GST",
  "Including shipping GST": "डिलीवरी GST सहित",
  "Previous page": "पिछला पेज",
  "Next page": "अगला पेज",
  "Loading records…": "रिकॉर्ड लोड हो रहे हैं…",
  "Apply pending changes to enable download.":
    "डाउनलोड के लिए बाकी बदलाव लागू करें।",
  "Excel and CSV include these matching records across all pages.":
    "Excel और CSV में सभी पेज के मिलते रिकॉर्ड शामिल हैं।",
  "Product subtotal": "उत्पाद राशि",
  "Shipping excl. GST": "डिलीवरी (बिना GST)",
  "Sub Total (excl. GST)": "कुल राशि (बिना GST)",
  "Service charges": "सेवा शुल्क",
  Discount: "छूट",
  "Unique orders": "कुल अलग-अलग ऑर्डर",
  "Product quantity": "उत्पाद मात्रा",
  "Total CV": "कुल CV",
  "Invoice / Date": "बिल / तारीख",
  "Customer / GSTIN": "ग्राहक / GSTIN",
  "Product / GST %": "उत्पाद / GST %",
  "Qty / Unit Price": "मात्रा / प्रति इकाई कीमत",
  Shipping: "डिलीवरी",
  "Item Total / GST": "आइटम राशि / GST",
  "GST Breakdown": "GST का विवरण",
  Payment: "भुगतान",
  "Invoice No.": "बिल नंबर",
  "Sales Overview": "बिक्री सारांश",
  "Sales Data": "बिक्री विवरण",
  "INDIEKONNECT  /  SALES OVERVIEW": "INDIEKONNECT / बिक्री सारांश",
  "Any start date": "कोई भी शुरुआती तारीख",
  "Any end date": "कोई भी अंतिम तारीख",
  to: "से",
  "All amounts in INR (₹)": "सभी राशियाँ रुपये (₹) में",
  "Product amount + shipping = subtotal  •  Subtotal + GST + service charges = final amount":
    "उत्पाद राशि + डिलीवरी = टैक्स से पहले कुल • इसमें GST और सेवा शुल्क जोड़कर अंतिम राशि मिलती है।",
  "Applied filters:": "लागू फ़िल्टर:",
  "All matching records for the selected period. Full GST, payment and courier details are in Sales Data.":
    "चुनी गई अवधि के सभी मिलते रिकॉर्ड। GST, भुगतान और कूरियर का पूरा विवरण बिक्री विवरण टैब में है।",
  "GRAND TOTAL": "कुल योग",
  "GRAND TOTAL  ": "  VISIBLE ROWS|कुल योग | दिख रहे रिकॉर्ड",
  "INR • Frontend calculated": "रुपये • फ्रंटएंड गणना",
  "Calculation note: taxable unit price is treated as discount-adjusted. If shipping GST rate is absent, the product rate is used. No separate service GST is assumed.":
    "गणना नोट: प्रति इकाई कीमत छूट के बाद की मानी गई है। अलग डिलीवरी GST दर न मिलने पर उत्पाद की दर ली गई है। सेवा शुल्क पर अलग GST नहीं माना गया है।",
  "The report uses frontend calculations. Grand Total reflects the visible rows in this tab. Product categories are taken from the API; unavailable values remain blank.":
    "राशि की गणना फ्रंटएंड पर है। कुल योग इस टैब में दिख रहे रिकॉर्ड का है। उत्पाद श्रेणियाँ API से ली गई हैं; अनुपलब्ध मान खाली हैं।",
  "Unable to load all report pages. Please retry.":
    "सभी रिपोर्ट पेज लोड नहीं हो सके। फिर कोशिश करें।",
  "From date cannot be greater than To date":
    "शुरुआती तारीख अंतिम तारीख के बाद नहीं हो सकती।",
  "Complete each filter with a valid value or remove the incomplete filter.":
    "हर फ़िल्टर में सही मान भरें या अधूरा फ़िल्टर हटाएँ।",
  "You don't have permission to export this report.":
    "आपको रिपोर्ट डाउनलोड करने की अनुमति नहीं है।",
  "No finance records available to export":
    "डाउनलोड करने के लिए कोई रिकॉर्ड नहीं है।",
  "Sales Data exported successfully": "बिक्री रिपोर्ट डाउनलोड हो गई।",
  "Failed to export Sales Data": "बिक्री रिपोर्ट डाउनलोड नहीं हो सकी।",
  "Cannot calculate sales: quantity, taxable unit price, GST rate or shipping base is missing.":
    "बिक्री की गणना नहीं हो सकती: मात्रा, कीमत, GST दर या डिलीवरी शुल्क उपलब्ध नहीं है।",
  "matching product lines exported": "मिलते उत्पाद रिकॉर्ड डाउनलोड हुए",
  Language: "भाषा",
  "GRAND TOTAL  |  VISIBLE ROWS": "कुल योग | दिख रहे रिकॉर्ड",
  "Product Amount\n(before tax)": "उत्पाद राशि\n(बिना टैक्स)",
  "Shipping\n(before tax)": "डिलीवरी शुल्क\n(बिना टैक्स)",
  "Subtotal\n(before tax)": "कुल राशि\n(बिना टैक्स)",
  "GST\n(total tax)": "GST\n(कुल टैक्स)",
  "Service\nCharges": "सेवा शुल्क",
  "Final Amount\n(incl. tax)": "अंतिम राशि\n(टैक्स सहित)",
};
const VALUE_HI: Record<string, string> = {
  delivered: "डिलीवर हो गया",
  dispatched: "भेज दिया गया",
  shipped: "रास्ते में",
  confirmed: "पुष्टि हो गई",
  pending: "लंबित",
  processing: "प्रक्रिया में",
  cancelled: "रद्द",
  canceled: "रद्द",
  refunded: "रिफंड हुआ",
  returned: "वापस आया",
  completed: "पूरा",
  paid: "भुगतान हुआ",
  partial_delivered: "आंशिक डिलीवरी",
  partial_shipped: "आंशिक शिपिंग",
  partial_dispatched: "आंशिक रूप से भेजा गया",
  distributor: "वितरक",
  customer: "ग्राहक",
  punjab: "पंजाब",
  "uttar pradesh": "उत्तर प्रदेश",
  delhi: "दिल्ली",
  haryana: "हरियाणा",
  maharashtra: "महाराष्ट्र",
  rajasthan: "राजस्थान",
  gujarat: "गुजरात",
  bihar: "बिहार",
  "madhya pradesh": "मध्य प्रदेश",
  karnataka: "कर्नाटक",
  "tamil nadu": "तमिलनाडु",
  kerala: "केरल",
  telangana: "तेलंगाना",
  "andhra pradesh": "आंध्र प्रदेश",
  "west bengal": "पश्चिम बंगाल",
  odisha: "ओडिशा",
  assam: "असम",
  jharkhand: "झारखंड",
  chhattisgarh: "छत्तीसगढ़",
  uttarakhand: "उत्तराखंड",
  "himachal pradesh": "हिमाचल प्रदेश",
  goa: "गोवा",
  chandigarh: "चंडीगढ़",
  "jammu and kashmir": "जम्मू और कश्मीर",
  "all watches": "सभी घड़ियाँ",
  dinnerware: "खाने के बर्तन",
  collection: "कलेक्शन",
};
const translate = (language: ReportLanguage, label: string) =>
  language === "hi"
    ? Object.prototype.hasOwnProperty.call(HINDI, label)
      ? HINDI[label]
      : label
    : label;
// Keep the existing API field names and filter keys stable. Only display labels change.
type AccountLabelRole = "Customer" | "Distributor" | "Account Holder";
const getAccountLabelRole = (accountType: unknown): AccountLabelRole => {
  const type = String(accountType ?? "")
    .trim()
    .toLowerCase();
  if (type === "distributor") return "Distributor";
  if (type === "customer") return "Customer";
  return "Account Holder";
};
const getReportAccountLabelRole = (
  items: FinanceReportItem[],
): AccountLabelRole => {
  if (!items.length) return "Account Holder";
  const role = getAccountLabelRole(items[0].account_type);
  return items.every((item) => getAccountLabelRole(item.account_type) === role)
    ? role
    : "Account Holder";
};
const ACCOUNT_LABEL_FIELDS = new Set([
  "Customer Name",
  "Customer Email",
  "Customer Mobile",
  "Customer GSTIN",
  "Customer State",
  "Customer / GSTIN",
]);
const accountFieldLabel = (field: string, role: AccountLabelRole) =>
  ACCOUNT_LABEL_FIELDS.has(field) ? field.replace(/^Customer/, role) : field;
const localizeValue = (
  language: ReportLanguage,
  field: string,
  value: unknown,
): string => {
  const raw = value == null ? "" : String(value);
  if (language === "en") {
    if (field === "Account Type")
      return raw
        .trim()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
    return ["Order Status", "Item Delivery Status"].includes(field)
      ? raw.replace(/_/g, " ")
      : raw;
  }
  if (["GST Registration", "GST Type", "Sales Classification"].includes(field))
    return translate(language, raw);
  if (
    [
      "Order Status",
      "Item Delivery Status",
      "Account Type",
      "Customer State",
      "Billing State",
      "Product Head",
    ].includes(field)
  ) {
    const key = raw
      .trim()
      .toLowerCase()
      .replace(/ /g, field.includes("Status") ? "_" : " ");
    return Object.prototype.hasOwnProperty.call(VALUE_HI, key)
      ? VALUE_HI[key]
      : raw;
  }
  return raw;
};
const useReportLanguage = () => {
  const language = React.useContext(LanguageContext);
  return {
    language,
    t: (label: unknown) => translate(language, String(label ?? "")),
    localValue: (field: string, value: unknown) =>
      localizeValue(language, field, value),
  };
};
const THEME = {
  primary: "#2D6FE8",
  primaryDark: "#1E40AF",
  primarySoft: "#EAF3FF",
  background: "#F4F8FD",
  border: "#DCE6F2",
  green: "#15803D",
  greenSoft: "#DCFCE7",
  orange: "#C2410C",
  orangeSoft: "#FFEDD5",
  purple: "#6D28D9",
  purpleSoft: "#EDE9FE",
  red: "#C23B32",
  redSoft: "#FEE2E2",
};
const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";
const PER_PAGE = 100;
/* ================= API ITEM TYPES ================= */
type LineCourier = {
  courier_company?: string | null;
  courier_tracking_number?: string | null;
};
type FinanceReportLineItem = FinanceReportItem & {
  mrp?: number | string | null;
  line_list_price?: number | string | null;
  list_price?: number | string | null;
  article_status?: string | null;
  line_discount_amount?: number | string | null;
  line_cv?: number | string | null;
  cv?: number | string | null;
  line_tax_breakdown?: {
    cgst?: number | string | null;
    sgst?: number | string | null;
    igst?: number | string | null;
  } | null;
  order_reference?: string | null;
  item_delivery_status?: string | null;
  billing_state?: string | null;
  delivery_state?: string | null;
  customer_gstin?: string | null;
  product_name?: string | null;
  product_code?: string | null;
  product_slug?: string | null;
  hsn_code?: string | null;
  item_reference_id?: string | null;
  order_line_id?: string | number | null;
  quantity?: number | string | null;
  unit_price_without_gst?: number | string | null;
  line_total_without_gst?: number | string | null;
  line_tax_rate?: number | string | null;
  shipping_tax_rate?: number | string | null;
  line_shipping_tax_rate?: number | string | null;
  shipping_gst_rate?: number | string | null;
  tax_type?: string | null;
  gst_type?: string | null;
  supplier_state?: string | null;
  seller_state?: string | null;
  place_of_supply?: string | null;
  line_gst_amount?: number | string | null;
  line_shipping_charge_without_gst?: number | string | null;
  line_shipping_gst?: number | string | null;
  line_couriers?: LineCourier[] | null;
  confirmed_at?: string | null;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  courier_company?: string | null;
  courier_tracking_number?: string | null;
  is_refunded?: string | boolean | number | null;
  refunded_items?: number | string | null;
  product_subtotal?: number | string | null;
  shipping_charge_without_gst?: number | string | null;
  subtotal?: number | string | null;
  product_total_shipping_charge_without_gst?: number | string | null;
  service_charge_per_unit?: number | string | null;
  total_service_charge?: number | string | null;
  total_item_amount?: number | string | null;
  total_items?: number | string | null;
  product_gst?: number | string | null;
  shipping_gst?: number | string | null;
  total_gst?: number | string | null;
  discount_amount?: number | string | null;
  order_amount?: number | string | null;
  net_order_amount?: number | string | null;
  products?: Array<{
    name?: string | null;
    product_code?: string | null;
    hsn_code?: string | null;
    quantity?: number | string | null;
  }>;
  tax_breakdown?: {
    cgst?: number | string | null;
    sgst?: number | string | null;
    igst?: number | string | null;
  } | null;
};
const asLineItem = (item: FinanceReportItem): FinanceReportLineItem =>
  item as FinanceReportLineItem;
/* ================= HELPERS ================= */
const money = (value: number | string | null | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const numberValue = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const valueOrDash = (value: unknown) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
const trimmedValue = (value: unknown) =>
  typeof value === "string"
    ? value.trim()
    : value == null
      ? ""
      : String(value).trim();
const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  // API date formats: DD-MM-YYYY and DD-MM-YYYY HH:mm.
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})(.*)$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}${match[4] || ""}`;
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};
const formatDateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const getProductName = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (row.product_name?.trim()) return row.product_name.trim();
  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products
      .map(
        (product) =>
          product.name?.trim() || product.product_code?.trim() || "Product",
      )
      .join(" | ");
  }
  return item.product_names || "";
};
const getProductCode = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (row.product_code?.trim()) return row.product_code.trim();
  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products
      .map((product) => product.product_code?.trim() || "")
      .filter(Boolean)
      .join(" | ");
  }
  return "";
};
// HSN is a numeric classification code, not the SKU.
const isValidHsn = (value: string) => /^\d{4}(?:\d{2}){0,2}$/.test(value);
const getHsnCode = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  const directHsn = trimmedValue(row.hsn_code);
  if (directHsn && isValidHsn(directHsn)) return directHsn;
  if (Array.isArray(row.products) && row.products.length > 0) {
    const validHsnCodes = row.products
      .map((product) => trimmedValue(product.hsn_code))
      .filter((hsn) => Boolean(hsn) && isValidHsn(hsn));
    return validHsnCodes.join(" | ");
  }
  return "";
};
const getQuantity = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  if (
    row.quantity !== null &&
    row.quantity !== undefined &&
    row.quantity !== ""
  ) {
    return numberValue(row.quantity);
  }
  if (Array.isArray(row.products) && row.products.length > 0) {
    return row.products.reduce(
      (sum, product) => sum + numberValue(product.quantity),
      0,
    );
  }
  return 0;
};
const getCouriers = (item: FinanceReportItem): LineCourier[] => {
  const row = asLineItem(item);
  if (Array.isArray(row.line_couriers) && row.line_couriers.length > 0) {
    return row.line_couriers;
  }
  if (row.courier_company || row.courier_tracking_number) {
    return [
      {
        courier_company: row.courier_company,
        courier_tracking_number: row.courier_tracking_number,
      },
    ];
  }
  return [];
};
const getPlaceOfSupply = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return trimmedValue(row.delivery_state) || trimmedValue(row.billing_state);
};
const getGstinNumber = (item: FinanceReportItem) => {
  const gstin = trimmedValue(asLineItem(item).customer_gstin);
  return gstin || "—";
};
const getGstPercentage = (item: FinanceReportItem) => {
  const rate = asLineItem(item).line_tax_rate;
  if (rate === null || rate === undefined || rate === "") return "";
  return `${numberValue(rate)}%`;
};
/* All calculated financial fields use primitive inputs, not API totals.
 * Assumptions for the current API contract:
 * - unit_price_without_gst is the net taxable unit price (discount already reflected).
 * - line_shipping_charge_without_gst is the shipping base for the entire line.
 * - shipping uses the product GST rate unless a separate shipping rate is supplied.
 * - service charge per unit is added as supplied; no separate service GST is assumed.
 */
const hasMissingCalculationInputs = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return [
    row.quantity,
    row.unit_price_without_gst,
    row.line_tax_rate,
    row.line_shipping_charge_without_gst ?? row.shipping_charge_without_gst,
  ].some((value) => optionalNumber(value) === null);
};
const getLineSubtotal = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return roundMoney(
    numberValue(row.unit_price_without_gst) * getQuantity(item),
  );
};
const getLineGst = (item: FinanceReportItem) =>
  roundMoney(
    (getLineSubtotal(item) * numberValue(asLineItem(item).line_tax_rate)) / 100,
  );
const getLineShipping = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return roundMoney(
    numberValue(
      row.line_shipping_charge_without_gst ?? row.shipping_charge_without_gst,
    ),
  );
};
const getShippingTaxRate = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  return numberValue(
    row.line_shipping_tax_rate ??
      row.shipping_tax_rate ??
      row.shipping_gst_rate ??
      row.line_tax_rate,
  );
};
const getLineShippingGst = (item: FinanceReportItem) =>
  roundMoney((getLineShipping(item) * getShippingTaxRate(item)) / 100);
const getLineServiceCharge = (item: FinanceReportItem) =>
  roundMoney(
    numberValue(asLineItem(item).service_charge_per_unit) * getQuantity(item),
  );
const getLineCombinedSubtotal = (item: FinanceReportItem) =>
  roundMoney(getLineSubtotal(item) + getLineShipping(item));
const getLineGross = (item: FinanceReportItem) =>
  roundMoney(
    getLineCombinedSubtotal(item) +
      getSalesLineTax(item).total +
      getLineServiceCharge(item),
  );
const getInvoiceKey = (item: FinanceReportItem, index: number) => {
  const row = asLineItem(item);
  return String(
    row.order_reference || item.invoice_number || `missing-invoice-${index}`,
  );
};

const statusStyle = (status: string | null | undefined) => {
  const value = (status || "").toLowerCase();
  if (value.startsWith("partial")) {
    return { bg: THEME.orangeSoft, color: THEME.orange };
  }
  if (value === "delivered" || value === "completed" || value === "paid") {
    return { bg: THEME.greenSoft, color: THEME.green };
  }
  if (value.includes("ship") || value.includes("partial")) {
    return { bg: THEME.purpleSoft, color: THEME.purple };
  }
  if (value.includes("refund") || value.includes("cancel")) {
    return { bg: THEME.redSoft, color: THEME.red };
  }
  if (value.includes("dispatch") || value.includes("confirm")) {
    return { bg: THEME.primarySoft, color: THEME.primaryDark };
  }
  return { bg: THEME.orangeSoft, color: THEME.orange };
};
/* ================= SALES DATA EXCEL MAPPING ================= */
const SALES_HEADERS = [
  "Order Reference",
  "Item Reference ID",
  "Invoice Number",
  "Invoice Date",
  "Order Date",
  "Product Name",
  "Product Head",
  "SKU",
  "Quantity",
  "Price",
  "Total Discount",
  "CV",
  "Total Tax",
  "CGST",
  "SGST",
  "IGST",
  "Tax Percentage",
  "HSN Code",
  "Customer Name",
  "Customer GSTIN",
  "Customer State",
  "Shipping Charges",
  "Unit Price Without GST",
  "Product Subtotal Without GST",
  "Product GST",
  "Shipping Charges Without GST",
  "Sub Total",
  "Shipping GST",
  "Service Charge Per Unit",
  "Total Service Charge",
  "Total",
  "Order Status",
  "Item Delivery Status",
  "Confirmed At",
  "Dispatched At",
  "Delivered At",
  "Account Type",
  "User Name",
  "Customer Mobile",
  "Customer Email",
  "Billing State",
  "Payment Gateway",
  "Gateway Transaction ID",
  "Courier Company",
  "Courier Tracking Number",
  "Sales Classification",
];
const SALES_WIDTHS = [
  24.0, // Order Reference
  24.0, // Item Reference ID
  16.85546875, // Invoice Number
  15.85546875, // Invoice Date
  10.7109375, // Order Date
  34.5703125, // Product Name
  34.5703125, // Product Head
  8.0, // SKU
  8.7109375, // Quantity
  7.0, // Price
  13.7109375, // Total Discount
  5.0, // CV
  9.0, // Total Tax
  8.0, // CGST
  8.0, // SGST
  9.0, // IGST
  14.5703125, // Tax Percentage
  9.7109375, // HSN Code
  33.42578125, // Customer Name
  15.42578125, // Customer GSTIN
  24.5703125, // Customer State
  16.28515625, // Shipping Charges
  25.0, // Unit Price Without GST
  30.0, // Product Subtotal Without GST
  16.0, // Product GST
  30.0, // Shipping Charges Without GST
  10.0, // Sub Total
  16.0, // Shipping GST
  24.0, // Service Charge Per Unit
  22.0, // Total Service Charge
  9.0, // Total
  23.0, // Order Status
  23.0, // Item Delivery Status
  23.0, // Confirmed At
  23.0, // Dispatched At
  23.0, // Delivered At
  18.0, // Account Type
  24.0, // User Name
  22.0, // Customer Mobile
  34.0, // Customer Email
  24.0, // Billing State
  22.0, // Payment Gateway
  30.0, // Gateway Transaction ID
  32.0, // Courier Company
  32.0, // Courier Tracking Number
  25.0, // Sales Classification
];
// Additive columns only; do not sum rates, per-unit prices or repeated order fields.
const SALES_TOTAL_HEADERS = [
  "Price",
  "Total Tax",
  "CGST",
  "SGST",
  "IGST",
  "Sub Total",
  "Total",
  "Product Subtotal Without GST",
  "Product GST",
  "Shipping Charges Without GST",
  "Shipping GST",
  "Total Service Charge",
  "Shipping Charges",
  "Total Discount",
  "CV",
  "Quantity",
];
const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const optionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseExcelDate = (
  value: unknown,
  dateOnly = false,
): Date | string | null => {
  const raw = trimmedValue(value);
  if (!raw) return null;
  const match = raw.match(
    /^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (match)
    return new Date(
      Date.UTC(
        Number(match[3]),
        Number(match[2]) - 1,
        Number(match[1]),
        dateOnly ? 0 : Number(match[4] || 0),
        dateOnly ? 0 : Number(match[5] || 0),
        dateOnly ? 0 : Number(match[6] || 0),
      ),
    );
  const iso = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (iso)
    return new Date(
      Date.UTC(
        Number(iso[1]),
        Number(iso[2]) - 1,
        Number(iso[3]),
        dateOnly ? 0 : Number(iso[4] || 0),
        dateOnly ? 0 : Number(iso[5] || 0),
        dateOnly ? 0 : Number(iso[6] || 0),
      ),
    );
  return raw;
};
// Determine the tax regime without using backend tax amounts in arithmetic.
const getTaxRegime = (item: FinanceReportItem): "intra" | "inter" | null => {
  const row = asLineItem(item);
  const type = trimmedValue(row.tax_type ?? row.gst_type)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (["igst", "inter", "interstate"].includes(type)) return "inter";
  if (["cgstsgst", "sgstcgst", "intra", "intrastate"].includes(type))
    return "intra";
  const supplier = trimmedValue(
    row.supplier_state ?? row.seller_state,
  ).toLowerCase();
  const supply = trimmedValue(
    row.place_of_supply ?? row.delivery_state ?? row.billing_state,
  ).toLowerCase();
  if (supplier && supply) return supplier === supply ? "intra" : "inter";
  // Legacy response has no tax type. Use only the nonzero pattern as a regime hint.
  const hint = row.line_tax_breakdown ?? row.tax_breakdown;
  const central = numberValue(hint?.cgst) > 0;
  const state = numberValue(hint?.sgst) > 0;
  const integrated = numberValue(hint?.igst) > 0;
  if (integrated && !central && !state) return "inter";
  if (!integrated && central && state) return "intra";
  return null;
};
const getSalesLineTax = (item: FinanceReportItem) => {
  const total = roundMoney(getLineGst(item) + getLineShippingGst(item));
  if (total === 0) return { total, cgst: 0, sgst: 0, igst: 0 };
  const regime = getTaxRegime(item);
  if (regime === "inter") return { total, cgst: 0, sgst: 0, igst: total };
  if (regime === "intra") {
    const paise = Math.round(total * 100);
    const central = Math.ceil(paise / 2);
    return {
      total,
      cgst: central / 100,
      sgst: (paise - central) / 100,
      igst: 0,
    };
  }
  // Missing or ambiguous regime: do not invent a tax classification.
  return { total, cgst: null, sgst: null, igst: null };
};
// Use the product category from the API; never infer it from the product name.
const getProductCategory = (item: FinanceReportItem): string => {
  const row = item as unknown as Record<string, unknown>;
  const categoryText = (value: unknown): string => {
    if (typeof value === "string") return value.trim();
    if (value && typeof value === "object") {
      const category = value as Record<string, unknown>;
      return (
        [category.name, category.category_name, category.title]
          .find(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0,
          )
          ?.trim() || ""
      );
    }
    return "";
  };
  const product =
    row.product && typeof row.product === "object"
      ? (row.product as Record<string, unknown>)
      : {};
  return (
    [
      row.product_category_name,
      row.product_head,
      row.product_head_name,
      row.category_name,
      row.product_category,
      row.category,
      product.category_name,
      product.product_head,
      product.category,
    ]
      .map(categoryText)
      .find(Boolean) || ""
  );
};
// Client reporting categories only; GSTIN validity is not verified here.
const SALES_CLASSIFICATIONS = [
  "Sales Unregistered",
  "Sales Registered",
  "Other Sales",
  "Classification unavailable",
] as const;
const salesGstRegistration = (
  item: FinanceReportItem,
): "URP" | "Registered" | "" => {
  const gstin = trimmedValue(asLineItem(item).customer_gstin).toUpperCase();
  return !gstin ? "" : gstin === "URP" ? "URP" : "Registered";
};
const isReportableSale = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  // Exclude exact confirmed status, not historical confirmed_at timestamps.
  return (
    trimmedValue(item.order_status).toLowerCase() !== "confirmed" &&
    trimmedValue(row.item_delivery_status).toLowerCase() !== "confirmed"
  );
};
const salesClassification = (
  item: FinanceReportItem,
): (typeof SALES_CLASSIFICATIONS)[number] => {
  const gst = salesGstRegistration(item);
  if (!gst || hasMissingCalculationInputs(item))
    return "Classification unavailable";
  if (getLineGross(item) <= 100000) return "Other Sales";
  return gst === "URP" ? "Sales Unregistered" : "Sales Registered";
};
const readFinancePage = (
  response: any,
): { rows: FinanceReportItem[]; lastPage: number } => {
  const body =
    typeof response?.success === "boolean"
      ? response
      : (response?.data ?? response);
  if (body?.success === false)
    throw new Error(body.message || "Unable to load finance report");
  const payload = body?.data ?? body;
  const rows = Array.isArray(payload) ? payload : payload?.data;
  if (!Array.isArray(rows)) throw new Error("Invalid finance report response");
  const last = Number(
    payload?.last_page ??
      body?.meta?.last_page ??
      response?.meta?.last_page ??
      1,
  );
  return {
    rows,
    lastPage: Number.isFinite(last) ? Math.max(1, Math.floor(last)) : 1,
  };
};
const URP_HEADERS = [
  "Invoice Number",
  "Invoice date",
  "Customer Name",
  "Place Of Supply (POS)",
  "Rate",
  "Taxable Value",
  "CGST",
  "SGST",
  "IGST",
  "Invoice Value",
];
const GST_STATES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};
const stateKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
const formatPos = (item: FinanceReportItem) => {
  const row = asLineItem(item);
  const raw = trimmedValue(row.place_of_supply) || getPlaceOfSupply(item);
  const code = raw.match(/^(\d{2})(?:\s*[-–:]\s*.*)?$/)?.[1];
  if (code && GST_STATES[code]) return `${code}-${GST_STATES[code]}`;
  const aliases: Record<string, string> = {
    newdelhi: "07",
    orissa: "21",
    pondicherry: "34",
    uttaranchal: "05",
    damananddiu: "26",
    dadraandnagarhaveli: "26",
  };
  const key = stateKey(raw);
  const matched =
    aliases[key] ||
    Object.keys(GST_STATES).find((k) => stateKey(GST_STATES[k]) === key);
  return matched ? `${matched}-${GST_STATES[matched]}` : raw;
};

type CompactSalesCell = string | number | Date | null;
// Keep item rows separate even when invoice number and GST rate repeat.
// If shipping has a different GST rate, split that item's tax rate rows only.
const buildCompactSalesRows = (
  items: FinanceReportItem[],
  detailed: boolean,
): CompactSalesCell[][] => {
  const result: CompactSalesCell[][] = [];
  for (const item of items) {
    const row = asLineItem(item);
    const prefix: CompactSalesCell[] = [
      trimmedValue(item.invoice_number),
      parseExcelDate(item.invoice_date, true),
      trimmedValue(item.customer_name),
      formatPos(item),
    ];
    const suffix: CompactSalesCell[] = detailed
      ? [
          trimmedValue(row.customer_gstin),
          getProductName(item),
          trimmedValue(row.item_reference_id ?? row.order_line_id),
        ]
      : [];
    const rate = numberValue(row.line_tax_rate);
    const shipRate = getShippingTaxRate(item);
    const shipping = getLineShipping(item);
    const tax = getSalesLineTax(item);
    const add = (
      r: number,
      base: number,
      cgst: number | null,
      sgst: number | null,
      igst: number | null,
      gross: number,
    ) => result.push([...prefix, r, base, cgst, sgst, igst, gross, ...suffix]);
    if (!shipping || rate === shipRate) {
      add(
        rate,
        getLineCombinedSubtotal(item),
        tax.cgst,
        tax.sgst,
        tax.igst,
        getLineGross(item),
      );
    } else {
      const productTax = getLineGst(item);
      const regime = getTaxRegime(item);
      const central =
        regime === "intra"
          ? Math.ceil(Math.round(productTax * 100) / 2) / 100
          : regime === "inter" || productTax === 0
            ? 0
            : null;
      const state =
        regime === "intra" && central !== null
          ? roundMoney(productTax - central)
          : central === null
            ? null
            : 0;
      const integrated =
        regime === "inter" ? productTax : central === null ? null : 0;
      const rest = (a: number | null, b: number | null) =>
        a === null || b === null ? null : roundMoney(a - b);
      add(
        rate,
        getLineSubtotal(item),
        central,
        state,
        integrated,
        roundMoney(
          getLineSubtotal(item) + productTax + getLineServiceCharge(item),
        ),
      );
      add(
        shipRate,
        shipping,
        rest(tax.cgst, central),
        rest(tax.sgst, state),
        rest(tax.igst, integrated),
        roundMoney(shipping + getLineShippingGst(item)),
      );
    }
  }
  return result;
};
const addCompactSalesSheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  items: FinanceReportItem[],
  language: ReportLanguage,
  detailed: boolean,
) => {
  const headers = [
    ...URP_HEADERS,
    ...(detailed ? ["GSTIN NO", "Product Name", "Item Reference ID"] : []),
  ];
  const labels = headers.map((h) => translate(language, h));
  const rows = buildCompactSalesRows(items, detailed);
  const sheet = workbook.addWorksheet(translate(language, name), {
    views: [
      { state: "frozen", ySplit: 1, zoomScale: 80, showGridLines: false },
    ],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });
  const widths = [22, 15, 24, 25, 9, 17, 14, 14, 14, 18, 20, 28, 22];
  sheet.columns = headers.map((_, i) => ({
    width: Math.min(
      34,
      rows.reduce(
        (m, r) =>
          Math.max(
            m,
            (r[i] instanceof Date ? 12 : String(r[i] ?? "").length) + 3,
          ),
        widths[i],
      ),
    ),
  }));
  const edge: Partial<ExcelJS.Border> = {
    style: "thin",
    color: { argb: "FFD3DFEB" },
  };
  const header = sheet.addRow(labels);
  header.height = 32;
  header.eachCell((cell) => {
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF173B63" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = { top: edge, bottom: edge, left: edge, right: edge };
  });
  rows.forEach((values, index) => {
    const line = sheet.addRow(values);
    line.height = Math.min(
      120,
      Math.max(
        24,
        ...values.map(
          (v, i) =>
            14 *
              Math.max(
                1,
                Math.ceil(
                  (v instanceof Date ? 12 : String(v ?? "").length) /
                    Math.max(5, (sheet.getColumn(i + 1).width ?? 20) - 3),
                ),
              ) +
            6,
        ),
      ),
    );
    headers.forEach((_, i) => {
      const cell = line.getCell(i + 1);
      const numberCol = i >= 4 && i <= 9;
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: i === 9,
        color: { argb: "FF173B63" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: i === 9 ? "FFDCEEFF" : index % 2 ? "FFF3F7FC" : "FFFFFFFF",
        },
      };
      cell.alignment = {
        horizontal: numberCol ? "right" : "left",
        vertical: "top",
        wrapText: true,
      };
      cell.border = { top: edge, bottom: edge, left: edge, right: edge };
      cell.numFmt =
        i === 1 ? "dd-mmm-yy" : i === 4 ? "0.##" : numberCol ? "#,##0.00" : "@";
    });
  });
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rows.length + 1, column: headers.length },
  };
};

const buildSalesRows = (items: FinanceReportItem[]) => {
  const seenOrders = new Set<string>();
  const ordersWithLineCv = new Set(
    items.flatMap((item, index) =>
      optionalNumber(asLineItem(item).line_cv) === null
        ? []
        : [getInvoiceKey(item, index)],
    ),
  );
  const ordersWithLineDiscount = new Set(
    items.flatMap((item, index) =>
      optionalNumber(asLineItem(item).line_discount_amount) === null
        ? []
        : [getInvoiceKey(item, index)],
    ),
  );
  return items.map((item, index) => {
    const row = asLineItem(item);
    const orderKey = getInvoiceKey(item, index);
    const firstOrderRow = !seenOrders.has(orderKey);
    seenOrders.add(orderKey);
    const tax = getSalesLineTax(item);
    const subtotal = getLineCombinedSubtotal(item);
    const total = getLineGross(item);
    const couriers = getCouriers(item);
    const shipping = roundMoney(
      getLineShipping(item) + getLineShippingGst(item),
    );
    const discount =
      optionalNumber(row.line_discount_amount) ??
      (firstOrderRow && !ordersWithLineDiscount.has(orderKey)
        ? optionalNumber(row.discount_amount)
        : optionalNumber(row.discount_amount) === 0
          ? 0
          : null);
    return [
      row.order_reference || "", // Order Reference
      row.item_reference_id || "", // Item Reference ID
      item.invoice_number || "", // Invoice Number
      parseExcelDate(item.invoice_date, true), // Invoice Date
      parseExcelDate(item.order_date), // Order Date
      getProductName(item), // Product Name
      getProductCategory(item), // Product Head
      getProductCode(item), // SKU
      getQuantity(item), // Quantity
      total, // Price
      discount, // Total Discount
      optionalNumber(row.line_cv) ??
        (firstOrderRow && !ordersWithLineCv.has(orderKey)
          ? optionalNumber(row.cv)
          : null), // CV
      tax.total, // Total Tax
      tax.cgst, // CGST
      tax.sgst, // SGST
      tax.igst, // IGST
      optionalNumber(row.line_tax_rate), // Tax Percentage
      getHsnCode(item), // HSN Code
      item.customer_name || "", // Customer Name
      row.customer_gstin || "", // Customer GSTIN
      getPlaceOfSupply(item), // Customer State
      shipping, // Shipping Charges
      optionalNumber(row.unit_price_without_gst), // Unit Price Without GST
      getLineSubtotal(item), // Product Subtotal Without GST
      getLineGst(item), // Product GST
      getLineShipping(item), // Shipping Charges Without GST
      subtotal, // Sub Total
      getLineShippingGst(item), // Shipping GST
      optionalNumber(row.service_charge_per_unit), // Service Charge Per Unit
      getLineServiceCharge(item), // Total Service Charge
      total, // Total
      item.order_status || "", // Order Status
      row.item_delivery_status || "", // Item Delivery Status
      parseExcelDate(row.confirmed_at), // Confirmed At
      parseExcelDate(row.dispatched_at), // Dispatched At
      parseExcelDate(row.delivered_at), // Delivered At
      item.account_type || "", // Account Type
      item.user_name || "", // User Name
      trimmedValue(item.customer_mobile), // Customer Mobile
      item.customer_email || "", // Customer Email
      row.billing_state || "", // Billing State
      item.payment_gateway || "", // Payment Gateway
      item.gateway_transaction_id || "", // Gateway Transaction ID
      couriers.map((courier) => courier.courier_company || "").join(" | "), // Courier Company
      couriers
        .map((courier) => courier.courier_tracking_number || "")
        .join(" | "), // Courier Tracking Number
      salesClassification(item), // Sales Classification
    ];
  });
};

/* ================= GST REGISTRATION FILTER ================= */
type GstRegistrationFilter = "" | "URP" | "Registered";
const filterByGstRegistration = (
  items: FinanceReportItem[],
  filter: GstRegistrationFilter,
) =>
  items.filter(
    (item) =>
      isReportableSale(item) &&
      (!filter || salesGstRegistration(item) === filter),
  );

// Calculate all additive fields from the same mapping used by Excel.
const summarizeSales = (items: FinanceReportItem[]) => {
  const rows = buildSalesRows(items);
  const sum = (heading: string): number | null => {
    const index = SALES_HEADERS.indexOf(heading);
    const values = rows
      .map((row) => row[index])
      .filter((value): value is number => typeof value === "number");
    if (
      ["CGST", "SGST", "IGST"].includes(heading) &&
      values.length !== rows.length
    )
      return null;
    return values.length
      ? roundMoney(values.reduce((total, value) => total + value, 0))
      : rows.length
        ? null
        : 0;
  };
  return {
    orders: new Set(items.map((item, index) => getInvoiceKey(item, index)))
      .size,
    rows: rows.length,
    quantity: sum("Quantity"),
    sales: sum("Total"),
    subtotal: sum("Sub Total"),
    gst: sum("Total Tax"),
    cgst: sum("CGST"),
    sgst: sum("SGST"),
    igst: sum("IGST"),
    productSubtotal: sum("Product Subtotal Without GST"),
    productGst: sum("Product GST"),
    shipping: sum("Shipping Charges"),
    shippingBase: sum("Shipping Charges Without GST"),
    shippingGst: sum("Shipping GST"),
    service: sum("Total Service Charge"),
    discount: sum("Total Discount"),
    cv: sum("CV"),
  };
};

const displayMoney = (amount: number | null | undefined) =>
  amount == null ? "—" : money(amount);
const displayNumber = (amount: number | null | undefined) =>
  amount == null ? "—" : amount.toLocaleString("en-IN");

/* ================= SMALL COMPONENTS ================= */
function StatusBadge({ status }: { status: string | null | undefined }) {
  const { localValue } = useReportLanguage();
  const style = statusStyle(status);
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize"
      style={{ background: style.bg, color: style.color }}
    >
      {localValue("Order Status", status) || "—"}
    </span>
  );
}
function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  const { t } = useReportLanguage();
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-600">{t(title)}</p>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: bg, color }}
        >
          <Icon size={18} />
        </div>
      </div>
      <h3 className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-2xl">
        {value}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {t(subtitle)}
      </p>
    </div>
  );
}

function CourierDetails({ item }: { item: FinanceReportItem }) {
  const { t } = useReportLanguage();
  const couriers = getCouriers(item);
  if (!couriers.length)
    return <span className="text-xs text-gray-400">{t("Not assigned")}</span>;
  return (
    <div className="min-w-0 max-w-full space-y-2">
      {couriers.map((courier, index) => (
        <div
          key={`${courier.courier_company || "courier"}-${courier.courier_tracking_number || index}-${index}`}
        >
          <p className="flex items-center gap-1 text-xs font-semibold text-gray-800">
            <Truck size={12} className="shrink-0 text-[#2D6FE8]" />
            <span>{valueOrDash(courier.courier_company)}</span>
          </p>
          <p className="mt-0.5 break-all pl-[17px] text-xs text-gray-500">
            {t("Tracking:")} {valueOrDash(courier.courier_tracking_number)}
          </p>
        </div>
      ))}
    </div>
  );
}
function ProductDetails({ item }: { item: FinanceReportItem }) {
  const { t, localValue } = useReportLanguage();
  const row = asLineItem(item);
  return (
    <div className="min-w-0 w-full max-w-full">
      <p className="line-clamp-2 text-xs font-semibold text-gray-800">
        {valueOrDash(getProductName(item))}
      </p>
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500">
        <span>SKU: {valueOrDash(getProductCode(item))}</span>
        <span>
          {t("Category:")}{" "}
          {localValue("Product Head", getProductCategory(item)) || "—"}
        </span>
        <span>HSN: {valueOrDash(getHsnCode(item))}</span>
        <span>GST: {getGstPercentage(item) || "—"}</span>
      </div>
      {row.item_reference_id && (
        <p className="mt-1 break-all text-xs text-gray-400">
          {t("Item Ref:")} {row.item_reference_id}
        </p>
      )}
    </div>
  );
}
function TaxBreakdownDetails({ item }: { item: FinanceReportItem }) {
  const { t } = useReportLanguage();
  const tax = getSalesLineTax(item);
  return (
    <div className="min-w-0 space-y-1.5">
      {[
        ["CGST", tax.cgst],
        ["SGST", tax.sgst],
        ["IGST", tax.igst],
      ].map(([label, amount]) => (
        <div
          key={String(label)}
          className="flex items-center justify-between gap-1"
        >
          <span className="text-xs text-gray-500">{t(label)}</span>
          <span className="break-words text-right text-xs font-semibold text-gray-700">
            {amount === null ? "—" : money(Number(amount))}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-1 border-t border-[#E8EEF6] pt-1.5">
        <span className="text-xs font-bold text-gray-700">
          {t("Total Tax")}
        </span>
        <span className="break-words text-right text-xs font-bold text-[#1E40AF]">
          {money(tax.total)}
        </span>
      </div>
    </div>
  );
}
/* ================= MAIN COMPONENT ================= */
function AccountDetails({ item }: { item: FinanceReportItem }) {
  const { t, localValue } = useReportLanguage();
  const role = getAccountLabelRole(item.account_type);
  const label = (field: string) => t(accountFieldLabel(field, role));
  const accountType = localValue("Account Type", item.account_type);
  const fields = [
    [label("Customer Name"), valueOrDash(item.customer_name)],
    [label("Customer Email"), valueOrDash(item.customer_email)],
    [label("Customer Mobile"), valueOrDash(item.customer_mobile)],
    [t("User Name"), valueOrDash(item.user_name)],
    [label("Customer GSTIN"), getGstinNumber(item)],
    [
      label("Customer State"),
      localValue("Customer State", getPlaceOfSupply(item)) || "—",
    ],
  ];
  return (
    <div className="min-w-0 space-y-2 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 font-semibold text-[#1E40AF]">
          {accountType || t("Unknown")}
        </span>
      </div>
      {fields.map(([field, value], index) => (
        <div key={index} className="min-w-0">
          <p className="text-[10px] font-medium text-slate-500">{field}</p>
          <p
            className={`mt-0.5 break-words [overflow-wrap:anywhere] ${index === 0 ? "font-semibold text-slate-900" : "text-slate-700"}`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

const FinanceReportContent = ({
  setLanguage,
}: {
  setLanguage: (language: ReportLanguage) => void;
}) => {
  const { language, t, localValue } = useReportLanguage();
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();
  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;
    return (
      hasModuleAccess("finance_sales_report") ||
      hasPermission("finance_sales_report.view")
    );
  }, [isSuperAdmin, hasModuleAccess, hasPermission]);
  const canExport = useMemo(() => {
    if (isSuperAdmin) return true;
    return hasPermission("finance_sales_report.download");
  }, [isSuperAdmin, hasPermission]);
  /* ================= LOGO ================= */
  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const loadLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();
        const candidates = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];
        const found = candidates.find(
          (value) =>
            typeof value === "string" && /^https?:\/\//i.test(value.trim()),
        );
        if (!cancelled && found) setLogoUrl(found.trim());
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) setLogoLoading(false);
      }
    };
    void loadLogo();
    return () => {
      cancelled = true;
    };
  }, []);
  /* ================= REPORT STATE ================= */
  const [exporting, setExporting] = useState(false);
  const [gstFilter, setGstFilter] = useState<GstRegistrationFilter>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [overviewRows, setOverviewRows] = useState<FinanceReportItem[] | null>(
    null,
  );
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(false);
  const [overviewRevision, setOverviewRevision] = useState(0);
  const loading = overviewLoading;
  const refreshing = overviewLoading;
  /* Load every API page once. All filters, pagination,
     totals and both exports use the same snapshot, never just one server page. */
  const fetchAllReportRows = useCallback(async (isActive: () => boolean) => {
    const allItems: FinanceReportItem[] = [];
    let page = 1;
    let pages = 1;
    do {
      if (!isActive()) return [];
      const response = await financeReportApi.getAll({
        page,
        per_page: PER_PAGE,
      });
      const result = readFinancePage(response);
      // API total/from/to may count orders, not item rows. Keep every item.
      allItems.push(...result.rows.filter(isReportableSale));
      pages = result.lastPage;
      page += 1;
    } while (page <= pages);
    return allItems;
  }, []);
  useEffect(() => {
    if (permissionsLoading) return;
    if (!canViewReport) {
      setOverviewRows(null);
      setOverviewLoading(false);
      return;
    }
    let active = true;
    setOverviewRows(null);
    setOverviewLoading(true);
    setOverviewError(false);
    fetchAllReportRows(() => active)
      .then((items) => {
        if (active) setOverviewRows(items);
      })
      .catch((error) => {
        console.error("Finance report error:", error);
        if (active) {
          setOverviewError(true);
          toast.error(t("Unable to load all report pages. Please retry."));
        }
      })
      .finally(() => {
        if (active) setOverviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [permissionsLoading, canViewReport, fetchAllReportRows, overviewRevision]);
  const refreshReport = () => {
    setOverviewLoading(true);
    setOverviewRows(null);
    setOverviewError(false);
    setOverviewRevision((value) => value + 1);
    setCurrentPage(1);
  };
  const matchedReports = useMemo(
    () => filterByGstRegistration(overviewRows ?? [], gstFilter),
    [overviewRows, gstFilter],
  );
  // A shared column must not describe customer rows as distributors (or vice versa).
  // A single-type filtered dataset uses its specific label; mixed datasets use neutral labels.
  const reportAccountRole = useMemo(
    () => getReportAccountLabelRole(matchedReports),
    [matchedReports],
  );
  const fieldLabel = (field: string) =>
    t(accountFieldLabel(field, reportAccountRole));
  const totalRecords = matchedReports.length;
  const lastPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
  const safePage = Math.min(currentPage, lastPage);
  const filteredReports = useMemo(
    () => matchedReports.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    [matchedReports, safePage],
  );
  const summary = useMemo(
    () =>
      overviewRows === null || matchedReports.some(hasMissingCalculationInputs)
        ? null
        : summarizeSales(matchedReports),
    [overviewRows, matchedReports],
  );
  const pageSummary = useMemo(
    () => summarizeSales(filteredReports),
    [filteredReports],
  );
  const summaryMoney = (value: number | null | undefined) =>
    overviewLoading ? "…" : displayMoney(value);
  const summaryNumber = (value: number | null | undefined) =>
    overviewLoading ? "…" : displayNumber(value);
  const canDownload =
    canExport &&
    !exporting &&
    !loading &&
    !overviewError &&
    matchedReports.length > 0 &&
    summary !== null;
  const filterDescription = gstFilter
    ? `${t("GST Registration")}: ${localValue("GST Registration", gstFilter)}`
    : "";
  const clearFilters = () => {
    setGstFilter("");
    setCurrentPage(1);
  };
  const urpExport = gstFilter === "URP";
  const exportCSV = () => {
    if (!canDownload) return;
    // Quote every cell, preserve identifiers as text and mitigate CSV formula injection.
    const escape = (value: unknown) => {
      let text =
        value instanceof Date
          ? value.toISOString().slice(0, 16).replace("T", " ")
          : String(value ?? "");
      if (typeof value === "string" && /^[\s]*[=+@-]|^[\t\r\n]/.test(text))
        text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const rows = buildSalesRows(matchedReports);
    const csv = (
      urpExport
        ? [
            URP_HEADERS.map((h) => t(h)),
            ...buildCompactSalesRows(matchedReports, false),
          ]
        : [
            SALES_HEADERS.map(fieldLabel),
            ...rows.map((row) =>
              row.map((value, i) =>
                typeof value === "string" &&
                (language === "hi" || SALES_HEADERS[i] === "Account Type")
                  ? localValue(SALES_HEADERS[i], value)
                  : value,
              ),
            ),
          ]
    )
      .map((row) => row.map(escape).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-filtered-${language}-${formatDateInput(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(
      `${matchedReports.length} ${t("matching product lines exported")}`,
    );
  };
  /* ================= EXCEL EXPORT ================= */
  const exportExcel = async () => {
    if (!canExport) {
      toast.error(t("You don't have permission to export this report."));
      return;
    }
    if (!canDownload) return;
    setExporting(true);
    try {
      const exportItems = matchedReports;
      if (exportItems.some(hasMissingCalculationInputs)) {
        throw new Error(
          "Cannot calculate sales: quantity, taxable unit price, GST rate or shipping base is missing.",
        );
      }
      const rows = buildSalesRows(exportItems).map((row) =>
        row.map((value, i) =>
          typeof value === "string" &&
          (language === "hi" || SALES_HEADERS[i] === "Account Type")
            ? localValue(SALES_HEADERS[i], value)
            : value,
        ),
      );
      if (!rows.length) {
        toast.error(t("No finance records available to export"));
        return;
      }
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "IndieKonnect";
      workbook.calcProperties.fullCalcOnLoad = true;
      if (urpExport) {
        addCompactSalesSheet(
          workbook,
          "URP Sales",
          exportItems,
          language,
          false,
        );
      } else {
        // The first worksheet is a compact, client-facing explanation of the same
        // frontend-calculated data. The detailed audit worksheet stays intact.
        const overview = workbook.addWorksheet(t("Sales Overview"), {
          views: [
            { state: "frozen", xSplit: 3, ySplit: 5, showGridLines: false },
          ],
          properties: { defaultRowHeight: 25 },
        });
        // Keep every value inside its own cell, including long customer details.
        const cellText = (value: unknown): string => {
          if (value == null) return "";
          if (value instanceof Date) return "00-00-0000 00:00";
          if (typeof value === "number")
            return value.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          return String(value);
        };
        const fitWidth = (
          minimum: number,
          values: unknown[],
          numeric = false,
        ) => {
          const longest = values.reduce<number>(
            (max, value) =>
              Math.max(
                max,
                ...cellText(value)
                  .split("\n")
                  .map((part) => part.length),
              ),
            0,
          );
          // Numeric columns grow to accommodate large totals; text wraps at a sensible width.
          return Math.min(
            numeric ? 48 : 42,
            Math.max(minimum, Math.ceil(longest * 1.12) + 5),
          );
        };
        const fittedRowHeight = (
          values: unknown[],
          widths: number[],
          minimum = 34,
        ) => {
          const lines = values.reduce<number>((max, value, i) => {
            const capacity = Math.max(4, Math.floor((widths[i] - 5) / 1.12));
            const count = cellText(value)
              .split("\n")
              .reduce(
                (sum, part) =>
                  sum + Math.max(1, Math.ceil(part.length / capacity)),
                0,
              );
            return Math.max(max, count);
          }, 1);
          return Math.min(409, Math.max(minimum, 14 * lines + 12));
        };
        const cellGrid = (color = "FFD3DFEB"): Partial<ExcelJS.Borders> => ({
          top: { style: "thin", color: { argb: color } },
          bottom: { style: "thin", color: { argb: color } },
          left: { style: "thin", color: { argb: color } },
          right: { style: "thin", color: { argb: color } },
        });
        const overviewColumns = [
          { source: "Invoice Number", label: t("Invoice No."), width: 18 },
          {
            source: "Customer Name",
            label: fieldLabel("Customer Name"),
            width: 25,
          },
          {
            source: "Customer Email",
            label: fieldLabel("Customer Email"),
            width: 31,
          },
          { source: "User Name", label: t("User Name"), width: 22 },
          { source: "Account Type", label: t("Account Type"), width: 20 },
          { source: "Product Name", label: t("Product Name"), width: 33 },
          { source: "Product Head", label: t("Product Category"), width: 23 },
          { source: "Quantity", label: t("Qty"), width: 9 },
          {
            source: "Product Subtotal Without GST",
            label: t("Product Amount\n(before tax)"),
            width: 19,
          },
          {
            source: "Shipping Charges Without GST",
            label: t("Shipping\n(before tax)"),
            width: 17,
          },
          {
            source: "Sub Total",
            label: t("Subtotal\n(before tax)"),
            width: 19,
          },
          { source: "Total Tax", label: t("GST\n(total tax)"), width: 17 },
          {
            source: "Total Service Charge",
            label: t("Service\nCharges"),
            width: 16,
          },
          { source: "Total", label: t("Final Amount\n(incl. tax)"), width: 21 },
        ];
        const overviewTextCount = overviewColumns.findIndex(
          (col) => col.source === "Quantity",
        );
        const isOverviewTotal = (i: number) =>
          overviewColumns[i].source === "Total";
        const isOverviewSubtotal = (i: number) =>
          overviewColumns[i].source === "Sub Total";
        const isOverviewQuantity = (i: number) =>
          overviewColumns[i].source === "Quantity";
        const simpleRows = rows.map((row) =>
          overviewColumns.map(
            ({ source }) => row[SALES_HEADERS.indexOf(source)],
          ),
        );
        const overviewWidths = overviewColumns.map((col, i) => {
          const values = simpleRows.map((row) => row[i]);
          const total =
            i >= overviewTextCount
              ? values.reduce<number>(
                  (sum, value) => sum + (typeof value === "number" ? value : 0),
                  0,
                )
              : null;
          return fitWidth(
            Math.max(col.width, i >= overviewTextCount ? 17 : 19),
            [col.label, ...values, total],
            i >= overviewTextCount,
          );
        });
        overview.columns = overviewWidths.map((width) => ({ width }));
        const fill = (argb: string): ExcelJS.Fill => ({
          type: "pattern",
          pattern: "solid",
          fgColor: { argb },
        });
        const overviewBanner = (
          row: number,
          value: string,
          bg: string,
          fg: string,
          size: number,
          bold = false,
        ) => {
          overview.mergeCells(row, 1, row, overviewColumns.length);
          const cell = overview.getCell(row, 1);
          cell.value = value;
          cell.fill = fill(bg);
          cell.font = {
            name: language === "hi" ? "Nirmala UI" : "Calibri",
            size,
            bold,
            color: { argb: fg },
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
            indent: 1,
            wrapText: true,
          };
        };
        overviewBanner(
          1,
          t("INDIEKONNECT  /  SALES OVERVIEW"),
          "FF173B63",
          "FFFFFFFF",
          20,
          true,
        );
        overview.getRow(1).height = 42;
        const period = t("All available dates");
        overviewBanner(
          2,
          `${period}  |  ${rows.length} ${t("product lines")}  |  ${t("All amounts in INR (₹)")}`,
          "FFF0F7FF",
          "FF456580",
          11,
        );
        overview.getRow(2).height = 25;
        overviewBanner(
          3,
          t(
            "Product amount + shipping = subtotal  •  Subtotal + GST + service charges = final amount",
          ),
          "FFFFFFFF",
          "FF173B63",
          12,
          true,
        );
        overview.getRow(3).height = 30;
        overviewBanner(
          4,
          filterDescription
            ? `${t("Applied filters:")} ${filterDescription}`
            : t(
                "All matching records for the selected period. Full GST, payment and courier details are in Sales Data.",
              ),
          "FFFFFFFF",
          "FF456580",
          11,
        );
        overview.getRow(4).height = filterDescription
          ? Math.min(
              120,
              Math.max(25, 16 * Math.ceil(filterDescription.length / 140) + 12),
            )
          : 25;
        const simpleHeader = overview.addRow(
          overviewColumns.map((col) => col.label),
        );
        simpleHeader.height = fittedRowHeight(
          overviewColumns.map((col) => col.label),
          overviewWidths,
          42,
        );
        overviewColumns.forEach((_, i) => {
          const cell = simpleHeader.getCell(i + 1);
          const key = isOverviewSubtotal(i) || isOverviewTotal(i);
          cell.fill = fill(key ? "FFBBDCFB" : "FF24466A");
          cell.font = {
            name: language === "hi" ? "Nirmala UI" : "Calibri",
            size: 11,
            bold: true,
            color: { argb: key ? "FF173B63" : "FFFFFFFF" },
          };
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
          cell.border = cellGrid("FF9FB5CA");
        });
        simpleRows.forEach((values, index) => {
          const line = overview.addRow(values);
          line.height = fittedRowHeight(values, overviewWidths);
          overviewColumns.forEach((_, i) => {
            const cell = line.getCell(i + 1);
            const key = isOverviewSubtotal(i) || isOverviewTotal(i);
            cell.fill = fill(
              isOverviewTotal(i)
                ? "FFDCEEFF"
                : isOverviewSubtotal(i)
                  ? "FFF0F7FF"
                  : index % 2
                    ? "FFF5F8FC"
                    : "FFFFFFFF",
            );
            cell.font = {
              name: language === "hi" ? "Nirmala UI" : "Calibri",
              size: 11,
              bold: isOverviewTotal(i),
              color: { argb: key ? "FF173B63" : "FF253C52" },
            };
            cell.alignment = {
              horizontal: i < overviewTextCount ? "left" : "right",
              vertical: "middle",
              indent: 1,
              wrapText: true,
            };
            cell.border = cellGrid();
            cell.numFmt =
              i < overviewTextCount
                ? "@"
                : isOverviewQuantity(i)
                  ? "#,##0"
                  : "#,##0.00";
          });
        });
        const overviewLast = simpleRows.length + 5;
        overview.autoFilter = {
          from: { row: 5, column: 1 },
          to: { row: overviewLast, column: overviewColumns.length },
        };
        const simpleTotal = overview.addRow([]);
        simpleTotal.height = 40;
        overview.mergeCells(
          simpleTotal.number,
          1,
          simpleTotal.number,
          overviewTextCount,
        );
        simpleTotal.getCell(1).value = t("GRAND TOTAL");
        overviewColumns.forEach((_, i) => {
          const cell = simpleTotal.getCell(i + 1);
          cell.fill = fill(isOverviewTotal(i) ? "FFBBDCFB" : "FFDCEEFF");
          cell.font = {
            name: language === "hi" ? "Nirmala UI" : "Calibri",
            size: 12,
            bold: true,
            color: { argb: "FF173B63" },
          };
          cell.alignment = {
            horizontal: i < overviewTextCount ? "left" : "right",
            vertical: "middle",
            indent: 1,
            wrapText: true,
          };
          cell.border = cellGrid("FF9FB5CA");
          if (i >= overviewTextCount) {
            const letter = overview.getColumn(i + 1).letter;
            const sum = roundMoney(
              simpleRows.reduce(
                (acc, row) =>
                  acc + (typeof row[i] === "number" ? Number(row[i]) : 0),
                0,
              ),
            );
            cell.value = {
              formula: `SUBTOTAL(109,${letter}6:${letter}${overviewLast})`,
              result: sum,
            };
            cell.numFmt = isOverviewQuantity(i) ? "#,##0" : "#,##0.00";
          }
        });
        overviewBanner(
          overviewLast + 3,
          t(
            "Calculation note: taxable unit price is treated as discount-adjusted. If shipping GST rate is absent, the product rate is used. No separate service GST is assumed.",
          ),
          "FFF0F7FF",
          "FF456580",
          10,
        );
        overview.getRow(overviewLast + 3).height = 31;
        overviewBanner(
          overviewLast + 4,
          t(
            "The report uses frontend calculations. Grand Total reflects the visible rows in this tab. Product categories are taken from the API; unavailable values remain blank.",
          ),
          "FFFFFFFF",
          "FF456580",
          10,
        );
        overview.getRow(overviewLast + 4).height = 28;
        const sheet = workbook.addWorksheet(t("Sales Data"), {
          views: [
            { state: "frozen", xSplit: 3, ySplit: 1, showGridLines: false },
          ],
          properties: { defaultRowHeight: 23 },
        });
        const currencyFormat = "#,##0.00;[Red](#,##0.00);0.00";
        const textHeaders = new Set([
          "Order Reference",
          "Item Reference ID",
          "Invoice Number",
          "SKU",
          "HSN Code",
          "User Name",
          "Customer Mobile",
          "Gateway Transaction ID",
          "Courier Company",
          "Courier Tracking Number",
        ]);
        const moneyHeaders = new Set([
          "Price",
          "Total Discount",
          "Total Tax",
          "CGST",
          "SGST",
          "IGST",
          "Sub Total",
          "Total",
          "Shipping Charges",
          "Unit Price Without GST",
          "Product Subtotal Without GST",
          "Product GST",
          "Shipping Charges Without GST",
          "Shipping GST",
          "Service Charge Per Unit",
          "Total Service Charge",
        ]);
        const dateTimeHeaders = new Set([
          "Order Date",
          "Confirmed At",
          "Dispatched At",
          "Delivered At",
        ]);
        const groupColor = (heading: string) => {
          if (["Sub Total", "Total"].includes(heading)) return "FFBBDCFB";
          if (heading === "Price") return "FF13795B";
          if (
            [
              "Total Tax",
              "CGST",
              "SGST",
              "IGST",
              "Tax Percentage",
              "Product GST",
              "Shipping GST",
            ].includes(heading)
          )
            return "FF365A83";
          if (moneyHeaders.has(heading) || ["CV", "Quantity"].includes(heading))
            return "FF24466A";
          return "FF17324D";
        };
        const salesWidths = SALES_WIDTHS.map((width, i) => {
          const heading = SALES_HEADERS[i];
          const numeric =
            moneyHeaders.has(heading) ||
            ["Quantity", "CV", "Tax Percentage"].includes(heading);
          const values = rows.map((row) => row[i]);
          const total = SALES_TOTAL_HEADERS.includes(heading)
            ? values.reduce<number>(
                (sum, value) => sum + (typeof value === "number" ? value : 0),
                0,
              )
            : null;
          return fitWidth(
            Math.max(width, moneyHeaders.has(heading) ? 20 : numeric ? 14 : 18),
            [fieldLabel(heading), ...values, total],
            numeric,
          );
        });
        sheet.columns = salesWidths.map((width) => ({ width }));
        // Row 1 headers, row 2 onward sales data, final row grand total.
        const header = sheet.addRow(SALES_HEADERS.map(fieldLabel));
        header.height = fittedRowHeight(
          SALES_HEADERS.map(fieldLabel),
          salesWidths,
          42,
        );
        for (let c = 1; c <= SALES_HEADERS.length; c++) {
          const cell = header.getCell(c);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: groupColor(SALES_HEADERS[c - 1]) },
          };
          cell.font = {
            name: language === "hi" ? "Nirmala UI" : "Calibri",
            size: 11,
            bold: true,
            color: {
              argb: ["Sub Total", "Total"].includes(SALES_HEADERS[c - 1])
                ? "FF173B63"
                : "FFFFFFFF",
            },
          };
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
          cell.border = cellGrid("FF9FB5CA");
        }
        rows.forEach((values, index) => {
          const excelRow = sheet.addRow(values);
          excelRow.height = fittedRowHeight(values, salesWidths);
          for (let c = 1; c <= SALES_HEADERS.length; c++) {
            const heading = SALES_HEADERS[c - 1];
            const cell = excelRow.getCell(c);
            const numeric =
              moneyHeaders.has(heading) ||
              ["Quantity", "CV", "Tax Percentage"].includes(heading);
            const keyTotal = ["Sub Total", "Total"].includes(heading);
            cell.font = {
              name: language === "hi" ? "Nirmala UI" : "Calibri",
              size: 11,
              color: { argb: keyTotal ? "FF173B63" : "FF253C52" },
              bold: keyTotal,
            };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: keyTotal
                  ? heading === "Total"
                    ? "FFDCEEFF"
                    : "FFF0F7FF"
                  : index % 2 === 0
                    ? "FFFFFFFF"
                    : "FFF2F6FA",
              },
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: numeric ? "right" : "left",
              indent: 1,
              wrapText: true,
            };
            cell.border = cellGrid();
            if (textHeaders.has(heading)) cell.numFmt = "@";
            if (moneyHeaders.has(heading)) cell.numFmt = currencyFormat;
            if (heading === "Quantity" || heading === "CV")
              cell.numFmt = "#,##0.##";
            if (heading === "Tax Percentage") cell.numFmt = '0.##"%"';
            if (heading === "Invoice Date") cell.numFmt = "dd-mm-yyyy";
            if (dateTimeHeaders.has(heading)) cell.numFmt = "dd-mm-yyyy hh:mm";
          }
        });
        const lastRow = rows.length + 1;
        const footer = sheet.addRow([]);
        footer.height = 40;
        sheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: lastRow, column: SALES_HEADERS.length },
        };
        // Label cells are outside the numeric columns. Merge only A:C so frozen panes remain intact.
        [footer.number].forEach((r) => {
          for (let c = 1; c <= SALES_HEADERS.length; c++) {
            const cell = sheet.getRow(r).getCell(c);
            const heading = SALES_HEADERS[c - 1];
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: heading === "Total" ? "FFBBDCFB" : "FFDCEEFF" },
            };
            cell.font = {
              name: language === "hi" ? "Nirmala UI" : "Calibri",
              size: 12,
              bold: true,
              color: { argb: "FF173B63" },
            };
            cell.alignment = {
              horizontal: "right",
              vertical: "middle",
              indent: 1,
              wrapText: true,
            };
            cell.border = cellGrid("FF9FB5CA");
          }
          sheet.mergeCells(r, 1, r, 3);
          const title = sheet.getCell(r, 1);
          title.value = t("GRAND TOTAL  |  VISIBLE ROWS");
          title.alignment = {
            horizontal: "left",
            vertical: "middle",
            indent: 1,
          };
          const detail = sheet.getCell(r, 6);
          detail.value = t("INR • Frontend calculated");
          detail.alignment = {
            horizontal: "left",
            vertical: "middle",
            indent: 1,
            wrapText: true,
          };
        });
        SALES_TOTAL_HEADERS.forEach((heading) => {
          const col = SALES_HEADERS.indexOf(heading);
          if (col < 0) return;
          const column = sheet.getColumn(col + 1).letter;
          const values = rows
            .map((row) => row[col])
            .filter((value): value is number => typeof value === "number");
          if (!values.length) return;
          if (
            ["CGST", "SGST", "IGST"].includes(heading) &&
            values.length !== rows.length
          )
            return;
          const sum = roundMoney(values.reduce((acc, value) => acc + value, 0));
          [footer.number].forEach((r) => {
            const cell = sheet.getRow(r).getCell(col + 1);
            cell.value = {
              formula: `SUBTOTAL(109,${column}2:${column}${lastRow})`,
              result: sum,
            };
            cell.numFmt = moneyHeaders.has(heading)
              ? currencyFormat
              : "#,##0.##";
          });
        });
        // Classification tabs are additional views, not additional transactions.
        for (const category of SALES_CLASSIFICATIONS) {
          const matching = exportItems.filter(
            (item) => salesClassification(item) === category,
          );
          addCompactSalesSheet(workbook, category, matching, language, true);
        }
      }
      const buffer = await workbook.xlsx.writeBuffer();
      const bytes = new Uint8Array(buffer);
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sales-data-${language}-${formatDateInput(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(t("Sales Data exported successfully"));
    } catch (error) {
      console.error("Sales Data export error:", error);
      toast.error(
        error instanceof Error
          ? t(error.message)
          : t("Failed to export Sales Data"),
      );
    } finally {
      setExporting(false);
    }
  };

  /* ================= PAGINATION ================= */
  const startRecord = totalRecords === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const endRecord = Math.min(safePage * PER_PAGE, totalRecords);
  const pageLoading = permissionsLoading || logoLoading;
  if (pageLoading) return <PermissionLoadingState logoUrl={logoUrl} />;
  if (!canViewReport) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <ShieldAlert size={28} className="mx-auto mb-4 text-[#C23B32]" />
          <h2 className="text-lg font-bold text-gray-900">
            {t("Access Denied")}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {t(
              "You don't have permission to view the Finance Sales Report.",
            )}{" "}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen space-y-5 p-3 sm:p-5 lg:p-6"
      lang={language}
      style={{ background: THEME.background }}
    >
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2D6FE8]">
            <span>{t("Reports")}</span>
            <ChevronRight size={13} />
            <span>{t("Finance Sales Report")}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {t("Finance Sales Report")}{" "}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t(
              "Product-wise sales and GST calculated from unit prices, quantities and tax rates.",
            )}{" "}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
            {t("Language")}
            <select
              aria-label={t("Language")}
              value={language}
              onChange={(e) => setLanguage(e.target.value as ReportLanguage)}
              className="bg-transparent outline-none"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </label>
          <button
            type="button"
            onClick={refreshReport}
            disabled={loading || exporting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            {t("Refresh")}{" "}
          </button>
          {canExport && (
            <button
              type="button"
              onClick={() => void exportExcel()}
              disabled={!canDownload}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {exporting
                ? t("Exporting...")
                : `${t("Export Excel")} (${totalRecords})`}
            </button>
          )}
          {canExport && (
            <button
              type="button"
              onClick={exportCSV}
              disabled={!canDownload}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-[#173B63] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              {t("Export CSV (")}
              {totalRecords})
            </button>
          )}
        </div>
      </div>
      {/* GST REGISTRATION — the only report filter */}
      <section
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm"
        aria-label={t("GST Registration")}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Filter size={17} className="text-[#2D6FE8]" />
            {t("GST Registration")}
          </div>
          <select
            aria-label={t("GST Registration")}
            value={gstFilter}
            disabled={loading || exporting}
            onChange={(e) => {
              setGstFilter(e.target.value as GstRegistrationFilter);
              setCurrentPage(1);
            }}
            className="h-10 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          >
            <option value="">{t("All")}</option>
            <option value="URP">{localValue("GST Registration", "URP")}</option>
            <option value="Registered">
              {localValue("GST Registration", "Registered")}
            </option>
          </select>
          {gstFilter && (
            <button
              type="button"
              onClick={clearFilters}
              disabled={exporting}
              className="text-xs font-semibold text-[#2D6FE8] hover:underline disabled:opacity-50"
            >
              {t("Clear Filters")}
            </button>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">
            {loading
              ? t("Loading records…")
              : `${totalRecords.toLocaleString("en-IN")} ${t("matching product lines")}`}
          </p>
          <p className="text-xs text-slate-500">
            {t(
              "Excel and CSV include these matching records across all pages.",
            )}
          </p>
        </div>
      </section>
      {/* EXECUTIVE FINANCIAL SUMMARY */}
      <p className="text-xs text-slate-500">
        {t(
          "Frontend-calculated amounts. Shipping GST uses the product rate when no separate rate is supplied. Unit price is treated as net of discounts; service charges are added without separate GST.",
        )}{" "}
      </p>
      <section className="space-y-3" aria-label={t("Financial summary")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t("Sales overview")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {t("All matching records across pages · INR")}
            </p>
          </div>
          {overviewLoading ? (
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              {t("Updating totals")}
            </span>
          ) : overviewError ? (
            <button
              type="button"
              onClick={refreshReport}
              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
            >
              {t("Totals unavailable · Retry")}
            </button>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {summaryNumber(summary?.rows)} {t("product lines")}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-xl border border-[#BBDCFB] bg-[#EAF3FF] p-4 text-[#173B63] shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#315B86]">
                {t("Total Sales")}
              </p>
              <div className="rounded-lg bg-[#D5E9FF] p-2">
                <Wallet size={18} />
              </div>
            </div>
            <p className="mt-2 break-words text-2xl font-bold tracking-tight tabular-nums">
              {summaryMoney(summary?.sales)}
            </p>
            <p className="mt-1 text-xs text-[#315B86]">
              {t("Total item amount · incl. GST")}
            </p>
          </div>
          <SummaryCard
            title={t("Sub Total")}
            value={summaryMoney(summary?.subtotal)}
            subtitle={t("Products + shipping, excl. GST")}
            icon={Receipt}
            color="#2D6FE8"
            bg="#EAF3FF"
          />
          <SummaryCard
            title={t("Total GST")}
            value={summaryMoney(summary?.gst)}
            subtitle={t("Product GST + shipping GST")}
            icon={CreditCard}
            color="#6D28D9"
            bg="#EDE9FE"
          />
          <SummaryCard
            title={t("Shipping Charges")}
            value={summaryMoney(summary?.shipping)}
            subtitle={t("Including shipping GST")}
            icon={Truck}
            color="#15803D"
            bg="#DCFCE7"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">
              {t("Sales breakdown")}
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              {[
                ["Product subtotal", summary?.productSubtotal],
                ["Shipping excl. GST", summary?.shippingBase],
                ["Sub Total (excl. GST)", summary?.subtotal],
                ["Service charges", summary?.service],
                ["Discount", summary?.discount],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-slate-500">{t(label)}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {summaryMoney(value as number | null | undefined)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">
              {t("GST breakdown")}
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              {[
                ["CGST", summary?.cgst],
                ["SGST", summary?.sgst],
                ["IGST", summary?.igst],
                ["Product GST", summary?.productGst],
                ["Shipping GST", summary?.shippingGst],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-slate-500">{t(label)}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {summaryMoney(value as number | null | undefined)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {t("Order activity")}
              </h3>
              <Package size={17} className="text-slate-400" />
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {[
                ["Unique orders", summary?.orders],
                ["Product quantity", summary?.quantity],
                ["Total CV", summary?.cv],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0"
                >
                  <span className="text-xs text-slate-500">{t(label)}</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {summaryNumber(value as number | null | undefined)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* FINANCE RECORDS */}
      <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-[#DCE6F2] p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {t("Finance Reports")}{" "}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {t(
                "Product-wise sales and GST details. Export includes all matching records.",
              )}{" "}
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#1E40AF]">
            {totalRecords} {t("matching product lines")}{" "}
          </span>
        </div>
        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#2D6FE8]" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              {t("Loading finance report...")}{" "}
            </p>
          </div>
        ) : overviewError ? (
          <div className="p-8 text-center text-sm text-red-700" role="alert">
            {t("Could not load all report pages.")}{" "}
            <button
              type="button"
              onClick={refreshReport}
              className="font-semibold underline"
            >
              {t("Retry")}
            </button>
          </div>
        ) : filteredReports.some(hasMissingCalculationInputs) ? (
          <div className="p-8 text-center text-sm text-amber-800" role="alert">
            {t(
              "Sales calculation unavailable: one or more records are missing quantity, taxable unit price, GST rate or shipping base.",
            )}{" "}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileText size={25} />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-800">
              {t("No Finance Records Found")}{" "}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {t("No records match the selected GST filter.")}{" "}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
            >
              {t("Clear Filters")}{" "}
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden w-full overflow-x-auto xl:block">
              <table className="w-full min-w-[1420px] table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#F7FAFE]">
                    {[
                      "Invoice / Date",
                      "Customer / GSTIN",
                      "Product / GST %",
                      "Qty / Unit Price",
                      "Shipping",
                      "Item Total / GST",
                      "GST Breakdown",
                      "Payment",
                      "Order",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-normal break-words border-b border-[#DCE6F2] px-2.5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500"
                      >
                        {fieldLabel(heading)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((item, index) => {
                    const row = asLineItem(item);
                    return (
                      <tr
                        key={`${item.invoice_number || "invoice"}-${row.order_line_id ?? row.item_reference_id ?? index}-${index}`}
                        className="border-b border-gray-100 transition last:border-0 hover:bg-[#F8FBFF]"
                      >
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-xs font-bold text-gray-900">
                            {valueOrDash(item.invoice_number)}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-500">
                            {formatDate(item.invoice_date)}
                          </p>
                          {row.order_reference && (
                            <p className="mt-1 break-all text-xs font-medium text-[#2D6FE8]">
                              {row.order_reference}
                            </p>
                          )}
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <AccountDetails item={item} />
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <ProductDetails item={item} />
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-xs font-bold text-gray-900">
                            {getQuantity(item)}
                            {t("Qty")}{" "}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-600">
                            {t("Unit:")} {money(row.unit_price_without_gst)}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-500">
                            {t("Line:")} {money(getLineSubtotal(item))}
                          </p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="text-xs text-gray-500">
                            {t("Without GST")}{" "}
                          </p>
                          <p className="mt-0.5 break-words text-xs font-semibold text-gray-800">
                            {money(getLineShipping(item))}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {t("Shipping GST")}{" "}
                          </p>
                          <p className="mt-0.5 break-words text-xs font-semibold text-gray-800">
                            {money(getLineShippingGst(item))}
                          </p>
                          <div className="mt-2">
                            <CourierDetails item={item} />
                          </div>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-xs font-bold text-gray-900">
                            {money(getLineGross(item))}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-500">
                            {t("Product GST:")} {money(getLineGst(item))}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-400">
                            {t("Service charge:")}{" "}
                            {money(getLineServiceCharge(item))}
                          </p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <TaxBreakdownDetails item={item} />
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <p className="break-words text-xs font-semibold text-gray-800">
                            {valueOrDash(item.payment_gateway)}
                          </p>
                          <p className="mt-1 break-all text-xs text-gray-500">
                            {valueOrDash(item.gateway_transaction_id)}
                          </p>
                        </td>
                        <td className="min-w-0 px-2.5 py-3 align-top">
                          <div className="space-y-1">
                            <div>
                              <span className="block text-[10px] text-slate-500">
                                {t("Order")}
                              </span>
                              <StatusBadge status={item.order_status} />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500">
                                {t("Item delivery")}
                              </span>
                              <StatusBadge status={row.item_delivery_status} />
                            </div>
                          </div>
                          <p className="mt-1 break-words text-xs text-gray-400">
                            {formatDate(item.order_date)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* MOBILE / TABLET CARDS */}
            <div className="space-y-3 p-3 xl:hidden">
              {filteredReports.map((item, index) => {
                const row = asLineItem(item);
                const tax = getSalesLineTax(item);
                return (
                  <div
                    key={`${item.invoice_number || "invoice"}-${row.order_line_id ?? row.item_reference_id ?? index}-${index}`}
                    className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Invoice Number")}{" "}
                          </p>
                          <p className="mt-1 break-all text-sm font-bold text-gray-900">
                            {valueOrDash(item.invoice_number)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(item.invoice_date)}
                          </p>
                          {row.order_reference && (
                            <p className="mt-1 break-all text-xs font-medium text-[#2D6FE8]">
                              {row.order_reference}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="block text-[10px] text-slate-500">
                              {t("Order")}
                            </span>
                            <StatusBadge status={item.order_status} />
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500">
                              {t("Item delivery")}
                            </span>
                            <StatusBadge status={row.item_delivery_status} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 rounded-lg bg-[#F7FAFE] p-3">
                        <AccountDetails item={item} />
                      </div>
                      <div className="mt-3 rounded-lg border border-[#E8EEF6] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Product Item")}{" "}
                          </p>
                          <span className="rounded-full bg-[#EAF3FF] px-2 py-1 text-xs font-semibold text-[#1E40AF]">
                            {t("Qty:")} {getQuantity(item)}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-sm font-semibold text-gray-800">
                          {valueOrDash(getProductName(item))}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span>
                            {t("Code:")} {valueOrDash(getProductCode(item))}
                          </span>
                          <span>
                            {t("Category:")}{" "}
                            {localValue(
                              "Product Head",
                              getProductCategory(item),
                            ) || "—"}
                          </span>
                          <span>HSN: {valueOrDash(getHsnCode(item))}</span>
                          <span>GST: {getGstPercentage(item) || "—"}</span>
                        </div>
                        {row.item_reference_id && (
                          <p className="mt-1 break-all text-xs text-gray-400">
                            {t("Item Ref:")} {row.item_reference_id}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Product Total (excl. GST)")}{" "}
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">
                            {money(getLineSubtotal(item))}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Product GST")}{" "}
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">
                            {money(getLineGst(item))}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Shipping (excl. GST)")}{" "}
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">
                            {money(getLineShipping(item))}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Shipping GST")}{" "}
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-800">
                            {money(getLineShippingGst(item))}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Unit Price (excl. GST)")}{" "}
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-700">
                            {money(row.unit_price_without_gst)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Payment Gateway")}{" "}
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-gray-700">
                            {valueOrDash(item.payment_gateway)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-lg border border-[#DCE6F2] bg-[#F7FAFE] p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
                            {t("GST Tax Breakdown")}{" "}
                          </p>
                          <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-xs font-semibold text-[#1E40AF]">
                            {t("Product-line GST")}{" "}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            ["CGST", tax.cgst],
                            ["SGST", tax.sgst],
                            ["IGST", tax.igst],
                            ["Total Tax", tax.total],
                          ].map(([label, amount]) => (
                            <div
                              key={String(label)}
                              className="rounded-lg border border-[#E8EEF6] bg-white p-2.5"
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                {t(label)}
                              </p>
                              <p className="mt-1 break-words text-xs font-bold text-gray-800">
                                {amount === null ? "—" : money(Number(amount))}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 border-t border-[#E8EEF6] pt-3">
                        <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          <Truck size={12} />
                          {t("Courier & Tracking")}{" "}
                        </p>
                        <CourierDetails item={item} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8EEF6] pt-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Order Date")}{" "}
                          </p>
                          <p className="mt-1 break-words text-xs text-gray-500">
                            {formatDate(item.order_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Item Total")}{" "}
                          </p>
                          <p className="mt-1 break-words text-xs font-bold text-gray-800">
                            {money(getLineGross(item))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {t("Service Charge")}{" "}
                          </p>
                          <p className="mt-1 break-words text-xs font-bold text-gray-800">
                            {money(getLineServiceCharge(item))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* CURRENT PAGE TOTALS */}
            <div className="border-t border-slate-200 bg-[#F1F6FB] px-4 py-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {t("Current page totals")}
                </h3>
                <span className="text-xs text-slate-500">
                  {filteredReports.length} {t("visible product lines")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  ["Quantity", displayNumber(pageSummary.quantity)],
                  [
                    "Product subtotal",
                    displayMoney(pageSummary.productSubtotal),
                  ],
                  [
                    "Shipping excl. GST",
                    displayMoney(pageSummary.shippingBase),
                  ],
                  ["Sub Total", displayMoney(pageSummary.subtotal)],
                  ["Total GST", displayMoney(pageSummary.gst)],
                  ["Total Sales", displayMoney(pageSummary.sales)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <p className="text-xs text-slate-500">{t(label)}</p>
                    <p
                      className={`mt-1 break-words text-sm font-bold tabular-nums ${label === "Total Sales" ? "text-[#1E40AF]" : "text-slate-900"}`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* PAGINATION */}
            <div className="flex flex-col justify-between gap-3 border-t border-[#DCE6F2] px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-xs text-gray-500">
                {t("Showing product lines")}{" "}
                <span className="font-semibold text-gray-800">
                  {startRecord}–{endRecord}
                </span>{" "}
                {t("of")}{" "}
                <span className="font-semibold text-gray-800">
                  {totalRecords}
                </span>
                <span className="ml-1 text-gray-400">
                  ({filteredReports.length}
                  {t("product rows on this page)")}{" "}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1 || loading}
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t("Previous page")}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-[85px] text-center text-xs font-semibold text-gray-700">
                  {t("Page")} {safePage}
                  {t("of")} {lastPage}
                </span>
                <button
                  type="button"
                  disabled={safePage >= lastPage || loading}
                  onClick={() =>
                    setCurrentPage(Math.min(lastPage, safePage + 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t("Next page")}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
const FinanceReport = () => {
  const [language, setLanguage] = useState<ReportLanguage>("en");
  return (
    <LanguageContext.Provider value={language}>
      <FinanceReportContent setLanguage={setLanguage} />
    </LanguageContext.Provider>
  );
};
export default FinanceReport;
