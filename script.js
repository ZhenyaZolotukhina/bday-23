/* Укажи опубликованный URL Google Apps Script ниже. Инструкция — README.md. */
const GOOGLE_SCRIPT_URL = '';

const progress = document.querySelector('.reading-progress');
const updateProgress = () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${total > 0 ? (window.scrollY / total) * 100 : 0}%`;
};
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .09 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const form = document.querySelector('#rsvp-form');
const message = document.querySelector('#form-message');
const submit = form.querySelector('button[type="submit"]');
const overlay = document.querySelector('#celebration');
const close = overlay.querySelector('.celebration-close');

const variants = [
  { emoji: '👑', title: 'Ура, ты с нами!', text: 'Очень рада, что увидимся 5 декабря ♡' },
  { emoji: '🐆', title: 'До встречи!', text: 'Отмечаю тебя в списке гостей. Будет здорово!' },
  { emoji: '🎀', title: 'Как здорово!', text: 'Жду нашей встречи на ужине и квизе ♡' },
  { emoji: '✨', title: 'Ответ принят!', text: 'Спасибо, что откликнулся(-ась). До скорого!' }
];
function celebrate() {
  // Каждый из четырёх вариантов имеет одинаковую вероятность — 1/4.
  const item = variants[Math.floor(Math.random() * variants.length)];
  document.querySelector('#celebration-emoji').textContent = item.emoji;
  document.querySelector('#celebration-title').textContent = item.title;
  document.querySelector('#celebration-text').textContent = item.text;
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  close.focus();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const colors = ['#782039','#efb2bf','#dcb08d','#fff1c8','#3c2525'];
    for (let i = 0; i < 90; i++) {
      const p = document.createElement('span');
      p.className = 'confetti';
      p.style.setProperty('--left', `${Math.random() * 100}vw`);
      p.style.setProperty('--duration', `${2.6 + Math.random() * 3}s`);
      p.style.setProperty('--drift', `${(Math.random() - .5) * 170}px`);
      p.style.setProperty('--rotate', `${Math.random() * 360}deg`);
      p.style.setProperty('--color', colors[Math.floor(Math.random() * colors.length)]);
      overlay.appendChild(p);
      setTimeout(() => p.remove(), 6000);
    }
  }
}
function closeCelebration(){overlay.classList.remove('active');overlay.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll')}
close.addEventListener('click', closeCelebration);
overlay.addEventListener('click', e => { if(e.target === overlay) closeCelebration(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeCelebration(); });

// JSONP работает на статическом GitHub Pages без CORS. Отправка выполняется
// только после настройки GOOGLE_SCRIPT_URL, иначе сайт честно сообщает об этом.
function sendResponse(name, attendance) {
  return new Promise((resolve, reject) => {
    const callbackName = `birthdayCallback_${Date.now()}_${Math.floor(Math.random()*100000)}`;
    const script = document.createElement('script');
    let completed = false;
    const cleanup = () => { delete window[callbackName]; script.remove(); clearTimeout(timer); };
    const fail = () => { if(completed) return; completed = true; cleanup(); reject(new Error('Не удалось отправить ответ. Попробуй ещё раз или напиши Жене.')); };
    const timer = setTimeout(fail, 15000);
    window[callbackName] = data => {
      if(completed) return;
      completed = true;
      cleanup();
      if(data && data.ok) resolve(data);
      else reject(new Error(data?.error || 'Не удалось сохранить ответ.'));
    };
    script.onerror = fail;
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.set('callback', callbackName);
    url.searchParams.set('name', name);
    url.searchParams.set('attendance', attendance);
    script.src = url.href;
    document.head.appendChild(script);
  });
}
form.addEventListener('submit', async e => {
  e.preventDefault();
  if(!form.reportValidity()) return;
  const name = form.elements.name.value.trim();
  const attendance = form.elements.attendance.value;
  if(name.length < 2) { message.textContent = 'Напиши, пожалуйста, имя чуть подробнее ♡'; return; }
  if(!GOOGLE_SCRIPT_URL || !GOOGLE_SCRIPT_URL.startsWith('https://script.google.com/macros/s/')) {
    message.textContent = 'Подтверждение пока не подключено к Google Таблице. Напиши Жене лично ♡';
    return;
  }
  submit.disabled = true;
  message.textContent = 'Записываем твой ответ…';
  try {
    await sendResponse(name, attendance);
    message.textContent = attendance === 'Да, буду!' ? 'Твой ответ записан! Увидимся ♡' : 'Твой ответ записан. Буду скучать ♡';
    if(attendance === 'Да, буду!') celebrate();
    form.reset();
  } catch(err) { message.textContent = err.message; }
  finally { submit.disabled = false; }
});
