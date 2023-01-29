const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');
require('dotenv').config();

app.listen(port, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
})

app.get('/api/indicators', (req, res) => {

    Promise.all([getIndicators(), getWeatherData()])
    .then((responses) => {
        const indicatorsData = responses[0];
        const weatherData = responses[1];

        const response = Object.assign(indicatorsData, weatherData);

        res.status(200).json(response);
    })
    .catch((err) => {
        console.error('error', err);
        res.status(400).json({
            status: "failed",
        });
    });
});

const getIndicators = async () => {

    try {
        const resData = await axios.get('https://mindicador.cl/api');

        const data = resData.data;
        let fecha = data.fecha.split('T')[0];
        const arrayFecha = fecha.split('-');
        fecha = `${arrayFecha[2]}-${arrayFecha[1]}-${arrayFecha[0]}`;
    
        const {dolar, uf, utm} = data;
    
        const response = {
            fecha,
            cod_dolar: dolar.codigo.toUpperCase(),
            valor_dolar: dolar.valor.toString(),
            cod_uf: uf.codigo.toUpperCase(),
            valor_uf: uf.valor.toString(),
            cod_utm: utm.codigo.toUpperCase(),
            valor_utm: utm.valor.toString()
        }
    
        return response;
    }
    catch (err){
        throw new Error(`Error api indicadores: ${err}`);
    }
}

const getWeatherData = async () => {
    try {
        const lat = -37.4707;
        const lng = -72.3517;
    
        const resData = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.API_WEATHER_KEY}&units=metric`);
        const response = {
            currentTemp: Math.ceil(resData.data.main.temp).toString(),
            city: resData.data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, '')
        }

        return response;
    }
    catch (err) {
        throw new Error (`Error api weather: ${err}`);
    }
}
