import https from 'https';

https.get('https://vuktnkskajpedqfodssx.supabase.co/rest/v1/?apikey=sb_publishable_yJdyHFT1d3s2PbWTDejwhw_KmZmzRpJ', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    const spec = JSON.parse(data);
    const orderItems = spec.definitions?.order_items || spec.components?.schemas?.order_items;
    console.log(JSON.stringify(orderItems, null, 2));
  });
});
