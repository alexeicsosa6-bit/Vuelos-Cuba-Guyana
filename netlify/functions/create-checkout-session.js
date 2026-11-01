exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { origin, destination, departureDate, passengers } = JSON.parse(event.body);
        
        // Precio base por pasaje: $500 USD (expresado en centavos = 50000)
        const unitAmount = 50000; 

        const stripeKey = process.env.STRIPE_SECRET_KEY;

        if (!stripeKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Falta la clave STRIPE_SECRET_KEY en Netlify.' })
            };
        }

        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'payment_method_types[0]': 'card',
                'line_items[0][price_data][currency]': 'usd',
                'line_items[0][price_data][unit_amount]': unitAmount,
                'line_items[0][price_data][product_data][name]': `Vuelo ${origin} a ${destination} (${departureDate})`,
                'line_items[0][quantity]': passengers,
                'mode': 'payment',
                'success_url': `${event.headers.origin || 'https://' + event.headers.host}/?success=true`,
                'cancel_url': `${event.headers.origin || 'https://' + event.headers.host}/?canceled=true`,
            })
        });

        const session = await response.json();
        
        if (session.error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: session.error.message })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
