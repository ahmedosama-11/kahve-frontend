تم تعديل src بحيث كل روابط الباك إند تقرأ من ملف واحد:

src/app/config/api.config.ts

حاليًا الملف فيه:
export const API_BASE_URL = 'http://localhost:3000';

وقت الإنتاج، لما الدومين يبقى جاهز، غيّر السطر فقط إلى:
export const API_BASE_URL = 'https://api.yourdomain.com';

بعد استبدال src شغل:
cd "D:\KAHVI FENISH\FRONT FIX"
npm run build

للتأكد:
Get-ChildItem ".\src" -Recurse -Include *.ts,*.html,*.js | Select-String "localhost:3000"

المفروض يظهر فقط في:
src\app\config\api.config.ts
