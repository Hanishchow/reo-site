// Reo site: scroll reveals, count-up stats, the animated phone conversation, and the message-path demo. No dependencies.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

// pointer spotlight on the dot grid
if (!reduce) {
  addEventListener('pointermove', (e) => {
    const g = $('.grid-bg')
    g.style.setProperty('--mx', e.clientX + 'px')
    g.style.setProperty('--my', e.clientY + 'px')
  }, { passive: true })
}

// marquee
const words = ['TEXT', 'VOICE NOTES', 'FILES', 'CALLS', 'GROUPS', 'DIRECTORY', 'MAIL', 'SOS', 'LAN DIRECT', 'END TO END']
const group = (hidden) => `<div class="marq-g"${hidden ? ' aria-hidden="true"' : ''}>${words.map((w) => `<span>${w}</span>`).join('')}</div>`
$('#marq').innerHTML = group(false) + group(true)

// scroll reveal, org chart, count-up
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue
    e.target.classList.add('in')
    $$('[data-n]', e.target).forEach(count)
    if (e.target.matches('[data-n]')) count(e.target)
    io.unobserve(e.target)
  }
}, { threshold: 0.2 })
$$('.rv, #org').forEach((el) => io.observe(el))

function count(el) {
  if (el.dataset.done) return
  el.dataset.done = '1'
  const to = Number(el.dataset.n), suf = el.dataset.s ?? ''
  if (reduce || to === 0) { el.textContent = to + suf; return }
  const t0 = performance.now(), dur = 1100
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur)
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suf
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// phone conversation: messages arrive, ticks go single then double red, a voice note, an SOS
const chat = $('#chat')
const bars = Array.from({ length: 16 }, (_, i) => `<i style="animation-delay:${(i * 70) % 900}ms"></i>`).join('')
const script = [
  { t: 'are you on the college wifi?' },
  { me: true, t: 'yes, direct connection works' },
  { voice: true },
  { me: true, t: 'sending the figures now' },
  { file: 'p53_figures.pse  18.4 MB' },
  { sos: true, t: '● URGENT  Lab door is open. Please check.' },
]
function bubble(s) {
  const d = document.createElement('div')
  d.className = 'm' + (s.me ? ' me' : '') + (s.voice ? ' voice' : '') + (s.sos ? ' sos' : '')
  if (s.voice) d.innerHTML = `<span class="wave">${bars}</span><span class="mono" style="color:inherit">0:07</span>`
  else if (s.file) d.innerHTML = `<b style="font-weight:500">${s.file}</b><div class="meta"><span>LAN</span></div>`
  else d.innerHTML = s.t + (s.me ? `<div class="meta"><span>LAN</span><span class="chk" data-c>✓</span></div>` : '')
  return d
}
let i = 0
function next() {
  if (i >= script.length) {
    if (reduce) return
    setTimeout(() => { chat.innerHTML = ''; i = 0; next() }, 4200)
    return
  }
  const el = bubble(script[i++])
  chat.append(el)
  while (chat.scrollHeight > chat.clientHeight + 4 && chat.children.length > 2) chat.firstChild.remove()
  const c = $('[data-c]', el)
  if (c) setTimeout(() => (c.textContent = '✓✓'), 900)
  setTimeout(next, reduce ? 0 : 1500)
}
next()

// message path demo
const modes = {
  lan: { cap: 'You and your colleague are on the same network, so the message goes straight from device to device. It never leaves the building and arrives in milliseconds.', note: '' },
  net: { cap: 'On different networks Reo falls back to the relay. The relay only ever holds a sealed envelope. If your friend is offline it keeps the message until they come back.', note: '' },
  down: { cap: 'The cable is unplugged. Devices that are already connected keep chatting directly, and with a relay running on your own server everyone else can still reach each other.', note: 'The on-site relay works today but is not packaged as a one-click installer yet.' },
}
const lan = $('#p-lan'), cloud = $('#p-cloud'), pkt = $('#pkt'), lanPath = $('#l-lan'), cloudPath = $('#l-cloud'), relayT = $('#relay-t')
let mode = 'lan', raf = 0
function setMode(m) {
  mode = m
  $$('.tabs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)))
  $('#cap').textContent = modes[m].cap
  $('#note').textContent = modes[m].note
  const useLan = m !== 'net', useCloud = m === 'net'
  lanPath.classList.toggle('on', useLan); lanPath.classList.toggle('off', !useLan)
  cloudPath.classList.toggle('on', useCloud); cloudPath.classList.toggle('off', !useCloud)
  cloud.style.opacity = useCloud ? 1 : m === 'down' ? 0.35 : 0.3
  relayT.textContent = m === 'down' ? 'INTERNET: OFF' : 'RELAY'
}
function fly(t) {
  const path = mode === 'net' ? cloudPath : lanPath
  const len = path.getTotalLength()
  const k = ((t % 2200) / 2200)
  const p = path.getPointAtLength(k * len)
  pkt.setAttribute('cx', p.x); pkt.setAttribute('cy', p.y)
  raf = requestAnimationFrame(fly)
}
$$('.tabs button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)))
setMode('lan')
if (!reduce) raf = requestAnimationFrame(fly); else pkt.setAttribute('cx', 360)

// copy buttons
$$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#' + b.dataset.copy).textContent); b.textContent = 'COPIED'; setTimeout(() => (b.textContent = 'COPY'), 1400) } catch { /* select instead */ }
}))
