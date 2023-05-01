const express = require('express');
const app = express();
const axios = require('axios');
require('dotenv').config();
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})

app.get('/api/indicators', (req, res) => {

    Promise.all([getIndicators(), getWeatherData(), getAirQuality()])
    .then((responses) => {
        const indicatorsData = responses[0];
        const weatherData = responses[1];
        const airQualityData = responses[2];

        const response = Object.assign(indicatorsData, weatherData, airQualityData);

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

const getAirQuality = async () => {
    try {
        const resData = await axios.get(`https://api.waqi.info/feed/@8511/?token=${process.env.TOKEN_AIR}`);

        const dataAirQuality = {};
    
        if (resData.data.data.aqi >= 0 && resData.data.data.aqi <= 50){
            dataAirQuality["quality"] = 'Bueno';
        }
        else if (resData.data.data.aqi >= 51 && resData.data.data.aqi <= 79){
            dataAirQuality["quality"] = 'Regular';
        }
        else if (resData.data.data.aqi >= 80 && resData.data.data.aqi <= 109){
            dataAirQuality["quality"] = 'Alerta';
        }
        else if (resData.data.data.aqi >= 110 && resData.data.data.aqi <= 169){
            dataAirQuality["quality"] = 'Preemergencia';
        }
        else if (resData.data.data.aqi >= 170){
            dataAirQuality["quality"] = 'Emergencia';
        }
    
        const dateServer = new Date(Date.now());
        const dateServerString = dateServer.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
    
        const dateFechaServer = dateServerString.split('-');
    
        const year = Number(dateFechaServer[2]);
        const month = Number(dateFechaServer[1]) - 1;
        let day = Number(dateFechaServer[0]);
        day = day < 10 ? `0${day}` : day;
    
        const newDate = new Date(year, month, day);
        
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    
        dataAirQuality['month'] = months[month];
        dataAirQuality['day'] = day.toString();
        dataAirQuality['dayWeek'] = days[newDate.getDay()];
    
        return dataAirQuality;
    }
    catch (err){
        throw new Error (`Error api air quality: ${err}`);
    }
   
}
