addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const params = url.searchParams

  // Get parameters from URL query string
  const binInput = params.get('bin') || ''
  const expInput = params.get('exp') || ''
  const numCards = parseInt(params.get('num')) || 1

  // Generate banner
  let response = printColoredBanner()
  
  // Generate BIN
  const binNumber = validateBIN(binInput)

  // Generate expiration date
  const [mm, yy] = generateExpDate(expInput)

  // Generate cards
  response += '\nGenerated Cards:\n'
  response += '-----------------------------\n'
  
  for (let i = 0; i < numCards; i++) {
    const card = generateCard(binNumber)
    const cvv = generateCVV()
    response += `\x1b[32m${card}|${mm}|${yy}|${cvv}\x1b[0m\n`
  }

  response += '-----------------------------\n'

  return new Response(response, {
    headers: { 'Content-Type': 'text/plain' }
  })
}

function luhnChecksum(cardNumber) {
  let total = 0
  const reversedDigits = cardNumber.split('').reverse()
  
  reversedDigits.forEach((digit, i) => {
    let n = parseInt(digit)
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n = Math.floor(n / 10) + (n % 10)
    }
    total += n
  })
  
  return (10 - (total % 10)) % 10
}

function generateExpDate(input) {
  if (input) {
    const [mm, yy] = input.split('/')
    if (mm && yy && mm.length === 2 && yy.length === 2 && mm >= 1 && mm <= 12) {
      return [mm.padStart(2, '0'), yy]
    }
  }
  
  const mm = `${Math.floor(Math.random() * 12) + 1}`.padStart(2, '0')
  const currentYear = new Date().getFullYear()
  const yy = `${(currentYear + Math.floor(Math.random() * 6)) % 100}`.padStart(2, '0')
  return [mm, yy]
}

function printColoredBanner() {
  const colors = [
    '\x1b[38;2;255;0;0m',   // Red
    '\x1b[38;2;0;255;0m',   // Green
    '\x1b[38;2;0;0;255m',   // Blue
    '\x1b[38;2;255;255;0m', // Yellow
    '\x1b[38;2;255;0;255m', // Magenta
    '\x1b[38;2;0;255;255m', // Cyan
    '\x1b[38;2;255;165;0m', // Orange
  ]
  
  const banner = [
    '  _____   _____   _____  ______  _   _   _____ ',
    ' / ____| / ____| / ____||  ____|| \\ | | / ____|',
    '| |     | |     | |  __ | |__   |  \\| || (___  ',
    '| |     | |     | | |_ ||  __|  | . ` | \\___ \\ ',
    '| |____ | |____ | |__| || |____ | |\\  | ____) |',
    ' \\_____| \\_____| \\_____||______||_| \\_||_____/ ',
    '                     Telegram:- @LEAKHUNTERV2                          '
  ]

  return banner.map(line => {
    const color = colors[Math.floor(Math.random() * colors.length)]
    return `${color}${line}\x1b[0m`
  }).join('\n')
}

function validateBIN(binInput) {
  if (binInput.length === 6 && /^\d+$/.test(binInput)) return binInput
  return Array.from({length: 6}, () => Math.floor(Math.random() * 10)).join('')
}

function generateCard(bin) {
  const middle = Array.from({length: 9}, () => Math.floor(Math.random() * 10)).join('')
  const partial = bin + middle
  const checksum = luhnChecksum(partial)
  return partial + checksum
}

function generateCVV() {
  return `${Math.floor(Math.random() * 1000)}`.padStart(3, '0')
}
