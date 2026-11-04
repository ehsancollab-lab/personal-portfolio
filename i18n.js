import { faContent } from './content-fa.js';
import { faBooks } from './books-fa.js';

let locale = 'en';
try { locale = localStorage.getItem('ehsan-portfolio-language') === 'fa' ? 'fa' : 'en'; } catch {}
export const getLocale = () => locale;
export function setLocale(value) {
  locale = value === 'fa' ? 'fa' : 'en';
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
  try { localStorage.setItem('ehsan-portfolio-language', locale); } catch {}
}
export const number = value => new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { useGrouping: false }).format(value);
const labels = {
  'Ehsan Masoomi': 'احسان معصومی',
  'Senior AI Product Designer': 'طراح ارشد محصول با تمرکز بر هوش مصنوعی',
  'Selected Work': 'کارهای منتخب', 'Case Studies': 'کیس‌استادی‌ها', 'Experience': 'سوابق کاری', 'About Me': 'دربارهٔ من',
  'Download CV': 'دریافت رزومه', 'Email': 'ایمیل', 'LinkedIn': 'لینکدین', 'X (Twitter)': 'ایکس (توییتر)', 'Instagram': 'اینستاگرام',
  'Display settings': 'تنظیمات نمایش', 'Portfolio sections': 'بخش‌های پورتفولیو', 'Contact information': 'اطلاعات تماس',
  'Page navigation': 'جابه‌جایی بین صفحه‌ها',
  'Contact links': 'راه‌های ارتباطی', 'Choose language': 'انتخاب زبان', 'Switch to dark theme': 'تغییر به حالت تیره',
  'Switch to light theme': 'تغییر به حالت روشن', 'Skip to main content': 'رفتن به محتوای اصلی',
  'A little about me': 'کمی دربارهٔ من', 'My bookshelf': 'قفسهٔ کتاب‌های من', 'MY BOOKSHELF': 'قفسهٔ کتاب‌های من',
  'All collections': 'همهٔ دسته‌ها', 'Three books from this collection': 'سه کتاب منتخب از این دسته',
  'Books in this collection': 'کتاب‌های این دسته', 'About the book': 'دربارهٔ کتاب', 'My takeaway': 'برداشت من',
  'Book information in Persian': 'اطلاعات کتاب در منبع فارسی', 'opens in a new tab': 'در زبانهٔ جدید باز می‌شود',
  'Psychology & relationships': 'روان‌شناسی و روابط', 'Understanding ourselves and each other.': 'برای شناخت خودمان و یکدیگر.',
  'Growth & learning': 'رشد و یادگیری', 'Better questions. A little more perspective.': 'پرسش‌های بهتر و نگاهی بازتر.',
  'Work & business': 'کار و کسب‌وکار', 'Making space for work that matters.': 'جا باز کردن برای کارهای ارزشمند.',
  'Life & meaning': 'زندگی و معنا', 'The things that make a life feel like yours.': 'چیزهایی که به زندگی رنگ شخصی می‌دهند.',
  'Design & creativity': 'طراحی و خلاقیت', 'Learning to see, think and make.': 'یاد گرفتنِ دیدن، فکر کردن و ساختن.',
  'Fiction & literature': 'داستان و ادبیات', 'Other lives, other worlds, familiar feelings.': 'زندگی‌های دیگر، جهان‌های دیگر و احساس‌های آشنا.',
  'Collection not found': 'این دسته پیدا نشد', 'Choose a collection from my bookshelf.': 'یکی از دسته‌های قفسهٔ کتاب‌ها را انتخاب کن.',
  'Book not found': 'این کتاب پیدا نشد', 'You can find the rest of my reading list in the collections.': 'بقیهٔ کتاب‌ها را می‌توانی در دسته‌بندی‌ها ببینی.',
  'No case studies yet.': 'هنوز کیس‌استادی‌ای منتشر نشده است.', 'No experience entries yet.': 'هنوز سابقه‌ای ثبت نشده است.',
  'This case study is unavailable.': 'این کیس‌استادی در دسترس نیست.', 'Back to Home': 'بازگشت به صفحهٔ اصلی',
  'Visit project': 'مشاهدهٔ پروژه', 'Untitled case study': 'کیس‌استادی بدون عنوان', 'Case study video': 'ویدیوی کیس‌استادی',
  'Selected work preview': 'پیش‌نمایش کار منتخب', 'Sample cover': 'جلد نمونه',
  'New case studies will be displayed here soon.': 'کیس‌استادی‌های جدید به‌زودی اینجا قرار می‌گیرند.',
  'Since symmetry is really important to me and visual asymmetry bothers me, I’ve added a sample card here for now.': 'چون تقارن برایم مهم است، فعلاً این کارت نمونه را گذاشته‌ام تا چیدمان متقارن بماند.',
  'A self-taught UI/UX designer, a little about life outside work, and the books Ehsan Masoomi has read.': 'دربارهٔ احسان معصومی، طراح خودآموختهٔ رابط و تجربهٔ کاربری، زندگی بیرون از کار و کتاب‌هایی که خوانده است.'
};
export function localizeText(value) {
  const text = String(value ?? '');
  if (locale === 'en') return text;
  if (labels[text] != null) return labels[text];
  if (faContent[text] != null) return faContent[text];
  const trimmed = text.trim();
  if (faContent[trimmed] != null) return text.replace(trimmed, faContent[trimmed]);
  return text;
}
export function phrase(en, fa, values = {}) {
  return (locale === 'fa' ? fa : en).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}
export function localizeBook(book) {
  return locale === 'fa' ? { ...book, ...faBooks[book.id], title: book.titleFa } : book;
}
export function languageControl() {
  const group = document.createElement('div'); group.className = 'language-switch'; group.setAttribute('role', 'group');
  group.setAttribute('aria-label', localizeText('Choose language')); group.dir = 'ltr';
  for (const lang of ['en', 'fa']) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.language = lang;
    button.textContent = lang.toUpperCase(); button.lang = 'en'; button.setAttribute('aria-label', lang === 'fa' ? 'فارسی' : 'English');
    button.setAttribute('aria-pressed', String(lang === locale)); group.append(button);
  }
  return group;
}
export function syncLanguageControls() {
  document.querySelectorAll('.display-controls, .library-toolbar, .case-detail-toolbar').forEach(host => {
    const theme = host.querySelector('.theme-toggle'); if (!theme) return;
    let parent = host;
    if (!host.classList.contains('display-controls')) {
      parent = host.querySelector('.detail-display-controls');
      if (!parent) { parent = document.createElement('div'); parent.className = 'detail-display-controls'; theme.before(parent); parent.append(theme); }
    }
    parent.querySelector('.language-switch')?.remove(); theme.before(languageControl());
  });
}
