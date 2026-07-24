import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { KAHVE_CONTACT } from '../../config/store-contact';
import { LanguageService } from '../../services/language.service';

type PolicyKey = 'shipping' | 'returns' | 'privacy' | 'terms';

interface PolicySection {
  titleEn: string;
  titleAr: string;
  paragraphsEn: string[];
  paragraphsAr: string[];
  bulletsEn?: string[];
  bulletsAr?: string[];
}

interface PolicyContent {
  eyebrowEn: string;
  eyebrowAr: string;
  titleEn: string;
  titleAr: string;
  introEn: string;
  introAr: string;
  sections: PolicySection[];
}

@Component({
  selector: 'app-legal-policy',
  templateUrl: './legal-policy.component.html',
  styleUrls: ['./legal-policy.component.css'],
})
export class LegalPolicyComponent implements OnInit, OnDestroy {
  contact = KAHVE_CONTACT;
  policyKey: PolicyKey = 'shipping';
  content!: PolicyContent;

  private routeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.data.subscribe((data) => {
      this.policyKey = (data['policy'] || 'shipping') as PolicyKey;
      this.content = POLICIES[this.policyKey];
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  text(en: string, ar: string): string {
    return this.languageService.isArabic ? ar : en;
  }
}

const POLICIES: Record<PolicyKey, PolicyContent> = {
  shipping: {
    eyebrowEn: 'KAHVE Customer Care',
    eyebrowAr: 'خدمة عملاء KAHVE',
    titleEn: 'Shipping Policy',
    titleAr: 'سياسة الشحن والتوصيل',
    introEn: 'We want every KAHVE order to arrive clearly, safely and with transparent delivery expectations.',
    introAr: 'نحرص على وصول كل طلب من KAHVE بشكل واضح وآمن مع توضيح تكلفة ومدة التوصيل قبل إتمام الطلب.',
    sections: [
      {
        titleEn: 'Delivery areas and shipping cost',
        titleAr: 'مناطق التوصيل وتكلفة الشحن',
        paragraphsEn: [
          'We currently deliver within supported areas in Egypt. Shipping fees vary by delivery area and are calculated and shown during checkout before you place the order.',
          'The shipping amount displayed at checkout is the amount that applies to that order unless the order is later changed at your request.',
        ],
        paragraphsAr: [
          'نقوم بالتوصيل حاليًا إلى المناطق المدعومة داخل مصر. تختلف تكلفة الشحن حسب منطقة التوصيل ويتم احتسابها وإظهارها بوضوح أثناء إتمام الطلب وقبل تأكيده.',
          'قيمة الشحن الظاهرة عند إتمام الطلب هي القيمة المطبقة على الطلب ما لم يتم تعديل الطلب لاحقًا بناءً على طلب العميل.',
        ],
      },
      {
        titleEn: 'Estimated delivery time',
        titleAr: 'المدة المتوقعة للتوصيل',
        paragraphsEn: [
          'Most orders are expected to arrive within approximately 1–5 business days, depending on the destination, order time, product availability and courier conditions.',
          'Orders placed after the daily processing cut-off may begin processing on the next fulfillment day. Public holidays, severe weather or courier delays may extend the estimate.',
        ],
        paragraphsAr: [
          'من المتوقع وصول معظم الطلبات خلال نحو 1–5 أيام عمل حسب منطقة التوصيل ووقت الطلب وتوافر المنتجات وظروف شركة الشحن.',
          'قد يبدأ تجهيز الطلبات التي يتم تأكيدها بعد موعد التجهيز اليومي في يوم العمل التالي، وقد تؤدي الإجازات الرسمية أو الظروف الجوية أو تأخيرات شركة الشحن إلى زيادة المدة المتوقعة.',
        ],
      },
      {
        titleEn: 'Order accuracy and receiving your order',
        titleAr: 'بيانات الطلب واستلام الشحنة',
        paragraphsEn: [
          'Please provide a correct phone number, address and delivery area. KAHVE is not responsible for delays caused by incomplete or incorrect delivery details supplied by the customer.',
          'Please inspect the package when received. If the order arrives damaged, incorrect or with missing items, contact us as soon as possible with the order details and supporting photos where available.',
        ],
        paragraphsAr: [
          'يرجى إدخال رقم هاتف وعنوان ومنطقة توصيل صحيحة. لا تتحمل KAHVE مسؤولية التأخير الناتج عن بيانات توصيل ناقصة أو غير صحيحة قام العميل بإدخالها.',
          'يرجى فحص الطلب عند الاستلام. إذا وصل الطلب تالفًا أو غير مطابق أو به أصناف ناقصة، تواصل معنا في أقرب وقت مع بيانات الطلب وصور توضيحية إن أمكن.',
        ],
      },
    ],
  },
  returns: {
    eyebrowEn: 'Clear & Fair',
    eyebrowAr: 'سياسة واضحة وعادلة',
    titleEn: 'Returns & Refunds Policy',
    titleAr: 'سياسة الاستبدال والاسترجاع ورد المبالغ',
    introEn: 'This policy explains when a KAHVE order may be returned, replaced or refunded and how to contact us.',
    introAr: 'توضح هذه السياسة حالات الاستبدال والاسترجاع ورد المبالغ وكيفية التواصل معنا بشأن الطلب.',
    sections: [
      {
        titleEn: 'Change-of-mind returns',
        titleAr: 'الاسترجاع بدون وجود عيب',
        paragraphsEn: [
          'Where the product is legally eligible for return, you may request a return within 14 days from receiving it. The item must remain unused, unopened where applicable, and in the same condition and original packaging in which it was received.',
          'Because coffee and other consumable products can be affected by opening, storage and product nature, opened products, products that cannot be restored to their original condition, and quickly perishable consumables may be excluded from change-of-mind returns where permitted by Egyptian consumer protection rules.',
          'For a legally eligible change-of-mind return within the 14-day period, KAHVE does not charge an additional return fee, subject to the applicable legal conditions and exceptions.',
        ],
        paragraphsAr: [
          'إذا كان المنتج من المنتجات التي يجوز قانونًا إرجاعها، يمكن طلب الاسترجاع خلال 14 يومًا من تاريخ الاستلام، بشرط أن يكون المنتج غير مستخدم وغير مفتوح عند انطباق ذلك وبنفس حالته وتغليفه الأصلي وقت الاستلام.',
          'نظرًا لطبيعة القهوة والمنتجات الاستهلاكية وتأثرها بالفتح والتخزين، قد لا يشمل حق الاسترجاع بدون سبب المنتجات المفتوحة أو التي يتعذر إعادتها إلى حالتها الأصلية أو السلع الاستهلاكية القابلة للتلف السريع، وذلك في الحدود التي يسمح بها قانون حماية المستهلك المصري.',
          'بالنسبة لطلبات الاسترجاع بدون سبب التي تكون مؤهلة قانونًا خلال مدة الـ14 يومًا، لا تفرض KAHVE رسوم استرجاع إضافية، مع مراعاة الشروط والاستثناءات القانونية المطبقة.',
        ],
      },
      {
        titleEn: 'Defective, damaged or incorrect products',
        titleAr: 'المنتجات المعيبة أو التالفة أو غير المطابقة',
        paragraphsEn: [
          'If a product is defective, damaged on delivery, or different from what you ordered, contact KAHVE within 30 days of receiving it and explain the issue.',
          'For an accepted defective or incorrect order claim, KAHVE will arrange the legally applicable replacement or refund without additional cost to the customer.',
        ],
        paragraphsAr: [
          'إذا كان المنتج معيبًا أو تالفًا عند الاستلام أو غير مطابق لما تم طلبه، تواصل مع KAHVE خلال 30 يومًا من تاريخ الاستلام مع توضيح المشكلة.',
          'في حالة قبول طلب الاستبدال أو الاسترجاع بسبب عيب أو عدم مطابقة، تقوم KAHVE بتنفيذ الاستبدال أو رد القيمة وفقًا لما يقرره القانون دون تكلفة إضافية على العميل.',
        ],
      },
      {
        titleEn: 'How to request a return or refund',
        titleAr: 'طريقة طلب الاستبدال أو الاسترجاع',
        paragraphsEn: [
          'Contact us through the Contact Us page or the KAHVE hotline and provide your order number, product name, reason for the request and photos when relevant. Do not send any product back before receiving return instructions from KAHVE.',
          'Approved refunds are processed using the original payment method where applicable. Refund timing may depend on the payment provider, but KAHVE will process an approved statutory refund within the applicable legal timeframe.',
        ],
        paragraphsAr: [
          'تواصل معنا من خلال صفحة اتصل بنا أو رقم KAHVE مع إرسال رقم الطلب واسم المنتج وسبب الطلب وصور عند الحاجة. لا تقم بإرسال أي منتج قبل استلام تعليمات الاسترجاع من KAHVE.',
          'يتم رد المبلغ للطلبات المقبولة باستخدام وسيلة الدفع الأصلية متى كان ذلك ممكنًا، وقد يختلف وقت ظهور المبلغ حسب مقدم خدمة الدفع، مع التزام KAHVE بتنفيذ رد المبلغ المقبول خلال المدة القانونية المطبقة.',
        ],
        bulletsEn: [
          'Eligible non-defective returns: requested within 14 days and subject to legal exceptions.',
          'Defective products: replacement or refund rights may apply within 30 days of receipt.',
          'Return/refund terms shown here must also match any policy configured in Google Merchant Center.',
        ],
        bulletsAr: [
          'الاسترجاع للمنتجات غير المعيبة المؤهلة: خلال 14 يومًا مع مراعاة الاستثناءات القانونية.',
          'المنتجات المعيبة: قد يحق للعميل الاستبدال أو الاسترجاع خلال 30 يومًا من الاستلام.',
          'يجب أن تتطابق هذه السياسة مع سياسة الاسترجاع المسجلة في Google Merchant Center.',
        ],
      },
    ],
  },
  privacy: {
    eyebrowEn: 'Your Privacy Matters',
    eyebrowAr: 'خصوصيتك تهمنا',
    titleEn: 'Privacy Policy',
    titleAr: 'سياسة الخصوصية',
    introEn: 'This policy explains the information KAHVE may collect when you use our website and how that information is used and protected.',
    introAr: 'توضح هذه السياسة البيانات التي قد تجمعها KAHVE عند استخدام الموقع وكيف نستخدم هذه البيانات ونحميها.',
    sections: [
      {
        titleEn: 'Information we collect',
        titleAr: 'البيانات التي نجمعها',
        paragraphsEn: ['We collect information that you provide directly when you create an account, place an order, contact us or use website features.'],
        paragraphsAr: ['نجمع البيانات التي تقدمها مباشرة عند إنشاء حساب أو تنفيذ طلب أو التواصل معنا أو استخدام خصائص الموقع.'],
        bulletsEn: ['Name, email address and phone number.', 'Delivery address and area.', 'Order, cart, favorites and customer-service history.', 'Payment method or transaction reference details needed to review an order. We do not intentionally store full payment-card credentials.', 'Technical and analytics data such as device/browser information, pages visited and interactions.'],
        bulletsAr: ['الاسم والبريد الإلكتروني ورقم الهاتف.', 'عنوان ومنطقة التوصيل.', 'بيانات الطلبات والسلة والمفضلة وسجل خدمة العملاء.', 'وسيلة الدفع أو بيانات مرجع العملية اللازمة لمراجعة الطلب. لا نقصد تخزين بيانات بطاقة الدفع الكاملة.', 'بيانات تقنية وتحليلية مثل نوع الجهاز والمتصفح والصفحات التي تمت زيارتها والتفاعلات داخل الموقع.'],
      },
      {
        titleEn: 'How we use information',
        titleAr: 'كيف نستخدم البيانات',
        paragraphsEn: ['We use personal information only for legitimate business and service purposes, including:'],
        paragraphsAr: ['نستخدم البيانات الشخصية للأغراض المشروعة المرتبطة بتشغيل المتجر وتقديم الخدمة، ومنها:'],
        bulletsEn: ['Creating and managing customer accounts.', 'Processing, confirming, delivering and supporting orders.', 'Preventing misuse, fraud and security incidents.', 'Improving website performance, products and customer experience.', 'Complying with legal, accounting and consumer-protection obligations.'],
        bulletsAr: ['إنشاء وإدارة حسابات العملاء.', 'تنفيذ وتأكيد وتوصيل ومتابعة الطلبات.', 'منع إساءة الاستخدام والاحتيال والحوادث الأمنية.', 'تحسين أداء الموقع والمنتجات وتجربة العملاء.', 'الالتزام بالمتطلبات القانونية والمحاسبية ومتطلبات حماية المستهلك.'],
      },
      {
        titleEn: 'Cookies, analytics and service providers',
        titleAr: 'ملفات الارتباط والتحليلات ومقدمو الخدمات',
        paragraphsEn: [
          'The website may use cookies or similar browser storage to keep sessions, preferences and shopping functionality working. We also use analytics tools such as Google Analytics to understand website usage and ecommerce events.',
          'We may share only the information necessary with trusted service providers that help host the website, deliver orders, provide analytics, communications or technical services. We do not sell customers’ personal data.',
        ],
        paragraphsAr: [
          'قد يستخدم الموقع ملفات تعريف الارتباط أو وسائل تخزين مشابهة للحفاظ على الجلسات والتفضيلات ووظائف التسوق. كما نستخدم أدوات تحليل مثل Google Analytics لفهم استخدام الموقع وأحداث التجارة الإلكترونية.',
          'قد نشارك القدر اللازم فقط من البيانات مع مقدمي خدمات موثوقين يساعدون في استضافة الموقع أو توصيل الطلبات أو التحليلات أو الاتصالات أو الخدمات التقنية. لا نقوم ببيع البيانات الشخصية للعملاء.',
        ],
      },
      {
        titleEn: 'Your choices and contact',
        titleAr: 'حقوقك وطريقة التواصل',
        paragraphsEn: [
          'You may contact KAHVE to ask about your personal information, request a correction, or request deletion where legally available and where retention is not required for orders, accounting, fraud prevention or legal obligations.',
          'We take reasonable technical and organizational measures to protect information, but no internet transmission or storage system can be guaranteed to be completely secure.',
        ],
        paragraphsAr: [
          'يمكنك التواصل مع KAHVE للاستفسار عن بياناتك الشخصية أو طلب تصحيحها أو طلب حذفها عندما يسمح القانون بذلك، ما لم يكن الاحتفاظ بها مطلوبًا للطلبات أو المحاسبة أو منع الاحتيال أو الالتزامات القانونية.',
          'نتخذ إجراءات تقنية وتنظيمية معقولة لحماية البيانات، ولكن لا يمكن ضمان أمان أي نظام نقل أو تخزين عبر الإنترنت بشكل كامل.',
        ],
      },
    ],
  },
  terms: {
    eyebrowEn: 'KAHVE Online Store',
    eyebrowAr: 'متجر KAHVE الإلكتروني',
    titleEn: 'Terms & Conditions',
    titleAr: 'الشروط والأحكام',
    introEn: 'By using the KAHVE website or placing an order, you agree to these terms together with the policies linked from this website.',
    introAr: 'باستخدام موقع KAHVE أو تنفيذ طلب، فإنك توافق على هذه الشروط إلى جانب السياسات المنشورة والمرتبطة بالموقع.',
    sections: [
      {
        titleEn: 'Products, prices and availability',
        titleAr: 'المنتجات والأسعار والتوافر',
        paragraphsEn: [
          'We aim to display accurate product descriptions, images, prices and availability. Minor visual differences may occur because of screen settings or packaging updates.',
          'Prices are shown in Egyptian Pounds (EGP) unless stated otherwise. Product availability may change before an order is confirmed. If an item becomes unavailable, we may contact you to amend or cancel the affected item and arrange any applicable refund.',
        ],
        paragraphsAr: [
          'نسعى لعرض أوصاف وصور وأسعار وتوافر المنتجات بدقة. قد توجد اختلافات بسيطة في الألوان أو العبوات بسبب إعدادات الشاشة أو تحديثات التغليف.',
          'الأسعار معروضة بالجنيه المصري ما لم يذكر غير ذلك. قد يتغير توافر المنتج قبل تأكيد الطلب، وإذا أصبح أحد المنتجات غير متاح فقد نتواصل معك لتعديل أو إلغاء الصنف المتأثر وتنفيذ أي رد مبلغ مستحق.',
        ],
      },
      {
        titleEn: 'Orders, payment and cancellation',
        titleAr: 'الطلبات والدفع والإلغاء',
        paragraphsEn: [
          'Submitting an order sends a purchase request to KAHVE. An order may require review or payment confirmation before final acceptance. You are responsible for providing accurate order, contact and delivery details.',
          'To request cancellation, contact us as soon as possible. Cancellation may not be possible after an order has been prepared, handed to a courier or delivered. Any statutory cancellation or return rights remain unaffected.',
        ],
        paragraphsAr: [
          'إرسال الطلب يمثل طلب شراء إلى KAHVE، وقد يحتاج الطلب إلى مراجعة أو تأكيد الدفع قبل القبول النهائي. يتحمل العميل مسؤولية إدخال بيانات الطلب والتواصل والتوصيل بشكل صحيح.',
          'لطلب الإلغاء تواصل معنا في أسرع وقت. قد يتعذر إلغاء الطلب بعد تجهيزه أو تسليمه لشركة الشحن أو توصيله، مع عدم الإخلال بأي حقوق قانونية مقررة للإلغاء أو الاسترجاع.',
        ],
      },
      {
        titleEn: 'Website use and intellectual property',
        titleAr: 'استخدام الموقع وحقوق الملكية',
        paragraphsEn: [
          'You may use this website only for lawful personal shopping and communication with KAHVE. Attempts to disrupt the website, gain unauthorized access, misuse accounts, scrape protected data or commit fraud are prohibited.',
          'KAHVE branding, site design, product photography, text and other original content are protected by applicable intellectual-property rights and may not be commercially copied or reused without permission.',
        ],
        paragraphsAr: [
          'يُستخدم الموقع للأغراض القانونية المتعلقة بالتسوق الشخصي والتواصل مع KAHVE فقط. يُحظر تعطيل الموقع أو محاولة الوصول غير المصرح به أو إساءة استخدام الحسابات أو جمع البيانات المحمية آليًا أو القيام بأي نشاط احتيالي.',
          'علامة KAHVE وتصميم الموقع وصور المنتجات والنصوص والمحتوى الأصلي محمية بحقوق الملكية الفكرية المعمول بها ولا يجوز نسخها أو إعادة استخدامها تجاريًا دون إذن.',
        ],
      },
      {
        titleEn: 'Policies, liability and governing law',
        titleAr: 'السياسات والمسؤولية والقانون المطبق',
        paragraphsEn: [
          'The Shipping Policy, Returns & Refunds Policy and Privacy Policy form part of these terms. Where these terms conflict with mandatory consumer rights under Egyptian law, the mandatory legal rights apply.',
          'These terms are governed by the applicable laws of the Arab Republic of Egypt. We may update these terms when our services, legal requirements or store practices change; the latest version published on this website applies from its stated update date.',
        ],
        paragraphsAr: [
          'تعد سياسة الشحن وسياسة الاستبدال والاسترجاع وسياسة الخصوصية جزءًا من هذه الشروط. إذا تعارض أي نص هنا مع حقوق إلزامية للمستهلك مقررة بموجب القانون المصري، تسري الحقوق القانونية الإلزامية.',
          'تخضع هذه الشروط للقوانين المعمول بها في جمهورية مصر العربية. قد نقوم بتحديث الشروط عند تغير الخدمات أو المتطلبات القانونية أو ممارسات المتجر، وتطبق أحدث نسخة منشورة من تاريخ تحديثها.',
        ],
      },
    ],
  },
};
