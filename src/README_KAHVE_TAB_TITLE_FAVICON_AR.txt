تم تعديل ملف src الأخير بناءً على طلبك.

التعديل:
- عنوان تبويب المتصفح ثابت دائمًا: KAHVE
- أيقونة التبويب أصبحت لوجو KAHVE بحرف K
- لن يتغير اسم التبويب عند فتح Cart أو Delivery Details أو Dashboard
- تم تعديل:
  index.html
  favicon.ico
  favicon.svg
  assets/kahve-favicon.svg
  app/app.component.ts
  app/app-routing.module.ts

بعد الاستبدال:
cd "D:\KAHVI FENISH\FRONT FIX"
npm run build

للتجربة:
npx serve -s ".\dist\website\browser" -l 4300

لو الأيقونة القديمة ظلت ظاهرة:
Ctrl + F5
أو افتح Incognito
لأن المتصفح بيخزن favicon في الكاش.
