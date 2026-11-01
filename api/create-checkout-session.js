export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { origin, destination, departureDate, passengers } = req.body;
    
    // Precio de ejemplo por pasajero: $500.00 USD (expresado en centavos = 50000)
    const unitAmount = 50000; 

    try {
        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'payment_method_types[0]': 'card',
                'line_items[0][price_data][currency]': 'usd',
                'line_items[0][price_data][unit_amount]': unitAmount,
                'line_items[0][price_data][product_data][name]': `Vuelo ${origin} a ${destination} (${departureDate})`,
                'line_items[0][quantity]': passengers,
                'mode': 'payment',
                'success_url': `${req.headers.origin || 'https://' + req.headers.host}/?success=true`,
                'cancel_url': `${req.headers.origin || 'https://' + req.headers.host}/?canceled=true`,
            })
        });

        const session = await response.json();
        
        if (session.error) {
            return res.status(400).json({ error: session.error.message });
        }

        return res.status(200).json({ url: session.url });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
