// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const generateFakeAccount = () => {
  const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia']
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Taylor', 'Miller', 'Wilson', 'Moore', 'Lee']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December']
  
  return {
    email: `${generateRandomString(10)}@gmail.com`,
    password: generateRandomString(12) + '!1a',
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    day: Math.floor(Math.random() * 28) + 1, // 1-28 to avoid month issues
    month: months[Math.floor(Math.random() * 12)],
    year: Math.floor(Math.random() * (2000 - 1980 + 1)) + 1980,
    gender: Math.random() < 0.5 ? 'Male' : 'Female'
  }
}

async function handleRequest(request) {
  if (request.method === 'POST') {
    const update = await request.json()
    const chatId = update.message?.chat.id
    const text = update.message?.text

    if (text === '/start') {
      const response = {
        method: 'sendMessage',
        chat_id: chatId,
        text: 'Welcome! Use /generate to create a new fake Gmail account'
      }
      return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } })
    }

    if (text === '/generate') {
      const account = generateFakeAccount()
      const message = `
✅ New Fake Gmail Account:
📧 Email: ${account.email}
🔑 Password: ${account.password}
👤 Name: ${account.firstName} ${account.lastName}
🎂 Birthday: ${account.day} ${account.month} ${account.year}
🚻 Gender: ${account.gender}
      `.trim()

      const response = {
        method: 'sendMessage',
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }
      return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } })
    }
  }
  return new Response('OK')
}
