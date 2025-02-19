// cloudflare-worker.js

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

function luhnChecksum(cardNumber) {
  let total = 0
  const reversedDigits = cardNumber.split('').reverse()
  for (let i = 0; i < reversedDigits.length; i++) {
    let n = parseInt(reversedDigits[i], 10)
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n = Math.floor(n / 10) + (n % 10)
    }
    total += n
  }
  return ((10 - (total % 10)) % 10).toString()
}

function generateExpDate() {
  const mm = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
  const currentYear = new Date().getFullYear()
  const yy = String((currentYear + Math.floor(Math.random() * 6)) % 100).padStart(2, '0')
  return { mm, yy }
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const params = url.searchParams
  const reset = '\x1b[0m'
  
  // Generate banner
  const colors = [
    '\x1b[38;2;255;0;0m',   // Red
    '\x1b[38;2;0;255;0m',   // Green
    '\x1b[38;2;0;0;255m',   // Blue
    '\x1b[38;2;255;255;0m', // Yellow
    '\x1b[38;2;255;0;255m', // Magenta
    '\x1b[38;2;0;255;255m', // Cyan
    '\x1b[38;2;255;165;0m', // Orange
  ]
  
  let banner = ''
  const bannerLines = [
    "  _____   _____   _____  ______  _   _   _____ ",
    " / ____| / ____| / ____||  ____|| \\ | | / ____|",
    "| |     | |     | |  __ | |__   |  \\| || (___  ",
    "| |     | |     | | |_ ||  __|  | . ` | \\___ \\ ",
    "| |____ | |____ | |__| || |____ | |\\  | ____) |",
    " \\_____| \\_____| \\_____||______||_| \\_||_____/ ",
    "                     Telegram:- @LEAKHUNTERV2                          "
  ]
  
  bannerLines.forEach(line => {
    banner += colors[Math.floor(Math.random() * colors.length)] + line + reset + '\n'
  })

  // Process parameters
  let bin = params.get('bin') || Array.from({length:6}, () => Math.floor(Math.random()*10)).join('')
  if (!/^\d{6}$/.test(bin)) bin = Array.from({length:6}, () => Math.floor(Math.random()*10)).join('')

  let { mm, yy } = generateExpDate()
  if (params.get('mm') && params.get('yy')) {
    const reqMM = params.get('mm').padStart(2, '0')
    const reqYY = params.get('yy').padStart(2, '0')
    if (/^\d{2}$/.test(reqMM) && parseInt(reqMM) >= 1 && parseInt(reqMM) <= 12) {
      mm = reqMM
      yy = reqYY
    }
  }

  const numCards = Math.min(parseInt(params.get('num')) || 1, 100)
  const cards = []
  const green = '\x1b[38;2;0;255;0m'

  for (let i = 0; i < numCards; i++) {
    const middle = Array.from({length:9}, () => Math.floor(Math.random()*10)).join('')
    const partial = bin + middle
    const checksum = luhnChecksum(partial)
    const cvv = Array.from({length:3}, () => Math.floor(Math.random()*10)).join('')
    cards.push(`${green}${partial}${checksum}|${mm}|${yy}|${cvv}${reset}`)
  }

  const responseText = `${banner}
Generated Cards:
-----------------------------
${cards.join('\n')}
-----------------------------
`

  return new Response(responseText, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
