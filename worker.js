addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const { pathname } = new URL(request.url)
  const telegramToken = '7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM'
  const telegramApiUrl = `https://api.telegram.org/bot${telegramToken}`

  if (pathname === '/webhook') {
    const update = await request.json()
    const chatId = update.message?.chat?.id
    const text = update.message?.text

    if (text === '/register_gmail') {
      const responseText = registerGmail()
      await fetch(`${telegramApiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: responseText })
      })
    }

    return new Response('OK', { status: 200 })
  }

  return new Response('Not Found', { status: 404 })
}

function registerGmail() {
  const randomString = () => Math.random().toString(36).substring(2, 8)
  const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

  const email = `${randomString()}@gmail.com`
  const password = randomString()
  const firstName = randomString()
  const surname = randomString()
  const day = randomNumber(1, 28)
  const month = randomNumber(1, 12)
  const year = randomNumber(1980, 2005)
  const gender = ['male', 'female'][randomNumber(0, 1)]

  return `Email: ${email}\nPassword: ${password}\nFirst name: ${firstName}\nSurname: ${surname}\nDay: ${day}\nMonth: ${month}\nYear: ${year}\nGender: ${gender}`
}
