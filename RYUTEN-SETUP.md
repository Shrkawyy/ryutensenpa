# تشغيل واجهة Ryuten مع Onyx

هذه الإضافة تجعل Onyx يحتفظ باتصال Senpa والحركة والـ input، ثم تعرض العالم في
واجهة شبيهة بـ Ryuten. هي ليست نسخة من محرك Ryuten/Albion الخاص ولا تغيّر
بروتوكول السيرفر.

## رفع الملفات

1. فك ضغط الحزمة.
2. ارفع الملفات إلى جذر مشروع GitHub الموجود، واستبدل الملفات التي لها نفس
   الاسم.
3. أضف الملف `onyx-ryuten.js` ومجلد `ryuten/` كاملًا، وبداخله:
   `frame-codec.js` و`renderer.html` و`renderer.js`.
4. اترك ملفات السيرفرات الحالية كما هي؛ الحزمة تتضمنها أيضًا فقط لتسهيل
   الاستبدال.

## التشغيل

1. ثبّت/حدّث `kateronyx.user.js` إلى الإصدار `2.0.5`.
2. افتح Senpa واختر Nemesis (FFA) أو Zephyr (Dual) أو WindBine (MegaSplitX).
3. بعد دخول اللعبة اضغط الزر أسفل الشاشة: **Onyx · Switch to Ryuten**.
4. للرجوع إلى الرسم العادي اضغط الزر مرة أخرى: **Ryuten · Switch to Onyx**.

إذا كان المشروع منشورًا على رابط مختلف عن `https://onyx-og.vercel.app/`، غيّر
`DEFAULT_BASE_URL` في `kateronyx.user.js` إلى رابط الموقع المنشور، مع `/` في
النهاية، ثم ثبّت userscript من جديد.

